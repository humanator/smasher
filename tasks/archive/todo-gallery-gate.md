# Task List: Semi-Dark Design Factory — Remaining Work

Full context in `tasks/plan.md`. Specs: `smasher-design-factory.md`, `smasher/docs/design-factory/SPEC-gallery-gate.md`. Vision: `Vision.md`.

Conventions: `cargo test --workspace`, `cargo clippy --workspace` per `smasher/CLAUDE.md`. All files start with two `ABOUTME:` lines. Tests: real fixtures/queues, no mocking the thing under test.

---

## Task 1: Engine structured-answer branch

**Description:** Additive `parse_gallery_answer()` in `crates/smasher-attractor/src/interviewer.rs` plus `HumanGateHandler` structured-answer branch: store parsed object (not raw string) in context under node id, use `decision` as outcome `preferred_label` so existing edge routing follows the human's edge. Legacy path unchanged.

**Acceptance criteria:**
- [x] `parse_gallery_answer('{"selected":["a"],"decision":"proceed"}')` returns parsed object; `{}` and `{"selected":[],"decision":"  "}` return None
- [x] Handler stores parsed object under node id and sets `preferred_label` to decision value
- [x] Legacy plain answer (`"yes"`) stores string and labels exactly as today; timeout + `human.default_choice` unchanged

**Verification:**
- [x] Tests pass: `cargo test -p smasher-attractor interviewer`
- [x] Build succeeds: `cargo check -p smasher-attractor -p smasher-web`
- [x] Manual check: existing non-gallery gate fixture still pauses/resumes with plain string
      — closed by "Checkpoint: Gate usable" below (confirmed live via HTTP against
      `examples/human_gate_showcase.dot`, unaffected by the gate work)

**Dependencies:** None (builds on `gallery-view` done + existing `HumanGateHandler`/`HttpInterviewer`)

**Files likely touched:**
- `smasher/crates/smasher-attractor/src/interviewer.rs`

**Estimated scope:** Small (1-2 files)

---

## Task 2: Validated decision endpoint

**Description:** New `smasher-web` route `POST /api/runs/{id}/gallery/{qid}/decision` accepting `{"selected": [...], "decision": "..."}`. Pure `validate_decision()` (no AppState, unit-testable) checks run exists, qid pending, decision non-empty, every id passes `valid_id` and matches a successfully captured candidate; then forwards canonical JSON string via existing `record.interviewer.answer_question()`. Failed captures unselectable.

**Acceptance criteria:**
- [x] Happy path returns canonical JSON and unblocks awaiting `ask()` with that JSON
- [x] Unknown run → 404; unknown qid → success:false JSON, question left pending
- [x] Forged id / failed candidate / traversal id (`../x`) / empty decision → 400-class rejection, question left pending, pipeline does not resume

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (unit `validate_decision` + axum integration with real fixture artifacts + genuinely pending `HttpInterviewer` question)
- [x] Build succeeds: `cargo clippy -p smasher-attractor -p smasher-web`
- [x] Manual check: `curl` forged id against paused run is rejected — closed by
      "Checkpoint: Gate usable" below (forged/traversal/unknown candidate ids
      against `gallery_gate_showcase.dot` all confirmed rejected 400-class, live)

**Dependencies:** Task 1

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/gallery.rs` (new)
- `smasher/crates/smasher-web/src/routes/mod.rs`
- `smasher/crates/smasher-web/src/candidates.rs` (reuse only, change only if shared validator needed — ask first)

**Estimated scope:** Medium (3-5 files)

---

## Task 3: Gate card in dashboard

**Description:** `run_questions` locates first Interviewer node with `gallery="true"` in `record.graph`; when gate node + pending questions + non-empty `scan_candidates`, render new `gallery_gate.html` card targeting oldest pending question alongside (not instead of) plain question cards. Card: checkbox grid over gallery-view shape, expected/found count hint (`candidate_count` literal or `phase_default(discover=4,define=2,deliver=1)`, overridden by `candidates=N` launch var), one button per outgoing edge label, click-to-expand anchor to `screenshot_url`, lint-badge slot reserved, "no boxes + iterate = reject-all" note.

**Acceptance criteria:**
- [x] Paused run with candidates shows gate card in Human Input section with checkboxes on live candidates, none on failed ones
- [x] Expected-vs-found hint renders; one button per outgoing edge label
- [x] Submitting selection + edge resumes down matching edge; empty selection + iterate resumes iterate path with `"selected": []`
- [x] No candidates / no pending questions / non-gallery run renders exactly as today

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web`
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] Manual check: `smasher serve`, fixture pipeline with `render_capture` → gallery gate, open `/runs/{id}` in browser, check two candidates, submit edge, confirm resume + context `{"selected": [...], "decision": "..."}`
      — closed by "Checkpoint: Gate usable" below (submitted `gallery_gate_showcase.dot`
      live, confirmed resume + context shape, via HTTP calls standing in for the
      browser click-through)

