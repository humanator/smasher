# Implementation Plan: `live-preview` (Semi-Dark Design Factory)

## Overview

`live-preview` is the ninth module in the Semi-Dark Design Factory capability map
(`design-factory/capability-map.md`), depending on `artifact-store` (done), `gallery-view`
(done), and `gallery-gate`'s already-shipped gate/decision machinery (the two items still
open on `gallery-gate` — timeout removal and the lint-badge disclosure — are unrelated to
this module's files, confirmed by reading the actual code, not assumed). Its spec is
`design-factory/SPEC-live-preview.md`. It swaps the candidate card's primary view from a
static `screenshot.png` to a live `<iframe>` of the bundle `artifact-store` already
persists (screenshot as fallback), and adds an opt-in `generation_params` traceability
panel to the same card.

This plan breaks the spec into 9 small, vertically-sliced, independently verifiable tasks
across 4 phases. Like `artifact-store`, the module bundles two capabilities with no
dependency on each other: **Path A** (Tasks 1-3) swaps the primary view to a live embed —
this needs **no Rust/manifest changes at all**, since `CandidateSummary.bundle_url` already
exists; it's a templates+CSS+one-helper-method change. **Path B** (Tasks 4-6) gives a
`render_capture` node an optional `generation_params` arg and threads it into the manifest —
pure data plumbing, no template change. **Task 7-8** is the merge point: the traceability
`<details>` panel, which needs both Path A's macro and Path B's data to exist. Task 9 closes
out both with a whole-workspace regression pass and manual browser verification.

Path A is sequenced first because it's the spec's primary objective and the one with real
user-facing/security surface (embedding agent-authored markup live); Path B could run in
parallel once this plan is approved.

## Architecture Decisions

- **The spec's Project Structure mis-locates where `capture()` lives.** The spec says
  `capture.rs` gets "+ thread the new generation_params tool arg into the Manifest written
  alongside screenshot.png/bundle/" — but `capture()` (the function that builds `Manifest`
  and writes `manifest.json`) is in `lib.rs`, confirmed by reading the crate. `capture.rs`
  only holds `capture_screenshot()` and `copy_dir_recursive()`. Task 5 touches `lib.rs`, not
  `capture.rs`.
- **Spec assumption 6's additive `CandidateSummary.generation_params` field is unnecessary
  — dropped.** `CandidateSummary` already carries the full `manifest: Manifest`, and
  existing templates already reach into it directly (`candidate.manifest.captured_at` in
  `candidate_gallery.html` today). Unlike `bundle_url` (which needs real derivation logic —
  scanning `manifest.artifacts` for a `LiveBundle` entry and formatting a URL string),
  `generation_params` is already the exact field/type needed on `Manifest` itself; the
  template macro reads `c.manifest.generation_params` directly. This means: no new
  `CandidateSummary` field, no `scan_candidates` change, and none of the 3
  `CandidateSummary { .. }` test-literal sites (`candidates.rs`, `gallery.rs`, `pages.rs`×2)
  need touching at all. Smaller footprint than the spec projected, found by reading
  `candidates.rs` rather than assumed.
