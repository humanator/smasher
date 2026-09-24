# Implementation Plan: Semi-Dark Design Factory — Remaining Work

## Overview

Extend Smasher's pipeline runner and HTMX/SSE dashboard into a semi-dark product design factory: dark execution between gates, human direction at gates. Sources: `smasher-design-factory.md` (build sequence §5, dashboard extensions §3.3, example pipeline §4), `Vision.md` (real screens, product vs marketing split, why Smasher), and `smasher/docs/design-factory/SPEC-gallery-gate.md` (next slice spec).

Done and reused as-is: `smasher-attractor` DOT engine, `smasher-llm`, `smasher-agent`, `smasher chat` REPL, shared component kit (`smasher/design-kit/` — button, input, drawer, modal, list-row + `tokens.css`), `render_capture` tool (`crates/smasher-render-capture`), `system_lint` tool (`crates/smasher-system-lint`), read-only gallery view (`crates/smasher-web/src/candidates.rs` + `GET /runs/{id}/candidates` + Candidates section in `run_detail.html`).

This plan covers what is still missing, sliced vertically so each task delivers a working, testable path. No code was changed in planning — read-only inspection only.

## Architecture Decisions

- **No new workspace member for gate/history/scorecards.** Follow `gallery-view` precedent: dashboard-only work lives in `smasher-web`; engine addition is one additive branch in `smasher-attractor/src/interviewer.rs`. `task_critic`/`synthesis` do get one new crate — `smasher-task-critic-synthesis`, decided in `SPEC-task-critic-synthesis.md`: a single `ToolBackend` impl dispatching both tools, calling `smasher_llm::client::Client::complete()` directly rather than through Codergen/agent-session (no path for image bytes through the text-only `ToolOutput`), wrapping `SystemLintToolBackend` as the new outermost backend at the two existing construction sites (`smasher-cli/src/run.rs`, `smasher-web/src/backend.rs`). `artifact-store` still decided per-phase.
- **Reuse `HumanGateHandler` + `HttpInterviewer`, no new DOT node type.** Per `SPEC-gallery-gate.md` assumptions 1–3: gate = Interviewer shape (`hexagon`/`oval`/`ellipse`) + `gallery="true"` attr (not `shape=diamond`, which maps to `NodeType::Conditional` in `graph/mod.rs` and would never pause). Answer = canonical JSON string `{"selected": [...], "decision": "..."}` through the existing answer path; one additive `parse_gallery_answer()` branch, legacy plain-string path byte-for-byte unchanged.
- **Gate finds candidates via existing `scan_candidates` / `valid_id`.** Same provisional `./runs/<run_id>/artifacts/<candidate_id>/` read path as `gallery-view`. Reconciling with `AppState.data_dir` / `RunDirectory` tree is deferred to the `artifact-store` phase — no path-contract changes in gate/critic/history tasks.
- **`candidate_count` is display + warning, not enforcement.** Integer literal or `phase_default(discover|define|deliver)` (4/2/1), overridden by `candidates=N` launch var via `submit_run` vars → pipeline context. Gate card shows "Expected N, found M", never blocks on mismatch.
- **Critics stay parallel, synthesis stays cheap.** `system_lint` (deterministic, zero-LLM, done) and `task_critic` (vision model, sparing) run as parallel branches off `Render2`; `synthesis` (cheap model) reconciles into proceed/iterate. Gate UI reserves a lint-badge slot now, fills scorecards when critics land.
- **Decision history reads gate context records, builds nothing new at gate time.** Gate stores parsed object under node id + `decision` as `preferred_label` (existing edge routing follows it). History panel is a read view over those records — separate phase after gate ships.

## Dependency Graph

```
design-kit (done)
  ├── render_capture (done) ── artifacts on disk
  │     ├── gallery-view read-only (done: candidates.rs, /candidates route, Candidates section)
  │     │     └── gallery-gate blocking (Phase 1: engine JSON branch + decision endpoint + gate card)
  │     │           └── decision-history panel (Phase 3: reads gate context records)
  │     ├── system_lint (done)
  │     │     └── synthesis (Phase 2: reconciles system_lint + task_critic)
  │     └── task_critic (Phase 2: vision model vs live candidate)
  │           └── synthesis ──> gate card scorecards (Phase 2)
  └── artifact-store reconciliation (Phase 4: unifies ./runs/... with AppState RunDirectory)
        └── example pipeline + docs fix (Phase 5: hexagon+gallery=true, candidate_count, iterate/proceed edges)
```

