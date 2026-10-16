# Spec: `workflow-detail`

Module of [CAPABILITY_MAP.md](CAPABILITY_MAP.md). Status: **Approved 2026-10-16.**
Depends on: `shell-theme` (tokens, primitives, `stepKinds`, `AppShell`/`Toolbar`, page-header
context, `libraryStore`). It also reuses the `dashboard` helpers (`statusBadge`, `formatWhen`,
`formatDuration`, `questionKind`, `RunTable`, `LazyRunDialog`).

Design reference: [Workflow](../docs/design/redesign/Workflow.dc.html) (1440×900). Primitives come
from the shell-theme component boards.

## Objective

Rebuild the workflow page (`/workflows/{id}`) so someone who has never read a DOT file can:

1. **See what the workflow does.** "What it does" lists its steps in running order, using the
   plain step names, and explains any loops in one plain sentence each.
2. **See whether it is running now and whether it needs them.** A banner names the active run,
   says where it has paused and what it is waiting for, and links straight to it.
3. **See how past runs went.** Run history lists every run of this workflow, newest first. A
   failed run shows a one-line reason, so nobody has to open it to find out what went wrong.
4. **Act on it from the toolbar:** go back, show the file in Finder (desktop only), edit it, or
   run it.

### Decisions made for this module (2026-10-16)

| # | Decision |
|---|---|
| D1 | **Show in Finder** is a new `reveal_in_finder` Tauri command in `smasher-desktop` that runs `open -R <path>`. It needs no new dependency. The button renders only in the desktop app. |
| D2 | A failed run's one-line reason comes from a client-side `summariseRunError()` that reads the engine's existing `RunSummary.error` string. It needs no API change, and the `run` module reuses it. |
| D3 | The "What it does" intro is generated from the graph: "The steps in order." plus one sentence for each loop-back edge. |
| D4 | The "Latest run" card goes. The banner appears only while a run of this workflow is active. The latest finished run is the top row of Run history, and its tokens and working folder stay on the run page. |
| D5 | A run that's only running gets a banner too, matching the dashboard's Running banner (SPEC-dashboard R2a) in wording, colours and button. Both pages word the start time the same way, through `formatWhenInline`. |
| D6 | The E2E workflow that fails without an LLM call is a test fixture in `frontend/e2e/fixtures/`, next to `gate_only.dot`. It isn't added to `examples/`. |

## Requirements

### R1. Toolbar (via the page-header context from shell-theme)

- A back button, **Back to Workflows** (ghost icon button, `arrow-left`), linking to `/`. Set it
  through `PageHeaderState.back`.
- Title: the workflow's display title (`formatWorkflowName(name)`). Subtitle: the file name in
  mono, then ` · {source_dir}`, for example `` `design_concepts_review.dot` · workflows/design ``.
- Right side, in order:
  - **Show in Finder** (ghost icon button, `folder`, with tooltip and accessible name). Desktop
    only, per D1.
  - **Edit Workflow** (outline), linking to `/workflows/{id}/edit`.
  - **Run** (default, `play` icon), which opens the Run sheet.
- The Settings button stays in the toolbar, as on every page.
- While loading, the title reads "Workflow" with no subtitle or actions. If the workflow id is
  unknown, the title is "Workflow not found".

### R2. Show in Finder (smasher-desktop, D1)

- A new command `reveal_in_finder(path: String) -> Result<(), String>` in `commands.rs`.
- It canonicalises `path` and refuses it unless it is an existing `.dot` file inside one of the
  server's effective workflow dirs. These are `effective_workflow_dirs(data_dir, workflow_dirs)`,
  which includes the imported-workflows folder, held in managed state. The
  refusal message is "That file isn't in a workflows folder."
- On success it runs `open -R <canonical path>` with an argument list, never a shell string.
- Add `allow-reveal-in-finder` to `capabilities/served-origin.json`, and register the command in
  `generate_handler!`.
- `lib/native` gains `revealInFinder(path)`. It throws when the app isn't running in Tauri.
- If the reveal fails, the page shows a toast: "Couldn't show the file in Finder. {message}".

### R3. Active-run banner

- It shows only when this workflow has at least one active run (`isActive`). It features the
  same run `pickFeaturedRun` picks today. Otherwise nothing renders and no space is reserved.
- Landmark: `<section aria-label="Active run">`.
- Left: a round 28px chip with an icon. A needs-you run gets the accent fill and a `user` icon.
  A running run uses the dashboard Running banner's chip (D5): the info fill and a `play` icon,
  on a muted background.
- First line: the run id in mono as a link to `/runs/{id}`, then the status badge from
  `statusBadge` (**Needs you** or **Running**).
