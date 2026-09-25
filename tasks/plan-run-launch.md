# Implementation Plan: run-launch

Spec: [`SPEC-run-launch.md`](SPEC-run-launch.md) (approved 2026-09-25). Module of
[`capability-map-spa-repairs.md`](capability-map-spa-repairs.md). Branch `feat/spa-port-repairs`.
Tasks and checkpoints: [`todo-run-launch.md`](todo-run-launch.md).

## Overview

The catalog's Run Workflow button opens a `RunDialog` with the old form's four fields, instead of
launching with an empty request. A pure `buildRunRequest` does the parsing and validation the old
HTMX handler did on the server. `runDrafts` keeps each workflow's typed values until the page
reloads. A gate-only fixture, `examples/run_launch_check.dot`, echoes `{{brief}}`, `{{model}}`
and `{{colour}}` into its question text, so tests can see what arrived. Frontend only, plus one
`.dot` file.

## Dependency graph

```
examples/run_launch_check.dot ─────────────┐   (fixture: proves values reach the server)
lib/runRequest.ts (buildRunRequest) ───────┤
lib/runDrafts.ts (per-workflow values) ────┤
                                           └── components/dashboard/RunDialog.svelte
                                                   └── WorkflowCatalog.svelte opens it
                                                           └── e2e/run-launch.spec.ts
```

The first three have no dependencies on each other.

## Architecture decisions

- **Parsing is one pure function, `buildRunRequest(values)`,** which returns
  `{ ok, request }` or `{ ok: false, errors }`. The dialog stays thin, and every parsing rule is
  unit-tested without a DOM or server. It never calls `fetch`.
- **`runWorkflow` and `RunWorkflowRequest` in `lib/api/runs.ts` are unchanged.** The dialog calls
  `runsApi.runWorkflow(id, request)` with the built body, and the API errors already carry the
  server's message (`spa-shell`).
- **`runDrafts` is a plain module-level `Map<string, RunFormValues>`** with `getDraft(id)` and
  `saveDraft(id, values)`. It doesn't need to be reactive: the dialog copies the draft into its
  own `$state` when it opens, and saves it back on every input. A reload clears it, and so does
  the full-page navigation after a successful launch, which is what the spec asks for. This is a
  plain `.ts` file rather than `.svelte.ts` (the spec is updated to match).
- **The dialog owns its errors.** Validation errors and the server error are local `$state`,
  cleared whenever the dialog opens. So a reopened dialog shows none (spec story 5).
- **Props: `workflow: { id: string; name: string }` and `open = $bindable(false)`.** The catalog
  keeps one `RunDialog` and a `runTarget` `$state`. It doesn't mount a dialog per row. The dialog
  formats the title itself with the same rule as the catalog's `formatWorkflowName`. That helper
  moves to `lib/utils.ts` so `workflow-detail` can use it too.
- **Navigation stays `window.location.href = /runs/{id}`,** as the catalog does today. Tests
  already stub `location` with `vi.stubGlobal`.
- **The fixture is `Start → Gate → Exit` with a freeform `hexagon` gate,** as in
  `human_gate_showcase.dot`. Its label is `Brief: {{brief}} | Model: {{model}} | Colour:
  {{colour}}`. It has no box nodes, so a run spends nothing. The Rust suite needs no change to
  cover it: `example_lint.rs::all_examples_pass_lint` reads every `examples/*.dot`, so `make ci`
  lints it automatically. The real launch lints it too.
- **Server-rejection tests import a DOT that parses but fails lint**:
  `digraph { Start [shape=Mdiamond] }`. Import only parses and resolves it, but the launch lints
  it and fails E003, so the dialog shows `Pipeline lint errors: Graph has no exit node`. There's
  no delete API, so cleanup uses `rmSync` on the imported path, as `WorkflowCatalog.test.ts`
  does. Imported names carry a `_test_run_launch_` marker.
- **Every run a test launches is cancelled in `afterEach`** with `runsApi.cancelRun(id)`, as
  `EventLog.test.ts:65` and `AppLayout.test.ts:128` do. Otherwise gate-parked runs pile up on
  the dev server for the rest of the session.
- **Closing the dialog while a launch is in flight doesn't abort it.** The run already exists on
  the server, so when the request resolves, the dialog still navigates to `/runs/{id}`. That's
  better than leaving an orphaned run the user can't see. There's nothing to cancel on the
  client, since `runWorkflow` takes no `AbortSignal`, and changing that would change its
  signature (spec: ask first).

## Verified context (checked against the code 2026-09-25)

Facts the tasks rely on, with where each one was checked:

- **`{{model}}` is available to the fixture.** `launch_and_record` inserts `model` into
  `variables` (the given one, or `state.default_model`), then runs `apply_transforms`. That
  happens before lint and before launch (`smasher-web/src/routes/api.rs:218-223`).
