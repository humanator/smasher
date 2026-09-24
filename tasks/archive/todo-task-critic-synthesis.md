# Task List: `task-critic-synthesis` — Closing Out

Full context and rationale in `tasks/archive/plan-task-critic-synthesis.md`. Spec:
`design-factory/SPEC-task-critic-synthesis.md`. Prior implementation history (Tasks
4-6, the crate itself): `tasks/archive/todo-gallery-gate.md`.

Conventions: `cargo test --workspace`, `cargo clippy --workspace` per `smasher/CLAUDE.md`.
All files start with two `ABOUTME:` lines. Tests: real fixtures, no mocking the thing
under test (per this repo's standing rule) — the one existing carve-out is the
already-`#[ignore]`d live-Ollama test in `critique_loop_e2e.rs`, unchanged by this plan.

---

## Task 0: Amend spec + capability-map framing

**Description:** `SPEC-task-critic-synthesis.md`'s opening paragraph still describes
`gallery-gate` as "in progress — Tasks 1-3 built, checkpoint verification pending"
and its Open Questions section doesn't mention that the crate itself is already built,
wired, and live-verified via Ollama. Update the spec's framing (not its Assumptions —
those were followed) and Open Questions to state the real current status: crate done;
one concrete blocking gap (`Engine::run()` never dispatches `Parallel`/`FanIn`
concurrently). Update `capability-map.md`'s `task-critic-synthesis` row to name that
gap specifically instead of a bare "In Progress".

**Acceptance criteria:**
- [x] `SPEC-task-critic-synthesis.md`'s header paragraph reflects that the crate is
      built and wired, not still pending `gallery-gate`'s own checkpoint
- [x] Its Open Questions section notes the Parallel/FanIn engine gap as the reason
      this module isn't marked Done, alongside the three pre-existing open items
- [x] `capability-map.md`'s `task-critic-synthesis` row keeps a terse 1-2 word
      "Status" cell ("In Progress"); the blocking-gap detail lives only in
      `SPEC-task-critic-synthesis.md`'s Open Questions and this plan, not duplicated
      into the map

**Verification:**
- [x] Read-through: matches `tasks/archive/plan-task-critic-synthesis.md`'s Overview

**Dependencies:** None

**Files likely touched:**
- `design-factory/SPEC-task-critic-synthesis.md`
- `design-factory/capability-map.md`

**Estimated scope:** XS (doc edits only)

---

## Task 1: Graph-shape validation for Parallel/FanIn convergence

**Description:** Add `check_parallel_fanin_shape(graph: &Graph) -> Vec<LintWarning>`
to `crates/smasher-attractor/src/graph/validation.rs`, following the existing
`check_<rule>` pattern exactly (e.g. `check_orphan_node`, `check_dead_end_node`) and
registering it in `validate()`'s aggregator. Rules, each a `Severity::Error`
`LintWarning` naming the offending node id:
- A `NodeType::Parallel` node with fewer than 2 outgoing edges (not actually parallel).
- Any outgoing edge from a `Parallel` node whose target is not either (a) the
  `FanIn` node itself, or (b) a node whose own single outgoing edge leads to a
  `FanIn` node.
- Two branches of the same `Parallel` node resolving to two *different* `FanIn`
  targets (ambiguous convergence).
This is pure, read-only graph inspection — no engine changes yet, same "new code
before shared wiring" ordering `system-lint`/`gallery-gate` both used.

**Acceptance criteria:**
- [x] `check_parallel_fanin_shape` added to `validation.rs`, wired into `validate()`
- [x] A `Parallel` node with 1 outgoing edge → `Severity::Error` warning naming it
- [x] Two single-hop branches converging on the same `FanIn` → no warning
- [x] A branch pointing to a node whose own outgoing edge is *not* the shared
      `FanIn` (or is a second, different `FanIn`) → `Severity::Error` warning naming
      the offending branch
- [x] `product_design_factory.dot`'s real `CritiqueParallel`/`SystemLint`/
      `TaskCritic`/`CritiqueJoin` shape produces zero new warnings