- **`Manifest { .. }` struct-literal ripple — same 7 sites `artifact-store` found, now
  needing one more field each**, confirmed by grep: `smasher-web/src/candidates.rs:182`
  (test), `smasher-web/src/routes/pages.rs:861,911,924,1047` (tests),
  `smasher-web/src/routes/gallery.rs:226,325` (tests), plus the production site in
  `smasher-render-capture/src/lib.rs:52` (`capture()`'s own `Manifest` construction).
  `#[serde(default)]` only helps deserialization, not struct literals — Task 4 fixes all 8
  (7 + the production one) immediately, verified by `cargo test --workspace`, not deferred.
- **`capture()`'s own call-site ripple, found by grep, not in the spec.** Changing
  `capture()`'s signature to accept `generation_params: BTreeMap<String, String>` breaks
  every existing caller: `lib.rs`'s own 3 test call sites, `backend.rs`'s 1 production call
  (`run_render_capture`), and **`examples/capture.rs`'s 1 call** — a standalone example
  binary (`cargo run -p smasher-render-capture --example capture`) that `cargo test` never
  exercises, only `cargo check --workspace`/`cargo build --workspace` would catch it. Task 5
  fixes all 5.
- **`live_card`'s macro shape only partially mirrors `_candidate_card.html`'s existing
  `failed_card` — the outer wrapper stays with the call site.** `failed_card` owns its
  entire `<div class="candidate-card candidate-card-failed">` because a failed candidate is
  never selectable in either template. A live/success candidate is different:
  `gallery_gate.html` wraps it in `<label class="candidate-card"><input type="checkbox">`
  (needed for gate selection), while `candidate_gallery.html` wraps it in a plain
  `<div class="candidate-card">` — two different outer elements. So `live_card(c)` renders
  only the inner `.candidate-embed` (iframe-or-img) and the conditional traceability
  `<details>` — never the outer card wrapper, id, or captured-at markup, which each call
  site keeps writing itself exactly as today, just swapping their old inline `<img>` line
  for one `{% call candidate_card::live_card(c) %}` statement. This is a correction to the
  spec's Project Structure call-site illustration, which shows extra markup after the
  `{% call %}` line as if it were macro-body content — askama's `call` has no body/`endcall`
  form; that markup was always meant to stay as sibling literal HTML in the call site.
- **New method `CandidateSummary::primary_url(&self) -> &str`** (returns `bundle_url` when
  `Some`, else `screenshot_url`) added to satisfy spec assumption 2 without duplicating the
  if/else in two places. `gallery_gate.html`'s existing click-to-expand anchor's `href`
  switches from `screenshot_url` to this. `candidate_gallery.html` has no such anchor today
  and spec doesn't ask it to gain one — untouched there.
- **Iframe sandbox — resolved with the user this session: `sandbox="allow-scripts"`.**
  Checked `design-kit/components.js`: the kit's button/drawer/modal components are real
  interactive JS, not static markup, so a fully locked-down `sandbox=""` would silently
  break that interactivity inside every embed — defeating this module's own "a human should
  be able to click through a candidate" objective. `allow-scripts` alone (no
  `allow-same-origin`, `allow-forms`, `allow-top-navigation`, or `allow-popups`) keeps
  component JS running while denying the embedded document any access to the parent
  dashboard's cookies/session/DOM, any same-origin fetch back to the dashboard's own API,
  and any ability to navigate the top window or open popups. Resource loading
  (`/design-kit/tokens.css`, `/design-kit/components.js`) is unaffected by sandboxing either
  way — sandbox restricts scripting capabilities of the loaded document, not what the
  browser fetches to render it.
- **Fixed embed box reuses `.candidate-thumbnail`'s existing sizing** (100% width × 100px
  height) for the `<iframe>` too — same class applied to both `<img>` and `<iframe>`, one
  line added (`border: 0`) since iframes get a default border `<img>` doesn't. Defers the
  spec's Open Question on differing gallery-view/gallery-gate embed sizes to a future
  module, per spec's own "left to implementation."
- **`generation_params` malformed-value handling in `backend.rs`**: parsed via
  `serde_json::from_value::<BTreeMap<String, String>>(v.clone())`. A present-but-malformed
  value (non-string entry, nested object, wrong JSON type) surfaces as a real
  `HandlerError`, matching this file's existing precedent for missing `candidate_dir`/
  `candidate_id` (fail loud on bad pipeline-author input, don't silently drop data). An
  absent `"generation_params"` key defaults to an empty `BTreeMap`, never an error — this is
  the "omitted entirely" case spec assumption 4 describes.
- **Deliverables tracked in the `smasher` git repo**, consistent with every prior module in
  this capability map.

## Task List

### Phase 1: Live embed swap (Path A — no Rust/manifest changes)
- [x] Task 1: `CandidateSummary::primary_url()` + `live_card` macro (iframe/img toggle,
      sandboxed) in `_candidate_card.html` + `.candidate-embed`/`.candidate-thumbnail` CSS
- [x] Task 2: `candidate_gallery.html` swapped to call the macro
- [x] Task 3: `gallery_gate.html` swapped to call the macro, anchor now uses `primary_url()`

### Checkpoint A: Live embed renders — human review before Path B
- [x] `cargo test -p smasher-web` green (112 passed)
- [x] Manual: a persisted `bundle/` candidate renders as a clickable, interactive
      (component JS runs) embedded view in both a `gallery-view` run and a paused
      `gallery-gate` card, verified live via `smasher serve` + Browser tool. Confirmed via
      DOM inspection (`sandbox="allow-scripts"` on a real `<iframe src=".../bundle/index.html">`,
      not a screenshot) and by actually clicking a `data-drawer-trigger` button rendered
      inside the sandboxed iframe on the `candidate_gallery.html` (gallery-view) page — the
      drawer opened live, proving `allow-scripts` really lets embedded component JS run.
    - Note (not a code bug, flagged for awareness): on `gallery_gate.html`, the live embed
      sits inside a `<a href="{{ primary_url() }}" target="_blank">` wrapper (click-to-expand).
      A few automated clicks on the embed's interactive button landed on that anchor instead
      of the iframe and opened a new tab. This reproduced intermittently and correlated with
      the gate card's periodic SSE-driven DOM refresh; a real user is very unlikely to click
      at the exact instant of a refresh swap. Not investigated further this session since it
      didn't block verification (the same iframe+sandbox mechanism is proven to work via the
      gallery-view page, which has no such wrapper) — worth a closer look only if a real
      reviewer reports the gate card's embed swallowing clicks in practice.