- **Consequence: a `model=` line in Variables never takes effect.** The server overwrites it with
  the Model field or the default, as the old form's server did. The client doesn't warn about
  it. The spec calls it out, and there's no test for it, because nothing new is built for it.
- **Unknown placeholders stay as they are.** Launching without `colour` leaves `{{colour}}` in
  the question (`transforms.rs`, `expand_variables_leaves_unknown_variables`).
- **The question text is the node's `question` attribute, then its `prompt`, then its label**
  (`smasher-attractor/src/interviewer.rs:692-697`). So the fixture gate must set neither
  `question` nor `prompt`. Tests read it from `questionsApi.listQuestions(runId)`, as
  `questions[0].question`, with `kind: 'free_form'`.
- **Only E001–E003 are lint errors** (no start, several starts, no exit). Warnings and infos
  (such as unlabelled edges) don't block a launch (`lint.rs:18-26`).
- **Import writes to `{data_dir}/workflows/`, not `examples/`** (`editor_api.rs`, `import_dot`).
  So a lint-failing import that leaks after a crashed test can't break `all_examples_pass_lint`.
  It does stay in the catalog until it's removed.
- **The catalog lists `examples/` only when the server runs from the repo root**
  (`SMASHER_WORKFLOWS_DIR` defaults to `examples`).
- **Playwright's `webServer` starts only Vite (`npm run dev`, port 5173)**, which proxies `/api`
  and `/events` to `127.0.0.1:21541` (`vite.config.ts`). So `e2e/run-launch.spec.ts` needs the
  same `smasher serve` running as Vitest does.
- **Dialog test setup to copy** (`SettingsDialog.test.ts`): `userEvent.setup()`, queries on
  `screen` (bits-ui portals to `body`), and `document.body.style.pointerEvents = ''` in
  `afterEach`. That reset is needed because bits-ui's scroll lock clears it on a timer, which
  otherwise blocks the next test's clicks.
- **Import style in `WorkflowCatalog.svelte`:** app modules use relative paths
  (`../../lib/api/runs`), and shadcn components use `$lib/components/ui/...`. `lib/utils.ts` is
  shadcn's file (double quotes), so match its style when `formatWorkflowName` moves there.
- **The "launches a real run" catalog test calls `vi.unstubAllGlobals()` at its end, not in an
  `afterEach`.** If it fails partway, the `location` stub leaks into later tests. Task 5 moves it
  to `afterEach` while rewriting that test.

## Task list

See `todo-run-launch.md` for acceptance criteria and verification.

### Phase 1: Building blocks
- [x] Task 1: Fixture `run_launch_check.dot`, proven through the real API
- [x] Task 2: `lib/runRequest.ts` (`buildRunRequest`)
- [x] Task 3: `lib/runDrafts.ts`

### Checkpoint A
- [x] Full Vitest suite green; `check`/`lint` add no new errors

### Phase 2: The dialog
- [x] Task 4: `RunDialog.svelte`
- [x] Task 5: The catalog opens it

### Checkpoint B
- [x] Full suite green; review the dialog with Jobsworth in `npm run dev` (optional, on request)

### Phase 3: End to end
- [x] Task 6: `e2e/run-launch.spec.ts`, and mark the module done

### Checkpoint C: Complete
- [x] All spec success criteria met, `make ci` green
- [ ] Review with Jobsworth

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| A test launches a run that reaches an LLM node | High | Launch only `run_launch_check`, `human_gate_showcase` or a lint-failing import, all of which park or are rejected before any box node. Task 1 checks the fixture has no box nodes. |
| bits-ui's dialog portals to `document.body`, and focus/Escape behave differently in jsdom | Med | `SettingsDialog.test.ts` already drives the same dialog in jsdom. Copy its setup, and query `screen`, not the render container. |
| The gate's question takes a moment to appear after launch | Low | `waitFor` on `listQuestions(runId)` with a bounded timeout, as `QuestionCard.test.ts` does |
| Parallel test files launch runs, so a count of runs isn't stable | Med | Assert on runs with this test's own imported `workflow_id`, never on a total |
| Imported test workflows leak into the catalog if a test fails partway | Low | `afterEach` removes every workflow whose name contains `_test_run_launch_` |
| The server's default model differs between setups | Low | The blank-model test asserts non-empty and not `{{model}}`, not an exact name |
| Gate-parked test runs pile up on the dev server | Low | Collect launched run ids and `cancelRun` them in `afterEach` |
| A bug makes Cancel or Escape launch anyway, and that launch spends tokens | Med | The workflow imported for the no-launch test uses the fixture's gate-only DOT, not `hello-world.dot` |
| The Vitest server isn't on this branch, or the desktop app holds 21541 | Med | Follow the backlog's "Frontend test gotcha": quit the app, serve from this branch with the fake-claude env |

## Open questions

None.