**Verification:**
- [x] Unit tests (in `validation.rs`'s own `#[cfg(test)] mod tests`, same file):
      too-few-branches case, valid two-branch case, mismatched-FanIn case,
      direct-to-FanIn zero-work-branch case — one test per case
- [x] `cargo test -p smasher-attractor` exits 0
- [x] Re-run `example_lint.rs`'s existing `EXAMPLES` sweep (which already includes
      `product_design_factory.dot`) and confirm no new warning appears for it
      (note: this sweep exercises the separate `lint::LintRunner` framework, which
      does not call `graph::validation::validate()` — see commit message for detail;
      a dedicated unit test loading the real fixture through `validate()` covers the
      actual claim instead)

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/graph/validation.rs`

**Estimated scope:** Small-Medium (1 file, several focused tests)

---

## Task 2: `resolve_parallel_branches()` helper

**Description:** Add a pure helper (in `parallel.rs`, alongside `execute_parallel`)
that, given a `Graph` and a `Parallel` node's id, returns the ordered list of branch
node ids and the single shared `FanIn` node id — or a typed error. This is what
`Engine::execute_loop` (Task 3) will call to know *what* to hand to
`execute_parallel()` and *where* to resume afterward. Reuses the exact shape Task 1
validates, so a graph that already passed validation should never hit this
function's error path in production — but the function validates independently
(don't rely on validation having run first) so it's safe to call standalone/in tests.

```rust
pub struct ParallelBranches {
    pub branch_node_ids: Vec<String>,
    pub fan_in_id: String,
}

pub enum BranchResolutionError {
    TooFewBranches { parallel_id: String, count: usize },
    AmbiguousFanIn { parallel_id: String, targets: Vec<String> },
    NotSingleHop { parallel_id: String, branch_id: String },
}

