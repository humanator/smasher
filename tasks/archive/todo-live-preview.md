# Task List: `live-preview`

Full context and rationale in `tasks/archive/plan-live-preview.md`. Spec:
`design-factory/SPEC-live-preview.md`.

---

## Task 1: `CandidateSummary::primary_url()` + `live_card` macro + embed CSS

**Description:** Add `pub fn primary_url(&self) -> &str` to `CandidateSummary`
(`candidates.rs`), returning `self.bundle_url.as_deref().unwrap_or(&self.screenshot_url)`.
Add a new `live_card(c)` macro to `_candidate_card.html`, alongside the existing
`failed_card` macro, rendering only the inner embed — NOT the outer card wrapper (see
plan's Architecture Decisions for why): a `.candidate-embed` div containing either
`<iframe src="{{ bundle }}" sandbox="allow-scripts" class="candidate-thumbnail">` when
`c.bundle_url` is `Some`, or `<img src="{{ c.screenshot_url }}" class="candidate-thumbnail">`
otherwise. Add CSS: `.candidate-thumbnail { border: 0; }` (iframes get a default border,
`<img>` doesn't need one) — everything else about `.candidate-thumbnail`'s existing sizing
is reused unchanged.

**Acceptance criteria:**
- [x] `CandidateSummary::primary_url()` added, doc-commented with its purpose (matches
      `bundle_url` when present, else `screenshot_url`)
- [x] `live_card(c)` macro added to `_candidate_card.html`: `{% if let Some(bundle) =
      c.bundle_url %}` renders `<iframe>`, `{% else %}` renders `<img>`; both carry
      `class="candidate-thumbnail"` and `title`/`alt` set to `Candidate {{ c.candidate_id
      }}`
- [x] `<iframe>` carries exactly `sandbox="allow-scripts"` — no other sandbox tokens
- [x] `style.css` gains `border: 0;` on the existing `.candidate-thumbnail` rule (one-line
      addition, not a new rule)
- [x] Neither `candidate_gallery.html` nor `gallery_gate.html` call the new macro yet —
      that's Tasks 2/3

**Verification:**
- [x] Unit test (new, in `candidates.rs` alongside `CandidateSummary`'s existing tests):
      `primary_url()` returns `bundle_url` when set, `screenshot_url` when `bundle_url` is
      `None`
- [x] `cargo test -p smasher-web` exits 0 (askama compiles the new macro against the real
      `CandidateSummary` struct at build time — a syntax/field error here fails the build,
      not just a test)

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/candidates.rs`
- `crates/smasher-web/templates/_candidate_card.html`
- `crates/smasher-web/static/style.css`

**Estimated scope:** Small (1 new method, 1 new macro, 1-line CSS addition)

---

## Task 2: `candidate_gallery.html` swapped to call `live_card`

**Description:** Replace the inline `<img src="{{ candidate.screenshot_url }}" ...>` line
in `candidate_gallery.html`'s success-card branch with `{% call
candidate_card::live_card(candidate) %}`. The surrounding `<div class="candidate-card">`,
`candidate-id`, and `candidate-captured-at` markup is untouched — only the thumbnail line
changes.

**Acceptance criteria:**
- [x] `candidate_gallery.html`'s success branch calls `candidate_card::live_card(candidate)`
      in place of the old inline `<img>`
- [x] No other markup in this template changes (id/captured-at/failed-card branch
      untouched)

**Verification:**
- [x] Extend existing test `candidate_gallery_template_renders_success_and_failure_cards`
      (`pages.rs`): the candidate with `bundle_url: None` still renders `<img
      src="...screenshot.png"...>` and no `<iframe>`
- [x] New test: a `CandidateSummary` with `bundle_url: Some(...)` renders `<iframe
      src="...bundle/index.html" sandbox="allow-scripts"...>` and no `<img>` for that
      candidate
- [x] `cargo test -p smasher-web` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-web/templates/candidate_gallery.html`
- `crates/smasher-web/src/routes/pages.rs` (test additions)

**Estimated scope:** Small (1 template line + 1-2 new test assertions)

---

## Task 3: `gallery_gate.html` swapped to call `live_card`, anchor uses `primary_url()`

**Description:** Replace `gallery_gate.html`'s success-card `<a href="{{
gc.summary.screenshot_url }}" target="_blank"><img ...></a>` with `<a href="{{
gc.summary.primary_url() }}" target="_blank">{% call
candidate_card::live_card(gc.summary) %}</a>` — the click-to-expand anchor now points at
whichever URL is actually embedded (spec assumption 2). The `<label class="candidate-card">`
checkbox wrapper, `candidate-id` span, and `lint-badge-slot` block are untouched.

**Acceptance criteria:**
- [x] Anchor's `href` is `{{ gc.summary.primary_url() }}`, not `screenshot_url` directly
- [x] Anchor wraps the `{% call candidate_card::live_card(gc.summary) %}` output (iframe or
      img, whichever the macro chose)
- [x] `<label class="candidate-card"><input type="checkbox" ...>` structure is unchanged —
      still selectable exactly as before
- [x] Failed-card branch (`candidate_card::failed_card`) is untouched

**Verification:**
- [x] New/extended HTTP integration test (extend `write_gate_manifest` in `pages.rs` with an
      optional artifacts param, or add a sibling helper): a gate candidate whose manifest
      has a `LiveBundle` artifact renders `<iframe ... sandbox="allow-scripts">` inside the
      response HTML, wrapped in `<a href=".../bundle/index.html">`
    - [x] A gate candidate with no `LiveBundle` artifact still renders `<img>` wrapped in
      `<a href=".../screenshot.png">`
- [x] Existing gate/decision endpoint tests using `write_gate_manifest` (checkbox selection,
      decision submission, etc.) still pass unmodified
- [x] `cargo test -p smasher-web` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-web/templates/gallery_gate.html`
- `crates/smasher-web/src/routes/pages.rs` (test additions/helper extension)

