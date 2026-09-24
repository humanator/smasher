# Backlog

Everything still open across smasher, prioritised. Triaged 2026-09-24. Each item
was checked against the code on `main` (`7b78f1f`), not just carried over from
older docs.

Every planned module is done: the design-factory modules (`component-kit` through
`workflow-editor`) and the desktop-frontend modules (`smasher-web-api`,
`smasher-spa`, `smasher-desktop`). Their specs, plans, todos and capability maps
are in [`archive/`](archive/). What's left is follow-up work, known gaps, and
deferred decisions. [`Vision.md`](Vision.md) is still the product north star.

## P1: Do next (small, and each one fixes something real)

1. ~~**Replace the stale default model ID and define it once.**~~ **Done
   2026-09-24** on `fix/default-model`. `smasher_llm::types::DEFAULT_MODEL` is
   `claude-sonnet-5`, and the Anthropic adapter now sends adaptive thinking and no
   sampling params to models that reject them.

2. **Run the frontend in CI.** `.github/workflows/ci.yml` runs only cargo. The
   SPA's ~197 Vitest tests, `svelte-check`, lint, and the 4 Playwright specs never
   run in CI, even though they're the main guard for the SPA and desktop. Add a
   Node job, and decide at the same time whether Chromium gets installed for
   Playwright and `render-capture`'s integration test. That Chromium question has
   never been decided on purpose. *Source: DEFERRED `render-capture`, desktop
   Checkpoint C waiver.*

3. **Fix where dropped nodes land after pan or zoom in the node editor.** When you
   drag a node in from the palette, its position is calculated in screen space
   (`frontend/src/components/node-editor/WorkflowCanvas.svelte:139`). If the canvas
   has been panned or zoomed, the node lands in the wrong place. The fix is to wrap
   the canvas in `<SvelteFlowProvider>` so `screenToFlowPosition()` can be used.
   This bug came across unchanged when the editor was ported to the SPA.
   *Source: DEFERRED `workflow-editor`.*

## In progress

- **Claude CLI provider.** Run every pipeline LLM call through `claude -p` from
  the web and desktop apps, with no API key. Spec:
  [`SPEC-claude-cli-provider.md`](SPEC-claude-cli-provider.md) (draft, pending
  review).

## P2: Robustness (can lose data or grow without limit)

4. **Detect conflicting edits when saving a workflow.** The last save always wins,
   with no warning. This matters more now that the desktop app can import `.dot`
   files and the editor and a text editor can be open on the same file. Send the
   file's mtime or an ETag with each save and return 409 if the file changed in the
   meantime. *Source: `SPEC-workflow-editor` Open Questions.*

5. **Keep `node [...]` / `edge [...]` default-attribute blocks when saving.**
   `render_to_dot` replaces them with its own hardcoded defaults, so a hand-written
   `.dot` file that relies on them silently loses them on its first save from the
   editor (`smasher-web/src/routes/editor_api.rs:45,188`). *Source: archived
   `todo-workflow-editor` Task 2.*

6. **Prune artifacts automatically.** `smasher prune-artifacts` exists but nothing
   runs it. The desktop app now keeps its data in `~/Documents/smasher`, so run
   artifacts (bundles, screenshots) grow without limit. Decide on a default
   retention policy and run it when the server starts. *Source:
   `SPEC-artifact-store`.*

## P3: Design-factory features (wait until a real pipeline needs them)

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