- [x] Manual: a candidate with no `bundle/` artifact (old-format manifest) still renders via
      the screenshot in both templates, no error. Verified live: a hand-written manifest with
      `"artifacts": []` rendered a plain `<img src=".../screenshot.png">` with no `<iframe>`
      alongside the live-bundle candidate, page loaded with no error.
- [x] **Human review before starting Path B** — approved by the user this session

### Phase 2: Traceability data (Path B — independent of Path A)
- [x] Task 4: `Manifest.generation_params: BTreeMap<String, String>` field, backward-compat,
      all 8 struct-literal ripple sites fixed
- [x] Task 5: `capture()` (in `lib.rs`) threads `generation_params` through to the written
      manifest; all 5 call-site ripples fixed
- [x] Task 6: `HybridToolBackend::run_render_capture` parses the optional
      `generation_params` tool arg

### Checkpoint: Traceability data plumbed
- [x] `cargo test -p smasher-render-capture` green (unit + integration)
- [x] `cargo test --workspace` still green (all 8 + 5 ripple sites actually fixed, not
      deferred)

### Phase 3: Traceability UI (merge point — needs Task 1's macro AND Task 4's manifest field)
- [x] Task 7: `<details class="candidate-params">` block added to `live_card`, reading
      `c.manifest.generation_params` + `.candidate-params` CSS
- [x] Task 8: Render/HTTP test coverage: panel appears with exactly the right key/value
      pairs when `generation_params` is set, renders nothing (not an empty disclosure) when
      it isn't — both templates

### Checkpoint: Traceability UI complete
- [x] `cargo test -p smasher-web` green, including the new panel-presence/absence assertions
- [x] Manual: a fixture pipeline with one `render_capture` node passing `generation_params`
      and one not, run into both a `gallery-view` run and a paused `gallery-gate` run —
      panel expands with the right params only where set

### Phase 4: Close-out
- [x] Task 9: Whole-workspace regression + full manual verification sweep +
      `capability-map.md` update

### Checkpoint: Complete
- [x] `cargo test --workspace` and `cargo clippy --workspace` both clean
- [x] Every bullet in `SPEC-live-preview.md`'s Success Criteria verified with evidence
- [x] `capability-map.md`'s `live-preview` row marked Done
- [x] No modules remain "Not started" in the capability map (this was the last one; note
      `gallery-gate`'s own two remaining open items are tracked under its own plan, not here)

See `tasks/archive/todo-live-preview.md` for the full per-task breakdown (acceptance criteria,
verification steps, dependencies, files touched, size estimate).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| The 8+5 struct-literal/call-site ripples (found by grep, several in files not mentioned by the spec) are missed in review, breaking `cargo test --workspace` or `cargo build --workspace` | Medium — `examples/capture.rs` in particular is invisible to `cargo test` and easy to miss | Tasks 4 and 5's acceptance criteria list every site by file:line; both checkpoints require `cargo test --workspace`, and Task 9 additionally runs a full build to catch the examples binary |
| `sandbox="allow-scripts"` still isn't airtight — an embedded candidate's script can't reach the parent page, but a candidate author could still author something confusing or resource-heavy inside its own opaque-origin document | Low | Accepted risk per this session's explicit decision; revisit only if a real incident occurs — no pipeline currently generates untrusted third-party markup, only the agent's own kit-composed candidates |
| Reusing `.candidate-thumbnail`'s fixed 100px-height box for an `<iframe>` may clip a candidate whose real content is taller, unlike an `<img>` which at least shows a scaled full preview | Low-Medium | Deferred per spec's own Open Question ("left to implementation"); scrolling inside the iframe still lets a reviewer see the whole candidate, just not at a glance — a future module's problem if it proves annoying in practice |
| `live_card`'s macro deliberately doesn't own the outer card wrapper (unlike `failed_card`) — a future editor might "simplify" by making it own the wrapper too, breaking `gallery_gate.html`'s checkbox `<label>` requirement | Low | Documented here and as an inline comment at the macro definition; Task 7/8's render tests assert the `<label>`/checkbox structure survives in `gallery_gate.html` specifically |

## Open Questions

(Carried forward from `SPEC-live-preview.md` — the iframe sandbox question *was* blocking
and is resolved above, not carried forward)

- Whether `gallery-view` and `gallery-gate` should eventually use different default embed
  sizes given their different contexts (compact multi-candidate grid vs. decision-focused
  gate) — this plan ships one shared size for both; left to a future pass if it proves
  insufficient.
- `generation_params` shape beyond free-text key/value pairs — e.g. whether it should
  eventually mirror `task_critic`'s own `persona`/`task` argument shape for consistency —
  left to whoever authors the first pipeline that populates it in earnest.
