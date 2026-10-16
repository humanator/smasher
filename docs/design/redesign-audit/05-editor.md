<!-- ABOUTME: Redesign gap audit section: 05 — Workflow editor audit (Main.dc.html vs `frontend/src/components/node-editor`). -->
<!-- ABOUTME: Findings carry file:line refs, board values and High/Med/Low severity; see README.md for the summary. -->

# 05 — Workflow editor audit (Main.dc.html vs `frontend/src/components/node-editor`)

Design source: `docs/design/redesign/Main.dc.html` (abbreviated **M**). Implementation paths are relative to `frontend/src/`.
Severity: **High** = a whole design feature is missing or the screen looks or behaves materially different. **Med** = a visible difference in copy, layout or control. **Low** = polish.

## 0. Status: the editor has not been rebuilt

- `SPEC.md:39` lists module `editor` ("palette with search + step guide, canvas chrome, plain-language settings inspector…"). There is no `SPEC-editor.md`, only `SPEC.md`, `SPEC-shell-theme.md` and `SPEC-dashboard.md`. No editor plan exists in `tasks/` either.
- `git log` shows no redesign commit under `components/node-editor/`. The latest commits there are ModelPicker and Settings work (`b12d7aa`, `1c962c8`) and older feature work (`ff89dda`, `65759cf`…). `stepKinds.ts` was added in `ebbc2d3` (shell-theme R3) but nothing in the editor uses it.
- `stepKind()` has one consumer, `components/design/PrimitivesGallery.svelte:19,70`, plus its test. `WorkflowCanvas.svelte:20`, `Palette.svelte:6` and `convert.ts:6` all still import `nodeConfig.ts` (`NODE_KIND_CONFIG`, `THEME_COLORS`, `nodeStyleFor`, `PALETTE_GROUPS`). **(High)**
- So the editor is the pre-redesign Svelte Flow editor with shell-theme tokens around it. Almost every section below is a gap.

---

## 1. stepKinds.ts vs M `GROUPS`/`KINDS`/`ICONS`

| Item | Design (M) | `lib/stepKinds.ts` | Sev |
|---|---|---|---|
| Group ink/tint (light) | M:314-318 | `:31-35` match exactly | ✓ |
| Plain names (10 kinds) | M:322-403 | `:39-48` match exactly | ✓ |
| Group membership | M:314-318 | `:39-48` match | ✓ |
| **Group titles + order** ("AI steps", "Tools and checks", "People", "Flow", "Start and finish"; kinds ordered Codergen, Manager / Tool / Interviewer / Conditional, Parallel, FanIn, SubPipeline / Start, Exit) | M:313-319 | Not exported. `StepGroup` is a bare id union (`:16`) with no title or order list, so a palette cannot be built from it | High |
| **`tech` name** | "Human Gate (Interviewer)", "Fan-In", "Sub-Pipeline"; the rest are identical to the handler (M:352,379,387) | `tech: handler` (`:53`) gives "Interviewer", "FanIn", "SubPipeline". The inspector line "Also called “X” in workflow files." (M:703) would read wrong | Med |
| **`blurb`** (palette subtitle) | e.g. "Gives an AI model a brief and lets it do the work." (M:324…401) | Missing | High |
| **`about`** rows (step guide / About tab) | 1–4 `[title, text]` rows per kind (M:325-402) | Missing | High |
| Icons | M:300-311 paths: Codergen = sparkles, Manager = network/org nodes, Tool = `>_` prompt, Interviewer = user, Conditional = diamond, Parallel = split fork, FanIn = merge, SubPipeline = folder, Start = play triangle, Exit = square | `:5-14,39-48`: Bot, Brain, SquareTerminal, User, GitBranch, Split, Merge, Workflow, CirclePlay, Flag. Only User, Split and Merge are lucide equivalents of the board. The closest matches would be `sparkles`, `network`, `terminal`, `diamond`, `folder`, `play`, `square` | Med |
| Dark pairs | Not in the design | `:31-35` derived. They are not CSS tokens, so components have to pick ink or inkDark in JS (the gallery does this) | Low |
| Unknown fallback | — | "Step"/flow (`:52`) as SPEC-shell-theme R3 asks | ✓ |
| Edge (connection) chip | `#E6E9EE` tint, `#334155` ink, arrow path `M4 12h13M13 7l5 5-5 5` (M:734-735) | No connection entry. Note the tint `#E6E9EE` differs slightly from flow `#E8EBF0` | Low |

