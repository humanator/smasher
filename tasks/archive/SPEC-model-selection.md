# Capability Map: Model selection everywhere, and per node (backlog #20)

Raised by Jobsworth 2026-09-25. Status: **map approved 2026-10-12; all open questions resolved, specs awaiting final review.**

## Decisions (Jobsworth, 2026-10-12)

- Map below approved as is.
- **Keys:** the web app has no key entry. Keys stay in env/`.env`; the desktop app keeps its Keychain. The web settings page covers provider and model only.
- **Apply:** changes hot-apply to *new* runs. In-flight runs keep their config. The desktop restart goes away.

## Problem

Model and provider are two loose strings, set once per server at boot (`SMASHER_MODEL`/`SMASHER_PROVIDER`) or in a desktop-only dialog. They drift apart (2026-09-25: a Claude CLI provider received `gemma4:31b-cloud`). The node editor has a free-text `model` field, no `provider` field, and no model control for `task_critic`/`synthesis`. There is no settings or models API.

## Modules

| Module id | Responsibility | Depends on | Spec |
|---|---|---|---|
| `model-catalog` | Provider-qualified model list, `GET /api/models`, default model per provider | none | [SPEC-model-catalog.md](SPEC-model-catalog.md) |
| `llm-settings` | Persisted default provider+model, `GET`/`PUT /api/settings`, hot-apply to new runs | `model-catalog` | [SPEC-llm-settings.md](SPEC-llm-settings.md) |
| `node-model-picker` | Provider+model dropdown in the codergen form; model/provider controls for `task_critic`, `synthesis`, manager and tool nodes; per-node model in critic/synthesis | `model-catalog` | [SPEC-node-model-picker.md](SPEC-node-model-picker.md) |
| `settings-ui` | Web settings dialog; desktop dialog moved onto the same API | `llm-settings`, `model-catalog` | [SPEC-settings-ui.md](SPEC-settings-ui.md) |

Build order: `model-catalog` → (`llm-settings` ∥ `node-model-picker`) → `settings-ui`.

## Shared conventions

- Commands: `cargo test -p <crate>`, `cargo clippy --workspace -- -D warnings`, `cargo fmt --all`; frontend tests per `tasks/BACKLOG.md` "Frontend test gotcha" (fake-claude server, no LLM spend).
- Rust files start with two `ABOUTME:` lines; tests in-file or `tests/`; TDD.
- Tests use real APIs and data, never mocks of our own code. Per project memory, no test may spend LLM tokens except the existing critical-path tests, on request only.
- Boundaries for every module:
  - Always: write the test first; keep output warning-free; commit per task.
  - Ask first: new dependencies, CI changes, changing existing `.dot` example files, anything touching `#16` auth.
  - Never: return API keys from any endpoint or log them; add key entry to the web UI; rewrite existing implementations without permission; run LLM-spending tests.
