# Backlog

Everything still open across smasher, prioritised. Triaged 2026-09-24. Each item
was checked against the code on `main` (`7b78f1f`), not just carried over from
older docs.

Every planned module is done: the design-factory modules (`component-kit` through
`workflow-editor`) and the desktop-frontend modules (`smasher-web-api`,
`smasher-spa`, `smasher-desktop`). Their specs, plans, todos and capability maps
are in [`archive/`](archive/). What's left is follow-up work, known gaps, and
deferred decisions. [`Vision.md`](Vision.md) is still the product north star.

## Where things stand (2026-09-25)

**Branches.** `chore/tasks-triage`, `fix/default-model` (item #1), the editor
batch and `feat/claude-cli-provider` are all merged into `main`. The Claude CLI
provider merged on 2026-09-25 with a known limitation (#23).

**Agreed order.** #2, then the editor batch (#3 + #4 + #5, merged to `main`
2026-09-24), then #6. The Claude CLI provider was
added mid-session and ran alongside. It's now merged (#23). Next up: the SPA port repairs, #9 (candidate thumbnails and
lightbox) + #21 (the rest of what the port dropped), as one frontend batch.

**Waiting on Jobsworth:**
- #23: whether to run the Claude CLI checkpoints skipped before merge.
- #2: whether CI installs Chromium (for Playwright and `render-capture`'s
  integration test).
- #6: the default artifact retention policy.

**Frontend test gotcha.** The Vitest suite's "real API" tests (gallery, gate,
decision history, new-workflow) call whatever server is listening on
`127.0.0.1:21541`. They don't start one themselves. If the desktop app is running
there, it stores data in `~/Documents/smasher` instead of the repo, and about 50
tests fail for reasons unrelated to the code. Quit the app and run `cargo run -p
smasher-cli -- serve` from the branch under test first. If the server uses a custom
`SMASHER_DATA_DIR`, export the same value for Vitest. The gallery tests write
candidate manifests there directly, and fail with "gallery gate never appeared"
if the directories differ. To serve without API keys or spending anything, point
`SMASHER_CLAUDE_CLI` at a fake `claude` script and set
`SMASHER_PROVIDER=claude-cli`. The repo keeps one at
`frontend/tests/fixtures/fake-claude.sh`; set `FAKE_CLAUDE_LOG` to log its calls.
The suites start no LLM node by default. Every submitted run parks on a human
gate or passes through non-LLM nodes only. The two critical-path tests
(`tests/critical-path.test.ts`, `e2e/critical-path.spec.ts`) run real Codergen nodes
and spend tokens, so they're skipped unless `SMASHER_LLM_TESTS=1` is set. Run them
only on request.

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
   `svelte-check --threshold error` already fails with 6 errors on `main`, so fix
   those first or the new job starts red. They're in `e2e/gallery-gate.spec.ts` (3),
   `EventLog.svelte`, `WorkflowCanvas.svelte` and `tests/setup.ts`.

3. ~~**Fix where dropped nodes land after pan or zoom in the node editor.**~~
   **Done 2026-09-24** (merged to `main`). A small
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

