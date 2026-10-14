# Todo: `shell-theme`

Plan: [plan.md](plan.md). Spec: [SPEC-shell-theme.md](../SPEC-shell-theme.md).

Shared commands (from `frontend/`):

- `npm run test -- --run <path>` runs focused tests; omit the path for the full suite
- `npm run check`
- `npm run lint`
- `npm run build:check`

Rust: `cargo test -p smasher-web`, `cargo clippy --workspace -- -D warnings`.

Vitest and E2E need `npm run dev:backend` running. Never run LLM-spending tests.

## Phase 1: Foundation

## Task 1: `pending_questions` on `RunSummary`

**Description:** Add `pending_questions: u32` to `RunSummary`. Fill it from the run's
interviewer queue length and serve it from `/api/runs` and `/api/runs/{id}`. Mirror it in the
TS type.

**Acceptance criteria:**
- [ ] A fresh run reports `0`. A run waiting at a hexagon gate reports `1`, and `0` again after
  the answer.
- [ ] Deserialising a summary without the field yields `0`.
- [ ] `frontend/src/lib/api/runs.ts` `RunSummary` has `pending_questions: number`.

**Verification:**
- [ ] `cargo test -p smasher-web` (new tests: serde default, live gate count)
- [ ] `npm run test -- --run tests/lib/api` (new integration test via `runsApi`)
- [ ] clippy clean

**Dependencies:** None

**Files likely touched:** `crates/smasher-web/src/state.rs`, `crates/smasher-web/tests/*` or
an in-file test, `frontend/src/lib/api/runs.ts`, `frontend/tests/lib/api/runs.test.ts`

**Estimated scope:** S

## Task 2: Contrast helper, tokens, font, dark mode

**Description:** Add `lib/contrast.ts`. Rewrite `app.css` tokens to the R1 values in hex/rgba,
including the new tokens: `sidebar-muted-foreground`, `primary-subtle(-foreground)`,
`destructive-subtle`, `success`, `info`. Derive `.dark` values. Switch to the system font stack
and type scale. Remove the Manrope/Figtree imports and devDependencies. Mount `ModeWatcher` in
system mode.

**Acceptance criteria:**
- [ ] The token test parses `app.css` and every R1 pair is ≥ 4.5:1 in light and dark.
- [ ] No `@fontsource-variable` import or dependency remains. Body computes to the system stack.
- [ ] Toggling the OS appearance switches themes without a reload.

**Verification:**
- [ ] `npm run test -- --run tests/lib/contrast.test.ts tests/lib/tokens.test.ts`
- [ ] Full Vitest green; `check`, `lint`, `build:check` clean
- [ ] Manual: catalog page in light and dark

**Dependencies:** None

**Files likely touched:** `frontend/src/lib/contrast.ts`, `frontend/src/app.css`,
`frontend/src/App.svelte`, `frontend/package.json` (+ lock),
`frontend/tests/lib/{contrast,tokens}.test.ts`

**Estimated scope:** M

## Task 3: `stepKinds` vocabulary

**Description:** Add `lib/stepKinds.ts` with `stepKind(handler)`. Use the R3 table, lucide
icons, light and dark ink/tint, and the "Step" fallback for unknown handlers.

**Acceptance criteria:**
- [ ] Every kind in `nodeConfig.ts` maps to the spec's plain name, tech name and group.
- [ ] Unknown handlers return plain "Step", group `flow`.
- [ ] Every ink/tint pair is ≥ 4.5:1 in both themes.

**Verification:**
- [ ] `npm run test -- --run tests/lib/stepKinds.test.ts`
- [ ] `check` clean

**Dependencies:** T2 (uses `contrast.ts`)

**Files likely touched:** `frontend/src/lib/stepKinds.ts`, `frontend/tests/lib/stepKinds.test.ts`

**Estimated scope:** S

## Checkpoint A: Foundation
- [ ] Full Vitest + `cargo test -p smasher-web` green; `check`, `lint`, clippy clean
- [ ] Every page renders in new colours, light and dark

