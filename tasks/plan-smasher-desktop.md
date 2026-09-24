# Implementation Plan: smasher-desktop

Module id: `smasher-desktop` · Spec: [SPEC-smasher-desktop.md](../SPEC-smasher-desktop.md) · Capability map: [CAPABILITY_MAP.md](../CAPABILITY_MAP.md)
Task list: [todo-smasher-desktop.md](todo-smasher-desktop.md)

## Overview

Add a new Tauri 2 crate, `crates/smasher-desktop`. On launch it starts the
existing `smasher-web` axum server in-process on `127.0.0.1`, waits until the
listener is bound, and only then opens a webview pointed at that server,
which already serves the `smasher-spa` build at `/`. There is no new product
logic. Most of the work is bootstrapping plus wiring the SPA's existing
`window.__TAURI__` shim (`frontend/src/lib/native/index.ts`) to real Tauri
plugins.

## What the codebase already gives us (and what it doesn't)

| Need | Current state | Consequence |
|---|---|---|
| Start server, know it's ready | `server::run_with_config` binds *and* serves in one call, and shuts down on ctrl-c via `std::process::exit` | Split out a `start()` that binds first, returns the real `SocketAddr`, and takes a shutdown token (Task 1) |
| Loopback only | `ServerConfig::default()` switches to `0.0.0.0` when `SMASHER_WEB_HOST=0.0.0.0` | The desktop builds its own config with host hard-coded to `127.0.0.1` and never reads that env var |
| Handlers (codergen/tool/manager/parallel) | Registered inside `smasher-web::run_launch` | The desktop only calls `smasher_web`. It needs nothing from `smasher-cli` |
| Shim contract | Expects `__TAURI__.dialog.save/open`, `__TAURI__.fs.writeTextFile/readTextFile`, `__TAURI__.notification.sendNotification` | These are exactly the global JS APIs of the official `tauri-plugin-dialog`/`-fs`/`-notification` with `withGlobalTauri: true`. **No custom `#[tauri::command]`s are needed**, and `commands.rs` from the spec's layout is likely unnecessary |
| OS notification on completion | Already called by `EventLog.svelte` on `pipeline_completed`/`pipeline_aborted` | Works once the plugin and permission are present (Task 5) |
| Save/load DOT file dialog | `saveFile`/`loadFile` exist in the shim but **nothing in the SPA calls them**, and **no endpoint returns or accepts raw DOT text** (editor API is `EditorGraph` JSON only) | Needs two small web-api + SPA slices (Tasks 6, 7). This is the only real feature work |
| API keys when launched from Finder | `main.rs`/CLI load `.env` from cwd. A Finder-launched `.app` has cwd `/` and no shell env | The desktop also loads `{data_dir}/.env` (`~/.smasher/.env`) (Task 2) |
| CI | `ci.yml` runs `cargo check --workspace` on `ubuntu-latest` | Tauri needs `libwebkit2gtk-4.1-dev` and related packages on Linux. CI needs an apt step (Task 2) |

## Architecture Decisions

- **Bootstrap lives in a lib target (`src/lib.rs` + `bootstrap.rs`), with
  `main.rs` kept thin.** This makes bind, readiness, and loopback behaviour
  testable without a window, which covers the spec's unit tests and headless
  integration test.
- **Readiness = listener bound.** `start()` returns only after
  `TcpListener::bind` succeeds and `local_addr()` is known. Connections made
  after that queue in the backlog, so no health-poll loop is needed. A bind
  failure returns `Err`, and the desktop shows a native error dialog and exits
  non-zero before any window exists.
- **Port: OS-assigned (`:0`) in release builds. Fixed `21541` in debug/dev
  builds only**, because `frontend/vite.config.ts` hard-codes its proxy target
  to `127.0.0.1:21541`. This keeps the spec's "dynamic port" default and
  avoids the "ask first" change of making the port configurable by flag or env
  var. A dev-mode bind conflict (e.g. `smasher serve` already running) fails
  fast with a clear message.
- **Window URL:** in dev it's `devUrl` (`http://127.0.0.1:5173`, Vite HMR). In
  release it's `WebviewUrl::External("http://127.0.0.1:<port>/")`, built
  programmatically after bind, so the window is not declared in
  `tauri.conf.json`.
- **Native features via official plugins, not custom commands.** Remote-origin
  IPC is granted by a capability scoped to `http://127.0.0.1:*` (and
  `localhost:5173` for dev), with only `dialog`, `fs` (write/read text, scoped
  to dialog-selected paths), and `notification` permissions.
