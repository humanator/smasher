# Todo: `dashboard`

Plan: [plan-dashboard.md](plan-dashboard.md). Spec: [SPEC-dashboard.md](../SPEC-dashboard.md).

Shared commands (from `frontend/`):

- `npm run test -- --run <path>` runs focused tests; omit the path for the full suite
- `npm run check`
- `npm run lint`
- `npm run build:check`
- `npm run test:e2e -- <spec>`

Rust: `cargo test -p smasher-web`, `cargo clippy --workspace -- -D warnings`,
`cargo fmt --all --check`.

Vitest integration tests and E2E need `npm run dev:backend` running. Never run LLM-spending
tests. TDD every task: write the failing test, then the code, then commit while green.

## Phase 0: Gate

## Task 0: shell-theme sign-off

**Description:** Finish the open manual checks in [todo.md](todo.md): the side-by-side checks
against the component boards, light and dark, `make desktop-dev`, and the review with
Jobsworth. Phase 1 may start before this. Phase 2 may not.

**Acceptance criteria:**
- [ ] Every unchecked item in `tasks/todo.md` is ticked or turned into a follow-up.

**Verification:**
- [ ] Jobsworth confirms.

**Waived 2026-10-16:** Simon waived this gate so Phases 2–4 could start. The open manual checks
in `tasks/todo.md` still stand and are picked up at Checkpoint B.

**Dependencies:** None

**Estimated scope:** —

## Phase 1: Foundation

## Task 1: `waiting_since` on `RunSummary`

**Description:** Add `waiting_since: Option<String>` (RFC3339 UTC) to `RunSummary`, with
`#[serde(default)]`. In `to_summary`, take the oldest `created_at` in the interviewer queue and
convert it with `SystemTime::now() - created_at.elapsed()`. Rehydrated and new-run summaries
report `None`. Mirror the field in TypeScript.

**Acceptance criteria:**
- [x] No questions gives `null`. Two questions give the older one's time (±1 s). Once both are
  answered, it's `null` again.
- [x] An old summary JSON without the field deserialises to `None`.
- [x] `RunSummary` in `frontend/src/lib/api/runs.ts` has `waiting_since: string | null`, and
  the test fixtures are updated.

**Verification:**
- [x] `cargo test -p smasher-web waiting_since`
- [x] `npm run test -- --run tests/lib/api` (a live gate shows a non-null `waiting_since`)
- [x] clippy and fmt are clean

**Dependencies:** None

**Files likely touched:** `crates/smasher-web/src/state.rs`, `frontend/src/lib/api/runs.ts`,
`frontend/tests/lib/api/runs.test.ts`, `frontend/tests/fixtures/*`

**Estimated scope:** S

## Task 2: `timeFormat.ts`

**Description:** A new `frontend/src/lib/timeFormat.ts` with three pure functions:

- `formatWhen(iso, now, timeZone?)` → "Today, 10:42 am" / "Yesterday, 4:20 pm" /
  "Fri 9 Oct, 3:48 pm", with the year added when it isn't the current year
- `formatDuration(startIso, endIso | null, now)` → "48 s" / "7 min 48 s" / "1 h 12 min",
  adding "… so far" when there's no end
- `formatWaiting(iso, now)` → "waiting less than a minute" / "waiting 1 minute" /
  "waiting 6 minutes" / "waiting 2 hours"

Use `en-AU` and lower-case am/pm.

**Acceptance criteria:**
- [x] Every example in spec R2–R4 is a test case, with `now` and `timeZone` pinned
  (`Australia/Sydney` and `UTC`).
- [x] The day boundary is checked in the given time zone, not UTC.
- [x] A missing or invalid date returns "—" instead of throwing.

**Verification:**
- [x] `npm run test -- --run tests/lib/timeFormat.test.ts`

**Dependencies:** None

**Files likely touched:** `frontend/src/lib/timeFormat.ts`,
`frontend/tests/lib/timeFormat.test.ts`

