# Todo: `editor`

Plan: [plan-editor.md](plan-editor.md). Spec: [SPEC-editor.md](SPEC-editor.md).

Shared commands (run from `frontend/`):

- `npm run test -- --run <path>`
- `npm run check`
- `npm run lint`
- `npm run build:check`
- `npm run test:e2e -- <spec>`

E2E needs `npm run dev:backend`. Never run LLM-spending tests (`critical-path`, LLM runs).

Rules for every task:
- TDD: write a failing test, then the code, then commit while green.
- Zero warnings.
- Copy is verbatim from the spec and artboard.

## Phase 1: Foundation

- [x] **Task 1: Kind colours as CSS custom properties**
  - Description:
    - Add `--kind-{ai,tool,human,flow,edge}-{ink,tint}` to `app.css` in the light and dark
      blocks, with the current values, and expose them to Tailwind.
    - `stepKinds` returns `var(...)` strings and drops `inkDark` and `tintDark`.
    - Move `StepList` and `PrimitivesGallery` onto the vars.
  - Acceptance:
    - No hex in `stepKinds.ts`.
    - StepList renders the same computed colours in light and dark.
    - The stepKinds tests are updated.
  - Verify: `npm run test -- --run tests/lib/stepKinds.test.ts tests/components/dashboard`, `check`, `lint`.
  - Files: `src/app.css`, `src/lib/stepKinds.ts`, `src/components/dashboard/StepList.svelte`,
    `src/components/design/PrimitivesGallery.svelte`, `tests/lib/stepKinds.test.ts`.
  - Depends on: none. Scope: S.

- [x] **Task 2: `stepFields` catalogue for step kinds**
  - Description:
    - Add the `FieldSpec` type and a per-handler field list (R5.2) with the spec's exact labels,
      help, placeholders, More about rows, Try chips, Required flags and `advanced` (More
      settings).
    - Include the Tool built-in options, the answer modes and the per-kind notes for
      Join/Start/Finish/Branch.
    - Retries maps to `max_retries`.
  - Acceptance:
    - Every `stepKinds` handler has an entry.
    - Attrs are unique per kind.
    - More settings appears on every kind except Start, Finish and Branch.
    - Spot checks of the copy for each kind pass.
  - Verify: `npm run test -- --run tests/lib/stepFields.test.ts`, `check`.
  - Files: `src/lib/stepFields.ts`, `tests/lib/stepFields.test.ts`.
  - Depends on: none. Scope: M.

- [x] **Task 3: Connection fields, rule syntax, inspector copy**
  - Description: add the following to `stepFields`:
    - `CONNECTION_FIELDS` (Label, Take this path when…, Priority, Go back and redo);
    - `RULE_SYNTAX` (the 8 rows plus the footer);
    - About this connection;
    - `NOTHING_SELECTED` (heading, text, the four "How a workflow runs" steps);
    - the Branch rule field template ("Go to “{target}” when…").
  - Acceptance:
    - The copy is verbatim.
    - The priority validator accepts `-?\d+` and rejects `1.5`, `x` and ` `. Blank is allowed.
  - Verify: `npm run test -- --run tests/lib/stepFields.test.ts`.
  - Files: `src/lib/stepFields.ts`, `tests/lib/stepFields.test.ts`.
  - Depends on: T2. Scope: S.

- [x] **Task 4: `nodeSummary`**
  - Description: node → summary line, using the per-kind rules in R3 (60/50/36 character
    truncation, empty states, "{n} paths out" from the outgoing edge count).
  - Acceptance: one case per kind, truncation at each boundary, the empty states, and no summary
    for Split/Join/Start/Finish.
  - Verify: `npm run test -- --run tests/lib/nodeSummary.test.ts`.
  - Files: `src/lib/nodeSummary.ts`, `tests/lib/nodeSummary.test.ts`.
  - Depends on: T2 (tool titles). Scope: S.

