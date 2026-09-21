# Design Kit

<!-- ABOUTME: Reference for the design-kit component library — class names, tokens, -->
<!-- ABOUTME: and usage rules an agent needs to compose a screen from these parts. -->

A small, versioned library of real (not static-mock) HTML/CSS/JS components —
button, input, drawer, modal, list-row, table — for composing Discover-phase pipeline
candidates cheaply, per `../docs/design-factory/SPEC-component-kit.md`.

Open [`catalog.html`](./catalog.html) in a browser to see every component and state
live. Copy markup from [`components/`](./components) rather than writing new HTML for
these five patterns from scratch.

## Usage rules

1. **Compose from these classes and snippets.** Don't write a new button, input,
   drawer, modal, list-row, or table from scratch — copy the relevant file in
   `components/` and adjust content/attributes.
2. **Never write a raw color, radius, spacing, or shadow value in your own CSS.**
   Reference a token (below) instead. If the token you need doesn't exist yet, add it
   to `tokens.css` rather than hardcoding a value — that keeps `test/lint-tokens.mjs`
   passing and keeps the kit's palette consistent.
3. **Don't add a seventh component** without checking `SPEC-component-kit.md` first —
   the kit intentionally ships six components; growing it is a deliberate, spec-level
   decision, not a per-screen one.
4. **No framework, no build step.** Everything here is plain HTML/CSS/vanilla JS. Load
   `tokens.css`, `components.css`, and `components.js` — nothing else is required.
5. **New components default to a GOV.UK Design System source.** When a new component
   is approved, hand-copy the equivalent
   [GOV.UK Design System](https://design-system.service.gov.uk/components/) pattern's
   HTML structure, then reskin it with this kit's tokens and flat class-naming
   convention (`.table`, not `govuk-table__header`) — markup/structure reference only,
   never the `govuk-frontend` package. See `SPEC-component-kit.md`'s `table` addendum
   for the worked example.

## Components

### Button (`components/button.html`)

| Class | Use |
|---|---|
| `.btn` | Base button — default appearance |
| `.btn-primary` | Add alongside `.btn` for the primary/accent action |
| `.btn-small` | Add alongside `.btn` (or `.btn-primary`) for a compact size |

Disabled state uses the native `disabled` attribute — no extra class needed.

```html
<button class="btn btn-primary" type="button">Save</button>
```

### Input (`components/input.html`)

| Class | Use |
|---|---|
| `.field` | Wraps a `<label>` + `.input` pair, stacked with a small gap |
| `.input` | The text input itself — includes a visible `--focus-ring` on focus |

```html
<div class="field">
  <label for="name">Name</label>
  <input class="input" type="text" id="name" />
</div>
```

### List-row (`components/list-row.html`)

| Class / attribute | Use |
|---|---|
| `.list` | Wraps rows in a bordered, rounded container (use a `<ul>`) |
| `.list-row` | A single row (use a `<li>`) |
| `.list-row-action` | Add to a row that's clickable/keyboard-activatable |
| `role="button"` + `tabindex="0"` + `aria-pressed="false"` | Required on an actionable row so `components.js` wires up click + Enter/Space activation and toggles `aria-pressed` / `.is-active` |

A plain, non-interactive row is just `<li class="list-row">`. An actionable row needs
all three attributes above, plus `.list-row-action`, for keyboard support to work.

### Drawer (`components/drawer.html`) and Modal (`components/modal.html`)

Both are built on the same generic dialog behavior in `components.js` — an overlay +
a focusable panel + a trigger, differing only in visual placement (drawer slides in
from the right; modal is centered). Wire a new instance with matching `id` values
across three pieces:

| Piece | Drawer attribute | Modal attribute |
|---|---|---|
| Trigger button | `data-drawer-trigger="<id>"` | `data-modal-trigger="<id>"` |
| Backdrop | `data-drawer-overlay="<id>"` | `data-modal-overlay="<id>"` |
| Panel | `id="<id>"` + `role="dialog"` + `aria-modal="true"` + `aria-label="…"` + `hidden` | same |
| Close button(s) | `data-drawer-close="<id>"` | `data-modal-close="<id>"` |

Behavior you get for free, with no extra JS:
- Opens on trigger click; initial focus moves to the panel's first focusable element.
- **Escape** closes it.
- Clicking the **backdrop** closes it.
- **Tab / Shift+Tab** are trapped within the panel's focusable elements (cycles, never
  escapes to the page behind it).
- Closing (any method) returns focus to the trigger that opened it.

Any element with `[data-drawer-close]`/`[data-modal-close]` closes the dialog when
clicked — a modal's primary action button (e.g. "Confirm") can reuse this instead of
custom close-handling JS, as shown in `components/modal.html`.

Start every drawer/modal `hidden`; `components.js` toggles the `hidden` attribute (not
a CSS class) to show/hide both the panel and its overlay.

### Table (`components/table.html`)

| Class | Use |
|---|---|
| `.table` | Base `<table>` — border-collapse, row hover, header styling |
| `.table-caption` | Optional `<caption>` labeling the table |
| `.table-numeric` | Add to a `<th>`/`<td>` to right-align numeric column content |

Header cells use `<th scope="col">`; body cells are plain `<td>` (no `scope="row"`
pattern — add it by hand if a specific table needs row-label semantics).

```html
<table class="table">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col" class="table-numeric">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>January</td>
      <td class="table-numeric">£85</td>
    </tr>
  </tbody>
</table>
```

## Tokens

### Added by this kit (`tokens.css`)

| Token | Value | Purpose |
|---|---|---|
| `--space-1` … `--space-6` | `0.25rem` … `1.5rem` | Spacing scale for padding/margin/gap — `style.css` has no spacing tokens, only color/radius/shadow/font |
| `--focus-ring` | `0 0 0 3px var(--blue-dim)` | Shared focus-visible ring for inputs and dialog triggers/panels |
| `--on-accent` | `#fff` | Text color on a colored background (e.g. `.btn-primary` text) — `style.css` hardcodes raw `#fff` instead of tokenizing it |
| `--overlay-bg` | `rgba(17, 24, 39, 0.4)` | Drawer/modal backdrop color |
| `--z-overlay` / `--z-drawer` / `--z-modal` | `200` / `210` / `220` | Stacking order for backdrop, drawer panel, modal panel |

### Reused from `crates/smasher-web/static/style.css`

`catalog.html` links this stylesheet directly rather than duplicating its values —
`components.css` should do the same (reference the token, don't copy the value).

| Category | Tokens |
|---|---|
| Backgrounds | `--bg-base`, `--bg-card`, `--bg-surface`, `--bg-input`, `--bg-hover`, `--bg-elevated` |
| Borders | `--border-subtle`, `--border-default`, `--border-strong` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-bright` |
| Accent colors | `--blue`, `--blue-dim`, `--blue-hover`, `--blue-light` (and `--green`/`--red`/`--amber`/`--purple` equivalents) |
| Type | `--font-display`, `--font-body`, `--font-mono` |
| Shape | `--radius-sm`, `--radius-md`, `--radius-lg` |
| Elevation | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Motion | `--transition` |

## Testing

```bash
# Token-usage lint — fails on raw hex/rgb colors or un-tokenized spacing in components.css
node test/lint-tokens.mjs

# Interaction tests — button, input, list-row, drawer, modal
npx playwright test
```

Both must pass, and `catalog.html` should be visually reviewed in a browser, before
adding or changing a component. See `../docs/design-factory/SPEC-component-kit.md`
for the full spec and `../tasks/todo.md` for the task-by-task build record.
