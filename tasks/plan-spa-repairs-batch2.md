# Implementation Plan: SPA port repairs, batch 2

Spec: [`SPEC-spa-repairs-batch2.md`](SPEC-spa-repairs-batch2.md), approved 2026-09-25. It covers
the last four modules of [`capability-map-spa-repairs.md`](capability-map-spa-repairs.md). Branch:
`feat/spa-port-repairs`. Tasks and checkpoints are in
[`todo-spa-repairs-batch2.md`](todo-spa-repairs-batch2.md).

## Overview

Four frontend-only modules, each ending in its own checkpoint:

1. **`run-summary`:**
   - run metadata rows;
   - a live, scaled graph that shows its own errors;
   - a token total and a 3s poll;
   - `unnamed` for runs with no graph name.
2. **`question-card`:**
   - a kind badge and the question id;
   - a Submit button, and radio buttons for multiple choice;
   - an immediate first fetch;
   - an empty state;
   - a store reset between runs.
3. **`event-log`:**
   - a pure formatter for all 17 kinds;
   - newest-first, colour-coded and following new events;
   - store fixes.
4. **`workflow-detail`:**
   - a `/workflows/{id}` page with a run card and the workflow's run history.

Phase 0 checks the inline test graphs against the real server before any test depends on them.

## Dependency graph

```
Phase 0: tests/fixtures/graphs.ts (inline DOT, proven through the real API)
   │
   ├── run-summary:     lib/runStatus.ts ─┬─ RunMetaList ── RunDetail (meta rows)
   │                    lib/graphError.ts ┴─ RunDetail (graph poll/error/scale)
   │                    TokenCounter (active prop) ◄── RunDetail
   │                    RunList ("unnamed", graph_name: string | null)
   │
   ├── question-card:   QuestionCard (badge/id/first fetch/empty/reset)
   │                        └── free-text Submit ── radios + Submit
   │
   ├── event-log:       lib/eventFormat.ts ─┐
   │                    events store keys ──┴── EventLog (newest-first, tones) ── follow scroll
   │
   └── workflow-detail: RunTable (pulled out of RunList) ─┐
                        page-header title slot ───────────┼── WorkflowDetailPage + route
                        RunMetaList, runStatus (above) ───┘       └── run card + history
                                                                  └── catalog link
```

Only `workflow-detail` depends on another module: it reuses `RunMetaList` and `runStatus` from
`run-summary`, and `RunDialog` from `run-launch`. Phases A–C can be built in any order, but this
plan runs them A → B → C → D.

## Architecture decisions

- **Test graphs live in one helper, `tests/fixtures/graphs.ts`.** It exports DOT strings
  (`RUN_FAIL_CHECK`, `QUESTION_KINDS`, `LOOP_CHECK`, `ANONYMOUS_GATE`) and small helpers:
  - `submitGraph(dot)`, which calls `runsApi.submitRun` and records the run id;
  - `cancelAll()`, called in `afterEach`.

  Playwright specs send the same strings with `page.request.post('/api/runs')`. There are no new
  `examples/` files.
- **`lib/runStatus.ts`** exports `TERMINAL_STATUSES` and `isActive(status)`. `RunDetail`,
  `TokenCounter`'s caller, and the workflow page's card all use it, so "active" is defined in one
  place.
- **Polling in `RunDetail`.** It keeps its 5s run poll and adds a separate 3s graph poll. When
  `refreshRun` sees a terminal status, it stops both polls and calls `loadGraph()` one last time.
  `loadGraph` keeps the last raw SVG and assigns `graphSvg` only when the text has changed.
- **`TokenCounter` takes `active: boolean`.** An `$effect` on `active` starts the 3s interval
  while it's true. When it turns false, the effect runs one `refresh()` and clears the interval.
  `RunDetail` passes `active={run ? isActive(run.status) : true}`.
- **Graph errors are local state in `RunDetail`, shown inline.** `graphError.ts` exports
  `graphErrorMessage(message)`. It returns the old install hint when the message contains
  `graphviz not available`, a fallback for an empty message, and otherwise the server's text.
- **`RunMetaList.svelte`** takes `{ run: RunSummary }` and renders a `<dl>` with the three
  conditional rows. When all three are null it renders nothing. `RunDetail` and the workflow
  page's card both mount it.
- **The questions store resets in `QuestionCard`.** An `$effect` keyed on `runId` calls
  `questionStore.reset()` and starts the poll: fetch at once, then every 2s. Its cleanup clears
  the interval and resets the store. `loaded` and `galleryGateShowing` are local state, set by
  each successful fetch.
- **Per-card UI state is a small local map** keyed by question id:
  `{ text, choice, submitting }`. The free-text input and the radios bind into it. The text is
  cleared only after `answerQuestion` succeeds.