- **New raw-DOT endpoints live in `smasher-web`** (`editor_api.rs`), not in
  Tauri commands. Per the spec, the desktop stays thin and the browser target
  gets the same Export/Import via the shim's download/file-input fallbacks.
- **Bundle is machine-local in this phase.** `static_files`, `/design-kit`,
  and `/editor-ui` resolve from `CARGO_MANIFEST_DIR` (source-tree paths baked
  in at compile time). That works for Simon's own machine. A portable bundle
  that ships these as Tauri resources is an Open Question and not in this plan.
- **Tray is out of scope.** The spec's structure mentions it, but no Success
  Criterion requires it. Deferred unless requested.
- **macOS only for now.** `tauri-driver` has no macOS (WKWebView) support, so
  WebDriver e2e can't run on the dev machine anyway. UI e2e is manual QA plus
  the existing Playwright coverage in `smasher-spa`.

## Dependency Graph

```
Task 1: smasher-web server::start() (bind → addr → serve, cancellable)
   │
   ├── Task 2: smasher-desktop crate + bootstrap + window (+ CI deps)
   │      │
   │      ├── Task 3: headless integration test (loopback-only proof)
   │      ├── Task 4: `cargo tauri dev` with Vite HMR
   │      ├── Task 5: notifications (plugin + remote capability)  ← proves IPC from http://127.0.0.1
   │      │      │
   │      │      ├── Task 6: Export .dot  (GET raw DOT + editor button + dialog/fs plugins)
   │      │      └── Task 7: Import .dot  (POST raw DOT + catalog button)
   │      └── Task 8: `cargo tauri build` bundle that launches from Finder
   │
   └── Task 9: docs / capability map / spec checkboxes
```

Tasks 6 and 7 can run in parallel after Task 5, and their web-api halves can
start as soon as Task 1 is done.

## Task List

### Phase 1: Embedded server boots, loopback-only

#### Task 1: Split `smasher-web` server startup into bind-then-serve

**Description:** Add `pub async fn start(config: ServerConfig, shutdown: CancellationToken) -> Result<RunningServer, ServerError>` to `crates/smasher-web/src/server.rs`. It checks API keys, rehydrates runs, binds `(config.host, config.port)`, and returns `RunningServer { addr: SocketAddr, handle: JoinHandle<..> }`, with serving running on a spawned task that stops when the token is cancelled. Rewrite `run_with_config` as `start()` plus the existing ctrl-c/force-exit behaviour, so `smasher serve` behaves exactly as before.

**Acceptance criteria:**
- [ ] `start()` with port `0` returns a non-zero port on `127.0.0.1`, and `GET /api/health` on it responds 200
- [ ] `start()` on an already-bound port returns `Err` (no panic, no hang) with a message naming the address
- [ ] `smasher serve` / `smasher-web` binary behaviour unchanged (still binds `21541`, still exits on ctrl-c)

**Verification:**
- [ ] `cargo test -p smasher-web server::` (new tests use real ephemeral bind, no mocks)
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web -- -D warnings` clean
- [ ] Manual: `cargo run -p smasher-cli -- serve`, dashboard loads at `http://127.0.0.1:21541`, ctrl-c exits

**Dependencies:** None
**Files likely touched:** `crates/smasher-web/src/server.rs`, `crates/smasher-web/src/error.rs` (if a typed error is added), `crates/smasher-web/Cargo.toml` (tokio-util already a dep)
**Estimated scope:** S

#### Task 2: Create `smasher-desktop` crate, boot the server, then open the window

**Description:** New workspace member `crates/smasher-desktop` (Tauri 2). `bootstrap.rs` builds a `ServerConfig` with host hard-coded to `127.0.0.1`, port `0` in release and `DEFAULT_PORT` in debug, and model/provider/data-dir/workflow-dirs from the existing defaults. It loads `.env` from cwd and then `{data_dir}/.env`, and calls `smasher_web::server::start()`. `main.rs` runs bootstrap inside Tauri's `setup` hook, waits for the bound address, and only then builds the `WebviewWindow` at `http://127.0.0.1:<port>/`. On error it shows a native message dialog with the error text and exits non-zero. Cancel the shutdown token on app exit. Add `tauri.conf.json`, `build.rs`, a default `capabilities/default.json`, and generated icons. Install `tauri-cli` (`cargo install tauri-cli --version ^2`). Add the Linux webkit/gtk apt step to `.github/workflows/ci.yml` so `cargo check --workspace` stays green.