## Phase 2: Primitives

## Task 4: Button and Badge

**Description:** Restyle the Button variants (default, outline, secondary, ghost, destructive,
link) and sizes (xs, sm, default, lg, icon-xs, icon-sm, icon, icon-lg) to match `Button.dc.html`.
Restyle Badge as the 18px capsule and add an optional `dot` colour prop.

**Acceptance criteria:**
- [ ] Rendered heights match the board (18/22/24/28, icon 18/24/28/32) and the focus ring is
  the 3px `--ring`.
- [ ] `<Badge dot="…">` renders an `aria-hidden` 6px dot. Without `dot`, the markup is unchanged.
- [ ] The existing props API compiles unchanged for every caller.

**Verification:**
- [ ] `npm run test -- --run tests/components/ui/badge.test.ts` (new)
- [ ] Full Vitest green; `check` clean
- [ ] Manual: side-by-side with the Button and Badge boards

**Dependencies:** T2

**Files likely touched:** `frontend/src/lib/components/ui/button/button.svelte`,
`frontend/src/lib/components/ui/badge/badge.svelte`, `frontend/tests/components/ui/badge.test.ts`

**Estimated scope:** S

## Task 5: Form controls

**Description:** Restyle Input (plus a `search` style), Textarea, NativeSelect (accent
chevron), Checkbox (14px) and Switch (38×22, `sm` 26×15) to match their boards, including
focus, invalid and disabled states.

**Acceptance criteria:**
- [ ] Each control matches its board's default, focus, invalid and disabled states.
- [ ] Input `search` renders a leading magnifier (`aria-hidden`), and the field keeps its
  accessible label.
- [ ] Existing form tests pass without assertion changes.

**Verification:**
- [ ] `npm run test -- --run tests/components/ui/input.test.ts` (new: search variant)
- [ ] Full Vitest green; `check` clean
- [ ] Manual: side-by-side with the 5 boards

**Dependencies:** T2

**Files likely touched:** `ui/input/input.svelte`, `ui/textarea/textarea.svelte`,
`ui/native-select/native-select.svelte`, `ui/checkbox/checkbox.svelte`,
`ui/switch/switch.svelte`

**Estimated scope:** M

## Task 6: Tabs, ToggleGroup, Accordion

**Description:** Tabs become a segmented control by default and gain a `line` variant.
ToggleGroup gets the segmented look. Accordion becomes the grouped disclosure box with a
rotating triangle.

**Acceptance criteria:**
- [ ] Tabs `variant="line"` renders an underlined row. The default is the segmented track.
  Roles and `aria-selected` are unchanged.
- [ ] Accordion items sit in one bordered box, and the triangle rotates 90° when open.
- [ ] Existing tests that use these pass unchanged.

**Verification:**
- [ ] `npm run test -- --run tests/components/ui/tabs.test.ts` (new: line variant)
- [ ] Full Vitest green; `check` clean
- [ ] Manual: side-by-side with the 3 boards

**Dependencies:** T2

**Files likely touched:** `ui/tabs/tabs-list.svelte`, `ui/tabs/tabs-trigger.svelte`,
`ui/toggle-group/toggle-group-item.svelte`, `ui/accordion/accordion-item.svelte`,
`ui/accordion/accordion-trigger.svelte`

**Estimated scope:** M

## Task 7: Overlays and coarse-pointer hit areas

**Description:** Restyle Tooltip, Popover (with arrow) and Drawer (sheet for top/bottom,
inspector for left/right) to match their boards. Add the `(pointer: coarse)` rule that gives
interactive primitives ≥ 44px hit areas.

**Acceptance criteria:**
- [ ] Popover shows its arrow aligned to `start`/`end`. Drawer side panels use the muted
  inspector surface.
- [ ] With coarse-pointer emulation, Button `sm` has a hit area ≥ 44×44. The desktop size is
  unchanged.
- [ ] Existing overlay usages (dialogs, tooltips in the editor) still open and close in tests.