## 2. Page layout and app chrome

| # | Design | Implementation | Sev |
|---|---|---|---|
| 2.1 | The editor is full-window. The **Step library is the left sidebar** (260px, `#EBEBEE`, traffic-light row 52px, right hairline) (M:21-26). No app sidebar | `App.svelte:150-175` wraps the editor in `AppShell` (220px Library sidebar) **and** adds `Palette` (200px). Two left columns | High |
| 2.2 | Palette 260px (M:21) | `w-[200px]` (`Palette.svelte:35`) | Med |
| 2.3 | Inspector 360px, `#F7F7F9` (muted) bg, left hairline, **always present** (M:136) | `w-[260px] flex-[0_0_260px]`, no bg (`WorkflowCanvas.svelte:416`). Only rendered while something is selected (`:490-559`) | High |
| 2.4 | Canvas bg `#F7F7F9` with `#D1D1D6` 1px dots on a 20px grid (M:80) | Svelte Flow `<Background />` defaults (`WorkflowCanvas.svelte:478`). No `colorMode` is set, so the canvas stays light in dark mode | Med |
| 2.5 | 28px **status bar** footer: "N steps · M connections", then either "● No problems found" (green `#248A3D`) or "● “X” is missing instructions. Review" (orange `#FF9500` dot + link Button) (M:123-131) | Missing | High |
| 2.6 | **Legend** card bottom-left: "Then run the next step" (solid `#AEAEB2`) / "Go back and redo (a loop)" (dashed `#C35A00`). Radius 8, white .92, ring+shadow (M:116-119) | Missing | Med |
| 2.7 | — | Svelte Flow `<Controls />` (bottom-left) and **`<MiniMap />`** (`WorkflowCanvas.svelte:479-480`) are not in the design. The task brief mentions a minimap, but M has none | Med (impl-only) |
| 2.8 | — | Create mode adds an inline Name + Directory (NativeSelect) form above the canvas (`WorkflowCanvas.svelte:429-454`). The design has no create flow | Low (impl-only; needs a design decision) |
| 2.9 | — | Save error as a `<p role=alert>` under the canvas (`WorkflowCanvas.svelte:486-488`). The design surfaces state in the toolbar ("Saved just now") and the status bar | Low |
| 2.10 | `min-width:1180px` design frame | `min-h-[480px]` (`WorkflowCanvas.svelte:426`), `h-[calc(100dvh-52px)]` (`App.svelte:162,171`) | Low |

## 3. Toolbar (52px unified toolbar, M:57-73)

| # | Design | Implementation | Sev |
|---|---|---|---|
| 3.1 | Back: ghost icon button "Back to Design concepts review" → **workflow detail** | `back` falls back to `catalogBack` "Smasher Pipelines" → `/` (`App.svelte:27,155`). The editor never sets `pageHeader.back` | Med |
| 3.2 | Title = **workflow name** (15px bold) + subtitle "● Saved just now" (6px green dot, 11px muted) | Fixed "Edit Workflow" / "Create New Workflow" (`App.svelte:33-36`). No save-state line. Tab title is "Edit Workflow — Smasher" | High |
| 3.3 | Zoom segmented group (radius 7, `rgba(0,0,0,.06)`): icon-sm − / "100%" (12px tabular) / + ; then outline **Fit** | Zoom lives in Svelte Flow `Controls` on the canvas. Nothing in the toolbar | Med |
| 3.4 | 1px × 18px separator | Missing | Low |
| 3.5 | Export: **ghost icon** button (share icon), label "Export .dot file" | `variant="secondary"` text button "Export .dot" (`WorkflowEditorPage.svelte:101-103`) | Med |
| 3.6 | Save: **outline** | Default (primary pink) Button (`WorkflowCanvas.svelte:421`) | Med |
| 3.7 | **Run** primary button with play icon → run | Missing. The editor has no Run action | High |
| 3.8 | — | `LazySettingsDialog` is also in the editor toolbar (`App.svelte:148-151`). Not in the design | Low (impl-only) |