pub fn resolve_parallel_branches(
    graph: &Graph,
    parallel_id: &str,
) -> Result<ParallelBranches, BranchResolutionError>;
```

**Acceptance criteria:**
- [x] `resolve_parallel_branches` returns `branch_node_ids` in the `Parallel` node's
      own edge declaration order (not resorted) and the correct shared `fan_in_id`
- [x] Same three error cases as Task 1's validation rules, as typed errors here
      (`TooFewBranches`, `AmbiguousFanIn`, `NotSingleHop`)
- [x] A branch pointing directly at the `FanIn` node resolves correctly (zero-work
      branch case)

**Verification:**
- [x] Unit tests: valid two-branch case (asserts exact `branch_node_ids` order +
      `fan_in_id`), each of the three error cases, the direct-to-FanIn case —
      table-driven against small in-test `Graph` fixtures (same construction style
      `parallel.rs`'s existing tests already use via `make_node`)
- [x] `cargo test -p smasher-attractor` exits 0

**Dependencies:** None (independent of Task 1's validation code, though it covers the
same shape — Task 1 can land in either order relative to this one; sequenced first in
the task list only because it's the cheaper, purely-lint-facing half)

**Files likely touched:**
- `crates/smasher-attractor/src/parallel.rs`

**Estimated scope:** Small-Medium (1 file, table-driven tests)

---

## Task 3: Wire concurrent dispatch into `Engine::execute_loop`

**Description:** In `crates/smasher-attractor/src/engine.rs`'s `execute_loop`
(around line 531 where the current node is looked up and dispatched), special-case
`node.node_type == NodeType::Parallel`:
1. Call `resolve_parallel_branches(&self.graph, &current_node_id)`; a
   `BranchResolutionError` here is a real bug (validation should have caught it at
   load time) — convert to `EngineError` and abort, don't silently fall through.
2. Read `max_concurrency`/`fail_fast` node attrs exactly like `ParallelHandler::execute`
   already does (extract that attr-parsing into a small shared function both can call,
   rather than duplicating it).
3. Call `execute_parallel(branch_nodes, &self.registry, &context, &parallel_config)`
   — the existing, unit-tested primitive, unchanged.
4. For each branch outcome: emit the same `NodeStarted`/`NodeCompleted`/`NodeFailed`
   events the single-node path already emits (so the dashboard/SSE log stream sees
   every branch node, not just the `Parallel` node itself), record it in
   `node_outcomes`, mark it visited, and run it through the same auto-checkpoint
   logic already in the loop.
5. Set `current_node_id = fan_in_id` with an aggregate `Outcome` (`Success` if
   `ParallelResult::all_succeeded()`, else `Failure` naming the failed branch ids) —
   this becomes the `FanIn` node's own recorded outcome, then `continue` the loop so
   the `FanIn` node is dispatched normally afterward (still through `ParallelHandler`,
   unchanged) and `select_edge` resumes the single-node path from there on.
No other node type's handling in the loop changes.

**Acceptance criteria:**
- [x] A `Parallel` node with 2 branches: both branches' handlers are actually
      invoked (provable via a `SlowHandler`-style test double recording call
      order/timing, same technique `parallel.rs`'s own tests already use)
- [x] Both branches' `NodeStarted`/`NodeCompleted` events appear in the emitted
      event stream, in addition to the `Parallel` and `FanIn` nodes' own events
- [x] All branch outcomes land in `node_outcomes`/checkpoint state, keyed by their
      own node ids
- [x] One branch failing (with `fail_fast: false`) still runs the other branch to
      completion, and `FanIn`'s recorded outcome is a `Failure` naming the failed
      branch — downstream `select_edge` from `FanIn` behaves exactly as it already
      does for any other `Failure` outcome (no new special-casing needed there)
- [x] A `Parallel` node whose shape fails `resolve_parallel_branches` produces a
      clear `EngineError`, not a panic or silent skip

**Verification:**
- [x] New tests in `crates/smasher-attractor/tests/engine_integration.rs` (or a new
      file if that one doesn't fit): a small fixture graph with `Start -> Parallel ->
      {BranchA, BranchB} -> FanIn -> Exit` run through a real `Engine`, asserting
      both branches' outcomes and events — no LLM/browser involved, pure
      handler-registry dispatch (same zero-network technique this repo's other
      engine-level tests already use)
- [x] `cargo test -p smasher-attractor` exits 0
- [x] `cargo test --workspace` exits 0 — no regression to any existing example's
      structural/engine tests (`megaplan.dot`, `consensus_task_parity.dot`,
      `semport_thematic.dot`, `product_design_factory.dot`'s own gate-routing tests)
- [x] `cargo clippy --workspace` clean

**Implementation note:** wiring `execute_parallel` into `Engine::execute_loop`
surfaced a latent bug in `execute_parallel` itself (pre-existing, not part of
this task's original scope): its `stream::iter(...).buffer_unordered(...)`
over borrowed `&GraphNode`s produced a future whose `Send`-ness only held for
one specific inferred lifetime, not generically — invisible until something
called it from within a `Send`-requiring context (`smasher-web`'s
`tokio::spawn` call sites, once `Engine::run()` transitively reached
`execute_parallel` for the first time). Fixed by boxing/pinning each branch's
future explicitly in `execute_parallel` (behavior unchanged, `parallel.rs`'s
own tests still pass) rather than leaving it as an opaque `impl Future`. Also
extracted the `execute_parallel(...).await` call into its own
`Engine::dispatch_parallel_branches` async fn — inlining it directly in
`execute_loop`'s deeply nested loop/async-block reintroduced the same Send
inference failure even after the `parallel.rs` fix.

**Dependencies:** Tasks 1, 2

**Files likely touched:**
- `crates/smasher-attractor/src/engine.rs`
- `crates/smasher-attractor/src/parallel.rs` (shared attr-parsing helper)
- `crates/smasher-attractor/tests/engine_integration.rs` (or a new test file)

**Estimated scope:** Medium (loop surgery in a large, load-bearing file — keep the
diff to the minimum special-case branch described above, no other reordering)

---

## Checkpoint: Engine change verified in isolation

- [x] `cargo test -p smasher-attractor` green, including Tasks 1-3's new tests
- [x] `cargo clippy -p smasher-attractor` clean
- [x] **Human review before Task 4** — this changes the shared execution loop every
      pipeline in the repo runs through; confirm the special-case is scoped exactly
      as described (single-hop branches only) before proving it live. Also worth
      double-checking: the `execute_parallel` Send-bug fix and the
      `dispatch_parallel_branches` extraction described in Task 3's implementation
      note above, since both were judgment calls made to get `cargo build/test
      --workspace` green rather than things explicitly specified in the plan.

---

## Task 4: E2E proof through the real Parallel/FanIn shape

**Description:** Prove Task 3's fix against an actual `Parallel`/`FanIn` node, not
the sequential bypass `critique_loop.dot` uses today. Two parts:
1. A new, zero-LLM engine-level integration test (extends Task 3's own verification,
   but against the *real* `product_design_factory.dot` graph specifically) asserting
   that `CritiqueParallel`'s real edges (`-> SystemLint`, `-> TaskCritic`) both get
   dispatched when driven through `HandlerRegistry` with recording test-double
   handlers — the same technique `example_dot_parse.rs`'s existing
   `product_design_factory_gate2_answers_route_to_the_named_edge` test already uses
   for gate routing, applied here to the parallel branch.
2. Update `critique_loop.dot` (or add a sibling fixture) to route
   `SystemLint`/`TaskCritic` through a real `Parallel`/`FanIn` pair instead of
   chaining them sequentially, and re-run the existing `#[ignore]`d
   `critique_loop_produces_real_artifacts_and_scorecard_data` test live (real Ollama
   server) to confirm both `lint-report.json` and `critic-report.json` are produced
   from one real `smasher run` through the actual parallel shape, and `synthesis`
   succeeds reconciling both.

