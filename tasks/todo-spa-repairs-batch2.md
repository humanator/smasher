# Todo: SPA port repairs, batch 2

Plan: [`plan-spa-repairs-batch2.md`](plan-spa-repairs-batch2.md). Spec:
[`SPEC-spa-repairs-batch2.md`](SPEC-spa-repairs-batch2.md).

**Before any Vitest or Playwright run:**
1. Quit the desktop app.
2. From the repo root, run
   `SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI="$PWD/frontend/tests/fixtures/fake-claude.sh" cargo run -p smasher-cli -- serve`.

**Rules for every task:**
- All commands below run from `frontend/`.
- Every test run starts at a gate, or at the invalid-args tool node, and is cancelled in
  `afterEach` or `finally`.
- Never set `SMASHER_LLM_TESTS=1`.
- Write the test first and watch it fail, then implement.
- Commit after each task.

---

## Phase 0: Fixtures

## Task 1: `tests/fixtures/graphs.ts`, with each graph proven through the real API

**Description:** Export these DOT strings:
- `RUN_FAIL_CHECK`
- `QUESTION_KINDS`
- `LOOP_CHECK`
- `ANONYMOUS_GATE`: `digraph { start [shape=Mdiamond]; exit [shape=Msquare]; g [shape=hexagon,
  label="x"]; start -> g -> exit }`

Start from the spec's Project Structure section. Also export `submitGraph(dot)`, which calls
`runsApi.submitRun` and records the run id, and `cancelAll()`. Add `tests/fixtures/graphs.test.ts`,
which proves each graph against the real server.

**Acceptance criteria:**
- [x] `RUN_FAIL_CHECK` reaches `Failed`. Its `error` contains `invalid JSON in args attribute`,
      and it has `completed_at`.
- [x] `QUESTION_KINDS` asks three questions in order. Their kinds are `multiple_choice` (choices
      `Red`, `Blue`, `Green`), then `approval`, then `free_form`. Answering all three gets the run
      to `Completed`.
- [x] `LOOP_CHECK`:
  - [x] answering `again` gives a `loop_restarted` event with `restart_count: 1` and asks the gate
        again;
  - [x] answering `done` completes the run;
  - [x] if a restart to `start` isn't allowed, the graph loops to a second gate instead, and the
        spec's fixture listing is updated to match. Not needed: the restart to `start` works.
- [x] `ANONYMOUS_GATE` gives a run with `graph_name === null`.
- [x] No graph contains `shape=box`, and every tool node has invalid `args`. A test checks both
      conditions against the strings.

**Verification:**
- [x] `npm test -- --run tests/fixtures/graphs.test.ts`

**Dependencies:** None

**Files:** `frontend/tests/fixtures/graphs.ts`, `frontend/tests/fixtures/graphs.test.ts`

**Scope:** S

---

## Phase A: `run-summary`

## Task 2: `lib/runStatus.ts` and `lib/graphError.ts`

**Description:**
- `runStatus.ts` exports `TERMINAL_STATUSES`, `isActive(status)` and
  `pickFeaturedRun(runs)`. See the plan's Architecture decisions for its return shape. It's built
  now, even though the card is Task 19, so the status logic lives in one place.
- `graphError.ts` exports `graphErrorMessage(message)`.
- `RunDetail` imports `TERMINAL_STATUSES` from `runStatus.ts` instead of defining it.

**Acceptance criteria:**
- [ ] `isActive('Running')` is true. It's false for `Completed`, `Failed` and `Aborted`.
- [ ] `pickFeaturedRun`:
  - [ ] `[]` gives `null`;
  - [ ] the newest `Running` run is picked even when newer terminal runs exist;
  - [ ] with no runs running, the newest run is picked with heading `Latest run`;
  - [ ] `moreRunning` counts the other `Running` runs.