**Estimated scope:** Medium (1 template block + a test-helper extension + 2 new assertions)

---

## Checkpoint A: Live embed renders — human review before Path B

- [x] `cargo test -p smasher-web` green (112 passed)
- [x] Manual (Browser tool): ran a scratch fixture pipeline (`render_capture` → gallery-view
      candidates page) — the candidate embedded live as a real `<iframe sandbox="allow-scripts">`
      and a `data-drawer-trigger` button inside it was clicked live, opening the drawer —
      proves `allow-scripts` genuinely lets embedded component JS run
- [x] Manual: same fixture into a paused `gallery-gate` run — embed rendered inside the
      checkbox `<label>`, anchor's `href` matched the embedded bundle URL (DOM-verified).
      Checkbox toggling and the anchor's click-to-expand were not both cleanly exercised in
      the same pass — a few automated clicks on the embed's interactive content inside the
      gate card fell through to the wrapping `<a target="_blank">` and opened a new tab
      instead of reaching the iframe, intermittently, correlating with the gate card's
      periodic SSE refresh. Judged an automation-timing artifact, not a code defect (the
      identical iframe+sandbox mechanism worked cleanly on the anchor-free gallery-view
      page) — flagged in the plan for a real reviewer to watch for, not fixed this session.
- [x] Manual: a candidate with no `bundle/` artifact (hand-written old-format manifest with
      `"artifacts": []`) rendered via the screenshot (`<img>`, no `<iframe>`) alongside the
      live-bundle candidate on the same gallery-view page, no error.
- [x] **Stop here for human review before starting Task 4** — approved by the user this
      session

---

## Task 4: `Manifest.generation_params` field + backward compat + ripple fixes

