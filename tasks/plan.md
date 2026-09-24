# Implementation Plan: `claude-cli-provider`

Spec: [`SPEC-claude-cli-provider.md`](SPEC-claude-cli-provider.md). Task detail and
checkboxes: [`todo.md`](todo.md). Branch: `feat/claude-cli-provider`.

## Overview

Let the web server and desktop app run every LLM node through the local `claude -p`
instead of a provider API key. Single-call work (`task_critic`, `synthesis`, manager,
tool) goes through a new `ClaudeCliAdapter` in `smasher-llm`. Codergen goes through
`ClaudeCliBackend`, which moves from `smasher-cli` into `smasher-attractor` so the CLI
and web server share it, and switches from `--dangerously-skip-permissions` to a
`dontAsk` + allowlist setup. The desktop Settings dialog gets a fifth provider,
"Claude CLI", with a binary path instead of a key.

## What the code looks like today

- `ClaudeCliBackend` is a private struct in `crates/smasher-cli/src/run.rs:181-540`,
  with 10 fake-script tests at `run.rs:1584-2130`. It ignores `model`/`provider`,
  passes `--dangerously-skip-permissions`, and strips five nested-session env vars
  (`run.rs:250-254`). It calls `smasher_agent::session::tool_input_preview_from_value`
  and `PipelineEventEmitter`, both of which `smasher-attractor` can already reach.
- `Provider` (`smasher-llm/src/types/catalog.rs:12`) has four variants, matched in
  `Display`, `FromStr`, `catalog.rs:545,617` and `smasher-agent/src/profile/mod.rs:277`.
- `Client::from_env()` (`smasher-llm/src/client/mod.rs:66`) registers one adapter per
  env var. `adapter_for_request` uses `request.provider` first, then `infer_provider`.
- `task_critic.rs:151` and `synthesis.rs:96` call `client.complete()` with
  `provider.or(default_provider)`, so `SMASHER_PROVIDER=claude-cli` routes them to the
  new adapter without changes. `task_critic` sends a base64 `ContentPart::Image`.
  `generate_object` uses `ResponseFormat::JsonSchema`, not tools.
- `smasher-web/src/run_launch.rs:173,221` always builds `AgentCodergenBackend`, for both
  the top-level and the parallel child registry.
- `smasher-web/src/server.rs:203` refuses to start with no registered providers. Once
  the adapter registers from `SMASHER_CLAUDE_CLI`, that check passes on its own.
- Desktop: `crates/smasher-desktop/src/settings.rs` (`PROVIDERS`, `StoredSettings`,
  `env_vars`, `SettingsView`) and `frontend/src/components/dashboard/SettingsDialog.svelte`.

## Dependency graph

```
T1 spike (CLAUDE.md leak, allowlist patterns, deny behaviour)
 │
 ├── T2 smasher-llm: Provider::ClaudeCli + process plumbing (find binary, env strip, base cmd)
 │     │
 │     ├── T3 ClaudeCliAdapter: text request → result, usage, errors
 │     │     └── T4 images, JSON schema, multi-turn flattening
 │     │           └── T5 from_env registration + real-CLI #[ignore] test
 │     │
 │     └── T6 move ClaudeCliBackend → smasher-attractor (no behaviour change)
 │           └── T7 allowlist/dontAsk/--model/--strict-mcp-config in the backend
 │                 └── T8 `smasher run` wiring + --claude-skip-permissions
 │
 └── (T5 + T7) → T9 web server: claude-cli codergen + routing
                   └── T10 desktop settings.rs: Claude CLI provider, path, allowlist, version
                         └── T11 SettingsDialog.svelte
                               └── T12 docs
```

T3-T5 and T6-T8 are independent after T2 and can run in parallel sessions.

## Architecture decisions

- **Shared plumbing lives in `smasher-llm`** (`provider/claude_cli/process.rs`):
  binary resolution, nested-env stripping, the base `tokio::process::Command`. The
  attractor backend imports it. `smasher-llm` already depends on `tokio`; enable the
  `process` feature if the workspace doesn't.
