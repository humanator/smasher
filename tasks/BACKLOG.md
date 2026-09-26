# Backlog

Everything still open across smasher, prioritised. Finished work (specs, plans,
todos and capability maps) is in [`archive/`](archive/).
[`Vision.md`](Vision.md) is still the product north star. Item numbers are kept
stable so cross-references still work; gaps are finished items.

**Waiting on Jobsworth:**
- #23: whether to run the Claude CLI checkpoints skipped before merge.
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
gate or passes through non-LLM nodes only. New tests should reuse the inline
graphs in `frontend/tests/fixtures/graphs.ts` (`RUN_FAIL_CHECK`, `QUESTION_KINDS`,
`LOOP_CHECK`, `ANONYMOUS_GATE`), whose `graphs.test.ts` proves they never reach an
LLM. The two critical-path tests
(`tests/critical-path.test.ts`, `e2e/critical-path.spec.ts`) run real Codergen nodes
and spend tokens, so they're skipped unless `SMASHER_LLM_TESTS=1` is set. Run them
only on request. CI's `Frontend` job does all of this for you on every PR:
fake-claude server, shared data dir, and a check that the fake's log stays empty
(see "Frontend Tests and CI" in [`docs/quickstart.md`](../docs/quickstart.md)).

## P1: Do next (small, and each one fixes something real)

1. **Default-model loose ends.** `DEFAULT_MODEL` is `claude-sonnet-5`
   (`smasher_llm::types`), with adaptive thinking for models that need it
   (`provider/anthropic/types.rs`, `is_adaptive_only_model`). Still to do:
   - **Not tested against the live API.** Tests use mocks, so run one real
     pipeline on Sonnet 5 before relying on it.
   - **Stale catalog aliases.** In `smasher-llm/src/types/catalog.rs`, the
     `claude-sonnet`/`claude-opus` aliases and `get_latest_model()` still point at
     the 4.6 models. The catalog also has no Opus 5, Opus 5.5 or Fable entries.
     Unknown models fall back to conservative limits (8k max output, no thinking).
   - Test fixtures still use `claude-sonnet-4-20250514` on purpose, as sample
     data. Leave them.

3. **Fit wide graphs on first load in the node editor.**
   `examples/consensus_task.dot` runs off both edges. Probably `fitView` stopping
   at Svelte Flow's default `minZoom` of 0.5. Setting a lower `minZoom` on the
   canvas would likely fix it.

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
29. **Find why `events.jsonl` is cut short in the smasher-web test harness.**
    *Seen 2026-09-25 while building question replies.* In
    `crates/smasher-web/tests/events_test.rs`, a gated run (`Start → Gate → Exit`, data dir a `tempfile` dir) reaches
    `Completed`, and SSE delivers `pipeline_completed`. But the run's
    `events.jsonl` stops at the Exit node's `node_completed`. The Exit
    `checkpoint_created` and `pipeline_completed` never arrive, even after 10s.
    A real `smasher serve` run does write both (checked on run
    `01m3cacyq1mfp5ekvv56a2kcfq`), so this may be harness-only. The cause isn't
    known yet. The file is written by the `FileLogSink` subscriber spawned in
    `run_launch.rs`. `test_human_gate_exchange_is_recorded_in_events_jsonl`
    works around it by waiting for Exit's `node_completed`. Once the cause is
    known, make the test wait for `pipeline_completed` again. If it isn't
    harness-only, finished runs reloaded from disk would be missing their final
    events. Lead from the `CandidatePreview.test.ts` cleanup race: the JSONL
    event writer drains on its own task after the run's status is set, so the
    test may simply read the file too early.
32. **Find why the Rust CI jobs time out.** *Seen 2026-09-26 while speccing
    frontend CI.* On `myfork` (humanator/smasher), the last two pushes to `main` failed
    (runs `36006298587` and `35957900741`, 2026-09-24). `Test` and `MSRV` ran
    ~50 min and died inside `cargo test --workspace`, and no logs were kept.
    Format, Check, Clippy, Docs and Test Summary pass. The cause isn't known.
    One suspect is render-capture's `captures_a_real_png_of_the_fixture_candidate`,
    which launches the runner image's Chrome and isn't `#[ignore]`d. Start by
    adding a `timeout-minutes` and `--nocapture`-style progress so the next
    run shows which test hangs. Kept out of the frontend CI batch
    (`archive/SPEC-frontend-ci.md`) by Jobsworth's call.
    New lead, 2026-09-26: on PR humanator/smasher#1 (run `36215653694`), MSRV
    failed after 1.5 min, not 50. Four `smasher-desktop` `settings::tests`
    Keychain tests panicked (`settings.rs:564`, `:621`, `:640`); Linux runners
    have no macOS Keychain. Gate them to macOS or fake the store.
33. **Fix the lightbox-resize race in `candidate-preview.spec.ts:81`.** *Seen
    2026-09-26.* It polls until the iframe starts shrinking, then asserts its
    final bounds (`<= 800`) while the resize may still be running (got 963).
    It failed about 1 in 5 full local runs, on `main` too. CI's `retries: 2`
    hides it. Poll on the final bounds instead.
34. **Find why a question answer can stall.** *Seen once 2026-09-26*, in a
    full CI-mode local run. In `question-card.spec.ts`, the Approval answer's
    POST didn't return within 5s (buttons stayed disabled), so Free Form never
    appeared. It passed 10/10 alone and wasn't seen on `main` in 5 runs.
    Suspect: `answer_question` takes `state.runs.read()` on tokio's
    write-preferring `RwLock`, so a queued writer (a run finishing) blocks it.

## P2: Robustness (can lose data or grow without limit)

4. **Fix the stale `POST /editor/workflows` docs.** That section of
   `docs/api-reference.md` (and its row in the route table) describes a route and
   body that no longer exist. The real route is `POST /api/workflows/new` with
   `{name, target_dir, graph}`.

5. **Make `rankdir` quoting stable between saves.** A graph with no `rankdir` is
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