**Estimated scope:** S

## Task 3: Status helpers + `StatusBadge`

**Description:** Extend `runStatus.ts` with:

- `runGroup(status)` → `'active' | 'completed' | 'failed'`
- `statusBadge(status | 'Needs you' | 'No runs yet')` → `{ label, variant, dot }`, with the dot
  as a token class
- `workflowStatus(workflowId, runs, now)` → `{ status, lastActivity }`, applying spec R3's table
  using `timeFormat`

Then make `StatusBadge.svelte` render `statusBadge`.

**Acceptance criteria:**
- [x] Each row of the R3 table and each run status has a unit test. `needsYou` is defined in
  one place (`Running && pending_questions > 0`), and `libraryStore` reuses it.
- [x] `StatusBadge` shows the label as text, with the dot `aria-hidden`.
- [x] The existing `runStatus`, `RunTable` and `WorkflowDetailPage` tests still pass.

**Verification:**
- [x] `npm run test -- --run tests/lib/runStatus.test.ts tests/components/dashboard`

**Dependencies:** T2

**Files likely touched:** `frontend/src/lib/runStatus.ts`,
`frontend/src/stores/library.svelte.ts`, `frontend/src/components/dashboard/StatusBadge.svelte`,
`frontend/tests/lib/runStatus.test.ts`

**Estimated scope:** M

## Task 4: `questionKind.ts` + `runFilter.ts`

**Description:** Two small modules:

- `questionKind(questionsResponse)` → `{ text, action }`. A gallery gate gives "Pick a
  favourite" / "Review Candidates". `approval` gives "Approve or reject", `multiple_choice`
  "Choose an option" and `free_form` "Answer a question", each with "Answer". It also returns
  the candidate count for gallery gates.
- `parseRunFilter(search)` → `{ filter, needsYouFirst }` and `runFilterHref(filter)`.
  `needs-you` maps to `active` with `needsYouFirst: true`, and an unknown value maps to `all`.

**Acceptance criteria:**
- [x] All four kinds plus an empty response are tested.
- [x] Every value of `?runs=` is tested, including a missing one and garbage.

**Verification:**
- [x] `npm run test -- --run tests/lib/questionKind.test.ts tests/lib/runFilter.test.ts`

**Dependencies:** None

**Files likely touched:** `frontend/src/lib/questionKind.ts`, `frontend/src/lib/runFilter.ts`,
and their two test files

**Estimated scope:** S

## Checkpoint A: Foundation

- [x] `cargo test -p smasher-web`, clippy and fmt pass
- [x] `npm run test -- --run`, `npm run check` and `npm run lint` pass with zero warnings

## Phase 2: Dashboard slices

## Task 5: `WorkflowTable`

**Description:** A new `WorkflowTable.svelte` built from the spec's R3. It takes `workflows`,
`runs`, `now`, `query`, `loading`, `error`, `onRun`, `onRetry`, `onImport`.

- Columns: Name (link + mono file), Status badge, Last activity, Location, Edit / Run….
- Zebra rows use tokens.
- States: a 3-row skeleton, an error with **Try Again**, the "No workflows yet" empty state
  with **New Workflow** and **Import .dot File**, and "No workflows match that search."
- Port every case from `WorkflowCatalog.test.ts` that is about the table.

