# Spec: `shell-theme`

Module of [CAPABILITY_MAP.md](../CAPABILITY_MAP.md). Status: **Approved 2026-10-14.**
Depends on: nothing. Every other module depends on this one.

Design references: [Sidebar](../../docs/design/redesign/Sidebar.dc.html) and the shell around
[Home](../../docs/design/redesign/Home.dc.html), [Workflow](../../docs/design/redesign/Workflow.dc.html) and
[Run](../../docs/design/redesign/Run.dc.html). Primitives come from the 13 component boards
(`Button`, `Badge`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Tabs`, `ToggleGroup`,
`Accordion`, `Tooltip`, `Popover`, `Drawer`).

## Objective

Give every screen the redesign's frame and visual language before any single screen is rebuilt:

1. **Theme.** Retuned tokens (light and derived dark), the system font stack, and restyled
   shadcn-svelte primitives that match the macOS component boards.
2. **Step vocabulary.** One source for each step kind's plain name, technical name, group,
   icon and colours, so every screen describes steps the same way.
3. **App shell.** A source-list sidebar and a 52px unified toolbar replace today's
   `PageHeader` bar. The sidebar shows what needs attention.
4. **Native title bar.** In `smasher-desktop` the content runs under a transparent title bar
   with the real traffic lights. In a browser there are no traffic lights.
5. **Needs-you data.** The API exposes each run's pending-question count, so the shell can tell
   "needs you" apart from "running".

After this module, the existing pages run inside the new shell and look the new way. Their
content layouts are left alone; the four screen modules rebuild those.

## Requirements

### R1. Tokens (`frontend/src/app.css`)

Write the tokens as hex or rgba so a test can check contrast. These are the light values, taken
from the boards:

| Token | Light | Use |
|---|---|---|
| `--background` | `#FFFFFF` | content area |
| `--foreground` | `#1D1D1F` | body text |
| `--muted` | `#F7F7F9` | table headers, zebra rows, step lists |
| `--muted-foreground` | `#6E6E73` | secondary text on white/muted |
| `--sidebar` | `#EBEBEE` | source list |
| `--sidebar-foreground` | `#1D1D1F` | |
| `--sidebar-muted-foreground` | `#636368` | section labels, counts, footer (on `#EBEBEE`) |
| `--sidebar-accent` | `rgba(0,0,0,.09)` | selected row |
| `--primary` | `#BE185D` | accent fill, icons, focus |
| `--primary-foreground` | `#FFFFFF` | |
| `--primary-subtle` / `--primary-subtle-foreground` | `#FCEEF4` / `#9D174D` | active-run banner |
| `--secondary` | `rgba(0,0,0,.06)` | recessed buttons, segmented track, secondary badge |
| `--destructive` / `--destructive-subtle` | `#C4170F` / `rgba(255,59,48,.12)` | |
| `--success` | `#28C840` | completed dot |
| `--info` | `#007AFF` | running dot |
| `--border` | `rgba(0,0,0,.08)` | |
| `--input` | `rgba(0,0,0,.14)` | field borders |
| `--ring` | `rgba(190,24,93,.4)` | focus ring, 3px spread |
| `--radius` | `6px` | controls; cards/step lists `10px`, tables `8px` |

- **Dark:** derive a value for every token above under `.dark`: macOS dark surfaces
  (content around `#1E1E1E`, source list around `#2A2A2D`), the same accent hue, lightened only
  as far as AA contrast needs. Dark mode follows the OS: mount `mode-watcher` (already a
  dependency) with system mode, and add no theme toggle.
- **Type:** `font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif`. Body is
  13px/1.38, captions 11–12px, toolbar title and section headings 15px/700. Mono is
  `ui-monospace, Menlo, monospace`. Remove the `@fontsource-variable/manrope` and `figtree`
  imports and devDependencies.
- **Contrast:** these pairs must meet WCAG AA (4.5:1) in both themes:
  - foreground on background, muted and sidebar
  - muted-foreground on background and muted
  - sidebar-muted-foreground on sidebar
  - primary-foreground on primary
  - primary-subtle-foreground on primary-subtle
  - destructive on background and destructive-subtle

### R2. Primitives (`frontend/src/lib/components/ui/*`)

Restyle the variant and size class strings in the owned shadcn-svelte files to match the
boards. Keep each component's props and exports, so callers don't change.

- **Button:** variants `default` (accent fill), `outline` (white push button with hairline +
  shadow), `secondary`, `ghost` (toolbar), `destructive` (push button, red text), `link`.
  Sizes: `xs` 18, `sm` 22, `default` 24, `lg` 28, `icon-xs` 18, `icon-sm` 24, `icon` 28,
  `icon-lg` 32 (px).
- **Badge:** an 18px capsule, 11px/500, with an optional status `dot` prop (new, additive).
- **Input / Textarea / NativeSelect:** 24px fields, a 1px `--input` border, an accent border plus
  ring on focus, and a red border plus ring when invalid. Input gets a `search` style: 28px,
  filled, leading magnifier. NativeSelect gets the accent stepper chevron.
- **Checkbox (14px), Switch (38×22, `sm` 26×15), Tabs** (segmented by default, plus a `line`
  variant), **ToggleGroup, Accordion** (grouped disclosure box), **Tooltip, Popover**
  (with arrow) and **Drawer** (sheet/inspector): match their boards.
- **Touch targets:** at `(pointer: coarse)` every interactive primitive gets a hit area of at
  least 44px, using padding or a pseudo-element, without changing its desktop size.

### R3. Step vocabulary (`frontend/src/lib/stepKinds.ts`)

`stepKind(handler: string): StepKind` returns
`{ plain, tech, group, icon, ink, tint, inkDark, tintDark }`. It covers every kind in
`node-editor/nodeConfig.ts`. Canonical values come from `Main.dc.html` `GROUPS`/`KINDS`:

| Group | ink / tint (light) | Kinds → plain name |
|---|---|---|
| `ai` "AI steps" | `#3730A3` / `#ECEBFB` | Codergen → AI Agent, Manager → AI Coordinator |
| `tool` "Tools and checks" | `#0F5F5A` / `#E1F1EF` | Tool → Tool |
| `human` "People" | `#8A4B06` / `#FBEEDA` | Interviewer → Ask a person |
| `flow` "Flow" | `#334155` / `#E8EBF0` | Conditional → Branch, Parallel → Split, FanIn → Join, SubPipeline → Nested workflow |
| `edge` "Start and finish" | `#1E6B2E` / `#E3F3E6` | Start → Start, Exit → Finish |

An unknown handler falls back to plain "Step", group `flow`. `Workflow.dc.html` uses slightly
different hexes. This table wins. Icons are `@lucide/svelte` equivalents of the board paths.
`ink` on `tint` must meet 4.5:1.

### R4. App shell (`frontend/src/components/shell/`)

`AppShell.svelte` wraps every route in `App.svelte`. It is built on the existing
`ui/sidebar` primitive.

- **Sidebar** (220px, `--sidebar`, right hairline):
  - **Header row (52px).** Native: an empty drag region that leaves room for the traffic
    lights (left inset ≥ 78px). Browser: the "Smasher" wordmark. Both show a toggle button
    (`aria-label="Toggle sidebar"`, `aria-expanded`). Collapsed is 76px wide, icons only, with
    a `title` on each row.
  - **`nav[aria-label="Library"]`** with section label "Library" and three 28px rows, each with
    an accent icon and a right-aligned count:
    - **Workflows** → `/`. Count = number of workflows.
    - **Recent runs** → `/#runs`. Count = number of runs.
    - **Needs you** → `/?runs=needs-you#runs`. Count is shown as an accent pill and hidden at 0.
  - **`nav[aria-label="Workflows"]`** lists every workflow by display name (`formatWorkflowName`)
    and links to `/workflows/{id}`. The current one has `aria-current="page"` and the
    `--sidebar-accent` fill. It scrolls when long. A trailing 7px dot shows state:
    - accent if any of the workflow's runs needs you
    - `--info` if one is running
    - none otherwise

    Every dot has visually hidden text: "needs you" or "running".
  - **Footer** (11px, sidebar-muted): "Smasher · {n} run needs your decision" or
    "… {n} runs need your decision". Plain "Smasher" when n = 0.
- **Toolbar** (`Toolbar.svelte`, 52px, bottom hairline, drag region in native):
  - an optional ghost icon back button (`aria-label` "Back to {label}")
  - an `h1` title (15px/700) with an optional subtitle line (11px muted; supports a mono
    fragment)
  - right-aligned actions
- **Page header API.** It keeps the `providePageHeader` / `usePageActions` API in
  `$lib/page-header.svelte.ts`, extended with `subtitle` and `back: { href, label }`.
  `PageHeader.svelte` is deleted and its breadcrumbs dropped; the sidebar and back button take
  over that navigation. Existing pages set `back` to whatever their breadcrumb parent was.
- **Phone width (< 768px):** the sidebar becomes an off-canvas sheet opened from a toolbar
  button. The toolbar wraps its actions, and nothing scrolls horizontally.
- **Landmarks:** sidebar `aside`, toolbar `header`, page `main`. Visible focus ring
  everywhere (`0 0 0 3px var(--ring)`).

### R5. Library data (`frontend/src/stores/library.svelte.ts`)

A rune store holds `workflows`, `runs`, `needsYou` (a list of runs) and
`workflowState(id) → 'needs-you' | 'running' | null`.

- **Polling:** it polls `GET /api/workflows` and `GET /api/runs` every 5s while the document is
  visible, and refreshes immediately when a run is submitted or a question is answered from
  this tab.
- **Failures:** a failed poll keeps the last good data and uses the existing
  `pollFailureNotifier` (one toast for a streak of failures).
- **Needs you** means `status === "Running" && pending_questions > 0`.

### R6. API addition (`crates/smasher-web`): additive only

`RunSummary` gains `pending_questions: u32`, the number of unanswered questions on the run's
interviewer, gallery gates included. It defaults to 0 on deserialise. It is returned by
`GET /api/runs` and `GET /api/runs/{id}`. The TypeScript `RunSummary` gains the same field.

### R7. Native title bar (`crates/smasher-desktop/src/main.rs`)

The main window uses `TitleBarStyle::Overlay` with `hidden_title(true)`. Toolbar and sidebar
header carry `data-tauri-drag-region`. Add the window-drag permission to the `served-origin`
capability only if dragging needs it. Native mode is detected with the existing `isTauri()` and
exposed as a `data-native` attribute on `<html>`.

## Out of Scope

- Rebuilding the contents of the dashboard, workflow detail, run or editor screens.
- The Run and Settings dialogs' new layouts.
- Updating the canvas Components board (a follow-up).
- A manual theme toggle.

## Commands

As in [CAPABILITY_MAP.md](../CAPABILITY_MAP.md#commands), plus `make desktop-dev` for the title-bar check.

## Project Structure (this module)

```
frontend/src/app.css                         → tokens, type, dark palette
frontend/src/lib/components/ui/**            → restyled primitives (props unchanged; Badge gains `dot`)
frontend/src/lib/stepKinds.ts                → NEW
frontend/src/lib/contrast.ts                 → NEW: WCAG ratio helper (used by tests and stepKinds)
frontend/src/lib/page-header.svelte.ts       → + subtitle, back
frontend/src/components/shell/AppShell.svelte, SourceList.svelte, Toolbar.svelte → NEW
frontend/src/components/dashboard/PageHeader.svelte → DELETED
frontend/src/stores/library.svelte.ts        → NEW
frontend/src/App.svelte                      → wraps routes in AppShell
crates/smasher-web/src/state.rs              → RunSummary.pending_questions
crates/smasher-desktop/src/main.rs           → overlay title bar
```

## Testing Strategy

- **Unit (Vitest):**
  - `stepKinds`: every `nodeConfig` kind is mapped and the unknown fallback works.
  - `contrast`: known reference pairs return the right ratios.
  - A **token contrast test** parses `app.css` and asserts every R1 pair in light and dark,
    plus every `stepKinds` ink/tint pair in both themes.
  - The library store's `needsYou` and `workflowState` derivation.
  - Footer pluralisation.
- **Component (Vitest + Testing Library, real `smasher-web`):**
  - `AppShell` renders the Library and Workflows landmarks and the counts.
  - `aria-current` is set on the active workflow.
  - Dots carry their hidden text.
  - The Needs-you pill is hidden at 0.
  - The collapse toggle flips `aria-expanded` and hides labels.
  - `Toolbar` renders the title, subtitle, back link and actions.
  - Update `AppLayout.test.ts` for the new shell. Replace `PageHeader.test.ts` with
    `Toolbar.test.ts`.
- **Integration:**
  - Rust test in `smasher-web`: `pending_questions` is 0 for a fresh run and becomes 1 when a
    no-LLM gate pipeline (start → hexagon gate → exit) is waiting.
  - A Vitest test reads the same field through `runsApi`.
- **E2E (Playwright, no LLM):** update `app-shell.spec.ts`:
  - Sidebar links navigate to Workflows, Recent runs and a workflow's detail page.
  - After submitting the start → gate → exit fixture, "Needs you" shows 1 and the footer
    names it. Answering the gate clears both within one poll.
  - At 375px wide the sidebar opens as a sheet and there is no horizontal scroll.

  Existing specs must stay green, with selector updates only where the header changed.
- **Manual:** in `make desktop-dev`:
  - the real traffic lights sit in the sidebar header
  - the window drags from the toolbar
  - no fake lights appear in the browser

  Then a side-by-side visual check of the shell against the `Workflow` artboard at 1440×900, in
  light and dark.

## Boundaries (module-specific)

These are in addition to the [capability map's boundaries](../CAPABILITY_MAP.md#boundaries):

- **Always:** keep primitive props and exports backwards compatible; replace every
  `PageHeader` caller in the same task that deletes it.
- **Ask first:** adding any dependency (the plan uses `mode-watcher`, `@lucide/svelte` and
  `ui/sidebar`, which are all already present); any `smasher-desktop` change beyond R7.
- **Never:** hard-code hex values in components (use tokens or `stepKinds`); change
  `RunSummary` in any way except adding the field.

## Success Criteria

1. Every R1 pair passes AA in light and dark (automated test).
2. Every primitive matches its board at 1:1 in a side-by-side check, and its existing tests
   pass unchanged.
3. Every route renders inside `AppShell`. `PageHeader` is gone, and no page lost a control it
   had before.
4. The sidebar counts, dots and footer reflect the API within one poll interval (E2E).
5. `pending_questions` is served by `/api/runs` and `/api/runs/{id}`, with a Rust test and an
   integration test.
6. The desktop window shows real traffic lights over the sidebar and drags from the toolbar.
   The browser shows no lights.
7. At 375px the shell is usable with no horizontal scroll.
8. `npm run check`, `npm run lint`, `npm run test -- --run`, non-LLM e2e,
   `cargo test -p smasher-web`, `cargo clippy --workspace -- -D warnings`: all pass with zero
   warnings.

## Open Questions

None blocking. Two judgement calls are made above and noted here so you can overrule them:

- Breadcrumbs are dropped in favour of the sidebar plus back button, which matches the design.
- The poll interval is 5s.
