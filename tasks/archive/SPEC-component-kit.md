# Spec: `component-kit` — Shared Design Kit for the Semi-Dark Design Factory

Module id: `component-kit` (see `capability-map.md`). First build slice — no dependencies.

## Objective

Provide a small, versioned library of real (not static-mock) HTML/CSS/JS components —
button, input, drawer, modal, list-row — plus the design tokens backing them, so that
future Discover-phase pipeline candidates can be composed cheaply from existing parts
instead of an agent reinventing basic UI on every run.

Who uses it:
- **The coding agent** (later, in `render-capture`), which composes candidate screens by
  referencing kit markup/classes rather than writing bespoke UI from scratch.
- **A human** previewing the kit itself via a catalog/style-guide page, to sanity-check
  what "the kit" actually offers before pipelines start depending on it.
- **`system-lint`** (later module), which will check that generated markup uses kit
  classes and token variables rather than ad hoc styling — this spec's token-lint script
  is the first, narrow version of that check.

Success looks like: open `catalog.html` in a browser, see every component and its
states rendered correctly against the token palette, with keyboard interaction working
on drawer/modal.

## Assumptions

1. The kit is plain HTML/CSS/JS — no build step, no bundler, no framework — consistent
   with smasher-web's existing HTMX/askama approach (server-rendered partials, not a
   client framework).
2. The kit lives **inside** the `smasher` repo (not the parent `semi-dark design`
   folder), as a new top-level directory `design-kit/`, sibling to `crates/`. It is not
   a Cargo crate — nothing here needs Rust yet.
3. Visual style extends smasher-web's existing "Daylight Ops" light theme (tokens in
   `crates/smasher-web/static/style.css`) rather than inventing a new palette — reusing
   `--blue`, `--radius-sm`, `--font-display`, etc. where they fit, and only adding new
   tokens the existing sheet doesn't cover (e.g. drawer/modal-specific z-index, overlay
   colors).
