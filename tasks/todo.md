# Todo: `workflow-detail`

Plan: [plan.md](plan.md). Spec: [SPEC-workflow-detail.md](SPEC-workflow-detail.md).

Shared commands (run from `frontend/`):

- `npm run test -- --run <path>` runs focused tests. Leave out the path for the full suite.
- `npm run check`
- `npm run lint`
- `npm run build:check`
- `npm run test:e2e -- <spec>`

Rust: `cargo test -p smasher-desktop`, `cargo clippy -p smasher-desktop -- -D warnings`,
`cargo fmt --all --check`.

Vitest integration tests and E2E need `npm run dev:backend` running. Never run LLM-spending
tests (`critical-path`, LLM runs). TDD every task: write the failing test, then the code, then
commit while green.

## Phase 0: Gate

## Task 0: Land the dashboard Running banner (R2a)

**Description:** The tree holds uncommitted, approved dashboard work: `RunningBanner.svelte` and
its test, `latestRunning()`, the DashboardPage wiring, a dashboard E2E assertion, and R2a in
`archive/SPEC-dashboard.md`. D5 and Task 4 build on it. Confirm with Simon that it's to be
kept. Then run the full gates on it and commit it on its own, separate from workflow-detail
work.

**Acceptance criteria:**
- [x] Simon confirms the work is kept, or says how to handle it.
- [x] It's committed as one dashboard commit, and the working tree is clean apart from the
  workflow-detail spec and plan files.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard tests/lib/runStatus.test.ts`
  (the focused files pass 53/53 as of 2026-10-16)
- [x] `npm run check` and `npm run lint` are clean
- [x] `npm run test:e2e -- dashboard`

**Dependencies:** None

**Files likely touched:** none new. This commits what's already there.

**Estimated scope:** XS

## Phase 1: Pure helpers

## Task 1: `orderSteps` and `stepLabel`

**Description:** Create `lib/workflowSteps.ts`. `orderSteps(graph)` returns
`{ steps: EditorNode[]; backEdges: EditorEdge[] }`, ordered as R4 says:

- Breadth-first from the start node, following out-edges by `priority`, then declaration order.
- Back edges (`loop_restart`, or an edge to a node on the current DFS path) are skipped and
  collected.
- Exits go last.
- Unreachable nodes are appended in declaration order.
- Each node appears once.

`stepLabel(node)` returns the label, then the id. A start node with neither falls back to
"Start".

**Acceptance criteria:**
- [x] The spec's cases pass: linear, the design's 7-step graph with a loop back from the
  Branch, parallel fan-out and fan-in, an unreachable node, several Exits, a self-loop, and an
  empty graph.
- [x] Every case also asserts the invariant: each node appears exactly once.
- [x] `backEdges` holds exactly the loop-back edges, in visit order.

**Verification:**
- [x] `npm run test -- --run tests/lib/workflowSteps.test.ts`
- [x] `npm run check`

**Dependencies:** None

**Files likely touched:**
- `frontend/src/lib/workflowSteps.ts` (new)
- `frontend/tests/lib/workflowSteps.test.ts` (new)

**Estimated scope:** S

## Task 2: `describeLoops`

**Description:** Add `describeLoops(graph, order)` to `workflowSteps.ts`. It builds the R4
intro:

- It always starts with "The steps in order."
- Then one sentence per back edge, labelled or unlabelled.
- `{to}` is "the first step" when the target is the first step after Start.
- A label is lower-cased unless it's all capitals.
- After three sentences, the rest collapse into "It can also loop back from {n} other step(s)."

The quotes are typographic (“ ”).

**Acceptance criteria:**
- [x] The cases pass: no loops, a labelled loop to the first step, an unlabelled loop to a
  middle step, an all-capitals label, and more than three loops (singular and plural "step").
- [x] It reads labels through `stepLabel`, so the step list and the intro name steps the same
  way.

**Verification:**
- [x] `npm run test -- --run tests/lib/workflowSteps.test.ts`

**Dependencies:** Task 1

**Files likely touched:**
- `frontend/src/lib/workflowSteps.ts`
- `frontend/tests/lib/workflowSteps.test.ts`

**Estimated scope:** S

## Task 3: `summariseRunError`

**Description:** Create `lib/runError.ts`. `summariseRunError(error, labels)` (D2, R5):

- It strips the engine's wrappers: `handler error: `, `handler '{h}' failed on node '{id}': `,
  `retry exhausted for node '{id}': `, `node '{id}' failed with no available route: `, and
  `deterministic failure cycle: … with: `. These come from `smasher-attractor/src/engine.rs`
  and `handler.rs`. Also handle
  `max retries exceeded for node '{id}' after {n} attempts: ` from `retry.rs`.
- It names the step from the first `node '{id}'`.
- The message gets a capital first letter and a full stop. It's cut at the first sentence or
  140 characters, ending in "…" when cut.
- Null or empty input returns null.

**Acceptance criteria:**
- [x] There's one test per wrapper format, using the engine's exact `#[error]` strings, plus
  nested wrappers.
