# Todo: smasher-web-api

See `tasks/plan.md` for full task descriptions, acceptance criteria, and rationale.

## Phase 1: Foundation

- [x] Task 1: Deduplicate pipeline-launch logic (`api.rs`::submit_pipeline/resume_run + `pages.rs`::create_run → shared `run_launch.rs`)

### Checkpoint: Foundation
- [x] `cargo test -p smasher-web` clean
- [x] `cargo clippy -p smasher-web` clean
- [ ] Manual: dashboard submit + `POST /api/runs` both still launch runs correctly

## Phase 2: JSON/SSE Contract Completion

- [x] Task 2: SSE events as JSON (`sse.rs`, delete `render_event_html`)
- [x] Task 3: Human-gate answer as JSON (`questions.rs`, `Form` → `Json`)
- [x] Task 4: Gallery candidate listing endpoint (`GET /api/runs/{id}/candidates`, new)
- [x] Task 5: API reference documentation (`docs/api-reference.md`)

### Checkpoint: JSON/SSE Contract Complete
- [x] `cargo test -p smasher-web` clean
- [x] `cargo clippy -p smasher-web` clean
- [ ] Manual: curl-only end-to-end — submit, watch JSON SSE events, answer human-gate, see completion
- [x] Confirmed: dashboard live-event feed + human-gate form regression is expected, not accidental (accepted at plan approval)

## Phase 3: Static SPA Serving

- [x] Task 6: `routes/static_files.rs` — disk-based SPA serving + fallback (not yet mounted at `/`)

### Checkpoint: Static Serving Ready
- [x] `cargo test -p smasher-web` clean
- [x] `cargo clippy -p smasher-web` clean
- [ ] Manual: fallback + real-asset serving verified against a scratch fixture dir (covered by automated temp-dir-fixture unit tests, not a manual curl check)

## Phase 4: Integration Test Coverage

- [x] Task 7: `tests/api_test.rs` — real-server happy path (submit → status → completion)
- [x] Task 8: `tests/events_test.rs` — SSE ordering/payload assertions + human-gate round trip

### Checkpoint: Integration Coverage Complete
- [x] `cargo test -p smasher-web` (all integration test binaries) clean
- [x] `cargo clippy -p smasher-web` clean
- [x] Spec's three Testing Strategy areas all covered: happy path, human-gate round trip, static-serving fallback

## Phase 5: Final Cutover — complete

- [x] Task 9: Delete `pages.rs` + `templates/` + HTMX static assets + `askama` dep; mount static SPA router at `/`

### Checkpoint: Complete
- [x] All SPEC-smasher-web-api.md Success Criteria checkboxes satisfied
- [x] `cargo test -p smasher-web` clean
- [x] `cargo clippy -p smasher-web` clean
- [x] `smasher serve` still binds `127.0.0.1:21541`, now serving the real SPA at `/`
- [x] Zero server-rendered HTML remains in the crate
- [x] Human review before merge
