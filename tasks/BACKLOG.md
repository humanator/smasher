# Backlog

Everything still open across smasher, prioritised. Triaged 2026-09-24. Each item
was checked against the code on `main` (`7b78f1f`), not just carried over from
older docs.

Every planned module is done: the design-factory modules (`component-kit` through
`workflow-editor`) and the desktop-frontend modules (`smasher-web-api`,
`smasher-spa`, `smasher-desktop`). Their specs, plans, todos and capability maps
are in [`archive/`](archive/). What's left is follow-up work, known gaps, and
deferred decisions. [`Vision.md`](Vision.md) is still the product north star.

## Where things stand (2026-09-24)

**Branches.** `chore/tasks-triage` and `fix/default-model` (item #1) are merged
into `main`. `feat/claude-cli-provider` is still open, built on `main`, and holds
only `SPEC-claude-cli-provider.md`, **awaiting Jobsworth's review**. No code yet.
Until it merges, that spec exists only on that branch.

**Agreed order.** #2, then the editor batch (#3 + #4 + #5, built on
`feat/editor-save-batch` and awaiting review before merge), then #6. The Claude CLI provider was
added mid-session and runs alongside. Its spec review comes first.

**Waiting on Jobsworth:**
- Review of `SPEC-claude-cli-provider.md`, and answers to its three Open
  questions.
- #2: whether CI installs Chromium (for Playwright and `render-capture`'s
  integration test).
- #6: the default artifact retention policy.

**Frontend test gotcha.** The Vitest suite's "real API" tests (gallery, gate,
decision history, new-workflow) call whatever server is listening on
`127.0.0.1:21541`. They don't start one themselves. If the desktop app is running
there, it stores data in `~/Documents/smasher` instead of the repo, and about 50
tests fail for reasons unrelated to the code. Quit the app and run `cargo run -p
smasher-cli -- serve` from the branch under test first.

## P1: Do next (small, and each one fixes something real)

1. ~~**Replace the stale default model ID and define it once.**~~ **Done
   2026-09-24** (merged to `main`). `smasher_llm::types::DEFAULT_MODEL` is
   `claude-sonnet-5`, and the Anthropic adapter now sends adaptive thinking and no
   sampling params to models that reject them
   (`provider/anthropic/types.rs`, `is_adaptive_only_model`).
   Loose ends:
   - **Not tested against the live API.** Tests use mocks, so run one real
     pipeline on Sonnet 5 before relying on it.
   - **Stale catalog aliases.** In `smasher-llm/src/types/catalog.rs`, the
     `claude-sonnet`/`claude-opus` aliases and `get_latest_model()` still point at
     the 4.6 models. The catalog also has no Opus 5, Opus 5.5 or Fable entries.
     Unknown models fall back to conservative limits (8k max output, no thinking).
   - Test fixtures still use `claude-sonnet-4-20250514` on purpose, as sample
     data. Leave them.

2. **Run the frontend in CI.** `.github/workflows/ci.yml` runs only cargo. The
   SPA's ~237 Vitest tests, `svelte-check`, lint, and the 4 Playwright specs never
   run in CI, even though they're the main guard for the SPA and desktop. Add a
   Node job, and decide at the same time whether Chromium gets installed for
   Playwright and `render-capture`'s integration test. That Chromium question has
   never been decided on purpose. *Source: DEFERRED `render-capture`, desktop
   Checkpoint C waiver.*
   Because of the gotcha above, the CI job has to build and start `smasher serve`
   before running Vitest.

3. ~~**Fix where dropped nodes land after pan or zoom in the node editor.**~~
   **Done 2026-09-24** on `feat/editor-save-batch` (not merged yet). A small
   `FlowPositionBridge.svelte` inside `<SvelteFlow>` hands
   `screenToFlowPosition()` to the canvas, so no `<SvelteFlowProvider>` split was
   needed. A dropped node is centred under the pointer, as it was while being
   dragged. It stays hidden until Svelte Flow has measured it and moved it into
   place. The proof is a Playwright case in `e2e/node-editor.spec.ts`.
   On the same branch, the Edit and New Workflow pages' canvas now fills the
   window below the header, and Export .dot moved into the header beside Save.
   Loose end:
   - **Wide graphs don't fit on first load.** `examples/consensus_task.dot` runs
     off both edges. Probably `fitView` stopping at Svelte Flow's default
     `minZoom` of 0.5. Setting a lower `minZoom` on the canvas would likely fix it.

## In progress

- **Claude CLI provider.** Run every pipeline LLM call through `claude -p` from
  the web and desktop apps, with no API key. Spec:
  `SPEC-claude-cli-provider.md` on branch `feat/claude-cli-provider` (draft,
  pending review; it includes spike results and cost measurements). Next steps once
  approved:
  1. Write `plan-claude-cli-provider.md` and `todo-claude-cli-provider.md`.
  2. Check spec Open question 2 first (does `~/.claude/CLAUDE.md` leak into
     codergen runs?).
  3. Build.

  `smasher run` already has a codergen-only version (`ClaudeCliBackend`,
  `crates/smasher-cli/src/run.rs:197`), which gets moved and shared.

