# Implementation Plan: Model selection everywhere, and per node (backlog #20)

Specs: [`SPEC.md`](../SPEC.md) (capability map and decisions) and the four `SPEC-<module>.md` files. Tasks are in [`todo.md`](todo.md).

## Overview

Replace the boot-time, server-wide `SMASHER_MODEL`/`SMASHER_PROVIDER` strings with a provider-qualified model catalog built automatically from provider APIs (OpenRouter and the static catalog as fallbacks), a persisted default `{provider, model}` that hot-applies to new runs, a provider+model picker on every node that uses an LLM, and a settings dialog in both the web and desktop apps.

## Dependency graph

```
model-catalog (T1 → T2 → T3)
    ├── llm-settings (T4 → T5 → T6)
    ├── node-model-picker (T7, T8 → T9)
    └──────────────┬──────────────
              settings-ui (T10 → T11) → docs (T12)
```

T7 (backend per-node model) needs nothing from the catalog and runs first as the riskiest unknown.

## Architecture decisions

- **Settings store is `{data_dir}/settings.json`**, shared by web and desktop. Precedence: settings file > env/`.env` > built-in default. Never holds keys.
- **Hot-apply:** `AppState` holds `{client, provider, model}` behind a lock. Each run snapshots it at submit, so in-flight runs never change. Desktop key changes rebuild the `Client` and swap it atomically.
- **Validation lives in `smasher-llm`** (`validate_pair`), checks the live list then the static catalog, and is used by both the settings API and the UI. Ollama has no default; any non-empty name is accepted.
- **No new dependencies expected** (`reqwest` is already used by the provider adapters). Adding one needs your approval.
- **No test spends tokens.** Provider list endpoints are exercised against a local HTTP server that speaks each provider's list format, or real keys only when present.

## Phases

### Phase 1: model-catalog
T1 defaults and `validate_pair` → T2 provider list fetchers with fallback chain → T3 `GET /api/models`.
**Checkpoint A:** `/api/models` correct on a real server; `cargo test -p smasher-llm -p smasher-web`, clippy and fmt clean.

### Phase 2: llm-settings ∥ node-model-picker
- T7 first (risk): do a node's `model`/`provider` reach `task_critic` and `synthesis`?
- T4 → T5 → T6 (settings), and T8 → T9 (picker) can be done in parallel by separate sessions once T3 lands. They touch disjoint files except `api.rs` (T5 only).
**Checkpoint B:** a settings change applies to the next run with no restart; a node's provider/model survive save and reload; full Rust and Vitest suites pass against the fake-claude server.

### Phase 3: settings-ui
T10 → T11 → T12.
**Checkpoint C (final):** all spec success criteria met, Playwright passes, manual desktop QA done, backlog #20 removed.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Per-node model doesn't reach critic/synthesis (`run_launch.rs:253` passes one shared model) | Med | T7 is first; fix is small and contained in `smasher-task-critic-synthesis` |
| Provider list APIs differ in shape, auth and rate limits | Med | One fetcher per provider behind a common trait; every failure degrades to OpenRouter then static; short TTL cache |
| Hot-swapping state races with in-flight runs | High | Runs copy the config at submit; test submits a run, changes settings mid-run, asserts old pair kept |
| Desktop Keychain tests are macOS-only (backlog #32 CI failures) | Low | Gate any new Keychain tests to macOS |
| Frontend "real API" tests break if the desktop app holds port 21541 | Low | Follow the backlog's frontend test gotcha; quit the app first |
| Settings API is unauthenticated | Low | Loopback-only like the rest of the API; never returns keys; #16 remains the owner of auth |

## Open questions

None outstanding.
