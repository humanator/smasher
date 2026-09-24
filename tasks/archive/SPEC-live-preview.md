# Spec: `live-preview` — Embedded Live Candidate View + Traceability

Module id: `live-preview` (see `capability-map.md`). Depends on: `artifact-store`
(done), `gallery-view` (done), `gallery-gate` (in progress on unrelated
decisions — see `SPEC-gallery-gate.md`). Ninth build slice, appended after
`artifact-store`.

## Objective

Two of the five 2026-09-13 decisions turned out to belong here rather than in
`gallery-gate`, because both reopen the candidate-card templates `gallery-view`
and `gallery-gate` each already shipped, and one of them also reopens
`render-capture`'s manifest schema:

1. **Candidate cards show the live bundle, not a static screenshot, as the
   primary view.** `artifact-store` already persists a standalone-servable
   `bundle/` per candidate and already serves it at
   `/candidate-artifacts/{run_id}/artifacts/{candidate_id}/bundle/index.html`
   (live-verified, per `SPEC-artifact-store.md`'s Success Criteria) — but both
   `candidate_gallery.html` (`gallery-view`) and `gallery_gate.html`
   (`gallery-gate`) still hardcode `<img src="{{ screenshot_url }}">`. This
   module swaps the primary view to an `<iframe>` of the bundle, screenshot as
   fallback when no bundle exists.
2. **Prompt/generation-parameter traceability surfaces on the same card**,
   collapsed behind a hover/expand affordance rather than shown directly (per
   `Vision.md`: "to keep cards visually clean"), answering "why does candidate
   3 behave this way." No manifest field carries this today — it's new.

This is the UI half of the "real screens, not static designs" bias `Vision.md`
argues for: a human should be able to click through a candidate, not just look
at a picture of it, and should be able to see what produced it without leaving
the card.

Who uses it:
- **A human reviewing a run or deciding at a gate** — the primary consumer,
  same audience `gallery-view`/`gallery-gate` already serve. Sees a live,
  clickable candidate by default and can expand to see the prompt/params that
  produced it.
- **Whoever authors a pipeline's `render_capture` nodes**, who now has an
  optional `generation_params` arg to populate for traceability — opt-in, not
  required.

Success looks like: run a pipeline with `render_capture` nodes (which persist a
`bundle/` per `artifact-store`) into a `gallery_gate`, open `/runs/{id}`, and
see each live candidate rendered as a clickable embedded view rather than a
static image — plus, for any candidate whose `render_capture` node passed
`generation_params`, an expandable panel on the card showing them. A candidate
with no persisted bundle (old manifest) still renders correctly via the
screenshot fallback, and a candidate with no `generation_params` shows no
traceability affordance at all.

## Assumptions

Nothing here was pre-confirmed with the user the way `SPEC-gallery-gate.md`'s
original five assumptions were — this module is new ground. Everything below
is a proposal grounded in reading the current `smasher-web`/`smasher-render-capture`
code, not a guess; correct any of it before implementation starts.

1. **Primary view is the live bundle when one exists; screenshot is the
   fallback, not a secondary "view live" link.** `CandidateSummary.bundle_url:
   Option<String>` already exists and is already populated by
   `scan_candidates` from the manifest's `LiveBundle` artifact (confirmed by
   reading `crates/smasher-web/src/candidates.rs`) — this module needs no new
   Rust to get the data, only a template change: `{% if let Some(bundle) =
   candidate.bundle_url %}<iframe src="{{ bundle }}">{% else %}<img
   src="{{ candidate.screenshot_url }}">{% endif %}`. This resolves the open
   question `SPEC-artifact-store.md` explicitly left to these modules'
   "own follow-up."
