# Spec: `run`

Module of [CAPABILITY_MAP.md](../CAPABILITY_MAP.md). Status: **Approved 2026-11-02.**
Depends on: `shell-theme` (tokens, primitives, `stepKinds`, `AppShell`/`Toolbar`, page-header
context, `libraryStore`). It also reuses the `workflow-detail` and `dashboard` helpers
(`summariseRunError`, `statusBadge`, `formatWhen`, `formatDuration`, `questionKind`, `runTitle`,
`LazyRunDialog`, `stepLabel`).

Design reference: [Run](../../docs/design/redesign/Run.dc.html) (1440×900). It draws four states
(`waiting`, `running`, `completed`, `failed`) and one transient state (`iterating`).

## Objective

Rebuild the run page (`/runs/{id}`) so someone who has never read a DOT file can:

1. **Tell at a glance what state the run is in** and what, if anything, it wants from them. One
   hero block says so: Needs you, Now running, Finished, or Couldn't finish.
2. **Answer a paused run** without hunting for the control. Candidate choices, notes and the
   two decisions sit in one place, with the consequence of each stated.
3. **Understand a failure and act on it.** The failed hero names the step, shows the engine's
   message and lists what to try. It never guesses a cause the engine didn't report.
4. **Follow progress** in plain language: a step list with each step's state and timings, and an
   activity log that defaults to key moments.

### Decisions already made (capability map, 2026-10-14)

Screens win over the component board; additive API only; every capability the old page has is
still reachable.

### Decisions for this module

| # | Proposal |
|---|---|
| D1 | The step list comes from a new additive `GET /api/runs/{id}/steps`, built from the run's own stored `dot_source`. It does not use the workflow's current file, which may have been edited since. Ad-hoc runs have no workflow file, so this is the only source that covers them. |
| D2 | Per-step state and timings (`Ran twice · 2m 41s`, `went back once`) are derived client-side from the SSE event stream, which already replays history. No other API change. |
| D3 | "What you can try" is a small client-side table of known failure patterns mapped to advice, with a generic fallback ("Open the workflow in the editor and check this step's settings."). Unmatched errors get only the fallback. |
| D4 | **Confirmed:** the Pipeline Graph SVG goes. The Progress tab replaces it, so graph polling and `graphError` are removed from the page. |
| D5 | **Show Results in Finder** reuses the desktop `reveal_in_finder` command, extended to accept a run's working directory. **Confirmed.** |
| D6 | Question-type gates (`QuestionCard`: choice, yes/no, free text) are not in the design. They render as a card in the main column under the hero, in the same style. The bottom decision bar is for gallery gates only. **Confirmed.** |
| D8 | **Resume is surfaced.** `POST /api/runs/{id}/resume` continues a Failed or Aborted run from its last checkpoint, skipping steps that already finished, and returns a **new run id**. The UI offers it only when the run is resumable, then navigates to the new run. See R9. |
| D7 | An **Aborted** run uses the failed layout with the heading "Stopped by you" (neutral tone, no "What you can try", Run Again offered). **Confirmed.** |

## Requirements

### R1. Toolbar (via the page-header context)

- Back button, ghost icon, linking to the run's workflow (`/workflows/{id}`) when it has one, else
  `/`. Accessible name **Back to {workflow title}** or **Back to Workflows**.
- Title: `runTitle(run, workflows)`, followed by a status badge from `statusBadge` (Needs you,
  Running, Completed, Failed, Aborted). Subtitle: run id in mono, then `Started {when}` and the
  elapsed time: "3 min 45 s so far" while active, "10 min 35 s" once finished.
- Right side, in order: **Abort Run** (destructive, `stop` icon; only while active; shows
  "Aborting…" while the request is in flight) or **Run Again** (outline, `refresh` icon; only when
  finished; opens the Run dialog for the workflow, or is hidden for ad-hoc runs). A resumable run (D8) also shows **Resume** (outline, `play` icon) before Run Again, a divider, then
  the **Run information** toggle (ghost icon, `aria-pressed`, `aria-expanded`).
