# Implementation Plan: `gallery-view` (Semi-Dark Design Factory)

## Overview

`gallery-view` is the fourth module in the Semi-Dark Design Factory capability map
(`docs/design-factory/capability-map.md`), depending on `render-capture` (done —
Checkpoint C) and coming after `system-lint` (also done) in the build order. Its spec is
`docs/design-factory/SPEC-gallery-view.md`. It adds a read-only "Candidates" section to
the run detail dashboard page, rendering every `render_capture` artifact for a run as a
screenshot card — no pause/blocking behavior, that's `gallery-gate`'s job next.

This plan breaks `SPEC-gallery-view.md` into 7 small, vertically-sliced, independently
verifiable tasks across 5 phases. Scope is `gallery-view` only.

## Architecture Decisions

- **No new crate.** Unlike `render-capture`/`system-lint`, this module adds no
  `ToolBackend`/DOT node type — it's a dashboard view only, so everything lives inside
  the existing `smasher-web` crate (new `candidates.rs` module, a route, a template, a
  static mount).
- **Reads the same provisional path `render-capture` already writes to**
  (`./runs/<run_id>/artifacts/<candidate_id>/`, cwd-relative), per the spec's Assumption
  2. Not touching `smasher-render-capture::manifest::artifact_dir()`. Reconciling this
  with `AppState.data_dir`'s `RunDirectory` tree is `artifact-store`'s job, later in the
  build order.
- **Discovery validates by rejection, not sanitization.** Unlike
  `run_dir::sanitize_graph_name` (which replaces unsafe characters and continues),
  `candidates.rs`'s id validation returns `None`/empty on any `run_id`/`candidate_id`
  containing `/`, `\`, or `..` — these are lookup keys into a filesystem path, not
  user-facing names being persisted, so rejecting outright is the correct posture here.
  Additionally, `scan_candidates` is only called after confirming the run_id exists in
  `AppState.runs` (matching every other `/runs/{id}/*` route's 404 behavior) — the
  candidate directory scan is a second, separate tree from `AppState`, but the route
  still shouldn't answer for a `run_id` the dashboard has never heard of.
- **Resolving the spec's two Open Questions in the direction it already leaned,
  since spec approval didn't flag either for change:**
  - Candidates section polls (`hx-trigger="every 5s"`), matching the existing
    graph/questions sections' cadence, so candidates appear progressively during a
    still-running pipeline rather than only after completion.
  - Thumbnail-only this slice — no click-to-expand/lightbox. `gallery-gate` owns that
    if it turns out to be needed for a human to actually judge candidates.
- **`tower_http::services::ServeDir` handles traversal safety for the new
  `/candidate-artifacts` mount by construction** (it resolves and contains requests
  under the mount root the same way the existing `/static` mount already does) — no
  extra hardening needed on that path beyond what `ServeDir` already gives every mount
  in this crate. The extra id-rejection validation above is for `candidates.rs`'s own
  directory scan and URL construction, which happens before `ServeDir` ever sees a
  request.
- **Deliverables tracked in the `smasher` git repo**, consistent with `component-kit`,
  `render-capture`, and `system-lint`.

## Task List

### Phase 1: Core scanning logic (new module only, no route/template yet)
- [x] Task 1: `candidates.rs` — id validation + `scan_candidates()` + `CandidateSummary`

### Checkpoint: Core logic
- [x] `cargo test -p smasher-web` green (new unit tests only, no route/template changes)
- [x] `cargo clippy -p smasher-web` clean

### Phase 2: Route + template
- [x] Task 2: `candidate_gallery.html` template + `CandidateGalleryTemplate` struct
- [x] Task 3: `GET /runs/{id}/candidates` handler, registered in `routes/pages.rs`'s
      router

### Checkpoint: Route reachable
- [x] Route returns 200 + candidate HTML for a run with real fixture artifacts on disk
- [x] Route returns 200 + empty-state HTML for a run with no artifacts yet
- [x] Route returns 404 for an unknown `run_id` (consistent with existing routes)

### Phase 3: Static serving + styling
- [x] Task 4: `/candidate-artifacts` `ServeDir` mount in `server.rs`
- [x] Task 5: `.candidate-grid`/`.candidate-card`/`.candidate-card-failed` CSS in
      `static/style.css`

### Phase 4: Dashboard integration
- [x] Task 6: Wire the "Candidates" section into `run_detail.html`, polling like the
      existing graph/questions sections

### Checkpoint: Integrated
- [x] Manual: fixture pipeline with a real `render_capture` node run end-to-end, `/runs/{id}`
      opened in the Browser tool, screenshot confirmed rendering (not a broken image) —
      see Task 6's note for the run-id workaround this required
- [x] Manual: a candidate with `exit_status: Failed` renders as a failure card

### Phase 5: Final verification
- [x] Task 7: Final verification pass — every `SPEC-gallery-view.md` Success Criteria
      bullet checked off with evidence; `cargo test --workspace` and
      `cargo clippy --workspace` clean; `capability-map.md`'s `gallery-view` row updated
      to Done

### Checkpoint: Complete
- [x] Every bullet in `SPEC-gallery-view.md`'s Success Criteria section is checked off
      with evidence
- [x] `gallery-view` capability map entry marked done