9. ~~**Show candidates as thumbnails that open a full-size, interactive lightbox.**~~
   **Done 2026-09-25** on `feat/spa-port-repairs` (module `candidate-preview`, see
   `tasks/SPEC-candidate-preview.md`). Both cards show the screenshot as a thumbnail
   that opens the live bundle at its capture viewport, scaled to fit, with ⟲ and
   Open in new tab; both list `params`; the gallery's failed card shows captured-at.
   *Raised by Jobsworth 2026-09-25 from a real run, so moved up from P3.* This is
   partly a regression from the SPA port (see #21). The HTMX card
   (`_candidate_card.html`, `style.css:1279-1300` at `0e5647c^`) was 375px wide
   with a 667px-tall live iframe (a phone-sized screen), plus:
   - a ⟲ button that reloaded the preview to its start state (script in
     `base.html`),
   - a collapsible "params" section listing `generation_params`,
   - on the gallery gate, a link around the preview that opened the live bundle
     in a new tab (`gallery_gate.html:17`, `primary_url()`).

   The SPA's `CandidateCard.svelte` and `GalleryGate.svelte` have none of these.
   Both show a 4:3 iframe in a column at least 260px wide, too small to judge a
   candidate designed at desktop size (render-capture shoots 1280×800).
   Wanted, in both the gallery and the gate:
   - Show the screenshot as a thumbnail. Clicking it opens the live bundle
     (`bundle_url`) in a lightbox, full size and clickable, with the reset
     button.
   - Bring back the params section, and the captured-at time on failed cards.
   - Keep the scorecard badges, checkbox and comment box on the card.

20. **Model selection everywhere, and per node.** *Raised by Jobsworth
    2026-09-25.* Bigger than the rest of P1, so write a spec first. Today:
    - The model and provider are set once for the whole server, from
      `SMASHER_MODEL`/`SMASHER_PROVIDER` (env or repo `.env`) or the desktop
      settings dialog. That dialog only renders in the desktop app
      (`App.svelte`, `isTauri()`), because it saves through Tauri commands and
      the macOS Keychain. The web app has no settings UI and no settings API.
    - The node editor's codergen form has a free-text `model` field and no
      `provider` field. Tool nodes that call an LLM (`task_critic`, `synthesis`)
      have no model control at all.
    - Model and provider are set separately, so they can drift apart. On
      2026-09-25, switching the desktop provider to Claude CLI kept the repo
      `.env`'s `SMASHER_MODEL=gemma4:31b-cloud`, and `task_critic` sent it to
      `claude -p`. (The claude-cli paths now ignore non-Claude names, in
      `944c09c`, but that only hides the mismatch.)

    Wanted:
    - Provider and model settings in both the desktop and web apps. The web app
      needs a settings API and somewhere other than the Keychain to keep keys.
    - When editing an LLM node, pick its model from a list of the configured
      providers' models (including Claude CLI), not free text.
    - Choosing a provider also sets a valid model for it.

21. **Restore what the HTMX → SPA port dropped.** *Found 2026-09-25 by comparing
    the templates deleted in `0e5647c` (read them with `git show
    0e5647c^:crates/smasher-web/templates/<file>`) against the SPA.* The SPA plan
    only required parity for submitting runs, live events and questions
    (`archive/SPEC-smasher-spa.md:99`), and none of these are recorded as
    deliberate cuts. Candidate cards are #9 (done 2026-09-25: ⟲, params, captured-at on
    failed cards). The rest, most serious first:
    - **No run form.** The old `workflow_run_form.html` had Model, Variables,
      Brief and Node Overrides fields. The catalog's Run button now sends an
      empty request (`WorkflowCatalog.svelte:48`), although the API accepts all
      of them (`lib/api/runs.ts`). So you can't give a run a brief or a model.
      The model field overlaps #20.
    - **No workflow detail page.** `/workflows/{id}` showed the workflow's
      source, an Edit button, the run form, the active run, and that workflow's
      run history. The SPA has no such route. The catalog links only to Edit,
      and the only run history is the global list.
    - **A failed run shows no reason.** The old Telemetry drawer showed
      Completed, Working Directory and **Error** (`run_detail_body.html:98-118`).
      `RunDetail.svelte` shows none of them, though `RunSummary` has the fields.
    - **The pipeline graph doesn't update.** The old one re-fetched every 3s, so
      node colours followed the run. `RunDetail.svelte:64` loads it once. It
      also swallows errors (`:43`), such as the old "Graphviz isn't installed"
      message, and no longer scales the graph to fit the width.
    - **Silent errors.** `base.html` showed a toast with the server's error for
      any failed request. Now a failed answer to a question only goes to
      `console.error` (`QuestionCard.svelte:40`), and gallery-gate poll failures
      are dropped. The sonner toaster is mounted but only the editor uses it.
    - **Questions:**
      - The card no longer shows the question type or id.
      - Free-text answers have no Submit button (Enter only).
      - Multiple choice submits on the first click, with no radio buttons.
      - The first question fetch waits 2s.
      - The "No pending questions." empty state is gone.
    - **Event log:**
      - It used to be newest-first and colour-coded by type, with agent events
        indented and noisy ones faded (`style.css:754-832`). Now it's
        oldest-first, all one style, and doesn't scroll to follow new events.
      - Only 9 of the 17 event types get a readable line (`EventLog.svelte:59-82`).
        The SPA plan's acceptance criteria required all 17
        (`archive/plan-smasher-spa.md:504`).
    - **Token counter:** there's no longer a total, and it polls every 5s
      instead of 3s.
    - **Run list:** a run with no graph name shows a blank cell, where the old
      page showed "unnamed".
    - **Page title and favicon:** the title is always `smasher-spa` and the
      favicon is `/vite.svg` (`frontend/index.html`). The old pages had their
      own titles and a ⚡ icon.

    Deliberate, so leave them: the raw-DOT paste form (see Dropped), and the
    Telemetry drawer being replaced by an inline layout
    (`archive/plan-smasher-spa.md:492`). The lint badge now always lists its
    violations, where the old one needed a click. That's arguably better.

