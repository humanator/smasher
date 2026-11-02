# Implementation Plan: `run`

Spec: [SPEC-run.md](SPEC-run.md) (approved 2026-11-02), part of [CAPABILITY_MAP.md](CAPABILITY_MAP.md).
The task list is in [todo-run.md](todo-run.md).

## Overview

This plan rebuilds `/runs/{id}` to match the Run artboard: toolbar, a hero block per state,
candidates, a decision bar, decision history, and a right-hand panel with Progress, Activity and
Details tabs. It also surfaces Resume. It needs three server changes (a `steps` endpoint, a
`resumable` field, and a fix so a resumed run keeps its workflow link and checkpoints) and one
desktop change (reveal a run folder in Finder).

Order: server work first because the UI reads it, then pure logic in `lib/` with unit tests, then
the page one section at a time. The page stays working at every commit: the new `RunPage` first
wraps the old sections, and each later task swaps one of them out.

## Starting state (checked 2026-11-02)

- Branch `claude/agent-skills-frontend-design-f96332`, clean at `917e3719`. `shell-theme`,
  `dashboard` and `workflow-detail` are archived.
- `/runs/{id}` is composed inline in `App.svelte` from `RunDetail`, `EventLog`, `QuestionCard`,
  `GalleryGate`, `CandidateGallery` and `DecisionHistory`. Nothing is wrapped in a page component.
- `summariseRunError`, `statusBadge`, `runTitle`, `stepLabel`, `orderSteps`, `stepKinds`,
  `formatWhen*`, `formatDuration` and the `reveal_in_finder` plumbing already exist.
- `resume_run` (`routes/api.rs`) launches the new run with `workflow_id: None` and
  `use_checkpointing: false`. `submit_pipeline` and `run_workflow` checkpoint.

## Architecture Decisions

- **Steps come from the run's own graph.** `GET /api/runs/{id}/steps` parses the stored
  `dot_source` (live) or `graph.dot` (rehydrated) and returns nodes and edges in the editor-graph
  shape, so `orderSteps` and `stepLabel` work on it unchanged. Failure to parse returns empty
  lists, and the page then lists the steps it has seen in events.
- **One event fold.** `stepProgress(steps, events)` in `lib/runProgress.ts` is the only place
  that turns events into step state, run counts, durations and "went back" counts. Progress tab,
  the Running hero ("Now running {step}") and the Failed hero's step name all read it.
  It must give the same result after an SSE replay as live.
- **Labels are shared.** The page builds `labels: Map<id, label>` from the steps once and passes
  it to `summariseRunError`, the Activity log and Progress.
- **`resumable` is computed server-side.** Failed/Aborted and the checkpoint file exists and
  parses. The page never infers it.
- **Resume fix.** `resume_run` passes the original record's `workflow_id` and
  `use_checkpointing: true`. A resumed run then appears in its workflow's history and can be
  resumed again. The new run's id is returned as today.
- **Reveal run folder.** The existing command only accepts `.dot` files inside workflow dirs.
  Add a second pure validator, `validate_reveal_run_dir`, that accepts an existing directory
  inside the server's runs base directory (held in managed state like `WorkflowDirs`), and a
  `reveal_run_folder` command wrapping the same `open -R` call. Both go in `COMMANDS`, `build.rs`
  and the capability file; `capabilities_test` checks they agree. The spec said "extend"; two
  narrow commands keep each validator single-purpose and avoid widening the first.
- **Gate buttons are driven by the gate's edges.** `GalleryGate` today renders one button per
  outgoing edge. The Decision bar maps the two known decisions to "Try Again with My Notes"
  (iterate) and "Approve Selected" (approve) and renders any other edge as an extra outline
  button, so no workflow loses a route. Approve stays disabled with nothing selected only for the
  `approve` edge.
- **Reuse, restyle, retire.** `CandidatePreview`, `ScorecardBadges`, `CandidateParams` and the
  gate API calls are kept. `GalleryGate` and `CandidateGallery` merge into a `Candidates`
  section plus a `DecisionBar`, because the design puts the grid and the controls in different
  places. `RunDetail`, `RunMetaList`, `TokenCounter` and `EventLog` go once their replacements
  land (their tests move with them, not deleted).
- **Panel state.** Open/closed and tab live in `localStorage` (try/catch), default open at
  ≥1100px. Below 768px it renders as a sheet using the existing sheet primitive.
- **Plain event vocabulary.** `eventFormat` returns `{label, detail, tone, level}` with
  `level: 'key' | 'all'`. The 17 kinds map to the spec's labels. Existing tone and tint rules
  stay. The scroll-anchoring logic moves with the log into `ActivityLog`.

## Dependency Graph

```
T1 resumable ─┐
T2 steps     ─┼─> T5 api client ─> T6 runProgress ─┬─> T9 toolbar+hero ─> T10 resume UI
T3 resume fix ┘                    T7 failureAdvice ┤                     │
T4 reveal run folder ──────────────────────────────┘ (used in T9 hero)    │
T8 event vocabulary ─────────────────────────────────> T13 activity       │
                                  T9 ─> T11 candidates+bar ─> T12 question card
                                  T9 ─> T14 panel+progress ─> T13 ─> T15 details, retire old
                                                                        ─> T16 e2e ─> T17 visual/a11y
```

T1–T4 are independent of each other and of T6–T8, so they can run in parallel.

## Phases

- **Phase 1, server and desktop (T1–T4):** Rust only. Checkpoint: `cargo test -p smasher-web`,
  `cargo test -p smasher-desktop`, clippy and fmt clean.
- **Phase 2, logic (T5–T8):** API client and pure helpers with unit tests. Checkpoint: Vitest,
  check and lint clean; no UI change yet.
- **Phase 3, page (T9–T15):** one section per task. Checkpoint after T11 (core flows: run, answer
  a gallery gate) and after T15 (old components retired).
- **Phase 4, proof (T16–T17):** E2E, existing-spec updates, responsive and accessibility pass,
  visual comparison, verification doc, archive.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Event fold disagrees with the engine on loops or retries | High | Build the unit tests from real event sequences recorded from `fail_tool.dot` and `gate_only.dot`; add a replay-idempotence test |
| `steps` endpoint for rehydrated runs reads a missing `graph.dot` | Med | Return empty lists, test it, and keep the event-derived fallback |
| Resume fix changes behaviour other callers rely on | Med | Only `resume_run` changes; add Rust tests for workflow link, checkpointing and a second resume |
| Gate with more than two edges breaks the Decision bar | Med | Generic extra buttons (see Architecture Decisions); component test with three edges |
| Existing specs (`event-log`, `gallery-gate`, `question-card`, `run-summary`, `question-replies`, `critical-path`, `no-tauri-breakage`) break on new selectors | Med | Update selectors in the same task that changes the markup; `critical-path` is edited but never run (it spends tokens) |
| Concurrent flaky store test seen in workflow-detail | Low | Run the full suite twice before the checkpoint; note flakes rather than retrying silently |
| Phone-width layout of hero + bar + sheet | Med | Playwright 375px check in T16, not left to the end |

## Out of Scope

New workflow features, changes to the Run dialog or the shell, the editor, and the Components
board update. Changing resume semantics beyond carrying `workflow_id` and checkpointing.
