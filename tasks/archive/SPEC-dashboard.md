# Spec: `dashboard`

Module of [CAPABILITY_MAP.md](../CAPABILITY_MAP.md). Status: **Approved 2026-10-16.** Plan: [tasks/plan-dashboard.md](plan-dashboard.md).
Depends on: `shell-theme` (tokens, primitives, `stepKinds`, `AppShell`, `libraryStore`,
`pending_questions`).

Design reference: [Home](../../docs/design/redesign/Home.dc.html) (1440×900), covering the dashboard,
the Run sheet and the Settings window. Primitives come from the shell-theme component boards.

## Objective

Rebuild the home page (`/`) so someone who has never read a DOT file can see at a glance:

1. **What needs them.** A banner names the run that's waiting on a person, says what kind of
   answer it needs and how long it has waited, and takes them straight to it.
2. **What workflows exist and how each one is doing.** One table shows each workflow with its
   status, last activity and location, and has search plus Edit and Run… actions.
3. **What has run recently.** The runs table can be filtered to All, Active, Completed, or
   Failed or stopped, and shows status, workflow, start time and duration.
4. **How to start a run** without knowing about variables or node overrides. The Run sheet uses
   plain-language labels and hints, and every field is optional.
5. **How to set models and keys.** Settings becomes a macOS-preferences-style window with
   Defaults, Services and Claude CLI sections. Its copy describes what actually happens.

This module also restyles the Run and Settings dialogs. The Run dialog opens from the dashboard,
and later from workflow-detail. The Settings dialog opens from the toolbar on every page.

### Decisions made for this module (2026-10-16)

| # | Decision |
|---|---|
| D1 | Add a read-only field, `waiting_since`, to `RunSummary`. The banner shows the run that has waited longest, plus "+ N more waiting" when there are others. |
| D2 | Settings copy says changes apply to the next run, because they do. Drop "Changes apply after Smasher restarts" and the **Restart Now** button. |
| D3 | The Run sheet keeps `ModelPicker` (provider + model), restyled under the design's **Model** label and hint. Per-run provider choice stays. |
| D4 | In a browser, Settings shows only Defaults: no tab strip and no Keychain line. The desktop app shows all three sections. |
| D5 | The Settings window has no traffic lights. It uses a labelled close (×) icon button, per CAPABILITY_MAP.md's "Never: draw fake window traffic lights". |

## Requirements

### R1. Toolbar (via `AppShell`/`Toolbar` from shell-theme)

- Title **Workflows**. The subtitle is `{n} workflow(s)`, plus ` · {k} needs you` when k > 0.
  n counts the workflows the search currently shows, as the design does.
- Right side: a search input (label "Search workflows", placeholder "Search", 210px), then
  icon buttons with tooltips and accessible names: **Import .dot file** (upload),
  **AI model settings** (settings) and **New workflow** (plus, links to `/workflows/new`).
- Search matches the display title and the file name, ignoring case and surrounding spaces. It
  filters the workflows table only.
- The Settings button stays on every page's toolbar, as it is today. On other pages it is the
  same restyled dialog.

### R2. Needs-you banner

- It shows only when at least one run is `Running` with `pending_questions > 0`
  (`libraryStore.needsYou`). Otherwise nothing renders and no space is reserved.
- It features the run with the oldest `waiting_since`.
- Title: **{Workflow title} is waiting for your decision**.
- Detail line, joined with ` · `:
  - the answer kind: a gallery gate is "Pick a favourite", `approval` is "Approve or reject",
    `multiple_choice` is "Choose an option" and `free_form` is "Answer a question"
  - the candidate count when it's a gallery gate: "{c} candidate(s) ready"
  - the wait: "waiting less than a minute", "waiting {m} minute(s)" or "waiting {h} hour(s)".
    This updates at least once a minute.
- Action button: **Review Candidates** for a gallery gate, **Answer** otherwise. Both link to
  `/runs/{id}`.
- When more than one run needs you, a trailing link reads "+ {N} more waiting" and goes to
  `/?runs=needs-you#runs`.
- The kind and candidate count come from `GET /api/runs/{id}/questions` for the featured run
  only. It's refetched when the featured run or its `pending_questions` changes. If that fetch
  fails, the detail line shows just the wait, and the button reads **Open Run**.
- Landmark: `<section aria-label="Waiting for you">`.

### R3. All workflows table

- Heading **All workflows** and intro copy as drawn: "A workflow is a saved set of steps. Open
  one to see its runs, edit it, or start a new run."
- Columns: Name (title link to `/workflows/{id}`, with the file name in mono below it), Status,
  Last activity, Location (`source_dir`), and actions (**Edit** linking to
  `/workflows/{id}/edit`, and **Run…** opening the Run sheet).
