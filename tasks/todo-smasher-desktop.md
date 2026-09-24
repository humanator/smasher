# Todo: smasher-desktop

See `tasks/plan-smasher-desktop.md` for full task descriptions, acceptance criteria, and rationale.

## Phase 1: Embedded server boots, loopback-only

- [x] Task 1: Split `smasher-web` startup into bind-then-serve (`server::start()` → bound `SocketAddr` + cancellable serve; `run_with_config` unchanged behaviour)
- [x] Task 2: New `smasher-desktop` Tauri 2 crate: bootstrap (127.0.0.1 hard-coded, port 0 release / 21541 debug, `~/.smasher/.env`), window opened only after bind, error dialog on failure, CI webkit deps
- [x] Task 3: `tests/bootstrap_test.rs`: headless boot, health + SPA index, loopback-only, shutdown

### Checkpoint A: Embedded server + window
- [x] `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, `cargo fmt --all -- --check` clean
- [x] hello-world run completes with live events in the desktop window
- [x] Loopback-only proven (Task 3)
- [x] Human review before Phase 2

## Phase 2: Dev loop and native features

- [x] Task 4: `cargo tauri dev` with Vite HMR (`devUrl`, `beforeDevCommand`)
- [x] Task 5: OS notification on completion: notification plugin, `withGlobalTauri`, loopback-only remote capability (**IPC risk probe: stop and re-plan if it fails**) — probe passed: served origin gets __TAURI__ + notification IPC, core IPC denied
- [x] Task 6: Export .dot: `GET /api/workflows/{id}/dot` + editor button + dialog/fs plugins
- [x] Task 7: Import .dot: `POST /api/workflows/import` + catalog button

### Checkpoint B: Native features
- [x] Workspace + frontend (`vitest`, `check`, `test:e2e`) clean, browser target unregressed
- [x] Success Criteria 1 and 3 verified by hand in the desktop app
- [x] Human review before Phase 3

## Phase 3: Ship

- [x] Task 8: `cargo tauri build` → `.app` that works when launched from Finder (absolute workflow dirs, no secrets in bundle) — `.app` only (dmg dropped); real-key hello-world run verified by hand
- [x] Task 9: Docs, Makefile targets, API reference, CAPABILITY_MAP + spec status

### Checkpoint C: Complete
- [x] All four SPEC-smasher-desktop.md Success Criteria satisfied
- [ ] `make ci` clean, and CI green (incl. Linux webkit deps) — `make ci` clean locally; CI not yet run (branch not pushed)
- [ ] Human review before merge
