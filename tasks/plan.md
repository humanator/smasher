# Implementation Plan: `shell-theme`

Spec: [SPEC-shell-theme.md](../SPEC-shell-theme.md), part of [SPEC.md](../SPEC.md).
The task list is in [todo.md](todo.md).

## Overview

This module gives the SPA the redesign's frame before any screen is rebuilt. It delivers:

- retuned light and dark tokens
- macOS-styled shadcn-svelte primitives
- one shared step vocabulary
- a source-list sidebar and unified toolbar
- the real macOS title bar in the desktop app
- a `pending_questions` API field that drives "Needs you"

Existing pages render inside the new shell. Only their header wiring changes.

## Architecture Decisions

- **The API field comes first.** `pending_questions` is the only backend change, and the
  library store and E2E assertions depend on it. It is a single read of
  `interviewer.list().len()` in `RunRecord::to_summary`, with `#[serde(default)]`.
- **Tokens as hex/rgba, with contrast checked by a test.** A small `lib/contrast.ts` (WCAG
  relative luminance, alpha composited over the surface) is used by both the token test and
  the `stepKinds` test. This adds no dependency.
- **Dark mode via `mode-watcher` in system mode.** It is already installed and already used
  by `ui/sonner`. The `.dark` class strategy doesn't change.
- **Primitives are restyled in place.** Only the variant and size strings in the owned
  `ui/*` files change. Props stay compatible; Badge gains an optional `dot`. A
  `(pointer: coarse)` rule in `app.css` adds 44px hit areas.
- **The sidebar is built on `ui/sidebar`.** That primitive already gives collapse, the mobile
  sheet (`is-mobile` hook) and keyboard support. `SourceList.svelte` takes plain props (counts,
  workflows, states), so it can be tested without the network. `AppShell` connects it to
  the library store.
- **The page-header API stays.** `PageHeaderState` gains `subtitle` and `back`. `Toolbar`
  replaces `PageHeader` in the same task that deletes it, so no caller is ever broken.
- **No-LLM gate fixture.** `frontend/e2e/fixtures/gate_only.dot` (start → hexagon gate → exit)
  drives the needs-you E2E. The Rust test inlines the same graph. No test spends tokens.

## Dependency Graph

```
T1 pending_questions API ──────────────┐
T2 contrast + tokens ──┬─ T3 stepKinds  │
                       ├─ T4–T7 primitives
                       └───────────────┴─ T8 library store ─ T10 SourceList ─ T11 AppShell wiring ─ T13 E2E
                                          T9 Toolbar + page-header API ──────┘        │
                                                                    T12 native title bar ┘
```

T1, T2 and T9 have no dependencies on each other. T4–T7 can run in parallel once T2 lands.

## Task List

### Phase 1: Foundation
- [ ] T1: `pending_questions` on `RunSummary` (API + TS type)
- [ ] T2: Contrast helper, retuned tokens (light + dark), system font, mode-watcher
- [ ] T3: `stepKinds` vocabulary

### Checkpoint A: Foundation
- [ ] All Vitest + `cargo test -p smasher-web` green, `check`/`lint`/clippy clean
- [ ] Every page renders in the new colours in light and dark (manual look)

### Phase 2: Primitives
- [ ] T4: Button and Badge (`dot`)
- [ ] T5: Input, Textarea, NativeSelect, Checkbox, Switch
- [ ] T6: Tabs, ToggleGroup, Accordion
- [ ] T7: Tooltip, Popover, Drawer, coarse-pointer hit areas

### Checkpoint B: Primitives
- [ ] Existing component + E2E tests green with no assertion changes
- [ ] Side-by-side against each component board at 1:1, light + dark
- [ ] Review with Jobsworth

### Phase 3: Shell
- [ ] T8: Library store
- [ ] T9: Toolbar and page-header API (replaces PageHeader)
- [ ] T10: SourceList component
- [ ] T11: AppShell wiring and phone-width sheet
- [ ] T12: Native overlay title bar
- [ ] T13: App-shell E2E with the no-LLM gate fixture

### Checkpoint C: Module complete
- [ ] All eight Success Criteria in SPEC-shell-theme.md met
- [ ] Full non-LLM suite green, zero warnings
- [ ] `make desktop-dev` manual check
- [ ] Review with Jobsworth before starting the next module spec

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Restyled primitives break tests that assert class names | Med | T4–T7 run the full component suite. Fix tests that assert styling, not behaviour, and list each one in the commit. |
| Window drag needs a Tauri permission for the remote origin | Med | T12 tries without it first. If dragging fails, add `core:window:allow-start-dragging` to `served-origin` only (allowed by R7). |
| `ui/sidebar` defaults (width, colours, mobile breakpoint) fight the design | Med | Override with its CSS variables (`--sidebar-width`) and tokens, not by forking. If that isn't enough, stop and ask. |
| Derived dark accent fails AA with white text | Low | The token test in T2 catches it. Lighten or darken the accent within the hue until the pair passes. |
| Polling every 5s adds load in long sessions | Low | Pause when the document is hidden. Both endpoints read from memory. |
| Removing breadcrumbs strands a navigation path | Low | T9 sets `back` on every page that had a parent crumb. AppLayout tests assert it. |

## Open Questions

None. The judgement calls are recorded in the spec.
