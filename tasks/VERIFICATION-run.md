---
status: complete
source: tasks/archive/SPEC-run.md, tasks/archive/plan-run.md, tasks/archive/todo-run.md
e2e_excluded:
  - "critical-path: spends LLM tokens, never run"
gate_covered:
  - "SC2 approve/iterate and the disabled Approve button: DecisionBar.test.ts, Candidates.test.ts, run-page.spec.ts"
  - "SC3 failure advice and the generic fallback: failureAdvice.test.ts, RunHero.test.ts, run-page.spec.ts"
  - "SC4 loop counts and replay: runProgress.test.ts, ProgressList.test.ts"
  - "SC5 Key moments vs Everything with tool, agent and token lines: eventFormat.test.ts, ActivityLog.test.ts"
  - "SC6 Show Results in Finder path rules: cargo test -p smasher-desktop (validate_reveal_run_dir)"
  - "SC7 keyboard and focus rings: run-page.spec.ts"
  - "SC8 no sideways scroll at 375px: run-page.spec.ts"
started: 2026-11-02T00:00:00Z
updated: 2026-11-02T00:00:00Z
---

## Automated gates (this run)
- cargo fmt --all --check: pass
- cargo clippy --workspace --all-targets -- -D warnings: pass
- cargo test --workspace: pass (3361 passed, 0 failed across 52 test binaries)
- check: pass (0 errors, 0 warnings)
- lint: pass
- build:check: pass (21 JS chunks, all under 500 kB)
- vitest: **not clean.** Two full runs: 7 failed / 1367 passed, then 8 failed / 1366 passed (1 skipped).
  The failures were in `AppLayout.test.ts`, `DashboardPage.test.ts` and `tests/stores/library.test.ts`
  and differed between runs: 5 s `waitFor` timeouts and "expected 'running' to be null". They are
  the real-server tests, which share the test server with everything else; its data dir now holds
  about 3,900 runs and the first run overlapped a `cargo test` build. Re-run alone, the three files
  gave 5 failures at the default timeout, 1 at `--testTimeout=30000`, and that one
  ("follows back navigation from a run page to the catalog") passed twice on its own. None of the
  failing tests touch code this task changed. I could not get a fully green full run. The same
  `library.test.ts` flake is recorded in VERIFICATION-workflow-detail.md.
- e2e: `run-page.spec.ts` pass (6/6), run against the Vite dev server on 5173 and the already-running
  `smasher-web` (fake `claude`). No other spec was run here, and `critical-path` was not run.
  `/private/tmp/claude-501/fake-claude.log` was empty before and after.

Test server: `smasher-web` with the fake `claude` and `SMASHER_DATA_DIR=/private/tmp/claude-501/smasher-data`.
Runs were made without an LLM: tool-only DOTs (a `sleep` step, a failing `exit 3` step) and a
tool-then-gallery-gate DOT with two seeded candidates, the same pattern as `e2e/run-page.spec.ts`.
Screenshots (Chromium via Playwright, scripted; the Vite dev server served the page) are in
[`tasks/verification-run/`](verification-run/).

## Success criteria

### SC1. At 1440×900 each of the four states matches the artboard
result: pass for copy, hierarchy and tokens; **no pixel comparison**.
evidence: screenshots `running-`, `waiting-`, `completed-`, `failed-` and `aborted-` with `light.png`
or `dark.png` in `tasks/verification-run/`. The hero copy was checked against the strings in
`docs/design/redesign/Run.dc.html` (Now running, Finished in …, … couldn't finish, What you can try,
Nothing selected yet. Select the candidates you want to keep., the decision-bar and panel wording,
"Stopped with an error", the Expected/found line). The artboard file is in the repo, but it loads a
`support.js` that isn't (the README says these files won't render offline), so I could not put it
beside the page. Read the screenshots against the artboard's source, not against its render.