- While loading the title reads "Run" with no actions. If the run is unknown the title is
  "Run not found" and the body says so with a link to Workflows.

### R2. Hero (one of, by state)

| State | Content |
|---|---|
| Needs you | Eyebrow in accent: `{gate title} · Ask a person` (the step's plain kind). Heading: the question text. Nothing else; the controls are below. |
| Running | Card with eyebrow "Now running", the current step's label as heading, one sentence on what that kind of step does (from `stepKinds`), and an indeterminate progress bar. `aria-live="polite"`. Honours `prefers-reduced-motion` (static bar). After an iterate decision: "Making new candidates from your notes" and "Your decision was recorded. The workflow has gone back to {step} for another round." |
| Completed | Green card, check icon, heading `Finished in {duration}`, one sentence ("You approved concept-a. The workflow then ran to the end." if a decision exists, else "All {n} steps ran to the end."), and **Show Results in Finder** (desktop only, D5). |
| Failed | Red `role="alert"` card, warning icon, heading `{step label} couldn't finish`, the engine message from `summariseRunError` in a mono block, **What you can try** (D3), then, when resumable, **Resume from {step}** (default, with a line saying finished steps aren't repeated); **Open in Editor** (outline, to `/workflows/{id}/edit`, hidden for ad-hoc runs) and **Run Again** (default only when Resume isn't offered, else outline). |
| Aborted | D7, plus **Resume** when resumable. |

### R3. Candidates

- Shown when the run has gallery candidates (waiting, iterating, completed). Heading
  "Candidates" with the existing "Expected {n}, found {m} · {k} could not be rendered" meta.
- Responsive grid, `minmax(240px, 1fr)`. Each ok card: preview (existing `CandidatePreview`,
  keeping sanitised screenshots and bundle links), mono id, **Select** toggle (`aria-pressed`;
  becomes **Selected** with a check) only while the run is waiting, a **Chosen** badge once
  approved, scorecard badges with a technical `title` ("Shown as `lint` in the workflow engine")
  and plain labels (existing `ScorecardBadges`), and an **Add a Note…** link that opens a
  labelled textarea ("Note for {id}"). A saved note reads `Your note: …`.
- A failed candidate shows a dashed warning tile, its id and the reason in the destructive colour.
- Selected ring uses the accent; chosen uses success; neither relies on colour alone (the button
  text and badge carry it).

### R4. Decision bar

- Only for a waiting gallery gate. Pinned to the bottom of the main column (`role="region"`
  labelled **Decision**).
- Left: "What should happen next?" with an info tooltip (also reachable by focus) stating what each
  button does, and a status line: "Nothing selected yet. Select the candidates you want to keep."
  or "2 selected: concept-a, concept-b".
- Right: **Try Again with My Notes** (outline, large) and **Approve Selected** (default, check
  icon, disabled while nothing is selected). Both disable while submitting; failures show inline
  in the bar, never as a toast. Existing gate semantics are unchanged (approve / iterate
  decisions, per-candidate comments, submit once).
- Phone width: the bar stacks; buttons are full width.

### R5. Your decisions

Shown when the run has recorded decisions. One card each: "Pick a favourite" (the gate's plain
title), a badge with the decision ("approve" / "iterate" rendered as **Approved** / **Sent back**),
the time, the selected ids as outline badges with a success dot, "Nothing selected" when empty,
and `{id}: {note}` lines.

### R6. Run information panel (right, 300px)

Toggle from the toolbar; open by default at ≥1100px, closed below. Open state is remembered per
viewer in `localStorage` (wrapped in try/catch). Below 768px it opens as a sheet over the page.
Tabs: **Progress**, **Activity**, **Details** (roving tabindex, arrow keys).

- **Progress:** header with `{done} of {total} done`. Ordered list of steps (running order from
  the `steps` endpoint, via `orderSteps`). Each row: status dot (done ✓, failed ✕, waiting ?,
  running spinner, pending hollow), step label, and a meta line `{kind label} · {state/timing}`:
  "Ran twice · 2m 41s", "Ran twice · went back once", "Waiting for you", "Answered · 6m 28s",
  "Stopped with an error", "Second run in progress". Glyphs are `aria-hidden`; the state is also
  in text for screen readers.
- **Activity:** **Key moments** / **Everything** toggle group (default Key moments) and one
  sentence of help text that changes with the choice. Newest first. Each line: time, tone dot,
  label, detail. Agent lines indent. Needs-attention lines get a tinted background. Plain labels
  replace the engine's: Run started, Step started, Step finished, Step failed, Waiting for you,
  Answer received, Went back (loop n), Tool call, Agent, Tokens, Run completed, Run failed,
  Run stopped. Key moments are run/step/gate/loop events; Everything adds tool calls, agent
  messages and token lines. The scroll-anchoring behaviour of the current `EventLog` is kept.
  The first `Waiting for you` event still raises a native notification.
- **Details:** `dl` of Started (with elapsed), Input tokens ("Text sent to the AI"), Output tokens
  ("Text the AI wrote back"), Total tokens, Working folder ("Where this run saves its files"),
  Token counts keep
  polling every 3 s while the run is active.

### R7. Live behaviour

- The run, tokens and graph poll as they do today (5 s, 3 s, 3 s) and stop when the run ends,
  with one last fetch. SSE history replay still rebuilds the whole page after a reload.
- Phone width (375px): single column; the panel is a sheet; no sideways scroll.

### R9. Resume (D8)

- Resumable means: status Failed or Aborted, and a checkpoint exists on disk. The server says so
  through a new `resumable` boolean on `RunSummary` (see API additions), so the page never offers
  a button that will 500.
- **Resume** posts to `/api/runs/{id}/resume`, shows "Resuming…" while in flight, and on success
  navigates to `/runs/{new_id}`. A failure shows inline in the hero or toolbar, never a toast.
- Not offered for Completed runs or while active.

### R8. Not changing

Server run lifecycle, SSE event shapes, question and gallery endpoints, decision payloads, the
Run dialog, and the shell. The only server additions are `GET /api/runs/{id}/steps` and `RunSummary.resumable`.

## API additions

### D1 steps

`GET /api/runs/{id}/steps` → `{ "steps": [{ "id", "node_type", "label" }], "edges": [{ "from", "to", "label"?, "priority"? }] }`.
Read-only, built from the run's stored `dot_source` (live runs from `state.rs`, finished runs
from `graph.dot` via `rehydrate.rs`). 404 for an unknown run. A graph that no longer parses
returns 200 with empty lists, and the page falls back to steps seen in the event stream.
Rust tests: known run, finished (rehydrated) run, unknown id, unparsable graph.