- Detail line:
  - Needs you: "Started {when}. Paused at **{step label}**, waiting for you to {what}."
    - `{when}` is `formatWhenInline`: `formatWhen` with "Today"/"Yesterday" lower-cased for
      mid-sentence use ("today, 10:42 am", "Fri 9 Oct, 3:48 pm"). Add it to `timeFormat.ts`.
      The dashboard's `RunningBanner` already does this inline, so it moves there and
      `RunningBanner` calls it.
    - `{step label}` is the label, from the workflow graph, of the pending question's `node_id`.
      Fall back to the node id, and leave out "Paused at …" when there's no node id.
    - `{what}` is "choose from {c} candidate(s)" for a gallery gate, "approve or reject it" for
      `approval`, "choose an option" for `multiple_choice` and "answer a question" for
      `free_form`. It comes from `questionKind`, extended with this phrase.
  - Running (D5): "Started {when} · {duration}". The duration is
    `formatDuration(started_at, null, now)`, so it reads like "7 min 48 s so far", and ticks every
    30 s. There's no current-step text, because the API doesn't provide one.
- Action button:
  - **Review Candidates** for a gallery gate, **Answer** for any other question, and **Open Run**
    (outline, as on the dashboard) for a run that is just running. All three link to
    `/runs/{id}`.
  - If the questions fetch fails, the detail line drops the "Paused at …" clause and the button
    reads **Open Run**.
- When more than one run is active, a trailing muted line reads "+ {N} more running".
- Questions come from `GET /api/runs/{id}/questions`, for the featured run only. They're
  refetched when the featured run or its `pending_questions` changes, as on the dashboard.

### R4. "What it does" step list

- Heading **What it does** (`h2`). It sits in a 340px left column from `lg` up and stacks above
  Run history below that.
- The graph comes from `GET /api/workflows/{id}/graph` (`getWorkflowGraph`), fetched once on
  mount.
- A pure `orderSteps(graph)` helper in `lib/workflowSteps.ts` puts the steps in running order:
  - Breadth-first from the start node, following each node's out-edges by `priority`, then by
    declaration order.
  - Back edges are skipped. A back edge is one with `loop_restart`, or one that reaches a node
    already on the current DFS path.
  - Exit nodes go last.
  - Nodes the start can't reach are appended in declaration order, so no step is hidden.
  - Each step appears once.
- Each row (an `<li>` in an `<ol>`) shows:
  - the 1-based number, tabular and right-aligned
  - a 26px chip with the `stepKind(node_type)` icon in its ink and tint
  - the step label (node `label`, then the id; the start node falls back to "Start")
  - the plain kind name ("AI Agent", "Tool", "Branch", "Ask a person", "Finish", and so on)
  This is the CAPABILITY_MAP.md code-style example.
- A pure `describeLoops(graph, order)` helper builds the intro:
  - It always starts with "The steps in order."
  - Then one sentence per back edge:
    - with an edge label: `If “{from}” says {label}, the workflow goes back to {to} and tries
      again.`
    - without one: `After “{from}”, the workflow can go back to {to} and try again.`
  - `{to}` is "the first step" when the target is the first step after Start, and otherwise
    `“{target label}”`. `{label}` is lower-cased unless it's all capitals.
  - After three sentences, the rest collapse into "It can also loop back from {n} other
    step(s)."
- States:
  - loading: a 5-row skeleton
  - graph fetch error: an inline alert ("Couldn't read this workflow's steps. {message}") with
    **Try Again**
  - graph with no nodes: "This workflow has no steps yet." with an **Edit Workflow** link

### R5. Run history

- Heading **Run history** (`h2`). Intro: "Every run of this workflow, newest first. Open one to
  see what happened step by step."
- Data comes from `libraryStore.runsFor(workflowId)`. The page's own 5 s `listRuns` poll goes,
  so the page isn't polled twice.
- It reuses `RunTable` with a new `columns="workflow"` mode. Columns are **Status**, **Started**,
  **Run** (id in mono) and **Duration**, on a 110px / 1fr / 110px / 110px grid, with zebra rows
  from the tokens. Each row stays one link to `/runs/{id}`. The dashboard's default mode
  doesn't change.
- A failed run shows its summary under the start time: an alert-triangle icon plus
  `summariseRunError(run.error, graph)`, in the destructive token at 11.5px. Show it only when
  the summary isn't null. It's part of the row link's accessible name.