- [x] An unknown node id falls back to the id. An unrecognised string passes through tidied.
  Truncation is covered. Null and empty input return null.
- [x] No output contains text that wasn't in the input, apart from the label, the capital, the
  full stop and "…".

**Verification:**
- [x] `npm run test -- --run tests/lib/runError.test.ts`

**Dependencies:** None

**Files likely touched:**
- `frontend/src/lib/runError.ts` (new)
- `frontend/tests/lib/runError.test.ts` (new)

**Estimated scope:** S

## Task 4: `formatWhenInline` and the "waiting for you to …" phrase

**Description:**

- Add `formatWhenInline(iso, now, timeZone?)` to `timeFormat.ts`. It's `formatWhen` with
  "Today"/"Yesterday" lower-cased.
- Switch `RunningBanner` from its inline `.replace()` to this function (D5).
- Extend `questionKind`'s result with `waitingFor`:
  - "choose from {c} candidate(s)" for a gallery gate
  - "approve or reject it" for approval
  - "choose an option" for multiple choice
  - "answer a question" for free form

**Acceptance criteria:**
- [x] `formatWhenInline` cases pass: today, yesterday, this year and last year.
- [x] `waitingFor` passes for each kind, with singular and plural candidates.
- [x] `RunningBanner.test.ts` and `NeedsYouBanner.test.ts` pass unchanged.

**Verification:**
- [x] `npm run test -- --run tests/lib/timeFormat.test.ts tests/lib/questionKind.test.ts tests/components/dashboard`

**Dependencies:** Task 0

**Files likely touched:**
- `frontend/src/lib/timeFormat.ts`
- `frontend/src/lib/questionKind.ts`
- `frontend/src/components/dashboard/RunningBanner.svelte`
- `frontend/tests/lib/timeFormat.test.ts`
- `frontend/tests/lib/questionKind.test.ts`

**Estimated scope:** S

## Checkpoint A: Helpers
- [ ] `npm run test -- --run` is green
- [ ] `npm run check` and `npm run lint` are clean
- [ ] The dashboard looks and behaves as before (quick browser check)

## Phase 2: The page, section by section

## Task 5: Toolbar, store-driven frame, not-found and error states

**Description:** Rebuild `WorkflowDetailPage` around `libraryStore` (R1, R6).

- Toolbar:
  - `usePageBack({ label: 'Back to Workflows', href: '/' })`
  - the title from `formatWorkflowName`
  - `usePageSubtitle` with `` `{file}.dot` · {source_dir} ``
  - **Edit Workflow** (outline) and **Run** (default, `play`), which opens `LazyRunDialog`
- Loading, unknown-id and list-error states as R1 and R6 describe.
- The two-column body (340px left from `lg`, stacked below that) with placeholder regions.
- Drop the page's own `listWorkflows` and `listRuns` poll.
- Keep the old featured-run card and history `RunTable` working on store data until Tasks 7–8
  replace them.

**Acceptance criteria:**
- [x] The toolbar shows the back button, the title (`h1`), the mono file-name subtitle, Edit
  Workflow and Run. The loading title is "Workflow". An unknown id shows "Workflow not found"
  with the R6 copy and the back link only.
