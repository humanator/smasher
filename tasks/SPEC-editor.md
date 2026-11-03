# Spec: `editor`

Module of [CAPABILITY_MAP.md](CAPABILITY_MAP.md). Status: **Approved 2026-11-03.**
Depends on: `shell-theme` (tokens, primitives, `stepKinds`, `AppShell`/`Toolbar`, page-header
context, `libraryStore`). Reuses `LazyRunDialog` (dashboard) and `ModelPicker` (node forms).

Design reference: [Main](../docs/design/redesign/Main.dc.html) (1440×900). It draws one sample
workflow ("Design concepts review") with every inspector state: nothing selected, step settings,
About this step, connection settings, Step guide, and the status bar with and without problems.

## Objective

Rebuild the workflow editor (`/workflows/{id}/edit`, `/workflows/new`) so someone who has never
read a DOT file can:

1. **Find the right step.** The palette names steps in plain language, can be searched, and opens a
   Step guide that explains what each step does and what its settings mean.
2. **Read the workflow on the canvas.** Each step card shows its kind, its name and a one-line summary
   of what it will do. Connections show their labels, and loops are visibly different.
3. **Change settings without knowing attribute names.** The inspector uses plain labels, always-visible
   help, "More about" panels, and "Try:" chips. Every engine setting the design draws is editable,
   including the ones today's app hides.
4. **See what's wrong before running.** Problems are flagged on the step card and in a status bar
   that summarises them and jumps to the first one.

Every capability the current editor has stays reachable: create, import-then-edit, drag to add,
draw and delete connections, save with conflict handling, Export .dot, per-step model choice,
layout persistence.

### Decisions already made (capability map, 2026-10-14)

Screens win over the component board. API changes are additive only. No fake traffic lights: the
artboard's mock lights are not drawn.

### Decisions for this module

| # | Decision |
|---|---|
| D1 | **Confirmed:** explicit **Save** stays, along with the ETag / 412 conflict toast. The toolbar subtitle shows save state instead of autosave: "Unsaved changes" (orange dot), "Saving…", "Saved {relative time}" (green dot). A `beforeunload` guard and an in-app navigation guard warn about unsaved changes. |
| D2 | **Confirmed:** the Model field keeps `ModelPicker` (provider + model from `/api/models`), restyled into the field anatomy. The design's free-text model and chips are not built. Run dialog and Settings are unaffected. |
| D3 | **Confirmed:** delete stays. Backspace/Delete removes the selected step or connection, and the inspector gets a footer button, **Delete Step** / **Delete Connection** (destructive ghost). The edge hover × is removed. |
| D4 | **Confirmed:** handles are hidden until a node is hovered, focused or selected, or a connection drag is in progress. |
| D5 | **Confirmed:** the MiniMap stays, restyled with tokens, bottom-right. xyflow `Controls` go; zoom and Fit move to the toolbar. |
| D6 | **Confirmed:** the Step guide has an **Add to Canvas** button that places the step at the centre of the visible canvas and selects it. This is the keyboard path for adding steps. |
| D7 | **Confirmed:** edges use xyflow `smoothstep` with the design's pill labels, dashed orange loop style and legend. No custom orthogonal router. |
| D8 | Step metadata (plain names, blurbs, About sections, groups, colours) comes from `lib/stepKinds.ts`. Per-field copy (label, help, placeholder, More about rows, Try chips, Required/New badges) goes in a new pure catalogue, `lib/stepFields.ts`, keyed by handler. The palette, inspector and Step guide all read from it, so the copy lives in one place. `nodeConfig.ts` keeps only what the canvas needs (default attrs per kind) and loses `THEME_COLORS`, titles and palette groups. |
| D9 | Validation is a pure client-side function, `lib/workflowProblems.ts`: graph → `{ nodeId?, edgeId?, message }[]`. It covers the design's seven node rules, invalid JSON, a non-integer priority, plus "no Start step", "more than one Start step" and "no Finish step". The server's save-time validation stays authoritative, and its error still shows in an alert. |
| D10 | The toolbar title is the workflow's name, and Back goes to the workflow page (`/workflows/{id}`, "Back to {name}"). Create mode is titled "New workflow", Back goes to Workflows, and the Name + Folder fields sit in a slim bar above the canvas, restyled. |
| D11 | **Run** opens the existing Run dialog for this workflow. With unsaved changes it saves first and opens the dialog only if the save succeeds. A failed save shows the usual error. Hidden in create mode until the first save. |
| D12 | The "New" fields the design marks (connection **Label**, **Retries**/**Wait between attempts**/**Longest wait**/**Randomise the wait**, **Stop waiting after**/**Fallback answer**, **At most at once**, **Stop everything if one fails**) are built. They are plain DOT attributes the engine already reads (`retry.rs`, `interviewer.rs`, `parallel.rs`), and the server round-trips unknown attrs, so no API change is needed. The "New" badge and its tooltip are not shipped: once the app shows the setting, the badge is no longer true. |
| D13 | Phone width (<768px): the palette and inspector become sheets opened from toolbar buttons ("Steps", "Inspector"), the canvas fills the screen, and zoom collapses to Fit only. No sideways page scroll. Editing on a phone works but isn't the primary target. |

