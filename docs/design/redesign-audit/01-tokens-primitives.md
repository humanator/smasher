# Audit 01: tokens, primitives, and shell vs the redesign boards

Scope: `frontend/src/app.css` tokens; the 13 component boards plus `Sidebar.dc.html`; shell chrome in
`Home`/`Workflow`/`Run.dc.html`; `frontend/src/lib/components/ui/*`; `frontend/src/components/shell/*`.
This audit is read-only. Board paths are relative to `docs/design/redesign/`, impl paths to `frontend/src/`.
Severity: **High** = visibly wrong or missing. **Med** = noticeable drift. **Low** = nit.

How I checked: each board value comes from the `<script type="text/x-dc">` style strings (BASE/VARIANT/SIZE/STATE
objects). Each impl value comes from the class string at the cited line. Tailwind v4 maths uses the `@theme inline` block
in `app.css`.

---

## 0. Cross-cutting: the radius scale makes `rounded-md` 4.8px (High)

- `app.css:48` sets `--radius: 6px`. `app.css:139-145` derives the shadcn scale: `--radius-sm` = 3.6px, `--radius-md` =
  **4.8px**, `--radius-lg` = 6px, `--radius-xl` = 8.4px, `--radius-2xl` = 10.8px, `--radius-3xl` = 13.2px,
  `--radius-4xl` = 15.6px.
- These primitives use `rounded-md`, so they render at **4.8px**. The boards use **6px**:
  - Button: `button/button.svelte:7` vs `Button.dc.html` BASE `border-radius:6px`.
  - Input: `input/input.svelte:16` vs `Input.dc.html` BASE `border-radius:6px`.
  - Textarea: `textarea/textarea.svelte:18` vs `border-radius:6px`.
  - NativeSelect: `native-select/native-select.svelte:33` vs `Select.dc.html` `border-radius:6px`.
  - SourceList rows: `components/shell/SourceList.svelte:40` (`rowClass` `rounded-md`). tailwind-merge drops the
    primitive's `rounded-xl`, so the row is 4.8px. `Sidebar.dc.html` and the Home/Workflow/Run rows use `border-radius:6px`.
- None of the design's other radii fall on a step of the scale: table **8px** (xl = 8.4), card/step-list/accordion/popover
  **10px** (2xl = 10.8), sheet/dialog **12px** (3xl = 13.2). So every primitive hard-codes them (`rounded-[10px]`,
  `rounded-[7px]`, `rounded-[5px]`, `rounded-[3.5px]`). Untouched shadcn defaults are visibly too round:
  - `card/card.svelte:18` and `dialog/dialog-content.svelte:31` use `rounded-4xl` (15.6px). The cards in Home, Workflow
    and Run (`border-radius:10px`) and the Run sheet (`border-radius:12px`, Home.dc.html:149) are much tighter.
  - `skeleton/skeleton.svelte` uses `rounded-2xl`.
  - Drawer sheet `rounded-t-xl` is 8.4px against the board's 12px (see Drawer).
- **Fix direction:** add named radii (`--radius-control: 6px`, `--radius-segment: 5px`, `--radius-track: 7px`,
  `--radius-table: 8px`, `--radius-card: 10px`, `--radius-sheet: 12px`), or redefine the scale so md = 6. Then replace
  `rounded-md` and the arbitrary values.

---

## 1. Tokens (`frontend/src/app.css`)

### 1a. Tokens that differ from the design

