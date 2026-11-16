<!-- ABOUTME: Redesign gap audit section: Audit 02: Home (dashboard, Run sheet, Settings) vs `Home.dc.html`. -->
<!-- ABOUTME: Findings carry file:line refs, board values and High/Med/Low severity; see README.md for the summary. -->

# Audit 02: Home (dashboard, Run sheet, Settings) vs `Home.dc.html`

Design source: `docs/design/redesign/Home.dc.html` (plus the primitive boards `Input`, `Textarea`,
`Select`, `Badge`, `ToggleGroup`, `Tabs`, `Accordion` `.dc.html`, which define field anatomy).
Spec: `SPEC-dashboard.md` (D1–D5), deviations recorded in `tasks/archive/todo-dashboard.md` §"Deviations
beyond D2–D5" (numbered TD1–TD6 below).
Frontend paths are relative to `frontend/src/`. Every claim was checked against the code.

Severity: **High** = visibly wrong or missing · **Med** = noticeable drift · **Low** = nit.
"Intentional" = decided by the spec (D1–D5, R-sections, OQ2) or recorded in the todo deviations.

Token reference (`app.css`): `--radius: 6px` ⇒ `rounded-md` 4.8px, `rounded-lg` 6px,
`rounded-xl` 8.4px, `rounded-2xl` 10.8px, `rounded-4xl` 15.6px. No token exists for the
design's 8px / 10px / 12px radii, for `#3A3A3C` (secondary label), `#8E8E93` (tertiary/placeholder),
`#248A3D` (success text), `#F6F6F8` (window surface) or `#F0F0F2` (window toolbar).

---

