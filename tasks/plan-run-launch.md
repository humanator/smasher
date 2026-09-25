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
  {{colour}}`. It has no box nodes, so a run spends nothing. It isn't added to the Rust
  `example_lint.rs` list, because that would be a Rust change. The real launch lints it anyway, so
  a lint failure would fail the Task 1 test.
- **Server-rejection tests import a DOT that parses but fails lint** (a start with no exit),
  because import doesn't lint but launch does. There's no delete API, so cleanup uses `rmSync`
  on the imported path, as `WorkflowCatalog.test.ts` does. Imported names carry a
  `_test_run_launch_` marker.

## Task list

See `todo-run-launch.md` for acceptance criteria and verification.

### Phase 1: Building blocks
- [ ] Task 1: Fixture `run_launch_check.dot`, proven through the real API
- [ ] Task 2: `lib/runRequest.ts` (`buildRunRequest`)
- [ ] Task 3: `lib/runDrafts.ts`

### Checkpoint A
- [ ] Full Vitest suite green; `check`/`lint` add no new errors

### Phase 2: The dialog
- [ ] Task 4: `RunDialog.svelte`
- [ ] Task 5: The catalog opens it

### Checkpoint B
- [ ] Full suite green; review the dialog with Jobsworth in `npm run dev` (optional, on request)

### Phase 3: End to end
- [ ] Task 6: `e2e/run-launch.spec.ts`, and mark the module done

### Checkpoint C: Complete
- [ ] All spec success criteria met, `make ci` green
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
| The Vitest server isn't on this branch, or the desktop app holds 21541 | Med | Follow the backlog's "Frontend test gotcha": quit the app, serve from this branch with the fake-claude env |

## Open questions

None.
