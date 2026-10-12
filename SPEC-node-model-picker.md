# Spec: node-model-picker

Part of [SPEC.md](SPEC.md). Depends on `model-catalog`.

## Objective

When editing an LLM node, pick provider and model from the configured providers' lists instead of typing free text, and control the model of `task_critic`/`synthesis`/tool/manager nodes the same way.

## Current state

- Node `model`/`provider` attributes already work at run time for Codergen, Tool and Manager handlers (`transforms.rs` `apply_node_overrides`, `backend.rs`). `task_critic.rs`/`synthesis.rs` read `args.model`/`args.provider`.
- But `run_launch.rs:253` builds `TaskCriticSynthesisToolBackend::new(inner, model, model, provider, dir)`: critic and synthesis share the server default, and it's unclear that node-level attrs reach them.
- `CodergenForm.svelte` has a free-text `model` input (`codergen-model`) and no provider field. `ToolForm`/`ManagerForm` have none.
- Editor attrs are free JSON (`convert.ts`), saved through `PUT /api/workflows/{id}/graph`.

## Requirements

1. Shared `ModelPicker.svelte`: provider select (configured providers from `/api/models`, plus "Server default"), then a model select filtered to that provider; For Ollama the user must pick from its list (no default is pre-filled); free text only if the list is empty. Choosing a provider sets its default model. A saved value not in the list is kept and shown as "custom".
2. Writes `provider` and `model` node attrs; "Server default" removes both. Existing graphs with only `model` load unchanged.
3. Available anywhere an LLM is used (decided 2026-10-12): `CodergenForm`, `ManagerForm`, `ToolForm` for every tool node that can call an LLM (`task_critic`, `synthesis`, and tool nodes with no `tool_command`, which fall back to `LlmToolBackend`), and any other node form or run-level field that takes a model. The set is derived from one `usesLlm(node)` helper so new LLM nodes pick it up in one place.
4. Backend: verify and, if needed, fix so a node's `model`/`provider` attrs reach `task_critic` and `synthesis` (separate models per node). A test proves this.
5. `RunDialog`'s run-level Model field uses the same picker.

## Commands

```
cargo test -p smasher-task-critic-synthesis
cargo test -p smasher-web
cd frontend && npx vitest run tests/components/node-editor && npx playwright test
```

## Structure

- `frontend/src/components/node-editor/nodeForms/ModelPicker.svelte` (new), `CodergenForm.svelte`, `ToolForm.svelte`, `ManagerForm.svelte`, `RunDialog.svelte`; `frontend/src/lib/api` models fetch.
- Backend: `crates/smasher-web/src/run_launch.rs`, `crates/smasher-task-critic-synthesis/src/backend.rs`.

## Testing

- Vitest component tests against the real server (fake-claude, shared data dir): list reflects `/api/models`; provider change resets model; legacy `model`-only node round-trips through save/load.
- Playwright: edit a node, save, reload, DOT contains `provider`/`model`.
- Rust: a `task_critic` and `synthesis` node with different `model` attrs each send their own model (recorded by the existing claude-cli fake or provider test harness). No real LLM calls.

## Success criteria

- No free-text model field remains for non-Ollama providers.
- Per-node models for critic and synthesis verified end to end without an LLM call.

## Decisions

- Claude CLI nodes list only the Claude aliases (`claude-sonnet`, `claude-opus`, `claude-fable`), as it has no list API (decided 2026-10-12).

## Open Questions

None outstanding.