- `summariseRunError(error, graph)` in `lib/runError.ts` is a pure helper:
  - It strips the engine's wrapper prefixes ("handler error: ", "handler '{h}' failed on node
    '{id}': ", "retry exhausted for node '{id}': ", "node '{id}' failed with no available
    route: " and "deterministic failure cycle: … with: ").
  - It takes the node id from the first `node '{id}'` it finds and swaps in that step's label as
    `{label}: `.
  - The message gets a capital first letter and a trailing full stop. It's cut at the first
    sentence or 140 characters, whichever comes first (ending in "…" when cut).
  - It returns null for null or empty input. An unrecognised format passes through tidied.
  - It never invents a cause. It only reshapes the engine's own text.
- States:
  - Loading (`!libraryStore.loaded`) shows a 3-row skeleton.
  - A store error shows an inline alert with **Try Again** (`libraryStore.refresh`).
  - No runs: "This workflow hasn't run yet." with a **Run** button that opens the sheet.

### R6. Not found and errors

- An unknown id shows "We couldn't find that workflow. It may have been renamed or moved." with
  a **Back to Workflows** link. The toolbar shows only the back button.
- A failed workflow list load shows an inline alert with **Try Again**.

### R7. Responsive and accessible

- Below `lg`, the step list stacks above history. Below `md`, history rows stack: badge and
  start time, then the error line, then the id and duration, as `RunTable` already does.
- On phones the toolbar subtitle truncates with an ellipsis, and Edit Workflow and Run stay
  visible. The banner wraps, with its button taking the full width under the text. Nothing
  scrolls sideways at 375px.
- The toolbar title is `h1`, and both sections are `h2` with `aria-labelledby`. Use real links
  and buttons. Badges carry their status as text, and the error line carries an icon and text,
  not colour alone.
- Contrast is at least 4.5:1 in light and dark, including the banner's text on its accent tint.
  Focus rings come from the primitives.

## Tech Stack

No new dependencies. Svelte 5 runes, TypeScript strict, Tailwind v4, the shell-theme
primitives, and `@lucide/svelte`. Desktop: one Tauri command using `std::process::Command`.
There are no `smasher-web` changes.

## Commands

```bash
cd frontend && npm run test -- --run tests/lib/workflowSteps.test.ts tests/lib/runError.test.ts
cd frontend && npm run test -- --run                       # all Vitest
cd frontend && npm run check && npm run lint
cd frontend && npm run test:e2e -- workflow-detail dashboard app-shell   # non-LLM specs
cd frontend && npm run build:check
cargo test -p smasher-desktop reveal
cargo clippy -p smasher-desktop -- -D warnings && cargo fmt --all --check
make desktop-dev                                           # Show in Finder + side-by-side, light + dark
```

## Project Structure

```
frontend/src/components/dashboard/
  WorkflowDetailPage.svelte   → rebuilt: toolbar wiring, banner, two-column body, store-driven
  ActiveRunBanner.svelte      → NEW (R3)
  StepList.svelte             → NEW (R4), the CAPABILITY_MAP.md example
  RunTable.svelte             → + columns="workflow" mode and the error line (R5)
frontend/src/lib/
  workflowSteps.ts            → NEW: orderSteps(), describeLoops(), stepLabel()
  runError.ts                 → NEW: summariseRunError()
  timeFormat.ts               → + formatWhenInline()
  questionKind.ts             → + the "waiting for you to …" phrase
  native/index.ts             → + revealInFinder()
frontend/tests/lib/           → workflowSteps, runError, timeFormat and questionKind tests
frontend/tests/components/dashboard/ → ActiveRunBanner, StepList, RunTable, WorkflowDetailPage
frontend/e2e/workflow-detail.spec.ts  → rewritten for the new page (the old test is kept, updated)
crates/smasher-desktop/src/commands.rs     → reveal_in_finder (R2)
crates/smasher-desktop/src/main.rs         → register the command, manage the workflow dirs
crates/smasher-desktop/capabilities/served-origin.json → + allow-reveal-in-finder
crates/smasher-desktop/tests/capabilities_test.rs      → expect the new permission
```

## Code Style

This follows CAPABILITY_MAP.md. Graph logic stays pure, in `lib/`, so it can be tested without
the DOM:

```ts
// ABOUTME: Turns the engine's run error string into the one line the run history shows
// ABOUTME: Strips handler wrappers and names the step by its label; never adds a cause of its own

const NODE = /node '([^']+)'/;

export function summariseRunError(error: string | null, labels: ReadonlyMap<string, string>): string | null {
  if (!error?.trim()) return null;
  const nodeId = NODE.exec(error)?.[1];
  const message = tidy(stripWrappers(error));
  return nodeId ? `${labels.get(nodeId) ?? nodeId}: ${message}` : message;
}
```

