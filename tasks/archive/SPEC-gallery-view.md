# Spec: `gallery-view` — Read-Only Candidate Gallery

Module id: `gallery-view` (see `capability-map.md`). Depends on: `render-capture`
(done — Checkpoint C). Fourth build slice per the capability map's build order, after
`component-kit`, `render-capture`, and `system-lint`.

## Objective

Add a read-only dashboard view that renders every captured candidate for a run as a
visual gallery — screenshot, candidate id, capture metadata, pass/fail status — instead
of a human having to open `manifest.json`/`screenshot.png` files by hand. This is the
UI half of "real screens, not static designs": `render-capture` already produces the
artifact, `gallery-view` is what lets a human actually look at it from the dashboard.

No pause/blocking behavior belongs in this module — a pipeline with a `gallery_gate`
node runs exactly as it does today; this only adds a way to *see* candidates that have
already been captured. Turning this view into an actual blocking human gate is
`gallery-gate`'s job (next module, depends on this one).

Who uses it:
- **A human reviewing a run** — the primary and only consumer this slice serves. Opens
  `/runs/{id}`, sees a "Candidates" section alongside the existing event stream, graph,
  and metadata sections, showing every `render_capture` artifact written so far for that
  run.
- **`gallery-gate`** (next module), which will reuse this view's rendering/scanning code
  as the "show all candidates" half of its pause-and-choose UI.

Success looks like: run a pipeline containing one or more `tool="render_capture"`
nodes through `smasher run` or the web dashboard, open `/runs/{id}` in a browser, and
see each candidate's screenshot displayed as a card — including a candidate whose
capture failed, shown as a failure card rather than a broken image.

## Assumptions

Four decisions anchor this spec; everything else fills in underneath them.

1. **This lives inside `smasher-web`, not a new crate.** Unlike `render-capture` and
   `system-lint` — which are pipeline tools the engine dispatches via `ToolBackend` —
   `gallery-view` adds no new tool node, no new DOT node type, and nothing the
   `smasher-attractor` engine needs to know about. It is purely a new route + template +
   a small filesystem-scanning helper inside the existing dashboard crate.
2. **Candidate discovery reads the same provisional path `render-capture` already
   writes to: `./runs/<run_id>/artifacts/<candidate_id>/`, relative to the
   `smasher-web` process's working directory** — *not* `AppState.data_dir`'s
   `RunDirectory` tree (`{data_dir}/artifacts/{run_id}/artifacts/{node_id}/...`), which
   is what the rest of the dashboard (checkpoints, events, node logs) actually uses.
   These are two different, currently-unreconciled directory trees that happen to agree
   on using the pipeline's `run_id` as a folder name. `gallery-view` does not fix this —
   `manifest::artifact_dir()` in `smasher-render-capture` is unchanged — it only reads
   what's already provisional per that module's own Open Questions. Reconciling the two
   trees into one real layout is explicitly `artifact-store`'s job, which the capability
   map places *after* this module and `gallery-gate`.
   → **This is the one assumption most worth correcting now** if it's wrong — everything
   else in this spec follows from treating the current write path as the read contract.
3. **Discovery is a directory scan, not new state.** A candidate for run `{id}` is any
   immediate subdirectory of `./runs/{id}/artifacts/` containing a `manifest.json` that
   deserializes as `smasher_render_capture::manifest::Manifest`. No new tracking table
   in `AppState`/`RunRecord` — the filesystem is the source of truth, scanned fresh on
   each request (matching how `run_graph`/`run_questions` already derive their view from
   existing state rather than caching it).
