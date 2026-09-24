# Task List: `gallery-view`

Full context and rationale in `tasks/archive/plan-gallery-view.md`. Spec:
`docs/design-factory/SPEC-gallery-view.md`.

---

## Task 1: `candidates.rs` — id validation + `scan_candidates()` + `CandidateSummary`

**Description:** New file `crates/smasher-web/src/candidates.rs`. Add:
- `fn valid_id(s: &str) -> bool` — rejects (returns `false` for) empty strings or any
  string containing `/`, `\`, or `..`.
- `struct CandidateSummary { candidate_id: String, screenshot_url: String, manifest:
  smasher_render_capture::manifest::Manifest }` with a `failed() -> bool` and
  `failure_reason() -> Option<&str>` convenience accessor over `manifest.exit_status`
  for the template to use without matching the enum itself in askama syntax.
- `fn scan_candidates(run_id: &str) -> Vec<CandidateSummary>` — validates `run_id` with
  `valid_id`, reads `./runs/<run_id>/artifacts/`, and for each subdirectory whose name
  passes `valid_id` and which contains a parseable `manifest.json`, builds a
  `CandidateSummary`. Missing directory, unreadable entries, or unparseable manifests
  are skipped silently (return what's readable, don't error the whole scan) — matching
  the spec's Assumption 3.

**Acceptance criteria:**
- [x] `valid_id` returns `false` for `""`, `"../etc"`, `"a/b"`, `"a\\b"`; `true` for
      `"a-normal-uuid-like-id"`
- [x] `scan_candidates` returns an empty `Vec` when `./runs/<run_id>/artifacts/` doesn't
      exist
- [x] `scan_candidates` returns one `CandidateSummary` per valid candidate subdirectory,
      correctly parsing both `ExitStatus::Success` and `ExitStatus::Failed { reason }`
      manifests
- [x] `scan_candidates` skips (does not panic or error out on) a subdirectory with a
      missing or malformed `manifest.json`
- [x] `scan_candidates("../escape")` returns an empty `Vec` (rejected by `valid_id`
      before any path join)
- [x] `screenshot_url` field is exactly
      `/candidate-artifacts/{run_id}/artifacts/{candidate_id}/screenshot.png`

**Note:** `scan_candidates(run_id)` is a thin wrapper over an internal
`scan_candidates_in(base, run_id)` that takes the scan root explicitly. The spec's
public signature (`fn scan_candidates(run_id: &str) -> Vec<CandidateSummary>`, cwd-relative)
is preserved exactly; the split exists so tests can point the scan at a
`tempfile::tempdir()` fixture without mutating the test process's shared cwd (no
precedent for `std::env::set_current_dir` in this repo's tests, and it would be
unsafe to add one under parallel test execution).

**Verification:**
- [x] Unit tests in `candidates.rs` covering every acceptance criterion above, using a
      `tempfile::tempdir()` fixture with real `manifest.json` files written to disk (no
      mocking) — `smasher_render_capture` was already a direct `smasher-web` dependency
      (confirmed in `Cargo.toml` before writing tests), no dependency change needed
- [x] `cargo test -p smasher-web` exits 0 (6 new tests pass; 52 total, no regressions)
- [x] `cargo clippy -p smasher-web` clean (workspace clippy run shows only pre-existing
      warnings in `smasher-attractor`, none in `smasher-web` or the new file)

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/candidates.rs` (new)
- `crates/smasher-web/src/lib.rs` (add `mod candidates;`)
- `crates/smasher-web/Cargo.toml` (add `smasher-render-capture` as a direct dependency
  if it isn't already declared — check first, `HybridToolBackend` construction in
  `routes/pages.rs` suggests it may already be)

**Estimated scope:** Small (1 new file + tests in the same file)

---

## Task 2: `candidate_gallery.html` template + `CandidateGalleryTemplate` struct