- [x] **Task 5: `workflowProblems`**
  - Description: graph → `Problem[]` with `{ nodeId?, edgeId?, label?, message }`, covering the 7
    node rules, invalid JSON (`config` and `args`), a bad priority on an edge, and no Start /
    several Starts / no Finish. Results are in canvas order.
  - Acceptance:
    - Each rule fires, and the clean sample graph gives `[]`.
    - The prompt/task rules fire only when both the field and the label are empty.
    - Graph-level problems carry no `nodeId`.
  - Verify: `npm run test -- --run tests/lib/workflowProblems.test.ts`.
  - Files: `src/lib/workflowProblems.ts`, `tests/lib/workflowProblems.test.ts`.
  - Depends on: none. Scope: S.

### Checkpoint: Foundation
- [ ] `npm run test -- --run`, `check` and `lint` are clean. The workflow and run pages look
      unchanged in light and dark.

## Phase 2: Canvas

- [x] **Task 6: Step cards**
  - Description:
    - Rebuild `WorkflowNode` as a 260-wide card (chip, kind, name, summary, Needs attention
      badge) and a 160×44 pill for Start/Finish, with the selected ring.
    - Handles are hidden until hover, focus, selection or an active connection drag (D4), and
      still follow the rankdir.
    - Accessible name: "{kind}: {name}[, needs attention]".
    - Remove `nodeStyleFor`, `THEME_COLORS`, titles and groups from `nodeConfig.ts`; it keeps
      default attrs only.
    - `WorkflowNode.css` uses tokens only.
  - Acceptance:
    - Each kind renders its chip, kind and summary.
    - A problem node shows the badge.
    - Handles are present but hidden at rest.
    - No hex in `node-editor/`.
    - The old colour assertions are replaced by class and accessible-name assertions.
  - Verify: `npm run test -- --run tests/components/node-editor`, `check`, `lint`.
  - Files: `WorkflowNode.svelte`, `WorkflowNode.css`, `nodeConfig.ts`, `WorkflowCanvas.svelte`
    (pass `problemsByNode`), tests.
  - Depends on: T1, T4, T5. Scope: M.

- [x] **Task 7: Smoothstep connections and legend**
  - Description:
    - `WorkflowEdge` uses `getSmoothStepPath`.
    - Labels are pills, with normal, loop and selected variants.
    - A loop is dashed in the human ink.
    - Accessible name: "Connection from {a} to {b}[, labelled {label}]".
    - Remove the hover ×. Backspace still deletes.
    - Add a `Legend` at the bottom-left.
  - Acceptance:
    - A loop edge has the loop styling.
    - Clicking a label selects the edge.
    - There is no delete button on the canvas.
    - Backspace deletion still works.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `WorkflowEdge.svelte`, `Legend.svelte` (new), `WorkflowCanvas.svelte`, tests.
  - Depends on: T1. Scope: S.

- [x] **Task 8: Canvas chrome, FlowBridge and status bar**
  - Description:
    - Dot-grid background and a token-coloured MiniMap. Remove `Controls`.
    - Widen `FlowPositionBridge` into `FlowBridge` (zoom in/out, fit, setCenter, zoom level).
    - Add `StatusBar`: counts, the clean state, the one-problem and many-problems states, and
      Review, which selects the problem and pans to it.
  - Acceptance:
    - The status bar shows the right state for 0, 1 and 3 problems.
    - Review selects the first problem node.
    - A graph-level problem hides Review.
    - Drop-under-pointer still passes.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `FlowBridge.svelte` (renamed), `StatusBar.svelte` (new), `WorkflowCanvas.svelte`, tests.
  - Depends on: T5, T6. Scope: M.

- [x] **Task 9: Step library**
  - Description: rebuild `Palette` to R2:
    - 260px wide;
    - search, with the empty state;
    - `STEP_GROUPS` order, not collapsible;
    - items are buttons with `aria-pressed`, chip, name and blurb, and are still draggable with the
      same MIME type;
    - the hint text;
    - selecting an item sets the selection to `{kind:'guide'}`. Until T16, the inspector shows the
      guide as a placeholder heading.
  - Acceptance:
    - Search matches the plain name, technical name and blurb.
    - Groups with no matches hide.
    - The drag payload is unchanged.
    - `aria-pressed` toggles.
    - `nodeConfig.test.ts` group assertions move to the palette tests.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `Palette.svelte`, `WorkflowCanvas.svelte`, `tests/.../Palette.test.ts`, `nodeConfig.test.ts`.
  - Depends on: T1, T2. Scope: M.

