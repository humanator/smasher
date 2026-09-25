# Todo: run-launch

Plan: [`plan-run-launch.md`](plan-run-launch.md). Spec: [`SPEC-run-launch.md`](SPEC-run-launch.md).

Before any Vitest run: quit the desktop app, then from the repo root
`SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=<fake claude> cargo run -p smasher-cli -- serve`.
All commands below run from `frontend/`. Every launched run must start at a human gate or fail
lint. Never set `SMASHER_LLM_TESTS=1`.

## Task 1: Fixture `run_launch_check.dot`, proven through the real API

**Description:** Add `examples/run_launch_check.dot`: `Start` (Mdiamond) → `EchoGate` (hexagon,
`mode="freeform"`, label `Brief: {{brief}} | Model: {{model}} | Colour: {{colour}}`) → `Exit`
(Msquare). Give it two `ABOUTME:` comment lines and a `goal` saying what it's for, as
`manual-workflow-run-shell-check.dot` does. The gate must set no `question` or `prompt`
attribute, because either one would replace the label as the question text. Add an integration
test that launches it with `runsApi.runWorkflow` directly, reads
`questionsApi.listQuestions(runId)` and cancels the run afterwards.

**Acceptance criteria:**
- [x] The catalog (`listWorkflows`) lists it
- [x] `runWorkflow(id, { variables: { brief: 'hello', colour: 'blue' }, model: 'm-1' })` gives a run whose pending `questions[0].question` is `Brief: hello | Model: m-1 | Colour: blue`
- [x] The file has no `box` nodes
- [x] The test cancels its run in `afterEach`

**Verification:**
- [x] A new case in `tests/lib/api/runs.test.ts` fails first (no such workflow), then passes against the real server
- [x] `cargo test -p smasher-attractor --test example_lint` passes. `all_examples_pass_lint` reads every `examples/*.dot`, so it covers the new file.

**Dependencies:** None

**Files:** `examples/run_launch_check.dot`, `frontend/tests/lib/api/runs.test.ts`

**Scope:** S

## Task 2: `lib/runRequest.ts`

**Description:** `RunFormValues`, `RunFormErrors`, and `buildRunRequest`, as sketched in the
spec's Code Style section, with private `parseVariables` and `parseNodeOverrides`. It makes no
`fetch` and has no Svelte imports.

**Acceptance criteria:**
- [x] Every case in the spec's `runRequest.test.ts` list passes, including:
  - all fields blank gives `{ variables: {} }` with no `model` or `node_overrides` keys;
  - `a=b=c` gives `{ a: 'b=c' }`;
  - `colour blue` on line 2 gives `Line 2: expected key=value`;
  - Brief beats a `brief=` line;
  - `[]`, `"x"`, `{"a": "m"}` and `{"a": {"model": 1}}` each give the shape error;
  - bad JSON gives `Invalid JSON: …`
- [x] Both errors are returned together when both fields are bad

**Verification:**
- [x] `npm test -- --run tests/lib/runRequest.test.ts`, written first and seen failing

**Dependencies:** None

**Files:** `frontend/src/lib/runRequest.ts`, `frontend/tests/lib/runRequest.test.ts`

**Scope:** S

## Task 3: `lib/runDrafts.ts`

