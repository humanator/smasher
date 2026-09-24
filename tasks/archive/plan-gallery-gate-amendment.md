# Implementation Plan: `gallery-gate` — Amendment (2026-09-18)

## Overview

`gallery-gate` is marked `Done` in `capability-map.md` and its original plan/todo
are archived (`tasks/archive/plan-gallery-gate.md`, `tasks/archive/todo-gallery-gate.md`,
assumptions 1–7, all shipped and live-verified by 2026-09-17). `SPEC-gallery-gate.md`
has since picked up a 2026-09-18 amendment — four more decisions (8–12), confirmed
with Jobsworth, explicitly marked **not yet started**. This plan covers only that
amendment: nothing here touches assumptions 1–7's shipped behavior.

Grounded by reading the actual current code (not the spec's prose alone) before
writing tasks:
- `crates/smasher-attractor/src/interviewer.rs`: `GalleryAnswer` (line 742) has
  exactly `selected`/`decision`, no `comments` field yet; `InterviewerHandler::execute`'s
  free-form branch (lines 705–717) builds a 2-key JSON object at two call sites.
- `crates/smasher-web/src/routes/gallery.rs`: `GateDecision`/`GateDecisionRequest`
  (lines 33–46) have no `comments` field; `validate_decision` (line 52) has no
  comment validation; the `GateDecision { selected, decision }` construction site
  inside `submit_gallery_decision` will need a third field.
- `crates/smasher-web/templates/gallery_gate.html`: no `<textarea>` per candidate;
  the submit script (lines 61–88) only collects `selected` checkboxes.
- `crates/smasher-web/src/decision_history.rs`: `GalleryDecision` (line 12) has no
  `comments` field; `gallery_decisions()` doesn't read one.
- `crates/smasher-web/src/routes/pages.rs`: `run_questions` (line 697) does not
  filter the gate's own question out of `questions` — `question_card.html` today
  renders both the gate card and a redundant plain free-text box for the same
  question. Also: `gallery_question_id` (an `Option<String>`) is consumed by
  value inside the `gate.and_then(|gate| { ... gallery_question_id? ... })`
  closure that builds `gallery_gate_html` — whoever implements the dedupe filter
  needs it *again* afterward, so it must be cloned before that closure runs, not
  reused as-is. Flagging this now so it isn't rediscovered as a borrow-check
  surprise mid-task.
- `crates/smasher-web/templates/_candidate_card.html`: `live_card` macro's iframe
  branch (line 4) has no `data-src` or reload control.
- `crates/smasher-web/templates/base.html`: already has one global delegated
  script block (lines 22–48, the `data-poll`/`hx-reswap` version-echo logic) —
  the natural home for a page-level reload-button listener, since `live_card` is
  shared between `gallery_gate.html` and `candidate_gallery.html` and both get
  swapped in and out by HTMX polling (a per-card listener would need
  re-attachment on every swap; delegation from `base.html` doesn't).

## Architecture Decisions

- **Comments are additive and backward-compatible everywhere** (assumption 9):
  every new field is `#[serde(default)]` / defaults to empty on the Rust side, so
  every existing test fixture, in-flight answer, and old event-log entry without
  `comments` keeps parsing identically. No breaking change to the canonical JSON
  shape's existing two keys.
- **Comments are never gated behind the checkbox** (assumption 8): the real use
  case is critiquing a candidate the human didn't check. Field is optional,
  4000-char cap enforced server-side only (never client `maxlength`), trimmed-empty
  entries are dropped before they reach the stored JSON.
- **Dedup is keyed off the rendered `Option`, not off node shape** (assumption 12):
  only suppress the plain question card when `gallery_gate_html` actually resolved
  to `Some(_)`. A paused run must never end up with zero way to answer.
- **Reload is a parent-frame `src` reassignment, never a `contentWindow` call**
  (assumption 11): works regardless of the iframe's `sandbox` attribute lacking
  `allow-same-origin`. Scoped to the `live_card` macro's iframe branch only — the
  `<img>` fallback branch gets no button, since there's nothing to reset.
- **No new dependency.** `std::collections::HashMap` and `serde`'s
  `#[serde(default)]` are already used elsewhere in these files; the reload
  control is plain inline JS matching the existing script style.
- **Scope stays "pipeline context only."** Per the spec's Open Questions, this
  amendment captures and displays comments; it does not wire them into how
  upstream generation nodes consume that feedback on an `iterate` edge. That's a
  deliberately deferred, separate decision — not part of this task list.

## Dependency Graph

```
interviewer.rs: GalleryAnswer.comments + 3-key JSON   (Task 1)
        │
        ▼
gallery.rs: GateDecision/Request.comments + validation (Task 2)
        │
        ▼
gallery_gate.html: per-candidate textarea + submit JS  (Task 3)
        │
        ▼ (real submitted comments now exist to display)
decision_history.rs + pages.rs + decision_history.html (Task 4)
 (comments in history)

pages.rs run_questions: dedupe plain question card     (Task 5)  — independent
_candidate_card.html: reload button + base.html script (Task 6)  — independent
```

Tasks 1→2→3→4 form one chain (the comments capability, engine → validation →
UI → history-display). Tasks 5 and 6 are independent UI fixes with no data
dependency on the comments chain or on each other — safe to do in parallel with
Tasks 1–4, or in either order.

## Task List

### Phase 1: Comments — engine + validation
- [x] Task 1: `GalleryAnswer.comments` field + 3-key handler JSON
- [x] Task 2: `GateDecision`/`GateDecisionRequest.comments` + `validate_decision` rules

### Checkpoint: Comments accepted end-to-end (backend only)
- [ ] `cargo test -p smasher-attractor interviewer` and `cargo test -p smasher-web` green
- [ ] `cargo clippy -p smasher-attractor -p smasher-web` clean
- [ ] A hand-built `curl` POST with a `comments` object against a live `smasher serve`
      run is accepted and the canonical JSON in context contains it
- [ ] Human review before touching templates

### Phase 2: Comments — UI + history display
- [x] Task 3: Per-candidate comment textarea + submit script wiring
- [x] Task 4: Decision-history comments display

### Checkpoint: Comments visible in the dashboard
- [ ] `cargo test -p smasher-web` green
- [ ] Manual (Browser tool): type a comment into an *unchecked* candidate, submit
      an edge decision, confirm the payload/context holds it under the right
      candidate id, and `decision_history.html` then shows it
- [ ] A pre-amendment decision-history fixture (no `comments` key) still renders
      unchanged — regression, not just new-path testing
- [ ] Human review before the independent UI fixes

### Phase 3: Independent UI fixes
- [x] Task 5: Suppress duplicate plain question card for the gate's own question
- [x] Task 6: Live-preview reload button on embedded candidate cards

### Checkpoint: Amendment complete
- [x] `cargo test -p smasher-attractor -p smasher-web` and `cargo test --workspace`
      pass with zero warnings; `cargo clippy --workspace` stays clean (same 5
      pre-existing `smasher-attractor` warnings as before, none new)
- [x] Every pre-amendment test (assumptions 1–7's behavior) still passes unchanged
- [ ] Manual (Browser tool): paused run shows exactly one input surface for the
      gate's own question; a second, genuinely non-gallery pending question on
      the same run still renders its plain card — **not run in this autonomous
      pass, needs Jobsworth**
- [x] Manual (Browser tool): reload control on a live-bundle candidate returns its
      iframe to the bundle's start after being stepped through to the end —
      **confirmed live by Jobsworth 2026-09-18** in `gallery_gate.html`, after
      fixing a new-tab-navigation bug (`b422f51`); `candidate_gallery.html`
      shares the same macro/script and wasn't affected by that bug but hasn't
      had its own independent check
- [x] Update `SPEC-gallery-gate.md`'s amendment Success Criteria checkboxes
      (currently "not yet started") to checked, with evidence per item, same style
      as the assumptions 6–7 amendment's "done 2026-09-17" section — the two
      browser-only items are left unchecked with an implemented-but-unverified note
- [x] `capability-map.md`'s `gallery-gate` row stays `Done` — no status change
      needed, this was a follow-up amendment to an already-shipped module, not a
      re-open; confirmed explicitly, no edit made
- [ ] Human review — ready to move `tasks/plan.md`/`tasks/todo.md` to
      `tasks/archive/` per this repo's convention once approved

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `gallery_question_id` moved into the `gallery_gate_html` closure before Task 5 needs it again | Low — compile error, not a silent bug | Flagged above; Task 5's description calls out cloning it before the existing closure runs |
| A comment silently truncated or dropped server-side instead of erroring | Med — human's feedback vanishes without warning | Spec assumption 8 requires an over-length comment to error, not truncate; Task 2's acceptance criteria test this explicitly |
| Reload button implemented via `contentWindow` instead of parent `src` reassignment | Med — throws on a sandboxed cross-origin frame lacking `allow-same-origin` | Task 6 description states the exact required technique; spec Boundaries calls this out as a "never do" |
| Dedup filter keyed off "is this node gallery-shaped" instead of "did the card actually render" | High — a run could end up with zero way to answer a stuck question | Task 5 keys the filter off `gallery_gate_html`'s `Option`, matching assumption 12 exactly; test covers the template-render-failure fallback path |
| Comments chain (Tasks 1–4) and independent fixes (Tasks 5–6) both touch `pages.rs` | Low — same file, different functions (`run_questions` region vs `TemplateDecision`/`DecisionHistoryTemplate` region) | No shared symbols; sequential edits in one session avoid merge friction, parallel sessions should coordinate on this one file |

## Open Questions

- Per-candidate comments are captured and displayed but not wired into how
  upstream generation nodes consume that feedback on an `iterate` edge — spec's
  own Open Questions section defers this explicitly ("pipeline context only" for
  this pass). Not in scope for any task above.

## Parallelization

- Sequential: Task 1 → 2 → 3 → 4 (engine → validation → UI → history display).
- Parallel-eligible: Task 5 and Task 6 against each other, and against the
  Phase 1/2 chain — no shared files with Tasks 1–3, and only touches a different
  region of `pages.rs` than Task 4.