Build order: gate first (unblocks human value), critics+synthesis second (most expensive, needs stable gate UI slot), history third (needs real gate records), store fourth (needs all readers known), e2e polish last.

## Task List

### Phase 1: Blocking gate (SPEC-gallery-gate.md scope)

- [x] Task 1: Engine structured-answer branch (`parse_gallery_answer` + context store + `preferred_label`)
- [x] Task 2: Validated decision endpoint (`POST /api/runs/{id}/gallery/{qid}/decision` + pure `validate_decision`)
- [x] Task 3: Gate card in dashboard (graph scan, `candidate_count` resolve, checkboxes + edge buttons + expected/found hint)

### Checkpoint: Gate usable — CLOSED
- [x] `cargo test -p smasher-attractor -p smasher-web` run for real — 1164 tests, 0 failures
- [x] `cargo clippy --workspace` — 6 pre-existing warnings accepted as debt, none in gate code, none added
- [x] New fixture `smasher/examples/gallery_gate_showcase.dot` (3 real render_capture nodes → `shape=hexagon gallery="true"` gate)
- [x] Manual (live, via HTTP): fixture pauses, submitted edge resumes down the matching edge, context holds `{"selected": [...], "decision": "..."}`
- [x] Legacy non-gallery `human_gate` (`examples/human_gate_showcase.dot`) unchanged; forged/unknown candidate decision leaves question pending
- [x] Human review before Phase 2 — found + fixed two bugs manual verification surfaced (see todo.md for full detail):
  1. **Critical:** `HandlerRegistry` dispatch order meant `HumanGateHandler`'s whole gallery-answer branch was dead code in every production entry point — a gallery decision routed to the wrong edge (alphabetical tiebreak) instead of the one named. Fixed by merging `HumanGateHandler` into `InterviewerHandler` (one handler per node type) plus a registry-level regression test.
  2. **Pre-existing, unrelated:** the plain human-gate answer form 415'd in a real browser (form-encoded POST vs a JSON-only route). Fixed by switching the route to accept form data.
  Still open (deferred, not this checkpoint): `render_capture`'s literal `run_id` arg never matches the server-assigned run id on a real `smasher serve` submission — concretely reproduces the Phase 4 "two artifact trees diverge" risk; needs `{{run_id}}` expansion after run-id assignment.

### Phase 2: Critics + synthesis + scorecards
- [x] Task 4: `task_critic` tool + `smasher-task-critic-synthesis` crate scaffold (screenshot + persona/task → vision-model call → `CriticReport`/`critic-report.json`, direct `Client::complete()`, real-API test `#[ignore]`d) — the literal `#[ignore]`d test (hardcodes a Claude model) still hasn't run in this environment, but `run_task_critic()` itself was live-verified against Ollama Cloud (see `smasher` commits `e12bb50`, `774da9e`) — real network call, legible `CriticReport` back
- [x] Task 5: `synthesis` tool (reconcile `lint-report.json` + `critic-report.json` → `SynthesisReport`/`synthesis-report.json`, cheap model) + ask-first wiring of the new backend into `smasher-cli`/`smasher-web` — wired at all 4 actual construction sites (spec named 2)
- [x] Task 6: Live critic scorecards in gate card (lint badge fill + task friction cards next to candidate, not in log stream)

### Checkpoint: Critique loop
- [x] E2E fixture: Render2 → system_lint + task_critic → synthesis → gate shows scorecards with zero gate-LLM calls
      — `smasher/crates/smasher-cli/tests/critique_loop_e2e.rs` (commit
      `c8d0191`): one continuous `smasher run` through render_capture (real
      Chromium) → system_lint → task_critic → synthesis (real Ollama Cloud
      calls), then reads the result back through
      `smasher_web::candidates::read_scorecard` — the function the gate card
      itself calls — confirming real scorecard data. Note: the fixture DOT
      stops at `synthesis`, it doesn't include an actual `Gate1` node (kept
      the proof deterministic/non-interactive rather than also exercising
      `AutoApproveInterviewer`'s gallery-answer handling, an untested
      interaction) — "zero gate-LLM calls" holds trivially since no gate LLM
      call exists in this architecture regardless