## Requirements

### R1. Toolbar (via the page-header context)

Left to right:
1. Back (ghost icon, D10).
2. Title, with the D1 save-state subtitle (11px, muted, coloured dot, `aria-live="polite"`).
3. Zoom group (`role="group"`, "Zoom"): **Zoom out**, current percentage (tabular), **Zoom in**.
   Then **Fit** (outline).
4. Divider.
5. **Export .dot file** (ghost icon, `share`). Same behaviour as today's Export .dot.
6. **Save** (outline). Shows "Saving…" while in flight, and is disabled when nothing has changed.
7. **Run** (default, `play` icon, D11).

The Settings trigger that `App` adds stays where the shell puts it.

### R2. Step library (left, 260px)

- `aside` "Step library", on the source-list background, with a right border.
- **Search steps** input (label visually hidden). It matches plain name, technical name and blurb,
  case-insensitively. Groups with no matches hide. With no matches at all: "No steps match that search."
- Hint: "Drag a step onto the canvas. Select one here to read what it does and what each of its
  settings means."
- Groups and order from `STEP_GROUPS`: AI steps, Tools and checks, People, Flow, Start and finish.
  Groups are not collapsible. Each item is a `<button>` with `aria-pressed`. It holds a chip (group
  tint, lucide icon, group ink), its name and its blurb, and it is also `draggable`. The drag
  payload stays `application/x-workflow-node-type`, so drop-under-pointer still works.
- Clicking an item selects it and shows its Step guide in the inspector (R5.5). Clicking it again,
  or selecting something on the canvas, deselects it.

### R3. Canvas

- Background: the subtle surface token with a dot grid (xyflow `Background` variant dots, 20px gap,
  token colour).
- **Step cards** (`WorkflowNode`), 260 wide:
  - Row 1 holds the chip and the kind name (group ink). When the step has a problem, a
    **Needs attention** badge with a warning dot sits right-aligned.
  - Below that come the step name (14/600, ellipsis) and a summary line (12px muted, ellipsis), using
    the design's per-kind rules: AI Agent shows the prompt (60 chars) or "No instructions yet"; Tool
    shows `$ command` / the tool title / "Add a command" / "Choose a tool"; AI Coordinator shows the
    task or "No task yet"; Ask a person shows "{answer mode} · {question}"; Branch shows "{n} paths
    out"; Nested workflow shows the path or "No file chosen". Other kinds have no summary.
  - Start and Finish are 160×44 pills.
  - Selected: 2px accent border plus the design's accent halo.
  - Nodes are focusable, and each one's accessible name is "{kind}: {name}", plus ", needs attention"
    when it has a problem.
- Handles follow D4 and still respect the rankdir from `flowDirectionContext`.
- **Connections** (`WorkflowEdge`) are `smoothstep`, 2px neutral (3px when selected), with a closed
  arrow. A loop (`loop_restart=true`) is dashed and drawn in the warning ink. Selected uses the
  accent. Labels are pills, with loop and selected variants. Clicking an edge or its label selects
  it. The accessible name is "Connection from {a} to {b}", with ", labelled {label}" when it has one.
- **Legend** at bottom-left: "Then run the next step" / "Go back and redo (a loop)".
- MiniMap at bottom-right (D5), using token colours, kind tint per node.
- Clicking empty canvas clears the selection. Zoom limits stay at today's (`minZoom` 0.1). The graph
  fits on load.
