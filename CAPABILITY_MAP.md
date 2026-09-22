# Capability Map: Smasher Desktop Frontend

Approved 2026-09-22.

## Objective

Replace `smasher-web`'s askama/HTMX dashboard with a single Svelte SPA that is
served two ways: wrapped in a native Tauri desktop app, and (later) served
remotely over plain HTTP. One frontend codebase, one API contract, built in
three independently shippable modules.

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `smasher-web-api` | Rework the existing `smasher-web` crate: drop askama/HTMX templates, keep/extend the JSON + SSE endpoints (pipeline submit, event stream, human-gate Q&A), serve the static SPA bundle. Local-only, no auth. | `smasher-attractor`, `smasher-agent`, `smasher-llm` (unchanged, already workspace deps) |
| `smasher-spa` | Svelte + shadcn-svelte SPA: dashboard, DOT graph node editor, live event stream view, human-gate response UI. Talks to `smasher-web-api` via fetch/SSE. Thin native-capability shim (`window.__TAURI__` check) with browser fallbacks. | `smasher-web-api` (API contract) |
| `smasher-desktop` | New Tauri crate. Spawns `smasher-web-api`'s axum server in-process on `127.0.0.1:<port>`, opens a webview pointed at it serving `smasher-spa`, adds native-only Tauri commands (file dialogs, notifications, tray) behind the shim. | `smasher-web-api`, `smasher-spa` |

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