### SC2. A waiting gallery run is decided with the decision bar; Approve is disabled until something is selected
result: pass
evidence: `waiting-light.png` shows "Nothing selected yet…" and a disabled Approve Selected.
`run-page.spec.ts` "a run goes from running to needs you to completed" selects concept-b, adds a
note, approves with the bar, lands on Completed with "You approved concept-b", the decision on
the server (`approve`, `["concept-b"]`) and a Chosen badge. I also approved a second run over the
API and screenshotted its completed page. Iterate ("Try Again with My Notes") is covered by
`DecisionBar.test.ts`; it was not driven live.
caveat: see issue 1 (the repo's real gates use `proceed`, not `approve`).

### SC3. A failed run shows the step, the engine message and a suggestion; an unmatched error shows the message and the generic suggestion
result: pass
evidence: `failed-light.png`/`failed-dark.png`: "Check the build couldn't finish", the mono
message "Exit code 3.", "What you can try" with one suggestion, "Steps that already finished
aren't repeated." and Resume from Check the build. The e2e asserts the same on `fail_tool.dot`.
The fallback for an unmatched error is covered by `failureAdvice.test.ts`; I did not provoke an
unmatched error live.

### SC4. Progress matches the run, in running order, with loop counts, identical after a reload
result: pass for order, state and reload; loop counts only in unit tests
evidence: for a waiting and a failed run I read the Progress rows, reloaded the page, and read them
again: identical both times ("Start · 0ms / Prepare the concepts · Tool · 1.0s / Pick a favourite ·
Ask a person · Waiting for you / Approved / Iterated / Exit · Not started"). "Ran twice ·
went back once" is covered by `runProgress.test.ts` and `ProgressList.test.ts` against recorded event
sequences; I didn't run a looping workflow live (the tool-only graphs I used have no loop).

### SC5. Activity defaults to Key moments; Everything adds tool calls, agent text and token lines
result: pass for the default and the toggle; the extra line kinds are covered by unit tests only
evidence: on a completed run the Activity tab opens on Key moments (50 lines of text in the
panel); choosing Everything grows it to 77. Tool-call, agent and token lines come only from LLM
agent steps, which these runs don't have; `eventFormat.test.ts` and `ActivityLog.test.ts`
cover them with recorded events.

### SC6. Abort, Run Again, Open in Editor and (desktop) Show Results in Finder appear only when they apply
result: pass in the browser; Show Results in Finder partial
evidence: buttons read from the page for each state:
- running: Abort Run
- needs you: Abort Run
- completed (ad-hoc run): none (Run Again hidden: no workflow)
- failed (ad-hoc): Resume, Resume from {step}; no Run Again, no Open in Editor
- aborted (ad-hoc): Resume, Resume from {step}
- failed, workflow-backed (a workflow imported for this check): Resume, Run Again, Resume from
  {step}, Open in Editor (to `/workflows/{id}/edit`), Run Again; the Back link reads "Back to
  Verify-run-fail" and goes to `/workflows/{id}`. Run Again opens the Run dialog.
- Show Results in Finder is desktop-only and isn't in the browser, as designed.
`failed-workflow-light.png` is the workflow-backed failed page.
not verified: Show Results in Finder in the real app. `make desktop-dev` was **not run**. The
button was only tested with a stand-in invoke in Vitest; the path rules are covered by
`cargo test -p smasher-desktop`.

### SC7. Every control reachable by Tab with a visible focus ring; tabs by arrow keys
result: pass
evidence: `run-page.spec.ts` "the panel and its tabs work from the keyboard" (toggle with Enter,
tabs with ArrowLeft/ArrowRight, ring checked on the toggle, Progress and Activity tabs) and "the hero
buttons of a failed run can be reached by Tab" (Resume has a ring). Not every control was
checked: I did not Tab through the decision-bar buttons or the candidate Select toggles, or
check their rings, live.

### SC8. 375px: no sideways scroll with a candidate grid, the decision bar and the sheet open
result: pass
evidence: `waiting-375.png` (decision bar stacked, candidate grid), `running-sheet-375.png` (sheet
open) and `failed-375.png`. Measured `scrollWidth - innerWidth` = 0 on all three, and the e2e
"never scrolls sideways" passes (it also asserts the Approve button is over 300px wide).

### SC9. All gates pass with zero warnings
result: partial. Everything is clean (cargo, clippy, fmt, check, lint, build:check, run-page e2e, 0 warnings) except the full Vitest run, which has flaky real-server failures (see Automated gates).

## Contrast
Computed in the page, from the real computed styles (text colour and every ancestor's background
composited, translucent tints included), over the toolbar, hero, decision bar, candidate cards
and the Run information panel, in light and dark, for all five states: 688 text nodes. Needed:
4.5:1 for text, 3:1 for large text and UI. Disabled controls are exempt and the sheet/hero tint
fills are decorative (tint against page: 1.0 to 1.25:1; the text on them is what counts).

| Where | Light | Dark |
|---|---|---|
| Hero heading (all states) | 15.7 to 16.8 | 12.3 to 15.3 |
| Hero body text | 10.6 | 8.8 to 9.9 |
| Hero eyebrow "Now running" | 4.74 | 5.56 |
| Needs you eyebrow (accent) | 7.88 | 9.19 |
| Failed hero mono message | 16.8 | 13.1 |
| Resume button (white on primary) | 6.04 | 4.60 |
| Status badges in the toolbar | 5.13 to 14.77 | 4.60 to 11.28 |
| Toolbar subtitle (id, started, elapsed) | 5.07 | 6.48 |
| Abort Run | 6.04 | 4.87 |
| Decision bar help text | 5.07 | 4.6 or more |
| Panel text, lowest row | 4.51 (timestamp) | 4.77 |
| Candidate "Chosen" badge | 4.65 | 5.56 or more (card text) |

Two misses were found, fixed with a failing test first (commit `b79a7a87`) and re-measured:
- "Add a Note…" in dark mode: 3.11:1 (primary pink on the card). It now uses the same
  `dark:text-primary-subtle-foreground` the Claude CLI settings link uses: 7.89:1 dark, 6.04:1 light.
- The current Progress step's meta line (11px) in light: 4.45:1 on the highlight. It now uses
  `text-foreground-secondary`: 9.96:1.

Nothing is below 4.5:1 after the fixes. Caveats: the disabled Approve Selected button is
measured without its opacity (it looks faint by design and is exempt); the 4.60:1 on white-on-pink buttons in
dark mode is the tightest pass.

## Issues
### 1. The Decision bar treats `proceed` as a generic button, not Approve (open decision)
severity: major, needs a decision from Jobsworth
The repo's own gallery workflows use `proceed` and `iterate` on their gates (the test graph
`GALLERY_GATE` in `tests/fixtures/graphs.ts` is built the same way). `decisionEdges.ts` only
names `approve` and `iterate`; `proceed` becomes an extra outline button reading "Proceed", with
no check icon, and Approve Selected is absent, so the main action has no emphasis. Nothing is
lost (every edge is still a button and the decision submits as spelled), but the real workflows
don't get the design's Approve button. Options: treat `proceed` as the approving edge, or rename
the edges in the workflows.

### 2. The hero's question can lag the Question card by up to 5 s after an answer
severity: minor
The hero polls the run every 5 s; the Question card polls every 2 s. After an answer the card
clears first and the hero can still show the old question for up to 5 s.

### 3. Orphaned code
severity: minor, cleanup
- `renderGraph` in `src/lib/api/runs.ts`: no callers.
- `src/lib/sanitizeSvg.ts` (and its test): no callers outside the test.
- `src/lib/graphError.ts`: **still used** by `WorkflowDetailPage.svelte`, so it is not orphaned,
  correcting the earlier note.
Nothing removed; the spec's "retire the Pipeline Graph" (D4) left the first two behind.

### 4. No pixel comparison with the artboard
severity: not a defect
The artboard source is in the repo (`docs/design/redesign/Run.dc.html`) but it needs a
`support.js` that is not, so it doesn't render. See SC1.

### 5. Show Results in Finder not proven in the real app
severity: gap
`make desktop-dev` was not run. Only the stand-in invoke test and `cargo test -p smasher-desktop`.

### 6. A stopped run's step reads "Stopped with an error"
severity: minor
On an Aborted run the interrupted step shows a red X and "Tool · Stopped with an error" in
Progress. The hero says "Stopped by you". The artboard uses the same words for a failed step, so
this follows the design, but for a run the user stopped it reads as an error.

### 7. "No pending questions." sits under the hero on running, failed, aborted and completed runs
severity: minor
`QuestionCard`'s empty state shows below the hero when nothing is pending (see
`running-light.png`, `failed-dark.png`). It's noise on a failed or finished run. Not in the artboard.

### 8. Test-data leftovers (not in the repo)
A workflow `verify-run-fail` was imported into the test data dir for SC6 (the API has no delete
for workflows, `DELETE` returns 405). It lives under `SMASHER_DATA_DIR`, not in the repo. All runs
this check left active were aborted.