- [ ] `graphErrorMessage`:
  - [ ] a message containing `graphviz not available` gives the old install hint, word for word;
  - [ ] any other message is returned as-is;
  - [ ] `''` gives `Failed to render the pipeline graph`.

**Verification:**
- [ ] `npm test -- --run tests/lib/runStatus.test.ts tests/lib/graphError.test.ts`
- [ ] `RunDetail.test.ts` still passes

**Dependencies:** None

**Files:** `src/lib/runStatus.ts`, `src/lib/graphError.ts`, `src/components/dashboard/RunDetail.svelte`, the two test files

**Scope:** S

## Task 3: `RunMetaList` in `RunDetail`: a failed run shows its error

**Description:** `RunMetaList.svelte` takes `{ run }` and renders a `<dl>` with these rows:
- Completed, formatted with `toLocaleString()`;
- Working Directory, in mono;
- Error, in `text-destructive` with the text wrapping.

Each row shows only when its field isn't null. `RunDetail` mounts it under the actions and above
the token counter.

**Acceptance criteria:**
- [ ] A gated run that is still running shows no Completed, Working Directory or Error.
- [ ] A `RUN_FAIL_CHECK` run shows Completed, Working Directory (`artifacts/…`), and an Error
      containing `invalid JSON in args attribute`.
- [ ] A cancelled gated run shows Completed and no Error.
- [ ] The page-level load error (`role="alert"`) is a separate element from the run's Error row.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/RunMetaList.test.ts tests/components/dashboard/RunDetail.test.ts`

**Dependencies:** Tasks 1 and 2

**Files:** `src/components/dashboard/RunMetaList.svelte`, `RunDetail.svelte`, the two test files

**Scope:** S

## Task 4: Graph polls while running, stops after a final fetch, shows errors inline and fits the width

**Description:**
- **Polling.** In `RunDetail`, a 3s graph interval runs while the run is active. When a terminal
  status arrives, both intervals stop and one last `loadGraph()` runs.
- **Rendering.** Assign `graphSvg` only when the raw SVG has changed. Render it under a
  `Pipeline Graph` heading.
- **Errors.** A failed fetch sets `graphError` through `graphErrorMessage`. It shows inline in
  `text-destructive`, never as a toast, and a successful fetch clears it.
- **Scaling.** The container gets `[&_svg]:h-auto [&_svg]:max-w-full` and drops `overflow-auto`.

**Acceptance criteria:**
- [ ] A gated run renders an `<svg>` under `Pipeline Graph`.
- [ ] While the run is `Running`, more than one graph request happens within about 7s.
- [ ] After the gate is answered and the run completes, the graph requests stop: at most one more
      request in the following 7s.
- [ ] `/runs/no-such-run` shows the graph error text inline, and adds no toast of its own.
- [ ] The SVG carries the scaling classes, and the container has no horizontal overflow class.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/RunDetail.test.ts`. Requests are counted with a
      `PerformanceObserver` or by wrapping the real `fetch` in a pass-through counter. There's no
      mocked response.
- [ ] `npm run test:e2e -- e2e/app-shell.spec.ts` still passes, with 2 toasts.

**Dependencies:** Task 2

**Files:** `src/components/dashboard/RunDetail.svelte`, `tests/components/dashboard/RunDetail.test.ts`

**Scope:** M

## Task 5: `TokenCounter` total, 3s poll and `active` prop

**Description:**
- Add a prop `active = true`.
- An `$effect` runs a 3s interval while `active` is true. When `active` turns false, it runs one
  last refresh and stops.
- Show `Input tokens`, `Output tokens` and `Total tokens`, formatted with `toLocaleString()`.
- Fix the ABOUTME comment about the 5s cadence.
- `RunDetail` passes `active={run ? isActive(run.status) : true}`.

**Acceptance criteria:**
- [ ] On a gated run, the counter shows all three labels, and Total equals Input plus Output.
- [ ] With `active` true, a second token request happens within about 4s.
- [ ] After `active` turns false, exactly one more request happens and then no more.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/TokenCounter.test.ts tests/components/dashboard/RunDetail.test.ts`