### Checkpoint: Canvas
- [x] All tests are green.
- [x] `node-editor.spec.ts` drag-create still passes (selectors updated where needed).
- [ ] Side-by-side check of the canvas and palette against `Main`.
- [ ] Review with Jobsworth.

## Phase 3: Inspector

- [x] **Task 10: Inspector shell and `Field`**
  - Description:
    - Extract `inspector/Inspector.svelte`, 360px wide: header (chip, kicker, title, "Also called…",
      Close), segmented tabs with roving tabindex, the Nothing selected state, and the About tab
      from `stepKinds`.
    - Add the footer Delete Step / Delete Connection, which calls `deleteSelection`.
    - Add `inspector/Field.svelte`, which renders any `FieldSpec`: label, Required, More about
      (`aria-expanded`), help, control, Try chips, and an error with `aria-invalid` and
      `aria-describedby`. Controls are text, textarea, code, choice (RadioGroup in a
      fieldset/legend), switch with On/Off, and model (slot).
    - Add `MoreSettings` (the disclosure with "{n} settings").
    - The old forms render inside the new shell for now.
  - Acceptance:
    - All three non-form states render.
    - Tabs work from the keyboard.
    - Delete removes the node or edge and clears the selection.
    - Each `Field` control type reads and writes its value.
    - Try chips fill the field.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `inspector/Inspector.svelte`, `inspector/Field.svelte`, `inspector/MoreSettings.svelte`,
    `WorkflowCanvas.svelte`, tests.
  - Depends on: T2, T3, T8. Scope: M.

- [x] **Task 11: AI Agent, AI Coordinator, Nested workflow on `Field`**
  - Description:
    - Rewrite `CodergenForm`, `ManagerForm` and `SubPipelineForm` from `stepFields`.
    - The Model field wraps `ModelPicker` unchanged (D2).
    - The JSON error copy follows the spec.
  - Acceptance:
    - Each field writes its attr.
    - A blank value removes the attr.
    - Invalid JSON shows the spec message.
    - ModelPicker behaviour is unchanged.
    - Existing test ids are kept where the control remains.
  - Verify: `npm run test -- --run tests/components/node-editor/nodeForms`.
  - Files: those three forms and their tests.
  - Depends on: T10. Scope: M.

- [x] **Task 12: Tool**
  - Description:
    - "What should this step run?" radio.
    - Built-in: a Tool radio with descriptions, Tool settings (JSON), and Model when the tool uses
      an LLM.
    - Shell: Command and Time limit.
    - Switching mode clears the other mode's attrs.
    - The unknown-tool warning is kept.
  - Acceptance:
    - The mode switch clears attrs.
    - Each tool writes `tool`.
    - Model appears only for `task_critic` and `synthesis`.
    - The unknown tool still warns.
  - Verify: `npm run test -- --run tests/components/node-editor/nodeForms`.
  - Files: `ToolForm.svelte`, its test.
  - Depends on: T10. Scope: S.

- [ ] **Task 13: Ask a person**
  - Description:
    - Question, then "How should they answer?" (Free text / Yes or no / Pick from a list).
    - Pick from a list requires Options.
    - Free text adds the gallery switch, which reveals Candidates to expect. Choosing a
      non-free-text answer turns the gallery off and clears `candidate_count`.
    - More settings: Stop waiting after [`human.timeout_secs`] and Fallback answer
      [`human.default_choice`].
  - Acceptance:
    - Each mode writes the same attrs as today's form.
    - The gallery rules hold.
    - The human.* attrs round-trip through `convert.ts`.
  - Verify: `npm run test -- --run tests/components/node-editor/nodeForms tests/components/node-editor/convert.test.ts`.
  - Files: `InterviewerForm.svelte`, its test, `convert.test.ts`.
  - Depends on: T10. Scope: S.