- [x] Run opens the sheet, and the request body is unchanged: the existing RunDialog tests and
  the "Cancel launches nothing" case pass.
- [x] The page makes no `/api/runs` or `/api/workflows` requests of its own. A test asserts
  this with a fake store.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/WorkflowDetailPage.test.ts`
  (port every existing case, and drop none)
- [x] `npm run check` and `npm run lint`

**Dependencies:** None (it uses only existing shell-theme APIs)

**Files likely touched:**
- `frontend/src/components/dashboard/WorkflowDetailPage.svelte`
- `frontend/tests/components/dashboard/WorkflowDetailPage.test.ts`

**Estimated scope:** M

## Task 6: "What it does" step list

**Description:**

- Create `StepList.svelte`, following the CAPABILITY_MAP.md code-style example. It takes
  `steps`, `intro`, `loading`, `error` and `onRetry`.
- The page fetches `getWorkflowGraph(id)` once on mount. It derives `orderSteps`,
  `describeLoops` and a `labels` map, which Tasks 7 and 8 reuse.
- States:
  - loading: a 5-row skeleton
  - error: "Couldn't read this workflow's steps. {message}" with **Try Again**
  - empty: "This workflow has no steps yet." with an **Edit Workflow** link

**Acceptance criteria:**
- [x] It renders an `h2` **What it does**, the intro, and an `<ol>` of numbered rows. Each row
  has the kind chip (`stepKind` icon and tint), the label, and the plain kind name, in
  `orderSteps` order.
- [x] Loading, error (Try Again refetches) and empty states render and can be found by role or
  label.
- [x] No raw handler name ("codergen", "wait.human") appears in the rendered text.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/StepList.test.ts tests/components/dashboard/WorkflowDetailPage.test.ts`

**Dependencies:** Tasks 2 and 5

**Files likely touched:**
- `frontend/src/components/dashboard/StepList.svelte` (new)
- `frontend/src/components/dashboard/WorkflowDetailPage.svelte`
- `frontend/tests/components/dashboard/StepList.test.ts` (new)
- `frontend/tests/components/dashboard/WorkflowDetailPage.test.ts`

**Estimated scope:** M

## Task 7: Active-run banner

**Description:** Create `ActiveRunBanner.svelte` (R3, D5). It takes this workflow's runs, the
`labels` map, and optional `now`/`timeZone`. It uses `pickFeaturedRun`, and fetches questions
for the featured run only, keyed on its id and `pending_questions`.

- **Needs you:** accent chip with the `user` icon, the run id link, the **Needs you** badge,
  and "Started {when}. Paused at **{label}**, waiting for you to {waitingFor}."
  The button is **Review Candidates** or **Answer**.
- **Running:** R2a's muted background, info chip with the `play` icon, and
  "Started {when} · {duration}", ticking every 30 s. The button is an outline **Open Run**.
- "+ {N} more running" when more than one run is active.

The banner replaces the old featured-run card.

**Acceptance criteria:**
- [x] The component cases pass: hidden (no active run, no space reserved), running, needs-you
  gallery, needs-you approval, a failed questions fetch (drops "Paused at", button **Open
  Run**), a missing `node_id`, and "+ N more running".
- [x] The landmark is `section[aria-label="Active run"]`. The text on the accent tint is at
  least 4.5:1 in light and dark, checked through the existing `contrast` test helpers.