**Dependencies:** Task 2

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/gallery_gate.html` (new)
- `smasher/crates/smasher-web/static/style.css`
- `smasher/crates/smasher-web/templates/run_detail.html` (Candidates/Human Input wiring)

**Estimated scope:** Medium (3-5 files)

---

## Checkpoint: Gate usable

- [x] Run `cargo test -p smasher-attractor -p smasher-web` — 1164 unit tests + all
      integration/doctest binaries pass, 0 failures
- [x] `cargo clippy --workspace` — decision: accept the 6 pre-existing style
      warnings (`smasher-llm/src/util/sse.rs:55`, `smasher-attractor/src/dot/lexer.rs:215`,
      `parallel.rs:155`, `state.rs:1154,1238`, `stats.rs:71`) as pre-existing debt;
      none in gate code, none added or changed by this checkpoint's work
- [x] New fixture `smasher/examples/gallery_gate_showcase.dot`: 3 real
      `render_capture` nodes feeding a `shape=hexagon gallery="true"` gate with
      `proceed`/`iterate` edges, based on `GALLERY_DOT`/`insert_test_record_with`
- [x] Manual check (closes Task 1's box): `smasher serve` +
      `examples/human_gate_showcase.dot` (plain, non-gallery) still pauses/resumes
      — confirmed live via HTTP, unaffected by the gate work
- [x] Manual check (closes Task 2's box): forged/traversal candidate id and an
      unknown candidate id via `curl` against a paused run on
      `gallery_gate_showcase.dot` are both rejected 400-class, question stays
      pending — confirmed live
- [x] Manual check (closes Task 3's box): submitted `gallery_gate_showcase.dot`
      through the live dashboard, checked candidates, submitted an edge, confirmed
      resume + context holds `{"selected": [...], "decision": "..."}` — confirmed
      live via HTTP (no Claude-in-Chrome browser extension connected in this
      session, so the click-through was driven via the same HTTP calls a browser
      form would make, not literal mouse clicks)
- [x] Human review before Phase 2 — reviewed; found and fixed two bugs live
      manual verification surfaced (neither caught by the existing unit suite):

  1. **Critical — gallery routing was dead code in production.**
     `InterviewerHandler` and `HumanGateHandler` both claimed
     `NodeType::Interviewer` unconditionally, and `HandlerRegistry` dispatches
     to the first handler whose `handles()` matches — every one of the five
     production wiring sites registered `InterviewerHandler` first, so
     `HumanGateHandler`'s Task 1 `parse_gallery_answer` branch never ran.
     Confirmed live: submitting `{"selected":[...],"decision":"proceed"}`
     routed to the `iterate` edge (alphabetical-tiebreak fallback), not
     `proceed`. Fixed by merging `HumanGateHandler`'s logic (question/prompt
     fallback, timeout, default_choice, gallery answers) into
     `InterviewerHandler` so there is exactly one handler per node type in
     every registry, plus a `HandlerRegistry`-level regression test
     (`registry_dispatch_routes_gallery_decision_to_the_named_edge`) that
     would have caught this. Re-verified live post-fix: `Gate1 → Proceed`.
  2. **Pre-existing, unrelated to this branch — plain human-gate answer form
     415'd in a real browser.** `question_card.html`'s form has no
     `hx-ext="json-enc"`, so it posts `application/x-www-form-urlencoded`
     like any plain HTML form; `answer_question` required
     `Json<AnswerQuestionRequest>`. The route's only test hardcoded
     `content-type: application/json`, masking it. Fixed by switching the
     extractor to `Form<AnswerQuestionRequest>` plus a regression test that
     posts the exact content type the rendered form sends.

  Still open, not fixed (out of scope for this checkpoint, tracked below):
  render_capture's `run_id` arg is a literal string with no templating, so
  it never matches the server-assigned run id on a real `smasher serve`
  submission — candidates land in an orphaned directory and the gate card
  shows zero found until manually relocated. This is the same class of gap
  already named in Phase 4's "Two artifact trees diverge" risk, just now
  concretely reproduced; a real fix likely needs `{{run_id}}` variable
  expansion available to Tool node args after the run id is assigned (today
  `expand_variables`/`apply_transforms` runs before the run id exists).

---

## Task 4: `task_critic` tool + crate scaffold

**Description:** New workspace crate `smasher-task-critic-synthesis` providing a
`TaskCriticSynthesisToolBackend: ToolBackend` that dispatches `"task_critic"` (this
task) and `"synthesis"` (Task 5), delegating everything else to a wrapped
`fallback: Arc<dyn ToolBackend>` — same generic-over-fallback shape as
`render-capture`/`system-lint`. `task_critic` reads
`runs/<run_id>/artifacts/<candidate_id>/screenshot.png`, sends it + a persona/task
prompt to a vision-capable model via `smasher_llm::client::Client::complete()`
directly (no Codergen/agent-session layer — image content has no path through
`CodergenBackend`/`AgentTool`'s text-only `ToolOutput`), parses a strict-JSON
response into `CriticReport`, writes `critic-report.json`. Per
`SPEC-task-critic-synthesis.md`.

**Acceptance criteria:**
- [x] Crate scaffold builds as a new workspace member:
      `src/{lib.rs, backend.rs, task_critic.rs, synthesis.rs (stub), report.rs}`;
      `TaskCriticSynthesisToolBackend::new(fallback, task_critic_model: String,
      synthesis_model: String)`; `execute_tool` dispatches `"task_critic"`/`"synthesis"`,
      else delegates to `fallback`; `available_tools()` returns
      `["task_critic", "synthesis"]`
- [x] `CriticReport { persona, task, success, friction: Vec<String>, notes }` and
      `CriticError { MissingArtifact { run_id, candidate_id, path }, UnparseableResponse
      { response } }` in `report.rs` (`Serialize`/`Deserialize`/`Debug`/`Clone`/
      `thiserror::Error`)
- [x] `run_task_critic(client, default_model, args: &Value) -> Result<CriticReport,
      CriticError>`: args `{run_id, candidate_id, persona, task, model?}`; missing
      `screenshot.png` → `MissingArtifact` **before any network call**; `Request`
      with JSON-only `system_prompt`, `temperature: Some(0.0)`, `Message` content
      `[ContentPart::text, ContentPart::Image(base64 PNG)]`; malformed response →
      `UnparseableResponse` carrying raw text, never panics/silently-empty
- [x] Writes `critic-report.json` to the candidate dir on success
- [x] Real fixture PNG + JSON for parsing/artifact-path unit tests — nothing about
      the LLM client mocked; one `#[ignore]`d test makes a real `Client::complete()`
      call against a live provider key, excluded from default `cargo test --workspace`