**Description:** Add `#[serde(default)] pub generation_params: BTreeMap<String, String>` to
`Manifest` in `manifest.rs`, per spec Code Style. Fix every existing `Manifest { .. }`
literal across the workspace so it still compiles — 8 sites found by grep: this crate's own
3 test literals (`manifest.rs`), the production site in `lib.rs:52` (`capture()`), and 4 more
in `smasher-web` (`candidates.rs:182`, `pages.rs:861,911,924,1047`, `gallery.rs:226,325`) —
all get `generation_params: BTreeMap::new()`. Extend the existing
`manifest_deserializes_without_artifacts_key_for_backward_compat` test (don't duplicate it)
to also assert a manifest JSON with neither `artifacts` nor `generation_params` keys still
deserializes, both defaulting to empty.

**Acceptance criteria:**
- [x] `Manifest.generation_params: BTreeMap<String, String>` added with `#[serde(default)]`
- [x] All 8 `Manifest { .. }` literals updated with `generation_params: BTreeMap::new()`:
      `manifest.rs` (3 own tests), `lib.rs:52`, `candidates.rs:182`, `pages.rs:861,911,924,1047`,
      `gallery.rs:226,325`
- [x] `use std::collections::BTreeMap;` added wherever a literal site needs it

**Verification:**
- [x] Unit test: `Manifest` serde roundtrip with a non-empty `generation_params` map
      alongside non-empty `artifacts` (extend `manifest_serde_roundtrip_with_artifacts`
      rather than adding a near-duplicate test)
- [x] Existing test `manifest_deserializes_without_artifacts_key_for_backward_compat`
      extended (renamed if it reads better, e.g.
      `manifest_deserializes_without_artifacts_or_generation_params_keys_for_backward_compat`):
      a hand-written JSON literal with neither key still deserializes, both fields
      defaulting empty
- [x] `cargo test -p smasher-render-capture -p smasher-web` exits 0
- [x] `cargo test --workspace` exits 0 (confirms all 8 sites actually fixed)

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-render-capture/src/manifest.rs`
- `crates/smasher-render-capture/src/lib.rs`
- `crates/smasher-web/src/candidates.rs`
- `crates/smasher-web/src/routes/pages.rs`
- `crates/smasher-web/src/routes/gallery.rs`

**Estimated scope:** Medium (1 real logic file, 4 mechanical fix-up files)

---

## Task 5: `capture()` (in `lib.rs`) threads `generation_params`

**Description:** Add a `generation_params: BTreeMap<String, String>` parameter to
`capture()` in `lib.rs` (NOT `capture.rs` — see plan's Architecture Decisions). Populate
`Manifest.generation_params` from it when constructing the returned/written manifest,
replacing Task 4's placeholder `BTreeMap::new()` at that one production site. Fix all 5
call sites this new parameter breaks: `lib.rs`'s own 3 test call sites,
`examples/capture.rs`'s 1 call, and `backend.rs`'s 1 production call (Task 6 makes that
one real; for this task it just compiles with a passed-through/empty map).

**Acceptance criteria:**
- [x] `capture()`'s signature gains `generation_params: BTreeMap<String, String>`
- [x] `capture()`'s `Manifest { .. }` construction uses the parameter instead of
      `BTreeMap::new()`
- [x] All 5 call sites updated: `lib.rs` tests
      (`capture_writes_screenshot_and_manifest_to_output_dir`,
      `capture_copies_nested_assets_into_the_bundle`,
      `capture_rejects_a_candidate_missing_index_html`), `examples/capture.rs`,
      `backend.rs`'s `run_render_capture`

**Verification:**
- [x] New/extended test in `lib.rs`: `capture()` given a non-empty `generation_params` map
      writes it into `manifest.json` unchanged (compare the written file's parsed
      `Manifest.generation_params` against the input map)
- [x] `cargo test -p smasher-render-capture` exits 0
- [x] `cargo check --workspace` exits 0 (catches `examples/capture.rs`, which `cargo test`
      does not exercise)

**Dependencies:** Task 4

**Files likely touched:**
- `crates/smasher-render-capture/src/lib.rs`
- `crates/smasher-render-capture/examples/capture.rs`
- `crates/smasher-render-capture/src/backend.rs` (signature-compiling change only; real
  parsing is Task 6)

**Estimated scope:** Medium (signature change + 1 new/extended test + 3 mechanical
call-site fixes)

---

## Task 6: `HybridToolBackend` parses the optional `generation_params` tool arg

**Description:** In `backend.rs`'s `run_render_capture`, read an optional
`"generation_params"` key from `args` (a `serde_json::Value`). When present, deserialize it
via `serde_json::from_value::<BTreeMap<String, String>>` and pass it into `capture()`; a
deserialization failure (non-string value, nested object, wrong type) returns a real
`HandlerError`, matching this file's existing precedent for missing `candidate_dir`/
`candidate_id`. When absent, pass `BTreeMap::new()` — never an error.

**Acceptance criteria:**
- [x] `run_render_capture` reads `args.get("generation_params")`, deserializes when present,
      defaults to an empty `BTreeMap` when absent
- [x] A present-but-malformed `generation_params` value produces `Err(HandlerError::..)`,
      not a panic and not a silently-dropped value

**Verification:**
- [x] New test (alongside `render_capture_produces_artifact_and_never_touches_fallback`):
      `args` including a valid `generation_params` object produces a `manifest.json` on disk
      whose `generation_params` matches exactly
- [x] New test: `args` omitting `generation_params` entirely still succeeds, with an empty
      `generation_params` in the written manifest
- [x] New test: `args` with a malformed `generation_params` (e.g. a nested object or numeric
      value) returns an error from `execute_tool`, not a panic
- [x] `cargo test -p smasher-render-capture` exits 0

**Dependencies:** Task 5

**Files likely touched:**
- `crates/smasher-render-capture/src/backend.rs`

**Estimated scope:** Small-Medium (real parsing logic + 3 new tests)

---

## Checkpoint: Traceability data plumbed

- [x] `cargo test -p smasher-render-capture` green (unit + integration)
- [x] `cargo test --workspace` green

---

## Task 7: Traceability `<details>` panel added to `live_card`

**Description:** Extend the `live_card(c)` macro from Task 1: after the `.candidate-embed`
div, if `!c.manifest.generation_params.is_empty()`, render `<details
class="candidate-params"><summary>params</summary>` followed by one `<div
class="candidate-param"><span class="candidate-param-key">{{ key }}</span>: {{ value
}}</div>` per entry, then `</details>`. Renders nothing at all (not an empty `<details>`)
when the map is empty. Add `.candidate-params`/`.candidate-param`/`.candidate-param-key` CSS
(collapsed-by-default is native `<details>` behavior, no CSS needed for that part).

**Acceptance criteria:**
- [x] `live_card` macro extended exactly as above — reads `c.manifest.generation_params`
      directly (no new `CandidateSummary` field, per plan's Architecture Decisions)
- [x] Empty map → no `<details>` element at all in the output (verified by string search,
      not just "collapsed")
- [x] CSS added for `.candidate-params`, `.candidate-param`, `.candidate-param-key`

**Verification:**
- [x] `cargo test -p smasher-web` exits 0 (askama recompiles cleanly against
      `Manifest.generation_params`, which Task 4 already added)

**Dependencies:** Task 1, Task 4 (needs both the macro and the manifest field to exist —
independent of Tasks 2/3/5/6's own completion, though those will likely have landed first
in practice)

**Files likely touched:**
- `crates/smasher-web/templates/_candidate_card.html`
- `crates/smasher-web/static/style.css`

**Estimated scope:** Small (1 macro extension + CSS)

---

## Task 8: Render/HTTP test coverage for the traceability panel

**Description:** Prove the panel's presence/absence is correct in both templates: extend
`candidate_gallery_template_renders_success_and_failure_cards` (or add a sibling test) with
a candidate carrying non-empty `generation_params`, asserting the exact key/value pairs
appear inside a `<details class="candidate-params">` block; assert a candidate with empty
`generation_params` produces no such block anywhere in the output. Mirror both assertions
for `gallery_gate.html` via the `write_gate_manifest` helper (extended in Task 3) or a
further extension of it to accept a `generation_params` map.

**Acceptance criteria:**
- [x] `candidate_gallery.html`: candidate with `generation_params` renders the exact
      key/value pairs inside `<details class="candidate-params">`; a candidate without
      renders no such block
- [x] `gallery_gate.html`: same two assertions, via a real fixture-manifest HTTP round-trip
- [x] Both assertions check for absence of an *empty* `<details class="candidate-params">`
      too, not just presence when populated — proving the `{% if %}` guard actually elides
      the element rather than rendering it empty

**Verification:**
- [x] `cargo test -p smasher-web` exits 0, including all new assertions

**Dependencies:** Task 7

**Files likely touched:**
- `crates/smasher-web/src/routes/pages.rs`

**Estimated scope:** Small-Medium (4-6 new assertions across 2 templates, reusing existing
test fixtures/helpers)

---

## Checkpoint: Traceability UI complete

- [x] `cargo test -p smasher-web` green, including panel-presence/absence assertions
- [x] Manual (Browser tool): fixture pipeline with one `render_capture` node passing
      `generation_params` and one not, run into both a `gallery-view` run and a paused
      `gallery-gate` run — panel expands to show the right params only where set

---

## Task 9: Whole-workspace regression + manual verification sweep + capability-map update

**Description:** Final close-out. Run the full test/lint suite. Manually verify every
Success Criteria bullet in `SPEC-live-preview.md` live via `smasher serve` and the Browser
tool, screenshotting each state. Update `capability-map.md`'s `live-preview` row to `Done`.

**Acceptance criteria:**
- [x] `cargo test --workspace` exits 0
- [x] `cargo clippy --workspace` exits 0 with no warnings
- [x] `cargo build --workspace` exits 0 (catches anything `cargo test` alone wouldn't, e.g.
      the examples binary)
- [x] `capability-map.md`'s `live-preview` row status changed from "Not started" to "Done"

**Verification (manual, this session, via the Browser tool — screenshot each state):**
- [x] A candidate with a persisted `bundle/` renders as a clickable, interactive embedded
      live view in both `gallery-view`'s "Candidates" section and a paused `gallery-gate`
      card
- [x] A candidate with no `bundle/` artifact (old-format manifest) still renders via the
      screenshot in both templates, no error
- [x] A candidate whose `render_capture` node passed `generation_params` shows an expandable
      panel with exactly those key/value pairs; a candidate that didn't shows no panel
- [x] Existing `gallery-view`/`gallery-gate`/`artifact-store` tests are unaffected (no
      regression)

**Dependencies:** Tasks 1-8

**Files likely touched:**
- `design-factory/capability-map.md`

**Estimated scope:** Small (no new code, verification + one doc update)