- [x] The old card and its `RunMetaList` are gone from the page. The active run stays reachable
  from the banner.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/ActiveRunBanner.test.ts tests/components/dashboard/WorkflowDetailPage.test.ts`

**Dependencies:** Tasks 4 and 6

**Files likely touched:**
- `frontend/src/components/dashboard/ActiveRunBanner.svelte` (new)
- `frontend/src/components/dashboard/WorkflowDetailPage.svelte`
- `frontend/tests/components/dashboard/ActiveRunBanner.test.ts` (new)
- `frontend/tests/components/dashboard/WorkflowDetailPage.test.ts`

**Estimated scope:** M

## Task 8: Run history

**Description:**

- Add `columns: 'dashboard' | 'workflow'` to `RunTable`, defaulting to `'dashboard'`.
  - `'workflow'` mode shows **Status**, **Started**, **Run** (mono id) and **Duration** on
    `110px / 1fr / 110px / 110px`.
  - A Failed row adds an `alert-triangle` and `summariseRunError(run.error, labels)` under the
    start time, inside the row link's accessible name.
- The page's history section gets:
  - the `h2` **Run history** with its intro
  - a 3-row skeleton until `libraryStore.loaded`
  - a store-error alert with **Try Again**
  - the empty state "This workflow hasn't run yet." with **Run**, which opens the sheet

**Acceptance criteria:**
- [x] In `'workflow'` mode the headers are right, and the error line shows on Failed rows only,
  and only when the summary isn't null.
- [x] Dashboard mode is unchanged: `RunTable.test.ts` and `RunList.test.ts` pass with no edits.
- [x] Loading, error and empty states render. Each row is still one link to `/runs/{id}`.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/RunTable.test.ts tests/components/dashboard/RunList.test.ts tests/components/dashboard/WorkflowDetailPage.test.ts`

**Dependencies:** Tasks 3 and 7

**Files likely touched:**
- `frontend/src/components/dashboard/RunTable.svelte`
- `frontend/src/components/dashboard/WorkflowDetailPage.svelte`
- `frontend/tests/components/dashboard/RunTable.test.ts`
- `frontend/tests/components/dashboard/WorkflowDetailPage.test.ts`

**Estimated scope:** M

## Checkpoint B: Page complete in the browser
- [ ] `npm run test -- --run`, `npm run check`, `npm run lint` and `npm run build:check` are
  clean
- [ ] With `npm run dev` and `dev:backend`, open a workflow at 1440×900 and 375 wide, in light
  and dark: the toolbar, the banner (start `gate_only`), the steps and the history all look
  right
- [ ] Review with Simon before Phase 4

## Phase 3: Show in Finder (can run in parallel with Phase 2)

## Task 9: `validate_reveal_path` and the `reveal_in_finder` command

**Description:**

- First check that `cargo test -p smasher-desktop` builds here. If it can't, say so, and follow
  the plan's risk mitigation.
- Add `validate_reveal_path(path, dirs) -> Result<PathBuf, String>`. It canonicalises the path,
  requires an existing `.dot` file under a canonicalised dir, and otherwise refuses with "That
  file isn't in a workflows folder."
- Add `#[tauri::command] reveal_in_finder`, which runs
  `Command::new("open").args(["-R", &path])` on macOS and returns an error elsewhere.
- Manage `WorkflowDirs(effective_workflow_dirs(data_dir, server_config().workflow_dirs))`.
- Add the command to `COMMANDS`, `build.rs`, `generate_handler!` and `served-origin.json`.

**Acceptance criteria:**
- [x] Rust tests (tempdir): accepts a `.dot` inside a dir. Refuses one outside, a non-`.dot`
  file, a `..` escape, a symlink pointing out, and a missing file.
- [x] `capabilities_test` passes with `allow-reveal-in-finder`, and `COMMANDS` matches
  `build.rs`.
- [x] No shell is involved: the arguments are a list, and code review confirms it.

