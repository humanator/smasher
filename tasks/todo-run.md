# Todo: `run`

Plan: [plan-run.md](plan-run.md). Spec: [SPEC-run.md](SPEC-run.md).

Shared commands (from `frontend/` unless noted):

- `npm run test -- --run <path>`; `npm run check`; `npm run lint`; `npm run build:check`;
  `npm run test:e2e -- <spec>`
- Rust (repo root): `cargo test -p smasher-web`, `cargo test -p smasher-desktop`,
  `cargo clippy -p <crate> -- -D warnings`, `cargo fmt --all --check`

Vitest integration tests and E2E need `npm run dev:backend`. Never run LLM-spending tests
(`critical-path`, LLM runs). TDD every task: failing test, code, commit while green.

## Phase 1: Server and desktop

- [ ] **Task 1: `resumable` on `RunSummary`**
  - Description: add `resumable: bool`, true for Failed/Aborted runs whose
    `checkpoints/checkpoint.json` exists and parses.
  - Acceptance: failed run with checkpoint → true; failed without → false; completed → false;
    running → false; unknown fields don't break existing clients.
  - Verify: `cargo test -p smasher-web`; clippy.
  - Files: `crates/smasher-web/src/routes/api.rs`, `docs/api-reference.md`, `frontend/src/lib/api/runs.ts` (type only).
  - Depends on: none. Scope: S.

- [ ] **Task 2: `GET /api/runs/{id}/steps`**
  - Description: nodes (`id`, `node_type`, `label`) and edges (`from`, `to`, `label?`, `priority?`,
    `loop_restart?`) from the run's stored graph; live from state, finished from `graph.dot`.
  - Acceptance: live run, rehydrated run, unknown id (404), unparsable graph (200, empty lists).
  - Verify: `cargo test -p smasher-web`; clippy.
  - Files: `routes/api.rs`, `rehydrate.rs` (read helper if needed), `docs/api-reference.md`.
  - Depends on: none. Scope: M.

- [ ] **Task 3: Resume keeps its workflow link and checkpoints**
  - Description: `resume_run` passes the original `workflow_id` and `use_checkpointing: true`.
  - Acceptance: resumed run lists under its workflow; a resumed run that fails is itself
    resumable (checkpoint written); ad-hoc runs still resume with `workflow_id: None`.
  - Verify: `cargo test -p smasher-web`; clippy.
  - Files: `routes/api.rs`.
  - Depends on: none. Scope: S.

- [ ] **Task 4: Reveal a run folder (desktop)**
  - Description: `validate_reveal_run_dir` (existing directory inside the runs base dir, symlinks
    and `..` resolved) and a `reveal_run_folder` command using `open -R`. Register in `COMMANDS`,
    `build.rs`, capability file and `main.rs`; add `revealRunFolder` to `lib/native`.
  - Acceptance: refuses files, missing paths, `..` escapes, symlink escapes and paths outside the
    runs dir; accepts a run folder; `capabilities_test` passes.
  - Verify: `cargo test -p smasher-desktop`; clippy; `npm run test -- --run tests/lib/native`.
  - Files: `reveal.rs`, `commands.rs`, `main.rs`, `build.rs`, `capabilities/served-origin.json`,
    `frontend/src/lib/native/index.ts`.
  - Depends on: none. Scope: M.

### Checkpoint: Phase 1
- [ ] Rust tests, clippy and fmt clean for both crates.
- [ ] Review with Jobsworth before building UI on the new API.

## Phase 2: Client and logic

- [ ] **Task 5: API client**
  - Description: `getRunSteps`, `RunSummary.resumable`, and the `StepsResponse` type; make
    `resumeRun` return the new run id usable by the page.
  - Acceptance: integration test against real `smasher-web` for live and finished runs.
  - Verify: `npm run test -- --run tests/lib/api`; check.
  - Files: `lib/api/runs.ts`, `tests/lib/api/runs.test.ts`.
  - Depends on: 1, 2. Scope: S.