## P2: Robustness (can lose data or grow without limit)

4. ~~**Detect conflicting edits when saving a workflow.**~~ **Done 2026-09-24**
   on `feat/editor-save-batch` (not merged yet). The graph API sends an `ETag`
   (SHA-256 of the file), and a `PUT` with a stale `If-Match` gets 409. The editor
   shows a warning toast (shadcn sonner, now mounted in `App.svelte`) with Reload
   and Save anyway, and keeps unsaved edits. Other save errors show inline instead
   of replacing the canvas. A `PUT` without `If-Match` still overwrites. See
   `docs/api-reference.md`.
   Loose end:
   - **Stale API docs.** The `POST /editor/workflows` section of
     `docs/api-reference.md` describes a route and body that no longer exist. The
     real route is `POST /api/workflows/new` with `{name, target_dir, graph}`.

5. ~~**Keep `node [...]` / `edge [...]` default-attribute blocks when saving.**~~
   **Done 2026-09-24** on `feat/editor-save-batch` (not merged yet).
   `render_to_dot` merges a graph's defaults over its font defaults, and
   `put_graph` copies them from the file it overwrites. No current workflow has a
   hand-written `node [...]` block, so this only guards future ones.
   Loose end:
   - **`rankdir` quoting changes between saves.** A graph with no `rankdir` is
     written as `rankdir=TB` on the first save and `rankdir="TB"` on later ones,
     because the renderer's fallback is unquoted but a re-parsed value is quoted.
     Harmless, but the first two saves aren't byte-identical.

6. **Prune artifacts automatically.** `smasher prune-artifacts` exists but nothing
   runs it. The desktop app now keeps its data in `~/Documents/smasher`, so run
   artifacts (bundles, screenshots) grow without limit. Decide on a default
   retention policy and run it when the server starts. *Source:
   `SPEC-artifact-store`.*

## P3: Design-factory features (wait until a real pipeline needs them)

When these come up, batch #7 + #8 + #11 together: several-candidate critique
decides the `candidate_id` convention, and the lint override lives in the same
`synthesis` code.

7. **Critique several candidates from one node.** Today, giving N Discover
   candidates their own `task_critic`/`synthesis` call means writing N nodes by
   hand. This is the most likely one to be needed first.
8. **Let a failing lint force `synthesis` to recommend `iterate`**, whatever the
   model says. Decide once more real runs exist.
9. **Add an expand or full-size view to the candidate card** (`CandidateCard.svelte`
   is a fixed-size iframe).
10. **Support two gallery gates pending on one run at the same time.** This needs a
    mapping from node id to question in the engine first.
11. **Document where `candidate_id` values come from** as a convention for
    pipeline authors (today they're hardcoded as `discover-a`..`d`).
12. **Settle the shape of `generation_params`** (currently a free-form string map).
13. **Grow the component kit** (`select`, `checkbox`, `tabs`) **and the
    `system-lint` usage rules** to match.
14. **Artifact extras:** a producer for the reserved `Recording` artifact kind, and
    a per-candidate option to skip saving the bundle.
15. **Reuse the editor's saved layout in the run-view SVG** instead of laying the
    graph out again with Graphviz each time.

## P4: Distribution and remote access (bigger, strategic)

#17 and #18 are both work on the Tauri app's setup, so batch them if either
comes up.

16. **Serve the app remotely over HTTP.** This was the "(later)" goal in the
    desktop capability map. It needs an auth layer first, because the API has none
    and only listens on `127.0.0.1`. Scope it with a spec before building.
17. **Ship a `.dmg` or portable desktop bundle.** The current `.app` only works on
    this machine because it loads the SPA, examples and design kit from the source
    checkout. These would need bundling as resources first.
18. **Desktop tray icon.**
19. **Desktop end-to-end tests.** Blocked: `tauri-driver` doesn't support macOS.
    Covered for now by manual QA plus the SPA's Playwright suite.

## Dropped during triage (superseded)

- **Raw-DOT paste form (`/workflows/new/raw`)**: removed at the SPA cutover. Import
  `.dot` (desktop Task 7) covers the power-user case.
- **Browser checks for the HTMX gallery-gate and `workflow-run-shell`**: those
  templates were deleted at cutover. The SPA's `gallery-gate.spec.ts` covers the
  flow, and the "exactly one input surface" dedupe now happens in the API layer
  (`smasher-web/src/routes/questions.rs`).
- **Running `examples/vulnerability_analyzer.dot` by hand** (render-capture and
  system-lint follow-up #1): already confirmed in a live run on 2026-09-17. The
  remaining step was marked nice-to-have.