**Verification:**
- [x] `cargo test -p smasher-desktop`
- [x] `cargo clippy -p smasher-desktop -- -D warnings` and `cargo fmt --all --check`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-desktop/src/commands.rs`
- `crates/smasher-desktop/src/main.rs`
- `crates/smasher-desktop/build.rs`
- `crates/smasher-desktop/capabilities/served-origin.json`
- `crates/smasher-desktop/tests/capabilities_test.rs`

**Estimated scope:** M

## Task 10: `revealInFinder()` and the toolbar button

**Description:**

- Add `revealInFinder(path)` to `lib/native`. It invokes `reveal_in_finder` and throws outside
  Tauri.
- The page shows a **Show in Finder** ghost icon button (`folder`, with a tooltip and an
  accessible name) before Edit Workflow, only when `isTauri()`.
- A failure shows the toast "Couldn't show the file in Finder. {message}".

**Acceptance criteria:**
- [ ] Without `__TAURI__` the button is absent. With it mocked, the button is present and calls
  `invoke('reveal_in_finder', { path: workflow.path })`.
- [ ] A rejected invoke shows the toast with the message.
- [ ] `no-tauri-breakage.spec.ts` still passes.

**Verification:**
- [ ] `npm run test -- --run tests/lib/native tests/components/dashboard/WorkflowDetailPage.test.ts`
- [ ] `npm run test:e2e -- no-tauri-breakage`
- [ ] Manual check (Mac): in `make desktop-dev`, Show in Finder reveals the `.dot` file in
  Finder

**Dependencies:** Tasks 5 and 9

**Files likely touched:**
- `frontend/src/lib/native/index.ts`
- `frontend/src/components/dashboard/WorkflowDetailPage.svelte`
- `frontend/tests/lib/native/*.test.ts`
- `frontend/tests/components/dashboard/WorkflowDetailPage.test.ts`

**Estimated scope:** S

## Phase 4: End to end and polish

## Task 11: Failing-tool fixture and the rewritten E2E

**Description:**

- Add `frontend/e2e/fixtures/fail_tool.dot` (D6): Start, then a `parallelogram` tool step
  (labelled, `tool_command="false"`), then Exit.
- Run it once against `dev:backend` and record the real `RunSummary.error`. If it differs from
  the strings Task 3 tested, add it there as a test case.
- Rewrite `workflow-detail.spec.ts` to cover each R5 E2E flow.
- Grep `e2e/` for the old names ("Run Workflow", "Run History", "No runs yet.", the old card)
  and update any other spec that uses them.

**Acceptance criteria:**
- [ ] E2E covers:
  - the dashboard → the workflow page → the steps in order with plain kind names
  - Run → the sheet → the run page → back, where the run is the top history row (the old
    test's intent, updated)
  - `gate_only` shows the needs-you banner with "Paused at", and answering it removes the
    banner within a poll
  - `fail_tool` shows its error line naming the step by label
  - no horizontal scroll at 375 px
- [ ] Every fixture and imported workflow is cleaned up in `finally`, and every run is
  cancelled.
- [ ] No spec is deleted, and no LLM workflow is used.

**Verification:**
- [ ] `npm run test:e2e -- workflow-detail dashboard app-shell no-tauri-breakage`

**Dependencies:** Tasks 6, 7, 8 and 10

**Files likely touched:**
- `frontend/e2e/fixtures/fail_tool.dot` (new)
- `frontend/e2e/workflow-detail.spec.ts`
- `frontend/tests/lib/runError.test.ts` (only if the real string differs)

**Estimated scope:** M

## Task 12: Responsive, accessibility and contrast pass

**Description:** Compare the page side by side with
`docs/design/redesign/Workflow.dc.html` at 1440×900, in light and dark, and fix any
differences. Check R7:

- the phone layout at 375
- the toolbar subtitle truncating
- the banner button going full width
- `aria-labelledby` on both sections
- keyboard order and focus rings

**Acceptance criteria:**
- [ ] Spec success criteria 1, 6 and 7 hold. The only deviations are D4 and the browser hiding
  Show in Finder.
- [ ] Contrast is at least 4.5:1 for every text and token pair the page adds, in both themes.
- [ ] Every action is reachable by keyboard with a visible focus ring.

**Verification:**
- [ ] `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run build:check`, and
  `npm run test:e2e` (non-LLM specs) all have zero warnings
- [ ] `cargo test -p smasher-desktop` and clippy are clean
- [ ] Manual check: side by side in the browser and in `make desktop-dev` (Mac)

**Dependencies:** Task 11

**Files likely touched:** whichever Task 5–10 components need fixes

**Estimated scope:** S–M

## Checkpoint C: Complete
- [ ] All eight success criteria in SPEC-workflow-detail.md are met
- [ ] Every gate has zero warnings
- [ ] Simon signs off. The spec, plan and todo move to `tasks/archive/` as
  `SPEC-workflow-detail.md`, `plan-workflow-detail.md` and `todo-workflow-detail.md`.
