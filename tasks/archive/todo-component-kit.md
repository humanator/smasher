# Task List: `component-kit`

Full context and rationale in `plan-component-kit.md`. Spec: `SPEC-component-kit.md`.

---

## Task 1: Kit scaffold, tokens, lint script, catalog shell

**Description:** Create the `design-kit/` directory structure and the foundation every
later task depends on: the token stylesheet, an empty component stylesheet/JS file,
a catalog shell page, the token-lint script, and a working Playwright setup — all
before any real component exists.

**Acceptance criteria:**
- [x] `design-kit/tokens.css` extends (references, doesn't copy) the palette in
      `crates/smasher-web/static/style.css`, plus adds only the new tokens the kit
      needs (drawer/modal z-index, overlay color) — no existing smasher-web token is
      modified
- [x] `design-kit/catalog.html` loads `tokens.css`/`components.css`/`components.js`
      and renders a page title, with the two-line `ABOUTME:` header comment
- [x] `design-kit/test/lint-tokens.mjs` parses `components.css` and fails on any raw
      hex color, `rgb(`, or bare px/rem value not in an explicit exception list (e.g.
      `1px` borders); passes trivially on an empty stylesheet
- [x] `design-kit/package.json` + Playwright config exist, self-contained under
      `design-kit/` (no repo-root Node dependency)
- [x] `design-kit/test/interactions.spec.ts` exists as an empty/scaffold spec file

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` exits 0
- [x] `npx playwright test design-kit/test/` exits 0 (zero tests collected)
- [x] Manual: open `design-kit/catalog.html` in the Browser pane, confirm the shell
      page renders with no console errors

**Dependencies:** None

**Files likely touched:**
- `design-kit/tokens.css`
- `design-kit/components.css`
- `design-kit/components.js`
- `design-kit/catalog.html`
- `design-kit/package.json`
- `design-kit/playwright.config.ts`
- `design-kit/test/lint-tokens.mjs`
- `design-kit/test/interactions.spec.ts`

**Estimated scope:** Medium (5-8 files, but each is small/boilerplate)

---

## Task 2: Button component

**Description:** Add the button component — the simplest slice — establishing the
markup/CSS/catalog pattern the remaining components will follow.

**Acceptance criteria:**
- [x] `design-kit/components/button.html` provides a copy-referenceable snippet
- [x] `.btn`, `.btn-primary`, `.btn-small` added to `components.css`, entirely
      token-backed (no raw values)
- [x] `catalog.html` has a Button section showing default, primary, and small variants
- [x] Flat, BEM-free class naming matching `style.css` conventions

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` exits 0 with the new rules present
- [x] Manual: open `catalog.html` in the Browser pane, visually confirm button states
      against the token palette

**Dependencies:** Task 1

**Files likely touched:**
- `design-kit/components/button.html`
- `design-kit/components.css`
- `design-kit/catalog.html`

**Estimated scope:** Small (1-2 files)

---

## Task 3: Input (text) component

**Description:** Add the text input component with a visible, token-backed focus
state, plus a Playwright assertion proving the focus state is real (not just visual
guesswork).

**Acceptance criteria:**
- [x] `design-kit/components/input.html` provides the snippet
- [x] `.input` class added to `components.css`, token-backed, with a distinct
      `:focus` style
- [x] `catalog.html` has an Input section

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` exits 0
- [x] `npx playwright test design-kit/test/` includes and passes an assertion that
      the input shows a visible focus style on keyboard focus
- [x] Manual: open `catalog.html` in the Browser pane, tab to the input, confirm focus
      is visible

**Dependencies:** Task 1

**Files likely touched:**
- `design-kit/components/input.html`
- `design-kit/components.css`
- `design-kit/catalog.html`
- `design-kit/test/interactions.spec.ts`

**Estimated scope:** Small (1-2 files, plus one test)

---

## Task 4: List-row component

**Description:** Add the list-row component with keyboard focusability and
Enter/Space activation when it carries an action, plus a Playwright assertion.

**Acceptance criteria:**
- [x] `design-kit/components/list-row.html` provides the snippet, including an
      actionable variant (e.g. `tabindex="0"`, role as appropriate)
- [x] `.list-row` class added to `components.css`, token-backed
- [x] `catalog.html` has a List-row section with both a plain and an actionable row

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` exits 0
- [x] `npx playwright test design-kit/test/` includes and passes an assertion that an
      actionable list-row is keyboard-focusable and activates on Enter/Space
- [x] Manual: open `catalog.html` in the Browser pane, tab to the row, activate with
      keyboard, confirm behavior

**Dependencies:** Task 1

**Files likely touched:**
- `design-kit/components/list-row.html`
- `design-kit/components.css`
- `design-kit/catalog.html`
- `design-kit/test/interactions.spec.ts`

**Estimated scope:** Small (1-2 files, plus one test)

---

## Checkpoint: Static components (Checkpoint A)

- [x] `node design-kit/test/lint-tokens.mjs` exits 0 with zero violations across all
      three components
- [x] `npx playwright test design-kit/test/` exits 0, covering input focus and
      list-row keyboard activation
- [x] Manual: `catalog.html` opened in the Browser pane, every static component and
      its states visually checked against the token palette
- [x] **Human review before starting Phase 3 (interactive components)**

---

## Task 5: Drawer component

**Description:** Add the drawer component along with the shared interaction JS it
introduces: open/close, focus trap while open, Escape-to-close, backdrop-click-to-close,
and focus-return-to-trigger on close. This is the first component with real behavioral
complexity and the one Modal (Task 6) will build on.

**Acceptance criteria:**
- [x] `design-kit/components/drawer.html` provides the snippet (trigger + drawer +
      overlay)
- [x] `.drawer`, `.drawer-overlay` added to `components.css`, token-backed (using any
      new z-index/overlay tokens added in Task 1)
- [x] `components.js` implements: open on trigger click, close on Escape, close on
      backdrop click, focus trap while open (Tab/Shift+Tab cycle within the drawer),
      focus returns to the trigger element on close — written as reusable functions,
      not drawer-specific inline logic, so Task 6 can reuse them
- [x] `catalog.html` has a Drawer section with a working trigger

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` exits 0
- [x] `npx playwright test design-kit/test/` includes and passes: opens on trigger
      click, closes on Escape, closes on backdrop click, traps focus while open,
      returns focus to trigger on close
- [x] Manual: open `catalog.html` in the Browser pane, operate the drawer keyboard-only
      (Tab cycling, Escape) and via mouse (backdrop click)

**Dependencies:** Task 1 (does not depend on Tasks 2-4, but follows them per plan
ordering — static components first)

**Files likely touched:**
- `design-kit/components/drawer.html`
- `design-kit/components.css`
- `design-kit/components.js`
- `design-kit/catalog.html`
- `design-kit/test/interactions.spec.ts`

**Estimated scope:** Medium (3-5 files, includes the most complex JS in this module)

---

## Task 6: Modal component

**Description:** Add the modal component, reusing (not duplicating) the focus-trap,
Escape-to-close, and backdrop-click functions Task 5 introduced.

**Acceptance criteria:**
- [x] `design-kit/components/modal.html` provides the snippet
- [x] `.modal`, `.modal-overlay` added to `components.css`, token-backed
- [x] `components.js` modal open/close calls the same focus-trap/Escape/backdrop-click
      functions used by drawer — no copy-pasted duplicate logic
- [x] `catalog.html` has a Modal section with a working trigger

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` exits 0
- [x] `npx playwright test design-kit/test/` includes and passes the same behavior
      set as drawer (open, Escape, backdrop click, focus trap, focus return)
- [x] Code review check: confirm no duplicated trap/escape/backdrop-click logic exists
      between drawer and modal in `components.js`
- [x] Manual: open `catalog.html` in the Browser pane, operate the modal keyboard-only
      and via mouse

**Dependencies:** Task 5

**Files likely touched:**
- `design-kit/components/modal.html`
- `design-kit/components.css`
- `design-kit/components.js`
- `design-kit/catalog.html`
- `design-kit/test/interactions.spec.ts`

**Estimated scope:** Small-Medium (3-4 files, JS is mostly reuse)

---

## Checkpoint: Interactive components (Checkpoint B)

- [x] Full Playwright suite green: drawer + modal + input focus + list-row activation
- [x] Lint script still exits 0 with zero violations
- [x] Manual keyboard-only pass in the Browser pane covering Tab/Shift+Tab cycling,
      Escape, and backdrop click for both drawer and modal
- [x] **Human review before starting Phase 4**

---

## Task 7: README.md

**Description:** Document the kit's class names, token reference, and usage rules —
this is the contract `render-capture` (the next module) will depend on when its
implementer agent composes candidate screens from kit classes.

**Acceptance criteria:**
- [x] Every component's class names are documented with a usage example
- [x] Every token in `tokens.css` (and the subset of `style.css` tokens the kit relies
      on) is listed with its purpose
- [x] Usage rules for an agent are explicit: compose from kit classes, don't reinvent
      components, don't introduce raw values

**Verification:**
- [x] Manual review: can a reader unfamiliar with the kit compose a simple screen
      (e.g. a list with a "view details" drawer) using only the README as reference?

**Dependencies:** Tasks 2-6 (documents components that must already exist)

**Files likely touched:**
- `design-kit/README.md`

**Estimated scope:** Small (1 file)

---

## Task 8: Final verification pass

**Description:** Confirm the whole `component-kit` module meets every success
criterion in `SPEC-component-kit.md` from a clean run, not accumulated task-by-task
assumptions.

**Acceptance criteria:**
- [x] All 5 components exist with the states called out in the spec's Testing Strategy
- [x] `design-kit/README.md` documents every class name and token an agent needs

**Verification:**
- [x] `node design-kit/test/lint-tokens.mjs` passes with zero raw-value violations
- [x] `npx playwright test design-kit/test/` passes in full
- [x] `catalog.html` opened fresh in the Browser pane, every component and state
      visually confirmed against the token palette in one end-to-end pass
- [x] Line-by-line check against `SPEC-component-kit.md`'s "Success Criteria" section

**Dependencies:** Tasks 1-7

**Files likely touched:** None (verification only; fixes go back into the relevant
component's files if this pass finds a gap)

**Estimated scope:** XS (verification only)

---

## Checkpoint: Complete (Checkpoint C)

- [x] Every bullet in `SPEC-component-kit.md`'s Success Criteria section is checked
      off with evidence (test output, browser confirmation), not assumed
- [x] `component-kit` capability map entry can be marked done
- [x] Ready to write `SPEC-render-capture.md` and its own task breakdown next
