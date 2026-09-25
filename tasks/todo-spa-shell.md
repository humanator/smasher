# Todo: spa-shell

Plan: [`plan-spa-shell.md`](plan-spa-shell.md). Spec: [`SPEC-spa-shell.md`](SPEC-spa-shell.md).

Before any Vitest run: quit the desktop app, then from the repo root
`SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=<fake claude> cargo run -p smasher-cli -- serve`.
All commands below run from `frontend/`.

## Task 1: Shared `errorFromResponse`

**Description:** Add `src/lib/api/errors.ts` with `ApiError` and `errorFromResponse(response)`,
lifted from `workflows.ts:51-65`, and re-export it from `lib/api/index.ts`.

**Acceptance criteria:**
- [x] A JSON `{"error": "x"}` body gives an `Error` with message `x` and `.status` set to the HTTP status
- [x] A JSON body without `error`, a non-JSON body, or an empty body gives `HTTP <status>`
- [x] Two `ABOUTME:` lines at the top

**Verification:**
- [x] `npm test -- --run tests/lib/api/errors.test.ts` passes (real `Response` objects, written first and seen failing)

**Dependencies:** None

**Files:** `src/lib/api/errors.ts`, `src/lib/api/index.ts`, `tests/lib/api/errors.test.ts`

**Scope:** S

## Task 2: All four API modules throw `errorFromResponse`

**Description:** In `runs.ts`, `questions.ts`, `gallery.ts` and `workflows.ts`, change the
`!response.ok` branch of each `handleResponse` (and every direct `new Error(`HTTP …`)`) to
`throw await errorFromResponse(response)`. Delete the local `ApiError` interfaces and
`workflows.ts`'s private `errorFromResponse`. Leave the success-path handling as it is, including
`runs.ts` returning text for SVG.

**Acceptance criteria:**
- [x] `grep -n "HTTP \${" src/lib/api` matches only `errors.ts`
- [x] Against the real server, `runsApi.getRun('no-such-run')`, `questionsApi.listQuestions('no-such-run')` and a gallery/workflow 404 reject with `not found: …` and `.status === 404`
- [x] Existing inline errors (for example `RunList` and `CandidateGallery`) are unchanged in the code, but now receive the server's text

**Verification:**
- [x] Integration cases added to `tests/lib/api/runs.test.ts`, `workflows.test.ts` and `gallery.test.ts` (questions goes in `runs.test.ts`, which has no file of its own) fail first, then pass
- [x] `npm test -- --run` passes in full
- [x] `npm run check` shows only the 6 pre-existing errors

**Dependencies:** Task 1

**Files:** `src/lib/api/{runs,questions,gallery,workflows}.ts`, `tests/lib/api/{runs,workflows,gallery}.test.ts`

**Scope:** M (7 files, but each change is a few lines of the same edit)

## Checkpoint A: after Tasks 1–2
- [x] Full Vitest suite passes, and `check`/`lint` add no new errors
- [x] ~~Manual~~ covered by the real-server 404 cases in `tests/lib/api/*.test.ts` (not checked by hand): open `/runs/no-such-run` in `npm run dev`. The token counter's inline error reads `not found: …`, not `HTTP 404`.
- [x] Commit (one per task)

## Task 3: `lib/notify.ts`

**Description:** `errorMessage`, `notifyError` and `pollFailureNotifier`, as sketched in the
spec's Code Style section.

**Acceptance criteria:**
- [x] `notifyError(new Error('x'), 'fallback')` shows a toast reading `x`, and a non-Error shows `fallback`
- [x] Three `fail()` calls on one notifier show exactly one toast. `ok()` then `fail()` shows a second one.
- [x] Two notifiers with different ids show two toasts at once

**Verification:**
- [x] `npm test -- --run tests/lib/notify.test.ts` passes. The test renders the real `Toaster` from `$lib/components/ui/sonner`, asserts on the DOM, and calls `toast.dismiss()` in `afterEach`.

**Dependencies:** Task 1 (messages come from `ApiError`)

**Files:** `src/lib/notify.ts`, `tests/lib/notify.test.ts`

**Scope:** S

## Task 4: QuestionCard toasts on answer and poll failure

**Description:** Replace both `console.error` calls in `QuestionCard.svelte` with toasts. The
answer path calls `notifyError(err, 'Failed to answer question')` and doesn't call
`questionStore.answer`, so the question stays. The poll path calls
`pollFailureNotifier('questions-poll:' + runId, 'Failed to load questions')`, with `.ok()` on
success. Don't change the poll interval or the first-fetch delay; `question-card` owns those.

