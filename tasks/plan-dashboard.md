# Implementation Plan: `dashboard`

Spec: [SPEC-dashboard.md](../SPEC-dashboard.md), part of [SPEC.md](../SPEC.md).
The task list is in [todo-dashboard.md](todo-dashboard.md).

> These files sit beside `plan.md` / `todo.md` because shell-theme still has open manual checks
> there. Once shell-theme is signed off, archive its plan and todo, then rename these two to
> `plan.md` / `todo.md` so `/build` picks them up.

## Overview

This plan rebuilds `/` to match the Home artboard. It delivers:

- the needs-you banner
- the All workflows table with search
- the Recent runs table with filters
- the restyled Run sheet and Settings window
- one additive API field, `waiting_since`

Pure logic lands first in `lib/` with unit tests. Then each piece of UI is built as a vertical
slice that works on its own. The dialogs come last because nothing else depends on them.

## Architecture Decisions

- **One data source.** The banner, both tables and the sidebar all read `libraryStore`, which
  already polls `/api/workflows` and `/api/runs` every 5 s and pauses while the tab is hidden.
  `RunList` drops its own `setInterval`. The only extra request is
  `GET /api/runs/{id}/questions` for the run the banner features.
- **Workflow status comes from runs.** `workflowStatus(workflowId, runs, now)` in
  `runStatus.ts` applies the spec's R3 table. Nothing is added to `/api/workflows`.
- **`waiting_since` without touching `PendingQuestion`.** `to_summary` converts the oldest
  `Instant` with `SystemTime::now() - elapsed()` and formats it as RFC3339. This leaves the 16
  constructors alone.
- **Time is injected.** `timeFormat.ts` takes `now: Date` and an optional `timeZone`, so tests
  pin both. Components read a shared `now` that ticks every 30 s (a small `useNow` rune hook).
  There's no `Date.now()` scattered through the markup.
- **One status → badge mapping.** `statusBadge(status)` returns `{ label, variant, dot }`.
  `StatusBadge.svelte` renders it. workflow-detail and run reuse it later.
- **Filter state lives in the URL.** `parseRunFilter` and `runFilterHref` in a new
  `lib/runFilter.ts` map `?runs=` both ways. The page updates the URL with
  `history.replaceState`, so changing filters doesn't fill up the back stack.
- **`RunTable` keeps its props.** It's restyled to grid rows where the whole row is a link, but
  it still takes `runs`, so `WorkflowDetailPage` keeps working unchanged. A `now` prop is
  optional.
- **Tests move with the component.** `WorkflowCatalog.svelte` becomes `DashboardPage` +
  `WorkflowTable`. Each case in `WorkflowCatalog.test.ts` is ported before the old file is
  removed, and no assertion is dropped.
- **Settings is split by section.** `SettingsDialog` keeps loading and saving and becomes the
  window frame. `settings/DefaultsSection`, `ServicesSection` and `ClaudeCliSection` are its
  contents. Save order doesn't change.

## Dependency Graph

```
T1 waiting_since (Rust + TS) ─────────────┐
T2 timeFormat ──┬─────────────────────────┤
T3 runStatus ───┼── T5 WorkflowTable ─┐   ├── T8 NeedsYouBanner
T4 questionKind ┘                     ├── T6 DashboardPage + toolbar + App swap
   + runFilter ───── T7 RunList ──────┘                     │
                                                            └── T9 dashboard E2E
T10 RunDialog            (needs only shell-theme)
T11 Settings frame + Defaults ── T12 Services + Claude CLI
All ── T13 responsive + a11y ── T14 sign-off
```

## Task List

### Phase 0: Gate

- [ ] Task 0: shell-theme manual checks signed off (open items in [todo.md](todo.md))

### Phase 1: Foundation (pure logic + API; T1–T4 can run in parallel)

- [x] Task 1: `waiting_since` on `RunSummary`
- [x] Task 2: `timeFormat.ts`: when, duration, waiting
- [ ] Task 3: `runStatus.ts`: `runGroup`, `statusBadge`, `workflowStatus`; `StatusBadge` uses it
- [ ] Task 4: `questionKind.ts` and `runFilter.ts`

### Checkpoint A: Foundation

- [ ] `cargo test -p smasher-web`, clippy and the Vitest unit suite are green, with no warnings

### Phase 2: Dashboard slices

- [ ] Task 5: `WorkflowTable` (status, last activity, empty, loading, error)
- [ ] Task 6: `DashboardPage` + toolbar (title, subtitle, search, Import, Settings, New) + swap
  it into `App.svelte`
- [ ] Task 7: `RunList` filters, `?runs=` sync, durations; restyle `RunTable`
- [ ] Task 8: `NeedsYouBanner`
- [ ] Task 9: `e2e/dashboard.spec.ts`, plus `app-shell.spec.ts` updates

### Checkpoint B: Dashboard works end to end

- [ ] Non-LLM E2E is green. `/` matches the artboard above the fold, light and dark. Review
  with Jobsworth.

### Phase 3: Dialogs (T10 and T11 can run in parallel with Phase 2)

- [ ] Task 10: Run sheet restyle + `runRequest` copy; update `run-launch.spec.ts`
- [ ] Task 11: Settings window frame, browser/desktop tabs, Defaults section, saved copy
- [ ] Task 12: Services + Claude CLI sections; update `settings.spec.ts`

### Checkpoint C: Dialogs

- [ ] Both dialogs match the artboard. Settings saves exactly as before, in the browser and in
  `make desktop-dev`.

### Phase 4: Polish

- [ ] Task 13: 375px stacked rows, no horizontal scroll, keyboard and contrast pass
- [ ] Task 14: Spec Success Criteria 1–10, side-by-side sign-off

### Checkpoint D: Complete

- [ ] Everything in SPEC-dashboard.md's Success Criteria is met. Archive the plan and todo.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Restyling `RunTable` breaks the workflow-detail page, which shares it | Med | Keep its props. Run `WorkflowDetailPage.test.ts` and `workflow-detail.spec.ts` in T7. |
| Time-based tests flake across time zones or near midnight | Med | Inject `now` and `timeZone`. Use `vi.useFakeTimers()` with a fixed date in component tests. |
| Removing `RunList`'s polling leaves runs stale when the store isn't started | Med | `DashboardPage` calls `libraryStore.start()`, which is idempotent and already started by `AppShell`. A test asserts that a new run appears after one store tick. |
| The banner's questions fetch races a run being answered | Low | Key the fetch on `{id, pending_questions}`. Ignore stale responses. Fall back to **Open Run** on error. |
| E2E selector churn from new copy (`Run Workflow` → `Run…`, `Node Overrides` → `Step overrides`) | Med | Update the specs in the task that changes the copy, never later. Query by role and label. |
| `Instant`-to-wall-clock jitter makes `waiting_since` drift between polls | Low | It moves by milliseconds at most. The banner rounds to whole minutes. The Rust test allows ±1 s. |
| shell-theme manual checks turn up token or primitive fixes mid-build | Med | Task 0 gates Phase 2. Phase 1 is pure logic and safe to start earlier. |

## Parallelisation

- T1–T4 are independent. So are T10 and T11, which need only shell-theme.
- T5 → T6 runs in order, because T6 mounts T5. T7 and T8 can each run alongside T5 once
  Phase 1 is done.
- T9 waits for T6–T8.

## Open Questions

1. (From the spec, OQ1) Should the Default provider select gain "Infer from model name" and
   "Claude CLI"? Not planned here. Today's provider list stays.