- [x] `cargo test --workspace` green (1157+ tests across the workspace, 0 failed);
      critic stopping criteria + model choice: `task_critic` defaults to
      `claude-sonnet-4-20250514` (vision-capable), `synthesis` to
      `claude-3-5-haiku-20241022` (cheap) — each a one-shot call, no loop
- [x] Human review before Phase 3 (expensive nodes, loop-trust decision) — **approved 2026-09-11**: one-shot calls (no loop) on both critic/synthesis nodes, cheap-model synthesis, real E2E evidence (`c8d0191`) reviewed. Open questions (kit completeness, retention, timeout semantics, lint-badge content, marketing/core split) remain parked, none block Phase 3's file surface.

### Phase 3: Decision history + branch picker polish
- [x] Task 7: Decision history panel (gate decision log separate from execution log, design-rationale record) — commit `a3aa771`
- [x] Task 8: Branch picker + candidate count control (named edge buttons from graph edges; `--candidates N` flag / launch-screen field overriding phase default) — commit `f9a9e2b`; both criteria were already substantially in place from Task 3, closed with dedicated tests + a live 3-edge check rather than new production code, no redundant CLI flag added

### Checkpoint: Rationale complete
- [x] History shows ≥2 real gate decisions with selected ids + edge + timestamp — 1 live-verified per run in manual checks (2 candidates on the single decision each time); multi-decision-per-run behavior (loop revisit) proven in `decision_history.rs` unit tests instead of a second live run
- [x] Override changes expected-count hint without DOT edit; branch buttons map to graph edges, not raw prompt — live-verified: `candidates=2` var → "Expected 2, found 1"; 3rd edge button → real `Gate1 -> Fork [fork-new-direction]` traversal
- [x] Human review before artifact-store work — **approved 2026-09-11**: proceed to Task 9

