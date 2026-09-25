# Plan: Frontend CI (#30 → #31 → #2)

Spec: [`SPEC-frontend-ci.md`](SPEC-frontend-ci.md). Branch: `feat/frontend-ci`
(from `main`). CI proven on `myfork`.

## Order and why

The three items run in sequence, and each leaves the branch green:

1. **#30 first:** the CI job runs `npm run check`, so it has to pass before
   the job exists.
2. **#31 second:** the job runs `npm run build`. Splitting the bundle before
   the job lands means the job never needs a "warnings allowed" exception.
3. **#2 last:** it builds on both. It's also the only part that needs a push.

Nothing can run in parallel usefully. Each piece is small, and the three touch
separate files except `BACKLOG.md`.

## Phase 1: #30, check to zero (Tasks 1–2)

The fixes are type-only, and every one must be a real fix: no `@ts-ignore`, no
`as any`.
- `WorkflowCanvas.svelte:527`: narrow the `Record<string, unknown>` to
  `Record<string, AttrValue>` at its source, or validate it into one, whichever
  matches where the value comes from.
- `tests/setup.ts:14`: stop redeclaring `EventSource`. Assign the polyfill to
  `globalThis.EventSource` with a cast to `typeof EventSource`.
- `gallery-gate.spec.ts:87-89`: assert the values exist (`expect(x).toBeDefined()`
  plus a narrowing guard) before use.

**Checkpoint A:** `npm run check` → 0 errors. Vitest (against a local
`smasher serve` with the fake claude) and `node-editor.spec.ts` +
`gallery-gate.spec.ts` stay green.

## Phase 2: #31, split the bundle (Tasks 3–4)

- Test first: `scripts/check-bundle-size.mjs` (in `frontend/`) reads
  `dist/assets/*.js`. It fails if any chunk is over 500 kB, or if there's only
  one JS chunk. `npm run build:check` = `vite build && node
  scripts/check-bundle-size.mjs`. It fails on today's build.
- Then lazy-load `NewWorkflowPage` and `WorkflowEditorPage` from `App.svelte`,
  the only importers of `@xyflow/svelte`/`dagre`. `QuestionCard`'s markdown
  only lands with #28, so leave it alone here and re-check after the rebase.

**Checkpoint B:** `npm run build` prints no chunk warning, and `build:check`
passes. The editor Vitest tests and `node-editor.spec.ts` pass. By hand: open
Edit and New Workflow in `smasher serve` and check the editor loads.

## Phase 3: #2, the CI job (Tasks 5–7)

- `.nvmrc` = `22`.
- `frontend` job in `ci.yml`, `needs: [fmt]`. Steps: checkout → rust stable +
  `rust-cache` (`ci-frontend`) → `setup-node` (`node-version-file: .nvmrc`,
  npm cache on `frontend/package-lock.json`) → `npm ci` → check → `npx eslint
  .` → `build:check` → `cargo build -p smasher-cli` → start `serve` in the
  background with the fake-claude env, and poll `/api/workflows` until it
  answers (60s cap) → `npx vitest run` → `npx playwright install --with-deps
  chromium` → `npx playwright test` → assert `FAKE_CLAUDE_LOG` is empty/absent →
  upload `playwright-report/` + the server log (`if: failure()`).
- Local dry run of the same sequence in a fresh temp data dir, before pushing.
- Push to `myfork` and open a PR against `myfork/main`. The job must go green.
  Then push one commit with a deliberately failing Vitest assertion, see the
  job go red, and revert it.

**Risks:**
- **Vitest real-API tests on a slower runner:** use the existing timeouts, and
  ask before raising any.
- **Playwright's `webServer` (`npm run dev`) and the proxy:** CI sets
  `reuseExistingServer: false`, which is fine because nothing else is on 5173.
- **`cargo build -p smasher-cli` may need the Tauri apt deps:** add the
  composite action if the build says so.
- **The Rust jobs will still be red (#32):** judge only `Frontend`.
- **#27's `ENOTEMPTY` race could flake in CI:** if it shows up, stop and ask.
  Don't add retries.

**Checkpoint C:** the PR's `Frontend` job is green, the red/green proof is
done, and the artifacts upload on failure.

## Phase 4: Close-out (Task 8)

Docs note on how CI runs the SPA (the gotcha paragraph in `BACKLOG.md` becomes
"CI does this for you"). Mark #2/#30/#31 done, record the Chromium decision,
and archive the spec, plan and todo once merged.
