# Spec: `task-critic-synthesis` — Usability Critic + Recommendation Synthesis

Module id: `task-critic-synthesis` (see `capability-map.md`). Depends on: `gallery-gate`
(done) and `system-lint` (done). Sixth build slice per the capability map's build
order, after `component-kit`, `render-capture`, `system-lint`, `gallery-view`, and
`gallery-gate`.

**Status (2026-09-13): Done.** `crates/smasher-task-critic-synthesis` is a real
workspace member, wired into both `smasher-cli` and `smasher-web` at all four
construction sites. `Engine::execute_loop` now actually dispatches `Parallel`/`FanIn`
nodes concurrently (`tasks/archive/plan-task-critic-synthesis.md` Tasks 1-3), and the
`CritiqueParallel -> {SystemLint, TaskCritic} -> CritiqueJoin` shape this module's
critique loop depends on has been proven both at the engine level (against the real
`product_design_factory.dot` graph) and live, end-to-end through `smasher run` against
a real Ollama server (Task 4) — `TaskCritic` and `SystemLint` both genuinely execute in
one real run, each exactly once, and `synthesis` reconciles both real inputs.
`task_critic` also optionally reads the candidate's `index.html` for non-visual
context (Task 5). See `tasks/archive/plan-task-critic-synthesis.md` and
`tasks/archive/todo-task-critic-synthesis.md` for the full closing-out history.

## Objective