- Status and last activity are derived on the client from `libraryStore.runs` (newest first).
  No new API is needed. The first matching rule wins:

  | Condition | Status badge | Last activity |
  |---|---|---|
  | any run of this workflow needs you | **Needs you** (accent) | "Waiting since {time}" from `waiting_since` |
  | any run is active | **Running** (blue dot) | "Since {started time}" |
  | latest run is Completed / Failed / Aborted | that status | `{completed_at ?? started_at}` |
  | no runs | **No runs yet** (outline) | "—" |

- Times use en-AU wording in the system time zone: "Today, 10:42 am", "Yesterday, 4:20 pm",
  then "Fri 9 Oct, 3:48 pm". Add the year when it isn't the current year.
- Rows are zebra-striped with the tokens, not hex.
- Empty states:
  - no workflows at all: "No workflows yet. Create one or import a .dot file.", with **New
    Workflow** and **Import .dot File** buttons
  - search with no matches: "No workflows match that search."
- Loading shows a skeleton of 3 rows. A load error shows an inline alert with **Try Again**.
- Import works as it does today (native dialog on desktop, file input in the browser, then the
  editor). An import error shows inline above the table.

### R4. Recent runs table

- Heading **Recent runs**, then a `ToggleGroup` filter, then the intro copy as drawn.
- Filter options, each with a live count: **All**, **Active** (any non-terminal status),
  **Completed**, and **Failed or stopped** (Failed + Aborted).
- The filter syncs with the `?runs=` query parameter, which takes `all | active | completed |
  failed`. The sidebar's `?runs=needs-you` selects **Active** and puts needs-you runs first.
  An unknown value falls back to All.
- Columns: Status badge, Workflow (title, or `graph_name`, or "Unnamed workflow", with the run
  id in mono below it), Started, and Duration. The whole row is one link to `/runs/{id}`.
- Duration:
  - finished runs show `completed_at − started_at`, as "48 s", "7 min 48 s" or "1 h 12 min"
  - active runs show "{…} so far" and tick at least every 30 s
- The status badge mapping (variant + dot token) lives in one helper and is shared with
  workflow-detail and run. Running is blue, Completed green, Aborted grey, Failed destructive,
  Needs you accent, No runs yet outline.
- Empty states: "No runs yet. Run a workflow to see it here." when there are no runs at all,
  and "No runs in this view." when the filter is empty.
- Data comes from `libraryStore`, which already polls every 5 s. `RunList` stops its own
  polling, so the page isn't polled twice.

### R5. Run sheet (`RunDialog` restyle)

- Title **Run "{Workflow title}"**. Description: "Everything here is optional. Leave a field
  blank and the workflow uses its usual behaviour."
- Fields, in this order, with the design's labels, hints and placeholders:
  1. **Brief** (textarea)
  2. **Model** (`ModelPicker`, with "Default (from Settings)" as the blank label; per D3)
  3. **Extra values** (mono textarea, `name=value`)
  4. A disclosure button, **Advanced: change the model for individual steps**, with
     `aria-expanded`. It reveals **Step overrides (JSON)**. The disclosure starts open when the
     restored draft has overrides.
- Validation and error copy:
  - Extra values: "Line {n}: write it as name=value"
  - Step overrides, bad shape: `Expected {"step_id": {"model": "...", "provider": "..."}}`
  - Step overrides, not JSON: "That is not valid JSON yet ({parser message})"
  - Errors render under their field, linked with `aria-describedby`.
- `buildRunRequest` keeps today's request body and draft behaviour. Only labels and messages
  change: "node" becomes "step" in user-facing copy.
- Buttons: **Cancel** and **Start Run**. While the run starts, the second button reads
  **Starting…** and is disabled.

### R6. Settings window (`SettingsDialog` restyle)

- About 620px wide. A header holds a close (×) icon button labelled "Close settings" (D5), the
  current section title, and, on desktop only, a `role="tablist"` with icon + label tabs:
  **Defaults**, **Services** and **Claude CLI**. The selected tab uses the accent ink.
  Arrow-key navigation comes from the Tabs primitive.
- **Defaults:** two label/description rows.
  - **Default model** and **Default provider**, using `ModelPicker` laid out as the design's
    two rows. It keeps today's provider list (see Open Question 1).
  - The current source hint stays ("Saved in the settings file." and so on).
  - On desktop, the footnote reads: "API keys are stored in your Mac's Keychain."
- **Services** (desktop only): one disclosure row per provider. Each row has a **Key saved**
  badge (green dot) or a **No key** badge (outline). Expanding a row shows:
  - **API key** (password field). Placeholder "Saved. Type to replace." or "Paste your API
    key". **Remove** shows only when a key is saved.
  - **Base URL**, with the design's help text and the Ollama hint.
