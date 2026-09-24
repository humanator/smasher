# Todo: smasher-desktop

See `tasks/plan-smasher-desktop.md` for full task descriptions, acceptance criteria, and rationale.

## Phase 1: Embedded server boots, loopback-only

- [ ] Task 1: Split `smasher-web` startup into bind-then-serve (`server::start()` → bound `SocketAddr` + cancellable serve; `run_with_config` unchanged behaviour)
- [ ] Task 2: New `smasher-desktop` Tauri 2 crate: bootstrap (127.0.0.1 hard-coded, port 0 release / 21541 debug, `~/.smasher/.env`), window opened only after bind, error dialog on failure, CI webkit deps
- [ ] Task 3: `tests/bootstrap_test.rs`: headless boot, health + SPA index, loopback-only, shutdown

### Checkpoint A: Embedded server + window
- [ ] `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, `cargo fmt --all -- --check` clean
- [ ] hello-world run completes with live events in the desktop window
- [ ] Loopback-only proven (Task 3)
- [ ] Human review before Phase 2

## Phase 2: Dev loop and native features

- [ ] Task 4: `cargo tauri dev` with Vite HMR (`devUrl`, `beforeDevCommand`)
- [ ] Task 5: OS notification on completion: notification plugin, `withGlobalTauri`, loopback-only remote capability (**IPC risk probe: stop and re-plan if it fails**)
- [ ] Task 6: Export .dot: `GET /api/workflows/{id}/dot` + editor button + dialog/fs plugins
- [ ] Task 7: Import .dot: `POST /api/workflows/import` + catalog button

### Checkpoint B: Native features
- [ ] Workspace + frontend (`vitest`, `check`, `test:e2e`) clean, browser target unregressed
- [ ] Success Criteria 1 and 3 verified by hand in the desktop app
- [ ] Human review before Phase 3

## Phase 3: Ship

- [ ] Task 8: `cargo tauri build` → `.app` that works when launched from Finder (absolute workflow dirs, no secrets in bundle)
- [ ] Task 9: Docs, Makefile targets, API reference, CAPABILITY_MAP + spec status

### Checkpoint C: Complete
- [ ] All four SPEC-smasher-desktop.md Success Criteria satisfied
- [ ] `make ci` clean, and CI green (incl. Linux webkit deps)
- [ ] Human review before merge
