# Implementation Plan: `task-critic-synthesis` — Closing Out

## Overview

`task-critic-synthesis` (`task_critic` + `synthesis`) is listed "In Progress" in
`capability-map.md`, and `SPEC-task-critic-synthesis.md` still reads as a pre-build spec
("Depends on: gallery-gate (in progress — Tasks 1-3 built, checkpoint verification
pending)"). Neither is current. Confirmed against the actual `smasher` repo
(2026-09-11, clean working tree on `feat/design-factory-gallery-gate`): the crate
(`crates/smasher-task-critic-synthesis`) is fully built, wired into both `smasher-cli`
and `smasher-web`, and live-verified end-to-end via Ollama — this happened as Tasks 4-6
of the *gallery-gate* plan (`tasks/archive/todo-gallery-gate.md`), not under a dedicated plan
of its own, which is why no `plan-task-critic-synthesis.md`/`todo-task-critic-synthesis.md`
existed before this one.

The module stays "In Progress" for one confirmed, concrete reason: `Engine::run()`
never actually dispatches `Parallel`/`FanIn` nodes concurrently.
`crates/smasher-attractor/src/parallel.rs`'s `execute_parallel()` — fully implemented
and unit-tested — has **zero callers outside its own test module** anywhere in the
codebase (confirmed via `grep -rn "execute_parallel" src/ | grep -v test`). The engine's
`execute_loop` treats every node, including `Parallel`/`FanIn`, through the same
single-current-node path: dispatch one node, call `select_edge()` (which always
returns exactly one edge), continue. A `Parallel` node's second-and-later outgoing
edges are therefore never visited. This was found and filed, not fixed, during the
gallery-gate plan's live Discover→Deliver run: `CritiqueParallel -> {SystemLint,
TaskCritic}` only ever ran `SystemLint` (the alphabetically-first target, per
`select_edge`'s lexical tiebreak), `TaskCritic` silently never executed, and
`Synthesis` then failed for a missing `critic-report.json` — yet the pipeline still
reached `Completed` regardless. `crates/smasher-cli/tests/critique_loop_e2e.rs`'s
existing E2E proof for the critique loop deliberately avoids this gap rather than
closing it: its fixture (`critique_loop.dot`) chains `SystemLint -> TaskCritic
-> Synthesis` sequentially, with no `Parallel`/`FanIn` node at all.

This plan closes that gap, scoped narrowly to the shape `task-critic-synthesis`
actually needs (not a general concurrent-DAG rearchitecture of the engine), then
closes the one `SPEC-task-critic-synthesis.md` Open Question worth closing now.
**Scope confirmed with the user 2026-09-11: "Both, sequenced" — engine fix first,
then the crate-level open item.**

## Dependency Graph

```
graph/validation.rs: Parallel/FanIn shape check (Task 1)
    │  (pure, no engine changes yet — same "new code before shared wiring" ordering
    │   system-lint/gallery-gate both used)
    └── resolve_parallel_branches() helper (Task 2)
            │  (pure: Graph + node id -> branch node ids + fan-in id, or a typed error)
            └── Engine::execute_loop wiring (Task 3)
                    │  (special-cases NodeType::Parallel; reuses execute_parallel()
                    │   as-is; everything else in the loop unchanged)
                    └── Checkpoint: engine change verified in isolation
                            └── Real-shape E2E proof (Task 4)
                                    └── Checkpoint: critique loop genuinely concurrent
                                            │  (the exact fact that makes this module "Done")
                                            └── task_critic reads optional index.html (Task 5)
                                                    │  (independent of Tasks 1-4, sequenced
                                                    │   after per the user's chosen ordering)
                                                    └── Final verification + capability-map (Task 6)
```

Build order: the engine fix must land and be checkpointed before the crate-level open
item, per the user's explicit choice — not because Task 5 technically depends on
Tasks 1-4 (it doesn't; `task_critic`'s own code is untouched by the engine change).

## Architecture Decisions

- **Scope the fix to single-hop branches only**: each outgoing edge from a `Parallel`
  node must lead to exactly one node whose own single outgoing edge is the same
  declared `FanIn` node (a branch may also point directly at the `FanIn` node for a
  zero-work branch). This is the only shape any pipeline in this repo uses —
  confirmed via `product_design_factory.dot`'s own structural test
  (`product_design_factory_has_critique_parallel_fanout_and_join`,
  `example_dot_parse.rs:347`): `CritiqueParallel -> {SystemLint, TaskCritic} ->
  CritiqueJoin`, both branches exactly one node deep. Multi-hop or nested parallel
  branches remain unimplemented and become an explicit Open Question below, not a
  silent generalization — solving the fully general case is the "own design pass"
  the gallery-gate plan already declined to start mid-verification.
- **Reuse `execute_parallel()`/`ParallelConfig` as-is; do not touch their
  implementation.** They're already correct and unit-tested (11 tests in
  `parallel.rs`, including concurrency-limit and fail-fast behavior) — the only gap
  is that nothing in `engine.rs` calls them. `merge_contexts()` (the
  HashMap-snapshot merge utility in the same file) is **not needed for this wiring**:
  `execute_parallel`'s own test (`execute_parallel_shares_context_across_branches`,
  `parallel.rs:790`) confirms branches already share one `Context` by reference
  (interior mutability), the same way every other node in the engine already reads
  and writes context — there are no per-branch snapshots to merge.
- **No per-branch retry loop in this pass.** A branch's failure is recorded as a
  normal `Outcome::Failure` like any other node; `RetryPolicy::from_node` is not
  invoked per-branch here. No pipeline in this repo sets `max_retry` on `SystemLint`
  or `TaskCritic` today, so this isn't dropping observed behavior — it's declining to
  add machinery nothing currently needs (smallest reasonable change).
- **Graph-shape validation lives in `graph/validation.rs`**, following the exact
  existing pattern (`check_<rule>(graph) -> Vec<LintWarning>`, registered in
  `validate()`) rather than a bespoke check bolted onto the engine loop. A
  misconfigured `Parallel`/`FanIn` shape fails fast, with a clear message, at
  graph-load time — not as a confusing partial dispatch or runtime hang.
- **Of `SPEC-task-critic-synthesis.md`'s three Open Questions, only one is built
  now: `task_critic` optionally reading `index.html`** for non-visual context
  (small, additive, and the file's absence must not fail the critic — matches
  assumption 3's screenshot-only baseline staying the default). The other two —
  a hardcoded deterministic override in `synthesis` (e.g., failing lint always
  forces `iterate`), and a multi-candidate fan-out mechanism — are recommended to
  **stay deferred**: the spec's own text says the override should wait for
  "observed behavior once a few real runs exist" (no such evidence has accumulated
  since), and fan-out is explicitly called a bigger pipeline-authoring concern than
  this module. Flagged for the user to override if either should be built instead.

## Task List

### Phase 0: Truth up the docs (no code)
- [x] Task 0: Amend `SPEC-task-critic-synthesis.md`'s stale framing +
      `capability-map.md`'s entry to match reality before further work lands

### Phase 1: Parallel/FanIn engine fix (`smasher-attractor`)
- [x] Task 1: Graph-shape validation for `Parallel`/`FanIn` convergence
- [x] Task 2: `resolve_parallel_branches()` helper
- [x] Task 3: Wire concurrent dispatch into `Engine::execute_loop`

### Checkpoint: Engine change verified in isolation
- [x] `cargo test -p smasher-attractor` green, including new validation +
      branch-resolution + engine-loop tests
- [x] `cargo clippy -p smasher-attractor` clean
- [x] **Human review before Task 4** — this is a change to the shared execution
      loop every pipeline in the repo runs through

### Phase 1 (continued): Prove it against the real shape
- [x] Task 4: E2E proof through an actual `Parallel`/`FanIn` node (not the
      sequential bypass `critique_loop.dot` uses today) — engine-level proof
      against `product_design_factory.dot`'s real `CritiqueParallel`,
      `critique_loop.dot` updated to the same real shape, and the live
      rerun against a real local Ollama daemon all pass

### Checkpoint: Critique loop genuinely concurrent
- [x] `TaskCritic` and `SystemLint` both demonstrably execute under
      `CritiqueParallel` in one real run (engine-level proof + live Ollama rerun)
- [x] `cargo test --workspace` green, no regression to any other example pipeline
      (`megaplan.dot`, `consensus_task_parity.dot`, `semport_thematic.dot`,
      `product_design_factory.dot`)
- [x] **Human review** — this checkpoint is the specific fact that lets
      `task-critic-synthesis` (and its parallel critique loop) honestly move past
      "In Progress"

### Phase 2: Crate-level open item + close-out
- [x] Task 5: `task_critic` reads optional `index.html` context
- [x] Task 6: Final verification pass + `capability-map.md` status update

### Checkpoint: Complete
- [x] Every `SPEC-task-critic-synthesis.md` Success Criteria bullet re-verified
      fresh, including against the now-real parallel critique loop
- [x] `capability-map.md`'s `task-critic-synthesis` row reflects the honestly
      earned status (Done, or still In Progress against a named remaining item)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Special-casing `Parallel` in `execute_loop` changes event ordering / checkpoint shape that `smasher-web`'s SSE log stream or dashboard depends on | Med — dashboard log/replay looks wrong for parallel steps | Task 3 emits the same `NodeStarted`/`NodeCompleted`/`NodeFailed` event pairs per branch node, in the same shapes, just multiple times within one loop iteration; Checkpoint (concurrent) includes a live `smasher serve` check on `gallery_gate_showcase.dot` and `product_design_factory.dot` to confirm the dashboard still renders normally |
| Scope creep into general nested/multi-hop parallel support | High — exactly the open-ended rearchitecture the prior session declined to start | Task 1's validation rejects any shape outside single-hop branches with a clear error rather than attempting to handle it; captured as an explicit Open Question, not solved here |
| `fail_fast`/`max_concurrency` node-attr semantics interacting with the engine's own retry/goal-gate logic in a new way | Med — a failing branch could route unpredictably | Task 3's acceptance criteria explicitly cover a failing-branch case reaching `FanIn` with a `Failure` outcome, after which existing edge-selection/goal-gate logic takes over completely unchanged |
| `index.html` isn't always present for every candidate shape (e.g. a future live-preview-only candidate) | Low — `task_critic` could start failing runs that used to succeed | Task 5 makes the read best-effort: missing `index.html` is silently omitted from the prompt, never a `CriticError` |

## Open Questions

- Multi-hop / nested parallel branches — no mechanism, deliberately out of scope;
  also affects `megaplan.dot`, `consensus_task_parity.dot`, `semport_thematic.dot`,
  none of which are this plan's concern either.
- Deterministic override in `synthesis` (e.g., a failing `lint-report.json` always
  forcing `iterate` regardless of the model's own reconciliation) — recommended to
  stay deferred pending real observed run data; the user's call if they'd rather
  build it now instead of Task 5.
- Multi-candidate fan-out args shape (N Discover candidates each getting their own
  `task_critic`/`synthesis` invocation from one DOT authoring) — recommended to
  stay deferred; a pipeline-authoring/engine-templating concern bigger than this
  module, per the spec's own words.
- Model-alias resolution (`sonnet`/`opus`/`haiku` instead of dated snapshot
  strings) — repo-wide, not urgent, already tracked in `capability-map.md`'s
  Follow-ups; unchanged by this plan.
