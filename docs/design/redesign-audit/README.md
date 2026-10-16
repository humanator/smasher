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