**Acceptance criteria:**
- [ ] With `frontend/dist` built, `cargo run -p smasher-desktop` opens a window showing the live dashboard (workflow catalog lists real workflows)
- [ ] Unit tests: config host is always `127.0.0.1` even with `SMASHER_WEB_HOST=0.0.0.0` set; release config uses port 0; a bind conflict surfaces as `Err` from bootstrap before any window code runs
- [ ] With no API keys available, the app shows a clear error dialog and exits instead of opening a blank window

**Verification:**
- [ ] `cargo test -p smasher-desktop`, `cargo clippy -p smasher-desktop -- -D warnings`
- [ ] `cargo check --workspace` and `cargo test --workspace` still pass (no regressions elsewhere)
- [ ] Manual: launch, see dashboard; launch a second copy in a debug build and see the port-conflict error dialog

**Dependencies:** Task 1
**Files likely touched:** `Cargo.toml` (workspace member + tauri deps), `crates/smasher-desktop/{Cargo.toml,build.rs,tauri.conf.json,src/main.rs,src/lib.rs,src/bootstrap.rs,capabilities/default.json,icons/*}`, `.github/workflows/ci.yml`
**Estimated scope:** M (icons/config are generated boilerplate; the hand-written code is bootstrap + main)

#### Task 3: Headless integration test proving the embedded server is loopback-only

**Description:** `crates/smasher-desktop/tests/bootstrap_test.rs` calls the lib-level bootstrap with no Tauri window, then runs real HTTP checks against the returned address.