**Acceptance criteria:**
- [x] New engine-level test (no LLM/browser) proves both `SystemLint` and
      `TaskCritic` are dispatched when `product_design_factory.dot`'s real
      `CritiqueParallel` node is driven through a real `Engine`
- [x] `critique_loop.dot` (or a new sibling fixture) has `SystemLint`/`TaskCritic`
      as true parallel branches off a `Parallel` node, converging at a `FanIn`
      before `Synthesis`
- [x] Live rerun (real Ollama key) of the critique-loop E2E test through this
      updated shape: `critic-report.json` exists (proving `TaskCritic` actually ran
      this time), `synthesis-report.json` exists and cites both inputs — run
      against `smasher/.env`'s local Ollama daemon
      (`http://localhost:11434`), `critique_loop_produces_real_artifacts_and_scorecard_data`
      passed in 4.99s

**Verification:**
- [x] `cargo test -p smasher-attractor` (new engine-level test, non-ignored) exits 0
- [x] `cargo test -p smasher-cli -- --ignored critique_loop` run manually with a real
      `OLLAMA_API_KEY`/`OLLAMA_BASE_URL` present (sourced from `smasher/.env`) — passed
- [x] `cargo test --workspace` (non-ignored) exits 0

**Dependencies:** Task 3

**Files likely touched:**
- `crates/smasher-attractor/tests/example_dot_parse.rs` (new test)
- `crates/smasher-cli/tests/fixtures/critique_loop.dot`
- `crates/smasher-cli/tests/critique_loop_e2e.rs` (assertions only, if the fixture
  shape change requires it)

**Estimated scope:** Medium (test + fixture change, one live manual rerun)

---

## Checkpoint: Critique loop genuinely concurrent

- [x] `TaskCritic` and `SystemLint` both demonstrably execute under
      `CritiqueParallel` in one real run — both the engine-level proof and
      Task 4's live rerun (real Ollama, local daemon) confirm it
- [x] `cargo test --workspace` green, no regression to any other example pipeline
- [x] **Human review** — this is the specific, concrete fact that lets
      `task-critic-synthesis` move past "In Progress" honestly

---

## Task 5: `task_critic` reads optional `index.html` context

**Description:** Per `SPEC-task-critic-synthesis.md`'s Open Questions, extend
`run_task_critic` (`crates/smasher-task-critic-synthesis/src/task_critic.rs`) to
also read the candidate's `index.html` (same file `system_lint` already reads, same
directory) and include its raw text as an additional `ContentPart::text(...)`
alongside the existing persona/task text and the screenshot image — giving the model
non-visual context (semantic markup, aria attributes) a screenshot alone can't carry.
**Best-effort, not required:** if `index.html` is missing or unreadable, proceed with
exactly today's behavior (screenshot + persona/task only) — never a
`CriticError::MissingArtifact` for this file specifically, since assumption 3's
screenshot-only baseline must keep working for any candidate shape without static
markup.

**Acceptance criteria:**
- [x] `run_task_critic` reads `index.html` from the candidate directory when
      present and includes its contents as extra prompt text
- [x] `index.html` absent → request built and sent exactly as before (no new error
      path, no change to existing passing tests)