- No raw hex in components. The kind colours come from `stepKinds` (light and dark variants).

### R4. Status bar (28px, under the canvas)

- Left: "{n} steps · {m} connections".
- Right: "No problems found" (green dot) when clean. With one problem it reads "“{label}” {message}.",
  and with more it reads "{N} things to fix.". Either way it ends with a **Review** link button that
  selects the first problem's step or connection and pans to it. The region is `aria-live="polite"`.

### R5. Inspector (right, 360px)

At ≥1100px it is always present; below that it can be closed with **Close inspector**. Each state
uses this header: chip, kind kicker, title, "Also called “{tech}” in workflow files.", Close, and
segmented tabs (**Settings** / **About this step** or **About this connection**), with roving
tabindex.

1. **Nothing selected:** the design's heading, its explanation and "How a workflow runs" (four steps).
2. **Step Settings tab:** Step name, then the kind's fields from `stepFields` in the order drawn,
   then **More settings** ({n} settings) where the design has it, then the D3 delete footer.
   Field anatomy: label, an optional **Required** badge, a **More about {label}** toggle
   (`aria-expanded`, which reveals a card of titled rows), always-visible help, the control, and
   optional **Try:** chips that fill the field. Controls:
   - Text and textarea inputs.
   - Monospace textareas for JSON and commands.
   - Radio groups for choice lists (real `<input type="radio">` in a `fieldset`/`legend`).
   - Switch with an "On"/"Off" label.
   Per kind (labels, help and placeholders exactly as the artboard; attribute in brackets):
   - **AI Agent:** Instructions [`prompt`], Model (D2).
   - **AI Coordinator:** Task [`task`] with chips, Settings (JSON) [`config`], Model.
   - **Tool:** "What should this step run?", Built-in tool | Shell command. Switching clears the
     other mode's attrs.
     - Built-in: Tool [`tool`] radio of the four tools with descriptions; an unknown saved tool name
       still shows today's warning. Tool settings (JSON) [`args`]. Model only for tools that use an
       LLM (`usesLlm`).
     - Shell: Command [`tool_command`], Time limit [`timeout`].
   - **Ask a person:** Question [`question`], "How should they answer?" (Free text / Yes or no /
     Pick from a list). Pick from a list needs Options. Free text adds the **Show a gallery of
     candidates** switch, which reveals Candidates to expect [`candidate_count`]. Choosing a
     non-free-text answer turns the gallery off and clears `candidate_count`. More settings holds
     Stop waiting after [`human.timeout_secs`] and Fallback answer [`human.default_choice`].
   - **Nested workflow:** Workflow file [`pipeline`].
   - **Split:** At most at once [`max_concurrency`], Stop everything if one fails [`fail_fast`].
   - **Join / Start / Finish:** the design's no-settings notes.
   - **Branch:** the design's note, then one "Go to “{target}” when…" field per outgoing connection,
     each editing that edge's `condition` directly. Loops get the extra help sentence. Then the
     **Rule syntax** disclosure.
   - **More settings** for every kind except Start, Finish and Branch: Retries [`max_retries`; any `retries` attr is left alone],
     Wait between attempts [`retry_delay`], Longest wait [`max_retry_delay`], Randomise the wait
     [`retry_jitter`].
   Inline errors: invalid JSON shows "That is not valid JSON yet ({parser message}). The step would
   fail when it runs." A Required field left empty shows the R6 message. Inputs with errors get
   `aria-invalid` and `aria-describedby`.
3. **About this step tab:** the kind's About sections from `stepKinds`.
4. **Connection:** kicker "Connection", title "{from} → {to}". Fields: Label [`label`], "Take this path
   when…" [`condition`] with chips, Priority [`priority`] (whole number, error "Priority must be a
   whole number, like 1 or 5."), Go back and redo [`loop_restart`] switch, the Rule syntax
   disclosure, then **Delete Connection**. Its About tab has the design's five sections.
5. **Step guide** (from the palette): kicker "Step guide", the kind's About sections, then
   "Settings in this step", which lists each field's label, badge and help (Step name excluded;
   "This step has no settings beyond its name." when there are none). Ends with **Add to Canvas** (D6).

Edits apply live to the graph as today (an attr set to `undefined` is removed) and mark it unsaved
(D1). The `{#key}` remount per selection stays.

