# Spec: Frontend CI (backlog #30 + #2 + #31)

## Objective

The SPA is the main surface of both the web and desktop apps, yet CI runs only
cargo. None of the ~450 Vitest tests, `svelte-check`, ESLint, the production
build or the 12 Playwright spec files run on a push or PR. This batch makes
them run, in three steps:

1. **#30: get `npm run check` to zero errors.** It reports 5 today, on `main`:
   - `src/components/node-editor/WorkflowCanvas.svelte:527`: `Record<string, unknown>` → `Record<string, AttrValue>`
   - `tests/setup.ts:14`: the `EventSource` redeclaration clashes with the DOM lib type
   - `e2e/gallery-gate.spec.ts:87-89`: `string | undefined` passed as `string` (3 errors)
2. **#31: stop `npm run build` warning about chunk size.** It emits one JS chunk
   over 500 kB (567 kB on `main`). Lazy-load the node editor (the only user of
   `@xyflow/svelte` and `@dagrejs/dagre`) with a dynamic `import()`. Raising
   `chunkSizeWarningLimit` is **not** the fix.
3. **#2: add a `frontend` job to `.github/workflows/ci.yml`** that runs check,
   lint, build, Vitest and Playwright against a real `smasher serve`, with no
   LLM spend. **Chromium: yes** (decided by Jobsworth 2026-09-26).

Who it's for: Jobsworth and any agent opening a PR. A red frontend job means
a real SPA regression.

## Assumptions (correct any of these)

1. Work happens on `feat/frontend-ci`, branched from `main`, not from
   `feat/question-replies`. If #28 merges first, rebase this branch. #28 adds
   `marked` + `dompurify` (~76 kB), so re-check #31 after that rebase.
2. The job runs on `ubuntu-latest` with Node 22 (the local version; the repo has
   no `.nvmrc` or `engines`). I'll add `.nvmrc` with `22` so CI and local match.
3. `frontend` is its own job, parallel with the Rust jobs, gated only on
   `fmt`. It builds `smasher-cli` itself with `Swatinem/rust-cache`
   (`shared-key: "ci-frontend"`). Building only `-p smasher-cli` shouldn't need
   the Tauri apt deps; if it does, add `./.github/actions/tauri-linux-deps`.
4. The server is started exactly as the backlog's test gotcha describes: the fake
   `claude`, `SMASHER_PROVIDER=claude-cli`, a temporary `SMASHER_DATA_DIR`
   exported to both server and tests, and `FAKE_CLAUDE_LOG` set. The job's last
   step fails if that log isn't empty. That proves in CI that no test tried to
   spend tokens.
5. `SMASHER_LLM_TESTS` is never set in CI, so both critical-path tests stay
   skipped.
6. **The render-capture half of the Chromium decision is already covered.**
   `captures_a_real_png_of_the_fixture_candidate` isn't `#[ignore]`d. It runs
   in `cargo test --workspace` and launches whatever Chrome `chromiumoxide`
   finds. GitHub's `ubuntu-latest` image ships Google Chrome. So this batch
   only adds Playwright's Chromium (`npx playwright install --with-deps
   chromium`) and documents that render-capture relies on the image's Chrome.
7. `npm run lint` runs `eslint . --fix`, so it rewrites files. CI calls
   `npx eslint .` instead (it's clean today), or a new `lint:check` script.

## Tech Stack

Svelte 5, Vite 5, Vitest 1 (jsdom), Playwright ≥1.40 (Chromium project only),
svelte-check 4, ESLint 8, GitHub Actions. Backend: `smasher-cli serve` (axum, port
21541). No new npm or cargo dependencies.

## Commands

```bash
# local, from frontend/
npm ci
npm run check                     # svelte-check --threshold error → 0 errors
npx eslint .                      # no --fix in CI
npm run build                     # no "chunks are larger than 500 kB" warning
npx vitest run                    # needs smasher serve on 127.0.0.1:21541
npx playwright install --with-deps chromium
npx playwright test               # starts vite dev on :5173 itself (proxy → :21541)

# the server the tests talk to, from the repo root
export SMASHER_DATA_DIR=$(mktemp -d) FAKE_CLAUDE_LOG=$(mktemp)
SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=frontend/tests/fixtures/fake-claude.sh \
  cargo run -p smasher-cli -- serve