4. **Screenshots are served via a new `ServeDir` mount, not read-and-inline-base64'd.**
   `server.rs` already mounts `/static` from the crate's own `static/` dir via
   `tower_http::services::ServeDir`; this adds a second mount, `/candidate-artifacts`,
   pointed at `./runs` (same cwd-relative root as #2), so a card's `<img>` can point at
   `/candidate-artifacts/{run_id}/artifacts/{candidate_id}/screenshot.png` directly.
   `run_id`/`candidate_id` path segments are validated against
   `smasher_attractor::run_dir::sanitize_graph_name`-style rules (no `/`, `\`, or `..`)
   before being interpolated into any path, matching this repo's existing traversal
   hardening for run-scoped identifiers.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, existing `smasher-web` crate — no new workspace member.
- `askama` (already a dependency) for the new gallery partial template.
- `tower_http::services::ServeDir` (already a dependency) for the new artifact mount.
- Reads `smasher_render_capture::manifest::Manifest` (already public) directly — no new
  serialization format.

## Commands

```bash
# Build and test this crate in isolation
cargo check -p smasher-web
cargo test -p smasher-web
cargo clippy -p smasher-web

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# Manual verification
smasher serve
# in another terminal: run a fixture pipeline with a render_capture node, then
# open http://127.0.0.1:21541/runs/{id} and confirm the Candidates section renders
```

## Project Structure

```
crates/smasher-web/src/
  candidates.rs            # new: scan_candidates(run_id) -> Vec<CandidateSummary>,
                            #      path validation for run_id/candidate_id segments
  routes/pages.rs           # touched: new GET /runs/{id}/candidates handler +
                             #          CandidateGalleryTemplate struct
  server.rs                  # touched: add /candidate-artifacts ServeDir mount

crates/smasher-web/templates/
  candidate_gallery.html      # new: grid partial, one card per CandidateSummary
  run_detail.html               # touched: add "Candidates" section, htmx-polled like
                                 # the existing graph/questions sections

crates/smasher-web/static/
  style.css                     # touched: .candidate-grid, .candidate-card,
                                 # .candidate-card-failed styles

docs/design-factory/
  SPEC-gallery-view.md            # this file
  capability-map.md                # touched: gallery-view status Done when complete
```

## Code Style

Matching this crate's established patterns — filesystem helper returns a plain `Vec`
consumed directly by an askama template struct, no intermediate JSON layer (contrast
with `routes/api.rs` endpoints, which do serialize to JSON for the SSE/API surface):

```rust
// ABOUTME: Scans a run's artifact directory for render-capture candidates.
// ABOUTME: Read-only discovery — no new AppState tracking, filesystem is the source of truth.

use smasher_render_capture::manifest::Manifest;

pub struct CandidateSummary {
    pub candidate_id: String,
    pub screenshot_url: String,
    pub manifest: Manifest,
}

pub fn scan_candidates(run_id: &str) -> Vec<CandidateSummary> {
    let dir = std::path::Path::new("runs").join(run_id).join("artifacts");
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return Vec::new();
    };
    entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let candidate_id = entry.file_name().to_str()?.to_string();
            let manifest_path = entry.path().join("manifest.json");
            let manifest: Manifest =
                serde_json::from_str(&std::fs::read_to_string(manifest_path).ok()?).ok()?;
            Some(CandidateSummary {
                screenshot_url: format!(
                    "/candidate-artifacts/{run_id}/artifacts/{candidate_id}/screenshot.png"
                ),
                candidate_id,
                manifest,
            })
        })
        .collect()
}
```

```html
{# candidate_gallery.html — one card per candidate, failure state included #}
<div class="candidate-grid">
  {% for c in candidates %}
  <div class="candidate-card{% if c.failed %} candidate-card-failed{% endif %}">
    {% if c.failed %}
      <div class="candidate-failure">Capture failed: {{ c.failure_reason }}</div>
    {% else %}
      <img src="{{ c.screenshot_url }}" alt="Candidate {{ c.candidate_id }}">
    {% endif %}
    <div class="candidate-meta">
      <span class="candidate-id">{{ c.candidate_id }}</span>
      <span class="candidate-captured-at">{{ c.captured_at }}</span>
    </div>
  </div>
  {% endfor %}
</div>
```

## Testing Strategy

Per this repo's testing standard: real filesystem fixtures, no mocking of the thing
under test.

- **Unit** (`candidates.rs`): `scan_candidates` against a temp directory fixture —
  returns empty `Vec` for a run with no artifacts dir; returns one `CandidateSummary`
  per valid `manifest.json`; skips a subdirectory with a malformed/missing manifest
  rather than erroring the whole scan; rejects `run_id`/`candidate_id` values containing
  `..`, `/`, or `\` before they reach a path join.
- **Integration** (`routes/pages.rs`, existing `#[cfg(test)] mod tests` pattern): a
  request to `/runs/{id}/candidates` for a run with real fixture artifacts on disk
  (reusing `smasher-render-capture`'s `fixtures/candidate/` output, captured once in a
  test setup step) returns 200 with HTML containing each candidate's id; a run with no
  artifacts yet returns 200 with an empty-state message, not an error.
- **Manual**: this session runs a fixture pipeline with a real `render_capture` node,
  opens `/runs/{id}` in the Browser tool, and confirms the screenshot actually renders
  (not a broken image icon) before the module is called done — the same "open the file
  and look at it" bar `render-capture`'s own spec set for the screenshot itself.
- **Regression**: `cargo test --workspace` and `cargo clippy --workspace` stay clean;
  existing `run_detail`/`dashboard` route tests are unaffected by the new section.

## Boundaries

- **Always do:** run `cargo test -p smasher-web` and `cargo clippy --workspace` before
  considering a task done; validate `run_id`/`candidate_id` path segments before any
  filesystem or URL interpolation; keep this read-only — no selection state, no POST
  handler, no pipeline pause.
- **Ask first:** changing `manifest::artifact_dir()` or any other part of
  `smasher-render-capture` (that path is `render-capture`'s contract, not this module's
  to alter — see Assumption 2); adding a new dependency; changing the existing
  `/static` `ServeDir` mount instead of adding a second one.
- **Never do:** implement any blocking/gate behavior (that's `gallery-gate`); add
  candidate selection, ranking, or persistence; touch `design-kit/` component markup;
  reconcile the two artifact-directory trees described in Assumption 2 — that's
  `artifact-store`'s scope, not this module's.

## Success Criteria

- `cargo test -p smasher-web` passes with zero warnings; `cargo clippy --workspace`
  stays clean.
- A pipeline run containing a `tool="render_capture"` node, viewed at `/runs/{id}`,
  shows a "Candidates" section with the captured screenshot displayed inline.
- A candidate whose `Manifest.exit_status` is `Failed { reason }` renders as a distinct
  failure card showing the reason, not a broken `<img>`.
- A run with zero candidates yet (still running, or no `render_capture` nodes) renders
  the section with an empty state, not an error or a 404.
- No regression to any existing dashboard route or template.

## Open Questions

- ~~Whether the "Candidates" section polls on an interval or loads once.~~
  **Resolved: polling.** `run_detail.html`'s candidates section uses
  `hx-trigger="load, every 5s"`. Confirmed 2026-09-17.
- Click-to-expand / full-size view is not in this slice's success criteria — the card
  shows a fixed-size thumbnail only. Still genuinely unimplemented as of 2026-09-17
  (checked `_candidate_card.html` — no lightbox/expand interaction exists even after
  `live-preview` upgraded the card to a live `<iframe>`) — see `DEFERRED.md`.
- ~~The real fix for Assumption 2's two-directory-tree split is explicitly out of
  scope here and left to `artifact-store`.~~ **Resolved** — `artifact-store` shipped
  and addressed it. Confirmed 2026-09-17.