2. **The click-to-expand anchor (`gallery_gate.html`'s existing `<a
   href="{{ screenshot_url }}" target="_blank">`) points at the same primary
   URL as the card** — the live bundle when present, the screenshot otherwise
   — so "open full size" and "what's embedded" never disagree.
3. **A new shared macro in `_candidate_card.html`** (alongside the existing
   `failed_card` macro) replaces the duplicated inline "success card" markup
   in both `candidate_gallery.html` and `gallery_gate.html`. Both templates
   already `{% import "_candidate_card.html" as candidate_card %}` for the
   failure case; this extends that import to cover the live/screenshot case
   too, so the iframe-vs-screenshot logic and the traceability panel are
   written once. `gallery_gate.html`'s call site still wraps the macro's
   output in its own `<label>`/checkbox and appends the lint/critic/synthesis
   scorecard block after it — that block is `SPEC-gallery-gate.md`'s
   assumption 7 and is untouched by this module.
4. **Traceability data is an explicit, opt-in `render_capture` tool arg, not
   automatic engine wiring.** `render_capture`'s tool args today are just
   `{"candidate_dir", "candidate_id"}` (per `SPEC-render-capture.md` assumption
   7 — `run_id` was dropped from the args in Task 9's artifact-tree
   unification). There is no existing mechanism connecting an upstream
   `Codergen` node's `prompt` attribute to a downstream `render_capture` node's
   manifest — building one (e.g. automatic context lookup by node id) would be
   new engine machinery, not a template change, and is out of scope. Instead:
   `render_capture` accepts an optional `generation_params` arg — a flat
   string-to-string object, e.g. `{"prompt": "...", "persona": "...", "task":
   "..."}` — that the pipeline author fills in by hand when authoring the
   node, the same explicit-args convention `candidate_count`/`candidates=N`
   already establishes. Omitted entirely when a pipeline author doesn't want
   the traceability cost.
5. **`Manifest` gains `generation_params: BTreeMap<String, String>`**,
   `#[serde(default)]` for backward compatibility — the same pattern
   `artifact-store` used for its own `artifacts: Vec<ArtifactRef>` addition. An
   old manifest with no `generation_params` key still deserializes, defaulting
   to an empty map. `BTreeMap` (not `HashMap`) so key order is stable across
   renders and test assertions, matching this workspace's existing preference
   for deterministic iteration order in user-facing output.
6. **`CandidateSummary` gains an additive `generation_params` field**, read
   straight from the manifest the same way `bundle_url` already is — no new
   scan logic, just one more field populated in the existing `scan_candidates`
   loop.
7. **Traceability renders as a `<details>`/`<summary>` disclosure** on the
   card — collapsed by default, expanding to a `key: value` list — reusing the
   same pattern `SPEC-gallery-gate.md` assumption 7 introduces for the lint
   badge rather than inventing a second expand mechanism. Renders nothing (no
   empty disclosure triangle) when `generation_params` is empty.
8. **No new crate, no new Cargo dependency.** Two existing crates touched:
   `smasher-render-capture` (manifest field + threading the tool arg into
   `capture()`) and `smasher-web` (template macro + additive
   `CandidateSummary` field) — the same two-crate footprint `artifact-store`
   had.
9. **`<iframe>` sandboxing is an open security question, not decided here** —
   see Open Questions. A bundle is agent-authored, unreviewed markup (per
   `SPEC-render-capture.md` assumption 6, "framework-free markup any agent can
   compose freely") now running live inside the operator's own dashboard page;
   this assumption only commits to embedding it, not to what containment (if
   any) wraps it.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, two existing crates: `smasher-render-capture` (manifest schema +
  `capture()` threading) and `smasher-web` (`candidates.rs` additive read +
  `_candidate_card.html` macro + both call-site templates + CSS).
- `askama` (already a dependency) for the new/extended card macro.
- `serde`/`serde_json` (already dependencies) for the `generation_params` map.
- No new external dependencies.

## Commands

```bash
# Build and test the touched crates in isolation
cargo check -p smasher-render-capture -p smasher-web
cargo test -p smasher-render-capture -p smasher-web
cargo clippy -p smasher-render-capture -p smasher-web

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# Manual verification
smasher serve
# run a fixture pipeline with render_capture nodes (some with generation_params,
# some without) into a gallery-view and a gallery-gate; open /runs/{id} in the
# Browser tool; confirm live embeds render, click-through works, the
# traceability panel appears only where generation_params was set, and a
# candidate from an old-format manifest still renders via the screenshot
# fallback.
```

## Project Structure

```
crates/smasher-render-capture/src/
  manifest.rs   # + Manifest.generation_params: BTreeMap<String, String>,
                #   #[serde(default)]
  capture.rs    # + thread the new generation_params tool arg into the
                #   Manifest written alongside screenshot.png/bundle/
  backend.rs    # touched: HybridToolBackend reads the optional
                #   generation_params arg, passes it through to capture()

crates/smasher-web/src/
  candidates.rs # CandidateSummary gains generation_params: BTreeMap<String, String>,
                #   read the same way bundle_url already is

crates/smasher-web/templates/
  _candidate_card.html   # + new macro (e.g. `live_card`) covering the
                         #   iframe/screenshot toggle + traceability <details>;
                         #   existing failed_card macro unchanged
  candidate_gallery.html # touched: success-card branch now calls the new
                         #   macro instead of its own inline <img> block
  gallery_gate.html      # touched: same swap, inside the existing
                         #   checkbox <label>; lint/critic/synthesis
                         #   scorecard block after it is untouched

crates/smasher-web/static/
  style.css     # + .candidate-embed (iframe sizing within .candidate-card),
                # + .candidate-params (details/summary styling, reusing the
                #   .lint-badge pattern SPEC-gallery-gate.md's amendment adds)

design-factory/
  SPEC-live-preview.md   # this file
  capability-map.md      # touched: live-preview status Done when complete
```

## Code Style

Matching `artifact-store`'s precedent for the manifest addition (flat,
`#[serde(default)]`, no migration needed) and this workspace's existing
askama-macro pattern (`_candidate_card.html`'s `failed_card`):

```rust
// crates/smasher-render-capture/src/manifest.rs
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Manifest {
    pub captured_at: DateTime<Utc>,
    pub viewport: Viewport,
    pub candidate_dir: PathBuf,
    pub exit_status: ExitStatus,
    #[serde(default)]
    pub artifacts: Vec<ArtifactRef>,
    #[serde(default)]
    pub generation_params: BTreeMap<String, String>,
}
```

```html
{# _candidate_card.html — added alongside the existing failed_card macro #}
{% macro live_card(c) %}
<div class="candidate-embed">
  {% if let Some(bundle) = c.bundle_url %}
  <iframe src="{{ bundle }}" class="candidate-thumbnail" title="Candidate {{ c.candidate_id }}"></iframe>
  {% else %}
  <img src="{{ c.screenshot_url }}" alt="Candidate {{ c.candidate_id }}" class="candidate-thumbnail">
  {% endif %}
</div>
{% if !c.generation_params.is_empty() %}
<details class="candidate-params">
  <summary>params</summary>
  {% for (key, value) in c.generation_params %}
  <div class="candidate-param"><span class="candidate-param-key">{{ key }}</span>: {{ value }}</div>
  {% endfor %}
</details>
{% endif %}
{% endmacro %}
```

```html
{# candidate_gallery.html — success branch, after the macro exists #}
{% call candidate_card::live_card(candidate) %}
<div class="candidate-id">{{ candidate.candidate_id }}</div>
<div class="candidate-captured-at">{{ candidate.manifest.captured_at }}</div>
```

## Testing Strategy

Per this repo's testing standard: real filesystem fixtures, no mocking of the
thing under test.

- **Unit (`smasher-render-capture`, `manifest.rs`):** `Manifest` serde
  roundtrip including `generation_params`; a fixture `manifest.json` with
  neither `artifacts` nor `generation_params` keys still deserializes, both
  defaulting to empty (extends `artifact-store`'s existing backward-compat
  test rather than duplicating it).
- **Unit (`smasher-render-capture`, `capture.rs`/`backend.rs`):** `capture()`
  given a `generation_params` map writes it into `manifest.json` unchanged;
  omitted arg writes an empty map, not an error.
- **Unit (`smasher-web`, `candidates.rs`):** `scan_candidates` populates
  `CandidateSummary.generation_params` from a fixture manifest that has them;
  empty map when the manifest doesn't.
- **Template rendering:** extend or add askama render tests asserting (a) a
  candidate with a `bundle_url` renders an `<iframe>` and no `<img>`; (b) one
  without renders `<img>` and no `<iframe>`; (c) a candidate with
  `generation_params` renders a `<details class="candidate-params">` block
  containing every key/value pair; (d) one without renders no such block at
  all (not an empty one) — for both `candidate_gallery.html` and
  `gallery_gate.html`.
- **Manual (this session, via the Browser tool):** run a fixture pipeline with
  at least one `render_capture` node passing `generation_params` and one not,
  into both a `gallery-view` run and a paused `gallery-gate` run; confirm live
  embeds actually render and are clickable (not blank iframes), the
  traceability panel expands to show the right params only where set, and a
  candidate from an old-format fixture manifest (no `artifacts`/
  `generation_params` keys at all) still renders correctly via the screenshot
  fallback — screenshot each state before calling this module done.
- **Regression:** `cargo test --workspace` and `cargo clippy --workspace` stay
  clean; existing `gallery-view`/`gallery-gate`/`artifact-store` tests
  (especially `scan_candidates_bundle_url_none_without_live_bundle_artifact`
  and the failed-candidate rendering tests) are unaffected.

## Boundaries

- **Always do:** run
  `cargo test -p smasher-render-capture -p smasher-web` and
  `cargo clippy --workspace` before considering a task done; keep the
  screenshot fallback working for every existing on-disk manifest (no
  `LiveBundle` artifact, no `generation_params` key); render no traceability
  affordance at all when `generation_params` is empty, rather than an empty
  expandable panel.
- **Ask first:** whether to sandbox the embedded `<iframe>` (and with what
  `sandbox`/`allow` attribute value) given bundle markup is agent-authored and
  unreviewed before display — see Open Questions, this is a real security
  decision, not a styling one; adding any dependency (none should be needed);
  changing `scan_candidates`' path derivation or `manifest::artifact_dir()`
  (owned by earlier modules, unchanged here); changing the lint/critic/
  synthesis scorecard block in `gallery_gate.html` (`SPEC-gallery-gate.md`'s
  scope, not this module's).
- **Never do:** make the live embed the *only* view with no fallback (breaks
  every existing screenshot-only manifest); invent automatic prompt-to-manifest
  wiring through the engine (assumption 4 is deliberately an explicit,
  opt-in tool arg, not new context-passing machinery); persist or transform
  `generation_params` beyond storing what the pipeline author passed in.

## Success Criteria

- `cargo test -p smasher-render-capture -p smasher-web` passes with zero
  warnings; `cargo clippy --workspace` stays clean.
- A candidate with a persisted `bundle/` renders as a clickable embedded live
  view (not a static image) in both the `gallery-view` "Candidates" section
  and a paused `gallery-gate` card — confirmed live in a browser, not just by
  template inspection.
- A candidate with no `bundle/` artifact (old-format manifest) still renders
  via the screenshot, in both templates, with no error.
- A candidate whose `render_capture` node passed `generation_params` shows an
  expandable panel with exactly those key/value pairs; a candidate that didn't
  shows no such panel.
- `cargo test --workspace` and `cargo clippy --workspace` stay clean — no
  regression to `gallery-view`, `gallery-gate`, or `artifact-store` tests.

## Open Questions

- ~~**`<iframe>` sandboxing.** Bundle markup is agent-authored and unreviewed
  before it's embedded live in the operator's own dashboard page — whether
  this needs a `sandbox` attribute (and what it should allow: scripts, forms,
  same-origin) is a real security decision this spec deliberately leaves open
  rather than guessing at.~~ **Resolved** — `_candidate_card.html`'s `<iframe>`
  carries `sandbox="allow-scripts"` (no `allow-same-origin`, no forms). Confirmed
  2026-09-17.
- ~~**Fixed embed size/aspect ratio** for the `<iframe>` within the existing
  grid card — a UX call, not decided here.~~ **Resolved** — `.candidate-thumbnail`
  in `style.css` sets `width: 100%; height: 667px; object-fit: cover`, shared by
  both the `<iframe>` and the `<img>` fallback. Confirmed 2026-09-17.
- ~~**Whether `gallery-view` and `gallery-gate` should use different default
  embed sizes** given their different contexts.~~ **Resolved: no** — both
  templates use the same `.candidate-thumbnail` class/size. Confirmed 2026-09-17.
- **`generation_params` shape beyond free-text key/value pairs** — e.g.
  whether it should eventually mirror `task_critic`'s own `persona`/`task`
  argument shape for consistency — left to whoever authors the first pipeline
  that populates it in earnest.