```

## Project Structure (files this batch touches)

```
.github/workflows/ci.yml                         → new `frontend` job
.nvmrc                                           → new, "22"
frontend/src/App.svelte                          → lazy-load NewWorkflowPage / WorkflowEditorPage
frontend/src/components/node-editor/WorkflowCanvas.svelte → #30 type fix
frontend/tests/setup.ts                          → #30 EventSource type fix
frontend/e2e/gallery-gate.spec.ts                → #30 undefined guards
frontend/package.json                            → maybe `lint:check`
docs/ (quickstart or a CI note) + tasks/BACKLOG.md → how CI runs the SPA; tick #2/#30/#31
```

## Code Style

Match the surrounding code. Keep the ABOUTME lines. Comments say *why*, as in
`vite.config.ts`/`vitest.config.ts`. The CI job follows the existing jobs'
shape: a `# ── Name ──` banner comment, `set -o pipefail` + `tee` into a log
dir, and `actions/upload-artifact@v4` with `if: always()` and
`retention-days: 14`. Sketch:

```yaml
  # ── Frontend: check, lint, build, Vitest, Playwright ──────────────
  frontend:
    name: Frontend
    runs-on: ubuntu-latest
    needs: [fmt]
    env:
      SMASHER_PROVIDER: claude-cli
      SMASHER_CLAUDE_CLI: ${{ github.workspace }}/frontend/tests/fixtures/fake-claude.sh
      SMASHER_DATA_DIR: ${{ runner.temp }}/smasher-data
      FAKE_CLAUDE_LOG: ${{ runner.temp }}/fake-claude.log
    steps:
      # checkout, rust toolchain + cache, setup-node (cache: npm), npm ci,
      # check, eslint, build, cargo build -p smasher-cli, start serve in the
      # background + wait for /api to answer, vitest run, playwright,
      # assert FAKE_CLAUDE_LOG is empty, upload playwright-report on failure
```

For the lazy load, `App.svelte` swaps its two static imports for a
`{#await import('./components/dashboard/WorkflowEditorPage.svelte') then m}`
(or an equivalent loader) on the editor routes only.

## Testing Strategy

- **#30:** the proof is `npm run check` at 0 errors. The fixes are type-only.
  The existing Vitest and Playwright suites must stay green. No new tests,
  unless a fix changes runtime behaviour in `WorkflowCanvas` (the node editor
  specs already cover the attribute path).
- **#31:** a test-first check that the build emits more than one JS chunk and
  none over 500 kB. It could be a small Node script run after `vite build`, or a
  Vitest test reading `dist/assets`. Then the existing `node-editor.spec.ts`
  and `WorkflowEditorPage`/`NewWorkflowPage` Vitest tests prove the
  lazy-loaded editor still mounts, drops nodes and saves.
- **#2:** the job itself is the test. It must go green on the branch's PR.
  Prove it catches failures by pushing one deliberately broken commit (e.g. a
  failing assertion), watching the job go red, then reverting. Local
  dry run first: the same commands in the same order against a fresh
  `SMASHER_DATA_DIR`.
- No LLM spend anywhere. The empty-`FAKE_CLAUDE_LOG` assertion enforces this.

## Boundaries

- **Always:** run check, lint, build, Vitest and Playwright locally before
  pushing; quit the desktop app before running Vitest (see the backlog
  gotcha); commit after each backlog item.
- **Ask first:** changing or retrying the existing Rust jobs; raising
  Playwright retries or timeouts to get green; skipping or quarantining any
  test that fails in CI; adding npm/cargo deps; pushing to either remote.
- **Never:** set `SMASHER_LLM_TESTS` or any real provider key in CI; raise
  `chunkSizeWarningLimit` instead of splitting; use `--fix` in CI; weaken
  `svelte-check`'s threshold; `@ts-ignore` the #30 errors away.

## Success Criteria

- [ ] `npm run check` reports 0 errors, 0 warnings.
- [ ] `npm run build` prints no chunk-size warning. The node editor ships in its
      own chunk, and the main chunk is under 500 kB.
- [ ] The editor pages still work: `node-editor.spec.ts` and the editor Vitest
      tests pass.
- [ ] A `Frontend` job in `ci.yml` runs check → eslint → build → Vitest →
      Playwright (Chromium) against a real `smasher serve`, and passes on the PR.
- [ ] The job fails if any test invokes `claude` (the fake log isn't empty).
- [ ] A deliberately failing test turns the job red (shown once, then reverted).
- [ ] Playwright's HTML report and the server log are uploaded as artifacts on
      failure.
- [ ] Backlog #2, #30 and #31 are marked done. The Chromium decision is
      recorded: Playwright installs it, and render-capture uses the image's
      Chrome.

## Decided (Jobsworth, 2026-09-26)

1. **The Rust CI timeout is out of scope.** `Test` and `MSRV` die at ~50 min in
   `cargo test --workspace` on the fork's `main` (runs `36006298587`,
   `35957900741`). That's tracked as backlog #32. The frontend job is judged on
   its own result.
2. **CI runs on `myfork`** (humanator/smasher). Push this branch there and open
   the PR against `myfork/main` to prove the job.
3. The frontend job runs on stable only, not the MSRV toolchain.