### R6. Problems (D9)

The node messages are the design's, verbatim: "is missing instructions", "is missing a task", "has
settings that are not valid JSON", "needs a tool chosen", "needs a command", "needs a workflow
file", "needs a list of options". The graph-level messages are "has no Start step", "has more than
one Start step" and "has no Finish step". A graph-level problem has no step, so the status bar shows
it without quoting a label, and Review is hidden. The rule for "missing instructions" and "missing a
task" matches the engine: it fires only when both the field and the step name are empty. Problems
never block Save; they are advice.

### R7. Not changing

- **API and storage:** graph API shapes, ETag/If-Match, the `pos` layout attr, DOT conversion
  (`convert.ts`), import and create endpoints, dagre fallback layout.
- **Dialogs and shell:** the Run dialog, the shell, and `ModelPicker`'s behaviour.
- **API additions:** none expected. If one turns out to be necessary, this spec is amended first.

## Commands

```bash
cd frontend && npm run test -- --run tests/components/node-editor tests/lib   # editor + helpers
cd frontend && npm run test -- --run tests/components/dashboard/WorkflowEditorPage.test.ts
cd frontend && npm run test:e2e -- node-editor.spec.ts node-model.spec.ts editor-page.spec.ts
cd frontend && npm run check && npm run lint && npm run build:check
make desktop-dev                                                               # visual check in Tauri
```

## Project Structure

```
frontend/src/app.css                            → kind ink/tint custom properties, light + dark
frontend/src/lib/stepKinds.ts                   → colours become var(--kind-…) references
frontend/src/lib/stepFields.ts                  → NEW: per-kind field catalogue (D8), pure
frontend/src/lib/workflowProblems.ts            → NEW: graph → problems (D9), pure
frontend/src/lib/nodeSummary.ts                 → NEW: node → card summary line, pure
frontend/src/components/node-editor/
  Palette.svelte                                → rebuilt (R2)
  WorkflowNode.svelte, WorkflowNode.css         → card/pill nodes (R3); css uses tokens only
  WorkflowEdge.svelte                           → smoothstep + pill labels, no × (R3, D3)
  WorkflowCanvas.svelte                         → split up: canvas, toolbar actions, status bar
  EditorToolbarActions.svelte                   → NEW (R1)
  StatusBar.svelte, Legend.svelte               → NEW (R3, R4)
  inspector/                                    → NEW: Inspector, InspectorHeader, Field,
                                                  MoreSettings, RuleSyntax, StepGuide,
                                                  NothingSelected, EdgeSettings, BranchRules
  nodeForms/*                                   → restyled onto Field; StructuralForm splits per kind
  nodeConfig.ts                                 → default attrs only (D8)
frontend/src/components/dashboard/WorkflowEditorPage.svelte, NewWorkflowPage.svelte → D10, D11
frontend/src/App.svelte                         → editor title/back from the page, not static
frontend/tests/ (mirrors src), frontend/e2e/editor-page.spec.ts (NEW)
```

## Code Style

This follows the capability map: runes only, two `ABOUTME:` lines, `$lib/components/ui`
primitives, and theme tokens with no raw hex. Copy lives in `stepFields`, never inline in forms.

```ts
// ABOUTME: Plain-language field catalogue for every step kind the editor can show
// ABOUTME: Palette, inspector and Step guide all read labels, help and chips from here
export interface FieldSpec {
  attr: string;                       // DOT attribute, e.g. 'tool_command'
  label: string;                      // 'Command'
  help: string;
  placeholder?: string;
  control: 'text' | 'textarea' | 'code' | 'choice' | 'switch' | 'model';
  required?: boolean;
  more?: { title: string; text: string }[];
  tryChips?: string[];
  advanced?: boolean;                 // lives under More settings
}
```

## Testing Strategy

- **Unit (Vitest):**
  - `stepFields`: every handler has an entry, attrs are unique per kind, and every
    `stepKinds` handler is covered.
  - `workflowProblems`: one case per rule, the clean graph, both-empty versus name-only for
    prompt/task, and multiple Starts.
  - `nodeSummary`: each kind, truncation and empty states.