- [x] `CRITIC_SYSTEM_PROMPT` or the user-turn text makes clear to the model which
      part is markup vs. persona/task, so the added context doesn't get confused
      with the screenshot description

**Verification:**
- [x] Unit test: fixture candidate *with* an `index.html` — request built includes
      its content in a `ContentPart::text`
- [x] Unit test: fixture candidate *without* `index.html` — request built is
      byte-for-byte the same shape as before this task (regression guard)
- [x] `cargo test -p smasher-task-critic-synthesis` (non-ignored) exits 0
- [x] Manual: re-ran via the Ollama path (real local daemon) against a temp
      candidate combining the fixture screenshot with
      `smasher-system-lint/fixtures/clean-candidate/index.html`'s markup — real
      call succeeded, returned a legible `CriticReport`, and the model correctly
      treated the screenshot as authoritative over the markup (it flagged that
      the screenshot didn't match the markup, rather than hallucinating the
      button the markup described) — the temporary test used for this was
      reverted afterward, not kept

**Dependencies:** None (independent of Tasks 1-4; sequenced after per the user's
explicit "both, sequenced" choice, not a technical dependency)

**Files likely touched:**
- `crates/smasher-task-critic-synthesis/src/task_critic.rs`
- `crates/smasher-task-critic-synthesis/fixtures/candidate/` (add an `index.html` if
  the existing fixture doesn't already have one worth reusing)

**Estimated scope:** Small-Medium (1-2 files, a handful of focused tests)

---

## Task 6: Final verification pass + capability-map update

**Description:** Confirm the whole `task-critic-synthesis` module meets every
Success Criteria bullet in `SPEC-task-critic-synthesis.md` from a clean pass — not
accumulated task-by-task assumptions — now that the parallel critique loop is real.
Update `capability-map.md`'s `task-critic-synthesis` row to `Done` if every bullet is
genuinely evidenced, or leave it `In Progress` naming whatever specific item still
isn't, rather than marking it Done on the strength of "most of it works."

**Acceptance criteria:**
- [x] Every bullet in `SPEC-task-critic-synthesis.md`'s Success Criteria section
      re-checked fresh, including "exactly one real LLM call made" holding true
      under the now-concurrent dispatch (not accidentally doubled or dropped) —
      strengthened Task 4's engine-level test to assert exact-once-each dispatch
      counts for `SystemLint`/`TaskCritic`, not just "at least once"
- [x] `cargo test --workspace` and `cargo clippy --workspace` both clean
- [x] `capability-map.md`'s `task-critic-synthesis` row updated to match the
      honestly-earned status (`Done`)

**Verification:**
- [x] Line-by-line check against `SPEC-task-critic-synthesis.md`'s Success Criteria,
      same bar `system-lint`'s and `gallery-gate`'s own Task 9/11 final passes used —
      all six bullets hold (crate builds clean; task_critic/synthesis both
      live-verified via `critique_loop_e2e` against real Ollama; missing-critic-report
      failure path tested and named; malformed-response `Outcome::failure` path
      confirmed via `CriticError`'s `Display` impl carrying the raw response text;
      workspace green). SPEC's stale "In Progress" status and Open Questions
      (Parallel/FanIn gap, `index.html`) updated to reflect Tasks 1-5 closing them.
- [x] `cargo test --workspace` and `cargo clippy --workspace --all-targets` clean

**Dependencies:** Tasks 0-5

**Files likely touched:**
- `design-factory/capability-map.md`
- `design-factory/SPEC-task-critic-synthesis.md` (if any Success Criteria wording
  needs correcting, not just the status)

**Estimated scope:** XS (verification only; fixes go back into the owning task's
files if this pass finds a gap)

---

## Checkpoint: Complete

- [x] Every bullet in `SPEC-task-critic-synthesis.md`'s Success Criteria section is
      checked off with evidence (test output, live-run confirmation), not assumed
- [x] `capability-map.md`'s `task-critic-synthesis` entry reflects reality (`Done`)
- [x] Open Questions carried forward (multi-hop parallel, synthesis override,
      multi-candidate fan-out, model-alias resolution) are recorded, not silently
      dropped — the two Open Questions Tasks 1-5 actually closed (Parallel/FanIn
      dispatch, optional `index.html`) are marked resolved, not deleted