**Verification:**
- [ ] Full Vitest green; `check` clean
- [ ] E2E: `npx playwright test e2e/node-editor.spec.ts e2e/settings.spec.ts`
- [ ] Manual: side-by-side with the 3 boards; mobile emulation tap test

**Dependencies:** T2

**Files likely touched:** `ui/tooltip/tooltip-content.svelte`,
`ui/popover/popover-content.svelte`, `ui/drawer/drawer-content.svelte`, `frontend/src/app.css`

**Estimated scope:** M

## Checkpoint B: Primitives
- [ ] Existing component + non-LLM E2E tests green
- [ ] Every component board matched 1:1, light + dark
- [ ] Review with Jobsworth

## Phase 3: Shell

## Task 8: Library store

**Description:** `stores/library.svelte.ts` holds `workflows`, `runs`, `needsYou` and
`workflowState(id)`. It polls both endpoints every 5s while the document is visible, exposes
`refresh()`, and keeps the last good data on failure, reporting through `pollFailureNotifier`.

**Acceptance criteria:**
- [ ] `needsYou` contains exactly the runs with `status === "Running" && pending_questions > 0`.
- [ ] `workflowState` returns `needs-you` over `running` over `null`.
- [ ] Polling stops while hidden and resumes on `visibilitychange`.
- [ ] A failed poll keeps the previous data.

**Verification:**
- [ ] `npm run test -- --run tests/stores/library.test.ts` (against the real backend with the
  gate fixture)
- [ ] `check` clean

**Dependencies:** T1

**Files likely touched:** `frontend/src/stores/library.svelte.ts`,
`frontend/tests/stores/library.test.ts`, `frontend/e2e/fixtures/gate_only.dot` (new, shared)

**Estimated scope:** S

## Task 9: Toolbar and page-header API

**Description:** Extend `PageHeaderState` with `subtitle` and `back`. Build `shell/Toolbar.svelte`
(52px; back button; h1 title + subtitle; actions). Swap it into `App.svelte` and set `back` on
each page that had a parent crumb. Delete `PageHeader.svelte` and replace its test.

**Acceptance criteria:**
- [ ] Toolbar renders the title as the page's only `h1`, the optional subtitle, a back link
  labelled "Back to {label}", and the registered actions.
- [ ] Every route that had breadcrumbs now has a working back link to the same parent.
- [ ] No reference to `PageHeader` remains.

**Verification:**
- [ ] `npm run test -- --run tests/components/shell/Toolbar.test.ts tests/components/AppLayout.test.ts`
- [ ] Full Vitest green; `check`, `lint` clean

**Dependencies:** T2

**Files likely touched:** `frontend/src/lib/page-header.svelte.ts`,
`frontend/src/components/shell/Toolbar.svelte`, `frontend/src/App.svelte`,
`frontend/src/components/dashboard/PageHeader.svelte` (delete),
`frontend/tests/components/shell/Toolbar.test.ts` (replaces `PageHeader.test.ts`),
`frontend/tests/components/AppLayout.test.ts`

**Estimated scope:** M

## Task 10: SourceList component

**Description:** `shell/SourceList.svelte`, a presentational sidebar content built on
`ui/sidebar`. It contains:

- the Library nav (Workflows, Recent runs, Needs you pill hidden at 0)
- the Workflows nav (display names, `aria-current`, state dots with visually hidden text)
- the footer with pluralisation
- the header row (wordmark in the browser, a 78px inset in native)
- the collapse toggle

**Acceptance criteria:**
- [ ] Both `nav` landmarks are labelled. Links point to `/`, `/#runs`,
  `/?runs=needs-you#runs` and `/workflows/{id}`.
- [ ] The footer reads "Smasher · 1 run needs your decision" / "… 2 runs need …" / "Smasher".
- [ ] Collapsing flips `aria-expanded`, hides the labels, and keeps `title` on each row.

**Verification:**
- [ ] `npm run test -- --run tests/components/shell/SourceList.test.ts`
- [ ] `check` clean
- [ ] Manual: side-by-side with the `Workflow` artboard sidebar

