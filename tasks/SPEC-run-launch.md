# Spec: run-launch

Module of [`capability-map-spa-repairs.md`](capability-map-spa-repairs.md), after `spa-shell`.
Restores the run form the HTMX → SPA port dropped (`BACKLOG.md` #21: "No run form"), as a
dialog that `workflow-detail` will reuse.

## Objective

Someone launching a workflow should be able to give the run a brief, a model, variables and
per-node overrides, as the old form allowed. Today they can only start a run with the defaults.

What the old UI did (`git show 0e5647c^:crates/smasher-web/templates/workflow_run_form.html`
and `routes/pages.rs:599-645`):

- **Four fields.** Model (text, placeholder `(default)`), Variables (textarea, `key=value` per
  line), Brief (textarea), and Node Overrides (JSON), with placeholder
  `{"node_id": {"model": "..."}}`.
- **Parsing was server-side.** Blank lines were skipped, and so were lines without `=`, with no
  error. Keys and values were trimmed. A non-blank Brief was set as `variables.brief` *after*
  the variables, so it won over a `brief=` line. A blank Model fell back to the server default.
  Bad JSON returned `400 invalid node_overrides JSON: …`.

What the SPA does today:

- The catalog's **Run Workflow** button calls `runsApi.runWorkflow(id)` with an empty request
  (`WorkflowCatalog.svelte:44-54`), then navigates to `/runs/{run_id}`. A failure shows inline
  above the table.
- `POST /api/workflows/{id}/run` takes JSON `{ variables, model, node_overrides }`
  (`smasher-web/src/routes/api.rs:291`). The parsing that `create_run` used to do now has to
  happen in the client:
  - **A blank model isn't filtered out.** `launch_and_record` uses
    `model.unwrap_or_else(default)`, so sending `"model": ""` replaces the default with an empty
    string. The client must leave `model` out when it's blank.
  - **The server puts the model into `variables.model`** after the given variables
    (`api.rs:218-220`), so `{{model}}` expands in labels and prompts. A `model=` line in
    Variables is always overwritten, as it was in the old form. The client doesn't warn about it.
  - **A wrong override shape isn't rejected cleanly.** Each override value must be
    `{ model?: string, provider?: string }` (`transforms::NodeOverride`). Other fields are
    ignored. A wrong shape gets axum's 422 plain-text rejection, not a JSON `error`. So the
    client checks the shape before it submits.

### User stories and acceptance criteria

1. **Run Workflow opens a dialog instead of launching straight away.**
   - Clicking **Run Workflow** on a catalog row opens a dialog titled `Run {formatted name}`.
     Nothing is sent to the server yet.
   - The dialog has four labelled fields: Model, Variables, Brief and Node Overrides (JSON).
     Their placeholders match the old form's.
   - **Cancel**, Escape and the close button all close it without sending a request.
2. **Submitting launches the run with what I typed, then opens it.**
   - **Run** sends `POST /api/workflows/{id}/run` and then navigates to `/runs/{run_id}`.
   - The request body is built like this:
     - **Model.** Trimmed. Left out when blank, so the server default applies.
     - **Variables.** One `key=value` per line. The split is at the first `=`, so values may
       contain `=`. Keys and values are trimmed, and blank lines are skipped.
     - **Brief.** Trimmed. When it isn't blank, it's sent as `variables.brief` and replaces any
       `brief=` line.
     - **Node Overrides.** Parsed JSON. Left out when the field is blank.
   - While the request is in flight, **Run** reads `Starting…` and is disabled, so a double
     click can't start two runs.
3. **Bad input is caught before anything is sent.** Each error shows inline under its field.
   Submit is blocked while any error is present.
   - **Variables.** A non-blank line with no `=`, or with an empty key, shows
     `Line {n}: expected key=value`, where `{n}` counts from 1.
   - **Node Overrides.** Not valid JSON: `Invalid JSON: {parser message}`.
   - **Node Overrides.** Valid JSON of the wrong shape: `Expected {"node_id": {"model": "...",
     "provider": "..."}}`. That covers anything that isn't an object, an override that isn't
     an object, and a `model` or `provider` that isn't a string.
   - An error clears when its field is edited.
4. **A server rejection keeps the dialog open.**
   - If the launch fails, for example with `Pipeline lint errors: …` or `not found: workflow …`,
     the server's message (via `errorFromResponse`) shows inline in the dialog. The dialog stays
     open with the values I typed, and **Run** works again.
   - The catalog's existing above-the-table `runError` is removed, since launch errors now show
     in the dialog.
5. **Reopening a workflow's dialog keeps what I typed.**
   - If I close the dialog and open it again for the same workflow, the four fields still hold
     what I last typed. This holds until the page reloads. Each workflow keeps its own values.
   - Validation and server errors are not kept. A reopened dialog shows none.
6. **The dialog is reusable.** `RunDialog` takes a workflow `{ id, name }` and a bindable
   `open`. It depends on nothing from the catalog, so `workflow-detail` can mount it as it is.

### Out of scope

- A model picker. The Model field stays free text, and #20 replaces it.
- Structured editors for variables or overrides, such as key/value rows or a node-id dropdown.
- Declared workflow inputs. Nothing lists a workflow's `{{variables}}`.
- The raw-DOT paste form (`POST /api/runs`). It's a deliberate cut (#21).
- The workflow detail page. That's `workflow-detail`.
- Any Rust or API change.

## Tech Stack

Svelte 5 (runes), TypeScript, Vite, Tailwind 4, and shadcn-svelte on bits-ui. It uses the
existing `dialog`, `input`, `textarea`, `label` and `button` components under
`src/lib/components/ui/`, as `SettingsDialog.svelte` does. No new dependencies.

## Commands

Run from `frontend/`. The Vitest suite needs a real server on `127.0.0.1:21541` built from this
branch (see the backlog's "Frontend test gotcha").

```bash
# Terminal 1, repo root: a server that needs no API keys and spends nothing
SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=<path to a fake claude script> \
  cargo run -p smasher-cli -- serve

# Terminal 2, frontend/
npm test -- --run                                   # Vitest, whole suite
npm test -- --run tests/lib/runRequest.test.ts
npm test -- --run tests/components/dashboard/RunDialog.test.ts
npm run check                                       # svelte-check --threshold error
npm run lint
npm run test:e2e -- e2e/run-launch.spec.ts
npm run build
```

## Project Structure

```
examples/run_launch_check.dot                       → NEW: gate-only fixture; its gate label is
                                                      "Brief: {{brief}} | Model: {{model}} | Colour: {{colour}}"
frontend/src/lib/runRequest.ts                      → NEW: pure parse/validate → RunWorkflowRequest
frontend/src/lib/runDrafts.ts                       → NEW: in-memory per-workflow form values
frontend/src/components/dashboard/RunDialog.svelte  → NEW: the dialog
frontend/src/components/dashboard/WorkflowCatalog.svelte → Run button opens RunDialog; drop runError
frontend/tests/lib/runRequest.test.ts               → NEW
frontend/tests/components/dashboard/RunDialog.test.ts → NEW
frontend/tests/components/dashboard/WorkflowCatalog.test.ts → launch test goes through the dialog
frontend/e2e/run-launch.spec.ts                     → NEW
```

The fixture is gate-only, so a run launched from it waits at the gate and never reaches an LLM
node. It follows the `manual-workflow-run-shell-check.dot` precedent: a fixture in `examples/`
that the catalog lists. A gate's question text is its label (`interviewer.rs:691`), and the
server fills `{{var}}` placeholders into labels (`transforms::expand_variables`). So
`GET /api/runs/{id}/questions` shows the values that arrived.

## Code Style

Match `lib/api` and `notify.ts`: two `ABOUTME:` lines, small exported functions, and short
comments that explain why. The parser is intended to look like this:

```ts
// ABOUTME: Turns the run dialog's four text fields into a POST /api/workflows/{id}/run body
// ABOUTME: Does the parsing the old HTMX handler did server-side, plus per-field validation

import type { RunWorkflowRequest } from './api/runs';

export interface RunFormValues {
  model: string;
  variables: string;
  brief: string;
  nodeOverrides: string;
}

export type RunFormErrors = Partial<Record<'variables' | 'nodeOverrides', string>>;

export type RunRequestResult =
  | { ok: true; request: RunWorkflowRequest }
  | { ok: false; errors: RunFormErrors };

export function buildRunRequest(values: RunFormValues): RunRequestResult {
  const errors: RunFormErrors = {};
  const variables = parseVariables(values.variables, errors);
  const nodeOverrides = parseNodeOverrides(values.nodeOverrides, errors);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const brief = values.brief.trim();
  if (brief) variables.brief = brief; // wins over a brief= line, as the old form did

  const request: RunWorkflowRequest = { variables };
  const model = values.model.trim();
  if (model) request.model = model; // "" would replace the server default, not fall back to it
  if (nodeOverrides) request.node_overrides = nodeOverrides;
  return { ok: true, request };
}
```

Conventions:

- camelCase names.
- Errors from `err instanceof Error ? err.message : fallback`, through `errorMessage` in
  `notify.ts`.
- `data-testid` only where there's no role or label to find the element by.
- The dialog uses `Dialog.Root bind:open`, as `SettingsDialog.svelte` does.

## Testing Strategy

Everything uses real HTTP against the real server, with no mocks, as the rest of the suite does.
Every launched run uses `run_launch_check.dot` or `human_gate_showcase.dot`, both of which start
at a human gate, so no test spends tokens. The tests leave `consensus_task.dot`, `hello-world.dot`
and the showcase's box nodes alone.

- **Unit (Vitest), `runRequest.test.ts`.** Pure function, no DOM:
  - all fields blank gives `{ variables: {} }`, with no `model` and no `node_overrides`;
  - Model is trimmed, and whitespace-only is left out;
  - Variables: several lines, blank lines skipped, keys and values trimmed, `a=b=c` gives
    `{ a: 'b=c' }`, and a later duplicate key wins;
  - Variables errors: `colour blue` and `=x` each give `Line {n}: expected key=value` with the
    right line number;
  - Brief is trimmed and set as `variables.brief`, and it beats a `brief=` line. A
    whitespace-only Brief leaves `brief=` alone;
  - Node Overrides: blank is left out, and a valid object passes through;
  - Node Overrides errors: bad JSON gives `Invalid JSON: …`, and each of `[]`, `"x"`,
    `{"a": "m"}` and `{"a": {"model": 1}}` gives the shape error;
  - both fields bad at once gives both errors.
- **Unit (Vitest), `runDrafts`.** Values are kept per workflow id, one workflow doesn't see
  another's, and there's an empty default for an unseen id.
- **Component + integration (Vitest + real server), `RunDialog.test.ts`:**
  - it renders the four labelled fields with the old placeholders;
  - Cancel and Escape send no request: `listRuns()` has no run with that workflow's
    `workflow_id`. The workflow is imported just for this test, so runs launched by tests
    running in parallel can't affect the check;
  - validation errors show under their fields, block submit and clear on edit;
  - a real submit against `run_launch_check`, with Brief `hello`, Model `m-1` and Variables
    `colour=blue`, navigates to `/runs/{id}`. That run's pending question reads
    `Brief: hello | Model: m-1 | Colour: blue`;
  - with Model blank, the question shows a non-empty model name, not `{{model}}` and not
    blank;
  - a server rejection shows the server's message inline, keeps the values and re-enables Run.
    Import a DOT that parses but fails lint, such as a start node with no exit. Import only
    parses and resolves the DOT, but the launch lints it, so the submit gets
    `Pipeline lint errors: …`. There's no API to delete a workflow, so the test removes the
    imported file with `rmSync`, as the catalog's import tests do;
  - the button shows `Starting…` and is disabled while the request is in flight;
  - closing and reopening keeps the values and drops the errors.
- **Integration, `WorkflowCatalog.test.ts`.** The existing "launches a real run" test now opens
  the dialog and submits it. A new test checks that clicking Run Workflow opens the dialog
  without launching anything.
- **End-to-end (Playwright), `run-launch.spec.ts`.** From the catalog, open `Run Workflow` on
  Run Launch Check, fill Brief, Model and a variable, and submit. Then check that the run page
  loads and its question card shows the filled-in text. Also check that a bad Node Overrides
  value shows an inline error and doesn't navigate. It's a new file, not
  `critical-path.spec.ts`, so it needs no LLM run.
- **Gates:**
  - `npm run check` and `npm run lint` add no new errors. The 6 existing `svelte-check` errors
    are #2's.
  - The full Vitest suite passes with no new warnings.
  - `make ci` stays green. The only change outside `frontend/` is a new `.dot` file, but it
    checks nothing broke, including any test that counts or lints `examples/`.

## Boundaries

- **Always:**
  - Write the failing test first.
  - Keep two `ABOUTME:` lines per file.
  - Run the Vitest suite against a server built from this branch.
  - Commit after each task.
  - Launch test runs only from gate-first workflows.
- **Ask first:**
  - Any Rust or API change, including making the server filter out a blank model.
  - A new npm dependency.
  - Changing `RunWorkflowRequest` or `runWorkflow`'s signature.
  - Adding fields beyond the old form's four.
- **Never:**
  - Mock `fetch` or the server in these tests.
  - Send `"model": ""`.
  - Launch a run from a workflow with box nodes in any test.
  - Set `SMASHER_LLM_TESTS=1`.
  - Touch the 6 pre-existing `svelte-check` errors.

## Success Criteria

- [ ] Run Workflow opens a dialog, and Cancel or Escape launches nothing.
- [ ] A submitted Brief, Model and variable reach the server, and the fixture's question text
      shows each one.
- [ ] A blank Model leaves `model` out of the request, so the run uses the server default.
- [ ] A bad Variables line and a bad or wrong-shaped Node Overrides each show their inline
      error and block submit.
- [ ] A server rejection shows the server's message in the dialog and keeps its values.
- [ ] Reopening a workflow's dialog restores its last values without errors.
- [ ] `RunDialog` depends on nothing from the catalog.
- [ ] New unit, integration and Playwright tests pass. The full Vitest suite passes, and
      `check`, `lint` and `make ci` add no new errors or warnings.

## Decisions (resolved 2026-09-25)

1. **A Variables line without `=` is an inline error**, not dropped silently as it was in the old
   form.
2. **The dialog keeps each workflow's last values in memory** until the page reloads.
3. **The test fixture lives in `examples/`** as `run_launch_check.dot`, and the catalog lists
   it.

## Open Questions

None.

Spec approved by Jobsworth 2026-09-25.