23. **Claude CLI provider: known limitation and follow-ups.** *Merged to `main`
    2026-09-25* with a known limitation. The provider runs pipeline LLM calls
    through `claude -p` from the web and desktop apps, with no API key. Spec, plan
    and todo are in `archive/*-claude-cli-provider.md`. See
    `docs/config-reference.md` for setup.

    **Known limitation, the fix to do first.** Tool nodes that don't name a
    built-in tool (such as `tool_command`-only nodes: 34 across 9 examples,
    including `A11yCheck` in the product design factory) and manager nodes fail
    under claude-cli with "the claude-cli provider answers single calls and can't
    run tools". The spec assumed `LlmToolBackend` and `LlmManagerBackend` were
    single-turn and tool-less, but both run agent sessions with tools
    (`smasher-web/src/backend.rs`). Fix: when the provider is claude-cli, route
    those sessions through `ClaudeCliBackend` as a `claude -p` agent, as codergen
    is. Workaround until then: `provider="<other>"` on the node. The deeper fix
    for `tool_command` is #22.

    **Checkpoints not run before merge** (Jobsworth's call):
    - the `#[ignore]` real-CLI tests, including the `curl` denial;
    - `smasher run` on hello-world and a codergen example;
    - hello-world in the desktop app.

    **Other follow-ups:**
    - The allowlist is enough to *build* candidates but not to *check* them.
      Codergen agents are denied the shell, so they can't run the design-kit
      token linter or open their pages. Decide whether to allow the linter
      command, or leave checking to the pipeline's `system_lint`/`render` nodes.
    - Show `permission_denials` from the CLI's result event in the run view.
    - Make the web server's claude-cli codergen timeout configurable. It's fixed
      at 600s (`smasher-web/src/run_launch.rs`).
    - Let `smasher run` use `SMASHER_CLAUDE_CLI`'s path. Today it runs `claude`
      from `PATH`.

    **History.** First desktop run (`01m39tb2qn0b4msk4cgdr94fry`, 2026-09-24):
    - Reads through the `design-kit` symlink work under `dontAsk`.
    - Two bugs, both fixed before merge:
      - Token totals were always 0, and the streamed usage was misread
        (`5308541`). Usage now comes from the result line, with cost. Input
        excludes cache tokens, as with the Anthropic API adapter, so for
        claude-cli runs cost is the useful figure.
      - `TaskCritic` sent an Ollama model name (`gemma4:31b-cloud`, from the
        repo `.env`) to `claude -p --model` (`944c09c`). The underlying problem
        is #20.
    - The gallery stays empty until all render nodes run. `IAOptions` builds
      all four candidates in one ~5 minute node. That's by design.

    Second run (`01m3awkpeahghg0v6d2pshnzyb`, 2026-09-25):
    - Candidate and critique steps passed. `critic-report.json` described the
      real screenshot, lint passed, and `Synthesis` said `proceed`.
    - `A11yCheck` failed, which uncovered the limitation above.

24. **Send a readable `node_failed.error`.** *Raised 2026-09-25 (SPA repairs,
    batch 2).* The engine puts the outcome's Rust Debug form into the event
    (`engine.rs:651`), e.g. `Failure { error: "…", retryable: false, notes: None }`.
    The SPA's `eventFormat.ts` digs the quoted message out with a regex. The
    server should send the message itself, and the client regex can then go.
25. **Widen the edit route's id pattern.** *Raised 2026-09-25.* `App.svelte`
    matches `/workflows/{id}/edit` with `[a-z0-9_-]+`, but workflow ids can have
    uppercase letters, dots and spaces (`workflows.rs`, `valid_id`). Such a
    workflow's Edit link falls through to the catalog. Match one segment and
    `decodeURIComponent` it, as the `/workflows/{id}` route now does.
26. **Fix `CLAUDE.md`'s DOT shape table.** *Raised 2026-09-25.* The code
    (`smasher-attractor/src/graph/mod.rs`, `node_type_from_shape`) has
    `parallelogram` as Tool, `hexagon`/`oval`/`ellipse` as Interviewer,
    `component` as Parallel, `folder` as SubPipeline and `tripleoctagon` as FanIn,
    and also accepts `Mdiamond`/`Msquare` for start/exit. `CLAUDE.md` says
    `parallelogram` is parallel fan-out, `hexagon` is tool and `component` is a
    sub-pipeline.
27. **Fix a cleanup race in `CandidatePreview.test.ts`.** *Seen once
    2026-09-25.* Its `afterEach` removes each run's artifacts directory with
    `rmSync(..., { recursive: true, force: true })` straight after the run is
    cancelled, while the server may still be writing that run's `events/`.
    It failed once with `ENOTEMPTY` and passed on a re-run. Wait for the run
    to reach `Aborted` (or retry the removal) before deleting.

## P2: Robustness (can lose data or grow without limit)

4. ~~**Detect conflicting edits when saving a workflow.**~~ **Done 2026-09-24**
   (merged to `main`). The graph API sends an `ETag`
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
   **Done 2026-09-24** (merged to `main`).
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
9. *Moved to P1 (thumbnails with a lightbox).*
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
22. **Make `tool_command` actually run its shell command.** *Raised 2026-09-25.*
    Tool nodes in 9 examples (34 nodes) set `tool_command="..."`, but nothing in
    the engine reads that attribute. A node with no `tool` attribute falls back to
    its label as the tool name, and `LlmToolBackend` (`smasher-web/src/backend.rs`)
    starts an LLM agent session with file and shell tools, asking it to
    "execute" the tool. On API providers the agent improvises (often by running
    the command), so these nodes seem to work, but the result is slow, costs
    tokens, and can vary between runs. Under claude-cli they fail outright (see
    #23). Attractor intends tool nodes to run `tool_command` directly.
    Doing that makes them deterministic and free. Decide first:
    - It changes behaviour for every provider.
    - It runs shell commands written in the DOT file. Workflows are
      user-authored and local today, but #16 (serving remotely) would change
      that.
    - Whether `LlmToolBackend` stays as the fallback for tool nodes with neither
      a `tool` nor a `tool_command`.

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