**Description:** A module-level `Map` with `getDraft(workflowId): RunFormValues` (four empty
strings for an id it hasn't seen) and `saveDraft(workflowId, values)`. It stores a copy, so later
edits to the caller's object don't leak in.

**Acceptance criteria:**
- [x] An unseen id gives four empty strings
- [x] A saved draft comes back equal but isn't the same object
- [x] Two workflow ids don't see each other's drafts

**Verification:**
- [x] `npm test -- --run tests/lib/runDrafts.test.ts`, written first and seen failing

**Dependencies:** Task 2 (the `RunFormValues` type)

**Files:** `frontend/src/lib/runDrafts.ts`, `frontend/tests/lib/runDrafts.test.ts`

**Scope:** XS

## Checkpoint A: after Tasks 1–3
- [x] `npm test -- --run` passes in full, and `npm run check` shows only the 6 pre-existing errors. `npm run lint` is clean.
- [x] Commit (one per task)

## Task 4: `RunDialog.svelte`

**Description:** A shadcn `Dialog` with props `workflow: { id, name }` and
`open = $bindable(false)`. When it opens, it loads `getDraft(workflow.id)` into local state and
clears all errors. Every input calls `saveDraft`, and clears that field's error and the server
error. **Run** calls `buildRunRequest`. On errors, they show under their fields. When the
request is OK, the dialog calls `runsApi.runWorkflow`, then sets `window.location.href` to
`/runs/{run_id}`. On rejection, it shows `errorMessage(err, 'Failed to start run')` inline in a
`role="alert"`. **Cancel** closes the dialog. Closing while a launch is in flight doesn't
abort it, and a successful launch still navigates (see the plan). Move `formatWorkflowName` from
`WorkflowCatalog.svelte` to `lib/utils.ts` for the title `Run {formatted name}`, in that file's
double-quote style.

**Test setup:** copy `SettingsDialog.test.ts`. Use `userEvent.setup()` and query `screen`, and
reset `document.body.style.pointerEvents = ''` in `afterEach`. Also in `afterEach`: cancel every
launched run, `rmSync` every `_test_run_launch_` import, and `vi.unstubAllGlobals()`. The
no-launch test imports the fixture's own gate-only DOT under a unique name, so even a buggy
launch spends nothing. The rejection test imports `digraph { Start [shape=Mdiamond] }` and
expects the alert to contain `Pipeline lint errors: Graph has no exit node`.

**Acceptance criteria:**
- [x] Four fields, found by their labels: Model, Variables, Brief and Node Overrides (JSON). Each has the old form's placeholder.
- [x] Cancel and Escape close the dialog, and `listRuns()` has no run for that workflow
- [x] A bad Variables line or bad Node Overrides shows its error under the field and sends no request. Editing the field clears the error.
- [x] A real submit on `run_launch_check` navigates to `/runs/{id}`, and that run's question reads `Brief: hello | Model: m-1 | Colour: blue`
- [x] With Model blank, the question's model is non-empty and not `{{model}}`
- [x] A lint-failing imported workflow shows `Pipeline lint errors: …` inline. The dialog stays open with its values, and Run is enabled again.
- [x] Run shows `Starting…` and is disabled while the request is in flight
- [x] Close then reopen keeps the values and shows no errors
- [x] The component imports nothing from `WorkflowCatalog`

**Verification:**
- [x] `npm test -- --run tests/components/dashboard/RunDialog.test.ts`, written first and seen failing. It uses the real server, with `location` stubbed and `_test_run_launch_` imports removed in `afterEach`.

**Dependencies:** Tasks 1, 2, 3

**Files:** `frontend/src/components/dashboard/RunDialog.svelte`, `frontend/src/lib/utils.ts`, `frontend/src/components/dashboard/WorkflowCatalog.svelte` (only to import the moved helper), `frontend/tests/components/dashboard/RunDialog.test.ts`

**Scope:** M

## Task 5: The catalog opens `RunDialog`

**Description:** Replace `handleRunWorkflow`, `runningWorkflowId` and `runError` with a
`runTarget` `$state` and a single `<RunDialog bind:open workflow={runTarget} />`. Run Workflow
sets the target and opens the dialog. Update the header `ABOUTME:` line and the comment above the
old handler. In the test file, move the "launches a real run" test's `vi.unstubAllGlobals()` into
an `afterEach`, and cancel the run it launches.

**Acceptance criteria:**
- [x] Clicking Run Workflow opens `Run Human Gate Showcase`, and no run is launched for it
- [x] The existing "launches a real run" test goes through the dialog and still navigates to `/runs/{id}`
- [x] No `runError` or `Starting…` is left in the catalog

**Verification:**
- [x] `npm test -- --run tests/components/dashboard/WorkflowCatalog.test.ts`, with the new case failing first
- [x] `npm test -- --run` passes in full

**Dependencies:** Task 4

**Files:** `frontend/src/components/dashboard/WorkflowCatalog.svelte`, `frontend/tests/components/dashboard/WorkflowCatalog.test.ts`

**Scope:** S

## Checkpoint B: after Tasks 4–5
- [x] Full Vitest suite passes, and `check`/`lint` add no new errors
- [x] Commit (one per task)
- [ ] If Jobsworth wants to, look at the dialog in `npm run dev` before Phase 3

## Task 6: `e2e/run-launch.spec.ts`, and mark the module done

**Description:** A Playwright spec that needs no LLM run:
- From `/`, open Run Workflow on Run Launch Check, fill Brief, Model and `colour=blue`, and click Run. The run page loads, and its question card shows the filled-in text.
- Enter `{"a": "m"}` in Node Overrides and click Run. The shape error shows, and the URL stays `/`.
- Cancel the launched run afterwards with `POST /api/runs/{id}/cancel`, using Playwright's `request` fixture.

Then tick the spec's success criteria, and mark `run-launch` as Done in the capability map.

**Acceptance criteria:**
- [x] Both scenarios pass
- [x] Every spec success criterion is ticked, and the capability map row reads `Done 2026-09-25` (or the actual date)

**Verification:**
- [x] `npm run test:e2e -- e2e/run-launch.spec.ts`, with the same `smasher serve` running on 21541. Playwright only starts Vite, which proxies `/api` there.
- [x] `npm run build`

**Dependencies:** Task 5

**Files:** `frontend/e2e/run-launch.spec.ts`, `tasks/SPEC-run-launch.md`, `tasks/capability-map-spa-repairs.md`

**Scope:** S

## Checkpoint C: complete
- [x] `npm test -- --run`, `npm run check` (6 pre-existing errors only), `npm run lint`, `npm run build`, `npm run test:e2e -- e2e/run-launch.spec.ts` and `make ci` all pass with no new warnings
- [ ] Review with Jobsworth before starting the next module