- [x] **Task 14: Split, Join, Start, Finish, and More settings for all kinds**
  - Description:
    - Split `StructuralForm` into per-kind rendering. Split gets At most at once and Stop
      everything if one fails. Join, Start and Finish get their notes.
    - Add the shared Retries group (`max_retries`, `retry_delay`, `max_retry_delay`,
      `retry_jitter`) under More settings for every kind except Start, Finish and Branch. Leave
      `retries` untouched.
  - Acceptance:
    - The Split attrs are written.
    - More settings counts are right per kind.
    - A file that has `retries` keeps it after an edit and save.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `StructuralForm.svelte` (or replace it with `FlowForm.svelte`), `inspector/RetrySettings.svelte`, tests.
  - Depends on: T10. Scope: S.

- [x] **Task 15: Connection settings and Branch rules**
  - Description:
    - Rewrite `EdgeForm` onto `Field`: Label, Take this path when…, Priority (with the error), Go
      back and redo, the Rule syntax disclosure, and the About this connection tab.
    - Branch settings get one "Go to “{target}” when…" field per outgoing edge, writing that edge's
      `condition`, plus the loop sentence and Rule syntax.
  - Acceptance:
    - A label edit shows on the canvas pill.
    - A bad priority shows the error and doesn't write.
    - Branch fields edit the right edges.
    - Toggling loop updates the edge's dashed style.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `EdgeForm.svelte`, `inspector/BranchRules.svelte`, `inspector/RuleSyntax.svelte`, tests.
  - Depends on: T7, T10. Scope: M.

- [x] **Task 16: Step guide and Add to Canvas**
  - Description:
    - The `guide` selection renders the "Step guide" header, the About sections, and "Settings in
      this step", which lists every field's label, badge and help except Step name. It uses the
      no-settings line when a kind has no fields.
    - **Add to Canvas** adds the step at the centre of the view (via `FlowBridge`), selects it,
      and marks the graph dirty.
  - Acceptance:
    - The guide renders for every kind.
    - Add to Canvas creates a node with that kind's default attrs and selects it.
    - It works from the keyboard alone.
  - Verify: `npm run test -- --run tests/components/node-editor`.
  - Files: `inspector/StepGuide.svelte`, `WorkflowCanvas.svelte`, tests.
  - Depends on: T9, T10. Scope: S.

### Checkpoint: Inspector
- [ ] Every R5 field reads and writes its attr.
- [ ] All tests are green.
- [ ] `node-model.spec.ts` passes.
- [ ] Side-by-side check of every inspector state.
- [ ] Review with Jobsworth.

## Phase 4: Page

- [ ] **Task 17: Toolbar, title and save state**
  - Description:
    - Add `EditorToolbarActions`: the zoom group and Fit (via `FlowBridge`), Export .dot file
      (existing behaviour), and Save (disabled when clean, "Saving…").
    - `WorkflowEditorPage` sets its title (the workflow name), back ("Back to {name}" →
      `/workflows/{id}`) and the D1 subtitle. `App.svelte` drops its static editor strings.
    - Dirty tracking as in the plan.
    - A `beforeunload` guard, plus an in-app navigation guard (check the router first; stop and ask
      if it needs more than a small hook).
  - Acceptance:
    - The subtitle shows each state, and nothing on first load.
    - Save is disabled when clean.
    - Moving a node marks the graph dirty; fit and zoom don't.
    - Both guards fire only when dirty.
    - The conflict toast flows are unchanged.
  - Verify: `npm run test -- --run tests/components/node-editor tests/components/dashboard/WorkflowEditorPage.test.ts`.
  - Files: `EditorToolbarActions.svelte`, `WorkflowCanvas.svelte`, `WorkflowEditorPage.svelte`,
    `App.svelte`, tests.
  - Depends on: T8. Scope: M.

