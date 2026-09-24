# Spec: smasher-desktop

Module id: `smasher-desktop` · Capability map: [CAPABILITY_MAP.md](CAPABILITY_MAP.md)
Depends on: `smasher-web-api`, `smasher-spa`

## Objective

New Tauri crate that wraps `smasher-web-api`'s axum server and the built
`smasher-spa` bundle as a native desktop app. No separate frontend or API —
on launch it spawns the same server used by the browser target, in-process,
and points its webview at it.

Users: Simon, as the primary way to run smasher day-to-day instead of
`smasher serve` + opening a browser tab.

## Tech Stack

- Tauri 2.x
- Rust (same workspace, same edition/deps as other crates)

## Commands

```bash
cargo tauri dev     # dev mode: spawns smasher-web-api, points webview at vite dev server (HMR), which proxies to it
cargo tauri build    # prod bundle: spawns smasher-web-api, webview loads its served smasher-spa build
cargo test -p smasher-desktop
cargo clippy -p smasher-desktop
```

## Project Structure

```
crates/smasher-desktop/
  src/
    main.rs         # spawns smasher-web-api server on 127.0.0.1:<port>, creates window pointed at it
    commands.rs      # native-only Tauri commands: file dialogs, notifications, tray
  tauri.conf.json
  capabilities/       # Tauri 2 permission manifests
  icons/
```

## Code Style

Match existing crate conventions (ABOUTME headers, `thiserror`, `tracing`,
`async-trait` where relevant). Tauri commands stay thin — delegate to
`smasher-web-api`'s existing handlers/services rather than duplicating logic:

```rust
// ABOUTME: Tauri entrypoint — boots the local smasher-web-api server, then opens the window.
// ABOUTME: All business logic lives in smasher-web-api; this crate is bootstrapping + native shims only.

#[tauri::command]
async fn save_dot_file(contents: String) -> Result<(), String> {
    // native-only: file dialog, delegates write to std fs
}
```

## Testing Strategy

- Unit tests for bootstrap logic: port selection, "server ready" signaling before window creation, graceful failure if the port can't bind.
- Integration test that boots the app in headless/test mode and asserts the embedded axum server responds correctly.
- Full UI e2e (tauri-driver/WebDriver) is best-effort in this phase — Tauri's e2e tooling is less mature than Playwright's. Do not block shipping this module on it; rely on manual QA plus the e2e coverage already proven in `smasher-spa` against the same API.

## Boundaries

- **Always:** start the axum server and confirm it's ready before creating the window; fail fast with a clear error if the port can't bind; keep native-only commands behind the same shim contract `smasher-spa` expects (`window.__TAURI__`); `cargo clippy -p smasher-desktop` clean.
- **Ask first:** native integrations beyond file dialogs/notifications/tray (e.g., auto-updater, deep-linking); making the local port configurable via CLI flag/env var instead of dynamic OS-assigned.
- **Never:** embed secrets/API keys in the bundle or `tauri.conf.json`; bind the embedded server to anything other than `127.0.0.1` — this is a security boundary from the local-only/no-auth decision, not a style preference.

## Success Criteria

- [x] `cargo tauri dev` opens a working window showing the live `smasher-spa` dashboard, backed by the local server, with frontend hot-reload.
- [x] `cargo tauri build` produces a native bundle for the target OS.
- [x] Native-only features (save/load DOT file dialog, OS notification on pipeline completion) work end-to-end.
- [x] Embedded server verified bound to `127.0.0.1` only, never externally reachable.

## Resolved Questions (2026-09-24)

- OS target: macOS only for now.
- `tauri-driver` e2e: deferred (it has no macOS support). Rely on manual QA plus `smasher-spa`'s Playwright coverage.
- Dev port: fixed `21541` in debug builds to match the Vite proxy, OS-assigned in release builds.
- Bundle: machine-local `.app` is fine. Portability deferred.
- Tray: deferred.
- Save/load DOT: adds `GET /api/workflows/{id}/dot` and `POST /api/workflows/import` to `smasher-web`, plus SPA buttons.