**Dependencies:** Task 2

**Files:** `src/components/dashboard/TokenCounter.svelte`, `RunDetail.svelte`, the new `tests/components/dashboard/TokenCounter.test.ts`

**Scope:** S

## Task 6: `RunList` shows `unnamed`, and `graph_name` is typed `string | null`

**Description:**
- Change `RunSummary.graph_name` to `string | null`. Fix any type errors this causes.
- `RunList` renders a muted `unnamed` when `graph_name` is null, empty or whitespace.

**Acceptance criteria:**
- [ ] An `ANONYMOUS_GATE` run's row reads `unnamed`.
- [ ] A named run's row still shows its name.
- [ ] `npm run check` adds no errors.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/RunList.test.ts`
- [ ] `npm run check`

**Dependencies:** Task 1

**Files:** `src/lib/api/runs.ts`, `src/components/dashboard/RunList.svelte`, `tests/components/dashboard/RunList.test.ts`

**Scope:** XS

## Task 7: `e2e/run-summary.spec.ts`

**Description:** The spec:
1. Posts `RUN_FAIL_CHECK` with `page.request.post('/api/runs')`.
2. Opens `/runs/{id}` and checks the Error row, Completed and the rendered graph.
3. Posts `ANONYMOUS_GATE`, checks that the catalog's run list shows `unnamed`, and cancels that
   run in `finally`.

**Acceptance criteria:**
- [ ] The spec passes in Chromium.
- [ ] The spec cancels every run it starts.

**Verification:**
- [ ] `npm run test:e2e -- e2e/run-summary.spec.ts`

**Dependencies:** Tasks 3–6

**Files:** `frontend/e2e/run-summary.spec.ts`

**Scope:** S

## Checkpoint A: `run-summary`
- [ ] `npm test -- --run` passes in full, with no new warnings.
- [ ] `npm run check` and `npm run lint` add no new errors (the 6 existing `svelte-check` errors
      are #2's).
- [ ] `npm run test:e2e -- e2e/run-summary.spec.ts e2e/app-shell.spec.ts` passes.
- [ ] The map row for `run-summary` reads `Done <date>`.
- [ ] Review with Jobsworth before Phase B.

---

## Phase B: `question-card`

## Task 8: Kind badge, question id, first fetch straight away, empty state, store reset

**Description:**
- Make `node_id` optional in the question types (`lib/api/questions.ts`, the store).
- `QuestionCard`:
  - An `$effect` on `runId` resets the store, fetches straight away, then polls every 2s. Its
    cleanup clears the interval and resets the store.
  - Each pending card's header has a `Badge`: `Free Form`, `Multiple Choice` or `Approval`.
  - The id sits next to it in `font-mono text-xs text-muted-foreground break-all`.
  - After the first successful fetch, if there are no pending questions and `gallery_gate` is
    null, the card shows `No pending questions.`
  - Nothing shows before the first fetch.

**Acceptance criteria:**
- [ ] A `QUESTION_KINDS` run shows the `Multiple Choice` badge and that question's id within 1s of
      mounting.
- [ ] A run with nothing pending (a cancelled one) shows `No pending questions.`
- [ ] While a gallery gate is present, `No pending questions.` is absent. This is checked with the
      same gate setup `GalleryGate.test.ts` uses.
- [ ] Re-rendering with a different `runId` drops the first run's answered list.
- [ ] The poll-toast test is updated for the immediate first fetch, and it passes.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/QuestionCard.test.ts tests/stores/questions.test.ts`

**Dependencies:** Task 1

**Files:** `src/lib/api/questions.ts`, `src/stores/questions.svelte.ts`, `src/components/dashboard/QuestionCard.svelte`, `tests/components/dashboard/QuestionCard.test.ts`

**Scope:** M