4. "Real, lightweight interactive prototypes" (per Vision.md) means the JS is small
   vanilla JS with no dependencies — no React/Vue/htmx requirement at the kit level,
   since candidates built from it should stay cheap and self-contained. (`htmx` may
   still be used later when a candidate is embedded in the actual Smasher dashboard,
   but the kit itself doesn't require it.)
5. Five components ship in this slice: button, input (text), drawer, modal, list-row.
   Anything else (select, checkbox, tabs, etc.) is out of scope until a future pipeline
   demands it, per the "start small, grow as demanded" build sequence.
6. This repo's `docs/design-factory/` is the right home for design-factory specs
   (tracked by the existing smasher git history), rather than starting a second,
   separate git repo in the parent `semi-dark design` folder just for planning docs.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- HTML5, CSS3 (custom properties for tokens), vanilla ES2020+ JS (no transpilation).
- No new Rust/Cargo dependency for this slice.
- Node.js (already likely present) used **only** for the dev-time test scripts below —
  not shipped as part of the kit itself.
- Playwright for browser-driven interaction tests (drawer/modal keyboard behavior).

## Commands

```bash
# Preview the kit locally — serve from the repo root, not `--directory design-kit`.
# catalog.html links ../crates/smasher-web/static/style.css, which escapes design-kit/;
# serving design-kit/ as the server root 404s that stylesheet and the catalog renders
# unstyled. Confirmed live 2026-09-17 — this is the corrected command.
python3 -m http.server 8080
# then open http://127.0.0.1:8080/design-kit/catalog.html

# Token-usage lint (fails if a component CSS rule uses a raw color/radius
# instead of a var(--token))
node design-kit/test/lint-tokens.mjs

# Interaction tests (drawer/modal open, close, Escape, focus trap, backdrop click)
npx playwright test design-kit/test/
```

## Project Structure

```
design-kit/
  tokens.css          # Design tokens as CSS custom properties (extends smasher-web's palette)
  components.css       # Component styles: .btn, .input, .drawer, .modal, .list-row
  components.js         # Vanilla JS: drawer/modal open-close, focus trap, Escape-to-close
  catalog.html           # Style-guide/demo page — every component + state, for human QA
  components/            # One HTML snippet per component, for an agent to copy/reference
    button.html
    input.html
    drawer.html
    modal.html
    list-row.html
    table.html
  README.md              # Class names, token reference, usage rules for the agent
  test/
    lint-tokens.mjs       # Static check: no raw hex/px values in components.css
    interactions.spec.ts  # Playwright: keyboard + click behavior on catalog.html
docs/design-factory/
  capability-map.md       # (already written)
  SPEC-component-kit.md   # this file
```

## Code Style

One example, matching the class-naming and token conventions already established in
`crates/smasher-web/static/style.css`:

```css
/* design-kit/components.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all var(--transition);
}

.btn-primary {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}
```

```html
<!-- design-kit/components/button.html -->
<button class="btn btn-primary" type="button">Primary action</button>
```

Conventions:
- Every color, radius, spacing-scale, and shadow value in `components.css` must be a
  `var(--token)` reference — no raw hex codes or magic px values. `lint-tokens.mjs`
  enforces this.
- Component classes are flat and BEM-free (`.btn`, `.btn-primary`, `.btn-small`), matching
  existing style.css conventions — not `.Button__primary--small`.
- Every file starts with two `// ABOUTME:` (or `<!-- ABOUTME: -->` for HTML) comment
  lines, per this repo's `CLAUDE.md` file convention.

## Testing Strategy

- **Static (token-lint):** `lint-tokens.mjs` parses `components.css` and fails the run
  if any declaration value looks like a raw color (`#`, `rgb(`) or a bare px/rem number
  outside an allowed exception list (e.g. `1px` borders), where a token should be used
  instead. This is the cheapest possible guard and doubles as the seed of the future
  `system-lint` module.
- **Interaction (Playwright):** `interactions.spec.ts` loads `catalog.html` and asserts:
  - Drawer opens on trigger click, closes on Escape and on backdrop click, traps focus
    while open, returns focus to the trigger on close.
  - Modal has the same behavior.
  - List-row is keyboard-focusable and activates on Enter/Space if it has an action.
  - Input shows a visible focus state.
- **Manual visual QA:** open `catalog.html` in an actual browser (this session will do
  this via the Browser pane before calling the slice done) and eyeball every component
  against the token palette — no automated test substitutes for "does this look right."
- No unit tests beyond the lint script — there's no application logic here, only markup,
  styles, and a handful of DOM-interaction behaviors, which Playwright covers as
  integration/e2e.

## Boundaries

- **Always do:** keep every visual value token-backed; run `lint-tokens.mjs` and
  Playwright before considering a component done; open `catalog.html` in the browser to
  visually confirm.
- **Ask first:** adding any component beyond the five listed here; adding a JS
  dependency (even a small one); changing `crates/smasher-web/static/style.css`'s
  existing tokens (this slice should only *add* tokens the kit needs, not modify
  existing ones smasher-web already relies on).
- **Never do:** pull in a frontend framework (React/Vue/etc.); introduce a build step
  (bundler/transpiler) for the kit itself; touch `crates/` — this slice is additive and
  doesn't require changing any existing Rust code.

## Success Criteria

- `design-kit/` exists with all five components, each with at least the states called
  out in Testing Strategy.
- `node design-kit/test/lint-tokens.mjs` passes with zero raw-value violations.
- `npx playwright test design-kit/test/` passes.
- `catalog.html`, opened in a real browser, visually renders every component correctly
  against the token palette (verified live in this session, not assumed).
- `design-kit/README.md` documents every class name and token an agent would need to
  compose a new screen from the kit.

## Open Questions

- Whether `render-capture` (next module) will serve kit-composed candidates via a tiny
  Rust/axum dev server or reuse `python3 -m http.server`-style tooling — deferred to
  that module's own spec.
- Whether the kit eventually needs a `select`/`checkbox`/`tabs` component is left open
  until a pipeline run actually asks for one, per the "grow as demanded" principle in
  `smasher-design-factory.md`.

## Addendum: sixth component — `table` (2026-09-21)

The dashboard needed a table before the gallery/workflow work did — `run_list.html`
had already grown its own ad hoc `.run-table` CSS directly in
`crates/smasher-web/static/style.css`, which is exactly the duplicated-styling problem
this kit exists to prevent. Per the "ask first" boundary above, this addition was
confirmed with the user before building.

**New component sourcing policy (standing rule, not one-off):** rather than inventing
new component markup from scratch, a new kit component now defaults to hand-copying
the equivalent [GOV.UK Design System](https://design-system.service.gov.uk/components/)
pattern's HTML structure, then reskinning it with this kit's own tokens. This is a
markup/structure reference only — **no `govuk-frontend` package, no Sass, no build
step**. Assumptions 1 and 4 (no framework, no build step, no dependency) still apply
unchanged; only the source of a new component's markup structure changes. GOV.UK's
BEM class names (`govuk-table__header`, etc.) are *not* copied verbatim — every
component still uses this kit's existing flat, BEM-free naming convention (`.table`,
`.table-numeric`, matching `.btn-primary`, `.list-row-action`).

`table` was built this way:
- Structure (`<table>`/`<caption>`/`<thead>`/`<tbody>`/`scope="col"` headers) follows
  GOV.UK's table component markup.
- Classes are the kit's own: `.table`, `.table-caption`, `.table-numeric` (a single
  right-align modifier usable on both `<th>` and `<td>`, replacing GOV.UK's two
  separate `--numeric` header/cell classes).
- Visual values (padding, borders, hover) are token-backed per the existing
  `lint-tokens.mjs` rule, not GOV.UK's own spacing/color scale.
- `run_list.html` was migrated onto `.table`, and the old `.run-table` block was
  deleted from `style.css` — the Run ID column's link styling (mono font, blue) is
  kept as a page-scoped override on `#run-list-container` rather than promoted into
  the shared `.table` class, since it's specific to that one table's ID column.

This makes six components: button, input, drawer, modal, list-row, table. A seventh
still requires asking first per the existing Boundaries section, but when one is
added, default to the GOV.UK-sourcing process above unless a specific reason argues
for a different source pattern.
