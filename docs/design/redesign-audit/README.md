<!-- ABOUTME: Gap audit of the Svelte SPA against the redesign boards in docs/design/redesign, run 2026-10-16. -->
<!-- ABOUTME: Index and cross-cutting summary; the five numbered files hold per-area findings with file:line refs. -->

# Redesign gap audit (2026-10-16)

This audit compares `frontend/` on `claude/agent-skills-frontend-design-f96332` with the boards in
[`../redesign/`](../redesign/README.md). It covers two questions:

1. Where does the implementation differ from the design?
2. Is everything built from design-system tokens and primitives, and do those tokens and
   primitives match the boards?

Every finding gives the `file:line` and the board value, with a severity:

- **High:** visibly wrong or missing.
- **Med:** noticeable drift.
- **Low:** a nit.

| File | Area | Module state |
|---|---|---|
| [01-tokens-primitives.md](01-tokens-primitives.md) | `app.css`, `ui/*` primitives, shell (sidebar, toolbar) | `shell-theme` built, never side-by-side checked |
| [02-home.md](02-home.md) | Dashboard, Run sheet, Settings | `dashboard` built; mostly faithful |
| [03-workflow.md](03-workflow.md) | Workflow detail | **Not started:** old layout inside the new shell |
| [04-run.md](04-run.md) | Run page | **Not started** |
| [05-editor.md](05-editor.md) | Workflow editor | **Not started:** doesn't use `stepKinds` |

## Cross-cutting: the design system itself

Fix these first. Most screen-level drift traces back to them.

1. **The radius scale is wrong.** The scale is derived from `--radius: 6px`, so `rounded-md` is
   6 × 0.8 = **4.8px** (`app.css:139`). Every Button, Input, Textarea, NativeSelect and sidebar
   row renders at 4.8px instead of 6px. No step on the scale gives the design's 8px (tables),
   10px (cards, accordion, popover, step lists) or 12px (sheets, windows).
2. **The Card and Dialog primitives were never restyled.** They still use shadcn defaults:
   `rounded-4xl` (about 15.6px), `shadow-md`/`shadow-xl`, `p-6`, and a 16px/500 title. As a result:
   - Screens hand-roll cards, or override every `Card.Root` with `rounded-lg shadow-none ring-0 p-4`.
   - The Run sheet and Settings window miss the board: surface `#F6F6F8`, 12px radius, 20px
     padding, 13px/700 title, top-aligned, scrim `.14`/`.06` with no blur, no default ×.
3. **Label is 14px** (`text-sm leading-none`). Every field board labels at 13px/500. Hints and
   errors are 11.5px on the boards and 12–14px in the build. There is no Field
   (label → hint → control → error) composition, so screens put hints under the control.
4. **There are no type-scale tokens.** About 29 arbitrary `text-[13px]`, `text-[11px]` and
   `text-[15px]` values, plus Tailwind's 14px `text-sm` leaking in as an off-scale size. The
   design scale is 11 / 11.5 / 12 / 13 / 15 / 20.
5. **There are no shadow tokens.** The macOS push-button, segment, popover and window shadows are
   raw `shadow-[…rgba…]` strings copied across primitives (the push-button one four times). Dark
   overrides are ad hoc `white/5|10|15|20`.
6. **Board values with no token:**
   - Text: `#3A3A3C` secondary, `#4A4A4F` ghost-button, `#8E8E93` placeholder and tertiary.
   - Status: warning/amber (`#FF9500`/`#B25000`), success text (`#248A3D`), info text (`#0060DF`),
     success and failed hero surfaces, primary-subtle border.
   - Surfaces: sheet `#F6F6F8`, window toolbar `#F0F0F2`, tooltip `#F6F6F6` (hard-coded in
     `tooltip-content.svelte:28`, against the spec), search fill, group fill, scrims.
   - Size: toolbar height 52px.
7. **Token values that drift from the boards:**
   - Invalid fields use `--destructive` `#C4170F`. The boards use `#FF3B30` with a
     `rgba(255,59,48,.22)` ring and keep `#C4170F` for error text only.
   - Field focus rings are `.3` on the boards; `--ring` is `.4`.
   - Table, line-tab and inspector hairlines are `.1`; `--border` is `.08`.
   - Ghost button text is `#4A4A4F`, not `--muted-foreground`.