### D8 resumable

`RunSummary` gains `resumable: bool` (true for Failed/Aborted runs whose
`checkpoints/checkpoint.json` exists and parses). Additive and read-only. Rust tests: failed run
with checkpoint, failed run without, completed run, running run.

## Commands

```bash
cd frontend && npm run test -- --run tests/components/dashboard   # run-page component tests
cd frontend && npm run test -- --run tests/lib                     # helpers
cd frontend && npm run test:e2e -- run-page.spec.ts                # new E2E (no LLM calls)
cd frontend && npm run check && npm run lint && npm run build:check
cargo test -p smasher-web && cargo clippy -p smasher-web -- -D warnings
cargo test -p smasher-desktop                                      # only if D5 is approved
```

## Project Structure

```
crates/smasher-web/src/routes/api.rs                 → GET /api/runs/{id}/steps
frontend/src/lib/api/runs.ts                         → getRunSteps(); `resumable` on RunSummary
frontend/src/lib/runProgress.ts                      → NEW: events → per-step state/timing (pure)
frontend/src/lib/failureAdvice.ts                    → NEW: error → "What you can try" (pure)
frontend/src/lib/eventFormat.ts                      → plain labels + key/all level
frontend/src/components/run/                         → NEW: RunPage, RunHero, RunToolbarActions,
                                                       DecisionBar, RunPanel, ProgressList,
                                                       ActivityLog, RunDetails
frontend/src/components/dashboard/                   → reuse Candidate*, GalleryGate, QuestionCard,
                                                       DecisionHistory, ScorecardBadges; retire
                                                       RunDetail, RunMetaList, TokenCounter,
                                                       EventLog once superseded
frontend/tests/ and frontend/e2e/run-page.spec.ts    → mirror src; one E2E spec
```