- [ ] **Task 6: `runProgress.ts`**
  - Description: `stepProgress(steps, events)` → per step `state`, `runs`, `durationMs`,
    `wentBack`; plus `currentStep`, `doneCount`, `elapsed`. Meta-line text helper
    ("Ran twice · 2m 41s", "Waiting for you", "Stopped with an error").
  - Acceptance: single pass, loops, failure, waiting, answered, aborted; replaying the same
    events twice gives the same result; steps seen only in events are appended when `steps` is empty.
  - Verify: `npm run test -- --run tests/lib/runProgress.test.ts`.
  - Files: `lib/runProgress.ts`, test with recorded event sequences in `tests/fixtures/`.
  - Depends on: none. Scope: M.

- [ ] **Task 7: `failureAdvice.ts`**
  - Description: error string → list of suggestions. Table of known patterns (missing
    `candidate_dir`, tool exited non-zero, render timeout, missing API key, model/provider
    error) plus the generic fallback; never states a cause not in the error.
  - Acceptance: each pattern, fallback for unknown, fallback for null, no duplicates.
  - Verify: `npm run test -- --run tests/lib/failureAdvice.test.ts`.
  - Files: `lib/failureAdvice.ts`, test.
  - Depends on: none. Scope: S.

- [ ] **Task 8: Plain event vocabulary**
  - Description: `formatEvent` returns plain `label`/`detail`, `tone` and `level` for all 17
    kinds, using step labels from a map; step names replace raw node ids.
  - Acceptance: every kind covered; key vs all split as in R6; unknown node id falls back to the id.
  - Verify: `npm run test -- --run tests/lib/eventFormat.test.ts`; existing `EventLog` tests
    updated, not deleted.
  - Files: `lib/eventFormat.ts`, `tests/lib/eventFormat.test.ts`, `components/dashboard/EventLog.svelte` (label use only).
  - Depends on: none. Scope: M.

### Checkpoint: Phase 2
- [ ] `npm run test -- --run`, check, lint clean; `/runs/{id}` looks unchanged.

## Phase 3: Page

- [ ] **Task 9: `RunPage`, toolbar and hero**
  - Description: new `components/run/RunPage.svelte` loads run, steps and events, sets the page
    header (back, title, badge, subtitle, Abort Run / Run Again, panel toggle, divider) and renders
    `RunHero` for running, completed (with Show Results in Finder via Task 4), failed (message,
    What you can try, Open in Editor, Run Again) and aborted. `App.svelte` mounts `RunPage`;
    the old sections stay below it for now.
  - Acceptance: R1 and R2 for every state; loading and not-found; abort works; Run Again opens
    the dialog for workflow runs and is hidden for ad-hoc runs; hero is `aria-live` only while running.
  - Verify: component tests per state; `npm run check`; manual at 1440×900 against the artboard.
  - Files: `components/run/RunPage.svelte`, `RunHero.svelte`, `RunToolbarActions.svelte`,
    `App.svelte`, tests.
  - Depends on: 5, 6, 7, 4. Scope: L (split by file if it passes 5 files: hero in 9b).

- [ ] **Task 10: Resume**
  - Description: **Resume from {step}** in the toolbar and in the failed/stopped hero when
    `resumable`; posts, shows "Resuming…", navigates to the new run; inline error on failure.
  - Acceptance: shown only when resumable; Run Again demoted to outline beside it; new id opens
    the new run; failure leaves the page usable.
  - Verify: component tests; integration test resumes a real failed `fail_tool.dot` run
    (no LLM) and checks the new run belongs to the workflow.
  - Files: `RunHero.svelte`, `RunToolbarActions.svelte`, tests.
  - Depends on: 3, 9. Scope: S.

- [ ] **Task 11: Candidates, Decision bar, Your decisions**
  - Description: `Candidates` grid (select toggle, chosen badge, failed tile, scorecard badges,
    notes), `DecisionBar` (status line, tooltip, generic edge buttons, inline error), and
    `DecisionsCard`. Replaces `GalleryGate`, `CandidateGallery`, `DecisionHistory` in the page.
  - Acceptance: R3, R4, R5; Approve disabled with nothing selected; submits once; comments are
    trimmed and sent as today; three-edge gate shows an extra button; stacks at 375px.
  - Verify: component tests for the states above; `gallery.test.ts` still green; check.
  - Files: `components/run/Candidates.svelte`, `DecisionBar.svelte`, `DecisionsCard.svelte`,
    `RunPage.svelte`, tests. Retire the three old components and move their tests.
  - Depends on: 9. Scope: L (split Candidates / DecisionBar if needed).

