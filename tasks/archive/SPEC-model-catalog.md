# Spec: model-catalog

Part of [SPEC-model-selection.md](SPEC-model-selection.md). No dependencies.

## Objective

One authoritative answer to "which models can I pick, for which provider, and which is the default for each?", for the UI and for validation. Success: a client can fetch the configured providers and their models, and choosing a provider always yields a valid model.

## Current state

- `smasher-llm/src/types/catalog.rs`: `Provider` enum (Anthropic, OpenAi, Gemini, Ollama, ClaudeCli), static `CATALOG`, `models_for_provider`, `infer_provider` (never returns Ollama/ClaudeCli), `lookup_model`.
- Ollama and ClaudeCli have no catalog entries. No "list models" call to any provider. No web route exposes the catalog.
- `Client::from_env()` (`smasher-llm/src/client/mod.rs`) knows which providers are configured.

## Requirements

1. `default_model_for(Provider) -> Option<&'static str>` in `smasher-llm`. Anthropic/OpenAI/Gemini from the catalog's latest; ClaudeCli → Claude aliases (`claude-sonnet`, `claude-opus`, `claude-fable`); Ollama → `None`: the user must pick a model explicitly (decided 2026-10-12).
2. `GET /api/models` in `smasher-web` returns, per **configured** provider (from the live `Client`): `{ provider, label, default_model, models: [{ id, label, aliases }], source, error? }`. Unconfigured providers are omitted. Ollama's `default_model` is null.
3. Model lists are built automatically (decided 2026-10-12), per provider, in this order: (a) the provider's own list API with the configured key (Anthropic, OpenAI, Gemini `models` endpoints; Ollama `/api/tags`); (b) on failure, the OpenRouter list via `modeldb` (24h disk cache); (c) the static catalog as last resort. `source` reports which was used. Claude CLI has no list API: it lists the Claude aliases. Results are cached in memory with a short TTL; a failure never returns a 500, only `error` plus the fallback list.
4. A `validate_pair(provider, model)` helper rejects a model that doesn't belong to the provider (fixes the drift bug). Validation checks the live list first and the static catalog second, so newly released models aren't rejected. Ollama accepts any non-empty name.

## Commands

```
cargo test -p smasher-llm catalog
cargo test -p smasher-web --test models_test
cargo clippy --workspace -- -D warnings
```

## Structure

- `crates/smasher-llm/src/types/catalog.rs`: defaults, `validate_pair`.
- `crates/smasher-web/src/routes/models.rs` (new), registered in `routes/api.rs`.
- `crates/smasher-web/tests/models_test.rs` (new).

## Code style

```rust
/// Default model for `provider`, or `None` when it has no fixed default (Ollama).
pub fn default_model_for(provider: Provider) -> Option<&'static str> { ... }
```

## Testing

- Unit: every non-Ollama provider has a default that passes `validate_pair`; mismatched pairs are rejected; ClaudeCli rejects `gemma4:31b-cloud`.
- Integration: boot the real server with only some providers configured; `/api/models` lists exactly those. Provider list API down returns 200 with `error` and the OpenRouter/static fallback. Provider list endpoints are hit with the test's real keys only when present; otherwise use a local HTTP server speaking the provider's list format (a real server, not a mock of our code).
- No LLM calls.

## Success criteria

- `/api/models` matches the configured providers on a real server.
- No (provider, default model) pair fails `validate_pair`.

## Open Questions

None outstanding.