**Acceptance criteria:**
- [x] Each state renders, queried by role and label.
- [x] Search matches the title and file name, ignoring case and trimming spaces.
- [x] Each R3 status shows in a row, with the right last-activity text.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/WorkflowTable.test.ts`

**Dependencies:** T0, T3

**Files likely touched:** `frontend/src/components/dashboard/WorkflowTable.svelte`,
`frontend/tests/components/dashboard/WorkflowTable.test.ts`

**Estimated scope:** S

## Task 6: `DashboardPage` + toolbar + App swap

**Description:** A new `DashboardPage.svelte` that owns the search query and renders the
banner slot, `WorkflowTable` and `RunList`. It sets the toolbar from spec R1:

- title "Workflows"
- subtitle "{n} workflows · {k} needs you"
- a search input
- icon buttons with tooltips for Import .dot file, AI model settings and New workflow

Import moves here from `WorkflowCatalog`. `App.svelte` renders `DashboardPage` and drops the
catalog's New Workflow header button. Finish porting `WorkflowCatalog.test.ts` (import flow,
import error), then remove `WorkflowCatalog.svelte` and its test.

**Acceptance criteria:**
- [x] The toolbar has the title, a live subtitle (the " · k needs you" part only when k > 0),
  search, and three accessibly named icon buttons. Settings opens the dialog.
- [x] Import works as before: the browser path is tested, and an error shows inline.
- [x] Every `WorkflowCatalog.test.ts` case lives on in a new test file before the old one is
  deleted.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard tests/components/shell`
- [x] `npm run check`
- [x] Manual: `/` in the browser shows the new toolbar and table

**Dependencies:** T5

**Files likely touched:** `frontend/src/components/dashboard/DashboardPage.svelte`,
`frontend/src/App.svelte`, `frontend/src/components/dashboard/WorkflowCatalog.svelte`
(removed), `frontend/tests/components/dashboard/DashboardPage.test.ts`,
`frontend/tests/components/dashboard/WorkflowCatalog.test.ts` (removed once ported)

**Estimated scope:** M

## Task 7: `RunList` filters + `RunTable` restyle

**Description:** Rework `RunList` to read `libraryStore.runs` instead of polling. It gets:

- a `ToggleGroup` with live counts (All / Active / Completed / Failed or stopped)
- `?runs=` sync through `runFilter`, with `replaceState` and a listener for back/forward
- `needsYouFirst` ordering
- both empty states
- intro copy

Restyle `RunTable` into grid rows where each row is one link: badge, workflow title + mono run
id, Started, Duration. It takes an optional `now` prop that ticks every 30 s.

**Acceptance criteria:**
- [x] Each filter shows the right rows and counts. A reload with `?runs=failed` restores the
  filter. `?runs=needs-you` selects Active with needs-you runs first.
- [x] Durations tick for active runs (fake timers) and stay fixed for finished ones.
- [x] `WorkflowDetailPage` still renders its run history through `RunTable` unchanged, and its
  tests pass.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/RunList.test.ts tests/components/dashboard/RunTable.test.ts tests/components/dashboard/WorkflowDetailPage.test.ts`
- [x] `npm run test:e2e -- workflow-detail`

**Dependencies:** T0, T2, T3, T4

**Files likely touched:** `frontend/src/components/dashboard/RunList.svelte`,
`frontend/src/components/dashboard/RunTable.svelte`, `frontend/src/lib/hooks/useNow.svelte.ts`,
`frontend/tests/components/dashboard/RunList.test.ts`,
`frontend/tests/components/dashboard/RunTable.test.ts`

**Estimated scope:** M

## Task 8: `NeedsYouBanner`

**Description:** A new `NeedsYouBanner.svelte`, mounted at the top of `DashboardPage`. It
features the `needsYou` run with the oldest `waiting_since` and fetches its questions, keyed on
`{id, pending_questions}` and ignoring stale responses. It renders:

- the title "{Workflow} is waiting for your decision"
- the detail line: kind · candidates · waiting
- the action button
- "+ N more waiting" linking to `/?runs=needs-you#runs`

If the questions fetch fails, it shows only the wait, with **Open Run**.

**Acceptance criteria:**
- [x] Nothing renders when nobody is waiting. Gallery, approval and more-than-one cases each
  render as specified.