8. **Primitive gaps:**
   - **NativeSelect:** the accent stepper chevron is missing (spec R2).
   - **Drawer:** top and bottom should be a floating 420px sheet with 12px corners. The build is
     an edge-anchored vaul drawer with a drag handle and background scaling.
   - **Popover:** the title is too large.
   - **Sidebar:** hover looks the same as selected.
   - **Missing primitives:** no radio-group primitive (needed for the editor's radio cards and
     QuestionCard), and no Field composition.
   - **Unused tokens:** `--chart-*` are still shadcn's oklch defaults.
9. **stepKinds** (`lib/stepKinds.ts`):
   - Colours, plain names and groups match `Main.dc.html`.
   - **Icons:** only 3 of 10 match the boards. The boards draw sparkles, network, terminal,
     diamond, folder, play and square.
   - **Missing data:** group titles and order, and each kind's `blurb`/`about` text.
   - **Tech names** are raw handler names ("FanIn"); the board uses "Fan-In" and
     "Human Gate (Interviewer)".
   - **No callers:** nothing outside the primitives gallery uses `stepKinds`. The editor still
     uses `nodeConfig.ts` hex (`THEME_COLORS`).
10. **Dark mode is broken in places:**
    - The editor canvas: hard-coded `#3b82f6`/`#64748b`, library-default node CSS, no `colorMode`.
    - NativeSelect, the outline ToggleGroup and Switch: black hairlines.
    - Run-page Tailwind palette colours (`text-green-700`, violet and so on) with no dark variant.

### Status: design-system fixes landed (2026-10-16)

Items 1–9 above are fixed. Item 10 (dark mode) is fixed everywhere except the editor's node
colours.

**Tokens**

- **Radius scale.** Each step is now a literal value: xs 4, sm 5, md 6, track 7, lg 8, xl 10,
  2xl 12.
- **Type scale.** `text-caption` 11, `text-hint` 11.5, `text-small` 12, `text-body` 13,
  `text-heading` 15, `text-display` 20. Every `text-[Npx]` in components now uses these.
- **Shadows.** Thirteen `shadow-*` tokens (push, segment, card, sheet, dialog, window and so on),
  each with a dark value. No raw rgba shadow is left in the primitives.
- **Board colours that had no token.** These now exist, each with a dark value:
  - Text tiers: `foreground-secondary`, `foreground-control`, `foreground-tertiary`.
  - Status: `warning`, `success`, `info` and `destructive` foregrounds, surfaces and borders.
  - Invalid state: `invalid`, `invalid-ring`, `ring-field`.
  - Surfaces: `sheet`, `sheet-toolbar`, `tooltip`, `control`, `segment`, `field`, `field-fill`,
    `track`, `group`.
  - Hairlines: `separator`, `border-strong`, `divider`.
  - Scrims and layout: three `scrim` levels, and `h-toolbar`.
- **Unused shadcn chart tokens** are removed.

**Class merging.** `cn()` and `tv()` share one merge config that knows these scales, and
`tests/lib/utils.test.ts` covers it. Without that config, `text-body` beside a text colour was
silently dropped. `cn()` now reuses tailwind-variants' bundled merger, so the separate `cn` engine
is no longer shipped. The entry chunk went from 494 kB to 469 kB.

**Primitives.** Each primitive is restyled to its board:

- **Card:** variants `default`, `muted`, `success` and `destructive`.
- **Dialog:** variants `sheet`, `window` and `fullscreen`. It is top-aligned on the sheet surface
  with no blur, and has a round 22px close.
- **Label:** 13px.
- **Drawer:** top and bottom open as a floating 420px sheet; left and right are the muted
  inspector. It also gets the board's header and footer, and a `showClose` prop.
- **NativeSelect:** the accent stepper.
- **Input and Textarea:** a `mono` option and the systemRed invalid state.
- **Tabs:** sized to their labels by default, with `fullWidth` and a `toolbar` variant for
  Settings.