## Task 9: Free-text Submit button: disabled when blank, keeps the text on failure, blocks double submits

**Description:**
- Free-text cards bind the input to a per-question UI state. The placeholder stays
  `Enter your answer`.
- A **Submit** button is added. Both Submit and Enter call `handleAnswer`, which does nothing when
  the trimmed text is empty.
- The card's controls are disabled while `submitting` is true.
- The text clears only after the answer succeeds.

**Acceptance criteria:**
- [ ] Submit is disabled while the input is empty or whitespace.
- [ ] Typing and clicking Submit answers a real `free_form` question, and it leaves pending.
- [ ] Enter also answers it.
- [ ] A rejected answer keeps the typed text, shows one toast, and re-enables Submit. The existing
      rejection test is extended to check all three.
- [ ] The input and Submit are disabled while the answer is in flight.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/QuestionCard.test.ts`

**Dependencies:** Task 8

**Files:** `src/components/dashboard/QuestionCard.svelte`, `tests/components/dashboard/QuestionCard.test.ts`

**Scope:** S

## Task 10: Multiple choice as radio buttons with Submit; approval buttons block double submits

**Description:**
- Multiple-choice cards render a `<fieldset>` whose `<legend>` is the question text.
- It holds one native `<input type="radio" name="choice-{id}">` per choice, each inside a
  `<label>`, with nothing selected.
- **Submit** is disabled until a choice is selected, then sends that choice.
- The approval Yes/No buttons are disabled while an answer is in flight.

**Acceptance criteria:**
- [ ] On a `QUESTION_KINDS` run, the card shows three unselected radios named `Red`, `Blue` and
      `Green`, and a disabled Submit.
- [ ] Clicking Blue doesn't submit. Clicking Submit answers `Blue`, and the approval question
      appears next.
- [ ] Clicking Yes answers the approval question, and the free-text question appears.
- [ ] The radios can be found with `getByRole('radio', { name })`, and the group with
      `getByRole('group', { name: <question> })`.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/QuestionCard.test.ts`

**Dependencies:** Task 9

**Files:** `src/components/dashboard/QuestionCard.svelte`, `tests/components/dashboard/QuestionCard.test.ts`

**Scope:** S

## Task 11: `e2e/question-card.spec.ts`

**Description:** Post `QUESTION_KINDS`, open `/runs/{id}`, and answer all three questions through
the UI: a radio plus Submit, then Yes, then text plus Submit. The run then reaches `Completed`,
and the card shows `No pending questions.` Cancel in `finally`.

**Acceptance criteria:**
- [ ] The spec passes in Chromium.
- [ ] `e2e/critical-path.spec.ts`'s selectors still exist. The spec isn't run, because it spends
      tokens. The check is a grep for the placeholder in `QuestionCard.svelte`.

**Verification:**
- [ ] `npm run test:e2e -- e2e/question-card.spec.ts e2e/gallery-gate.spec.ts e2e/run-launch.spec.ts`

**Dependencies:** Task 10

**Files:** `frontend/e2e/question-card.spec.ts`

**Scope:** S

## Checkpoint B: `question-card`
- [ ] The full Vitest suite, `check` and `lint` are green, as in Checkpoint A.
- [ ] The Task 11 e2e specs pass.
- [ ] The map row for `question-card` reads `Done <date>`.
- [ ] Review with Jobsworth before Phase C.

---

## Phase C: `event-log`

## Task 12: `lib/eventFormat.ts` for all 17 kinds

**Description:**
- `formatDuration(ms)`.
- `formatEvent(event): EventLine`, following the spec's 17-row table. It has an exhaustive
  `switch` whose `default` branch assigns to `never`, plus a runtime fallback for unknown kinds.
- A private `failureMessage(error)` pulls `error: "…"` out of the Debug string, unescaping
  `\"`, `\\` and `\n`. When the pattern isn't there, it returns the raw string.