**Verification:**
- [x] Tests pass: `cargo test -p smasher-task-critic-synthesis` (non-ignored), zero warnings
- [x] Build succeeds: `cargo clippy --workspace`
- [x] Manual check: `cargo test -p smasher-task-critic-synthesis -- --ignored` (real
      API key) against the fixture candidate produces a legible success/fail verdict
      + friction list — **the literal `#[ignore]`d test still isn't run**: it hardcodes
      a Claude model and this environment has no Anthropic/OpenAI/Gemini key. Verified
      equivalently instead: added Ollama provider support to `smasher-llm` (see
      `smasher` commit `e12bb50`) plus an `args["provider"]` override on this crate's
      tools (commit `774da9e`), then ran the real `run_task_critic()` against the
      fixture screenshot through a local `ollama serve` proxying to Ollama Cloud
      (`gemma4:31b-cloud`) — produced a legible, correctly-typed `CriticReport`
      (`success: false`, friction citing the fixture's lack of real UI)

**Dependencies:** Task 3 + Checkpoint: Gate usable

**Files likely touched:**
- `smasher/Cargo.toml` (workspace member)
- `smasher/crates/smasher-task-critic-synthesis/` (new crate)

**Estimated scope:** Medium-Large (8-10 files, new crate)

---

## Task 5: `synthesis` tool

**Description:** Second tool in `smasher-task-critic-synthesis`: cheap-model,
text-only reconciliation of `system_lint`'s `lint-report.json` and Task 4's
`critic-report.json` into a proceed/iterate recommendation. Then wire
`TaskCriticSynthesisToolBackend` into both existing backend construction sites,
wrapping `SystemLintToolBackend` — the "ask first" step per spec boundaries, since
it changes the outermost tool backend used by every run.

**Acceptance criteria:**
- [x] `Recommendation { Proceed, Iterate }` (snake_case serde) and `SynthesisReport
      { recommendation, reasons: Vec<String> }` in `report.rs`
- [x] `run_synthesis(client, default_model, args: &Value) -> Result<SynthesisReport,
      CriticError>`: args `{run_id, candidate_id, model?}`; reads `lint-report.json`
      + `critic-report.json`, embeds both in the prompt, `temperature: Some(0.0)`;
      missing `critic-report.json` → `MissingArtifact` naming the file, **no network
      call**, no `synthesis-report.json` written; malformed response →
      `UnparseableResponse` with raw text
- [x] Writes `synthesis-report.json` on success, reasons cite both inputs (asserted
      against a fixture with conflicting lint/critic input) — asserted via the
      `#[ignore]`d live test `live_call_on_conflicting_fixtures_picks_a_side_citing_both_inputs`,
      not yet run (no key in this environment)
- [x] **Ask first, then wire:** `TaskCriticSynthesisToolBackend` becomes the new
      outermost backend (wrapping `SystemLintToolBackend`) at
      `crates/smasher-cli/src/run.rs` and `crates/smasher-web/src/backend.rs`
      — **go-ahead given; actual construction lives at 4 sites, not the 2 the spec
      named** (`smasher-cli/src/run.rs`, `smasher-web/src/routes/pages.rs`,
      `smasher-web/src/routes/api.rs` ×2 — initial submit + resume); all 4 wired
- [x] Real fixture `lint-report.json`/`critic-report.json` pairs (agreeing +
      conflicting cases); one `#[ignore]`d real-API test per spec's testing rule

**Verification:**
- [x] Tests pass: `cargo test --workspace` (non-ignored) stays green — no regression
      to `system-lint`/`render-capture`/`gallery-gate`
- [x] Build succeeds: `cargo clippy --workspace`
- [x] Manual check: synthesis on a fixture with conflicting lint-vs-critic input
      picks a side with stated reasons citing both — same Ollama path as Task 4's
      manual check: ran the real `run_synthesis()` against the conflicting fixture
      pair (clean lint, friction-heavy critic) through Ollama Cloud
      (`gemma4:31b-cloud`) — correctly recommended `"iterate"`, with reasons
      explicitly citing both the passing lint report and the critic's friction

**Dependencies:** Task 4 (crate scaffold) + `system_lint` (done)

**Files likely touched:**
- `smasher/crates/smasher-task-critic-synthesis/src/{synthesis.rs, report.rs, backend.rs}`
- `smasher/crates/smasher-cli/src/run.rs` (ask first)
- `smasher/crates/smasher-web/src/backend.rs` (ask first)

**Estimated scope:** Medium (5-6 files, 2 of them ask-first)

**Deferred (spec's Open Questions, not this task's scope):** whether `task_critic`
should also read `index.html`; extending `gallery_gate.html`'s lint-badge slot to
show this module's recommendation (belongs to Task 6, ask first before touching
that template); multi-candidate fan-out has no engine mechanism yet; whether
`synthesis` needs a deterministic override beyond "ask the model."