**Acceptance criteria:**
- [x] On a real gated run, answering an unknown question id (seeded into `questionStore`) shows a toast with the server's message, and the question is still rendered
- [x] Mounted with a nonexistent `runId`, the card shows exactly one toast after more than 3 poll ticks
- [x] No `console.error` is left in the component

**Verification:**
- [x] New cases in `tests/components/dashboard/QuestionCard.test.ts` fail first, then pass, using `App`-less rendering plus a `Toaster`
- [x] The existing QuestionCard tests still pass

**Note (2026-09-25):** the server answers an unknown question id with a 200 and
`{"success": false, "error": "question not found: …"}`, not an error status, so the card also
treats `success: false` as a failure. The poll toast closes after sonner's 4s default, so the
test checks that no more than one toast ever shows across the ticks, and none comes back.

**Dependencies:** Tasks 2, 3

**Files:** `src/components/dashboard/QuestionCard.svelte`, `tests/components/dashboard/QuestionCard.test.ts`

**Scope:** S

## Task 5: GalleryGate toasts on poll failure

**Description:** In `GalleryGate.svelte:41`, replace the empty `catch` with
`pollFailureNotifier('gallery-gate-poll:' + runId, 'Failed to load the gallery gate')`, and call
`.ok()` on success. Update the comment to say failures toast once. Leave the decision-submit
error path (`:82`) as it is, since it already shows inline.

**Acceptance criteria:**
- [ ] Mounted with a nonexistent `runId`, the gate shows exactly one toast after more than 3 ticks
- [ ] On a real run with no gate, no toast appears

**Verification:**
- [ ] New cases in `tests/components/dashboard/GalleryGate.test.ts` fail first, then pass. The existing gate tests pass.

**Dependencies:** Task 3

**Files:** `src/components/dashboard/GalleryGate.svelte`, `tests/components/dashboard/GalleryGate.test.ts`

**Scope:** S

## Checkpoint B: after Tasks 3–5
- [ ] Full Vitest suite passes, and `check`/`lint` add no new errors
- [ ] Manual, in `npm run dev`:
  - open `/runs/no-such-run`, and see one toast each from questions and the gate, not repeating;
  - close them, and they don't return while the polls keep failing
- [ ] Commit, then report to Jobsworth before Phase 3

## Task 6: `document.title` per route

**Description:** Add a derived `documentTitle` to `App.svelte` and a `$effect` that sets
`document.title` to:
- `Smasher` on `/`
- `Run {id} — Smasher`
- `Edit Workflow — Smasher`
- `New Workflow — Smasher`

The header's `pageTitle` is unchanged. Update the `index.html` `<title>` fallback to `Smasher`.

**Acceptance criteria:**
- [ ] Each route sets the title above
- [ ] After `pushState` to a run and then a `popstate` back to `/`, the title is `Smasher`
- [ ] The catalog header still reads "Smasher Pipelines"

**Verification:**
- [ ] New cases in `tests/components/AppLayout.test.ts` fail first, then pass

**Dependencies:** None

**Files:** `src/App.svelte`, `index.html`, `tests/components/AppLayout.test.ts`

**Scope:** S

## Task 7: ⚡ favicon and the `app-shell` Playwright spec

**Description:** Replace `<link rel="icon" … href="/vite.svg">` in `index.html` with the old
inline-SVG ⚡ data URI from `0e5647c^:crates/smasher-web/templates/base.html:7`. Add
`e2e/app-shell.spec.ts`, which needs no LLM run.

**Acceptance criteria:**
- [ ] `page.title()` is `Smasher` on `/` and `Run no-such-run — Smasher` on `/runs/no-such-run`
- [ ] The favicon `<link>` `href` starts with `data:image/svg+xml` and contains `26A1` (⚡), and no request for `/vite.svg` is made
- [ ] On `/runs/no-such-run`, the questions toast is visible once, and 5s later there's still one

**Verification:**
- [ ] `npm run test:e2e -- e2e/app-shell.spec.ts` passes
- [ ] `npm run build` succeeds

**Dependencies:** Tasks 4, 6

**Files:** `index.html`, `e2e/app-shell.spec.ts`, `tasks/SPEC-spa-shell.md` (Project Structure: the e2e file)

**Scope:** S

## Checkpoint C: complete
- [ ] Every item in the spec's Success Criteria is checked
- [ ] `npm test -- --run`, `npm run check` (6 pre-existing errors only), `npm run lint`, `npm run build`, `npm run test:e2e -- e2e/app-shell.spec.ts` and `make ci` all pass with no new warnings
- [ ] `capability-map-spa-repairs.md` marks `spa-shell` as Done
- [ ] Review with Jobsworth before starting the next module
