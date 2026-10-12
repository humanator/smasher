# Spec: llm-settings

Part of [SPEC-model-selection.md](SPEC-model-selection.md). Depends on `model-catalog`.

## Objective

A single persisted default `{provider, model}` pair, readable and writable through the web API, applied to new runs without a restart. Keys are not part of this API.

## Current state

- `ServerConfig::default()` (`smasher-web/src/server.rs:137`) reads `SMASHER_MODEL`/`SMASHER_PROVIDER` once. `AppState::new(client, model, provider, ...)` holds them immutably.
- Desktop: `settings.rs` writes `{data_dir}/settings.json`, keys to Keychain, exports env at boot (`apply_to_env`), and needs `restart_app`.
- `SubmitRequest.provider` is not accepted; the provider always comes from `state.default_provider` (`api.rs:219`).

## Requirements

1. Settings file `{data_dir}/settings.json` is the shared store (desktop already writes one; keep its shape, add nothing secret). Precedence at boot: settings file > env > built-in default.
2. `AppState` holds the default pair behind a lock; each run snapshots it at submit. In-flight runs are unaffected.
3. `GET /api/settings` → `{ provider, model, source }` (`source`: `settings`, `env` or `default`). `PUT /api/settings` takes `{ provider, model }`, validates with `validate_pair` and that the provider is configured, persists, and swaps the live default. Invalid → 422 with a message.
4. Desktop key changes: after saving, re-export env and rebuild the `Client` in-process so a new key applies to new runs (replaces `restart_app`).
5. `SubmitRequest` accepts optional `provider` alongside `model`.
6. The API never returns or accepts keys. Bound to `127.0.0.1` only, as today; no auth (#16 is out of scope).

## Commands

```
cargo test -p smasher-web --test settings_test
cargo test -p smasher-desktop settings
cargo clippy --workspace -- -D warnings
```

## Structure

- `crates/smasher-web/src/settings.rs` (new store), `routes/settings.rs` (new), `server.rs`, `api.rs` (state + submit).
- `crates/smasher-desktop/src/settings.rs`, `commands.rs` (delegate to the shared store; drop restart).
- Tests: `crates/smasher-web/tests/settings_test.rs` (new).

## Testing

- An Ollama default is never invented: saving provider `ollama` without a model → 422.
- Integration, real server and temp data dir: PUT then GET round-trips; a run submitted after PUT uses the new pair (assert from the run's recorded config, no LLM node); a run in flight keeps the old pair; restart reloads from file; mismatched pair → 422; unconfigured provider → 422.
- Desktop: existing real-Keychain tests keep passing; macOS-gate new Keychain tests (see backlog #32).
- No LLM calls.

## Success criteria

- Provider+model change without restart on web and desktop.
- The `gemma4`-to-Claude-CLI drift can't be saved.

## Decisions

- The settings file overrides `SMASHER_MODEL`/`SMASHER_PROVIDER` in `.env` (decided 2026-10-12). `source` tells the UI where the value came from.

- Desktop key changes rebuild the `Client` in place, swapped atomically behind the same lock as the settings (decided 2026-10-12).

## Open Questions

None outstanding.