**Acceptance criteria:**
- [ ] `GET /api/health` → 200. `GET /` → 200 `text/html` (SPA index, skipped with a clear message if `frontend/dist` isn't built)
- [ ] `addr.ip()` is `127.0.0.1`, and a TCP connect to the machine's non-loopback interface on the same port is refused
- [ ] Cancelling the shutdown token stops the server (subsequent connect fails)

**Verification:**
- [ ] `cargo test -p smasher-desktop --test bootstrap_test` with pristine output
- [ ] `cargo clippy -p smasher-desktop -- -D warnings`

**Dependencies:** Task 2
**Files likely touched:** `crates/smasher-desktop/tests/bootstrap_test.rs`, `crates/smasher-desktop/Cargo.toml` (dev-deps: reqwest)
**Estimated scope:** S

### Checkpoint A: Embedded server + window
- [ ] `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, `cargo fmt --all -- --check` clean
- [ ] Window shows the working dashboard. A run of `examples/old-examples/hello-world.dot` completes and streams live events in the desktop window
- [ ] Success Criterion 4 (loopback only) proven by Task 3
- [ ] Human review before Phase 2

### Phase 2: Dev loop and native features

#### Task 4: `cargo tauri dev` with Vite hot reload

**Description:** Set `build.devUrl = http://127.0.0.1:5173` and `build.beforeDevCommand` (`npm run dev` in `frontend/`) in `tauri.conf.json`. In debug builds the window loads the dev URL. The embedded server is on `21541`, which Vite already proxies `/api` to.

**Acceptance criteria:**
- [ ] `cargo tauri dev` (from `crates/smasher-desktop`) starts Vite and the embedded server, and the window shows the dashboard with live data
- [ ] Editing a Svelte component updates the window without a restart (HMR)

**Verification:**
- [ ] Manual: the two checks above
- [ ] `cargo clippy -p smasher-desktop -- -D warnings`

**Dependencies:** Task 2
**Files likely touched:** `crates/smasher-desktop/tauri.conf.json`, `crates/smasher-desktop/src/main.rs`
**Estimated scope:** XS

#### Task 5: OS notification on pipeline completion (first proof of Tauri IPC from the served origin)

**Description:** Add `tauri-plugin-notification`, set `app.withGlobalTauri = true`, and add a capability with `remote.urls` limited to `http://127.0.0.1:*` and `http://localhost:5173`, granting only notification permissions. `EventLog.svelte` already calls the shim, so no SPA logic changes. Fix the shim's stale "Always returns false for now" doc comment on `isTauri()`. **This is the riskiest step:** if global injection or remote-origin IPC doesn't behave as documented, stop and re-plan before Tasks 6–7.

**Acceptance criteria:**
- [ ] In the desktop window, `window.__TAURI__.notification` is defined and `isTauri()` is true
- [ ] Completing (and separately aborting) a run posts a macOS notification
- [ ] The browser target (`smasher serve` + Chrome) is unchanged: still uses the Web Notification API

**Verification:**
- [ ] `cd frontend && npx vitest run tests/lib` (shim tests still pass)
- [ ] `cargo test -p smasher-desktop`. Add a test that parses the capability JSON and asserts every remote URL is loopback
- [ ] Manual: run hello-world in the desktop app, see the OS notification

**Dependencies:** Task 2
**Files likely touched:** `crates/smasher-desktop/{Cargo.toml,src/main.rs,tauri.conf.json,capabilities/default.json}`, `frontend/src/lib/native/index.ts` (comment only)
**Estimated scope:** S

#### Task 6: Export a workflow to a `.dot` file

**Description:** Web-api half: add `GET /api/workflows/{id}/dot` in `editor_api.rs`, returning the workflow's raw DOT source (`text/vnd.graphviz`), using the same id→path resolution and traversal guards as `get_graph`. SPA half: add `getWorkflowDot()` in `lib/api/workflows.ts` and an "Export .dot" button on `WorkflowEditorPage` that calls `saveFile(`${id}.dot`, blob)`. Desktop half: add `tauri-plugin-dialog` + `tauri-plugin-fs` with `dialog:allow-save` and `fs:allow-write-text-file`, scoped to dialog-selected paths.

**Acceptance criteria:**
- [ ] Endpoint returns the exact on-disk bytes for a known workflow, 404s an unknown id, and rejects traversal ids
- [ ] Desktop: Export opens a native save dialog, and the written file is byte-identical to the source workflow
- [ ] Browser: Export falls back to a download of the same content

**Verification:**
- [ ] `cargo test -p smasher-web editor_api` (real temp-dir workflow fixtures)
- [ ] `cd frontend && npx vitest run` (component test for the button, api test against the real endpoint per the project's no-mock rule) and `npm run check`
- [ ] Manual: desktop export + browser export, then `diff` against the source

**Dependencies:** Task 5 (desktop half). The web-api half needs only Task 1
**Files likely touched:** `crates/smasher-web/src/routes/editor_api.rs`, `frontend/src/lib/api/workflows.ts`, `frontend/src/components/dashboard/WorkflowEditorPage.svelte`, `frontend/tests/...`, `crates/smasher-desktop/{Cargo.toml,src/main.rs,capabilities/default.json}`
**Estimated scope:** M

#### Task 7: Import a `.dot` file as a new workflow

**Description:** Web-api half: add `POST /api/workflows/import` with `{ name, dot }`. It parses `dot` with `smasher-attractor` (and rejects invalid DOT with 400 plus the parse error), writes it to `{data_dir}/workflows/<slug>.dot` using the same name validation/slugging as `create_graph` (409 on an existing file), and returns `{ id }`. SPA half: add an "Import .dot" button on `WorkflowCatalog` that calls `loadFile()`, posts the text (name defaults to the file stem), and navigates to the new workflow's editor. Desktop half: `dialog:allow-open` + `fs:allow-read-text-file`.

**Acceptance criteria:**
- [ ] Valid DOT → file created, appears in `GET /api/workflows`, opens in the editor. Invalid DOT → 400 with the parse message shown in the UI
- [ ] Desktop uses the native open dialog. The browser uses the file-input fallback
- [ ] Round trip: export (Task 6) → import produces a runnable workflow

**Verification:**
- [ ] `cargo test -p smasher-web editor_api`
- [ ] `cd frontend && npx vitest run` and `npm run check`
- [ ] Manual: import `examples/old-examples/hello-world.dot` in desktop and browser, then run it

**Dependencies:** Task 5 (desktop half). The web-api half needs only Task 1
**Files likely touched:** `crates/smasher-web/src/routes/editor_api.rs`, `frontend/src/lib/api/workflows.ts`, `frontend/src/components/dashboard/WorkflowCatalog.svelte`, `frontend/tests/...`, `crates/smasher-desktop/capabilities/default.json`
**Estimated scope:** M

### Checkpoint B: Native features
- [ ] Workspace test/clippy/fmt clean. Frontend `npx vitest run`, `npm run check`, and `npm run test:e2e` clean (no regressions to the browser target)
- [x] Success Criteria 1 (dev window + HMR) and 3 (save/load dialog, completion notification) verified by hand in the desktop app
- [x] Human review before Phase 3

### Phase 3: Ship

#### Task 8: `cargo tauri build` produces a `.app` that works when launched from Finder

**Description:** Set `build.beforeBuildCommand` (`npm run build` in `frontend/`) and `frontendDist` (Tauri requires the key, even though the window loads the served origin). Make the desktop's default workflow dirs absolute, since a Finder launch has cwd `/`, so `"examples"` would silently resolve to nothing. Confirm keys load from `~/.smasher/.env`. Target macOS (`.app` + `.dmg`).

**Acceptance criteria:**
- [x] `cargo tauri build` succeeds and produces `target/release/bundle/macos/Smasher.app` (bundle targets narrowed to `app`: the `.dmg` step's Finder AppleScript needs Automation permission and the spec only requires a machine-local `.app`)
- [ ] Double-clicking the `.app` (not from a terminal) shows the dashboard with workflows listed and can run hello-world end to end (verified with cwd `/`, stripped env, dummy key in the data dir `.env`: SPA 200, 34 workflows incl. hello-world. Real-key hello-world run pending `~/.smasher/.env`)
- [x] No keys or secrets in `tauri.conf.json` or the bundle (`grep -r "sk-" Smasher.app` finds nothing)

**Verification:**
- [x] `cargo test -p smasher-desktop` (unit test for workflow-dir resolution)
- [x] Manual: Finder launch + run; `lsof -iTCP -sTCP:LISTEN -P | grep -i smasher` shows `127.0.0.1:<port>` only

**Dependencies:** Tasks 2, 5–7
**Files likely touched:** `crates/smasher-desktop/{tauri.conf.json,src/bootstrap.rs}`
**Estimated scope:** S

#### Task 9: Docs and bookkeeping

**Description:** Document the desktop app (build prerequisites, dev/build commands, `~/.smasher/.env`, the loopback-only guarantee). Add the crate to the CLAUDE.md/README crate tables, add Makefile targets (`desktop-dev`, `desktop-build`), mark `smasher-desktop` Done in `CAPABILITY_MAP.md`, and tick the spec's Success Criteria and resolve its Open Questions.

**Acceptance criteria:**
- [ ] A new reader can go from clone to running desktop app using only the docs
- [ ] `docs/api-reference.md` covers the two new endpoints from Tasks 6–7
- [ ] Capability map and spec reflect the shipped state

**Verification:**
- [ ] Follow the docs from a clean `frontend/dist` and `target/` for the desktop crate
- [ ] `make ci` clean

**Dependencies:** Task 8
**Files likely touched:** `README.md`, `CLAUDE.md`, `docs/api-reference.md`, `docs/quickstart.md`, `Makefile`, `CAPABILITY_MAP.md`, `SPEC-smasher-desktop.md`
**Estimated scope:** S

### Checkpoint C: Complete
- [ ] All four SPEC-smasher-desktop.md Success Criteria satisfied
- [ ] `make ci` clean, and CI green on the branch (including the Linux webkit deps step)
- [ ] Human review before merge

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tauri 2 doesn't inject `window.__TAURI__`/plugin globals, or blocks IPC, for a page loaded from `http://127.0.0.1:<dynamic port>` | High: breaks all native features | Task 5 is the smallest possible probe, run before any dialog/fs work. Fallback: wildcard-port capability URL, or serve from a Tauri custom protocol that proxies to the server |
| `fs` plugin refuses writes/reads to dialog-chosen paths | Med | Tauri's dialog plugin adds selected paths to the fs scope. Verify in Task 6. Fallback: two thin `#[tauri::command]`s doing `std::fs` on the dialog path (the spec's `save_dot_file` example) |
| Adding Tauri to the workspace breaks Linux CI (`cargo check --workspace`) | Med | apt step in Task 2 (`libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`) |
| Tauri adds significant compile time to `cargo test --workspace` (~2,700 tests today) | Low–Med | Accept for now. If it hurts, move desktop to `workspace.exclude` with its own CI job (changes `--workspace` semantics, so ask first) |
| Finder-launched app has no shell env: no keys, wrong cwd | High (blank/broken app) | `{data_dir}/.env` load (Task 2), absolute workflow dirs (Task 8), error dialog on missing keys |
| `smasher serve` already on 21541 during `cargo tauri dev` | Low | Fail-fast dialog names the conflict (Task 2) |
| Bundle depends on source-tree paths (`frontend/dist`, `design-kit/`, `editor-ui/dist`) | Low for Simon, High for anyone else | Accepted: local-only bundle approved (Resolved Question 3) |

## Resolved Questions (approved 2026-09-24)

1. **Raw-DOT endpoints (Tasks 6–7):** approved. Add `GET /api/workflows/{id}/dot`
   and `POST /api/workflows/import` to `smasher-web`, plus the SPA buttons, in
   this module.
2. **Dev port:** fixed `21541` in debug builds (to match Vite's proxy),
   OS-assigned in release builds.
3. **Portable bundle:** not needed. A machine-local `.app` is fine.
4. **Tray:** deferred.
5. **Spec's Open Questions:** macOS only. `tauri-driver` e2e deferred.
