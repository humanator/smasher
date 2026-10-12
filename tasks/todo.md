# Todo: Model selection everywhere, and per node (backlog #20)

Plan: [`plan.md`](plan.md). Specs: `SPEC.md`, `SPEC-<module>.md`. Every task: tests first, `cargo clippy --workspace -- -D warnings` and `cargo fmt --all` clean, commit when green. No test spends LLM tokens.

## Phase 1: model-catalog

- [x] **T1 (S): Provider defaults and `validate_pair`**
  - Acceptance: `default_model_for` returns `Some` for Anthropic/OpenAI/Gemini/ClaudeCli and `None` for Ollama; `validate_pair` rejects `claude-cli` + `gemma4:31b-cloud`, accepts any non-empty Ollama name; every default passes `validate_pair`.
  - Verify: `cargo test -p smasher-llm catalog`
  - Files: `crates/smasher-llm/src/types/catalog.rs`
  - Depends on: none

- [x] **T2 (M): Provider model-list fetchers with fallback chain**
  - Acceptance: per-provider list fetch (Anthropic, OpenAI, Gemini `models`; Ollama `/api/tags`) with configured key and base URL; on failure falls back to `modeldb` (OpenRouter) then static catalog; result carries `source` and `error`; Claude CLI returns aliases only; short in-memory TTL cache; `validate_pair` consults the live list first.
  - Verify: `cargo test -p smasher-llm models_list` (local HTTP server speaking each list format; a down server exercises the fallback)
  - Files: `crates/smasher-llm/src/models_list.rs` (new), `src/lib.rs`, `src/modeldb.rs`, `src/types/catalog.rs`
  - Depends on: T1

- [x] **T3 (M): `GET /api/models`**
  - Acceptance: returns `{provider, label, default_model, models[], source, error?}` for configured providers only; Ollama `default_model` null; list-API failure still returns 200.
  - Verify: `cargo test -p smasher-web --test models_test` against a real booted server with a partial provider set
  - Files: `crates/smasher-web/src/routes/models.rs` (new), `routes/mod.rs`, `routes/api.rs`, `tests/models_test.rs` (new)
  - Depends on: T2

### Checkpoint A: model-catalog
- [ ] `cargo test -p smasher-llm -p smasher-web`, clippy, fmt all clean
- [ ] Manual: `curl 127.0.0.1:21541/api/models` on a real `smasher serve` lists the configured providers
- [ ] Review with Jobsworth

## Phase 2a: node-model-picker (T7 first, as the risk check)

- [x] **T7 (S): Per-node model/provider reach `task_critic` and `synthesis`**
  - Acceptance: two nodes with different `model`/`provider` attrs each send their own; unset attrs fall back to the server default; fix `run_launch.rs:253` only if the test shows attrs are dropped.
  - Verify: `cargo test -p smasher-task-critic-synthesis -p smasher-web` (recording provider/claude-cli fake; no LLM calls)
  - Files: `crates/smasher-task-critic-synthesis/src/{backend,task_critic,synthesis}.rs`, `crates/smasher-web/src/run_launch.rs`, a test file
  - Depends on: none

- [x] **T8 (M): `ModelPicker` in the codergen form (vertical slice)**
  - Acceptance: provider select (configured providers + "Server default") then model select for that provider; choosing a provider sets its default model, none for Ollama; unknown saved value shown as "custom"; legacy `model`-only nodes load unchanged; save/reload round-trips `provider` and `model` into the DOT.
  - Verify: `cd frontend && npx vitest run tests/components/node-editor`; Playwright edit, save, reload
  - Files: `frontend/src/components/node-editor/nodeForms/{ModelPicker.svelte,CodergenForm.svelte}`, `frontend/src/lib/api` models client, `frontend/tests/components/node-editor/...`, `frontend/e2e/node-model.spec.ts` (new)
  - Depends on: T3

- [x] **T9 (M): Picker everywhere an LLM is used**
  - Acceptance: one `usesLlm(node)` helper drives the picker in `ManagerForm`, `ToolForm` (`task_critic`, `synthesis`, tools with no `tool_command`) and `RunDialog`; Claude CLI lists aliases only; non-LLM tool nodes show no picker.
  - Verify: Vitest for each form, including a non-LLM tool node
  - Files: `ToolForm.svelte`, `ManagerForm.svelte`, `RunDialog.svelte`, `usesLlm.ts` (new), tests
  - Depends on: T8

