# Todo: smasher-web-api

See `tasks/plan.md` for full task descriptions, acceptance criteria, and rationale.

## Phase 1: Foundation

- [x] Task 1: Deduplicate pipeline-launch logic (`api.rs`::submit_pipeline/resume_run + `pages.rs`::create_run → shared `run_launch.rs`)

### Checkpoint: Foundation
- [x] `cargo test -p smasher-web` clean
- [x] `cargo clippy -p smasher-web` clean
- [ ] Manual: dashboard submit + `POST /api/runs` both still launch runs correctly

## Phase 2: JSON/SSE Contract Completion

- [ ] Task 2: SSE events as JSON (`sse.rs`, delete `render_event_html`)
- [ ] Task 3: Human-gate answer as JSON (`questions.rs`, `Form` → `Json`)
- [ ] Task 4: Gallery candidate listing endpoint (`GET /api/runs/{id}/candidates`, new)
- [ ] Task 5: API reference documentation (`docs/api-reference.md`)

### Checkpoint: JSON/SSE Contract Complete
- [ ] `cargo test -p smasher-web` clean
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual: curl-only end-to-end — submit, watch JSON SSE events, answer human-gate, see completion
- [ ] Confirmed: dashboard live-event feed + human-gate form regression is expected, not accidental

## Phase 3: Static SPA Serving

- [ ] Task 6: `routes/static_files.rs` — disk-based SPA serving + fallback (not yet mounted at `/`)

### Checkpoint: Static Serving Ready
- [ ] `cargo test -p smasher-web` clean
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual: fallback + real-asset serving verified against a scratch fixture dir

## Phase 4: Integration Test Coverage

- [ ] Task 7: `tests/api_test.rs` — real-server happy path (submit → status → completion)
- [ ] Task 8: `tests/events_test.rs` — SSE ordering/payload assertions + human-gate round trip

### Checkpoint: Integration Coverage Complete
- [ ] `cargo test -p smasher-web` (all integration test binaries) clean
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Spec's three Testing Strategy areas all covered: happy path, human-gate round trip, static-serving fallback

## Phase 5: Final Cutover — BLOCKED on `smasher-spa` reaching parity

- [ ] Task 9: Delete `pages.rs` + `templates/` + HTMX static assets + `askama` dep; mount static SPA router at `/`
  - **Do not start until `smasher-spa` ships and confirms dashboard parity.**

### Checkpoint: Complete
- [ ] All SPEC-smasher-web-api.md Success Criteria checkboxes satisfied
- [ ] `cargo test -p smasher-web` clean
- [ ] `cargo clippy -p smasher-web` clean
- [ ] `smasher serve` still binds `127.0.0.1:21541`, now serving the real SPA at `/`
- [ ] Zero server-rendered HTML remains in the crate
- [ ] Human review before merge