Provide the two remaining pipeline nodes from `smasher-design-factory.md` §3.2 that
turn a rendered candidate into a proceed/iterate recommendation without a human
eyeballing every candidate by hand: `task_critic` (a vision-capable model attempts a
named task against the candidate's captured screenshot and reports friction/success)
and `synthesis` (reconciles `task_critic`'s output with `system_lint`'s existing
`lint-report.json` into one recommendation). Together these are the second of the two
parallel critics Vision.md's "resolution" section calls for — a deterministic
design-system check plus a task-based usability check — synthesised into a single
verdict a human reacts to at a gate, rather than a single aesthetic score.

Who uses it:
- **`synthesis`**, consuming `task_critic`'s `critic-report.json` directly — the two
  nodes are one module because `synthesis` has no meaning without `task_critic`'s
  output alongside `system_lint`'s.
- **A human at a `gallery-gate`** (already shipped), who sees the synthesised
  recommendation next to a candidate before deciding whether to proceed or iterate —
  this module fills the "lint badge slot" `SPEC-gallery-gate.md`'s Open Questions
  reserved, and may extend it to show the usability verdict too (see Assumptions).
- **`decision-history`** (later module), which will log whether a human agreed or
  disagreed with this module's recommendation — not this module's concern to build.
- **A human validating this slice directly**, before the gate card is extended, by
  reading the written `critic-report.json` and `synthesis-report.json`.

Success looks like: run a Tool node with `tool="task_critic"` pointed at a captured
candidate, get back a structured report — success/fail against the named task, with
friction points — with exactly one real LLM call made. Run a Tool node with
`tool="synthesis"` pointed at the same candidate, get back a structured
proceed/iterate recommendation reconciling that report with the candidate's existing
`lint-report.json`, with exactly one real LLM call made.

## Assumptions

Seven decisions anchor this spec; everything else fills in underneath them.

1. **New crate `smasher-task-critic-synthesis`** under `crates/`, added as a workspace
   member. One `ToolBackend` impl, `TaskCriticSynthesisToolBackend`, dispatches both
   `"task_critic"` and `"synthesis"` natively and delegates everything else — same
   generic-over-fallback shape `render-capture` and `system-lint` each established
   (`TaskCriticSynthesisToolBackend::new(fallback: Arc<dyn ToolBackend>) -> Self`). It
   wraps `SystemLintToolBackend` at the same two construction sites those specs used
   (`crates/smasher-cli/src/run.rs`, `crates/smasher-web/src/backend.rs`), becoming the
   new outermost backend passed to `ToolHandler::new(...)`. One crate for both tools,
   not two, because they are one module id in the capability map and always get wired
   together.

2. **Both nodes are deterministic Tool nodes that call the LLM client directly
   (`smasher_llm::client::Client::complete()`), not Codergen/prompt nodes routed
   through the agent session.** This supersedes `smasher-design-factory.md` §4's
   example, which authored `TaskCritic`/`Synthesis` as `class="critic"`/
   `class="implementer"` Codergen nodes with a `prompt=` attribute — same kind of
   correction `SPEC-gallery-gate.md` made to that example's `shape=diamond` gate nodes.
   Reason: `CodergenBackend::generate(prompt: &str, model, context)` and the agent's
   `ToolOutput { content: String, .. }` are text-only today — there is no path for a
   Codergen node or an agent tool call to carry image bytes without changing the
   `Handler`/`CodergenBackend`/`AgentTool` trait definitions in `smasher-attractor` /
   `smasher-agent`, which both `render-capture` and `system-lint` explicitly ruled out
   ("Never do: change the ToolBackend/Handler trait definitions"). A one-shot direct
   `Client::complete()` call needs no such change: it is already precedented
   (`smasher-conformance/src/tier3.rs`'s own `CodergenBackend` does the same thing),
   and `smasher_llm::types::ContentPart::Image` already exists and needs no
   modification. DOT authoring becomes a plain Tool node, same shape as
   `render_capture`/`system_lint`:
   ```dot
   TaskCritic [shape=parallelogram, label="Usability critic", tool="task_critic",
               args="{\"run_id\": \"...\", \"candidate_id\": \"...\",
                      \"persona\": \"...\", \"task\": \"...\"}"];
   Synthesis  [shape=parallelogram, label="Synthesise critiques", tool="synthesis",
               args="{\"run_id\": \"...\", \"candidate_id\": \"...\"}"];
   ```

3. **`task_critic` reads the already-captured `screenshot.png`, not `candidate_dir`.**
   Args are `{run_id, candidate_id, persona, task, model?}` — no `candidate_dir`. By
   the time `task_critic` runs, `render_capture` has already written
   `runs/<run_id>/artifacts/<candidate_id>/screenshot.png` (per
   `smasher-render-capture::manifest::artifact_dir()`), the same image
   `gallery-view`/`gallery-gate` already show a human. The critic sees exactly what the
   human gate will show — no second rendering path to keep in sync. Reading
   `index.html`/interactive markup for additional non-visual context is out of scope
   for this slice (Open Questions).

4. **`synthesis` reads two sibling artifacts, writes a third, calls the LLM with text
   only — no image.** Args `{run_id, candidate_id, model?}`. It reads
   `lint-report.json` (from `system-lint`, already shipped) and `critic-report.json`
   (produced by assumption 3) from `runs/<run_id>/artifacts/<candidate_id>/`, embeds
   both as JSON inside the prompt, and asks for
   `{"recommendation": "proceed"|"iterate", "reasons": [...]}`, written to
   `synthesis-report.json` alongside them. If `critic-report.json` is missing (author
   forgot to wire the `task_critic` edge first), `synthesis` fails with a clear
   `HandlerError`/`Outcome::failure` naming the missing file rather than
   recommending on lint alone — a real, fixable pipeline-authoring mistake, not a
   silent partial verdict.

5. **Model selection: a `default_model` constructor arg per tool (mirroring
   `AgentCodergenBackend`/`LlmToolBackend`'s existing pattern) plus an optional
   `"model"` field inside a node's `args`, with no `model_stylesheet`/`.critic` class
   involvement.** `model_stylesheet`'s class-based resolution is wired specifically
   into `CodergenHandler::execute` reading `node.attrs.get("model")`; `ToolHandler` /
   `ToolBackend` never see node attrs or the stylesheet, only the parsed `args` value —
   reusing the stylesheet for Tool nodes would be a separate, real engine feature and
   is out of scope here. `TaskCriticSynthesisToolBackend::new(fallback, task_critic_model:
   String, synthesis_model: String)` sets the vision-capable and cheap defaults; a DOT
   author overrides per-invocation via `args`, same as `render_capture`'s `args` already
   carry per-invocation values.

6. **Response parsing: a strict JSON-only system-prompt instruction; a parse failure
   surfaces the raw response text inside the tool failure reason, never silently drops
   or half-parses it.** Both requests set `temperature: Some(0.0)` (already a `Request`
   field) to reduce, not eliminate, format drift — a still-malformed response is a
   legitimate `Outcome::failure`, visible in the run log, not swallowed.

7. **Testing keeps this repo's real-data-real-APIs standard, but isolates the one
   genuinely expensive/flaky part.** Report-struct, parsing, and artifact-path logic
   are unit-tested against real fixture JSON strings and a real fixture PNG's bytes —
   nothing about the LLM client is mocked. The one test that makes an actual outbound
   call to a vision-capable model is a real `Client::complete()` call against the real
   fixture screenshot, marked `#[ignore]` and gated on a real provider API key being
   present in the environment, run explicitly rather than as part of the default
   `cargo test --workspace` loop — the same isolation pattern any disciplined suite
   uses for a genuinely non-deterministic, billed, network-dependent test, without
   introducing a mock in place of the real client. Flagging this explicitly since it's
   worth confirming given the standing "real APIs, no mocking" rule.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, new workspace crate `smasher-task-critic-synthesis`.
- `smasher-llm` (`Client`, `Request`, `Message`, `ContentPart::Image`, `ImageData`) —
  used directly, no agent/session layer involved.
- `base64` (already an unused-here workspace dependency) to encode `screenshot.png`
  bytes into `ContentPart::Image`'s `data` field.
- Zero new Cargo dependencies — `base64`, `serde`, `serde_json`, `thiserror`, `tokio`,
  `async-trait` are all already workspace dependencies.

## Commands

```bash
# Build and test this crate in isolation
cargo check -p smasher-task-critic-synthesis
cargo test -p smasher-task-critic-synthesis
cargo clippy -p smasher-task-critic-synthesis

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# Live-LLM tests (real API key required, not run by default)
ANTHROPIC_API_KEY=... cargo test -p smasher-task-critic-synthesis -- --ignored

# Standalone tool call, no pipeline involved
cargo run -p smasher-task-critic-synthesis --example critique -- <run_id> <candidate_id> <persona> <task>
```

## Project Structure

```
crates/smasher-task-critic-synthesis/
  Cargo.toml
  src/
    lib.rs             # crate error type + re-exports of both report structs
    backend.rs          # TaskCriticSynthesisToolBackend: ToolBackend impl + fallback
    task_critic.rs       # run_task_critic(): build Request w/ image, call client, parse
    synthesis.rs          # run_synthesis(): read two reports, build Request, parse
    report.rs               # CriticReport / SynthesisReport / Recommendation, serde,
                             #   artifact_dir() helper (same shape as system-lint's)
  examples/
    critique.rs               # standalone CLI: run_id candidate_id persona task -> stdout JSON
  tests/
    task_critic_test.rs        # integration: parsing + artifact writing against fixtures/
    synthesis_test.rs           # integration: reads fixture lint+critic reports, writes
                                 #   synthesis-report.json
  fixtures/
    candidate/
      screenshot.png              # reused fixture: same PNG smasher-render-capture ships
    reports/
      lint-report.json              # a real system-lint output, passing
      critic-report.json             # a real task-critic output, success: true

# Existing files touched, not created:
Cargo.toml                                     # add crate member (zero new external deps)
crates/smasher-cli/src/run.rs                 # wrap SystemLintToolBackend in
                                               #   TaskCriticSynthesisToolBackend
crates/smasher-web/src/backend.rs             # same
design-factory/SPEC-task-critic-synthesis.md  # this file
design-factory/capability-map.md              # touched: task-critic-synthesis status
                                               #   Done when complete
```

## Code Style

Matching the established shapes — flat `thiserror` enum, two-line `ABOUTME` header,
generic-over-fallback `ToolBackend` impl dispatching two tool names instead of one:

```rust
// ABOUTME: Usability critic (task_critic) + recommendation synthesis (synthesis)
// ABOUTME: pipeline tools. One real LLM call each, no agent loop, no mocking.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CriticError {
    #[error("missing artifact for {run_id}/{candidate_id}: {path}")]
    MissingArtifact {
        run_id: String,
        candidate_id: String,
        path: String,
    },
    #[error("model response was not valid JSON: {response}")]
    UnparseableResponse { response: String },
}
```

```rust
// crates/smasher-task-critic-synthesis/src/report.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CriticReport {
    pub persona: String,
    pub task: String,
    pub success: bool,
    pub friction: Vec<String>,
    pub notes: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Recommendation {
    Proceed,
    Iterate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesisReport {
    pub recommendation: Recommendation,
    pub reasons: Vec<String>,
}
```

```rust
// crates/smasher-task-critic-synthesis/src/task_critic.rs
async fn run_task_critic(
    client: &smasher_llm::client::Client,
    default_model: &str,
    args: &Value,
) -> Result<CriticReport, CriticError> {
    let screenshot = std::fs::read(screenshot_path(run_id, candidate_id))
        .map_err(|_| CriticError::MissingArtifact { .. })?;

    let request = Request {
        model: model_override(args).unwrap_or(default_model).to_string(),
        system_prompt: Some(CRITIC_SYSTEM_PROMPT.to_string()), // demands JSON-only reply
        temperature: Some(0.0),
        messages: vec![Message {
            role: Role::User,
            content: vec![
                ContentPart::text(format!("Persona: {persona}\nTask: {task}")),
                ContentPart::Image(ImageData {
                    source_type: ImageSourceType::Base64,
                    media_type: Some("image/png".into()),
                    data: base64::engine::general_purpose::STANDARD.encode(&screenshot),
                }),
            ],
            name: None,
            tool_call_id: None,
        }],
        ..Default::default()
    };

    let response = client.complete(request).await?;
    let text = response.text().unwrap_or_default();
    serde_json::from_str(&text).map_err(|_| CriticError::UnparseableResponse { response: text })
}
```

```rust
// crates/smasher-task-critic-synthesis/src/backend.rs
#[async_trait::async_trait]
impl ToolBackend for TaskCriticSynthesisToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        match tool_name {
            "task_critic" => self.run_task_critic(args).await,
            "synthesis" => self.run_synthesis(args).await,
            _ => self.fallback.execute_tool(tool_name, args, context).await,
        }
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["task_critic".to_string(), "synthesis".to_string()]
    }
}
```

## Testing Strategy

Per this repo's testing standard: real data, real fixture bytes, no mocking of the
thing under test. The one carve-out is assumption 7: the actual network call to a
live LLM provider is isolated behind `#[ignore]`, not mocked.

- **Unit (`report.rs`):** `CriticReport`/`SynthesisReport` serde roundtrip against real
  JSON strings; `artifact_dir()` joins run/candidate id exactly like
  `render-capture`/`system-lint`'s own copies.
- **Unit (`task_critic.rs`):** response-parsing table: a well-formed
  `{"success": true, "friction": [], "notes": "..."}` string parses cleanly; a
  non-JSON string produces `CriticError::UnparseableResponse` carrying the original
  text (not swallowed); a missing `screenshot.png` produces
  `CriticError::MissingArtifact` before any network call is attempted (assert via a
  panic-on-any-request `Client`, the same zero-LLM-proof technique `render-capture`'s
  spec established, adapted here to prove the *failure* path also short-circuits).
- **Unit (`synthesis.rs`):** same parse-table shape against `SynthesisReport`; a
  fixture directory missing `critic-report.json` produces
  `CriticError::MissingArtifact` naming that exact file, again before any network call.
- **Integration (`tests/task_critic_test.rs`, `tests/synthesis_test.rs`):** exercise
  the full `run_task_critic`/`run_synthesis` path against `fixtures/` with a real
  `smasher_llm::client::Client` constructed the same way `tier3.rs` builds one — these
  are the `#[ignore]`d, real-API-key-gated tests from assumption 7. They assert the
  written artifact deserializes to the expected report shape and that the
  recommendation logic is sane (e.g. a failing `critic-report.json` + a passing
  `lint-report.json` still yields `iterate`, not `proceed`).
- **Manual:** this session runs the ignored tests once with a real key present (or
  reviews their last recorded output if a key isn't available in this environment) and
  reads the written `critic-report.json`/`synthesis-report.json` to confirm the text is
  legible and the recommendation is defensible given the inputs — same "open it and
  look at it" bar `system-lint` and `gallery-gate` each set.
- **Regression:** `cargo test --workspace` (excluding `--ignored`) stays green with
  zero new non-ignored tests touching the network — no change to `system-lint`'s or
  `render-capture`'s own crates.

## Boundaries

- **Always do:** run `cargo test -p smasher-task-critic-synthesis` and
  `cargo clippy --workspace` before considering a task done; keep the live-API test(s)
  `#[ignore]`d and out of the default `cargo test --workspace` loop; surface a
  malformed model response as a visible `Outcome::failure`, never a silently-dropped
  or partially-parsed report; keep the crate at zero new Cargo dependencies.
- **Ask first:** editing `crates/smasher-cli/src/run.rs` or
  `crates/smasher-web/src/backend.rs` — shared, load-bearing wiring, same gate
  `render-capture` and `system-lint` each used; extending `gallery_gate.html`'s
  reserved lint-badge slot to also show this module's recommendation (touches
  `gallery-gate`'s template, owned by that module).
- **Never do:** route `task_critic`/`synthesis` through the agent session or
  `CodergenBackend` (defeats assumption 2's whole point); change the
  `Handler`/`ToolBackend`/`AgentTool` trait definitions in `smasher-attractor` /
  `smasher-agent`; touch `design-kit/` or `system-lint`'s own checks/report shape;
  build the `decision-history` panel (later module, only reads this module's output
  eventually).

## Success Criteria

- `smasher-task-critic-synthesis` builds; `cargo test -p smasher-task-critic-synthesis`
  (non-ignored) passes with zero warnings.
- Running `task_critic` against a fixture candidate with a real API key produces
  `critic-report.json` at `runs/<run_id>/artifacts/<candidate_id>/` with a legible
  success/fail verdict and friction list for the given persona/task.
- Running `synthesis` against that same candidate directory (with both
  `lint-report.json` and the freshly written `critic-report.json` present) produces
  `synthesis-report.json` with a `proceed`/`iterate` recommendation and reasons that
  cite both inputs.
- `synthesis` run against a candidate missing `critic-report.json` fails clearly,
  naming the missing file, and writes no `synthesis-report.json`.
- A malformed/non-JSON model response for either tool surfaces as an `Outcome::failure`
  containing the raw response text, not a panic or a silently-empty report.
- `cargo test --workspace` (non-ignored) stays green — no regression to
  `system-lint`, `render-capture`, or `gallery-gate`.

## Open Questions

- ~~`Engine::run()` never dispatches `Parallel`/`FanIn` nodes concurrently.~~
  **Resolved** by `tasks/archive/plan-task-critic-synthesis.md` Tasks 1-4:
  `Engine::execute_loop` now special-cases `Parallel` nodes (scoped to single-hop
  branches), and the `CritiqueParallel -> {SystemLint, TaskCritic} -> CritiqueJoin`
  shape has been proven both at the engine level and live against a real Ollama
  server — `TaskCritic` genuinely executes now, `Synthesis` succeeds with both real
  inputs present.
- ~~Whether `task_critic` should also read the candidate's raw `index.html`.~~
  **Resolved** by Task 5: `run_task_critic` best-effort reads it as an additional,
  clearly-labeled `ContentPart::text` alongside the screenshot; absence is not an
  error and the request shape is unchanged from before.
- ~~Exact extension of `gallery_gate.html`'s reserved lint-badge slot to also surface
  this module's recommendation.~~ **Resolved** — already built:
  `gallery_gate.html` renders `synthesis: {{ label }}` from
  `gc.scorecard.synthesis_recommendation_label()`, plus `synthesis_reasons()`.
  Confirmed 2026-09-17.
- Multi-candidate fan-out (N Discover candidates each getting their own
  `task_critic`/`synthesis` invocation from one DOT authoring) has no defined
  mechanism yet anywhere in this pipeline — `render-capture` and `system-lint`'s own
  e2e fixtures hardcode a single candidate's args, and this module follows the same
  single-candidate-per-invocation shape. Solving fan-out is a pipeline-authoring or
  engine-templating concern bigger than this module, deferred until a real multi-
  candidate DOT pipeline is actually authored.
- Whether `synthesis`'s reconciliation logic needs anything beyond "ask the model,
  trust its JSON" — e.g. a deterministic override where a failing `lint-report.json`
  always forces `iterate` regardless of what the model says — is left to observed
  behavior once a few real runs exist, not decided here.