- [ ] **Task 18: Run from the editor**
  - Description:
    - Add a **Run** button that opens `LazyRunDialog` for this workflow.
    - When there are unsaved changes, Run saves first and opens the dialog only on success.
    - A failed save shows the normal error, and the dialog stays closed.
  - Acceptance:
    - Clean: Run opens the dialog without saving.
    - Dirty: Run saves, then opens the dialog.
    - Save fails: the error shows and no dialog opens.
    - No run starts until the dialog is submitted.
  - Verify: `npm run test -- --run tests/components/dashboard/WorkflowEditorPage.test.ts`.
  - Files: `EditorToolbarActions.svelte`, `WorkflowEditorPage.svelte`, test.
  - Depends on: T17. Scope: S.

- [ ] **Task 19: Create mode**
  - Description:
    - `NewWorkflowPage` is titled "New workflow" and its Back goes to Workflows.
    - Name and Folder move to a slim, restyled bar above the canvas.
    - Run is hidden until the first save, and the existing redirect to `/edit` stays.
  - Acceptance:
    - The create validation messages are unchanged.
    - The redirect is unchanged.
    - Run is not shown in create mode.
  - Verify: `npm run test -- --run tests/components/dashboard/NewWorkflowPage.test.ts tests/components/node-editor`.
  - Files: `NewWorkflowPage.svelte`, `WorkflowCanvas.svelte`, tests.
  - Depends on: T17. Scope: S.

- [ ] **Task 20: Phone width**
  - Description:
    - Below 768px, the palette and inspector render in `Sheet`s, opened from the toolbar's
      **Steps** and **Inspector** buttons.
    - Zoom collapses to Fit.
    - The canvas fills the screen with no sideways scroll.
    - At 768–1100px the inspector can be closed.
  - Acceptance:
    - The sheets open and close.
    - Selecting a node on a phone opens the Inspector sheet.
    - There is no horizontal page scroll at 375px.
  - Verify: `npm run test -- --run tests/components/node-editor`, plus a manual check at 375×812.
  - Files: `WorkflowCanvas.svelte`, `EditorToolbarActions.svelte`, tests.
  - Depends on: T17. Scope: S.

### Checkpoint: Page
- [ ] `check`, `lint`, `test -- --run` and `build:check` are clean.
- [ ] The full edit → save → run-dialog flow works in the browser.
- [ ] Review with Jobsworth.

## Phase 5: Verify

- [ ] **Task 21: E2E**
  - Description:
    - Update `node-editor.spec.ts` and `node-model.spec.ts` to the new selectors, keeping every
      scenario.
    - Add `editor-page.spec.ts`, covering:
      - palette search;
      - Add to Canvas;
      - a Tool command;
      - "No problems found";
      - labelling a connection;
      - Go back and redo;
      - save, reload, persist;
      - delete a step;
      - the unsaved guard;
      - Run opens the dialog with no run started;
      - a phone-width no-scroll check.
  - Acceptance: every spec passes against the real backend, with no LLM calls.
  - Verify: `npm run test:e2e -- node-editor.spec.ts node-model.spec.ts editor-page.spec.ts no-tauri-breakage.spec.ts`.
  - Files: `e2e/node-editor.spec.ts`, `e2e/node-model.spec.ts`, `e2e/editor-page.spec.ts`.
  - Depends on: T20. Scope: M.

- [ ] **Task 22: Visual and accessibility pass, then archive**
  - Description:
    - Check the editor against `Main` side by side at 1440×900, in light and dark, in the browser
      and in `make desktop-dev`. The agreed differences are listed in the spec's Success
      Criterion 1.
    - Check AA contrast for the kind inks and tints and the status colours in both themes.
    - Run a keyboard-only pass for Success Criterion 5.
    - Grep for hex.
    - Record the results in `tasks/VERIFICATION-editor.md`, then move the spec, plan and todo to
      `archive/`.
  - Acceptance: Success Criteria 1–6 are met and recorded, and all commands are clean.
  - Verify: the full command list in the spec, plus `rg '#[0-9a-fA-F]{3,8}\b' src/components/node-editor src/lib/stepKinds.ts`.
  - Files: `tasks/VERIFICATION-editor.md`, fixes as found.
  - Depends on: T21. Scope: M.

### Checkpoint: Complete
- [ ] All success criteria are met.
- [ ] Nothing is pushed or opened as a PR without Jobsworth's go-ahead.