**Dependencies:** T2, T4 (Badge pill), T8 (types only)

**Files likely touched:** `frontend/src/components/shell/SourceList.svelte`,
`frontend/tests/components/shell/SourceList.test.ts`

**Estimated scope:** S

## Task 11: AppShell wiring

**Description:** `shell/AppShell.svelte` combines `ui/sidebar` Provider, SourceList (fed by the
library store), Toolbar and `main`. Wrap every route in `App.svelte`. Below 768px the sidebar
is a sheet opened from a toolbar button. Refresh the store after a run is submitted or a
question is answered.

**Acceptance criteria:**
- [ ] Every route renders inside the `aside` / `header` / `main` landmarks, and the active
  workflow is marked on `/workflows/{id}` and its editor.
- [ ] At 375px the sidebar is hidden behind a toolbar button and the page has no horizontal
  overflow.
- [ ] After a run is submitted, the sidebar counts update without waiting for the next poll.

**Verification:**
- [ ] `npm run test -- --run tests/components/AppLayout.test.ts`
- [ ] Full Vitest green; `check`, `lint`, `build:check` clean

**Dependencies:** T8, T9, T10

**Files likely touched:** `frontend/src/components/shell/AppShell.svelte`,
`frontend/src/App.svelte`, `frontend/src/components/dashboard/RunDialog.svelte` (refresh hook),
`frontend/src/stores/questions.svelte.ts` (refresh hook),
`frontend/tests/components/AppLayout.test.ts`

**Estimated scope:** M

## Task 12: Native overlay title bar

**Description:** Give the main window `TitleBarStyle::Overlay` + `hidden_title(true)`. Set
`data-native` on `<html>` when `isTauri()` is true. Put `data-tauri-drag-region` on the toolbar
and the sidebar header. Add the drag permission to `served-origin` only if dragging fails
without it.

**Acceptance criteria:**
- [ ] In `make desktop-dev`, the real traffic lights sit inside the sidebar header inset and
  nothing overlaps them.
- [ ] The window drags from empty toolbar space. Buttons in the toolbar still click.
- [ ] In a browser, `data-native` is absent and the wordmark shows. `no-tauri-breakage.spec.ts`
  passes.

**Verification:**
- [ ] `cargo build -p smasher-desktop`, clippy clean
- [ ] `npx playwright test e2e/no-tauri-breakage.spec.ts`
- [ ] Manual: `make desktop-dev`

**Dependencies:** T11

**Files likely touched:** `crates/smasher-desktop/src/main.rs`,
`crates/smasher-desktop/capabilities/served-origin.json` (only if needed),
`frontend/src/main.ts`, `frontend/src/components/shell/{Toolbar,SourceList}.svelte`

**Estimated scope:** S

## Task 13: App-shell E2E

**Description:** Update `e2e/app-shell.spec.ts` to cover sidebar navigation, the needs-you flow
using `fixtures/gate_only.dot`, and the phone-width sheet. Fix selector churn in the other
non-LLM specs.

**Acceptance criteria:**
- [ ] The sidebar links reach Workflows, Recent runs and a workflow detail page.
- [ ] Submitting the gate fixture shows Needs you = 1 and the footer names it. Answering the
  gate clears both within one poll.
- [ ] At 375px the sheet opens and `scrollWidth <= clientWidth`.

**Verification:**
- [ ] `npm run test:e2e` (non-LLM specs; `critical-path` stays skipped)

**Dependencies:** T11, T12

**Files likely touched:** `frontend/e2e/app-shell.spec.ts`, plus selector fixes in any of the
existing e2e specs

**Estimated scope:** S–M

## Checkpoint C: Module complete
- [ ] SPEC-shell-theme.md Success Criteria 1–8 all met
- [ ] Full non-LLM suite green with zero warnings
- [ ] `make desktop-dev` manual check, light + dark
- [ ] Review with Jobsworth, then write `SPEC-dashboard.md`