- **Binary resolution is one function** used by the adapter, the backend and desktop:
  explicit path → `SMASHER_CLAUDE_CLI` (if it's a path, not `1`) → `~/.local/bin/claude`,
  `~/.claude/local/claude`, `/opt/homebrew/bin/claude`, `/usr/local/bin/claude` → `PATH`.
- **`stream()` on the adapter** runs `complete()` and emits the result as a short
  synthetic stream (start, one text delta, finish). Token streaming is out of scope,
  but callers that use `stream()` still work.
- **The move (T6) is a pure refactor.** Behaviour changes land in T7, so a regression
  can be pinned to one commit.
- **Backend config is a struct with a constructor**, not public fields: `working_dir`,
  `timeout`, `claude_path`, `streaming`, `emitter`, `max_consecutive_timeouts`,
  `default_model`, `permissions: Allowlist(Vec<String>) | SkipPermissions`.
- **Web codergen routing:** with `SMASHER_PROVIDER=claude-cli`, a codergen node with no
  provider or `provider="claude-cli"` uses `ClaudeCliBackend`. A node naming another
  provider uses `AgentCodergenBackend`. That's one small routing backend in
  `smasher-web/src/backend.rs`, used by both the top-level and child registries.
  (Needs sign-off, see Open questions.)
- **Tests** use the existing fake-`claude` shell-script pattern, which records argv
  and stdin and prints canned NDJSON. There's one real-CLI test per path, marked
  `#[ignore]` and run by hand at checkpoints, because it costs money.

## Task list

### Phase 0: Settle the unknowns
- [ ] T1: Spike: CLAUDE.md leak, allowlist patterns, how `dontAsk` denies

### Phase 1: Single-call adapter (`smasher-llm`)
- [ ] T2: `Provider::ClaudeCli` and shared process plumbing
- [ ] T3: `ClaudeCliAdapter` answers a text request
- [ ] T4: Images, JSON schema, multi-turn
- [ ] T5: Register from env, plus a real-CLI test

### Checkpoint A: adapter works for real
### Phase 2: Codergen (`smasher-attractor`, `smasher-cli`)
- [ ] T6: Move `ClaudeCliBackend` into `smasher-attractor`
- [ ] T7: Restricted permissions, model and isolation flags
- [ ] T8: `smasher run` wiring and escape-hatch flag

### Checkpoint B: `smasher run` still works, denial works
### Phase 3: Web server
- [ ] T9: Web server runs pipelines through the CLI

### Checkpoint C: product design factory with no keys
### Phase 4: Desktop and docs
- [ ] T10: Desktop settings backend: Claude CLI provider
- [ ] T11: Settings dialog UI for Claude CLI
- [ ] T12: Docs and backlog

### Checkpoint D: success criteria 1-6

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `~/.claude/CLAUDE.md` loads into codergen runs, so pipeline agents follow personal rules | High | T1 checks it first. Fallback: `--append-system-prompt` framing that overrides it, or a scratch `HOME`/`CLAUDE_CONFIG_DIR` if keychain auth still works. |
| `dontAsk` stalls or loops instead of denying cleanly | High | T1 proves it with a real `curl` attempt. The backend timeout already bounds a hang. |
| Allowlist too narrow for real design-kit candidates | Med | T1 and Checkpoint C run `product_design_factory.dot`. The list is editable in Settings. |
| Node `model` holds a non-Claude ID (e.g. `gpt-5`) and `--model` fails | Med | In T7, forward `--model` only for `claude-*` IDs and aliases. Otherwise fall back to the setting's model. |
| `Provider` enum is matched exhaustively in more places than found | Low | The compiler finds them. `smasher-agent` profile maps `ClaudeCli` to `AnthropicProfile`. |
| Retry policy re-runs a costly CLI call on a transient-looking error | Med | Map CLI errors to non-retryable variants unless the result says it hit a rate limit. |
| Tests spawning the real `claude` by accident | Med | Every non-ignored test passes an explicit fake-script path. None depend on `PATH`. |
| macOS Finder-launched app can't find `claude` | Med | Covered by the resolution order (T2) and shown in the dialog (T10/T11). |

## Resolved questions (Jobsworth, 2026-09-24)

1. **`smasher run` default (spec Q1):** switch to the allowlist, and add
   `--claude-skip-permissions` as the escape hatch (T8).
2. **Codergen nodes that name another provider in web mode:** they go to
   `AgentCodergenBackend` when that provider's key is configured, and fail clearly
   otherwise.
3. **Spec Q2 and Q3** (CLAUDE.md leak, Bash patterns) are answered by T1. Its findings
   are written back into this file before T7 starts.
