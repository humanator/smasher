# Capability Map: Smasher Desktop Frontend

Approved 2026-09-22.

## Objective

Replace `smasher-web`'s askama/HTMX dashboard with a single Svelte SPA that is
served two ways: wrapped in a native Tauri desktop app, and (later) served
remotely over plain HTTP. One frontend codebase, one API contract, built in
three independently shippable modules.

## Modules

| Module id | Responsibility | Depends on | Status |
|---|---|---|---|
| `smasher-web-api` | Rework the existing `smasher-web` crate: drop askama/HTMX templates, keep/extend the JSON + SSE endpoints (pipeline submit, event stream, human-gate Q&A), serve the static SPA bundle. Local-only, no auth. | `smasher-attractor`, `smasher-agent`, `smasher-llm` (unchanged, already workspace deps) | Done |
| `smasher-spa` | Svelte + shadcn-svelte SPA: dashboard, DOT graph node editor, live event stream view, human-gate response UI. Talks to `smasher-web-api` via fetch/SSE. Thin native-capability shim (`window.__TAURI__` check) with browser fallbacks. | `smasher-web-api` (API contract) | Done |
| `smasher-desktop` | New Tauri crate. Spawns `smasher-web-api`'s axum server in-process on `127.0.0.1:<port>`, opens a webview pointed at it serving `smasher-spa`, adds native-only Tauri commands (file dialogs, notifications, tray) behind the shim. | `smasher-web-api`, `smasher-spa` | Done |

`smasher-web-api` finished all 9 tasks in `tasks/plan.md`, including the
final-cutover task (askama/HTMX deleted, `smasher-spa` mounted at `/`) once
`smasher-spa` shipped and confirmed parity. `smasher-spa` finished all 21
tasks in `tasks/plan-smasher-spa.md`. Its two pieces of flagged test debt
(mocked API tests, non-pristine `EventLog.test.ts` stderr) were paid off on
2026-09-24. `smasher-desktop` finished all
9 tasks in `tasks/plan-smasher-desktop.md`. It ships a machine-local macOS
`.app` (no `.dmg`). The native features are the official Tauri
dialog/fs/notification plugins rather than custom commands, and the tray was
deferred.

## Deferred

Out of scope for this map, and not delivered by it:

- **Remote serving over plain HTTP** (the Objective's "(later)" target). It
  needs an auth layer first, since the API has none and binds `127.0.0.1` only.
- **Desktop tray icon.** Deferred in `SPEC-smasher-desktop.md`.
- **`.dmg` / portable desktop bundle.** The `.app` is machine-local, because
  the SPA, examples, and design kit are served from the source checkout.
- **`tauri-driver` desktop e2e.** It has no macOS support. The desktop is
  covered by manual QA plus the SPA's Playwright suite.

## Build order

`smasher-web-api` → `smasher-spa` → `smasher-desktop`

## Key decisions locked in

- **Access scope:** local-only for now. No auth layer. Server binds `127.0.0.1` only.
- **Migration:** full cutover — askama/HTMX removed once `smasher-spa` reaches parity, not kept behind a flag.
- **Naming:** new crate is `smasher-desktop`.

## Rationale

`smasher-web-api` ships and is verifiable standalone (curl/HTTP client against
the JSON/SSE contract). `smasher-spa` ships and is testable standalone in a
plain browser against that API. `smasher-desktop` ships last and is mostly
plumbing — embedding a proven server + proven UI — rather than carrying new
product logic.
