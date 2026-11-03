# Implementation Plan: `editor`

Spec: [SPEC-editor.md](SPEC-editor.md) (approved 2026-11-03), part of [CAPABILITY_MAP.md](CAPABILITY_MAP.md).
The task list is in [todo-editor.md](todo-editor.md).

## Overview

This plan rebuilds the workflow editor (`/workflows/{id}/edit` and `/workflows/new`) to match the
`Main` artboard. That covers a plain-language step library with search and a Step guide, card nodes
with problem badges, smoothstep connections with a legend, a status bar, and an inspector driven by
a field catalogue that shows every engine setting the design draws. It keeps explicit Save,
ModelPicker, delete, the MiniMap and the conflict toast. It adds Add to Canvas for keyboard users.
No server changes.

Order:
1. The pure logic in `lib/`, unit-tested without a DOM.
2. The canvas: nodes, edges, chrome, palette.
3. The inspector, one kind at a time.
4. The page: toolbar, Run, create mode, phone width.
5. E2E and the visual pass.

The editor works at every commit. Each task swaps one piece of `WorkflowCanvas` for its
replacement, and the old forms stay mounted until their kind's new form lands.

## Starting state (checked 2026-11-03)

- **Branch:** `claude/agent-skills-frontend-design-f96332` at `47a29b07`, clean. The spec is
  committed. `shell-theme`, `dashboard`, `workflow-detail` and `run` are done.
- **Where the editor lives:** `WorkflowEditorPage` and `NewWorkflowPage` mount
  `node-editor/WorkflowCanvas.svelte`, which is 628 lines and owns:
  - palette, canvas, inspector and save;
  - the `saveAction` page-actions snippet;
  - create-mode fields;
  - drop handling via `FlowPositionBridge`.