---

## Task 6: Live critic scorecards

**Description:** Surface `system_lint` + `task_critic` + `synthesis` as structured cards next to the relevant candidate in the gate card — pass/fail per check, friction per task — not buried in log stream. Fills the lint-badge slot reserved in Task 3.

**Acceptance criteria:**
- [x] Each candidate shows lint pass/fail + friction points beside its preview
- [x] Synthesis recommendation visible at gate level before edge buttons
- [x] Polls via existing HTMX/SSE partial pattern (same cadence as Candidates section)
      — no new poll route needed: the gate card already re-renders on every
      existing `/runs/{id}/questions` 2s poll, and scorecards are read fresh
      on each render

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (92 passed)
- [x] Manual check: fixture run with lint violation + critic friction shows both on
      the right candidate in browser — rendered the real template via the test
      harness (no live server possible, no API key in this environment to boot
      it) to a static file, opened it in Chrome: candidate-a correctly shows
      lint:fail + violation text, critic:friction + friction text, and
      synthesis:iterate + reason; candidate-b (no reports) shows nothing

**Dependencies:** Tasks 3, 5

**Files likely touched:**
- `smasher/crates/smasher-web/templates/gallery_gate.html`
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/static/style.css`

**Estimated scope:** Small-Medium (2-4 files)

---

## Checkpoint: Critique loop

- [x] Fixture E2E Render2 → lint + critic → synthesis → gate with scorecards evidenced
      — `smasher/crates/smasher-cli/tests/critique_loop_e2e.rs` +
      `tests/fixtures/critique_loop.dot` (commit `c8d0191`): one continuous
      `smasher run` through render_capture (real Chromium) → system_lint →
      task_critic → synthesis (both via real Ollama Cloud, `gemma4:31b-cloud`),
      asserting each stage's artifact parses as its real typed report, then
      reading the result back through `smasher_web::candidates::read_scorecard`
      — the exact function the gate card itself calls — confirming a live gate
      view of this run would show real scorecard data. `#[ignore]`d (needs
      `OLLAMA_API_KEY`/`OLLAMA_BASE_URL`); run and passing in this session
- [x] Model choice + stopping criteria documented — `task_critic` defaults to
      `claude-sonnet-4-20250514` (vision-capable), `synthesis` to
      `claude-3-5-haiku-20241022` (cheap); each is a one-shot call, no loop
- [x] Human review before Phase 3 — approved 2026-09-11, see `plan.md` for rationale

---

## Task 7: Decision history panel

**Description:** Dashboard panel logging every gate decision (selected ids, edge, timestamp, phase) separate from technical execution log. Reads the structured context records Task 1 stores. Becomes the design-rationale record for case-study use.

**Acceptance criteria:**
- [x] Panel lists each gate decision on the run with candidate ids + edge taken
- [x] Separate from execution log stream; persists across SSE updates
- [x] Empty state for runs with no gate decisions yet

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (commit `a3aa771`: 6 unit tests on
      pure `gallery_decisions()` + 3 route tests: empty state, decisions
      listed, 404 on unknown run)
- [x] Manual check: verified live against `smasher serve` — submitted
      `examples/gallery_gate_showcase.dot`, confirmed "No gate decisions yet."
      before deciding, then a real POST to the existing gallery decision
      endpoint produced a correct entry (node `Gate1`, edge `proceed`,
      candidates `candidate-a, candidate-c`, real timestamp) in the panel