**Acceptance criteria:**
- [ ] There's one test per kind, 17 in all, each checking `icon`, `label`, `detail`, `tone`,
      `agent`, `faded` and `tinted` against the spec's table.
- [ ] `formatDuration`: 0 → `0ms`, 999 → `999ms`, 1000 → `1.0s`, 59_999 → `60.0s`,
      61_000 → `1m 1s`.
- [ ] The edge label is shown when set and left out when absent. `is_error` switches the tone
      between green and red. A cost of 0 is hidden and a cost above 0 is shown.
- [ ] `node_failed` with `Failure { error: "boom \"x\"", retryable: false, notes: None }` gives
      `boom "x"`. A plain string passes through unchanged.
- [ ] An unknown kind gives its raw kind, in a muted tone.
- [ ] The line text still contains `Pipeline started` and `Pipeline completed`.

**Verification:**
- [ ] `npm test -- --run tests/lib/eventFormat.test.ts`

**Dependencies:** None

**Files:** `src/lib/eventFormat.ts`, `tests/lib/eventFormat.test.ts`

**Scope:** S

## Task 13: Events store sequence keys, full-JSON de-duplication, and clearing on run change

**Description:**
- The store holds `{ seq, event }` entries.
- It de-duplicates on `JSON.stringify(event)`.
- It exposes `entries`, and keeps `events: PipelineEvent[]` for existing callers.
- `clear()` also resets `seq`.
- Update the ABOUTME lines.

**Acceptance criteria:**
- [ ] Sending the same event twice keeps one copy.
- [ ] Two events with the same kind and timestamp but different payloads keep both.
- [ ] `seq` increases, and `events` stays in arrival order, so the existing store tests pass
      unchanged.
- [ ] `clear()` empties the store and resets `isComplete`.

**Verification:**
- [ ] `npm test -- --run tests/stores/events.test.ts`

**Dependencies:** None

**Files:** `src/stores/events.svelte.ts`, `tests/stores/events.test.ts`

**Scope:** XS

## Task 14: `EventLog` renders newest-first, colour-coded, indented and faded

**Description:**
- The `$effect` on `runId` clears the store and resets `notified`, subscribes, and on cleanup
  unsubscribes and clears again.
- Render `entries` reversed, keyed by `seq`.
- Each line shows the icon, label and detail from `formatEvent`, with the time as
  `toLocaleTimeString`.
- Classes: a tone map for the left border and text, `bg-*/10` when `tinted`, `ml-5 text-xs` for
  agent lines, and `opacity-60` for faded lines.
- The line's root carries `data-tone`, `data-agent` and `data-faded` for tests.
- Long details are truncated, with the full text in a `title`.
- Delete `eventDescription`. The notification body now uses `formatEvent`.

**Acceptance criteria:**
- [ ] On a real `LOOP_CHECK` run (answered `again` once, then `done`):
  - [ ] the first line is `Pipeline completed`;
  - [ ] a `Loop #1` line is present;
  - [ ] the edge and checkpoint lines are `data-faded="true"`.
- [ ] Constructed agent events added to the store render with `data-agent="true"`.
- [ ] Changing `runId` empties the log.
- [ ] `EventLog.test.ts`'s exact-string assertions are moved to the new text, and the whole file
      passes.
- [ ] The completion-notification test still passes.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/EventLog.test.ts`

**Dependencies:** Tasks 1, 12 and 13

**Files:** `src/components/dashboard/EventLog.svelte`, `tests/components/dashboard/EventLog.test.ts`

**Scope:** M

## Task 15: The log follows new events

**Description:**
- The scroll container records `atTop` (`scrollTop <= 8`) on each scroll.
- An `$effect.pre` captures `scrollHeight` before an update, and an `$effect` adjusts after it:
  - if `atTop`, set `scrollTop = 0`;
  - otherwise, add the height difference to `scrollTop`.

**Acceptance criteria:**
- [ ] At the top, adding an event leaves `scrollTop` at 0, with the new line first.
- [ ] Scrolled to 200 with an event added that adds 40px, `scrollTop` becomes 240. The test stubs
      `scrollHeight` with `Object.defineProperty` because jsdom has no layout. That's DOM geometry,
      not a server mock.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/EventLog.test.ts`