- [ ] **Task 12: Question gates (D6)**
  - Description: restyle `QuestionCard` as the main-column card under the hero (choice, yes/no,
    free text), keeping reply behaviour and notifications.
  - Acceptance: every question kind still answerable; keyboard works; the Needs-you hero shows
    the question text once, not twice.
  - Verify: `QuestionCard.test.ts` updated and green; check.
  - Files: `QuestionCard.svelte` (moved to `components/run/`), test.
  - Depends on: 9. Scope: M.

### Checkpoint: Core flows
- [ ] Run → pause → answer (question and gallery) → completes, by hand in the browser.
- [ ] Full Vitest twice, check, lint, build:check clean.

- [ ] **Task 13: Panel and Progress tab**
  - Description: `RunPanel` (300px, tabs, per-viewer remembered open state, sheet below 768px)
    and `ProgressList` (R6 Progress).
  - Acceptance: tabs by arrow keys and roving tabindex; toggle `aria-pressed/expanded`; state
    glyphs `aria-hidden` with text state; matches the artboard rows.
  - Verify: component tests incl. localStorage throwing; check.
  - Files: `components/run/RunPanel.svelte`, `ProgressList.svelte`, tests.
  - Depends on: 6, 9. Scope: M.

- [ ] **Task 14: Activity tab**
  - Description: `ActivityLog` with Key moments / Everything toggle, help text, indent, tint,
    scroll anchoring and the first-waiting notification moved from `EventLog`.
  - Acceptance: R6 Activity; default Key moments; notification fires once; scroll position
    holds while new lines arrive.
  - Verify: ported `EventLog` tests green; `event-log.spec.ts` updated.
  - Files: `ActivityLog.svelte`, `RunPanel.svelte`, `EventLog.svelte` (retired), tests.
  - Depends on: 8, 13. Scope: M.

- [ ] **Task 15: Details tab and retire the old page**
  - Description: `RunDetails` (Started, tokens with polling, working folder). Remove
    `RunDetail`, `RunMetaList`, `TokenCounter` and graph polling; delete the old composition from
    `App.svelte`.
  - Acceptance: R6 Details; no references to retired components; bundle guard passes.
  - Verify: full Vitest, check, lint, `npm run build:check`.
  - Files: `RunDetails.svelte`, `App.svelte`, deleted components and their tests (moved, not dropped).
  - Depends on: 11, 12, 14. Scope: M.

### Checkpoint: Old page retired
- [ ] All gates clean; `grep` finds no use of retired components.

## Phase 4: Proof

- [ ] **Task 16: E2E**
  - Description: `run-page.spec.ts` against `gate_only.dot` and `fail_tool.dot`: running →
    needs you → select, note, approve → completed; failed with advice and Resume; panel and tabs
    by keyboard with focus rings; 375px with no sideways scroll. Update `gallery-gate`,
    `question-card`, `question-replies`, `run-summary`, `event-log`, `no-tauri-breakage`
    selectors (edit `critical-path`, do not run it).
  - Acceptance: all non-LLM specs pass; none deleted.
  - Verify: `npm run test:e2e` (excluding `critical-path`).
  - Files: `e2e/run-page.spec.ts` and the specs above.
  - Depends on: 15. Scope: M.

- [ ] **Task 17: Visual, accessibility and wrap-up**
  - Description: side-by-side with the artboard at 1440×900 in light and dark and in
    `make desktop-dev`; contrast check of hero tints and text; write `VERIFICATION-run.md`;
    archive the spec, plan and todo.
  - Acceptance: spec Success Criteria 1–9 each ticked with evidence; zero warnings everywhere.
  - Verify: all gates; Jobsworth reviews the screenshots.
  - Depends on: 16. Scope: S.

### Checkpoint: Complete
- [ ] Every success criterion in the spec met.
- [ ] Ready for review. No push or PR without Jobsworth's say-so.