- **Shell:** the editor already sits in `AppShell`. Its title ("Edit Workflow" / "Create New
  Workflow") and back link ("Smasher Pipelines") are static in `App.svelte:22-44`.
- **Colours:**
  - `stepKinds.ts` has group colours as hex (`ink`, `tint`, `inkDark`, `tintDark`), used by
    `StepList` and `PrimitivesGallery`.
  - The editor ignores `stepKinds` and uses `nodeConfig.ts` (`THEME_COLORS`, the old titles and
    groups).
- **UI primitives** already exist for everything the inspector needs: `radio-group`, `switch`,
  `sheet`, `tabs`, `toggle-group`, `textarea`, `field`, `badge` and `tooltip`.
- **Tests that pin old behaviour:**
  - `WorkflowCanvas.test.ts` (~800 lines; it asserts the old palette text and inline
    `backgroundColor`);
  - `nodeConfig.test.ts` (the three old groups);
  - `nodeForms/*.test.ts`;
  - `WorkflowEditorPage.test.ts`;
  - `e2e/node-editor.spec.ts` and `e2e/node-model.spec.ts`.
- **Engine attributes:** the engine reads every new attribute the inspector writes. `max_retries`,
  `retry_delay`, `max_retry_delay` and `retry_jitter` are in `retry.rs`; `human.timeout_secs` and
  `human.default_choice` in `interviewer.rs`; `max_concurrency` and `fail_fast` in `parallel.rs`.

## Architecture Decisions

- **Kind colours become tokens first (Task 1).**
  - `app.css` defines `--kind-{group}-ink` and `--kind-{group}-tint` in the light block and the
    dark block. `stepKinds` exposes `ink: 'var(--kind-ai-ink)'` and so on, and drops `inkDark` and
    `tintDark`.
  - `StepList` and `PrimitivesGallery` switch to the vars, so their rendered colours don't change.
  - The tokens are also exposed to Tailwind via `@theme inline` (`bg-kind-ai-tint`), so
    components never interpolate style strings.
- **One field catalogue (`lib/stepFields.ts`).**
  - It is data only: `FieldSpec[]` per handler, plus `CONNECTION_FIELDS`, `RULE_SYNTAX`,
    `NOTHING_SELECTED` and the per-kind notes.
  - A single `Field.svelte` renders any `FieldSpec`: label, Required badge, More about,
    help, control, Try chips and error. Each kind's form is then a short composition of `Field`s
    plus that kind's special rules (mode switches, the gallery, Branch rules).
  - The old forms are rewritten in place, so their test ids can stay where they are still useful.
    The spec's copy is verbatim in the catalogue.
- **Three pure helpers carry all derived state.**
  - `nodeSummary(node)` → the card's summary line.
  - `workflowProblems(graph)` → `Problem[]`.
  - The `stepFields` lookups.
  - The canvas computes `problemsByNode` once per graph change with `$derived`, and the cards,
    status bar and accessible names read from it.
- **Splitting `WorkflowCanvas`.** It stays the owner of graph state (`nodes`, `edges`,
  selection, dirty). New siblings receive props and callbacks:
  - `EditorToolbarActions`
  - `StatusBar`
  - `Legend`
  - `inspector/Inspector`
  - the rebuilt `Palette`

  The selection is one discriminated value: `{kind:'none'} | {kind:'node',id} | {kind:'edge',id} |
  {kind:'guide',handler}`.
- **Zoom outside the flow.** The toolbar snippet renders in `Toolbar`, outside the `SvelteFlow`
  context, so `useSvelteFlow()` can't be called there. `FlowPositionBridge` grows into
  `FlowBridge`, which hands up `screenToFlowPosition`, `zoomIn`, `zoomOut`, `fitView`, `setCenter`
  and a reactive zoom level (`onviewportchange`). The toolbar, Review (pan to a node) and Add to
  Canvas (centre of the view) use it. This is the same pattern as today, widened.
- **Dirty state.**
  - `dirty` is set by any change to node or edge data, by add/delete, and by node moves that end in
    `onnodedragstop`, because `pos` is saved. It is cleared by a successful save or a reload.
  - The subtitle reads "Unsaved changes" / "Saving…" / "Saved {relative}" via
    `usePageSubtitle`. "Saved {relative}" appears only after a save in this session; on load the
    subtitle is empty, so it never claims a save it didn't see.
  - Guards: `beforeunload` while dirty. For in-app navigation, the SPA's own router in `App.svelte`
    is checked in Task 17. If it has no hook, the plan adds a small `navigationGuard` in `lib/`
    that its link handler consults.
- **Title and back from the page.** `WorkflowEditorPage` calls `usePageTitle`, `usePageBack` and
  `usePageSubtitle`, and `App.svelte` drops its static editor strings. This matches how the
  run and workflow pages already work.
- **Delete.** `deleteSelection()` in the canvas is used by Backspace/Delete (xyflow's
  `deleteKey`) and by the inspector footer. The edge hover × goes. `edgeActions.onDeleteEdge`
  stays as the single path for deleting edges.
- **Smoothstep edges.** `WorkflowEdge` uses `getSmoothStepPath` with `EdgeLabel` for the pill. A
  loop gets a `data-loop` attribute and a dashed stroke in the human-group ink. No new dependency.
- **Phone width last (Task 20).** At under 768px the palette and inspector render inside
  `Sheet`s. Desktop layout work in earlier tasks uses the breakpoints the spec names (1100px for
  the inspector close), so Task 20 only adds the sheet path.

## Dependency Graph

```
T1 kind tokens ─┬─> T6 nodes ─┬─> T8 chrome+status ─> T9 palette ─┐
T4 nodeSummary ─┘             │                                    │
T5 problems ───────────────────┘                                    │
T2 step fields ─┐                                                   ▼
T3 conn fields ─┴─> T10 inspector shell ─> T11..T15 forms ─> T16 guide+Add to Canvas
T7 edges (after T1) ─────────────────────────> T15 connection
T16 ─> T17 toolbar/save state ─> T18 Run ─> T19 create mode ─> T20 phone ─> T21 e2e ─> T22 visual
```

T2–T5 can be built in any order, or in parallel, after T1. From T6 onwards every task touches
`WorkflowCanvas.svelte` or its tests, so the work is sequential.

## Task List

The full tasks are in [todo-editor.md](todo-editor.md).

- **Phase 1, Foundation:** T1 tokens, T2 step fields, T3 connection fields and copy, T4
  nodeSummary, T5 workflowProblems.
- **Phase 2, Canvas:** T6 nodes, T7 edges and legend, T8 chrome and status bar, T9 palette.
- **Phase 3, Inspector:** T10 shell, T11 AI and nested steps, T12 Tool, T13 Ask a person, T14
  flow kinds and More settings, T15 connection and Branch rules, T16 Step guide and Add to Canvas.
- **Phase 4, Page:** T17 toolbar and save state, T18 Run, T19 create mode, T20 phone width.
- **Phase 5, Verify:** T21 E2E, T22 visual and accessibility pass, then archive.

There is a checkpoint after each phase.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `WorkflowCanvas.test.ts` is large and pinned to old copy and colours | Med | Rewrite assertions alongside each task that changes them, not in one sweep. Each capability keeps a test, and deletions are listed in the commit. |
| There may be no navigation hook in the SPA's router for the unsaved guard | Med | T17 checks first. Fallback: a `navigationGuard` the router's link handler consults. If that needs more than ~1 file in the router, stop and ask. |
| Node drags marking the graph dirty are noisy | Low | Count only `onnodedragstop` with a changed position. Fit/zoom never count. |
| Smoothstep labels overlap on dense graphs | Low | Accept, as agreed in D7. The label offset follows the xyflow default. Revisit only if the sample graph is unreadable. |
| Kind colour tokens shift the look of the run and workflow pages | Low | T1 keeps the exact values. A StepList snapshot of computed colours, plus a visual check of the workflow page. |
| A ModelPicker restyle leaks into the Run dialog and Settings | Med | Wrap it, don't change it. The `Field` provides the label and help, and ModelPicker keeps its own props and behaviour (Ask first otherwise). |
| E2E selectors churn | Med | Keep test ids on controls that still exist. New elements get role- and label-based queries. T21 updates specs without dropping scenarios. |

## Open Questions

None. The spec's two open questions were resolved on 2026-11-03.
