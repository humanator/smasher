# Implementation Plan: `component-kit` (Semi-Dark Design Factory)

## Overview

`component-kit` is the first of eight modules in the Semi-Dark Design Factory
capability map (`capability-map.md`), and the only one with an
approved spec so far (`SPEC-component-kit.md`). It's a small,
versioned library of real (not static-mock) HTML/CSS/JS components — button, input,
drawer, modal, list-row — plus the design tokens backing them, living at
`design-kit/` (sibling to `crates/`). Every later module in the capability map
(`render-capture`, `system-lint`, `gallery-view`, `gallery-gate`, `artifact-store`,
`task-critic-synthesis`, `decision-history`) depends on this one existing first.

This plan breaks `SPEC-component-kit.md` into 8 small, vertically-sliced,
independently verifiable tasks across 4 phases. Scope is `component-kit` only.

## Architecture Decisions

- **Vertical slicing by component, not by layer.** Each component (button, input,
  list-row, drawer, modal) is its own task covering markup + CSS + catalog demo + lint
  conformance + test coverage together — not "all markup, then all CSS, then all
  tests." This matches the spec's own "success looks like: open catalog.html and see
  every component and its states rendered correctly" framing — partial layers aren't
  independently demoable or verifiable, but a finished component is.
- **Static components before interactive ones.** Button, input, and list-row need no
  shared JS and carry the least risk — building them first establishes the token/lint
  conventions cheaply. Drawer and modal are then built in sequence so modal can reuse
  the focus-trap/Escape/backdrop-click functions drawer introduces in `components.js`,
  rather than duplicating that logic (Definition of Done: "no duplicated business
  logic").
- **No standalone "shared JS infrastructure" task.** Focus-trap/Escape-to-close
  utilities are real product behavior, not preparatory scaffolding — they only make
  sense verified against a real component. They ship as part of Task 5 (Drawer) and
  are reused, not rebuilt, in Task 6 (Modal).
- **Playwright and package.json are new, self-contained additions under `design-kit/`**,
  not at the repo root — consistent with the spec's assumption that the kit itself has
  no build step and Node is only a dev-time test dependency.
- **Deliverables tracked in the `smasher` git repo**, not the parent `semi-dark design`
  folder (which has no git repo) — per `SPEC-component-kit.md` assumption 6.

## Task List

### Phase 1: Foundation
- [x] Task 1: Kit scaffold, tokens, lint script, catalog shell

### Checkpoint: Foundation
- [x] `node design-kit/test/lint-tokens.mjs` runs and exits 0
- [x] `npx playwright test design-kit/test/` runs and exits 0 (zero tests)
- [x] `catalog.html` opens in the Browser pane and renders the shell page

### Phase 2: Static components
- [x] Task 2: Button
- [x] Task 3: Input (text)
- [x] Task 4: List-row

### Checkpoint: Static components (Checkpoint A)
- [x] Lint script green with zero violations
- [x] Playwright suite green (button/input/list-row assertions)
- [x] `catalog.html` manually opened in the Browser pane and visually checked against
      the token palette for all three components
- [x] Human review before starting interactive components

### Phase 3: Interactive components
- [x] Task 5: Drawer
- [x] Task 6: Modal

### Checkpoint: Interactive components (Checkpoint B)
- [x] Full Playwright suite green (drawer + modal + all earlier assertions)
- [x] Lint script still zero violations
- [x] Manual keyboard-only pass in the Browser pane: Tab/Shift+Tab cycling, Escape,
      backdrop click, for both drawer and modal

### Phase 4: Documentation and final QA
- [x] Task 7: README.md
- [x] Task 8: Final verification pass

### Checkpoint: Complete (Checkpoint C)
- [x] Every bullet in `SPEC-component-kit.md`'s "Success Criteria" section verified
- [x] Ready to start `render-capture`'s own spec/plan next (per capability map build
      order)

See `todo-component-kit.md` for the full per-task breakdown (acceptance criteria, verification
steps, dependencies, files touched, size estimate).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| `lint-tokens.mjs` false-positives on legitimate raw values (e.g. `1px` borders, `0`) | Medium — blocks every later task if the lint gate is unreliable | Explicit allowed-exception list in the script, verified in Task 1's acceptance criteria before any component depends on it |
| Focus-trap/Escape logic duplicated between drawer and modal | Medium — violates Definition of Done, doubles the surface for a11y bugs | Task 6 explicitly reuses Task 5's `components.js` functions; Task 6 acceptance criteria require no duplicated trap/escape logic |
| Playwright unused elsewhere in this repo — first-run setup friction (browser install, config) | Low — one-time cost | Task 1 gets `npx playwright test` to a green "0 tests" baseline before any component task depends on it |
| "Real, lightweight interactive prototypes" ambition (Vision.md) could tempt scope creep into extra components | Low | Spec boundaries are explicit: only 5 components ship in this slice; adding a 6th requires asking first |

## Open Questions
(Carried forward from `SPEC-component-kit.md`, not blocking this task breakdown)
- Whether `render-capture` will serve kit-composed candidates via a tiny Rust/axum dev
  server or reuse `python3 -m http.server`-style tooling — deferred to that module's
  own spec.
- Whether the kit eventually needs `select`/`checkbox`/`tabs` — left open until a
  pipeline run actually demands one.