## Phase 2b: llm-settings (parallel with 2a once T3 lands)

- [x] **T4 (M): Settings store and `GET`/`PUT /api/settings`**
  - Acceptance: `{provider, model, source}` read/written at `{data_dir}/settings.json`; boot precedence settings file > env > default; invalid pair, unconfigured provider, or Ollama without a model → 422; no keys in any request or response.
  - Verify: `cargo test -p smasher-web --test settings_test` (real server, temp data dir; PUT/GET round-trip and restart reload)
  - Files: `crates/smasher-web/src/settings.rs` (new), `routes/settings.rs` (new), `routes/mod.rs`, `server.rs`, `tests/settings_test.rs` (new)
  - Depends on: T3

- [x] **T5 (M): Hot-apply to new runs; `SubmitRequest.provider`**
  - Acceptance: `AppState` default lives behind a lock; each run snapshots it at submit; PUT affects the next run, not one in flight; `SubmitRequest` accepts `provider`.
  - Verify: `cargo test -p smasher-web` (submit a gate-only run, PUT mid-run, assert old pair on it and new pair on the next)
  - Files: `crates/smasher-web/src/{state.rs or server.rs},routes/api.rs,run_launch.rs`, `tests/settings_test.rs`
  - Depends on: T4

- [x] **T6 (M): Desktop uses the shared store; no restart**
  - Acceptance: desktop provider/model go through the shared store; key changes re-export env and rebuild the `Client` atomically behind the same lock; `restart_app` no longer needed for settings.
  - Verify: `cargo test -p smasher-desktop settings` (Keychain tests stay; any new ones macOS-gated); manual desktop run
  - Files: `crates/smasher-desktop/src/{settings.rs,commands.rs,bootstrap.rs}`, `crates/smasher-web/src/settings.rs`
  - Depends on: T5

### Checkpoint B: settings and picker
- [ ] Full `cargo test --workspace` and frontend Vitest (fake-claude server, desktop app quit) pass
- [ ] Settings change applies to the next run with no restart; picker choices survive save/reload
- [ ] Review with Jobsworth

## Phase 3: settings-ui

- [x] **T10 (M): Settings dialog on the web API, icon in the global nav**
  - Acceptance: a "Settings" icon button at the top right of the global navigation bar on every page, in both apps; dialog has provider + model (reusing `ModelPicker`), shows `source` and API errors, saves via `PUT /api/settings`; web shows a note that keys come from env/`.env`.
  - Verify: `npx vitest run tests/components/dashboard/SettingsDialog.test.ts`; Playwright: change provider/model, submit a gate-only run, confirm recorded pair
  - Files: `frontend/src/components/dashboard/SettingsDialog.svelte`, `frontend/src/App.svelte` (or nav component), `frontend/src/lib/api`, `frontend/e2e/settings.spec.ts` (new), `SettingsDialog.test.ts`
  - Depends on: T4, T8

- [x] **T11 (S): Desktop-only fields and no restart prompt**
  - Acceptance: key, base-URL and Claude CLI fields remain on desktop only, saved via Tauri commands; "restart to apply" removed.
  - Verify: Vitest with the Tauri mock used by existing tests; manual desktop QA
  - Files: `SettingsDialog.svelte`, `frontend/src/lib/native/index.ts`, tests
  - Depends on: T6, T10

- [ ] **T12 (S): Docs and backlog**
  - Acceptance: `docs/config-reference.md`, `docs/api-reference.md`, `docs/quickstart.md` cover the settings and models APIs and precedence; backlog #20 removed and #23's note about #20 updated.
  - Verify: read-through; `rg "SMASHER_MODEL" docs` shows precedence described
  - Files: the three docs, `tasks/BACKLOG.md`
  - Depends on: T11

### Checkpoint C: complete
- [ ] All four specs' success criteria met
- [ ] `make ci` and the Playwright suite pass
- [ ] Manual desktop QA done (settings change, no restart)
- [ ] Ready for review and merge