## 4. Palette / step library

| # | Design | Implementation | Sev |
|---|---|---|---|
| 4.1 | Search `Input` (search variant, 28px) "Search steps". It filters on plain + tech + blurb (M:28,814-818) | Missing | High |
| 4.2 | Intro copy, 11px `#636368`: "Drag a step onto the canvas. Select one here to read what it does and what each of its settings means." (M:29) | Missing | Med |
| 4.3 | Empty search: "No steps match that search." (M:33) | Missing | Med |
| 4.4 | 5 groups, sentence case, titles 11px/600 `#636368` (sidebar-muted-foreground), margin 14px 8px 4px (M:817) | 3 groups "Pipeline Steps", "Control Flow", "Structural", in UPPERCASE `tracking-wider` (`nodeConfig.ts:143-147`, `Palette.svelte:42,51`). Groups and kinds differ: Interviewer is under Control Flow, and Parallel/FanIn under Structural | High |
| 4.5 | Groups are not collapsible | Two groups collapse, with hand-drawn ▾/▸ glyph toggles (`Palette.svelte:39-49`) | Low |
| 4.6 | Item: flex, gap 9, padding 6px 8px, radius 6, no border. 26px chip (radius 6, group tint) with a 15px stroke icon in ink. Name 13px/500 + blurb 11px muted, wrapping. Selected bg `rgba(0,0,0,.09)` = `--sidebar-accent` (M:39-47,820-823) | Bordered box tinted with THEME_COLORS. A solid saturated badge with white text abbreviations `LLM`/`TL`/`MGR`/`?`/`IF`/`SUB`/`▶`/`■`/`⑂`/`⑃`. **Tech** title ("Codergen", "Human Gate", "Fan-In"). Description only as a `title` tooltip (`Palette.svelte:58-69`, `nodeConfig.ts:30-101`) | High |
| 4.7 | Click on an item → inspector shows the **Step guide** (kicker "Step guide", title = plain name, About rows, then "Settings in this step" reference list with badges, or "This step has no settings beyond its name.") (M:171-173,275-289,819-821) | No click behaviour. Drag only | High |
| 4.8 | Item is a `<button aria-pressed>` | `div draggable role="listitem"` with no list parent and no keyboard access (`Palette.svelte:58-64`) | Med (a11y) |
| 4.9 | Palette colours (THEME_COLORS) | blue/green/orange/red. Manager, Interviewer and Conditional are all orange. Start is green and Exit red. Does not match the group colours | High |

## 5. Nodes