- **Component (Vitest + Testing Library, by role and label):**
  - Palette: search, the empty state, selection driving the Step guide, and drag payload.
  - Node: kind, summary, Needs attention badge and accessible name.
  - Edge: loop styling class and accessible name.
  - StatusBar: the zero, one and many problem states, and that Review selects the problem.
  - Inspector: every state in R5, each kind's fields writing the right attr, mode switches clearing
    attrs, Branch rules editing edge conditions, delete buttons, More about toggles, and Try chips.
  - Toolbar: save-state subtitle, Save disabled when clean, Run saving first (D11), and Zoom/Fit.
  - Existing tests that assert old copy or inline colours (`WorkflowCanvas.test.ts` palette text,
    `nodeConfig.test.ts` groups, `nodeStyleFor` colours) are rewritten to the new behaviour, not
    deleted. Every capability they covered keeps a test.
- **E2E (Playwright, real `smasher-web`, no LLM calls):**
  - `node-editor.spec.ts` and `node-model.spec.ts` are updated to the new selectors and keep all
    their scenarios: drag-create, save, reload, drop under the pointer after zoom, the conflict
    toast, the canvas filling the viewport, and fit on load.
  - New `editor-page.spec.ts`: search the palette, add a step with Add to Canvas, set a Tool command,
    see "No problems found", label a connection, toggle Go back and redo, save, reload and check
    persistence, delete a step, check that the unsaved-changes guard fires, and check that Run opens
    the Run dialog without starting a run.
  - Phone-width check: no sideways scroll, and the sheets open.
- Zero warnings from `check`, `lint`, Vitest and Playwright. Light and dark are checked against the
  artboard at 1440×900 in the browser and `make desktop-dev`.

## Boundaries

- **Always:**
  - TDD.
  - Keep `ABOUTME:` headers.
  - Use tokens and `stepKinds` colours, never hex.
  - Use real buttons, radios, labels and fieldsets, with visible focus rings and 4.5:1 contrast in
    both themes.
  - Copy matches the artboard verbatim (en-AU).
  - Commit after each green task.
- **Ask first:**
  - Any `smasher-web` change.
  - New npm dependencies, such as an edge router or a sheet library beyond shadcn's.
  - Changing `ModelPicker` behaviour, since the Run dialog and Settings share it.
  - Dropping any current editor capability.
  - Writing attrs the engine doesn't read.
- **Never:**
  - Draw fake traffic lights.
  - Invent data (no fake "Saved just now").
  - Let problems block Save.
  - Delete or skip failing tests without approval.
  - Run LLM-spending tests unasked.
  - Push or open a PR unasked.

## Success Criteria

1. At 1440×900, light and dark, the editor matches `Main` in layout, hierarchy, copy and tokens,
   checked side by side in the browser and in `make desktop-dev`, with the agreed differences:
   - no traffic lights;
   - smoothstep edges;
   - ModelPicker;
   - MiniMap;
   - delete buttons;
   - Add to Canvas;
   - save-state subtitle.
2. Every R5 field reads and writes its listed attribute, and a save/reload round-trip preserves it
   (unit + E2E).
3. All ten D9 problems are detected, shown on the card and in the status bar, and Review selects
   the offender.
4. The current capabilities all still work:
   - create;
   - edit after import;
   - drag-add under the pointer at any zoom;
   - connect and delete;
   - Export .dot;
   - conflict toast with Save anyway and Reload;
   - per-step model;
   - layout persists.
5. Keyboard only: you can add a step (Add to Canvas), select it, edit every field, delete it, and
   save, all without a mouse.
6. `npm run check`, `lint`, `test -- --run`, the non-LLM `test:e2e` and `build:check` all pass with zero
   warnings. No hex in any file under `node-editor/` or in `stepKinds.ts`.

## Resolved Questions

1. **Retries attr name:** the Retries field reads and writes `max_retries` only. A file that uses
   `retries` (stylesheet or transforms) keeps that attribute untouched. The field doesn't show it or
   rewrite it.
2. **Raw hex in `stepKinds.ts`:** this module moves the group ink and tint colours (light and dark)
   into CSS custom properties in `app.css`, for example `--kind-ai-ink` and `--kind-ai-tint`.
   `stepKinds` then refers to them by `var(...)`, and its `inkDark`/`tintDark` fields go away, because
   the dark values live in the dark theme block. Existing users of `stepKinds` (StepList,
   ProgressList, PrimitivesGallery, run hero) keep rendering the same colours, and their tests keep
   passing.