- **The events store keys each event with a sequence number.** `add` computes
  `JSON.stringify(event)`, returns if that has been seen, and otherwise pushes `{ seq, event }`.
  The store keeps a public `events` getter that still returns `PipelineEvent[]` in arrival order,
  so existing tests and the notification code are unchanged. It adds an `entries` getter for
  keyed rendering. `EventLog` renders `entries` reversed, keyed by `seq`.
- **`EventLog` owns clearing.** An `$effect` on `runId` calls `eventStore.clear()`, resets
  `notified`, and subscribes. Its cleanup unsubscribes and clears. The completion notification's
  body uses `formatEvent`, so `eventDescription` is deleted.
- **Following new events.** A scroll handler records `atTop = el.scrollTop <= 8`. An `$effect.pre`
  on `entries.length` records `scrollHeight` before the DOM update. An `$effect` after the update
  then does one of two things:
  - if `atTop`, sets `scrollTop = 0`;
  - otherwise, adds the height difference to `scrollTop`, so the lines in view stay put.

  This doesn't rely on the browser's `overflow-anchor`, which jsdom doesn't implement. The tests
  therefore check `scrollTop` values directly.
- **Tones become a fixed class map in `EventLog`,** for example
  `blue → border-blue-500 text-blue-600 dark:text-blue-400`. The formatter returns only the tone
  name, so it stays free of styling and easy to test.
- **The page header gets an optional title.** `PageHeaderState` gains `title = $state<string |
  null>(null)`, and a `usePageTitle(getter)` helper sets it while the component is mounted, as
  `usePageActions` does. `App.svelte` uses `pageHeader.title` for the heading and for
  `{title} — Smasher` when it's set. On the workflow route it falls back to `Workflow` while the
  page loads. That's the only way a page can name itself after data it loads.
- **Routing.** A new `workflowPageType` value, `'detail'`. The regex
  `^\/workflows\/(?!new$)([^/]+)$` is checked after the `new` route and before the default. The
  captured id goes through `decodeURIComponent`, and a malformed escape falls through to the
  catalog. The edit route is unchanged, as the spec says.
- **`RunTable.svelte`** is pulled out of `RunList`. It takes `{ runs }` and renders the table,
  including `unnamed`. `RunList` keeps the polling, loading, error and empty states, and renders
  `RunTable`. `WorkflowDetailPage` does its own 5s `listRuns()` poll, filters on `workflow_id`,
  and derives both the card and the history from that one list.
- **Choosing the card's run** is a pure helper, `pickFeaturedRun(runs)`, in `lib/runStatus.ts`.
  It returns `{ run, heading: 'Active run' | 'Latest run', moreRunning: number } | null`, and is
  tested on its own. The input is already newest-first from the server.

## Verified context (checked against the code 2026-09-25)

- **The shape table in the code.** `parallelogram` is Tool, `hexagon`/`oval`/`ellipse` are
  Interviewer, and `component` is Parallel (`smasher-attractor/src/graph/mod.rs:212-216`).
  `CLAUDE.md`'s table is wrong, and a follow-up goes to the backlog.
- **`RunFailCheck` fails without calling anything.** `ToolHandler` checks that a `tool` attribute
  exists, then parses `args` as JSON before resolving the tool. Bad JSON returns
  `Outcome::failure("invalid JSON in args attribute: …")` (`tool_handler.rs:60-76`). Task 1 still
  proves the resulting run is `Failed` with that text in `error`.
- **`loop_restart` emits `EdgeTraversed` and then `LoopRestarted`** with a restart count
  (`engine.rs:938-956`). Whether the restart edge may target the start node is proven in Task 1.
  If it can't, `LOOP_CHECK` loops to a second gate instead.
- **A multiple-choice answer routes by edge label** through `preferred_label`
  (`edge.rs:106, 167`). So answering `again` or `done` picks the edge.
- **Page-header context** (`lib/page-header.svelte.ts`) has only `actions` today. Titles come
  from nested ternaries in `App.svelte:34-51`.
- **The code these tasks change:**
  - `RunDetail.svelte`: graph loaded once at `:62-66`, errors swallowed at `:39-48`, container at
    `:108-113`.
  - `TokenCounter.svelte`: 5s at `:10`.
  - `RunList.svelte`: prints `graph_name` raw at `:66`.
  - `QuestionCard.svelte`: interval with no first fetch at `:19-35`, Enter-only input at
    `:58-71`, choice buttons at `:88-95`.
  - `EventLog.svelte`: `eventDescription` at `:57-83`, `{#each}` keyed on `kind + timestamp` at
    `:92`.
  - `stores/events.svelte.ts`: `kind:timestamp` de-duplication at `:25`.