## Code Style

Follows the capability map: runes only, two `ABOUTME:` lines, `$lib/components/ui` primitives and
theme tokens, no raw hex. Pure logic lives in `lib/` so it is unit-tested without a DOM.

```ts
// ABOUTME: Folds a run's pipeline events into one state per step for the Progress tab
// ABOUTME: Pure; the SSE history replay means a reloaded page rebuilds the same result

export type StepState = 'pending' | 'running' | 'done' | 'failed' | 'waiting';
export interface StepProgress { id: string; state: StepState; runs: number; durationMs: number; wentBack: number }
export function stepProgress(steps: readonly { id: string }[], events: readonly PipelineEvent[]): StepProgress[] { … }
```

## Testing Strategy

- **Unit (Vitest):** `stepProgress` (single run, loops, failure, waiting, replay idempotence),
  `failureAdvice` (each known pattern, fallback, never invents a cause), plain event labels and
  key/all levels, elapsed formatting.
- **Component (Testing Library):** hero in each state; candidate select/note/chosen/failed;
  decision bar (disabled, submitting, error, stacked); panel tabs with keyboard; progress and
  activity rendering; details; toolbar actions per state; not-found and loading.
- **Integration (Vitest against real `smasher-web`):** `getRunSteps` for a live and a finished run.
- **Rust:** four tests for the `steps` route (above).
- **E2E (Playwright, no LLM calls):** `run-page.spec.ts` against `gate_only.dot` and the
  failing-tool fixture from workflow-detail: running → needs you → pick and approve → completed;
  failed run shows the step, message and advice; panel toggle and tabs by keyboard; focus rings;
  no sideways scroll at 375px. Update `event-log`, `gallery-gate`, `question-card`, `run-summary`
  and `question-replies` specs for changed selectors; do not delete them.
- No LLM-spending tests. Zero warnings from check, lint, Vitest and clippy.

## Boundaries

- **Always:** TDD; `ABOUTME:` headers; theme tokens; real buttons/labels; visible focus rings;
  4.5:1 contrast in light and dark; `aria-live` only on the hero; commit after each green task;
  keep every gate action (approve, iterate, comments, answers, abort) reachable.
- **Ask first:** any API
  change beyond `steps` and `resumable`; new dependencies.
- **Never:** invent causes or advice the error doesn't support beyond the D3 table; hard-code
  counts, durations or ids; fake window controls; remove or skip failing tests; run LLM tests
  unasked; push or open a PR unasked.

## Success Criteria

1. At 1440×900 each of the four states matches the artboard in layout, hierarchy, copy and tokens.
2. A waiting gallery run can be approved, or sent back with notes, using only the decision bar;
   Approve is disabled until something is selected.
3. A failed run shows the failing step's name, the engine message and at least one suggestion;
   an unmatched error shows the message and the generic suggestion only.
4. The Progress tab matches the run: the same steps in running order, loop counts correct, and
   identical after a page reload mid-run.
5. Activity defaults to Key moments; Everything adds tool calls, agent text and token lines.
6. Abort, Run Again, Open in Editor and (desktop) Show Results in Finder work and appear only
   when they apply.
7. Keyboard: every control reachable by Tab with a visible focus ring; tabs by arrow keys.
8. 375px: no sideways scroll with a candidate grid, the decision bar and the sheet open.
9. All gates in the capability map pass with zero warnings.

## Resolved Questions

1. **Resume loses the workflow link:** fix it in this module. The resume endpoint carries
   `workflow_id` forward and keeps checkpointing on (Task 3 of the plan).
2. **Wording:** "Resume from {step}" next to "Run Again" is clear enough as it stands.
