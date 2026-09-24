# Implementation Plan: `system-lint` (Semi-Dark Design Factory)

## Overview

`system-lint` is the third module in the Semi-Dark Design Factory capability map
(`docs/design-factory/capability-map.md`), depending on `component-kit` (done —
Checkpoint C). It's parallel-eligible with `render-capture` (currently mid-implementation,
Task 7 of 9) — `system-lint` only needs the kit to exist, not `render-capture` to
finish. Its spec is `docs/design-factory/SPEC-system-lint.md`. It provides the
`system_lint` pipeline tool: a deterministic, zero-LLM check of an agent-generated
candidate directory against the design kit's tokens (no raw colors/spacing) and its
component classes (`.btn`, `.input`, dialog conventions, `.list-row-action`) — the
check `task-critic-synthesis` (a later module) will reconcile with the usability
critic's findings.

This plan breaks `SPEC-system-lint.md` into 10 small, vertically-sliced,
independently verifiable tasks across 6 phases. Scope is `system-lint` only.

## Architecture Decisions

- **Token-adherence goes native Rust, not the Node subprocess the spec originally
  proposed.** `regex` is already an unused workspace-level Cargo dependency —
  reimplementing `design-kit/test/lint-tokens.mjs`'s small rule set natively avoids a
  new runtime dependency (Node) and avoids editing a file that belongs to the
  already-checkpointed `component-kit` module. Confirmed with the user during planning,
  superseding `SPEC-system-lint.md`'s original assumption 4 (Task 0 below amends the
  spec to match).
- **`kit-component-usage` also goes regex-based, not a real HTML5 parser
  (`scraper`).** The four rules are narrow tag/attribute-presence checks; extending the
  same no-new-dependency philosophy keeps the whole crate at **zero new Cargo
  dependencies**. This is a planning-time design call, not directly confirmed by the
  user — flagged as an Open Question if candidate markup ever gets complex enough that
  regex tag-matching breaks down.
- **Four real `ToolBackend` construction sites, not two.** The spec assumed
  `run.rs` + `smasher-web/src/backend.rs`. The actual working tree has
  `crates/smasher-cli/src/run.rs` (~line 1085) and three sites in
  `crates/smasher-web/src/routes/`: `pages.rs` (~329), `api.rs` (~248, ~557).
  `smasher-web/src/backend.rs` only *defines* `LlmToolBackend`, it doesn't construct
  the pipeline's tool backend. Task 7 below wires all four.
- **`SystemLintToolBackend` is generic over its fallback**, exactly like
  `render-capture`'s `HybridToolBackend` — composes on top of whatever chain already
  exists at each construction site without needing `render-capture`'s own wiring to
  have landed first, architecturally. (Sequencing note below is about avoiding a
  concurrent-edit conflict, not a hard dependency.)
- **The artifact-path helper (`artifact_dir(run_id, candidate_id)`) is duplicated
  locally**, not imported from `smasher-render-capture` — the capability map lists
  `system-lint`'s only dependency as `component-kit`; a Cargo dependency on a sibling
  module for a five-line path helper isn't warranted. Same provisional status
  `render-capture` already flagged for this convention, pending `artifact-store`.
- **New-crate work before shared wiring**, same ordering `render-capture` proved out:
  Tasks 1-5 touch only the new crate (zero risk to existing behavior); Task 6
  (`SystemLintToolBackend`, unwired) sits behind Checkpoint A; Task 7 (the four-site
  wiring) sits behind an explicit ask-first gate.
- **Task 7 should not start until `render-capture`'s own in-flight Task 7 is
  committed.** Both modules edit the same lines in `run.rs`/`api.rs`/`pages.rs`
  (wrapping the existing tool-backend chain one layer deeper); concurrent edits in the
  same working tree risk a conflicting diff. Sequencing, not a capability-map
  dependency.
- **Deliverables tracked in the `smasher` git repo**, consistent with `component-kit`
  and `render-capture`.

## Task List

### Phase 0: Housekeeping
- [x] Task 0: Amend `SPEC-system-lint.md` assumption 4 + Tech Stack for the native-Rust
      decision

### Phase 1: Foundation
- [x] Task 1: Crate scaffold + Cargo dependencies (zero new deps — all already in the
      workspace)

### Checkpoint: Foundation
- [x] `cargo check --workspace` green with the new crate as a workspace member
- [x] `cargo metadata` lists `smasher-system-lint`

### Phase 2: Core mechanics (new crate only, no pipeline wiring)
- [x] Task 2: `LintReport`/`CheckResult` + duplicated `artifact_dir()` helper
- [x] Task 3: `token_adherence` check (ported `lint-tokens.mjs` rules, Rust `regex`)
- [x] Task 4: `kit_usage` check (four regex-based tag/attribute rules)

### Checkpoint: Core mechanics
- [x] `cargo test -p smasher-system-lint` green (unit tests only, no server/subprocess)

### Phase 3: Public API + fixtures
- [x] Task 5: `lint()` library API + `fixtures/{clean,violating}-candidate/` +
      standalone `examples/lint.rs`

### Checkpoint A: Crate complete, standalone
- [x] `cargo test -p smasher-system-lint` and `cargo clippy -p smasher-system-lint`
      both clean
- [x] Standalone example run manually against both fixtures; output read and confirmed
- [x] Zero new Cargo dependencies confirmed (`Cargo.lock` diff)
- [x] **Human review before touching any shared pipeline-wiring code**

### Phase 4: Pipeline integration
- [x] Task 6: `SystemLintToolBackend` (new code, not wired in yet)
- [x] Task 7: Wire `SystemLintToolBackend` into all four construction sites
      (`run.rs`, `routes/api.rs` ×2, `routes/pages.rs`)

### Phase 5: End-to-end proof
- [x] Task 8: E2E fixture pipeline + zero-LLM-calls proof
- [x] Task 9: Final verification pass

### Checkpoint: Complete
- [x] Every bullet in `SPEC-system-lint.md`'s Success Criteria section is checked off
      with evidence
- [ ] `system-lint` capability map entry can be marked done
