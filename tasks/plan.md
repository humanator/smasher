# Implementation Plan: `workflow-detail`

Spec: [SPEC-workflow-detail.md](SPEC-workflow-detail.md) (approved 2026-10-16), part of
[CAPABILITY_MAP.md](CAPABILITY_MAP.md). The task list is in [todo.md](todo.md).

## Overview

This plan rebuilds `/workflows/{id}` to match the Workflow artboard. It delivers:

- the toolbar (Back, Show in Finder, Edit Workflow, Run)
- the active-run banner, for runs that need you and runs that are just running
- the "What it does" step list
- run history with one-line failure reasons
- one Tauri command, `reveal_in_finder`

There are no `smasher-web` changes. Pure graph and error logic lands first in `lib/` with unit
tests. Then the page is rebuilt one section at a time, and each section works on its own. The
desktop command is independent, so it can run in parallel with Phase 2. E2E and the visual pass
come last.

## Starting state (checked 2026-10-16)

- HEAD is `6cbb536`. No workflow-detail code exists yet. The agent that started building from
  the spec was stopped before it committed or wrote any of the module's files.
- **Uncommitted in the tree:** the dashboard Running banner (SPEC-dashboard R2a). That's
  `RunningBanner.svelte` and its test, `latestRunning()` in `runStatus.ts`, the DashboardPage
  wiring, one dashboard E2E assertion and the spec amendment. Its focused Vitest files pass
  (53/53). `check`, `lint` and the dashboard E2E haven't been run on it. This plan depends on
  it (D5, Task 4), so Task 0 lands it first.

## Architecture Decisions

- **One data source.** Workflows and runs come from `libraryStore`, which already polls every
  5 s and pauses while the tab is hidden. The page's own `listRuns` poll and its `listWorkflows`
  fetch go. Two requests are added: `getWorkflowGraph` once on mount, and
  `GET /api/runs/{id}/questions` for the featured run only, refetched when its
  `pending_questions` change, as `NeedsYouBanner` does.
- **The graph is fetched once and shared.** The page holds `graph` and derives
  `labels: Map<id, label>` from it. `StepList`, the banner's "Paused at" and
  `summariseRunError` all read that map, so a step has one name everywhere.
- **Pure helpers, pure tests.** `orderSteps`, `describeLoops`, `stepLabel` (`workflowSteps.ts`)
  and `summariseRunError` (`runError.ts`) take plain data and return plain data. Components only
  render what they return.
- **Back edges are found by DFS.** An edge is a back edge when it has `loop_restart`, or when it
  reaches a node already on the DFS path from Start. Visit order is then BFS over the remaining
  edges, by `priority`, then declaration order. Exits go last and unreachable nodes are
  appended. `orderSteps` returns `{ steps, backEdges }`, so `describeLoops` doesn't walk the
  graph a second time.
- **`summariseRunError` takes a label map, not a graph.** This follows the spec's code-style
  example. It's cheaper to share and keeps `runError.ts` free of graph types. The `run` module
  can pass its own map.
- **`ActiveRunBanner` is a new component, not a reuse of the dashboard banners.** It's scoped to
  one workflow, has a different detail line ("Paused at …") and a different "+ N more" target.
  It reuses their pieces: `pickFeaturedRun`, `questionKind`, `formatWhenInline`,
  `formatDuration`, `useNow`, and the R2a chip and colours for the running variant.
- **`formatWhenInline` comes from `RunningBanner`.** The lower-casing `RunningBanner` does
  inline moves into `timeFormat.ts`, and both banners call it. This is the only edit to
  dashboard code. It's a refactor, and `RunningBanner`'s tests must stay green unchanged.
- **`RunTable` gains a mode and keeps its default.** `columns?: 'dashboard' | 'workflow'`
  defaults to `'dashboard'`. The error line renders only in `'workflow'` mode. The dashboard's
  `RunTable` and `RunList` tests must pass unchanged, which proves the default mode didn't move.
- **Reveal validation is a pure Rust function.**
  `validate_reveal_path(path, dirs) -> Result<PathBuf, String>` canonicalises both sides and
  checks `starts_with` plus the `.dot` extension. That's what the Rust tests cover. The Tauri
  command is a thin wrapper that runs `Command::new("open").args(["-R", path])`. The dirs come
  from `effective_workflow_dirs(data_dir, workflow_dirs)` (`smasher-web/src/server.rs:120`), so
  imported workflows are included, and are held in managed state. `open` is macOS-only, so on
  other targets the command returns an error. `COMMANDS` and `build.rs` must both list the new
  command, and `capabilities_test` checks that they agree.
