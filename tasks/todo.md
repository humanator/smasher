# Todo: Frontend CI

Spec: [`SPEC-frontend-ci.md`](SPEC-frontend-ci.md) · Plan: [`plan.md`](plan.md)

## Phase 1: #30

- [x] **Task 1: fix the `WorkflowCanvas.svelte:527` type error**
  - Acceptance: that error is gone; no `@ts-ignore`/`as any`; editor behaviour unchanged.
  - Verify: `npm run check`; `npx vitest run tests/components/dashboard/WorkflowEditorPage.test.ts`; `npx playwright test node-editor.spec.ts`.
  - Files: `frontend/src/components/node-editor/WorkflowCanvas.svelte` (+ the type's source if it needs narrowing there).
- [x] **Task 2: fix the `tests/setup.ts` and `gallery-gate.spec.ts` errors**
  - Acceptance: `npm run check` → 0 errors, 0 warnings.
  - Verify: `npm run check`; full `npx vitest run` against a local fake-claude `serve`; `npx playwright test gallery-gate.spec.ts`.
  - Files: `frontend/tests/setup.ts`, `frontend/e2e/gallery-gate.spec.ts`.

**Checkpoint A:** check is clean and the suites are green. Commit, then pause for review.

## Phase 2: #31

- [x] **Task 3: bundle-size check (red first)**
  - Acceptance: `npm run build:check` fails on the current single 567 kB chunk.
  - Verify: run it and see the failure message name the chunk.
  - Files: `frontend/scripts/check-bundle-size.mjs`, `frontend/package.json`.
- [x] **Task 4: lazy-load the node editor pages**
  - Acceptance: `build:check` passes; no chunk-size warning; editor routes still load.
  - Verify: `npm run build:check`; editor Vitest tests; `npx playwright test node-editor.spec.ts`; manual check of Edit + New Workflow.
  - Files: `frontend/src/App.svelte`.

**Checkpoint B:** commit, then pause for review.

## Phase 3: #2

- [x] **Task 5: add `.nvmrc` and the `frontend` job**
  - Acceptance: the job matches the plan's step list, with the fake-claude env and the empty-log assertion.
  - Verify: `actionlint` if available, otherwise a YAML parse; a local dry run of the same commands in a fresh temp data dir passes.
  - Files: `.nvmrc`, `.github/workflows/ci.yml`.
- [x] **Task 6: prove it on `myfork`** *(pushes, so confirm with Jobsworth first)*
  - Acceptance: `Frontend` is green on the PR against `myfork/main`.
  - Verify: `gh run watch -R humanator/smasher`.
  - Files: none new (fixes only if CI shows a real difference).
- [x] **Task 7: red/green proof**
  - Acceptance: a deliberately failing Vitest assertion turns `Frontend` red, and the revert turns it green.
  - Verify: the two run URLs, recorded in the PR description.
  - Files: one test file, temporarily.

**Checkpoint C:** pause for review.

## Phase 4: close-out

- [x] **Task 8: docs and backlog**
  - Acceptance: the backlog gotcha notes CI handles the server; #2/#30/#31 are marked done with the Chromium decision; the docs say how CI runs the SPA.
  - Verify: read it through.
  - Files: `tasks/BACKLOG.md`, `docs/quickstart.md` (or a CI section).