## 0. Cross-cutting (affects several sections)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| X1 | Med | **Field anatomy order differs.** Design field = label → hint → control → error. Impl = label → control → error → hint (hint *below* the field) in the Run sheet, Services and Claude CLI. `ModelPicker` stack mode does the same and says so in a comment. | `Input/Textarea.dc.html` `<label>` markup: label span, hint span, control, `role="alert"` error | `RunDialog.svelte:88-101,115-135,149-171`; `ServicesSection.svelte:65-85,88-101`; `ClaudeCliSection.svelte:31-56,58-74`; `ModelPicker.svelte:91-106` | No (not in D1–D5 or TD1–6) |
| X2 | Med | **Label size/weight.** `Label` primitive is `text-sm` (14px) / 500 / `leading-none`. | 13px / 500 / line-height 1.2 | `lib/components/ui/label/label.svelte:16` | No (shell-theme primitive) |
| X3 | Low | **Hint size.** Hints use `text-xs` (12px). | 11.5px, line-height 1.4, `#6E6E73` | All hint `<p>`s above; `ModelPicker.svelte:97,104` | No |
| X4 | Med | **Field error styling.** Errors are `text-sm` (14px), placed between control and hint, and have no `role="alert"`. | 11.5px `#C4170F`, below control, `role="alert"` | `RunDialog.svelte:129,165` | No |
| X5 | Med | **Dialog primitive doesn't match the design windows** (applies to both Run sheet and Settings): surface `bg-popover` (#FFF) vs design `#F6F6F8`; overlay `bg-black/30` + `backdrop-blur-sm` vs `rgba(0,0,0,.14)` (Run) / `.06` (Settings), no blur; vertically centred vs top-aligned (40px / 60px top padding); `shadow-xl ring-1 ring-foreground/5` vs `0 0 0 .5px rgba(0,0,0,.22), 0 24px 60px rgba(0,0,0,.3)` (Run) / `.25 … 0 30px 80px rgba(0,0,0,.35)` (Settings). | see Home.dc.html:148-149, 179-180 | `ui/dialog/dialog-content.svelte:31`; `ui/dialog/dialog-overlay.svelte:15` | No |
| X6 | Med | **Grouped boxes lose contrast.** Design puts white grouped boxes (`#FFF`, border `.08`, radius 10px) on a grey `#F6F6F8` window. Impl puts `bg-card` (#FFF) boxes on a `bg-popover` (#FFF) window, so only the hairline separates them. | Home.dc.html:202, 223, 248 | `DefaultsSection.svelte:33`; `ServicesSection.svelte:43` | No |
| X7 | Med | **Disclosure rows are hand-rolled** with a Lucide `ChevronRight` stroke icon. The design (and the `Accordion` primitive, which already ships the filled triangle `size-2.5 fill-muted-foreground`) uses a filled 10px triangle `#6E6E73`. | `Accordion.dc.html`; Home.dc.html:162, 227 | `RunDialog.svelte:138-147`; `ServicesSection.svelte:47-62`; primitive `ui/accordion/accordion-trigger.svelte:27` | No |

---

## 1. Toolbar (shell `Toolbar` + `DashboardPage` actions)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| T1 | Low | Horizontal padding is symmetric 16px; design is 20px left / 12px right. | `padding:0 12px 0 20px` (Home:59) | `shell/Toolbar.svelte:31` (`px-4`) | No |
| T2 | Low | Gap between controls is 8px (`gap-2` on header and actions); design is 6px. Search→first icon becomes 6+8 = 14px vs 12px. | `gap:6px`, search `margin-right:6px` (Home:59,64) | `Toolbar.svelte:31,50`; `DashboardPage.svelte:75` | No |
| T3 | Low | Toolbar is `sticky`, translucent (`bg-background/95`, `/70` + `backdrop-blur`). Design is an opaque, non-sticky bar above an inner scroll area. | Home:59, 82 | `Toolbar.svelte:31` | Shell-theme choice, not in this spec |
| T4 | Low | Title `leading-tight` (1.25) vs 1.2. | `line-height:1.2` | `Toolbar.svelte:42` | No |
| T5 | Low | Subtitle is hidden until the library has loaded (design always shows it). | Home:62 | `DashboardPage.svelte:40-44` | Reasonable, not specced |
| T6 | Low | Search uses `type="search"`, so WebKit draws its own clear (×) button, which the design doesn't have. Magnifier is 14px vs design 13px / stroke 2.2. | Input board `search` | `DashboardPage.svelte:69`; `ui/input/input.svelte` search icon `size-[14px]` | No |
| T7 | Med | On phones the full-width search renders **below the needs-you banner**, not directly under the toolbar as R8 says. | R8 "moves to full width under the toolbar" | `DashboardPage.svelte:87-91` (banner, then search) | No (contradicts R8 when banner shows) |
| T8 | Low | On non-dashboard pages the Settings button is a bare `Button` with no tooltip (R1 asks for tooltips), and its icon lacks `aria-hidden`. | R1 | `LazySettingsDialog.svelte:24-26`; mounted from `App.svelte:150` | No |
| T9 | — | Copy matches: "Workflows", "{n} workflow(s) · {k} needs you", "Search workflows"/"Search", Import .dot file / AI model settings / New workflow, 210px search, 28px ghost icon buttons. | — | `DashboardPage.svelte:40-44,68-81` | ✓ |

Sidebar (shell `SourceList`, shown on the board):

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| S1 | Med | On `/` the Library **Workflows** row has no selected state and no `aria-current="page"`. | `aria-current="page"`, bg `rgba(0,0,0,.09)` (Home:29) | `shell/SourceList.svelte:77-86` (no `isActive`) | No |
| S2 | Med | Workflow list rows have no leading document icon when expanded (icon only appears collapsed). | file icon `#6E6E73` per row (Home:46) | `SourceList.svelte:137-141` | No |
| S3 | Low | Library icons differ: Workflow / Play / Hand vs design branch / clock / person glyphs. | Home:30, 34, 38 | `SourceList.svelte:80,93,106` | No |
| S4 | Low | Counts are 11px; design 12px. Needs-you count uses the generic Badge (18px tall, weight 500) vs the design's 16px tall, 600 weight, min-width 18px pill. | Home:31,35,39 | `SourceList.svelte:83,96,110` | No |
| S5 | Low | Header shows "Smasher" wordmark + Toggle sidebar button in the browser; design draws traffic lights. A "Design system" link sits above the footer (not drawn). | Home:22-26, 52 | `SourceList.svelte:45-67,163` | Traffic lights: intentional (CAPABILITY_MAP.md "Never draw fake traffic lights"); wordmark, toggle and link: not in design |

---

## 2. Needs-you banner (`NeedsYouBanner.svelte`)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| B1 | Med | **Banner scrolls away.** The design pins it under the toolbar, outside the scrolling content (`flex:none`, sibling of the `overflow:auto` area). In the impl it's part of `<main>`, which scrolls with the document, and only the toolbar is sticky. | Home:71, 82 | `DashboardPage.svelte:87`; `shell/AppShell.svelte:57` | No |
| B2 | Med | **Button reads "Open Run" until the questions fetch resolves**, then flips to "Review Candidates"/"Answer". The kind text and candidate count also pop in late. R2 reserves "Open Run" for a *failed* fetch. | R2 | `NeedsYouBanner.svelte:61,98` (`kind?.action ?? 'Open Run'`) | No |
| B3 | Low | When `waiting_since` is null (rehydrated run, per R7) the detail line ends in an em dash: "Pick a favourite · 3 candidates ready · —". | R2 wait wording | `NeedsYouBanner.svelte:72` → `lib/timeFormat.ts:89` returns "—" | No |
| B4 | Low | Icon is Lucide `User` (circle + rounded shoulders), not the design's person path. Size 28px circle / 15px glyph match. | Home:72-73 | `NeedsYouBanner.svelte:82-84` | No |
| B5 | Low | Border is `primary/20` vs `rgba(190,24,93,.18)`. Close enough; fine in dark. | Home:71 | `NeedsYouBanner.svelte:80` | — |
| B6 | — | "+ {N} more waiting" link (underlined, `/?runs=needs-you#runs`) is not drawn. | — | `NeedsYouBanner.svelte:91-95` | Intentional (D1) |
| B7 | — | Copy, 13px/600 title, 12px `primary-subtle-foreground` detail, `bg-primary-subtle`, padding 10px 20px (from `sm`), gap 12px, default Button, `aria-label="Waiting for you"` all match. | Home:71-79 | `NeedsYouBanner.svelte:78-99` | ✓ |

---

## 3. All workflows table (`WorkflowTable.svelte`)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| W1 | Med | **Table corner radius is 6px** (`rounded-lg`); design 8px. Same for every empty-state/alert box on the page. | `border-radius:8px` (Home:90) | `WorkflowTable.svelte:65,70,82` | No |
| W2 | Low | Outer and header borders use `--border` (.08); design uses `rgba(0,0,0,.1)` for both. | Home:90-91 | `WorkflowTable.svelte:82,85` | No |
| W3 | Med | **No row dividers.** Design rows each have `border-bottom:1px solid rgba(0,0,0,.05)` on top of the zebra. | `ROW` const (Home:315) | `WorkflowTable.svelte:108` | No |
| W4 | Low | Row min height is 44px (`min-h-11`); design 42px. | `min-height:42px;padding:6px 12px` | `WorkflowTable.svelte:108` | No (touch-target choice, not recorded) |
| W5 | Low | Last activity colour is `text-foreground/80` (≈`#4A4A4C` on white) vs `#3A3A3C`. No token exists. | Home:104 | `WorkflowTable.svelte:117` | No |
| W6 | Low | Wrapper is `overflow-x-auto` vs design `overflow:hidden`. Harmless at desktop widths. | Home:90 | `WorkflowTable.svelte:82` | — |
| W7 | Low | Title link gets `hover:underline`; the design has no hover state. | Home:100 | `WorkflowTable.svelte:110` | Additive |
| W8 | Low | Running last activity reads "Since today, 10:31 am" (design "Since 10:31 am"). Completed rows always carry a time ("Yesterday, 4:20 pm"), where the design shows "Yesterday" / "Fri 9 Oct" without one. | WORKFLOWS data (Home:280-283) | `lib/runStatus.ts:109,113` | Spec R3 prescribes these times, so this follows the spec, not the board |
| W9 | — | Needs-you last activity reads "Waiting since {time}", not "Pick a favourite". | Home:279 | `lib/runStatus.ts:103` | Intentional (OQ2 resolved) |
| W10 | — | "No workflows yet…" card with New Workflow / Import .dot File, 3-row skeleton, inline error with Try Again, import error alert: none of these are drawn. | — | `WorkflowTable.svelte:64-76,94-103`; `DashboardPage.svelte:94-98` | Intentional (R3) |
| W11 | — | Heading, intro copy, column set and widths (`2fr 130 150 130 132`), 26px header on `bg-muted`, 11px/600 header text, zebra with tokens, mono file and location, Edit + Run… (play icon) outline sm buttons all match. | Home:85-112 | `WorkflowTable.svelte:52-125` | ✓ |

---

## 4. Recent runs (`RunList.svelte`, `RunTable.svelte`, `StatusBadge.svelte`)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| R1 | Med | **Failed badge has a dot.** Design Failed = destructive variant with no dot. | `STATUS_BADGE.Failed: ['destructive','']` (Home:297) | `lib/runStatus.ts:64-65` (`dot: 'var(--destructive)'`) | No (R4 says "Failed destructive", no dot) |
| R2 | Low | Aborted dot is `--muted-foreground` (#6E6E73); design `#8E8E93`. | Home:297 | `lib/runStatus.ts:66-67` | No (no token for #8E8E93) |
| R3 | Med | **Empty / loading states drop the table frame.** Design keeps the bordered table with its column header and puts "No runs in this view." inside it. Impl renders a separate bordered `<p>` with no header for all three states. | Home:123-129 | `RunList.svelte:80-88` | Copy intentional (R4); dropping the header is not |
| R4 | Low | "Loading runs…" copy is not in the design or spec. | — | `RunList.svelte:81` | Not specced |
| R5 | Low | Filter counts are a separate muted, tabular span; design renders "All 6" as one string in the label colour. | `label: f[1]+' '+counts` (Home:339) | `RunList.svelte:69-71` | No |
| R6 | Low | Rows are 4px vertical padding (`md:py-1`); design rows share `padding:6px 12px`. Min-height 34px matches. | `ROW` + `min-height:34px` | `RunTable.svelte:53` | No |
| R7 | Med | No row dividers (`border-bottom .05`), same as W3. Radius 6 vs 8 and border .08 vs .1, same as W1/W2. | Home:123-124, 315 | `RunTable.svelte:40,42,51-53` | No |
| R8 | Low | Row hover `bg-accent/60` and an inset focus ring are not drawn. Fine as additions. | — | `RunTable.svelte:53` | Additive |
| R9 | Low | Started colour is `text-foreground/80` vs `#3A3A3C` (as W5). | Home:137 | `RunTable.svelte:66` | No |
| R10 | Low (a11y) | "Whole row is one link" is a stretched `::after` on the run-id anchor, so the link's accessible name is only the id ("run-7f3a9c"), with no workflow or status. | R4 | `RunTable.svelte:59-62` | Implementation choice |
| R11 | — | Heading, ToggleGroup (default/recessed variant, 24px), labels All / Active / Completed / Failed or stopped, intro copy with curly quotes, 4 columns (`130 1fr 170 120`), title + mono id baseline row, tabular durations, "{…} so far" all match. | Home:116-141 | `RunList.svelte:62-89`; `RunTable.svelte:36-67` | ✓ |

---

## 5. Run sheet (`RunDialog.svelte`, `LazyRunDialog.svelte`, `ModelPicker.svelte`)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| D1 | High | **Title is 16px / 500** (`Dialog.Title` default `text-base font-medium`); design 13px / 700. | `font-size:13px;font-weight:700` (Home:151) | `RunDialog.svelte:81`; `ui/dialog/dialog-title.svelte:15` | No |
| D2 | Med | **Description is 14px** (`text-sm`); design 12px, line-height 1.45, 4px below the title. Header gap is 6px. | Home:152 | `RunDialog.svelte:82-84`; `ui/dialog/dialog-description.svelte:15`; `dialog-header.svelte` `gap-1.5` | No |
| D3 | Med | **Window chrome:** 15.6px radius (`rounded-4xl`) vs 12px; 24px padding (`p-6`) vs 20px; 24px gap between header and form (`gap-6`) vs 16px; white surface vs `#F6F6F8`; overlay, shadow and centring as X5. Max width 512px (`sm:max-w-lg`) vs 520px. | Home:148-149 | `RunDialog.svelte:79`; `dialog-content.svelte:31` | No |
| D4 | Med | **An extra close (×) button** sits top-right (primitive default `showCloseButton`). The design has no close control; Cancel closes. | Home:149-172 | `dialog-content.svelte:16,37-46` (not disabled in `RunDialog.svelte:79`) | No |
| D5 | Med | **Model is Provider + Model selects**, with Provider first. Design is one text Input, label "Model", placeholder "Default model". The model select's empty option reads "Server default model" / "Select a model…", not "Default model". | Home:157 | `RunDialog.svelte:104-113`; `ModelPicker.svelte:108-159` | Intentional (D3, TD2); the empty-option copy isn't covered |
| D6 | Med | Field order, label size, hint position and error styling follow X1–X4 (hint under the field, 14px labels, 14px errors without `role="alert"`). | Textarea board | `RunDialog.svelte:88-171` | No |
| D7 | Low | **Validation timing.** The design re-validates on every keystroke (errors computed in `renderVals`). The impl validates on submit and clears an error when you edit. | Home:347-360 | `RunDialog.svelte:45-49,59-65` | Not specced |
| D8 | Low | Disclosure text is `text-muted-foreground` (hover → foreground); design text is `#1D1D1F`. Chevron is a stroke `ChevronRight` 12px vs a filled 10px triangle `#6E6E73` (X7). | Home:161-163 | `RunDialog.svelte:138-147` | No |
| D9 | Low | Step overrides textarea is 3 rows; the design's 150px block suggests about 4–5. Extra values 4 rows, Brief 3 rows are about right. | hint-size (Home:155,159,166) | `RunDialog.svelte:95,122,156` | — |
| D10 | Low | Server error is a 14px `<p role="alert">` above the footer. Not drawn. | — | `RunDialog.svelte:175-177` | Additive |
| D11 | Low | Footer has no extra 4px top padding (design `padding-top:4px`), and stacks reversed below `sm`. | Home:169 | `ui/dialog/dialog-footer.svelte:21` | — |
| D12 | — | Copy matches exactly: title with curly quotes, description ("behaviour"), Brief / Extra values / Step overrides labels, hints and placeholders, disclosure label, `aria-expanded`, error strings, Cancel / Start Run / Starting…. Lazy loading is TD6. | Home:151-171 | `RunDialog.svelte`; `lib/runRequest.ts` | ✓ |

---

## 6. Settings window (`SettingsDialog.svelte`, `settings/*`)

| # | Sev | Finding | Design | Code | Intentional? |
|---|---|---|---|---|---|
| G1 | Med | **Window chrome:** radius 8.4px (`rounded-xl`) vs 12px; white surface vs `#F6F6F8`; overlay `black/30` + blur vs `rgba(0,0,0,.06)`; centred vs 60px from top; shadow per X5. Width 620px matches. | Home:179-180 | `SettingsDialog.svelte:183`; `dialog-overlay.svelte:15` | No |
| G2 | Low | Header surface is `bg-muted` (#F7F7F9) vs `#F0F0F2`; padding `px-3 pt-2 pb-1.5` (12/8/6px) vs `12px 16px 8px`. | Home:182 | `SettingsDialog.svelte:196` | No (no token) |
| G3 | Low | Title is 600 (`font-semibold`); design 700. | Home:188 | `SettingsDialog.svelte:205` | No |
| G4 | — | × icon button "Close settings" replaces the traffic lights. | Home:183-187 | `SettingsDialog.svelte:198-204` | Intentional (D5) |
| G5 | — | Browser: no tablist, title "Settings", browser footnote copy. | — | `SettingsDialog.svelte:63,185-191`; `DefaultsSection.svelte:55-56` | Intentional (D4, TD3, TD4) |
| G6 | Low | **Tabs:** unselected icon uses the label colour (`text-foreground/80`), but the design draws icons `#6E6E73` and labels `#3A3A3C`. Radius `rounded-md` 4.8px vs 6px; top padding 6px vs 5px. Selected accent ink and `rgba(0,0,0,.07)` fill match. | `setTabs` (Home:373-377, 192) | `SettingsDialog.svelte:212-214` | Dark-mode ink is TD5; the rest is not |
| G7 | Low | Body padding is 20px × 16px (`px-5 py-4`) vs `20px 24px`, i.e. 24px sides. Max height comes from 90vh rather than a 520px body. | Home:199 | `SettingsDialog.svelte:226` | No |
| G8 | Med | **Footer "Saved" status** is 14px in the default text colour. Design is 12px, weight 500, green `#248A3D`. Footer padding `px-5 py-3` vs `12px 24px 16px`, gap 12 vs 8. | Home:264-266 | `SettingsDialog.svelte:240-242` | Copy is D2; styling is not |
| G9 | — | No "Restart Now" button; copy reads "Saved. Changes apply to the next run." | Home:266-267 | `SettingsDialog.svelte:242` | Intentional (D2) |
| G10 | Low | In the browser, Save is disabled until something changes. "Saving…" label and a "Loading…" body are not drawn. Error is a 14px `<p role="alert">` in the body, not a styled inline alert. | — | `SettingsDialog.svelte:222-223,235-237,246-248` | Not specced |
| G11 | — | Settings path line in the footer (desktop). | — | `SettingsDialog.svelte:243-244` | Intentional (R6) |
| **Defaults** | | | | | |
| G12 | Med | Grouped box radius is 6px vs 10px; padding 16px sides (`px-4` on box, rows have none) vs `12px 14px`. Box is white on white (X6). | Home:202-203 | `DefaultsSection.svelte:33`; `ModelPicker.svelte:82-83` | No |
| G13 | — | Provider row first, then Model. Provider hint drops the "Infer from model name" sentence; no "Infer from model name" / "Claude CLI" choices. | Home:203-216, 307 | `DefaultsSection.svelte:35-46` | Intentional (TD1, OQ1) |
| G14 | Med | Row label is the `Label` primitive (14px / 500), but the design's row titles are 13px **regular**. Hint 12px vs 11.5px. | Home:205-206, 212-213 | `ModelPicker.svelte:93-100` | No |
| G15 | Low | Default model is a select, not a text Input (placeholder `claude-sonnet-5`). Provider blank label "Choose a provider…" is not drawn. | Home:208 | `DefaultsSection.svelte:35-46` | R6 says use ModelPicker (intentional) |
| G16 | Low | `NativeSelect` arrow is a pink stroke `ChevronDown`. The design is a 16px pink rounded square with white up/down chevrons. | `Select.dc.html` | `ui/native-select/native-select.svelte:38` | No (primitive) |
| G17 | — | Source hint line ("Saved in the settings file." …) is not drawn. Keychain footnote drops "Changes apply after Smasher restarts". | Home:218 | `DefaultsSection.svelte:49-58` | Intentional (R6, D2) |
| **Services** | | | | | |
| G18 | Med | Disclosure rows are a raw `<button>` + `ChevronRight`, not the `Accordion` primitive (X7). Row padding 12px sides vs 14px. A hover fill is added. | Home:226-230 | `ServicesSection.svelte:47-62` | No |
| G19 | Low | Expanded panel: gap 16px vs 12px; padding `4 12 16 32` vs `2 14 14 32`. | Home:232 | `ServicesSection.svelte:64` | No |
| G20 | Med | API key: the hint is below the input row; the design puts it above, so **Remove** bottom-aligns with the input. Base URL hint is also below (X1). | Home:233-237 | `ServicesSection.svelte:65-85,88-101` | No |
| G21 | — | Placeholder "Removed when you save" after Remove. | — | `ServicesSection.svelte:38` | Intentional (TD4) |
| G22 | — | Key saved (secondary + success dot) / No key (outline) badges, placeholders, URL help + Ollama hint, first row open by default: all match. | Home:362-371 | `ServicesSection.svelte:26-40,59-61` | ✓ |
| **Claude CLI** | | | | | |
| G23 | Med | **Fields are not in a grouped box.** Design wraps "Where it is installed" and "Tools…" in a white box (border .08, radius 10, padding 12px 14px, gap 14). Impl places them straight on the window. | Home:248 | `ClaudeCliSection.svelte:31-74` | No |
| G24 | Low | Intro copy is 13px; design 12px, line-height 1.45. | Home:247 | `ClaudeCliSection.svelte:27` | No |
| G25 | Low | Reset to Default shares a row with the label (justify-between). The design gives the link its own right-aligned row above the field. Hint wraps `Bash(npm run build:*)` in `<code>`. | Home:253-258 | `ClaudeCliSection.svelte:59-74` | No |
| G26 | Low | Placeholder becomes "Find automatically ({detected path})" after detection. Detect has `aria-label="Detect Claude CLI"` (label-in-name OK). | Home:250 | `ClaudeCliSection.svelte:38,42` | Detect result copy is TD4; the placeholder extension is not |

---

## 7. Design-system usage

### 7a. Raw colours
- No hex/rgb literals in any audited component (`dashboard/*`, `settings/*`, `ModelPicker`,
  `shell/*`). ✓
- Primitives still hard-code `rgba()` shadows (`button.svelte` variants, `toggle-group-item`,
  `native-select`). These match the boards, but there is no shadow token. (Shell-theme scope, Low.)

### 7b. Opacity tints standing in for missing tokens
| Sev | Where | Note |
|---|---|---|
| Low | `WorkflowTable.svelte:117`, `RunTable.svelte:66`, `SettingsDialog.svelte:212` (`text-foreground/80`) | Approximates `#3A3A3C`. Add a `--foreground-secondary` (#3A3A3C / dark equivalent). Badge `outline` in the design also uses #3A3A3C (`badge.svelte:11` uses `text-foreground`). |
| Med | `DashboardPage.svelte:95`, `WorkflowTable.svelte:65` (`border-destructive/40 bg-destructive/5`) | The `--destructive-subtle` token exists and the Badge uses it; these alerts bypass it. The same alert markup is hand-rolled twice. No Alert primitive exists, so add one (or a shared component). |
| Low | `SettingsDialog.svelte:212` (`data-active:bg-foreground/7`, `dark:data-active:bg-white/10`) | Design `rgba(0,0,0,.07)`. OK, but tab styling belongs in a Tabs variant (see 7d). |
| Low | `RunTable.svelte:53`, `ServicesSection.svelte:49` (`hover:bg-accent/60`) | Hover fills aren't in the design. Fine, but use one shared value. |
| Low | `runStatus.ts:67` Aborted dot `var(--muted-foreground)` | Design `#8E8E93`. Consider a `--tertiary-foreground` token (also the design's placeholder colour). |
| Med | `SettingsDialog.svelte:242` | Success text has no token. `--success` (#28C840) fails contrast as text. Design uses `#248A3D`, so add `--success-foreground`. |

### 7c. Arbitrary Tailwind values
| Sev | Values | Where | Note |
|---|---|---|---|
| Med | `text-[13px]` ×13, `text-[11px]` ×12, `text-[15px]` ×4 | `DashboardPage:95`; `NeedsYouBanner:86`; `WorkflowTable:59,65,71,85,105,110,113,118`; `RunTable:42,57,61`; `RunList:64,81,83,87`; `RunDialog:140`; `SettingsDialog:205,212`; `ServicesSection:49`; `ClaudeCliSection:27`; `SourceList:40,55,71,83,96,122,163,164`; `Toolbar:42,44` | The macOS type scale (11 / 11.5 / 12 / 13 / 15) has no `@theme --text-*` tokens. Tailwind's `text-sm` (14px) therefore leaks in through `Label`, `DialogDescription`, error `<p>`s and `SettingsDialog:236,242`, giving a 5th, off-scale size. Add `--text-caption` (11px), `--text-footnote` (11.5px), `--text-body` (13px), `--text-title` (15px). The body is already 13px, so many `text-[13px]` uses are redundant. |
| Med | `rounded-lg` used where the design is 8px / 10px; `rounded-xl` (8.4px) used for the 12px Settings window | `WorkflowTable:65,70,82`; `RunTable:40`; `RunList:81,83,87`; `DashboardPage:95`; `DefaultsSection:33`; `ServicesSection:43`; `SettingsDialog:183` | With `--radius: 6px` the scale can't produce 8, 10 or 12px. Add explicit radius tokens (table 8, group box 10, window 12). |
| Low | `h-[26px]` (×2), `min-h-[34px]`, `md:grid-cols-[…]` (×2), `sm:grid-cols-[minmax(0,1fr)_230px]` | `WorkflowTable:52,85`; `RunTable:36,42,53`; `ModelPicker:83` | Layout values from the board. Acceptable, but the 26px table header is duplicated, so share a constant or class. |
| Low | `size-[15px]`, `size-[22px]`, `min-w-[72px]`, `w-[210px]`, `sm:max-w-[620px]`, `max-h-[90vh]` ×2 | `NeedsYouBanner:83`; `SettingsDialog:183,212,214`; `DashboardPage:75`; `RunDialog:79` | One-off board measurements. Fine. |
| Low | `h-[52px]`, `pl-[78px]`, `h-[76px]`, `size-[7px]` | `Toolbar:31`; `SourceList:48,49,51,146` | Toolbar height 52px appears in Toolbar, SourceList and `App.svelte` (`h-[calc(100dvh-52px)]`). Make it a `--toolbar-height` token. |

### 7d. Hand-rolled elements where a primitive exists
| Sev | Element | Where | Primitive |
|---|---|---|---|
| Med | Disclosure `<button>` + Lucide chevron | `RunDialog.svelte:138-147`; `ServicesSection.svelte:47-62` | `ui/accordion` (already the design's filled triangle, 13px, `py-[9px]`). The Run sheet's single disclosure could use Accordion `type="single"`, or a Collapsible if added. |
| Low | `role="table"` div grids | `WorkflowTable.svelte:78-130`; `RunTable.svelte:40-71` | `ui/table` exists. Grid rows were chosen so a whole run row can be a link and so rows stack on phones (plan-dashboard "RunTable … restyled to grid rows"). Intentional, but two parallel table implementations now exist. |
| Low | Grouped box `rounded-lg border bg-card` | `DefaultsSection.svelte:33`; `ServicesSection.svelte:43` | `ui/card` exists but is unrestyled (`rounded-4xl shadow-md ring-1 py-6`, `card.svelte:18`), so it can't be used as-is. Add a `grouped` variant matching the board (10px, border .08, white). |
| Low | Empty-state / alert `<p>` boxes | `RunList.svelte:81,83,87` (same class string ×3); `WorkflowTable.svelte:65,70`; `DashboardPage.svelte:95` | No primitive exists. Extract an EmptyState / InlineAlert. |
| Low | Tabs trigger re-styled inline (`h-auto flex-col … data-active:shadow-none data-active:font-normal`) | `SettingsDialog.svelte:208-218` | Overrides the segmented-control Tabs primitive almost entirely. Add a `toolbar` variant to `tabs-list` / `tabs-trigger`. |
| Low | Settings trigger `Button` without Tooltip, duplicated in two files | `LazySettingsDialog.svelte:24-26`; `SettingsDialog.svelte:173-178` | `ToolbarIconButton` exists for this. |
| — | Native `<input>`, `<select>`, `<textarea>`, `<table>` | none | ✓ All fields use `Input`/`Textarea`/`NativeSelect`; badges use `Badge`; the filter uses `ToggleGroup`. |

### 7e. Local CSS
- No `<style>` blocks in any audited file. ✓
