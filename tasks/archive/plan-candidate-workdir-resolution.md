# Implementation Plan: `candidate-workdir-resolution` (Semi-Dark Design Factory)

## Overview

`candidate-workdir-resolution` is a targeted fix to two already-`Done` modules
(`render-capture`, `system-lint`), not a new module — see the capability map
(`design-factory/capability-map.md`). Its spec is
`design-factory/SPEC-candidate-workdir-resolution.md`. Both tool backends currently
resolve a relative `candidate_dir` against the `smasher` process's own working
directory, not the isolated per-run directory a Codergen node's `prompt` output
actually lands in — which is why `examples/product_design_factory.dot` points every
render/lint node at test fixtures today instead of real generated output.

This plan breaks the spec into 6 small, vertically-sliced tasks across 5 phases.
Scope is exactly the 6 files the spec's Project Structure section lists — no new
crates, no new dependencies.

## Architecture Decisions

- **Private `resolve_candidate_dir` helper, duplicated per crate** — spec's Code Style
  section is explicit: `HybridToolBackend` and `SystemLintToolBackend` each get their
  own copy, no shared crate. Two call sites don't justify a new dependency between
  otherwise-independent crates (same reasoning `system-lint` already used for its own
  duplicated `artifact_dir()` helper).
- **`working_dir: PathBuf` is a new third constructor parameter, appended after
  `artifacts_base`** — matches spec assumption 2's framing ("gains a third
  parameter") and keeps the diff at every call site a pure addition, not a reorder.
- **Confirmed by grep: exactly 4 real construction sites, 9 test-only sites** —
  `run.rs` (1), `pages.rs` (1), `api.rs` (2, `submit_run` + `resume_run`), plus 6 test
  call sites in `smasher-render-capture/src/backend.rs` and 3 in
  `smasher-system-lint/src/backend.rs`. No site exists beyond what the spec lists, so
  the spec's "ask first" trigger for a 5th real site doesn't fire — noted here as the
  check, not skipped.
- **Existing test call sites get the minimal-diff third argument, not a rewrite** —
  most pass `PathBuf::from("/tmp/unused")` or a `tempfile::tempdir()` path as
  `artifacts_base` and use an absolute fixture `candidate_dir`; per spec assumption 3
  those are unaffected by resolution (absolute passes through unchanged), so they get
  a `PathBuf::from("/tmp/unused")` (or the same tempdir) as the new third arg — real
  new coverage is two dedicated unit tests per crate (Task 1/2), not touching the
  existing ones' assertions.
- **`run.rs`'s `--worktree` branch needs no code change** — `effective_working_dir` is
  already an absolute git-worktree path in that branch (spec Open Question 2); Task 3
  wraps whatever string is in scope at each site uniformly, so this falls out for
  free. Verified, not just assumed — see Task 3's acceptance criteria.
- **New-crate-edit-first ordering**: Tasks 1-2 (backend changes, still callable with
  the old two-arg call sites broken — expected, fixed same phase) land before Task 3
  (the 4-site wiring), so `cargo test -p smasher-render-capture -p smasher-system-lint`
  is green before anything workspace-wide is touched. Checkpoint A gates the move to
  shared wiring code, same discipline `render-capture`/`system-lint` used.
- **`product_design_factory.dot` fix (Task 4) is part of this module's scope**, not a
  follow-up — spec assumption 5 and the Success Criteria both require it; it's the
  pipeline this fix exists to unblock.
- **Task 5 (real end-to-end run) is manual, human-run** — per spec's Testing Strategy,
  it needs a running provider and produces non-deterministic LLM output, so it is
  never part of `cargo test --workspace`. It's still tracked as a task with explicit
  acceptance criteria, not left implicit, because the spec calls it out as the actual
  acceptance test for the whole module.
- **Deliverables tracked in the `smasher` git repo**, consistent with every other
  design-factory module.

## Task List

### Phase 1: `render-capture` backend
- [x] Task 1: `HybridToolBackend` gains `working_dir` + `resolve_candidate_dir`,
      wired into `run_render_capture`; existing tests updated for the new arg, two new
      resolution unit tests added

### Phase 2: `system-lint` backend
- [x] Task 2: `SystemLintToolBackend` gains the identical (duplicated) treatment

### Checkpoint A: Both crates complete, standalone
- [x] `cargo test -p smasher-render-capture -p smasher-system-lint` green
- [x] `cargo clippy -p smasher-render-capture -p smasher-system-lint` clean
- [x] **Human review before touching any shared pipeline-wiring code** (both
      backends' public constructor signature is changing under callers that don't
      compile yet — confirm the shape before Task 3 fixes those callers)

### Phase 3: Wire the 4 real construction sites
- [x] Task 3: `run.rs`, `pages.rs`, `api.rs` (×2) each wrap their already-in-scope
      working-directory `String` in `PathBuf::from(&...)` and pass it as the new third
      argument

### Checkpoint B: Workspace compiles and passes
- [x] `cargo check -p smasher-render-capture -p smasher-system-lint -p smasher-web -p smasher-cli`
      exits 0
- [x] `cargo test --workspace` green
- [x] `cargo clippy --workspace` clean

### Phase 4: Unblock the real pipeline
- [x] Task 4: `examples/product_design_factory.dot` — `RenderDiscoverA`-`D` /
      `RenderDefine` / `SystemLint` point at real relative output paths, `IAOptions`'s
      prompt names the four candidate directories explicitly

### Phase 5: End-to-end proof
- [x] Task 5: **Manual, human-run.** Run `product_design_factory.dot` for real against
      a configured provider (local Ollama sufficient) through to `GalleryGate1`;
      confirm actual generated markup appears, not `<h1>Fixture candidate</h1>`
- [x] Task 6: Final verification pass against every Success Criteria bullet

### Checkpoint: Complete
- [x] Every bullet in `SPEC-candidate-workdir-resolution.md`'s Success Criteria
      section is checked off with evidence
- [x] `candidate-workdir-resolution` capability map entry can be marked done