**Dependencies:** Task 3 (needs real gate context records) — done via the
existing `PipelineEventLog` (`NodeCompleted` events already carry the
structured `{"selected", "decision"}` payload Task 1 stores), so no new
storage was added; `Outcome::data()` accessor added to read it.

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/run_detail.html` or new `decision_history.html`
- `smasher/crates/smasher-web/static/style.css`

**Estimated scope:** Small-Medium (2-4 files)

---

## Task 8: Branch picker + candidate count control

**Description:** Branch picker: later gates offer iterate / proceed-to-polish / fork-new-direction as named buttons mapped to graph edges (extends Task 3 edge buttons to multi-edge pipelines). Count control: runtime override of phase default via `--candidates N` CLI flag and/or dashboard launch-screen field, threaded through `submit_run` vars → pipeline context → gate hint.

**Acceptance criteria:**
- [x] Gate with 3 outgoing edges shows 3 named buttons; each resumes down its edge
- [x] `--candidates N` (or launch field) overrides DOT `candidate_count` for that run; hint shows "Expected N, found M"
- [x] No DOT edit required for override; upstream builder convention documented

**Verification:**
- [x] Tests pass: `cargo test --workspace` (commit `f9a9e2b`)
- [x] Manual check: verified live against `smasher serve` — a 3-edge pipeline
      submitted with `vars=candidates=2` showed "Expected 2, found 1"
      (overriding the DOT's `phase_default(discover)`=4), rendered all 3
      named buttons, and clicking `fork-new-direction` produced a real
      `Gate1 -> Fork [fork-new-direction]` edge traversal in the event log

**Note:** both criteria were already substantially implemented as a side
effect of Task 3 (`resolve_candidate_count`'s launch-var check, and the
generic `for edge in outgoing_edges` button loop) — this task closed the
gap with dedicated tests + a live check rather than new production code.
No `--candidates` CLI flag was added: the existing generic `--var
candidates=N` / dashboard `vars` textarea already satisfies "or launch
field," and the convention is already documented at `SPEC-gallery-gate.md`
S5 — a second, redundant flag would just be surface area.

**Dependencies:** Task 3

**Files likely touched:**
- `smasher/crates/smasher-cli/src/run.rs` (flag)
- `smasher/crates/smasher-web/src/routes/api.rs` (submit_run vars)
- `smasher/crates/smasher-web/src/routes/pages.rs` + `gallery_gate.html`

**Estimated scope:** Medium (3-5 files)

---

## Checkpoint: Rationale complete

- [x] History + branch picker + override all evidenced in browser — see
      Task 7 and Task 8 manual-check notes above (commits `a3aa771`, `f9a9e2b`)
- [x] Human review before artifact-store work — **approved 2026-09-11**: proceed to Task 9

---

## Task 9: Artifact store reconciliation — commit `b3ac7a6`

**Description:** Unify the provisional `./runs/<run_id>/artifacts/<candidate_id>/` path (cwd-relative, used by render-capture/gallery-view/gate) with `AppState.data_dir` RunDirectory tree. Migrate all readers at once (no split-brain).

**What actually diverged:** three independent copies of the same `artifact_dir(run_id, candidate_id)` path helper — in `smasher-render-capture`, `smasher-system-lint`, and `smasher-task-critic-synthesis` — each derived a CWD-relative `runs/<run_id>/artifacts/<candidate_id>/` from a `run_id` string passed in the tool's `args` JSON. None of them ever touched `RunDirectory` (the engine's own per-run tree under `AppState.data_dir`/`./artifacts`). In the CLI this collided harmlessly (both trees happened to share the same CWD by convention); in the web server the two run ids were never the same value, so a real `smasher serve` submission's candidates lived somewhere the gate card could never find them — the Phase 1 checkpoint's deferred bug.

**Fix:** all three `artifact_dir()` helpers now take the run's real `artifacts_base: &Path` (from `RunDirectory::manifest().directories.artifacts`) instead of a `run_id` string, injected into `HybridToolBackend`/`SystemLintToolBackend`/`TaskCriticSynthesisToolBackend` at construction time (all 4 call sites: web `api.rs` ×2, `pages.rs` ×1, CLI `run.rs` ×1) rather than derived per tool-call. `task_critic`/`synthesis`'s free functions now take an explicit `candidate_dir: &Path` instead of reading `run_id` from `args`. The dashboard's `candidates::scan_candidates`/`read_scorecard` and the `/candidate-artifacts` static mount all now resolve against `{data_dir}/artifacts/<run_id>/artifacts/` — the same tree `RunDirectory` already creates.

**Acceptance criteria:**
- [x] Single documented layout; all of render_capture / gallery-view / gate / critics read/write it
- [x] Old provisional readers migrated; no orphaned path helper (all three `artifact_dir()` signatures now take a base path, not a bare `run_id`)
- [ ] ~~Retention decision (live build vs recording vs both) documented~~ — out of scope for this task: only *where* the existing screenshot/manifest bytes live changed, not *what* they contain or how long they persist. Still a parked open question (see Open Questions).

**Verification:**
- [x] Tests pass: `cargo test --workspace` — 1158+ tests, 0 failures; `cargo clippy --workspace --all-targets` — no new warnings (all pre-existing, in untouched files)
- [x] Manual check: live-verified via a real `smasher serve` run of `examples/gallery_gate_showcase.dot` (3 real Chromium-rendered candidates → gate → decision → resume → completed) — the engine-assigned run id (`01m274jxm2f5jvntypyjhn7hy0`) matched the candidate path exactly, even though the DOT's `render_capture` args still carried the old stale literal `"run_id": "gallery-gate-showcase"`, confirming that arg is now fully ignored and the injected base path is what governs the path. Static mount served the real PNG (200, correct byte count); on-disk tree matched `{data_dir}/artifacts/<run_id>/{manifest.json,checkpoints/,nodes/,events/,artifacts/<candidate>/{screenshot.png,manifest.json}}` exactly.

**Dependencies:** Tasks 2, 3, 6 (all readers must exist before unification)

**Files touched:**
- `smasher/crates/smasher-render-capture/src/{manifest.rs,backend.rs}`
- `smasher/crates/smasher-system-lint/src/{report.rs,backend.rs}`
- `smasher/crates/smasher-task-critic-synthesis/src/{report.rs,backend.rs,task_critic.rs,synthesis.rs}` + its `tests/*.rs`
- `smasher/crates/smasher-web/src/{candidates.rs,server.rs,routes/{api.rs,pages.rs,gallery.rs}}`
- `smasher/crates/smasher-cli/src/run.rs` + `tests/{critique_loop_e2e.rs,render_capture_e2e.rs,system_lint_e2e.rs}`

---

## Checkpoint: Store unified

- [x] All artifact readers green against one layout — `cargo test --workspace` 0 failures + live `smasher serve` run above
- [x] Human review (cross-module path change) — **approved 2026-09-11**: proceed to Task 10

---

## Task 10: Example factory pipeline + docs fix

**Description:** Ship the §4 example as a runnable `.dot` fixture (IAOptions → Render1 → GalleryGate1 → Implement → Render2 → SystemLint + TaskCritic → Synthesis → GalleryGate2 → iterate→Implement / proceed→Prune → A11yCheck → Exit) with corrected Interviewer-shape gates (`shape=hexagon gallery="true"`, not `diamond`), and propagate the correction back to `smasher-design-factory.md` §4.

**What else was wrong in §4, beyond the diamond:** the original pseudo-DOT also used `class="implementer"`/`class="critic"` + a CSS-like `model_stylesheet` (no such per-node-model mechanism exists — a node's model comes from its own `llm_provider`/`llm_model` attrs), `tool_command="build-and-serve-candidates ..."` for what are now real native tools (`render_capture`/`system_lint`/`task_critic`/`synthesis` via `tool="..."` + `args="{json}"`), and `condition="decision=iterate"` on gate edges (the real, tested mechanism — Task 1 — is a plain edge `label` matched against the decision string; there is no `condition=` attribute in gate routing). Fixing only the shape would still have produced a pipeline that doesn't run. The doc's corrected block now uses only implemented, tested syntax and points to the checked-in fixture as the authoritative version.

**Acceptance criteria:**
- [x] Fixture pipeline pauses at both gates as drawn — structurally: both `GalleryGate1`/`GalleryGate2` resolve to `NodeType::Interviewer` with `gallery="true"` (`product_design_factory_has_two_gallery_gates`)
- [x] Edges route per gate decision — real mechanism is a plain edge `label` matched against the decision string, not `condition="decision=X"` (that attribute doesn't exist on gate routing); proven both structurally (`product_design_factory_gates_route_on_the_edge_matching_the_decision`) and at the engine level for both real decision values (`product_design_factory_gate2_answers_route_to_the_named_edge`)
- [x] Factory spec §4 diamond example corrected to hexagon + `gallery="true"` — plus the `class=`/`model_stylesheet`/`tool_command`/`condition=` corrections above (`smasher-design-factory.md` §4)
- [x] Prune + `axe-core` A11yCheck nodes present (stub tool ok if axe wiring deferred with note) — `Prune` is a real Codergen node; `A11yCheck` is a `tool_command` shell stub explicitly labeled "not a real audit", axe-core wiring deferred

**Verification:**
- [x] Tests pass: engine E2E (no browser/LLM) answering gallery JSON traverses matching edge — `crates/smasher-attractor/tests/example_dot_parse.rs::product_design_factory_gate2_answers_route_to_the_named_edge` drives the real `HandlerRegistry` → `InterviewerHandler` → `select_edge` path (the same one production code uses) against this exact parsed graph for both `"iterate"` and `"proceed"`, zero LLM/browser calls. Plus 5 structural tests (parse/resolve, both gates, Parallel+FanIn shape, native tool dispatch on every tool node, edge labels) and lint/orphan/reachability coverage via `example_lint.rs`'s `EXAMPLES` list. `cargo test --workspace` and `cargo clippy --workspace --all-targets`: 0 failures, no new warnings.
- [x] Manual check: full Discover→Deliver run in browser through both gates — **performed later the same session (2026-09-11), superseding the note below.** The user pointed out the already-configured Ollama key could stand in for a Codergen provider, which surfaced that Codergen nodes had no provider-override mechanism at all (fixed, commit `db28098`: `provider` node attr threaded through all 6 `CodergenBackend` implementors + `SessionConfig::with_provider()`). With that fix, `product_design_factory.dot` ran live through Discover (IAOptions + 4 render_capture candidates) → `GalleryGate1` → Define (Implement, render, SystemLint) → `GalleryGate2` → Deliver (Prune, A11yCheck) → `Completed`, all via Ollama — closing the Codergen-content and `GalleryGate2 -> Implement` loop-back gaps this check originally flagged. Same run also surfaced and fixed a second bug (commit `11d419a`): a pipeline's second-or-later gallery gate silently degraded to a plain text question because `find_gallery_gate()` always returned the graph's first gallery node. One gap was filed, not fixed: `CritiqueParallel`'s two branches (`SystemLint`, `TaskCritic`) don't actually run concurrently — `Engine::run()` never calls `execute_parallel()` — so `Synthesis` and `A11yCheck` failed in this run (missing `critic-report.json`; no provider override on the `A11yCheck` tool node), yet the pipeline still reached `Completed` regardless, meaning tool-node failures don't block edge traversal either. See `tasks/plan.md`'s "Post-Task-11 findings" section for full detail. ~~Original note, no longer current: "not performed... needs a session with a real Anthropic/OpenAI/Gemini key to close."~~ (resolved instead via Ollama + the provider-override fix, not a new API key)
- [x] Docs diff shows §4 correction — `design-factory/smasher-design-factory.md` §4, with an inline changelog note dated 2026-09-11

**Dependencies:** Tasks 3, 5, 8

**Files touched:**
- `smasher/examples/product_design_factory.dot` (new)
- `smasher/crates/smasher-attractor/tests/example_dot_parse.rs` (+6 tests)
- `smasher/crates/smasher-attractor/tests/example_lint.rs` (+1 test, +1 `EXAMPLES` entry)
- `design-factory/smasher-design-factory.md` (§4 correction)

---

## Task 11: Final verification pass

**Description:** Line-by-line check against factory spec §3.3 (gallery, history, branch picker, scorecards, count control), §3.5 (artifact store), §6 (resolved decisions), and SPEC-gallery-gate Success Criteria. Verification only — fixes go back into the owning task's files.

**Acceptance criteria:**
- [x] Every Success Criteria bullet evidenced (test output, browser confirmation, diff check) — see checklist below; 2 genuine gaps found and flagged, not silently marked done
- [x] No `.github/workflows/` changes unless browser-CI decision revisited with user — confirmed: `git status`/`git log` show zero CI touches this whole plan (last `.github/workflows/` commit is `e3736a2`, predating all of Tasks 1–10)
- [x] Capability-map entries marked done — `component-kit`/`render-capture`/`gallery-view`/`system-lint` are Done; `task-critic-synthesis` moved to Done 2026-09-13 (its named open item, the Parallel/FanIn engine gap, is now fixed — see `tasks/archive/plan-task-critic-synthesis.md`); `gallery-gate`/`artifact-store` remain "In progress" *by design*, not oversight — each has a real open item (below); `decision-history` is Done (Task 7)

**SPEC-gallery-gate.md Success Criteria — all evidenced (Phase 1 checkpoint, unchanged since):**
- [x] `cargo test -p smasher-attractor -p smasher-web` clean, `cargo clippy --workspace` clean — reconfirmed by this session's `cargo test --workspace` (1158+ core tests, 0 failures) and `cargo clippy --workspace --all-targets` (0 new warnings)
- [x] Gate card: checkboxes on live candidates, none on failed, expected-vs-found hint, one button per edge — live-verified twice: Phase 1's original checkpoint, and again in this session's Task 9 `smasher serve` run
- [x] Selection + edge resumes down the matching edge with the right context shape — same two live verifications
- [x] Empty selection + iterate = reject-all/re-roll — unit-tested (`validate_decision`), not separately re-verified live this session
- [x] Forged/failed/empty decision rejected, question stays pending — unit-tested
- [x] Legacy non-gallery `human_gate` unchanged — unit-tested + `examples/human_gate_showcase.dot`
- [x] No regression to any existing route/template/engine test — `cargo test --workspace` 0 failures

**Factory spec §3.3 dashboard extensions — checked against the actual templates (`gallery_gate.html`, `candidate_gallery.html`, `_candidate_card.html`), not assumed from the task list:**
- [~] **Gallery view** — partially implemented. Multi-select + reject-all-and-re-roll: done. Click-to-expand: done (`<a target="_blank">` around the thumbnail). **Two real gaps, not previously called out this explicitly:**
  - "Embedded live preview (or interaction recording as a fallback)" is **not built** — every candidate is a static `screenshot.png` (Chromium capture), no `<iframe>` live preview, no recording. This *is* the parked "Render/capture retention" open question, but the dashboard templates confirm it's not a partial implementation either — it's simply not there yet.
  - "The prompt/parameters that produced it (for traceability)" is **not shown anywhere** in `_candidate_card.html` or the gate card — no prompt, no persona/task, no generation params on any candidate card. This wasn't previously tracked as an open item; adding it as one now (see below).
- [x] **Decision history panel** — done (Task 7), separate from the execution log as specified.
- [x] **Branch picker** — done (Task 8), named buttons mapped to real graph edges.
- [x] **Live critic scorecards** — done (Task 6), lint/critic/synthesis badges next to the candidate, not in the log stream.
- [x] **Candidate count control** — done (Task 8), `candidates=N` override + phase defaults, display-only per Task 3's decision.

**Factory spec §6 resolved decisions — checked against actual behavior:**
- [~] Discover-phase fidelity ("real, lightweight interactive prototypes... not static mocks") — **not yet true**: candidates are static screenshots, the same gap as above. The decision was about what Discover *should* produce; the pipeline as built produces something short of that.
- [x] Design-system source of truth (code-based tokens, local `system_lint`) — done, matches exactly.
- [x] Candidate count phase defaults, runtime-overridable — done, matches exactly.

**New open items surfaced by this pass (added to `tasks/plan.md`'s Open Questions, not fixed here — verification only):**
1. Prompt/parameter traceability on candidate cards was never implemented and wasn't previously tracked as a gap.
2. The "live preview vs recording vs static" retention question isn't just undecided in the abstract — the dashboard templates confirm the current reality is "static only," which more concretely motivates resolving it.

**Verification:**
- [x] `cargo test --workspace` and `cargo clippy --workspace --all-targets` clean — reconfirmed this session, 0 failures / 0 new warnings
- [x] Spec checklist attached to review — this section

**Dependencies:** Tasks 1–10

**Files touched:** `design-factory/smasher-design-factory.md` (§3.5 corrected to describe the real Task 9 layout instead of the superseded `runs/<id>/...` sketch); `design-factory/tasks/plan.md` (Open Questions +2, this checklist)

**Estimated scope:** XS (verification + two small doc corrections, no production code)

---

## Checkpoint: Complete

- [x] Every bullet in SPEC-gallery-gate Success Criteria + factory §3.3 checked with evidence — see Task 11 checklist above (2 genuine gaps flagged, not hidden: no embedded live preview/recording, no prompt/parameter traceability)
- [x] Human has reviewed and approved the full Discover→Deliver run — **live-verified 2026-09-11**, same session, via Ollama (see Task 10's updated verification note above and `tasks/plan.md`'s "Post-Task-11 findings"). Confirms the gate/decision/artifact machinery end-to-end; the critique loop's parallel fan-out path (`CritiqueParallel` → `SystemLint`/`TaskCritic`) is a separate, still-open gap (see below), not covered by this approval.
- [x] Ready to start next work (marketing-surface boldness split, kit growth) — no
      longer blocked on the missing live run (resolved above). The
      `Engine::run()` Parallel/FanIn gap is **also now resolved**:
      `tasks/archive/plan-task-critic-synthesis.md` Tasks 1-4 wired concurrent dispatch
      into `Engine::execute_loop` and proved it both at the engine level and
      live against the real `CritiqueParallel`/`CritiqueJoin` shape (2026-09-13;
      `task-critic-synthesis` is now `Done` in `capability-map.md`).

## Amendment (2026-09-14) implementation — done 2026-09-17

The two remaining decisions (assumptions 6 and 7 of `SPEC-gallery-gate.md`,
confirmed self-contained to this module's own files) are implemented and
live-verified:

- [x] `human.timeout_secs`/`human.default_choice` removed entirely from
      `InterviewerHandler`/`InterviewerHandlerBuilder` in
      `crates/smasher-attractor/src/interviewer.rs`: fields, builder methods,
      `resolve_timeout()`/`resolve_default_choice()`, the `tokio::time::timeout`
      wrap in the free-form `execute()` branch, and the six superseded unit
      tests all deleted — replaced with `human_gate_builder_creates_basic_handler`
      and `human_gate_ignores_legacy_timeout_and_default_choice_attrs` (the
      latter proves a node carrying both legacy attrs behaves identically to
      one without them). Confirmed zero production call sites used the removed
      builder methods before deleting them.
- [x] Lint badge in `gallery_gate.html` wrapped in native `<details>`/`<summary>`
      (dot-only by default, click reveals violations) with matching CSS in
      `style.css` (`.lint-badge`, `.lint-dot(-pass|-fail)`, hover/focus-within
      reveal) — template/CSS only, no Rust change, critic/synthesis blocks
      untouched. Live-verified in the Browser tool against a real template
      render with real passing/failing lint fixtures: dots present and
      collapsed by default, click opens `<details>` and reveals both violation
      strings, and the CSS-only hover reveal genuinely works (confirmed via
      `getComputedStyle`/`:hover` match while `<details>` stays closed) — a real
      bug was caught and fixed in this pass: `.lint-badge summary { width:
      fit-content }` was unintentionally collapsing `.lint-dot`'s explicit
      width to 0 via higher selector specificity on the same element.
- [x] `cargo test --workspace` (1178+ core tests) and
      `cargo clippy --workspace --all-targets` both clean after the change —
      same pre-existing warnings as before (none in the touched files).

`gallery-gate` is now `Done` in `capability-map.md`.