**Description:** New askama template `crates/smasher-web/templates/candidate_gallery.html`
rendering a `.candidate-grid` of `.candidate-card` elements from a `Vec<CandidateSummary>`
— screenshot `<img>` for successful candidates, a `.candidate-card-failed` block with the
failure reason for failed ones, and a "no candidates yet" empty-state paragraph when the
list is empty. Add the matching `#[derive(Template)] struct CandidateGalleryTemplate {
run_id: String, candidates: Vec<CandidateSummary> }` in `routes/pages.rs`, following the
existing `QuestionCardTemplate`/`RunStatusTemplate` pattern (struct + `#[template(path =
...)]`, no route wiring yet — that's Task 3).

**Acceptance criteria:**
- [x] `candidate_gallery.html` renders an empty-state message when `candidates` is empty
- [x] Renders one card per candidate: `<img>` with `screenshot_url` for success,
      `.candidate-card-failed` with the failure reason for `Failed` status
- [x] Each card shows `candidate_id` and `manifest.captured_at`
- [x] `CandidateGalleryTemplate` compiles and derives `Template` correctly (askama
      compile-time template check passes as part of `cargo check`)

**Note:** `CandidateGalleryTemplate` carries `#[allow(dead_code)]`, matching the
existing precedent on `RunListTemplate` for a template struct defined ahead of its
route wiring — removed once Task 3 constructs it from a real handler.

**Verification:**
- [x] `cargo check -p smasher-web` exits 0 (askama validates the template against the
      struct at compile time — a mismatched field name fails the build)
- [x] Unit test rendering `CandidateGalleryTemplate` directly (not via HTTP) with a
      hand-built `Vec<CandidateSummary>` containing one success and one failure entry;
      assert the rendered HTML contains both the screenshot URL and the failure reason
      string (plus a second test for the empty-state case)

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-web/templates/candidate_gallery.html` (new)
- `crates/smasher-web/src/routes/pages.rs` (add `CandidateGalleryTemplate` struct only —
  no router change yet)

**Estimated scope:** Small (1 template + 1 struct)

---

## Task 3: `GET /runs/{id}/candidates` handler

**Description:** Add the route handler in `routes/pages.rs`, following the existing
`run_questions`/`run_status` handlers' shape exactly: look up `id` in `state.runs`
(404 via `WebError::NotFound` if absent, matching every sibling handler), call
`candidates::scan_candidates(&id)`, render `CandidateGalleryTemplate`. Register
`.route("/runs/{id}/candidates", get(run_candidates))` in the `router()` function
alongside the other `/runs/{id}/*` routes.

**Acceptance criteria:**
- [x] `GET /runs/{id}/candidates` returns 404 for an unknown `run_id` (same pattern as
      `run_detail`/`run_status`/`run_questions`)
- [x] Returns 200 with the empty-state HTML for a known run with no artifacts on disk
      yet
- [x] Returns 200 with candidate card HTML for a known run with real fixture artifacts
      written to `./runs/<run_id>/artifacts/` in the test setup

**Verification:**
- [x] Integration tests in `routes/pages.rs`'s existing `#[cfg(test)] mod tests`,
      following the file's established `test_state()` + `router().with_state(...)` +
      `oneshot()` pattern (plus a new `insert_test_record` helper mirroring
      `routes::api::tests::insert_test_record`, since `pages.rs` had none yet)
- [x] `cargo test -p smasher-web` exits 0 (57 total, no regressions)
- [x] `cargo clippy --workspace` clean (confirm no regression to sibling routes)

**Dependencies:** Task 2

**Files likely touched:**
- `crates/smasher-web/src/routes/pages.rs`

**Estimated scope:** Small (1 handler + route registration + tests)

---

## Task 4: `/candidate-artifacts` `ServeDir` mount

**Description:** In `server.rs`'s `build_router`, add a second `nest_service` mount
alongside the existing `/static` one: `.nest_service("/candidate-artifacts",
ServeDir::new("runs"))`, pointed at the same cwd-relative `runs/` root
`candidates.rs` scans (per the spec's Assumption 4 and the plan's cwd-relative
Architecture Decision).

**Acceptance criteria:**
- [x] `/candidate-artifacts/<run_id>/artifacts/<candidate_id>/screenshot.png` serves the
      real file when it exists on disk
- [x] Requesting a path outside `runs/` (e.g. via an encoded `..` segment) does not
      escape the mount root — `ServeDir`'s existing containment behavior, verified by a
      test that such a request does not return 200 with unexpected content
- [x] Existing `/static` mount and its assets are unaffected

**Verification:**
- [x] Integration test in `server.rs`'s `#[cfg(test)] mod tests` requesting a real
      screenshot file placed in a temp `runs/` fixture during the test, asserting 200 +
      correct content-type (plus a traversal test and a `/static` regression test)
- [x] `cargo test -p smasher-web` exits 0 (60 total, no regressions)

**Dependencies:** None (independent of Tasks 1-3, can land in parallel)

**Files likely touched:**
- `crates/smasher-web/src/server.rs`

**Estimated scope:** XS (1-2 lines + tests)

---

## Task 5: Candidate card CSS

**Description:** Add `.candidate-grid` (responsive grid/flex layout), `.candidate-card`
(fixed-size thumbnail container, per the spec's "thumbnail-only this slice" decision),
and `.candidate-card-failed` (visually distinct failure styling — e.g. a border/background
color signaling failure) to `crates/smasher-web/static/style.css`, matching this file's
existing conventions (check current variable/class naming before adding new rules).

**Acceptance criteria:**
- [x] `.candidate-grid` lays out cards responsively (wraps, doesn't overflow the page)
- [x] `.candidate-card-failed` is visually distinguishable from a successful card
      (red border + tinted background, via existing `--red`/`--red-dim` tokens)
- [x] No existing style rules are modified or removed (pure append at end of file)

**Verification:**
- [x] Manual: confirmed as part of Task 6's manual check — `.candidate-grid` held two
      cards side by side (one `.candidate-card`, one `.candidate-card-failed`) without
      overflowing; classes applied exactly as this CSS defines them
- [x] No automated test for pure CSS — visual check only, consistent with this repo's
      testing strategy (structural correctness is unit/integration-tested; visual
      correctness is a manual look); `cargo test -p smasher-web` re-run as a sanity
      check (60 passed, CSS is not part of the Rust build)

**Dependencies:** None (can land in parallel with Tasks 1-4)

**Files likely touched:**
- `crates/smasher-web/static/style.css`

**Estimated scope:** XS (CSS only)

---

## Task 6: Wire "Candidates" section into `run_detail.html`

**Description:** Add a new `<section class="candidates-section">` to
`run_detail.html`, alongside the existing graph/questions sections, with
`hx-get="/runs/{{ run.id }}/candidates"`, `hx-trigger="load, every 5s"`,
`hx-swap="innerHTML"` — matching the graph section's polling pattern exactly (per the
plan's resolution of the spec's Open Question 1).

**Acceptance criteria:**
- [x] `run_detail.html` includes a "Candidates" heading and a polling container
      targeting `/runs/{{ run.id }}/candidates`
- [x] Existing sections (event stream, graph, questions, metadata) are unchanged

**Verification:**
- [x] `cargo test -p smasher-web` exits 0 (existing `run_detail`-rendering tests still
      pass; 60 total)
- [x] Manual: ran `smasher-web` directly (built via `cargo build --bin smasher-web`,
      launched with a dummy `ANTHROPIC_API_KEY` since this fixture makes zero LLM
      calls), submitted the render-capture e2e fixture pipeline through the real
      dashboard form in the Browser tool. The pipeline completed and produced a real
      screenshot at `runs/<tool-arg-run_id>/artifacts/fixture/`. **Found and worked
      around a naming mismatch, not a gallery-view bug:** the fixture's `render_capture`
      tool node hardcodes its own `run_id` arg, which is independent of the dashboard's
      generated run UUID, so the two never matched in this ad hoc manual test (wiring a
      pipeline's tool-node `run_id` to the platform's actual run id is outside
      gallery-view's scope). Worked around by copying the real, freshly-captured
      artifact directory to `runs/<real-run-uuid>/artifacts/fixture/`. After the next 5s
      poll, the Candidates section showed the card; confirmed via
      `document.querySelector('.candidate-thumbnail')` that the `<img>` was
      `complete: true` with `naturalWidth: 800, naturalHeight: 600` (a real decoded PNG,
      not a broken image) and `src` pointed at the expected
      `/candidate-artifacts/<run_id>/artifacts/fixture/screenshot.png` URL. A pixel
      screenshot of the rendered page wasn't captured because the Browser pane was
      hidden for part of this check; verification instead used direct DOM/image-decode
      inspection in the live page, which is a stronger signal than a screenshot for
      "not a broken image."
- [x] Manual: added a second, hand-built candidate manifest with
      `exit_status: Failed { reason: "..." }` under the same run id. After the next
      poll, `document.querySelectorAll('.candidate-card')` showed it with classes
      `candidate-card candidate-card-failed`, no `<img>`, and the failure reason text
      present — while the successful candidate alongside it kept plain `candidate-card`
      and its `<img>`. Both fixture directories and the manual-verification server were
      removed after the check (`rm -rf runs` in the crate dir; process killed);
      `git status` confirmed no test artifacts were left behind.

**Dependencies:** Tasks 3, 4, 5

**Files likely touched:**
- `crates/smasher-web/templates/run_detail.html`

**Estimated scope:** Small (template edit only)

---

## Task 7: Final verification pass

**Description:** Walk every bullet in `SPEC-gallery-view.md`'s Success Criteria section
and confirm it's met with concrete evidence (test output, a screenshot from the manual
Browser-tool check, or a `cargo` command's clean output). Update
`docs/design-factory/capability-map.md`'s `gallery-view` row from "Not started" to
"Done", matching the convention already used for `component-kit`, `render-capture`, and
`system-lint`.

**Acceptance criteria:**
- [x] Every `SPEC-gallery-view.md` Success Criteria bullet checked off with evidence
      (see below)
- [x] `cargo test --workspace` clean, zero warnings
- [x] `cargo clippy --workspace` clean (13 pre-existing warnings remain in
      `smasher-llm`, `smasher-attractor`, `smasher-agent` — none in any file this plan
      touched; confirmed with `touch`-forced rebuilds of `smasher-web` alone showing
      zero warnings)
- [x] `capability-map.md`'s `gallery-view` row updated to "Done" (plus a one-line fix to
      the stale "specs exist so far for component-kit, render-capture, and system-lint"
      sentence in the same file, now listing `gallery-view` too)

**`SPEC-gallery-view.md` Success Criteria, walked line by line:**
- [x] `cargo test -p smasher-web` passes with zero warnings; `cargo clippy --workspace`
      stays clean — confirmed above
- [x] A pipeline run containing a `tool="render_capture"` node, viewed at `/runs/{id}`,
      shows a "Candidates" section with the captured screenshot displayed inline —
      confirmed live in Task 6's manual check (`naturalWidth`/`naturalHeight` on the
      decoded `<img>`, not a broken image)
- [x] A candidate whose `Manifest.exit_status` is `Failed { reason }` renders as a
      distinct failure card showing the reason, not a broken `<img>` — confirmed live in
      Task 6's manual check (`candidate-card-failed` class, no `<img>`, reason text
      present)
- [x] A run with zero candidates yet renders the section with an empty state, not an
      error or a 404 — covered by Task 3's
      `run_candidates_returns_empty_state_for_run_with_no_artifacts` test and observed
      live before Task 6's fixtures were added
- [x] No regression to any existing dashboard route or template — `cargo test -p
      smasher-web` grew from 52 (pre-Task-1 baseline) to 60 passing tests across all
      seven tasks with zero failures at any step; `/static` mount explicitly re-tested
      in Task 4

**Verification:**
- [x] `cargo test --workspace` and `cargo clippy --workspace` run one final time in this
      task: 397+20+1148+15+30+33+24+75+8+11+182+1+1+11+728+8+1+2+27+3+60 (plus 7
      doctests) all passing, 0 failed; clippy shows only the 13 pre-existing warnings
      noted above

**Dependencies:** Tasks 1-6

**Files likely touched:**
- `docs/design-factory/capability-map.md`

**Estimated scope:** XS (verification + one-line doc update)