- **Tests that pin current text and will need updating:**
  - `RunDetail.test.ts:39-40`: `/Input tokens/`, `/Output tokens/`. These still pass.
  - `EventLog.test.ts:73-114`: exact old lines.
  - `QuestionCard.test.ts`: the poll-toast timing test at `:167-184`.
  - `e2e/critical-path.spec.ts`: `Pipeline started` and `Pipeline completed`, plus the
    `Enter your answer` placeholder. Both are kept.
  - `e2e/app-shell.spec.ts:30-50`: 2 toasts on a missing run. Graph errors don't toast, so this
    still holds.
- **Playwright's `webServer` is Vite only.** The specs need the same `smasher serve` on 21541
  that Vitest uses.

## Task list

The acceptance criteria and verification for each task are in `todo-spa-repairs-batch2.md`.

### Phase 0: Fixtures
- [x] Task 1: `tests/fixtures/graphs.ts`, with each graph proven through the real API

### Phase A: `run-summary`
- [ ] Task 2: `lib/runStatus.ts` and `lib/graphError.ts`
- [ ] Task 3: `RunMetaList` in `RunDetail`: a failed run shows its error
- [ ] Task 4: Graph polls while running, stops after a final fetch, shows errors inline and fits the width
- [ ] Task 5: `TokenCounter` total, 3s poll and `active` prop
- [ ] Task 6: `RunList` shows `unnamed`, and `graph_name` is typed `string | null`
- [ ] Task 7: `e2e/run-summary.spec.ts`

### Checkpoint A: `run-summary`
- [ ] Full Vitest suite, `check`, `lint` and the touched e2e specs are green. Mark the module done in the map. Review with Jobsworth.

### Phase B: `question-card`
- [ ] Task 8: Kind badge, question id, first fetch straight away, empty state, store reset
- [ ] Task 9: Free-text Submit button: disabled when blank, keeps the text on failure, blocks double submits
- [ ] Task 10: Multiple choice as radio buttons with Submit; approval buttons block double submits
- [ ] Task 11: `e2e/question-card.spec.ts`

### Checkpoint B: `question-card`
- [ ] Green as above. Mark the module done in the map. Review with Jobsworth.

### Phase C: `event-log`
- [ ] Task 12: `lib/eventFormat.ts` for all 17 kinds
- [ ] Task 13: Events store sequence keys, full-JSON de-duplication, and clearing on run change
- [ ] Task 14: `EventLog` renders newest-first, colour-coded, indented and faded
- [ ] Task 15: The log follows new events
- [ ] Task 16: `e2e/event-log.spec.ts`

### Checkpoint C: `event-log`
- [ ] Green as above. Mark the module done in the map. Review with Jobsworth.

### Phase D: `workflow-detail`
- [ ] Task 17: Pull `RunTable` out of `RunList`, with no behaviour change
- [ ] Task 18: Page-header title slot, the `/workflows/{id}` route, and a page header that handles not-found
- [ ] Task 19: Run card (`pickFeaturedRun`) and run history
- [ ] Task 20: Catalog link, `e2e/workflow-detail.spec.ts`, and backlog follow-ups

### Checkpoint D: complete
- [ ] All spec success criteria are met, and `make ci` is green
- [ ] The map marks all seven modules done, and `BACKLOG.md` #21 is updated
- [ ] Review with Jobsworth

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| A test graph reaches an LLM | High | Task 1 asserts each graph has no box nodes and no tool node with valid args. `RUN_FAIL_CHECK`'s args are deliberately invalid JSON. Every run is cancelled in `afterEach`. |
| `LOOP_CHECK` can't restart to the start node | Med | Task 1 proves it first. The fallback loops to a second gate. |
| Polling-timing tests are flaky | Med | Count real graph and token requests over a window with a generous tolerance, such as ≤1 extra after terminal. Use `waitFor` with bounded timeouts, not fixed sleeps. |
| The scroll-follow logic can't be observed in jsdom | Med | The logic sets `scrollTop` itself, and tests stub `scrollHeight` on the element with `Object.defineProperty`. That's a DOM geometry stub, not a server mock. The e2e spec checks it in a real browser. |
| Rewording the event lines breaks e2e specs | Med | Keep the `Pipeline started` and `Pipeline completed` substrings. Run the three specs that match on them at Checkpoint C. |
| Store singletons leak between Vitest files | Low | Components now reset on mount and unmount, and the store tests call `clear()` in `beforeEach`. |
| `RunList` refactor and `run-summary` both touch `RunList` | Low | Task 6 (Phase A) comes before Task 17 (Phase D), and `RunTable` carries `unnamed` across. |
| The Vitest server isn't built from this branch, or the desktop app holds port 21541 | Med | Follow the backlog's "Frontend test gotcha". Quit the app, and serve from this branch with the fake-claude env. |
| Parallel test files launch runs, so run counts aren't stable | Med | Filter on the test's own run ids or its imported `workflow_id`, never on totals. |

## Open questions

None.