**Dependencies:** Task 14

**Files:** `src/components/dashboard/EventLog.svelte`, `tests/components/dashboard/EventLog.test.ts`

**Scope:** S

## Task 16: `e2e/event-log.spec.ts`

**Description:** Post `LOOP_CHECK`, open `/runs/{id}`, answer `again`, then `done`. Then check:
- the newest-first order, with `Pipeline completed` at the top;
- that the `Loop #1` line is visible;
- in a real browser, that scrolling the log down and adding events doesn't move the line in view.

The spec cancels the run in `finally`.

**Acceptance criteria:**
- [ ] The spec passes in Chromium.

**Verification:**
- [ ] `npm run test:e2e -- e2e/event-log.spec.ts e2e/gallery-gate.spec.ts e2e/no-tauri-breakage.spec.ts`

**Dependencies:** Task 15

**Files:** `frontend/e2e/event-log.spec.ts`

**Scope:** S

## Checkpoint C: `event-log`
- [ ] The full Vitest suite, `check` and `lint` are green.
- [ ] The Task 16 e2e specs pass.
- [ ] The map row for `event-log` reads `Done <date>`.
- [ ] Review with Jobsworth before Phase D.

---

## Phase D: `workflow-detail`

## Task 17: Pull `RunTable` out of `RunList`, with no behaviour change

**Description:** Move `RunList`'s table, including `unnamed`, into `RunTable.svelte`, which takes
`{ runs }`. `RunList` keeps its polling, heading, and loading, error and empty states, and renders
`RunTable`.

**Acceptance criteria:**
- [ ] `RunList.test.ts` passes unchanged.
- [ ] A new `RunTable.test.ts`, run on real `listRuns()` data, renders one linked row per run.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/RunList.test.ts tests/components/dashboard/RunTable.test.ts`

**Dependencies:** Task 6

**Files:** `src/components/dashboard/RunTable.svelte`, `RunList.svelte`, `tests/components/dashboard/RunTable.test.ts`

**Scope:** S

## Task 18: Page-header title slot, the `/workflows/{id}` route, and a page header that handles not-found

**Description:**
- **Page header.** `PageHeaderState.title` plus `usePageTitle(getter)`. `App.svelte` uses the
  header's title when it's set. On the `'detail'` route it falls back to `Workflow` while the page
  loads.
- **Route.** `^\/workflows\/(?!new$)([^/]+)$`, with the id decoded by `decodeURIComponent`. A
  malformed escape falls through to the catalog. Breadcrumbs go back to the catalog.
- **`WorkflowDetailPage.svelte`:**
  - Loads `listWorkflows()` and finds the workflow by id.
  - Sets the title to `formatWorkflowName(name)`.
  - In the body, shows the raw name and `Source: {source_dir}`, muted.
  - Header actions: **Edit** (`/workflows/{encoded id}/edit`) and **Run Workflow**, which opens
    `RunDialog`.
  - If the id isn't found: `Workflow not found.`, a link to `/`, and the title
    `Workflow not found`.
  - A failed load shows the error inline.

**Acceptance criteria:**
- [ ] `AppLayout.test.ts`:
  - [ ] `/workflows/{id}` renders the page;
  - [ ] `/workflows/new` and `/workflows/{id}/edit` still route as before;
  - [ ] the document titles are `{formatted} — Smasher` and `Workflow not found — Smasher`.
- [ ] On a throwaway import of `run_launch_check.dot` named with an uppercase letter and a dot,
      the page shows the name and source, and has an Edit link and a Run Workflow button.
- [ ] Run Workflow opens `RunDialog`, and Cancel doesn't launch anything.
- [ ] An unknown id shows `Workflow not found.`

**Verification:**
- [ ] `npm test -- --run tests/components/AppLayout.test.ts tests/components/dashboard/WorkflowDetailPage.test.ts`

**Dependencies:** Task 2

**Files:** `src/lib/page-header.svelte.ts`, `src/App.svelte`, `src/components/dashboard/WorkflowDetailPage.svelte`, `tests/components/AppLayout.test.ts`, `tests/components/dashboard/WorkflowDetailPage.test.ts`

**Scope:** M

## Task 19: Run card (`pickFeaturedRun`) and run history

**Description:** `WorkflowDetailPage` polls `listRuns()` every 5s and filters on `workflow_id`. It
renders:
- **The card**, when there's a featured run. It has:
  - the heading `Active run` or `Latest run`;
  - the run id, linking to `/runs/{id}`;
  - a `StatusBadge`;
  - Started;
  - a `RunMetaList`;
  - `+N more running` when other runs are running.
- **Run history**: a `Run History` heading and a `RunTable`, or `No runs yet.` when there are no
  runs.

**Acceptance criteria:**
- [ ] A fresh import shows no card and shows `No runs yet.`
- [ ] After two launches through `runWorkflow`, the history lists exactly those two runs, and the
      card reads `Active run`, links to the newest, and says `+1 more running`.
- [ ] After both runs are cancelled, the card reads `Latest run` and shows Completed.
- [ ] Runs of other workflows never appear.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/WorkflowDetailPage.test.ts`