User-facing copy says "step", never "node". It uses en-AU spelling, sentence-case headings and
Title Case buttons, as drawn.

## Testing Strategy

TDD per task. Write the failing test first.

- **Unit (Vitest):**
  - `orderSteps`:
    - a linear graph
    - the design's 7-step graph with a loop back from the Branch
    - parallel fan-out and fan-in
    - an unreachable node
    - several Exits
    - a self-loop
    - an empty graph
  - `describeLoops`:
    - no loops
    - a labelled loop to the first step
    - an unlabelled loop to a middle step
    - an all-capitals label
    - more than three loops
  - `summariseRunError`: each engine wrapper format from `EngineError`/`HandlerError`, an unknown
    node id, an unrecognised string, truncation, and null or empty input
  - `formatWhenInline`: today, yesterday, this year and last year
  - the `questionKind` phrase for each kind, singular and plural candidates
- **Component (Vitest + Testing Library, queried by role and label):**
  - `ActiveRunBanner`: hidden, running, needs-you gallery, needs-you approval, a failed
    questions fetch, and "+ N more running"
  - `StepList`: loading, error with Try Again, empty, and populated (names, kinds, order)
  - `RunTable` in `columns="workflow"` mode: the headers, an error line on Failed only, and the
    dashboard mode unchanged
  - `WorkflowDetailPage`:
    - toolbar title, subtitle and actions
    - Show in Finder present only with `__TAURI__` mocked
    - not found
    - an empty history with its Run button
- **Desktop (Rust):**
  - `reveal_in_finder` validation, as a pure `validate_reveal_path(path, dirs)`: accepts a
    `.dot` inside a dir, refuses one outside, refuses a non-`.dot` file, refuses `..` escapes
    and symlinks out, and refuses a missing file
  - `capabilities_test` lists the new permission
  - The `open -R` call itself is checked by hand in `make desktop-dev`.
- **E2E (Playwright, real `smasher-web`, no LLM workflows):** rewrite `workflow-detail.spec.ts`
  to cover:
  - the dashboard → workflow page → steps in order with plain kinds
  - Run → sheet → the run lands on its page → back to the workflow page, where the run is the
    top history row
  - a human-gate workflow shows the needs-you banner with "Paused at", and answering it removes
    the banner within a poll
  - a workflow that fails without an LLM call shows its error line
  - no horizontal scroll at 375px

  Keep the existing test's intent, update its selectors, and don't delete specs.
- Zero warnings from check, lint, Vitest and clippy.

## Boundaries

- **Always:** everything in CAPABILITY_MAP.md's Always list; derive every step, label, count,
  time and error line from the API (no copy hard-coded to a particular workflow); keep one
  status → badge mapping; keep `summariseRunError` to reshaping, never diagnosis.
- **Ask first:**
  - any `smasher-web` change
  - any further `smasher-desktop` change beyond R2
  - changing `RunTable`'s dashboard mode
  - showing a current step for running runs, which would need a new API field
- **Never:**
  - pass the reveal path through a shell
  - accept a reveal path outside the workflow dirs
  - draw traffic lights
  - run LLM-spending tests
  - push or open a PR unasked

## Success Criteria

1. At 1440×900, `/workflows/{id}` matches the Workflow artboard in layout, hierarchy, copy and
   tokens, in light and dark, in the browser and in `make desktop-dev`. The only deviations are
   D4 and the browser hiding Show in Finder.
2. For `design_concepts_review`-style graphs, the step list shows every node once, in running
   order, with plain kind names, and the intro explains each loop in one sentence.
3. With a run waiting at a human gate, the banner reads "Started {when}. Paused at **{step}**,
   waiting for you to …", and its button opens the run. Once the run is answered, the banner
   switches or disappears within 5 s.
4. Every failed run in history shows a one-line reason naming the step by its label, and no
   other run shows one.
5. In the desktop app, Show in Finder reveals the workflow's `.dot` file, and a path outside the
   workflow dirs is refused (proved by Rust test).
6. Every capability the current page has is still reachable: Edit, Run (same request body via
   the shared sheet), the history links, and the active run.
7. At 375px nothing scrolls sideways, and every action is reachable by keyboard with a visible
   focus ring.
8. check, lint, Vitest, non-LLM E2E, `cargo test -p smasher-desktop` and clippy all pass with
   zero warnings.

## Resolved Questions

1. **A failing workflow for E2E:** it's a fixture in `frontend/e2e/fixtures/` (D6).
2. **A banner for runs that are only running:** yes, matching dashboard R2a (D5).