- **Claude CLI** (desktop only):
  - Intro copy as drawn.
  - **Where it is installed**, with a **Detect** button. The detection result shows inline,
    as today.
  - **Tools AI Agent steps may use**, with a **Reset to Default** link.
- **Footer:**
  - On success: **Save** shows `role="status"` "Saved. Changes apply to the next run." (D2).
  - On error: an inline alert.
  - The settings file path stays as a muted, truncated line on desktop.
- What gets saved, and in what order, doesn't change: desktop keys first, then
  `PUT /api/settings`.

### R7. API addition: `waiting_since` (smasher-web, additive)

```jsonc
// GET /api/runs → runs[] and GET /api/runs/{id}, new field on RunSummary
"waiting_since": "2026-10-16T00:42:07Z" // RFC3339 UTC; the oldest pending question's creation time. null when none.
```

- `RunRecord::to_summary` takes the oldest `created_at: Instant` in the interviewer queue and
  converts it to wall-clock time as `SystemTime::now() - created_at.elapsed()`. That's accurate
  to milliseconds, and `PendingQuestion`'s 16 constructors stay untouched.
- `#[serde(default)]` keeps old persisted summaries readable. Rehydrated runs report `null`.
- TypeScript: `waiting_since: string | null` on `RunSummary`.

### R8. Responsive and accessible

- Below `md`, both tables become stacked rows:
  - workflows: title and badge, then a meta line, then actions
  - runs: badge and workflow, then a started · duration line
- The toolbar search moves to full width under the toolbar. The filter `ToggleGroup` scrolls
  inside itself. The page never scrolls sideways at 375px. Dialogs keep 16px gutters and scroll
  inside themselves.
- Use semantic headings (`h1` is the toolbar title, `h2` each section) and real links and
  buttons. Badges also carry the status as text, not colour alone.
- Visible focus rings come from the primitives. Contrast is 4.5:1 in light and dark.

## Tech Stack

No changes and no new dependencies. Svelte 5 runes, TypeScript strict, Tailwind v4,
shadcn-svelte primitives restyled in shell-theme, `@lucide/svelte`, and `Intl.DateTimeFormat` /
`Intl.RelativeTimeFormat` with `en-AU`. Backend: axum `smasher-web`, plus one field.

## Commands

```bash
cd frontend && npm run test -- --run                       # Vitest
cd frontend && npm run test -- --run tests/lib/dashboard   # just this module's helpers
cd frontend && npm run check && npm run lint               # svelte-check, eslint
cd frontend && npm run test:e2e -- dashboard settings run-launch app-shell   # non-LLM specs
cd frontend && npm run build:check                         # bundle-size guard
cargo test -p smasher-web waiting_since
cargo clippy -p smasher-web -- -D warnings && cargo fmt --all --check
make desktop-dev                                           # side-by-side check, light + dark
```

## Project Structure

```
frontend/src/components/dashboard/
  DashboardPage.svelte      → NEW: composes banner + both tables; owns search and run filter
  NeedsYouBanner.svelte     → NEW (R2)
  WorkflowTable.svelte      → NEW, replaces WorkflowCatalog's table (R3); WorkflowCatalog.svelte removed
  RunList.svelte            → reworked (R4): filter + store-driven, no own polling
  RunTable.svelte           → restyled grid rows; still shared with workflow-detail
  StatusBadge.svelte        → reads the shared status mapping
  RunDialog.svelte          → restyled (R5)
  SettingsDialog.svelte     → restyled (R6); may split into settings/{Defaults,Services,ClaudeCli}Section.svelte
frontend/src/lib/
  runStatus.ts              → + runGroup(), statusBadge(), workflowStatus()
  timeFormat.ts             → NEW: formatWhen(), formatDuration(), formatWaiting()
  questionKind.ts           → NEW: kind → "Pick a favourite" / button label
  runRequest.ts             → copy-only changes to error messages
frontend/src/lib/api/runs.ts → + waiting_since
frontend/tests/lib/         → unit tests for the helpers above
frontend/tests/components/dashboard/ → component tests per new/restyled component
frontend/e2e/dashboard.spec.ts → NEW; settings/run-launch/app-shell specs updated for new copy
crates/smasher-web/src/state.rs → R7
```

`App.svelte` renders `<DashboardPage />` in place of the `WorkflowCatalog` and `RunList` stack,
and drops the catalog's **New Workflow** header button, which moves into the toolbar per R1.

## Code Style

This follows CAPABILITY_MAP.md. Keep pure logic in `lib/` so it can be unit-tested without the DOM:

```ts
// ABOUTME: Run-status helpers shared by the dashboard, workflow page and run page
// ABOUTME: Which statuses are terminal, how runs group for filters, and how each status is badged

export type RunGroup = 'active' | 'completed' | 'failed';

export function runGroup(status: string): RunGroup {
  if (status === 'Completed') return 'completed';
  if (status === 'Failed' || status === 'Aborted') return 'failed';
  return 'active';
}
```