**Dependencies:** Tasks 3, 17 and 18

**Files:** `src/components/dashboard/WorkflowDetailPage.svelte`, `tests/components/dashboard/WorkflowDetailPage.test.ts`

**Scope:** M

## Task 20: Catalog link, `e2e/workflow-detail.spec.ts`, and backlog follow-ups

**Description:**
- **Catalog.** `WorkflowCatalog`'s name cell becomes a link to
  `/workflows/{encodeURIComponent(id)}`.
- **e2e.** `workflow-detail.spec.ts` imports a throwaway workflow, then:
  1. goes from the catalog to the detail page;
  2. launches it from Run Workflow;
  3. lands on `/runs/{id}`;
  4. goes back, and checks that the card links to that run.

  The spec cancels the run and `rmSync`s the workflow in `finally`.
- **`BACKLOG.md` follow-ups:**
  - a readable `node_failed.error` from the server;
  - the edit route's id regex;
  - `CLAUDE.md`'s shape table (`parallelogram` is Tool, `component` is Parallel).

**Acceptance criteria:**
- [ ] `WorkflowCatalog.test.ts` has a new case checking that the name links to the detail page.
- [ ] The e2e spec passes in Chromium.
- [ ] The three backlog entries exist.

**Verification:**
- [ ] `npm test -- --run tests/components/dashboard/WorkflowCatalog.test.ts`
- [ ] `npm run test:e2e -- e2e/workflow-detail.spec.ts e2e/run-launch.spec.ts`

**Dependencies:** Task 19

**Files:** `src/components/dashboard/WorkflowCatalog.svelte`, `tests/components/dashboard/WorkflowCatalog.test.ts`, `frontend/e2e/workflow-detail.spec.ts`, `tasks/BACKLOG.md`

**Scope:** S

## Checkpoint D: complete
- [ ] Every spec success criterion is ticked in `SPEC-spa-repairs-batch2.md`.
- [ ] The full Vitest suite passes with no new warnings, and `check` and `lint` add no new errors.
- [ ] Every non-LLM e2e spec passes, which excludes `critical-path.spec.ts`.
- [ ] `make ci` is green.
- [ ] The map marks all seven modules done. `BACKLOG.md` #21 is updated to done, with the
      deliberate cuts noted.
- [ ] Review with Jobsworth.