- **Others:** Popover, Tooltip, Accordion (the board's triangle), Toggle group (outline by
  default), Sidebar rows and Sheet.

**New components:** Field (label, hint, control, error) and RadioGroup.

**Shell:**

- **SourceList:** the board's icons and a document icon on workflow rows. The Library row for the
  current page is marked as current. The Needs-you pill is 16px and counts are 12px.
- **Toolbar:** opaque, with the board's padding and a `titleAccessory` slot. A `ToolbarDivider`
  is new.
- **ToolbarIconButton:** gains `pressed` and `expanded`.

**stepKinds** now matches `Main.dc.html` icons, group titles and order (`STEP_GROUPS`), blurbs,
About copy and display tech names. The raw engine name is the new `handler` field.

**Guard.** `tests/lib/designSystem.test.ts` fails on any hex, rgba, Tailwind palette colour,
black/white alpha or arbitrary font size in the primitives, the shell, the dashboard/run
components or the gallery. The editor is excluded until its rebuild.

**Deliberate deviations from the boards:**

- `--success-foreground` is `#1F8136`. The board's `#248A3D` is 4.40:1 on white, which fails AA.
- Settings toolbar labels use `foreground-secondary`. The board's `#6E6E73` on `#F0F0F2` is
  4.46:1.
- Canvas edges use `muted-foreground`, not the board's pale `--neutral`. An earlier fix found
  pale edges unreadable, so the editor rebuild should decide.
- Dialog keeps its close button by default, for API compatibility. The Run sheet therefore still
  shows a × that the board doesn't draw; drop it in the dashboard follow-up.

**Not touched (screen work):** hint placement in the Run sheet and Settings forms (they can now
use Field), and the hand-rolled disclosures that should use Accordion.

Two flaky tests are worth knowing about:

- `DashboardPage` "opens Settings" timed out on the old code too. Settings takes about 7.5s to
  compile cold under Vitest; its budget is now 15s.
- E2E `candidate-preview.spec.ts` (clicking inside the lightbox iframe) fails on the old code
  too.

## Bugs found along the way

- **The next gallery round never appears.** After an "iterate" decision, `GalleryGate.svelte`
  sets `done = true` and never clears it, so `refresh()` ignores the next round's gate. The page
  stays on "Decision recorded — resuming…" until it's reloaded (`GalleryGate.svelte:43,84`).
- **Waiting runs are labelled "Running".** `RunDetail.svelte:96` and
  `WorkflowDetailPage.svelte:119` pass the raw status to `StatusBadge`, so a run waiting on a
  person shows "Running", not "Needs you". `RunTable` gets this right.
- **The Needs-you banner says "Open Run" while loading.** The button reads "Open Run" until its
  questions fetch resolves, then changes. The spec keeps "Open Run" for a failed fetch only.
- **Resume can't be reached.** `resumeRun` is in the API client, but no UI calls it, though
  SPEC.md requires cancel/resume.

## API data the unbuilt screens need

The API has no endpoint or field for any of these. All would be additive, read-only additions,
which SPEC.md allows.

- **Run page:**
  - the run's ordered step list (id, label, type) for Progress, step labels and the failure
    heading
  - the gallery gate's question text and node label
  - plain-language failure hints ("What you can try")
  - the run's inputs, so "Run Again" can repeat it
- **Workflow detail:**
  - the step a run is paused at, with its candidate count
  - the failed step and an error summary
- **Both:** reveal-in-Finder. It needs an endpoint or Tauri command, and the opener plugin isn't
  installed.

## Decisions needed

These are app features the design doesn't show. Keep or drop each one before its module is built:

- **Editor:**
  - MiniMap and zoom Controls
  - edge hover-delete
  - four handles per node
  - per-node provider picker
  - the create-mode Name/Directory form
- **Run page:**
  - the Graphviz graph
  - the candidate lightbox and live preview
  - params and scorecard reasons
  - QuestionCard's free-form, multiple-choice and approval questions (not drawn but must stay)
  - an Aborted state
- **Every page:** the Settings button in the toolbar (it is on Workflow, Run and Editor, which
  the boards don't show).