Copy uses en-AU spelling ("behaviour", "favourite"), sentence-case headings and Title Case
buttons, as drawn. User-facing text says "step", never "node".

## Testing Strategy

TDD per task. Write the failing test first.

- **Unit (Vitest):**
  - `runGroup`, `statusBadge` and `workflowStatus`, covering every table row in R3 and every
    status
  - `formatWhen`: today, yesterday, this year, last year, and the am/pm form
  - `formatDuration`: seconds, minutes, hours and "so far"
  - `formatWaiting`: under 1 min, singular and plural
  - `questionKind`: each of the four kinds
  - `buildRunRequest`: the new error copy
  - filter ↔ query-string parsing, including `needs-you` and unknown values
- **Component (Vitest + Testing Library, queried by role and label):**
  - `NeedsYouBanner`: hidden, gallery, approval, more than one waiting, and a failed
    questions fetch
  - `WorkflowTable`: loading, error, empty, search with no matches, populated, and each status
  - `RunList`: each filter, counts, both empty states, and the duration ticking (with fake
    timers)
  - `RunDialog`: labels, the disclosure, both validation errors, and a restored draft
  - `SettingsDialog`: browser shows Defaults only; desktop shows three tabs; Services expand
    and Remove; saved status copy; no "restart" text anywhere
- **Integration:**
  - Rust test that `waiting_since` is null with no questions, equals the oldest of two
    questions, and is null again once both are answered
  - Rust test that an old summary without the field deserialises
- **E2E (Playwright, real `smasher-web`, no LLM workflows):** a new `dashboard.spec.ts`
  covering:
  - search filters the table
  - Run… opens the sheet, launches and lands on the run
  - the filter and `?runs=` stay in sync
  - a human-gate workflow raises the banner with "waiting", and answering it clears the banner
    within a poll
  - no horizontal scroll at 375px

  Update `settings.spec.ts`, `run-launch.spec.ts` and `app-shell.spec.ts` selectors and copy.
  Don't delete any spec.
- Zero warnings from check, lint, Vitest and clippy.

## Boundaries

- **Always:** everything in CAPABILITY_MAP.md's Always list; derive data from the API (counts, times
  and durations are never hard-coded); keep one status → badge mapping.
- **Ask first:**
  - any API change beyond `waiting_since`
  - adding "Infer from model name" or "Claude CLI" as provider choices if that needs backend
    work
  - removing a field or behaviour the current Run or Settings dialogs have (for example the
    settings-source hint or the settings path)
  - changing `ModelPicker`'s behaviour for the node editor, as opposed to adding layout props
- **Never:** draw traffic lights in the Settings window; promise a restart; run LLM-spending
  tests; push or open a PR unasked.

## Success Criteria

1. At 1440×900, `/` matches the Home artboard in layout, hierarchy, copy and tokens, light and
   dark, in the browser and in `make desktop-dev`. The only deviations are D2–D5 and "Waiting
   since {time}" in Last activity.
2. With one waiting gallery gate, the banner reads "Pick a favourite · {c} candidates ready ·
   waiting {m} minutes" and **Review Candidates** opens the run. Once the run is answered, the
   banner disappears within 5 s.
3. Every workflow row shows the status and last activity given by the R3 table. Search filters
   by title and file name.
4. The four run filters show correct counts and rows, and survive a reload through `?runs=`.
   The sidebar's **Needs you** and **Recent runs** links land on the right filter.
5. Durations tick for active runs and are fixed for finished ones.
6. A run launched from the sheet sends the same request body as before this module (the E2E
   checks brief, model and an extra value on the run page).
7. Settings saves defaults, keys and CLI settings exactly as before. Browser shows Defaults
   only, and no copy mentions restarting.
8. `GET /api/runs` includes `waiting_since`, and its Rust and Vitest integration tests pass.
9. At 375px there's no horizontal scroll, and every action is reachable by keyboard with a
   visible focus ring.
10. check, lint, Vitest, non-LLM E2E, `cargo test -p smasher-web` and clippy all pass with zero
    warnings.

## Open Questions

1. **Default provider choices.** The design offers "Infer from model name" and "Claude CLI" in
   the provider select. Today `PUT /api/settings` needs an explicit provider, and claude-cli is
   configured separately. The spec keeps today's list. Should a later change add these two
   choices, and does this module own it?
2. ~~Last activity for needs-you workflows.~~ **Resolved 2026-10-16:** "Waiting since {time}"
   is fine.
3. ~~shell-theme manual checks.~~ **Resolved 2026-10-16:** every check in
   `tasks/archive/todo-shell-theme.md` is signed off. See
   [VERIFICATION-shell-theme.md](../VERIFICATION-shell-theme.md).