| Token | Impl | Design | Sev |
|---|---|---|---|
| `--ring` (`app.css:42`) | `rgba(190,24,93,.4)` used for every focus ring | Buttons, tabs and switch use `.4`. **Text fields use `.3`** (`Input.dc.html` and `Textarea.dc.html` STATE.focus `0 0 0 3px rgba(190,24,93,.3)`). **Select uses `.35`** (`Select.dc.html` STATE.focus). | Low |
| `--destructive` (`:36`) used for the invalid border and ring | `#C4170F` border, plus `ring-destructive/25` (a mix of #C4170F) | The invalid **border is `#FF3B30`** (systemRed) and the **ring is `rgba(255,59,48,.22)`** (Input, Textarea, Select, Checkbox STATE.invalid). `#C4170F` is only the error *text* colour. | Med |
| `--accent` (`:34`) used for the ghost pressed state | `rgba(0,0,0,.06)` | Ghost `pressed` is `background:rgba(0,0,0,.08);color:#1D1D1F` (`Button.dc.html` renderVals). | Low |
| `--muted-foreground` used for the ghost button and sidebar toggle text | `#6E6E73` | Ghost text is **`#4A4A4F`** (`Button.dc.html` VARIANT.ghost, `Sidebar.dc.html` toggle `color:#4A4A4F`, Drawer close button `#4A4A4F`). No token exists for it. | Med |
| `--border` used for the line-tabs, drawer and table hairlines | `rgba(0,0,0,.08)` | Line tabs: `border-bottom:1px solid rgba(0,0,0,.1)` (Tabs.dc.html). Inspector drawer: `rgba(0,0,0,.1)`. Tables in Home, Workflow and Run: `border:1px solid rgba(0,0,0,.1)`. A second, stronger hairline is needed. | Low |
| `--input` used for the badge outline | `rgba(0,0,0,.14)` | Badge outline is `inset 0 0 0 1px rgba(0,0,0,.16)` (Badge.dc.html VARIANT.outline). | Low |

The light values in R1 otherwise match the boards exactly: background, foreground, muted, muted-foreground, sidebar,
sidebar-muted-foreground, sidebar-accent, primary, primary-subtle(-fg), secondary, destructive(-subtle), success, info,
border, input and radius. Fonts are correct: `app.css:99-101` uses the system stack and mono. Body is 13px/1.38
(`app.css:12-13`). `ModeWatcher defaultMode="system"` is mounted (`App.svelte:234`).

### 1b. Recurring design values with no token

Colours (light):

| Value | Where in the boards | Suggested token | Sev |
|---|---|---|---|
| `#4A4A4F` | ghost button text, sidebar toggle, drawer close | `--control-foreground` (or `--ghost-foreground`) | Med |
| `#3A3A3C` | badge outline text; table "when"/"started" cells (Home.dc.html:104, :137); completed text (Run.dc.html:109) | `--secondary-label` | Low |
| `#8E8E93` | input and textarea placeholders (`input::placeholder{color:#8E8E93}`); Aborted dot (Home STATUS_BADGE); step numbers (Workflow.dc.html:94). The impl uses `--muted-foreground` #6E6E73 for both the placeholder and the Aborted dot (`lib/runStatus.ts`). | `--tertiary-label` / `--neutral-dot` | Low |
| `#FF3B30` / `rgba(255,59,48,.22)` | invalid border and ring (all fields, checkbox); failed hero icon (Run.dc.html:118) | `--destructive-strong`, `--destructive-ring` | Med |
| `#FF9500` (dot) / `#B25000` (text) | the **amber/warning** tone in Run.dc.html:299 `TONE.amber`; issue dot; `SCORE_DOT.amber` | `--warning`, `--warning-foreground` | Med |
| `#248A3D` | success **text** (Run TONE.green, the "Saved" status in Home.dc.html settings) | `--success-foreground` | Med |
| `#0060DF` | info **text** (Run TONE.blue) | `--info-foreground` | Low |
| `#AEAEB2` / `#6E6E73` | the muted tone (Run TONE.muted), edge strokes (Main) | `--neutral` | Low |
| `#F2FAF4` + `rgba(40,200,64,.3)` | completed hero surface and border (Run.dc.html:105) | `--success-subtle`, `--success-border` | Med |
| `#FFF5F4` + `rgba(255,59,48,.28)` | failed hero surface and border (Run.dc.html:117) | `--destructive-surface`, `--destructive-border` | Med |
| `#FFF1F0` | red-tinted log rows (Run) | (as above) | Low |
| `rgba(190,24,93,.18)` | primary-subtle banner bottom border (Home.dc.html:71, Workflow.dc.html:70). The impl uses `border-primary/20` (`NeedsYouBanner.svelte:80`). | `--primary-subtle-border` | Low |
| `#F6F6F6` | tooltip background, hard-coded hex at `tooltip/tooltip-content.svelte:28` (`bg-[#F6F6F6]`). This breaks the spec's "never hard-code hex". | `--tooltip` | Med |
| `#F6F6F8` | sheet/dialog window surface (Home.dc.html:149, :180) | `--sheet` / `--window` | Low |
| `#F0F0F2` | window toolbar (Home.dc.html:182); open popover trigger (Popover.dc.html) | `--window-toolbar` / `--control-pressed` | Low |
| `rgba(0,0,0,.05)` | toolbar search-field fill. The impl hard-codes `bg-black/5` (`input/input.svelte:17`). | `--field-filled` | Low |
| `rgba(0,0,0,.09)` | switch off-track. The impl uses `bg-black/10` (`switch/switch.svelte:22`). | `--track` | Low |
| `rgba(0,0,0,.025)` | accordion/grouped-box fill. The impl hard-codes `bg-black/[.025]` (`accordion/accordion.svelte:17`). | `--group` | Low |
| `rgba(0,0,0,.05)`/`.06`/`.07` | table row and list row separators | `--separator` | Low |
| `rgba(0,0,0,.12)` | 1×18px toolbar divider (Run.dc.html:75) | `--toolbar-divider` | Low |
| scrims: `rgba(0,0,0,.18)` (drawer sheet), `.14` (Run sheet), `.06` (Settings); none for the inspector | the impl uses `bg-black/30` plus `backdrop-blur-sm` everywhere | `--scrim` | Med |
| step-kind ink/tint | Main.dc.html:313 GROUPS. These live in JS (`lib/stepKinds.ts:30-35`) as R3 specifies, not CSS. That is fine, but no CSS variables exist for them. | (optional) | Low |

Shadows: there is **no shadow token at all**, so every primitive repeats raw rgba arbitrary values:

| Design shadow | Uses | Impl copies |
|---|---|---|
| push button: `0 0 0 .5px rgba(0,0,0,.16), 0 .5px 1.5px rgba(0,0,0,.14)` | outline/destructive button, select, popover trigger, drawer buttons | `button.svelte:11`, `:14`, `native-select.svelte:33`, `toggle-group.svelte:71` (that one uses `.12`, which matches ToggleGroup.dc.html) |
| accent button: `0 0 0 .5px rgba(0,0,0,.14), 0 .5px 1.5px rgba(0,0,0,.18), inset 0 .5px 0 rgba(255,255,255,.22)` | default button | `button.svelte:10` |
| segment: `0 0 0 .5px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.14)` | tabs, toggle-group | `tabs-trigger.svelte:17`, `toggle-group-item.svelte:26` |
| field inset: `inset 0 .5px 1px rgba(0,0,0,.05)` | input, textarea | `input.svelte:16`, `textarea.svelte:18` |
| thumb: `0 0 0 .5px rgba(0,0,0,.08), 0 1px 2.5px rgba(0,0,0,.25)` | switch | `switch.svelte:30` |
| help tag: `0 0 0 .5px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.14)` | tooltip | `tooltip-content.svelte:28` |
| popover: `0 0 0 .5px rgba(0,0,0,.14), 0 10px 30px rgba(0,0,0,.18)` | popover | `popover-content.svelte:27` |
| sheet: `0 0 0 .5px rgba(0,0,0,.18), 0 20px 50px rgba(0,0,0,.28)` | drawer top/bottom | `drawer-content.svelte:26` (twice) |
| dialog: `0 0 0 .5px rgba(0,0,0,.22), 0 24px 60px rgba(0,0,0,.3)` (Home.dc.html:149) | Run sheet | dialog uses `shadow-xl ring-1 ring-foreground/5` (`dialog-content.svelte:31`) |
| window: `0 0 0 .5px rgba(0,0,0,.25), 0 30px 80px rgba(0,0,0,.35)` (Home.dc.html:180) | Settings | none |
| traffic-light and chip hairline: `inset 0 0 0 .5px rgba(0,0,0,.12)` (14× in the screens) | | none |
| focus ring: `0 0 0 3px rgba(190,24,93,.4)` | | `ring-3 ring-ring` matches |

Because the shadows are copied, **dark mode is inconsistent** (Med):
- `button.svelte:11/14` and `checkbox.svelte:20` have `dark:` shadow overrides.
- `native-select.svelte:33`, `toggle-group.svelte:71` (outline), `switch.svelte:22/30` and both input inset shadows keep black
  hairlines in dark, so the select and outline segmented control lose their edge on `#1E1E1E`.
- Dark backgrounds are hard-coded white alphas (`dark:bg-white/10`, `/5`, `/15`, `/20`) instead of tokens: button:11,14;
  input:16,17; textarea:18; native-select:33; checkbox:20; switch:22; tabs-trigger:17; toggle-group-item:26;
  toggle-group:71; accordion:17.

Type: there are no caption tokens. The boards use 11, 11.5, 12, 12.5, 13, 15 and 20px. 11.5px (field hint and error) appears
**nowhere** in the impl. Several primitives still use shadcn's `text-sm` (14px) or `text-base` (16px) where the boards use
12 or 13px. See Label, Popover and Drawer below. (Med)

### 1c. Tokens present but unused

Counted by grepping `src/**/*.svelte|ts`, excluding `app.css` and the design gallery:
- `--chart-1`…`--chart-5` (`app.css:43-47`, `:83-87`): 0 uses. They are still shadcn oklch roses, and no board defines them. (Low)
- `--sidebar-primary`, `--sidebar-primary-foreground` (`:52-53`, `:91-92`): 0 uses. (Low)
- `--accent-foreground` (`:35`): 0 direct uses. Only `sidebar-accent-foreground` is used. (Low)
- `--font-heading` (`:100`): only shadcn title primitives use it. It equals `--font-sans`, so it is harmless. (Low)
- `--success`/`--info`: used only as `var()` dot colours (`lib/runStatus.ts`, `SourceList.svelte:148`) and in the gallery.
  This is fine, but no `-foreground` pair exists for status text.

---

## 2. Primitives

### Button (`lib/components/ui/button/button.svelte` vs `Button.dc.html`)
Variants, sizes, heights, paddings, 13px/400, 500 on default, gap 5px, letter-spacing, disabled `.4`, icon sizes
(11/13/16) and the focus ring all match. Mismatches:
- **Radius 4.8px vs 6px** (`:7` `rounded-md`). **Med** (see §0). `xs`/`icon-xs` correctly use `rounded-[5px]`.
- **Ghost text `text-muted-foreground` #6E6E73 vs board `#4A4A4F`** (`:13`). Toolbar icons look lighter than the design. **Med**
- Ghost pressed `aria-pressed:bg-accent` (.06) vs board `rgba(0,0,0,.08)` (`:13`). **Low**
- Extras not in the board: `hover:brightness-110 active:brightness-95` (`:10`), `hover:bg-muted` (`:11`),
  `active:not-aria-[haspopup]:translate-y-px` (`:7`, an iOS-style nudge that macOS push buttons don't have),
  `aria-invalid:ring-3` (`:7`). **Low**
- Shadows are raw rgba arbitrary values (`:10,11,14`). Secondary hover is `hover:bg-[color-mix(...)]` (`:12`). Sizes are
  all arbitrary px (`h-[24px]`, `size-[28px]`…). **Low** (token hygiene)
- On focus the board replaces the push shadow with the ring (`box-shadow:... !important`). The impl stacks the ring on top
  of the push shadow. **Low**

### Badge (`badge/badge.svelte` vs `Badge.dc.html`)
18px, 7px padding, 999 radius, 11/500, gap 5 and the 6px `dot` prop (`:52`) all match.
- Outline: `shadow-[inset_0_0_0_1px_var(--input)]` (.14) and `text-foreground` (#1D1D1F) vs board `rgba(0,0,0,.16)` and
  `#3A3A3C` (`:11`). **Low**
- `dot` accepts any CSS colour. Callers pass `var(--success|info|destructive|muted-foreground)` (`lib/runStatus.ts`).
  Home STATUS_BADGE gives **Failed no dot** and **Aborted `#8E8E93`**. The impl gives Failed a destructive dot and Aborted
  #6E6E73. **Low**

### Input (`input/input.svelte` vs `Input.dc.html`)
24px, 8px padding, 1px `--input` border, inset shadow, 13px, accent border on focus, disabled `.45`, and search mode
(28px, `rounded-[7px]`, transparent border, 26px left padding) all match.
- Radius 4.8 vs 6 (`:16`). **Med**
- Invalid: `aria-invalid:border-destructive` (#C4170F) and ring `destructive/25` vs board `#FF3B30` and `rgba(255,59,48,.22)`
  (`:16`). **Med**
- Focus ring `.4` vs board `.3` (`:16` `ring-ring`). **Low**
- Placeholder `text-muted-foreground` #6E6E73 vs `#8E8E93` (`:16`). **Low**
- Search magnifier is lucide 14px with default stroke 2 vs board 13px, stroke 2.2, `left:8px` (`:46`). **Low**
- `bg-black/5` and `dark:bg-white/10` are hard-coded (`:17`). **Low**
- **Missing:** the board's `mono` prop (`font-family:mono;font-size:12px`), and the label/hint/error composition (label
  13/500, hint **11.5px** #6E6E73, error **11.5px** #C4170F `role=alert`). There is no Field helper in `ui/`. **Med**

### Textarea (`textarea/textarea.svelte:18` vs `Textarea.dc.html`)
min-h 52, 5px/8px padding, 13px/1.45, resize-y and inset shadow all match.
- The radius, invalid colour, focus `.3`, placeholder and missing `mono` findings from Input apply here too. **Med/Low**
- `field-sizing-content` (auto-grow) is not in the board. **Low**

### Select → NativeSelect (`native-select/native-select.svelte` vs `Select.dc.html`)
The board is a native pop-up button ("Same API as the shadcn native-select it replaces"), so a non-native `ui/select`
is **not** needed. None exists.
- **Stepper chevron missing.** The board has a **16×16 accent-filled square** (`background:#BE185D;border-radius:4px`,
  `right:4px;top:4px`) holding **white up/down chevrons** (10px, stroke 3, path `M7 9.5l5-5 5 5M7 14.5l5 5 5-5`). The impl
  has a single lucide `ChevronDownIcon`, `text-primary`, 13px, `right-2` (`:38`). Spec R2 explicitly asks for "the accent
  stepper chevron". **High**
- Radius 4.8 vs 6 (`:33`). **Med**
- The wrapper is `w-fit` (`:22`). The board is `width:100%`, so callers must override. **Low**
- Focus: board `0 0 0 3px rgba(190,24,93,.35)` *replaces* the push shadow. The impl stacks a `.4` ring (`:33`). **Low**
- Invalid: `0_0_0_1px_var(--destructive)` plus `destructive/25` vs board `0 0 0 1px #FF3B30, 0 0 0 4px rgba(255,59,48,.22)` (`:33`). **Low**
- No dark shadow override: a black .16 hairline on dark (`:33`). **Med**

### Checkbox (`checkbox/checkbox.svelte` vs `Checkbox.dc.html`)
14px, 3.5px radius, unchecked/checked shadows, accent fill and disabled `.45` all match.
- Check glyph: lucide 11px stroke 3 vs board 10px stroke 3.5 (`:30`). **Low**
- Invalid uses `--destructive` (#C4170F) and a 25% mix vs board `#FF3B30` and `rgba(255,59,48,.22)` (`:20`). **Low**
- `after:-inset-x-3 after:-inset-y-2` always enlarges the hit area, on top of the coarse-pointer `::after` rule in
  `app.css:215-232`. Two rules write the same pseudo-element. **Low**

### Switch (`switch/switch.svelte` vs `Switch.dc.html`)
38×22 and 26×15, thumbs 20 and 13, translate 16 and 11, thumb shadow and 150ms transitions all match.
- Off track `bg-black/10` vs board `rgba(0,0,0,.09)`. The on-state inset is `.12` in both states vs board `.1` when on (`:22`). **Low**
- Hard-coded `bg-black/10`, `dark:bg-white/20` and `bg-white` (`:22`, `:30`). No dark hairline override. **Low**

### Tabs (`tabs/*` vs `Tabs.dc.html`)
Default segmented track (`rounded-[7px] bg-secondary p-0.5`, `tabs-list.svelte:8`), 20px segments, 12px padding, 5px
radius, active white with segment shadow and 500 weight all match. The line variant (gap 18, 2px accent underline,
600 active, muted inactive, py 6) matches.
- Triggers are always `flex-1` (`tabs-trigger.svelte:16`). The board uses `flex:none` unless `fullWidth`, so segments
  should size to their labels. **Low**
- Line list hairline is `border-border` (.08) vs board `rgba(0,0,0,.1)` (`tabs-list.svelte:9`). **Low**
- Line triggers inherit `leading-none` (`:16`). The board inherits normal line-height, so the impl row is about 3px shorter. **Low**
- `tabs-content.svelte:15` uses `text-sm` (14px). Body is 13px. **Low**
- **No `fullWidth` prop** on the list; callers have to pass `class="w-full"`. **Low**

### ToggleGroup (`toggle-group/*`, `toggle/toggle.svelte` vs `ToggleGroup.dc.html`)
Track (`p-0.5`, `rounded-[7px]`), outline track shadow (`.16`/`.12`), segment heights 20 and 18, 11px padding, 13/12px
text, outline-on accent fill and default-on white segment all match.
- **Default variant differs:** the board's prop default is `outline`. The impl default is `"default"` (recessed)
  (`toggle-group.svelte:33`). The only product caller passes `variant="default"` explicitly (`RunList.svelte:66`), which
  matches Home.dc.html:120. So this is only an API-default drift. **Low**
- `toggle.svelte:5` base has `aria-pressed:bg-secondary`. bits-ui sets `aria-pressed` on items only for
  `type="multiple"` (`bits-ui/.../toggle-group.svelte.js:97-99`). With `variant="outline"` that rule competes with
  `data-[state=on]:bg-primary`. Single-select (all current uses) is unaffected. **Low**
- Outline dark shadow not overridden (`toggle-group.svelte:71`). **Low**

### Accordion (`accordion/*` vs `Accordion.dc.html`)
Grouped box (`bg-black/[.025]`, 1px border, `rounded-[10px]`), trigger (9px/10px padding, gap 6, 13/600) and content
(26px left, 10px right and bottom padding, 13/1.45 muted) all match.
- Disclosure glyph: lucide `play` (rounded, stroked) at 10px (`accordion-trigger.svelte:27`) vs board's filled sharp
  triangle `M8 4l10 8-10 8z` in `#6E6E73`. It reads heavier. **Low**
- `not-last:border-b` (`accordion-item.svelte:15`). The board puts a border on every item, which doubles at the
  bottom. The impl is arguably better. **Low**
- Hard-coded `bg-black/[.025]` and `dark:bg-white/[.03]` (`accordion.svelte:17`). **Low**

### Tooltip (`tooltip/tooltip-content.svelte` vs `Tooltip.dc.html`)
5px radius, 4px/8px padding, 11px/1.35, max-width 280, 6px offset, `side="top"`, the help-tag shadow and no arrow all match.
- **Hard-coded hex `bg-[#F6F6F6]`** (`:28`). This violates the spec's "Never hard-code hex". Dark falls back to
  `bg-popover`. **Med**
- `delayDuration=0` (`tooltip-provider.svelte:4`, and the sidebar provider). The board shows on hover or focus. A macOS
  help tag has a delay, but the board doesn't specify one. **Low**

### Popover (`popover/*` vs `Popover.dc.html`)
Panel (280 wide, 12px/14px padding, `rounded-[10px]`, shadow, `sideOffset` 10) and arrow (12px rotated square, −6px,
14px inset, `-.5px -.5px 0 rgba(0,0,0,.14)`) match. The arrow is implemented at `popover-content.svelte:32-41`.
- **Title:** `text-base font-medium` (16px/500) (`popover-title.svelte:16`) vs board 13px/600/1.3 with 3px bottom margin. **Med**
- **Body:** `popover-description.svelte:16` sets only colour, so it inherits 13px. The board body is **12px/1.45** muted.
  `popover-header.svelte:16` uses `gap-1 text-sm` (14px). **Med**
- Default `align="center"` (`:11`) vs board default `start`. **Low**
- The arrow only handles side top and bottom. Left and right sides put it at the top edge (`:36`). **Low**
- The board's round 20px "?" help trigger and the open-trigger fill `#F0F0F2` have no primitive. Callers would use Button
  outline, whose `aria-expanded:bg-muted` gives `#F7F7F9` instead (`button.svelte:11`). **Low**
- Only used in `PrimitivesGallery.svelte`. No product consumer.

### Drawer (`drawer/*`, vaul-svelte vs `Drawer.dc.html`)
The board has two shapes. **Top/bottom** is a macOS *sheet*: floating and centred (`left:50%;top:40px`), `width:calc(100% - 48px)`,
`max-width:420px`, `max-height:80%`, **12px radius on all corners**, white, sheet shadow, scrim `rgba(0,0,0,.18)`.
**Left/right** is an *inspector*: 75% wide up to 300px, `#F7F7F9`, a 1px `rgba(0,0,0,.1)` edge, no shadow and a
**transparent** scrim.
- **Top/bottom shape is wrong.** The impl is an edge-anchored, full-width vaul drawer (`inset-x-0 bottom-0`,
  `rounded-t-xl` = 8.4px top corners only, `mt-24`, `max-h-[80vh]`) with a drag-handle pill
  (`drawer-content.svelte:26, 31-33`). There is no centred 420px sheet and no 12px all-round radius. **High**
- **Scrim:** `bg-black/30` plus `backdrop-blur-sm` for every direction (`drawer-overlay.svelte:16`) vs `.18` for sheets
  and none for inspectors. **Med**
- **Header** adds `p-4` inside the content's own 18/20/16 padding (`drawer-header.svelte:17`), so the padding doubles.
  It is centre-aligned for top/bottom below `md`. The board is left-aligned with no extra padding. **Med**
- **Title** `font-heading text-base font-medium` (16/500) (`drawer-title.svelte:15`) vs board **13px/700**/1.3. **Med**
- **Description** `text-sm` (14px) (`drawer-description.svelte:15`) vs board **12px/1.45**, 3px top margin. **Med**
- **Footer** `flex flex-col gap-2 p-4` (`drawer-footer.svelte:16`) stacks full-width buttons. The board is a right-aligned
  row (`justify-content:flex-end;gap:8px;padding-top:18px`) with buttons `min-width:72px`. **Med**
- **Missing `showClose`:** the board's optional 22px round close button (`rgba(0,0,0,.06)`, `#4A4A4F`, 10px ×, stroke 3)
  is absent. `sheet-content.svelte` has a close button, but it is a 24px ghost button with `bg-secondary`. **Med**
- `shouldScaleBackground = true` (`drawer.svelte:5`) produces an iOS-style background zoom that is not in the design. **Low**
- Inspector `sm:max-w-[300px]` only applies at ≥640px; the board caps at 300 always. The edge is `border-border` (.08)
  vs `.1`. **Low**
- `ui/sheet` (`sheet-content.svelte:38`) is untouched shadcn (`shadow-xl`, `sm:max-w-sm`, `bg-popover`, `p-6`
  header, `text-base` title). It has no product consumers except the phone-width sidebar.
- Drawer is only used in `PrimitivesGallery.svelte`.

### Label (`label/label.svelte:16`). It is not one of the 13 boards, but every field board has one.
- `text-sm leading-none font-medium gap-2` (14px/1/500) vs the field label in Input, Textarea and Select boards:
  **13px/500/1.2**, 4px gap to the field. Used by 11 files. **Med**
- The Checkbox and Switch boards set row gaps of 7px and 8px. Label gives 8px. **Low**

---

## 3. Shell

### Sidebar primitive (`lib/components/ui/sidebar/*`) vs `Sidebar.dc.html`
The primitive is stock shadcn. AppShell overrides widths and SourceList overrides most classes, but some defaults leak through:
- `constants.ts:3-5`: `SIDEBAR_WIDTH 16rem`, `SIDEBAR_WIDTH_ICON 3rem`. AppShell overrides them correctly to 220/76
  (`AppShell.svelte:43`). `SIDEBAR_WIDTH_MOBILE` is **18rem (288px)** (`sidebar.svelte:47`). The phone sheet is wider
  than the 220px design. **Low**
- `sidebar-menu-button.svelte:5` base: `rounded-xl` (8.4), `h-9`/`text-sm` (`:12`) and `px-3 py-2` are overridden by
  `rowClass`. The following still apply:
  - `hover:bg-sidebar-accent` **equals the selected fill** (.09), so a hovered row looks selected. The board has no hover. **Med**
  - `data-active:font-medium` makes the active row bold. The board only changes the background. **Low**
  - `focus-visible:ring-2`: a **2px** ring vs the spec's 3px. **Low**
  - Collapsed: `group-data-[collapsible=icon]:size-8! p-2!` gives **32×32 boxes**. The board keeps **28px-high**
    full-width rows centred in 76px (`Sidebar.dc.html` item style `height:28px;justify-content:center;padding:0`). **Med**
  - `overflow-hidden` plus the collapsed 32px box: a collapsed workflow row renders icon (16) + gap (8) + dot (7) inside a
    16px content box. The **state dot is clipped**, though its sr-only text remains (`SourceList.svelte:137-149`). **Low**
    (the board shows no dots when collapsed, but the markup is then dead)
- `sidebar-group-label.svelte:18` base `text-sidebar-foreground/70 text-xs font-medium` is overridden in SourceList. OK.

### SourceList (`components/shell/SourceList.svelte`) vs the Home, Workflow and Run sidebars (lines 21-53)
Matching: 220px width and `#EBEBEE` background; 52px header with 20/12 padding (`:45-53`); 28px rows with 8px padding
and gap 8; 16px accent icons; 11px/600 sidebar-muted section labels; 7px dots in `--primary`/`--info`; 11px sidebar-muted
footer with correct pluralisation; native 78px inset.
- **Row radius 4.8px vs 6px** (`:40`). **Med**
- **Needs-you pill:** uses `<Badge>` (18px tall, 7px padding, 11px/**500**) (`:110`). The board pill is **16px tall,
  `min-width:18px`, `padding:0 5px`, 11px/600** (Home.dc.html:39). It renders taller and wider than the design. **Med**
- **Library counts are 11px** (`:83`, `:96`) vs board **12px** `#636368` (Home.dc.html:31,35). **Low**
- **Workflow rows have no icon** when expanded (`:137-141`). Every board row has a 16px file icon in **`#6E6E73`**
  (`M7 3h7l5 5v12…`, Home.dc.html:46). **Med**
- **Library icons differ from the boards:** lucide `workflow`, `play` and `hand` vs board "flow" (two-node branch
  `M6 3v12M18 9v12…`), **clock** (`M12 21a9 9 0 1 0 0-18…M12 7v5l3 2`) and **person** (`M12 11a3.5 3.5…M5 20c0-3.5…`).
  **Med**
- **No active state on Library rows.** Home.dc.html:29 marks "Workflows" `aria-current="page"` with the .09 fill on the
  dashboard. The impl never sets `isActive` or `aria-current` on Library rows (`:77-116`). **Med**
- Workflows nav top spacing `mt-3` (12px) (`:120`) vs board `padding-top:14px`. Section label is `h-6` (24px) vs board
  `padding:4px 8px` (≈21px). **Low**
- Footer `px-5 py-2.5 leading-snug` (20px sides, 10px bottom, 1.375) (`:164`) vs board `padding:10px 18px 14px;line-height:1.4`. **Low**
- An extra "Design system" link sits above the footer (`:163`). It is not in any board. **Low**
- Toggle button is ghost, so it gets #6E6E73 plus hover fill (`:57`). The board uses `#4A4A4F` (Sidebar.dc.html). The
  Home, Workflow and Run boards show no toggle at all, but spec R4 requires one. **Low**

### AppShell (`components/shell/AppShell.svelte`)
- 220/76 widths are passed via the provider style (`:43`). That is correct.
- Right hairline comes from the primitive's `border-e`, using the `--border` colour (same value as `--sidebar-border`). OK.

### Toolbar (`components/shell/Toolbar.svelte`) vs the Home, Workflow and Run `<header>`
Matching: 52px height, bottom hairline, `h1` 15px/700, 11px muted subtitle with a mono fragment, ghost 28px back
button, right-aligned actions.
- **Padding and gap:** always `px-4 gap-2` (16/16, 8) (`:31`). Board: Home `padding:0 12px 0 20px; gap:6px`.
  Workflow and Run `padding:0 12px; gap:8px` with `padding-left:4px` on the title block. Without a back button the
  title starts 4px left of the design and the right edge is 4px off. **Low**
- **Background:** `bg-background/95 backdrop-blur … bg-background/70` (`:31`). The board toolbar is opaque white. **Low**
- **No slot beside the title.** Run.dc.html:63-66 puts a status `Badge` inline after the `h1`. `title` is a plain string
  (`:10`), so the Run screen cannot reproduce this without an API addition. **Med**
- Title `leading-tight` (1.25) vs board 1.2. **Low**
- **No toolbar divider primitive.** Run.dc.html:75 has `1px × 18px rgba(0,0,0,.12)`. `ui/separator` uses `bg-border`
  (.08) and is full-height. **Low**

### ToolbarIconButton (`components/shell/ToolbarIconButton.svelte`)
- Ghost `size="icon"` (28px) with a tooltip label (`:25`) matches the board's 28px ghost icon buttons. It inherits the
  ghost text mismatch (#6E6E73 vs #4A4A4F). **Med** (via Button)
- **No `pressed`/`expanded` prop.** Run.dc.html:76 has a ghost inspector toggle with `pressed`/`expanded`. **Low**

---

## 4. Hard-coded values that should be tokens (summary)

| File:line | Hard-coded |
|---|---|
| `ui/tooltip/tooltip-content.svelte:28` | `bg-[#F6F6F6]` (hex), two raw rgba shadows |
| `ui/button/button.svelte:10,11,14` | raw rgba shadows (push and accent), `dark:bg-white/10`, `dark:shadow-[...]` |
| `ui/button/button.svelte:12` | `hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_6%)]` |
| `ui/button/button.svelte:7,18-25` | `text-[13px]`, `gap-[5px]`, `tracking-[-0.005em]`, `h-[24px]`… every size is arbitrary px |
| `ui/input/input.svelte:16-17` | raw inset shadow, `bg-black/5`, `dark:bg-white/5`, `dark:bg-white/10`, `rounded-[7px]`, `pl-[26px]` |
| `ui/textarea/textarea.svelte:18` | raw inset shadow, `dark:bg-white/5`, `min-h-[52px]`, `py-[5px]` |
| `ui/native-select/native-select.svelte:33` | raw push shadow (no dark variant), `dark:bg-white/10` |
| `ui/checkbox/checkbox.svelte:20` | three raw rgba shadows, `color-mix` invalid ring, `rounded-[3.5px]` |
| `ui/switch/switch.svelte:22,30` | `bg-black/10`, `dark:bg-white/20`, `bg-white`, raw rgba shadows |
| `ui/tabs/tabs-trigger.svelte:17` | raw segment shadow, `dark:bg-white/15` |
| `ui/toggle-group/toggle-group-item.svelte:26` | raw segment shadow (duplicates tabs), `dark:bg-white/15` |
| `ui/toggle-group/toggle-group.svelte:71` | raw push shadow (no dark variant), `dark:bg-white/10` |
| `ui/accordion/accordion.svelte:17` | `bg-black/[.025]`, `dark:bg-white/[.03]`, `rounded-[10px]` |
| `ui/popover/popover-content.svelte:27,36` | raw rgba popover and arrow shadows (light and dark), `rounded-[10px]` |
| `ui/drawer/drawer-content.svelte:26` | sheet shadow string written twice, `w-[36px]` handle |
| `ui/drawer/drawer-overlay.svelte:16`, `ui/sheet/sheet-overlay.svelte:16`, `ui/dialog/dialog-overlay.svelte` | `bg-black/30` scrim |
| `components/shell/SourceList.svelte:40,71,83,96,164` | `text-[13px]`, `text-[11px]` (no caption tokens) |
| `components/shell/Toolbar.svelte:31,42,44` | `h-[52px]`, `text-[15px]`, `text-[11px]` |

The push-button shadow string appears 4 times and the segment shadow twice. They should become `--shadow-push`,
`--shadow-push-accent`, `--shadow-segment`, `--shadow-field-inset`, `--shadow-thumb`, `--shadow-help-tag`,
`--shadow-popover`, `--shadow-sheet`, `--shadow-window` and `--shadow-hairline`, each with a `.dark` value, and be
registered in `@theme` so `shadow-push` works.