- **The page migrates without a gap.** Task 5 rebuilds the frame and keeps the old featured-run
  card. Task 7 replaces that card with the banner, so the active-run link is never missing from
  the page at any commit.

## Task List

The full tasks, with acceptance criteria, verification and files, are in [todo.md](todo.md).

### Phase 0: Gate
- [ ] Task 0: Land the dashboard Running banner (R2a) work that's already in the tree

### Phase 1: Pure helpers
- [ ] Task 1: `orderSteps` and `stepLabel`
- [ ] Task 2: `describeLoops`
- [ ] Task 3: `summariseRunError`
- [ ] Task 4: `formatWhenInline` and the `questionKind` "waiting for you to …" phrase

### Checkpoint A: Helpers
- [ ] Unit tests green. `check` and `lint` clean. The dashboard is unchanged.

### Phase 2: The page, section by section
- [ ] Task 5: Toolbar, store-driven page frame, not-found and error states
- [ ] Task 6: "What it does" step list
- [ ] Task 7: Active-run banner (replaces the old card)
- [ ] Task 8: Run history with the workflow column mode and error lines

### Checkpoint B: Page complete in the browser
- [ ] Every section is in place at 1440 and 375. Full Vitest green. Reviewed with you.

### Phase 3: Show in Finder (can run in parallel with Phase 2)
- [ ] Task 9: `validate_reveal_path` and the `reveal_in_finder` Tauri command
- [ ] Task 10: `revealInFinder()` and the toolbar button

### Phase 4: End to end and polish
- [ ] Task 11: Failing-tool fixture and the rewritten `workflow-detail.spec.ts`
- [ ] Task 12: Responsive, accessibility and contrast pass, side by side with the artboard

### Checkpoint C: Complete
- [ ] All eight spec success criteria met. All gates have zero warnings. Signed off in
  `make desktop-dev`.

## Dependency graph

```
Task 0 ─► Task 4 ─────────────────────────┐
Task 1 ─► Task 2 ─► Task 6 ─► Task 7 ◄────┘
Task 5 ─────────────┘    │
Task 3 ───────────────► Task 8 ◄── Task 7
Task 5 + Task 9 ──────► Task 10
Tasks 6–8, 10 ────────► Task 11 ─► Task 12
```

- Tasks 1, 3, 5 and 9 depend on nothing in this plan. Task 4 needs Task 0.
- Task 6 needs Tasks 2 and 5. It also adds the graph fetch and the label map that Tasks 7 and 8
  read.
- Task 7 needs Tasks 4 and 6.
- Task 8 needs Tasks 3 and 7. It shares the page with Task 7, so they run in order to avoid
  conflicts.
- Task 10 needs Tasks 5 and 9.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `cargo test -p smasher-desktop` may not build on Linux. Tauri needs webkit2gtk, and CI or this container may lack it. | Med | Task 9 checks this first. If it can't build here, `validate_reveal_path` goes in a module with no Tauri types, and its tests run where the crate builds. Say so instead of skipping. |
| A failed tool step may not produce a `RunSummary.error` that names the node. The tool handler returns `Outcome::failure("exit code 1")`, and the run-level wrapper depends on routing. | Med | Task 11 starts by running the fixture and recording the real `error` string. Task 3's tests include that exact string. If it doesn't name the node, R5 still shows the tidied message, which is spec-compliant. |
| `orderSteps` on unusual graphs: parallel fan-in, several exits, self-loops, sub-pipelines. | Med | Task 1's test table covers each case in the spec, plus the design's 7-step graph. Every node appears once, which is an invariant assertion. |
| Two requests per page for the banner (store plus questions) could flicker the banner between states. | Low | Use the same refetch keying as `NeedsYouBanner`. A component test covers the failed-questions fallback. |
| A page test could miss changes to `RunTable`'s dashboard mode. | Low | The existing `RunTable` and `RunList` tests run unchanged in Task 8. |
| E2E selectors change (Run Workflow → Run, Run History → Run history, the old card). | Low | Task 11 updates `workflow-detail.spec.ts` in place. A grep of `e2e/` for the old names finds other specs. Nothing gets deleted. |
| A `smasher-desktop` change beyond title-bar config is on the map's Ask-first list. | — | Approved through D1 and R2 in the spec. Anything beyond R2 needs another ask. |

## Open Questions

None blocking. Two things are for you at Task 0:

1. Is the uncommitted Running banner (R2a) work yours to keep? Was it the stopped agent's? The
   plan assumes it's kept and committed as is, once `check`, `lint` and the dashboard E2E pass.
2. Task 9 needs a Mac for the `make desktop-dev` check of `open -R`. Everything else can be
   verified here.