| # | Design (M:88-108, 755-776) | Implementation | Sev |
|---|---|---|---|
| 5.1 | Card 260×96, radius 10, white bg, border 1px `rgba(0,0,0,.12)`, shadow `0 1px 3px rgba(0,0,0,.08)`, padding 12px 14px, left-aligned | 150px wide, padding 10, 12px text, **centred**, Svelte Flow default radius/border/bg (`WorkflowNode.css:16-24`), plus a THEME_COLORS bg/border inline style (`nodeConfig.ts:123-128`, `convert.ts:145`) | High |
| 5.2 | Row 1: 24px chip (radius 6, tint, 14px icon in ink) + kicker = plain name 11px/600 in group ink + optional **"Needs attention"** Badge (secondary, `#FF9500` dot) right-aligned | Missing. The node renders only `{data?.label}` (`WorkflowNode.svelte:38`) | High |
| 5.3 | Row 2: label 14px/600, ellipsis. Row 3: **summary** 12px muted, ellipsis. Per-kind summaries: Codergen prompt (60 chars) / "No instructions yet"; Tool tool title or "$ cmd" / "Choose a tool" / "Add a command"; Manager task / "No task yet"; Interviewer "Free text · / Yes or no · / Pick from a list · / Gallery · " + question; Conditional "N paths out"; SubPipeline file / "No file chosen" (M:759-768) | Missing | High |
| 5.4 | Start/Exit are **pills** 160×44, radius 999, centred, 22px round chip + label 13px/600 | Same box as every other node | Med |
| 5.5 | Selected: 2px accent border + `0 0 0 4px rgba(190,24,93,.16), 0 4px 12px rgba(0,0,0,.1)` | Svelte Flow default selected border (`WorkflowNode.css:30-35`). No accent, no ring | Med |
| 5.6 | Ports: none drawn in the static board | 4 handles per node (`WorkflowNode.svelte:27-37`) at 0.45 opacity, then **blue `#3b82f6`** once connected (`WorkflowCanvas.svelte:575-592`). Needs a design decision; at minimum use the accent or a token | Med |
| 5.7 | New nodes are labelled… (the design's sample labels are human: "Draft three concepts") | A dropped node is labelled with the tech title, e.g. "Codergen", "Human Gate" (`WorkflowCanvas.svelte:174`) | Med |
| 5.8 | Dagre sizing (`convert.ts:30-31` 180×56) would need to follow a 260×96 card | — | Low |

## 6. Edges

| # | Design (M:779-811) | Implementation | Sev |
|---|---|---|---|
| 6.1 | **Orthogonal** segments, 2px `#AEAEB2` | **Bezier** (`WorkflowEdge.svelte:39`), 2px `#64748b` (`WorkflowCanvas.svelte:603-604`) | Med |
| 6.2 | Selected: 3px accent `#BE185D` | `#3b82f6` blue (`WorkflowCanvas.svelte:605`) | Med |
| 6.3 | **Loop (`loop_restart`) edges dashed** (7px dash / 5px gap) in `#C35A00`, label `#8A4B06` on a `#C35A00` border | No loop styling. `loopRestart` is not used for rendering | High |
| 6.4 | Arrowhead: solid triangle 12×10 in the edge colour | `MarkerType.ArrowClosed` (`convert.ts:167`) | Low |
| 6.5 | Label **pill**: 20px tall, padding 0 8, radius 999, 11px/500, `#3A4556`, white bg, border `rgba(0,0,0,.14)` (accent when selected). The pill is a button that selects the edge | Library default label via `BaseEdge label` (`WorkflowEdge.svelte:52`) | Med |
| 6.6 | Hit area: a 16px transparent band | Library `interactionWidth` | ✓ |
| 6.7 | — | A delete "×" button shows on hover/selection at the label point (`WorkflowEdge.svelte:53-65`) and overlaps the label. Not in the design. The design has no delete affordance on the canvas or in the inspector, so this needs a decision | Med (impl-only) |

## 7. Inspector — shared chrome

| # | Design | Implementation | Sev |
|---|---|---|---|
| 7.1 | **Nothing selected** state: "Nothing selected" (15px bold), the copy "Select a step or a connection on the canvas to change its settings. Every setting comes with a plain-language explanation.", then "How a workflow runs" as a 4-item ordered list in a white card (radius 8) (M:138-149) | The inspector is hidden instead | High |
| 7.2 | Header (padding 14px 16px 12px, bottom hairline): 32px chip (radius 7, tint) with a 17px icon, kicker = plain kind in ink 11px/600, **title = step label** 15px/700, sub "Also called “{tech}” in workflow files." 11px muted, ghost icon-sm **X** close (M:153-164,698-704) | Title = tech title ("Codergen") as `font-semibold text-sm`, then a description paragraph from nodeConfig (`WorkflowCanvas.svelte:494-510`). No chip, kicker or label title. Close is a `×` text glyph in an `icon-xs` button (`:498-506`) | High |
| 7.3 | **Tabs** (macOS segmented, radius 7, `rgba(0,0,0,.06)`, segment 20px): "Settings" / "About this step" (or "About this connection"). About lists the KINDS.about rows (12px muted heading, 13px body) (M:165-170,268-274) | Missing. No About content exists anywhere | High |
| 7.4 | Field template: label 13px/500 + optional Badge ("Required" outline / "New" secondary with title "The workflow engine supports this setting, but the current app does not show it yet.") + right-aligned outline icon-xs **help (?)** button that toggles a white detail panel (radius 10) of titled rows. Help text 12px muted **under the label, above the control**. Field gap 20px (M:205-262) | Plain `Label` + control, gap 12px (`gap-3`). No help text (except a few hints placed after the control), no help toggle, no Required badges | High |
| 7.5 | Body padding 20px | `p-2.5` on the whole aside | Low |
| 7.6 | "Try:" chip row of outline xs Buttons (models, tasks, conditions) (M:244-251) | Missing. Manager uses a native `<datalist>` (`ManagerForm.svelte:66-76`) | Med |
| 7.7 | "More settings" disclosure (chevron, top hairline `#E2E2E7`, meta "N settings") holding retries/backoff and other "New" settings (M:186-191,722-725) | Missing | Med |
| 7.8 | Validation shown **in the field** (Input/Textarea `state=invalid` + error). Copy: "That is not valid JSON yet (msg). The step would fail when it runs." | A separate `<p role=alert>` "Invalid JSON: msg" (`ToolForm.svelte:175`, `ManagerForm.svelte:91`). The control never gets `aria-invalid`, although the primitives style it (`input.svelte:16`) | Med |

## 8. Inspector — per step kind (Settings tab)

Common field. Design: **"Step name"** with kind-specific help ("Shown on the canvas and in run logs. If Instructions is empty, this name is used as the instruction.", M:567-568). Implementation: "Label" with no help (`WorkflowCanvas.svelte:517-527`). **Med**

**AI Agent (Codergen)** (M:570-578 vs `CodergenForm.svelte`)
- "Instructions" Textarea, 7 rows, proportional font, placeholder "e.g. Read the brief and draft three concepts…", help and detail rows. The implementation has "Prompt", 4 rows, `font-mono text-xs`, no placeholder or help (`:38-46`). **Med**
- Model: design has a single text field (placeholder "Workflow default") with Try chips `claude-sonnet-5`, `claude-opus-4-20250514` and help. The implementation uses ModelPicker: **Provider** select + **Model** select, "Server default" (`ModelPicker.svelte:21`, `CodergenForm.svelte:48-53`). The provider select is not in the design. Product needs to decide which wins; the implementation is probably more correct for multi-provider. **Med**

**AI Coordinator (Manager)** (M:579-587 vs `ManagerForm.svelte`)
- Task: help "What should the coordinator work out?…". The implementation places a long help paragraph *after* the field (`:78`). The design uses chips; the implementation uses a datalist. **Low/Med**
- "Settings (JSON)" vs "Config (JSON)" (`:80`), placeholder `{ }` missing. **Med**
- The implementation shows ModelPicker (`:93-99`), which the design does not have. **Low (impl-only)**

**Tool** (M:588-610 vs `ToolForm.svelte`)
- "What should this step run?" is a **radio list with descriptions** ("Built-in tool — A ready-made check or capture from Smasher." / "Shell command — Any command on your computer."), with help "Choose one. A step cannot do both." The implementation has "Runs" + NativeSelect (`:123-133`). **High**
- Tool: a radio list of 4 with **human titles** ("Screenshot a design", "Design-system check", "Usability critique", "Summarise critiques") and descriptions, plus a Required badge. The implementation is a NativeSelect of raw values `render_capture`… (`:148`) with the description below; the descriptions are worded differently (`:37-42`). **High**
- "Tool settings (JSON)" vs "Args (JSON)" (`:164`). **Med**
- "Command" with a Required badge and help "The command to run, from the run’s working folder. It succeeds only if it finishes with exit code 0." The implementation has a hint after the field mentioning `sh -c` (`:197-200`). **Low**
- "Time limit", placeholder "600", vs "Timeout", placeholder "600 (seconds), or e.g. 30s" (`:203,210`). **Low**
- The implementation adds ModelPicker for task_critic/synthesis and an unknown-tool warning (`:177-183,158-162`). **Low (impl-only)**

**Ask a person (Interviewer)** (M:611-637 vs `InterviewerForm.svelte`)
- Order in the design: Question → How should they answer? → Options / Gallery → Candidates. The implementation runs Question → Gallery → Candidate count → Answer mode → Options. **Med**
- Answer mode: the design has a radio list "Free text / Yes or no / Pick from a list" with descriptions. The implementation has the select "Answer mode": "Free-form / Yes / No / Options list" (`:161-173`) and **disables the select while the gallery is on** (`:167`). In the design, changing the mode simply turns the gallery off. **High**
- Gallery: design is a **Switch** "Show a gallery of candidates" with On/Off text. The implementation is a Checkbox "Gallery gate" (`:135-142`). **Med**
- "Candidates to expect", placeholder "3", vs "Candidate count", placeholder "e.g. 3 or phase_default(discover)", plus a developer-voice hint "Read by the gallery dashboard card only…" (`:147-156`). **Med**
- "Options" with a Required badge and help "Separate the choices with commas." vs "Options (comma-separated)" (`:178`). **Low**
- Question textarea is `font-mono` (`:127`); the design is proportional. **Low**
- Missing proposed settings "Stop waiting after (seconds)" and "Fallback answer" (New). **Low**

**Branch (Conditional)** (M:708-718)
- The design shows Step name, an explanatory note, then **one "Go to “X” when…" condition field per outgoing edge** with Try chips, and a "Rule syntax" disclosure. The implementation shows StructuralForm: "This node kind has no additional fields beyond its label." (`StructuralForm.svelte:20`). **High**

**Split (Parallel)**. Design: "At most at once" + "Stop everything if one fails" (both New). Implementation: StructuralForm. **Med**
**Join (FanIn) / Start / Finish**. Design: a white note card with kind-specific copy ("This step has no settings. It waits for the paths started by a Split…"). Implementation: the generic sentence. **Low**
**Nested workflow (SubPipeline)**. "Workflow file" + Required badge + help vs "Pipeline file" (`SubPipelineForm.svelte:29`). **Low**
**Retries** (all kinds except Start/Exit, New): Retries, Wait between attempts, Longest wait, Randomise the wait. Missing. **Low** (they are marked as proposed)

## 9. Inspector — connection

| Design (M:663-685, 732-746) | Implementation (`EdgeForm.svelte`, `WorkflowCanvas.svelte:531-558`) | Sev |
|---|---|---|
| Header: kicker "Connection", title "From → To" (node labels), chip `#E6E9EE` with an arrow icon, tabs "Settings / About this connection" | Title "Edge" only (`WorkflowCanvas.svelte:535`), close "×" | High |
| **Label** field (New badge) with help on good/bad labels | Missing. The edge label cannot be edited at all | Med |
| "Take this path when…", placeholder "e.g. outcome=success", help, Try chips `outcome=success`/`outcome=fail`, detail rows | "Condition", placeholder "e.g. x > 5 (falls back to this edge's label if blank)" (`EdgeForm.svelte:68-76`). The `x > 5` example also doesn't match the documented syntax (`count>10`) | Med |
| Priority, placeholder "0", help; error "Priority must be a whole number, like 1 or 5." in the field | Placeholder "e.g. 1"; error "priority must be a whole number" in a separate `<p>` (`:53,90-92`) | Low |
| **Switch** "Go back and redo" with help + safety-stop detail | Checkbox "Loop restart" (`:94-100`) | Med |
| "Rule syntax" disclosure → table of 8 operators + outcome footnote (M:193-203,436-445) | Missing | Med |
| About tab: 5 rows (What it does, Rules, Labels, When more than one matches, Loops) | Missing | Med |

## 10. States and interactions

| # | Design | Implementation | Sev |
|---|---|---|---|
| 10.1 | Live validation (M:487-507): missing instructions/task/tool/command/file/options, invalid JSON → node badge + status bar + "Review" jumps to the first issue | None, apart from inline JSON and priority errors | High |
| 10.2 | Click the empty canvas → Nothing selected | Pane click clears the selection and **hides** the inspector (`WorkflowCanvas.svelte:225-228`) | Med (follows 7.1) |
| 10.3 | Click a palette item → step guide | None (see 4.7) | High |
| 10.4 | Select an edge by clicking its line or label pill | Line click works; the label isn't a button | Low |
| 10.5 | Tab focus ring `0 0 0 3px rgba(190,24,93,.4)` | Primitives use the `ring` token ✓. Palette entries are not focusable | Med |
| 10.6 | — | Dark mode: canvas, nodes, handles, edges and palette all use fixed light hex values or library defaults. `SvelteFlow` gets no `colorMode` | High |

## 11. Design-system usage audit

### Raw hex / rgb
| File:line | Value | Fix | Sev |
|---|---|---|---|
| `components/node-editor/nodeConfig.ts:109-114` | `THEME_COLORS` `#e0edff #3b82f6 #e3f9e5 #22c55e #fff4e0 #f97316 #fde8e8 #ef4444` | Delete; use `stepKind().tint/ink` | High |
| `nodeConfig.ts:123-128` | `nodeStyleFor` writes an inline `background-color`/`border-color` style onto every node (used at `convert.ts:145`, `WorkflowCanvas.svelte:173,357`) | Replace with a class + tokens | High |
| `Palette.svelte:65,67` | inline `style` from THEME_COLORS, fallback `#94a3b8` | stepKinds | High |
| `Palette.svelte:81-82` | `#94a3b8`, `#f8fafc` fallbacks | remove | Med |
| `Palette.svelte:67` | `text-white` on `#22c55e`/`#f97316` badges, about 2.2–2.8:1 contrast (fails AA) | — | Med |
| `Palette.svelte:68` | `text-slate-900` (Tailwind palette, not a token; ignores dark mode) | `text-foreground` | Med |
| `WorkflowCanvas.svelte:590-591` | handle `#3b82f6` | `var(--primary)` or a token | Med |
| `WorkflowCanvas.svelte:603-605` | `--xy-edge-stroke-default: #64748b`, selected `#3b82f6` | Map to tokens (design `#AEAEB2` edge, accent selected); a loop token for `#C35A00` is needed | Med |
| `WorkflowEdge.svelte:58` | `hover:text-white` | `hover:text-primary-foreground`/destructive-foreground | Low |
| `WorkflowNode.css:16-35` | No hex, but every value is a Svelte Flow `--xy-*` default, not an app token. So nodes ignore `--card`, `--border`, `--radius` and dark mode | Restyle on tokens (`bg-card`, `border-border`, `rounded-[10px]`/`--radius-xl`…) | Med |
| `stepKinds.ts:31-35` | hex in TS. Allowed by the spec ("use tokens or stepKinds"), but there are no CSS custom properties for the kind colours, so dark switching has to happen in JS | Consider `--kind-ai-ink` etc. tokens | Low |

### Arbitrary Tailwind values
- `Palette.svelte:35` `w-[200px]` (design 260). **Low**
- `WorkflowCanvas.svelte:416` `w-[260px] flex-[0_0_260px]` (design 360). **Low**
- `WorkflowCanvas.svelte:426` `min-h-[480px]`; `App.svelte:162,171` `h-[calc(100dvh-52px)]`. These are acceptable layout values; a shared toolbar-height token would be cleaner. **Low**
- `WorkflowEdge.svelte:58` `size-[18px]` duplicates `size="icon-xs"` (already 18px, `button.svelte:23`) and overrides its radius with `rounded-full`. **Low**
- `ModelPicker.svelte:82-83` `sm:grid-cols-[minmax(0,1fr)_230px]` (rows layout; not used in the editor). **Low**

### Hand-rolled controls, or the wrong primitive
- Close buttons render a `×` text glyph with `text-base` (`WorkflowCanvas.svelte:498-506,536-544`; `WorkflowEdge.svelte:55-64`). Should be a lucide `X` in `Button size="icon-sm"`, as in the design. **Low**
- Palette group toggles: a ghost Button with ▾/▸ glyphs (`Palette.svelte:39-49`). An `accordion` primitive exists. The design has no collapsing anyway. **Low**
- Palette entries are hand-rolled bordered divs with an inline-styled badge (`Palette.svelte:58-69`). They should be buttons styled like sidebar rows (`ui/sidebar` menu button) plus a kind chip. **Med**
- Binary settings use `Checkbox` (`EdgeForm.svelte:94`, `InterviewerForm.svelte:135`). The design uses a Switch, and `ui/switch` exists. **Med**
- Option choices use `NativeSelect` (`ToolForm.svelte:124,139`, `InterviewerForm.svelte:162`). The design's radio cards have **no `ui/radio-group` primitive**, so one is missing from the kit. **Med**
- Inspector tabs: the design uses a segmented Tabs control and `ui/tabs` exists. Not used. **Med**
- Required/New badges: `ui/badge` (with `dot`) exists. Not used. "Needs attention" badge not used. **Med**
- The validation message is a separate `<p>` instead of `aria-invalid` on Input/Textarea (`ToolForm.svelte:175`, `ManagerForm.svelte:91`, `EdgeForm.svelte:90-92`). **Low**
- `Textarea class="font-mono text-xs"` on prose fields (prompt, question) (`CodergenForm.svelte:41`, `InterviewerForm.svelte:127`). Keep mono only for JSON and command fields. **Low**

### Local CSS reimplementing or overriding primitives
- `WorkflowNode.css` (whole file) copies Svelte Flow's `.svelte-flow__node-default` styling verbatim. It is global, unscoped CSS. **Med**
- `WorkflowCanvas.svelte:562-626` uses global `:global(.svelte-flow…)` overrides for handles and edge colours with hex. The edge-SVG sizing fix (`:621-625`) is a legitimate workaround. **Low**
- `Palette.svelte:79-84` uses a scoped `<style>` for entry colours. **Low**

## 12. Implementation features with no design counterpart (need a decision)
1. MiniMap + Controls (`WorkflowCanvas.svelte:479-480`).
2. Edge delete button (`WorkflowEdge.svelte`). The design has no delete on canvas or inspector, and keyboard Backspace (library default) remains.
3. Four connection handles per node with "connected" highlight.
4. Provider + model picker on Codergen, Manager and LLM tools.
5. Create-mode Name/Directory form; 412 conflict toast with Reload / Save anyway (`WorkflowEditorPage.svelte:24-33`).
6. Unknown-tool warning (`ToolForm.svelte:158-162`).
7. Collapsible palette groups.
8. Settings dialog button in the editor toolbar.
