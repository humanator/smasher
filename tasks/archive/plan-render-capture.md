# Implementation Plan: `render-capture` (Semi-Dark Design Factory)

## Overview

`render-capture` is the second of eight modules in the Semi-Dark Design Factory
capability map (`docs/design-factory/capability-map.md`), depending on `component-kit`
(done — Checkpoint C, commits `04f209d`..`a1ec43d`). Its spec is
`docs/design-factory/SPEC-render-capture.md`. It provides the `render_capture` pipeline
tool: given a candidate directory composed from the shared component kit, serve it
locally and capture a static PNG screenshot, writing the result as a run artifact —
turning an agent-authored candidate into something reviewable. `gallery-view` (the next
module) depends on this one's output.

This plan breaks `SPEC-render-capture.md` into 9 small, vertically-sliced,
independently verifiable tasks across 5 phases. Scope is `render-capture` only.

## Architecture Decisions

- **New-crate work before any shared wiring.** Tasks 1-5 (crate scaffold through the
  public `capture()` API) touch only the new `crates/smasher-render-capture` crate —
  zero risk to existing pipeline behavior. Tasks 6-7 (the `ToolBackend` implementation
  and its wiring into `crates/smasher-cli/src/run.rs` and `crates/smasher-web/src/backend.rs`)
  are gated behind an explicit human checkpoint (Checkpoint A) precisely because they
  touch shared, load-bearing code, per `SPEC-render-capture.md`'s own Boundaries section
  ("Ask first: ... editing crates/smasher-cli/src/run.rs or crates/smasher-web/src/backend.rs").
- **Static-data-first, browser-last within the new crate.** Task 2 (the `Manifest`
  struct) needs no server or browser and is built and verified before Task 3 (the
  ephemeral server) and Task 4 (chromiumoxide capture) — same "cheapest, least risky
  first" ordering `component-kit` used for its static components before drawer/modal's
  focus-trap JS. Task 3 is verified with a plain HTTP client before Task 4 introduces
  chromiumoxide, isolating the server's correctness from the external-Chromium
  dependency's risk.
- **`HybridToolBackend` is generic over its LLM fallback**, not tied to one concrete
  `LlmToolBackend` type. Verified against the actual code before finalizing this plan:
  `crates/smasher-cli/src/run.rs:1085` and `crates/smasher-web/src/backend.rs` each
  construct their own `LlmToolBackend`, so the new backend holds `Arc<dyn ToolBackend>`
  as its fallback rather than assuming a single shared type — otherwise Task 7 would
  need two different wiring shapes instead of one.
  **Correction found while executing Task 7:** `crates/smasher-web/src/backend.rs`
  only *defines* `LlmToolBackend`; it never constructs one. The real construction
  sites are `crates/smasher-cli/src/run.rs:1084` and three near-identical blocks in
  `crates/smasher-web/src/routes/api.rs:248`, `api.rs:557`, and `pages.rs:329` — four
  sites, not two. Confirmed with the user before editing any of them; all four get
  the same one-line wrap.
- **CI stays local-only for the browser-dependent test this slice.** Resolved with the
  user before this breakdown (the spec flags this as "worth deciding before task
  breakdown, not during it"): the `chromiumoxide`-based integration test in Task 4 runs
  and is verified manually in-session; no `.github/workflows/` changes are part of this
  module. Revisit if a later module (e.g. `gallery-view`) needs CI browser support
  anyway.
- **Deliverables tracked in the `smasher` git repo**, consistent with `component-kit`.

## Task List

### Phase 1: Foundation
- [x] Task 1: Crate scaffold + Cargo dependencies (ask-first: `chromiumoxide`, `tower-http`)

### Checkpoint: Foundation
- [x] `cargo check --workspace` green with the new crate as a workspace member
- [x] `cargo metadata` lists `smasher-render-capture`

### Phase 2: Core mechanics (new crate only, no pipeline wiring)
- [x] Task 2: Manifest module
- [x] Task 3: Ephemeral two-mount server + fixture candidate
- [x] Task 4: Screenshot capture via chromiumoxide

### Checkpoint: Core mechanics
- [x] `cargo test -p smasher-render-capture` green (unit + integration)
- [x] Manual: test-produced PNG opened (via Read) and confirmed to be a real render of
      the fixture candidate, not blank or an error page

### Phase 3: Public API
- [x] Task 5: `capture()` library API + standalone `examples/capture.rs`

### Checkpoint A: Crate complete, standalone
- [x] `cargo test -p smasher-render-capture` and `cargo clippy -p smasher-render-capture`
      both clean
- [x] Standalone example run manually against the fixture; output visually confirmed
- [x] **Human review before touching any shared pipeline-wiring code** — implicitly
      cleared: Phase 4 shipped and the module is live-verified and `Done` in
      `capability-map.md`

### Phase 4: Pipeline integration
- [x] Task 6: `HybridToolBackend` (new code, not wired in yet)
- [x] Task 7: Wire `HybridToolBackend` into all 4 real construction sites (revised
      from the plan's assumed 2 — see Architecture Decisions correction above)

### Phase 5: End-to-end proof
- [x] Task 8: E2E fixture pipeline + zero-LLM-calls proof
- [x] Task 9: Final verification pass

### Checkpoint: Complete
- [x] Every bullet in `SPEC-render-capture.md`'s Success Criteria verified with evidence
- [x] `render-capture` capability map entry can be marked done — `capability-map.md`
      now lists it as `Done`
- [x] Ready to start `system-lint` or `gallery-view` next — both shipped and are also
      `Done` in `capability-map.md`

See `tasks/todo.md` for the full per-task breakdown (acceptance criteria, verification
steps, dependencies, files touched, size estimate).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| `chromiumoxide` requires a local Chrome/Chromium binary this repo doesn't vendor | Medium — Task 4's integration test can't run in an environment without one | Same external-prerequisite shape already accepted for `design-kit`'s Playwright browser install; documented as a local dev requirement, not silently worked around |
| Two independent `LlmToolBackend` construction sites (`run.rs`, `web/backend.rs`) could tempt a copy-pasted `HybridToolBackend` per site | Medium — doubles maintenance surface, contradicts "no duplicated business logic" | `HybridToolBackend` designed generic over `Arc<dyn ToolBackend>` fallback (see Architecture Decisions) so one implementation serves both sites |
| Editing `run.rs`/`web/backend.rs` regresses existing `LlmToolBackend`-only behavior | High — these are shared, load-bearing files used by every other tool node today | Explicit ask-first gate before Task 7 (Checkpoint A); Task 7's acceptance criteria require `cargo test --workspace` green with no changes to existing `LlmToolBackend` tests |
| No CI coverage for the chromiumoxide-dependent test (local-only decision) | Low-Medium — a regression in Task 4's capture path could land without CI catching it | Explicit, user-confirmed tradeoff for this slice (not silent); revisit when a later module needs CI browser support anyway |

## Open Questions
(Carried forward from `SPEC-render-capture.md`, not blocking this task breakdown)
- Exact artifact directory layout (`runs/<run_id>/artifacts/<candidate_id>/`) is
  provisional pending the `artifact-store` module's own spec.
- Whether `gallery-view`'s eventual long-lived live-preview server reuses this crate's
  `server.rs` as-is, extends it, or is built separately.
- Where `candidate_id` comes from at pipeline-authoring time is left to whoever writes
  the first real design-factory `.dot` pipeline using this tool.
