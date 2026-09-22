# Spec: smasher-web-api

Module id: `smasher-web-api` · Capability map: [CAPABILITY_MAP.md](CAPABILITY_MAP.md)

## Objective

Rework the existing `smasher-web` crate so it stops rendering server-side
HTML (askama + HTMX) and instead exposes a JSON + SSE API, plus serves the
built `smasher-spa` static bundle. This crate becomes the single backend
surface consumed identically by a browser and by the `smasher-desktop` Tauri
app (pointed at a local instance of the same server).

Users: Simon, running this locally via `smasher serve`. No remote/multi-user
access in this phase — local-only, no auth.

Success looks like: everything the current HTMX dashboard can do (submit a
pipeline, watch it run live, answer human-gate prompts) is available as a
documented HTTP/SSE contract, with zero server-rendered HTML left in the crate.

## Tech Stack

- Rust, `axum` (existing dependency)
- `tokio::broadcast` for event fan-out (existing pattern, per project CLAUDE.md)
- `serde_json` for request/response bodies
- SSE via axum's SSE support for the live event stream
- Remove: `askama`, HTMX client JS, template files

## Commands

```bash
cargo check -p smasher-web
cargo test -p smasher-web
cargo clippy -p smasher-web
cargo run --bin smasher -- serve   # starts the server on 127.0.0.1:21541
```

## Project Structure

```
crates/smasher-web/
  src/
    main.rs / lib.rs
    routes/
      api.rs         # pipeline submit, status, list
      events.rs       # SSE stream endpoint
      gates.rs         # human-gate Q&A endpoints
      static_files.rs  # serves ../../frontend/dist, SPA fallback routing
    state.rs           # shared AppState (broadcast channel, engine handles)
  tests/
    api_test.rs
    events_test.rs
```

`templates/` (askama) and any HTMX-specific static JS are deleted once
`smasher-spa` confirms parity (see Boundaries).

## Code Style

Match existing smasher conventions (per repo `CLAUDE.md`):

```rust
// ABOUTME: Axum routes for pipeline submission and status.
// ABOUTME: Delegates all execution to smasher-attractor; this crate is transport only.

#[derive(thiserror::Error, Debug)]
pub enum ApiError {
    #[error("pipeline not found: {0}")]
    NotFound(String),
    #[error("engine error: {0}")]
    Engine(#[from] smasher_attractor::EngineError),
}

impl ApiError {
    pub fn retryable(&self) -> bool {
        matches!(self, ApiError::Engine(e) if e.retryable())
    }
}
```

- `async-trait` for any handler traits, `tracing` for structured logs.
- Route handlers stay thin — delegate to `smasher-attractor`/`smasher-agent`/`smasher-llm`, no business logic in this crate.

## Testing Strategy

- Unit tests co-located `#[cfg(test)] mod tests` for request/response
  (de)serialization and error mapping.
- Integration tests in `tests/` that start the real axum server on an
  ephemeral port and hit it with `reqwest` — no mocked HTTP layer, per
  "use real data and real APIs rather than mocking."
- SSE tests assert event ordering and payload shape across a full pipeline
  run using one of the existing `examples/` DOT files.
- Cover: happy path submit → events → completion; human-gate round trip;
  static-serving fallback (unknown route → SPA `index.html`, not 404).
- `cargo test -p smasher-web` and `cargo clippy -p smasher-web` must pass clean.

## Boundaries

- **Always:** keep the event/API schema stable and documented (this is the
  contract `smasher-spa` codes against); run `cargo test -p smasher-web` +
  clippy before committing; leave `smasher-attractor`/`smasher-agent`/`smasher-llm` public APIs untouched.
- **Ask first:** any change to a lower-layer crate's public API; adding new
  external Rust dependencies; changing the default port (`21541`).
- **Never:** add auth/session storage without explicit approval (matches the
  local-only decision); bind to anything other than `127.0.0.1`; commit
  `.env` or API keys; delete the askama templates before `smasher-spa` has
  confirmed functional parity.

## Success Criteria

- [x] JSON/SSE endpoints cover: submit pipeline, live event stream, list/status, human-gate answer.
- [x] Static file route serves `smasher-spa`'s build output with SPA-style fallback routing. (Mounted at `/spa`, not yet at `/` — moving it to `/` is Task 9, blocked below.)
- [x] `smasher serve` behavior is otherwise unchanged from the user's perspective (same command, same port).
- [ ] askama templates and HTMX JS removed. **Blocked on Task 9** — deliberately not done yet; waiting on `smasher-spa` to ship and confirm dashboard parity before deleting the legacy dashboard.
- [x] All new/changed code has unit + integration coverage; `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean.

## Open Questions

- Exact route prefix (`/api/*` vs unprefixed) and SSE path naming.
- Static assets: read from disk (`frontend/dist`) for dev simplicity vs.
  embedded into the binary (`rust-embed`) for distribution — recommend
  disk-based now, revisit at `smasher-desktop` ship time.