### Phase 4: Artifact store reconciliation
- [x] Task 9: Unify artifact trees (`runs/<id>/artifacts/<candidate-id>/` provisional path vs `AppState.data_dir` RunDirectory) — commit `b3ac7a6`. `render_capture`, `system_lint`, and `task_critic`/`synthesis` each independently derived a CWD-relative `runs/<run_id>/artifacts/<candidate_id>/` path from a `run_id` tool arg; none of them ever touched the `RunDirectory` tree the engine already manages under `AppState.data_dir` (web) / `./artifacts` (CLI) — two real run ids, two real trees, silently diverging on every actual `smasher serve`/`smasher run` submission. Fix: thread the run's real `RunDirectory::manifest().directories.artifacts` into all three tool backends at construction time (all 4 call sites: web `api.rs` ×2, `pages.rs` ×1, CLI `run.rs` ×1) instead of deriving a path from `args["run_id"]` per call; `render_capture`/`system_lint`/`task_critic`/`synthesis` all now write under the one real run directory. This also resolves the Phase 1 checkpoint's deferred bug (render_capture's literal `run_id` arg never matching the server-assigned run id) as a side effect — the base directory is now injected already-correct, so there's no `run_id` string left to mismatch. "Preserve live preview vs recording vs static" (the Vision open question) was out of scope for this task: no retention-format decision was made or needed — only where the existing screenshot/manifest bytes live changed, not what they contain.

### Checkpoint: Store unified
- [x] `render_capture`, `gallery-view`, `gallery-gate`, critics all read/write one layout; old provisional readers migrated or shimmed — `candidates::scan_candidates`/`read_scorecard` and the `/candidate-artifacts` static mount all read from `{data_dir}/artifacts/<run_id>/artifacts/`; no reader left on the old `./runs/` tree. Verified via `cargo test --workspace` (0 failures) plus `cargo clippy --workspace --all-targets` (no new warnings) — no live `smasher serve` run performed this pass, so the fix is test-verified but not yet manually re-verified end-to-end the way Phase 1/2 checkpoints were.
- [x] Human review (touches every prior module's path assumption) — **approved 2026-09-11**: proceed to Task 10

### Phase 5: E2E proof + docs
- [x] Task 10: Example factory pipeline (Discover → Define → Deliver per §4 with corrected `shape=hexagon gallery="true"` gates, iterate/proceed edges, Prune + axe-core A11yCheck) + fix `smasher-design-factory.md` §4 diamond example — new fixture `smasher/examples/product_design_factory.dot`; structural + lint tests in `example_dot_parse.rs`/`example_lint.rs`; an engine-level (no LLM/browser) test proves both real gallery-JSON decisions route to the correctly-labeled edge against this exact graph. **Live verification closed the same session** (see Post-Task-11 findings below): the user pointed out the already-configured Ollama key could stand in for a Codergen provider, which surfaced that Codergen nodes had no provider-override mechanism at all — fixed, then the full Discover→Define→Deliver pipeline ran live through both gates end-to-end via Ollama.
- [x] Task 11: Final verification pass (every §3.3 dashboard item + §6 resolved decisions evidenced, not assumed) — checked every SPEC-gallery-gate Success Criteria bullet and every factory-doc §3.3/§6 item against actual templates and code, not the task list. Found and flagged (not fixed — verification only) two real gaps that weren't previously called out this explicitly: (1) the gallery/gate card templates confirm candidates are static `screenshot.png` captures only — no embedded live preview `<iframe>`, no interaction recording, contradicting §6's "real, lightweight interactive prototypes... not static mocks" until the retention question resolves; (2) no candidate card shows the prompt/parameters that produced it, so the "why does candidate 3 behave this way" traceability §3.3 calls for doesn't exist yet. Also corrected §3.5's artifact-store description (superseded `runs/<id>/...` sketch) to match Task 9's real layout. Everything else in Success Criteria/§3.3/§6 is evidenced with live or test proof — see `tasks/todo.md` Task 11 for the full bullet-by-bullet checklist.

### Post-Task-11 findings (2026-09-11, same session — live verification via Ollama)

The user asked for the live Discover→Deliver run Task 10 had flagged as unverified, pointing out Ollama was already configured. Doing that live run — not just closing the paper gap — surfaced two more real bugs, one fixed, one filed:

- **Fixed — Codergen had no provider-override mechanism at all** (`smasher` commit `db28098`). Unlike `task_critic`/`synthesis` (which already support `args["provider"]`), Codergen nodes had no way to route to a provider whose model names `infer_provider` can't recognize. Traced all the way through: `CodergenHandler` only read a `model` attr, `CodergenBackend::generate`'s signature had no provider parameter, `SessionConfig` had no `provider` field at all. Added a `provider` node attr, threaded it through all 6 `CodergenBackend` implementors, added `SessionConfig::with_provider()`, wired it into the `Request` `session.rs` builds per turn.
- **Fixed — a pipeline's second (or later) gallery gate silently degraded to a plain text question** (`smasher` commit `11d419a`). `find_gallery_gate()` returns the graph's *first* gallery-shaped node unconditionally; both the gate-card renderer and the decision endpoint used it as "the currently pending gate." Any pipeline with more than one gallery gate — exactly `product_design_factory.dot`'s shape — silently lost every gate after the first. Found live: `GalleryGate2` rendered as a plain free-text card with no edge buttons. Fixed by matching on the node id the pending question itself names.
- **Filed, not fixed — Parallel/FanIn nodes never actually execute concurrently.** `CritiqueParallel -> SystemLint` and `CritiqueParallel -> TaskCritic` are two edges off one Parallel node; only `SystemLint` ran. Traced to the engine core: `Engine::run()`'s main loop calls `select_edge()` unconditionally for *every* node type, which always returns exactly one edge. `execute_parallel()`/`ParallelHandler`/`FanIn` are fully unit-tested in isolation but **never invoked from `Engine::run()`** — `execute_parallel(` has zero callers outside its own test module anywhere in the codebase. This means every "parallel fan-out" example in the repo (`megaplan.dot`, `consensus_task_parity.dot`, `semport_thematic.dot`, and now `product_design_factory.dot`) has a `shape=component` node that has never caused real concurrent branch execution in an actual `smasher run`/`smasher serve` — only ever verified by parse/structure tests, never by live execution. Consequence in this run: `Synthesis` failed (missing `critic-report.json`, since `task_critic` never ran) and `A11yCheck` also failed (a `tool_command` node with no `provider` override hit `infer_provider`'s `None` case) — yet the pipeline still reached `Completed`, meaning Tool-node failures don't block edge traversal either. Presented to the user as a substantial, separate architectural gap; explicitly deferred, not fixed this session — see Open Questions below.

### Checkpoint: Complete
- [x] All acceptance criteria met; capability-map entries marked done — modules that are actually done are marked Done; `task-critic-synthesis` moved to Done 2026-09-13 (its one named open item, the Parallel/FanIn engine gap, is now fixed — see Open Questions below); `gallery-gate`/`artifact-store` stay "In progress" deliberately, each against a real open item below
- [x] Ready for human review of full Discover→Deliver run — **live-verified 2026-09-11**: `product_design_factory.dot` ran through Discover (IAOptions + 4 render_capture candidates), `GalleryGate1`, Define (Implement, render, SystemLint), `GalleryGate2`, Deliver (Prune, A11yCheck) to `Completed`, all via Ollama. Real caveat surfaced by this same run, not swept under: the critique loop's `TaskCritic`/`Synthesis` branch didn't execute as designed, root-caused to the new Parallel/FanIn finding above — this run proves the gate/decision/artifact machinery end-to-end, not the critique loop's parallel-fan-out path specifically.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `shape=diamond` example in factory spec never pauses (Conditional, not Interviewer) | High — copy-pasted pipeline silently skips gate | SPEC-gallery-gate assumption 2 already supersedes it; Task 10 propagates fix back to factory doc |
| Timeout/default path bypasses selection validation | Med — auto-resume on forged-equivalent input | Documented limitation in spec; Task 2 tests leave question pending only on explicit decisions, timeout behavior unchanged and flagged |
| Parallel gates undefined (single-queue engine, oldest-first) | Med — future pipeline with 2 gates misbehaves | Out of scope by spec; Task 3 renders one gate at a time, open question carried |
| Vision-model critic cost + loop trust | High — expensive, converged judgment | Phase 2 after stable gate; stopping criteria + model choice tested before loop use; synthesis is cheap model |
| Two artifact trees diverge | Med — readers disagree on candidate location | No path changes until Phase 4; Phase 4 migrates all readers at once behind human gate |
| Candidate kit too thin for real variety | Med — Discover candidates look samey | Kit grows per pipeline demand (spec §5.1); system_lint already checks kit usage at Discover time |

## Open Questions (for human review)

- ~~Kit completeness bar before factory is genuinely useful, and kit evolution process (from Vision "What's still open").~~
  **Decided 2026-09-13 by Jobsworth:** no fixed completeness bar — the kit keeps
  evolving continuously, adding components as pipelines demand them, with no
  milestone that marks it "complete." See `Vision.md`'s "Decisions reached".
- ~~Render/capture retention: live embeddable build vs interaction recording vs both; what persists in store vs reproducible on demand.~~
  **Decided 2026-09-13 by Jobsworth:** live embeddable preview. Candidates
  should be served as real, running builds and embedded (e.g. `<iframe>`) on
  the gallery card, not just captured as a static `screenshot.png`. This is a
  real scope change from the current static-only implementation — not yet
  built; needs its own implementation pass against `render-capture` and
  `artifact-store`. See `Vision.md`'s "Decisions reached".
- ~~Timeout/default_choice semantics at gallery nodes (validate or bypass — conscious decision before relying on timeouts).~~
  **Decided 2026-09-13 by Jobsworth:** remove `human.timeout_secs`/
  `default_choice` entirely rather than validate it — not relied on by any
  pipeline today, and a half-validated bypass mechanism isn't worth keeping
  around. **Implemented and verified 2026-09-17**; see `SPEC-gallery-gate.md`.
- ~~Lint-badge content (pass/fail dot vs violation counts) and what `task-critic-synthesis` revises on the card.~~
  **Decided 2026-09-13 by Jobsworth:** dot by default, expandable on
  click/hover to show the full violation breakdown from `lint-report.json`.
  **Implemented and verified 2026-09-17**, hover included; see
  `SPEC-gallery-gate.md`.
- ~~Marketing-surface boldness vs core-workflow consistency split: which surfaces get visual-variety prompts vs interaction-pattern prompts (Vision § product vs marketing).~~
  **Decided 2026-09-13 by Jobsworth:** split by phase, per Vision's original
  framing — Discover/marketing-style surfaces get visual-variety prompts,
  core-workflow surfaces get interaction-pattern-consistency prompts. Not yet
  implemented as an explicit prompting rule.
- ~~Prompt/parameter traceability on candidate cards ("why does candidate 3 behave this way") — never implemented, found during Task 11's verification pass.~~
  **Decided 2026-09-13 by Jobsworth:** surface it on hover/expand rather than
  directly on the card, to keep cards visually clean. Not yet implemented;
  needs the prompt/persona/task/generation params captured and exposed from
  candidate generation through to `_candidate_card.html`.
- **Not urgent — replace hardcoded dated model strings with alias-based resolution (added 2026-09-11 by Jobsworth).** Left parked 2026-09-13 — no pipeline currently blocked on it. Smasher-wide, not design-factory-specific, but noticed here: `smasher-cli/src/run.rs` and `smasher-web/src/routes/{api.rs,pages.rs}` each hardcode `TASK_CRITIC_MODEL = "claude-sonnet-4-20250514"` and `SYNTHESIS_MODEL = "claude-3-5-haiku-20241022"` (duplicated 3x); `smasher-web/src/server.rs`'s `ServerConfig::default()` hardcodes the same dated Sonnet string as the pipeline-wide default. These go stale as Anthropic ships new dated snapshots. Per <https://code.claude.com/docs/en/model-config>, Claude Code itself resolves bare aliases (`sonnet`, `opus`, `haiku`, `fable`) to the latest model per family per provider, overridable via `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU,FABLE}_MODEL` env vars — that mechanism is specific to the `claude` CLI/Agent SDK's own resolution layer, though, not necessarily something `smasher-llm`'s `AnthropicAdapter` gets for free just by sending the literal string "sonnet" as `model` in a raw Anthropic Messages API call. Whoever picks this up should first confirm whether the raw API accepts these aliases (or an equivalent un-dated form) before assuming this is a drop-in constant swap.
- ~~**`Engine::run()` never actually executes Parallel/FanIn nodes concurrently**~~
  (found 2026-09-11 during live Ollama verification). **Resolved 2026-09-13** by
  `tasks/archive/plan-task-critic-synthesis.md` Tasks 1-4: `Engine::execute_loop` now
  special-cases `Parallel` nodes (scoped to single-hop branches, the only shape
  any pipeline in this repo uses), reusing `execute_parallel()`/`ParallelHandler`/
  `FanIn` unchanged. Proved both at the engine level, against the real
  `product_design_factory.dot` `CritiqueParallel` shape, and live through
  `smasher run` against a real Ollama server — `TaskCritic` and `SystemLint` now
  genuinely execute concurrently, each exactly once, and `Synthesis` succeeds
  with both real inputs. `megaplan.dot`/`consensus_task_parity.dot`/
  `semport_thematic.dot` benefit from the same engine fix, though only this
  factory's critique loop was live-verified. `task-critic-synthesis` is now
  `Done` in `capability-map.md`.

## Parallelization

- Sequential: Task 1 → 2 → 3 (engine → endpoint → card); Task 4 + 5 → 6 (critics → scorecards); Phase 1 → Phase 3 (history needs gate records).
- Parallel-eligible once gate ships: Task 4 vs Task 7 (critic vs history — different files, shared only on gate context shape which Task 1 freezes).
- Needs contract-first: scorecards (Task 6) need `lint-report.json` layout + synthesis output shape frozen by Tasks 4–5.