- [x] The wait text refreshes at least once a minute (fake timers).
- [x] The landmark is `section[aria-label="Waiting for you"]`, and the button is a real link to
  `/runs/{id}`.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/NeedsYouBanner.test.ts`

**Dependencies:** T1, T2, T4, T6

**Files likely touched:** `frontend/src/components/dashboard/NeedsYouBanner.svelte`,
`frontend/src/components/dashboard/DashboardPage.svelte`,
`frontend/tests/components/dashboard/NeedsYouBanner.test.ts`

**Estimated scope:** S

## Task 9: Dashboard E2E

**Description:** A new `e2e/dashboard.spec.ts` against the real `smasher-web`, using non-LLM
workflows from `e2e/fixtures`. It covers:

- search filtering the table
- Run… → sheet → Start Run → landing on the run
- the filter and `?runs=` staying in sync, including the sidebar links
- a human-gate run that raises the banner with "waiting" and clears it within a poll once
  answered

Update `app-shell.spec.ts` for the new copy and selectors without deleting any test.

**Acceptance criteria:**
- [x] The new spec passes 3 runs in a row locally.
- [x] All existing non-LLM specs pass.

**Verification:**
- [x] `npm run test:e2e -- dashboard app-shell` ×3, then a full non-LLM `npm run test:e2e`

**Dependencies:** T6, T7, T8

**Files likely touched:** `frontend/e2e/dashboard.spec.ts`, `frontend/e2e/app-shell.spec.ts`,
`frontend/e2e/fixtures/*`

**Estimated scope:** S

## Checkpoint B: Dashboard works end to end

- [ ] Full Vitest, non-LLM E2E, check and lint are green
- [ ] `/` side by side with the Home artboard at 1440×900, light and dark
- [ ] Review with Jobsworth

## Phase 3: Dialogs

## Task 10: Run sheet restyle

**Description:** Restyle `RunDialog` to match spec R5:

- title and description as drawn
- Brief, then Model (`ModelPicker` with blank label "Default model"), then Extra values
- the **Advanced: change the model for individual steps** disclosure (`aria-expanded`, open
  when a draft has overrides) revealing **Step overrides (JSON)**
- **Cancel** / **Start Run** (reading **Starting…** while it starts)

Change the `runRequest` error copy to "Line {n}: write it as name=value",
`Expected {"step_id": …}` and "That is not valid JSON yet (…)". The request body doesn't
change. Update `run-launch.spec.ts`.

**Acceptance criteria:**
- [x] The labels, hints and placeholders match the artboard, and the errors are linked with
  `aria-describedby`.
- [x] The `runRequest` tests show the request body is the same for the same inputs. Only the
  messages change.
- [x] A restored draft reopens the disclosure when it has overrides.

**Verification:**
- [x] `npm run test -- --run tests/lib/runRequest.test.ts tests/components/dashboard/RunDialog.test.ts`
- [x] `npm run test:e2e -- run-launch`

**Dependencies:** T0

**Files likely touched:** `frontend/src/components/dashboard/RunDialog.svelte`,
`frontend/src/lib/runRequest.ts`, `frontend/tests/lib/runRequest.test.ts`,
`frontend/tests/components/dashboard/RunDialog.test.ts`, `frontend/e2e/run-launch.spec.ts`

**Estimated scope:** M

## Task 11: Settings frame + Defaults

**Description:** Turn `SettingsDialog` into the preferences window from spec R6:

- a header with a "Close settings" × button (no traffic lights) and the section title
- on desktop only, a `Tabs` tablist with icon + label tabs: Defaults, Services, Claude CLI
- Defaults in a new `settings/DefaultsSection.svelte`: two label/description rows using
  `ModelPicker`, plus the source hint
- the Keychain footnote on desktop only
- saved status "Saved. Changes apply to the next run."

The browser shows Defaults only, with no tab strip. Loading and saving don't change.

**Acceptance criteria:**
- [x] In the browser (`isTauri` false) there's no tablist and no Keychain text. On desktop
  (mocked) there are three tabs, navigable with the arrow keys.
- [x] No "restart" text appears anywhere in the dialog.
- [x] Saving the defaults still makes the `PUT /api/settings` call, and the existing
  `SettingsDialog` tests pass or are updated, never deleted.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/SettingsDialog.test.ts`

**Dependencies:** T0

**Files likely touched:** `frontend/src/components/dashboard/SettingsDialog.svelte`,
`frontend/src/components/dashboard/settings/DefaultsSection.svelte`,
`frontend/tests/components/dashboard/SettingsDialog.test.ts`

**Estimated scope:** M

## Task 12: Services + Claude CLI sections

**Description:** Add `settings/ServicesSection.svelte`: one disclosure row per provider, with a
Key saved or No key badge, the API key field (placeholder depending on state), Remove, and
Base URL with the design's help text and the Ollama hint.

Add `settings/ClaudeCliSection.svelte`: intro, **Where it is installed** + **Detect** with an
inline result, and **Tools AI Agent steps may use** with **Reset to Default**.

Save order doesn't change. Update `settings.spec.ts`.

**Acceptance criteria:**
- [x] Expanding and collapsing rows works with `aria-expanded`. Remove clears the saved key
  through the same `saveLlmSettings` payload as before.
- [x] Detect shows its result, and Reset to Default restores `default_allowed_tools`.
- [x] `settings.spec.ts` passes.

**Verification:**
- [x] `npm run test -- --run tests/components/dashboard/SettingsDialog.test.ts tests/lib/native`
- [x] `npm run test:e2e -- settings`
- [ ] Manual: `make desktop-dev`, saving a key, then running hello-world (needs a Mac)

**Dependencies:** T11

**Files likely touched:** `frontend/src/components/dashboard/settings/ServicesSection.svelte`,
`frontend/src/components/dashboard/settings/ClaudeCliSection.svelte`,
`frontend/src/components/dashboard/SettingsDialog.svelte`,
`frontend/tests/components/dashboard/SettingsDialog.test.ts`, `frontend/e2e/settings.spec.ts`

**Estimated scope:** M

## Checkpoint C: Dialogs

- [ ] The Run sheet and Settings match the artboard, light and dark
- [ ] Settings saves exactly as before, in the browser and in `make desktop-dev`

## Phase 4: Polish

## Task 13: Responsive + accessibility pass

**Description:** Below `md`:

- both tables become stacked rows
- the toolbar search goes full width under the toolbar
- the `ToggleGroup` scrolls inside itself
- dialogs keep 16px gutters

Then check keyboard order, focus rings, and 4.5:1 contrast for the new badge, dot and banner
colours, light and dark.

**Acceptance criteria:**
- [ ] At 375px there's no horizontal scroll on `/`, with either dialog open or closed (E2E).
- [ ] Every action can be reached with Tab and has a visible focus ring.
- [ ] The `contrast.ts` checks cover the banner and badge pairs in both themes.

**Verification:**
- [ ] `npm run test:e2e -- dashboard` (375px case)
- [ ] `npm run test -- --run tests/lib/contrast.test.ts`

**Dependencies:** T9, T12

**Files likely touched:** `WorkflowTable.svelte`, `RunTable.svelte`, `DashboardPage.svelte`,
`frontend/e2e/dashboard.spec.ts`, `frontend/tests/lib/contrast.test.ts`

**Estimated scope:** M

## Task 14: Sign-off

**Description:** Check SPEC-dashboard.md's Success Criteria 1–10 one by one. Compare
side by side in the browser and in `make desktop-dev`, light and dark. Run the full suite.

**Acceptance criteria:**
- [ ] Every Success Criterion is ticked, with the evidence noted.
- [ ] Any deviation beyond D2–D5 and "Waiting since" is written up for Jobsworth.

**Verification:**
- [ ] `npm run check && npm run lint && npm run test -- --run && npm run build:check`
- [ ] non-LLM `npm run test:e2e`
- [ ] `cargo test -p smasher-web && cargo clippy --workspace -- -D warnings`

**Dependencies:** T13

**Estimated scope:** —

## Checkpoint D: Complete

- [ ] Review with Jobsworth
- [ ] Archive `plan-dashboard.md` and `todo-dashboard.md` to `tasks/archive/`
