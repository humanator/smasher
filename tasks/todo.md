# Todo: `claude-cli-provider`

Plan: [`plan.md`](plan.md). Spec: [`SPEC-claude-cli-provider.md`](SPEC-claude-cli-provider.md).
TDD throughout: failing test first. Commit at the end of each task.

---

## Phase 0: Settle the unknowns

### T1: Spike: CLAUDE.md leak, allowlist patterns, how `dontAsk` denies

**Description:** Real `claude -p` calls, no production code. Answer spec open
questions 2 and 3, and prove denial doesn't hang. Record the findings in `plan.md`
under "Spike 2 results".

**Acceptance criteria:**
- [x] Known: with `--setting-sources "" --strict-mcp-config`, does `~/.claude/CLAUDE.md`
      reach the model? Test: a codergen-style prompt asking "what name should you
      address the user by?" With a leak, the chosen mitigation is shown to work.
      → No leak with `--setting-sources ""`. The control run without it leaks.
- [x] Known: the exact `--allowedTools` syntax for Bash prefixes (e.g.
      `Bash(npm run build:*)`), and a proposed default list checked against one real
      design-kit candidate build. → `Bash(<prefix>:*)`. Default list is in `plan.md`.
- [x] Known: a prompt forcing `curl https://example.com` under `--permission-mode
      dontAsk` gets denied, the run ends, and the exit code and `result` event are
      recorded. → Exit 0, `subtype: success`, listed in `permission_denials`, 9s.

**Verification:**
- [x] Commands and outputs recorded in `plan.md` ("Spike 2 results")
- [x] Manual check: no stray sessions in `~/.claude/projects` from
      `--no-session-persistence` runs → no transcripts. Only an empty `memory/` folder
      per working dir (removed).

**Dependencies:** None
**Files likely touched:** `tasks/plan.md`
**Estimated scope:** XS

---

## Phase 1: Single-call adapter (`smasher-llm`)

### T2: `Provider::ClaudeCli` and shared process plumbing

**Description:** Add the `ClaudeCli` variant (`"claude-cli"`) and a
`provider/claude_cli/` module with `resolve_binary()`, `strip_nested_session_env()`
and `base_command()`. No adapter yet.

**Acceptance criteria:**
- [x] `"claude-cli".parse::<Provider>()` round-trips through `Display`. All
      exhaustive matches compile (catalog: no models, `get_latest_model` → `None`;
      agent profile → `AnthropicProfile`).
- [x] `resolve_binary(explicit, env, home, path)` follows the spec order. It's a pure
      function over injected inputs, tested for each rung and for "not found".
- [x] `base_command()` removes the five nested-session env vars (test: inspect
      `Command::get_envs()`).

**Verification:**
- [x] `cargo test -p smasher-llm claude_cli` and `cargo test -p smasher-agent`
- [x] `cargo clippy --workspace -- -D warnings`

**Dependencies:** T1 (informs nothing structural, but T1 may add a flag to `base_command`)
**Files likely touched:** `smasher-llm/src/types/catalog.rs`,
`smasher-llm/src/provider/{mod.rs,claude_cli/mod.rs,claude_cli/process.rs}`,
`smasher-agent/src/profile/mod.rs`
**Estimated scope:** S

### T3: `ClaudeCliAdapter` answers a text request

**Description:** `ClaudeCliAdapter::new(binary)` implementing `ProviderAdapter`.
Build argv (spec §1 flags, `--system-prompt` with a neutral default, `--model`),
write one stream-json user message to stdin, read NDJSON to the `result` event, and
build a `Response` with text and usage from `modelUsage`. `stream()` wraps
`complete()`.

**Acceptance criteria:**
- [x] A fake script records argv and stdin. The test asserts the exact flags, the
      system prompt (given, or the default when it's `None`) and the model.
- [x] Response text and usage (input, output, cache read, cache creation) come from
      the `result` event.
- [x] Errors: missing binary → spawn error; non-zero exit → error carrying stderr;
      `is_error: true` → error; "not logged in" text → `Error::Authentication`;
      request with `tools` → `Error::InvalidRequest`. None are retryable.

**Verification:**
- [x] `cargo test -p smasher-llm claude_cli`
- [x] Zero warnings in test output

**Dependencies:** T2
**Files likely touched:** `smasher-llm/src/provider/claude_cli/{mod.rs,adapter.rs}`,
test fixture script
**Estimated scope:** M

### T4: Images, JSON schema, multi-turn

**Description:** Map `ContentPart::Image` (base64) to a stream-json `image` block.
Map `ResponseFormat::JsonSchema` to `--json-schema` and return the serialised
`structured_output` as text. Flatten multi-turn history into one role-labelled
user message.

**Acceptance criteria:**
- [x] Image bytes arrive in stdin as `{"type":"image","source":{"type":"base64",...}}`
      alongside the text parts.
- [x] `JsonSchema` request passes the schema to `--json-schema`. The response text
      parses back to the fake's `structured_output`. A missing `structured_output`
      falls back to `result` text.
- [x] A 3-message history arrives as one user message with `User:` / `Assistant:`
      labels, in order.

**Verification:**
- [x] `cargo test -p smasher-llm claude_cli`
- [x] `generate_object` test against the adapter with the fake script

**Dependencies:** T3
**Files likely touched:** `smasher-llm/src/provider/claude_cli/adapter.rs`
**Estimated scope:** S

### T5: Register from env, plus a real-CLI test

**Description:** `Client::from_env()` registers `ClaudeCliAdapter` when
`SMASHER_CLAUDE_CLI` is set (`1` → resolve, otherwise use the path). Add
`#[ignore]` integration tests that hit the real CLI.

**Acceptance criteria:**
- [x] `SMASHER_CLAUDE_CLI=/path/to/fake` → `registered_providers()` includes
      `ClaudeCli`. Unset → it doesn't. (Env mutation serialised the same way other
      `from_env` tests are.)
- [x] Ignored tests cover: a text answer, an image described correctly, a schema
      object returned, and `cache_creation` under 2,000 tokens (success criterion 4).

**Verification:**
- [x] `cargo test -p smasher-llm`
- [ ] `cargo test -p smasher-llm --test claude_cli_real -- --ignored` (by hand, deferred to Jobsworth)

**Dependencies:** T4
**Files likely touched:** `smasher-llm/src/client/mod.rs`,
`smasher-llm/tests/claude_cli_real.rs`
**Estimated scope:** S

## Checkpoint A: adapter works for real
- [ ] `make ci` clean
- [ ] Ignored real-CLI tests pass. Cost per call is noted in `plan.md`.
- [ ] Review with Jobsworth before Phase 2

---

## Phase 2: Codergen (`smasher-attractor`, `smasher-cli`)

### T6: Move `ClaudeCliBackend` into `smasher-attractor`

**Description:** Pure move. The backend goes to
`smasher-attractor/src/claude_cli_backend.rs` with a constructor, and uses T2's
`base_command()` / env stripping. Its 10 fake-script tests move with it. `run.rs`
imports it. No flag changes.

**Acceptance criteria:**
- [x] `run.rs` no longer defines `ClaudeCliBackend`. The same tests pass in the new
      home, including the `--dangerously-skip-permissions` assertion for now.
- [x] `smasher run --backend claude-cli` argv is byte-for-byte the same as before
      (the fake-script test captures it).

**Verification:**
- [x] `cargo test -p smasher-attractor claude_cli` and `cargo test -p smasher-cli`
- [x] `git diff --stat` shows a move, not a rewrite

**Dependencies:** T2
**Files likely touched:** `smasher-attractor/src/{lib.rs,claude_cli_backend.rs}`,
`smasher-cli/src/run.rs`
**Estimated scope:** M

### T7: Restricted permissions, model and isolation flags

**Description:** Swap `--dangerously-skip-permissions` for `--permission-mode dontAsk
--allowedTools <list>`, unless the config says skip. Add `--strict-mcp-config
--no-session-persistence --setting-sources ""` (T1: the last one keeps
`~/.claude/CLAUDE.md` out), and set stdin to null. Forward the node `model` as
`--model` when it's a Claude ID or alias; otherwise use `default_model`. Parse
`SMASHER_CLAUDE_CLI_ALLOWED_TOOLS` and define the default list from T1 (in `plan.md`).

**Acceptance criteria:**
- [x] Default config argv has `dontAsk`, the default allowlist,
      `--strict-mcp-config`, `--no-session-persistence`, `--setting-sources ""`, and no
      `--dangerously-skip-permissions`. The skip config gives the reverse.
- [x] Node `model="claude-opus-5-5"` → `--model claude-opus-5-5`. `model="gpt-5"` →
      `--model <default_model>`. No model → `default_model`.
- [x] Env allowlist parsing: comma-separated, trimmed, empty entries dropped. Unset
      uses the default.

**Verification:**
- [x] `cargo test -p smasher-attractor claude_cli`
- [ ] (written; run by hand, deferred to Jobsworth) Real-CLI `#[ignore]` test: a `curl` prompt is denied and the node ends
      (success or failure) inside the timeout

**Dependencies:** T6, T1
**Files likely touched:** `smasher-attractor/src/claude_cli_backend.rs`
**Estimated scope:** S

### T8: `smasher run` wiring and escape-hatch flag

**Description:** Wire `run.rs` to the new config: the allowlist by default,
`--claude-skip-permissions` for the old behaviour, and `--model` feeding
`default_model`.

**Acceptance criteria:**
- [x] `--claude-skip-permissions` parses and defaults to false (clap tests like the
      existing ones).
- [x] The backend gets `SkipPermissions` only with the flag.

**Verification:**
- [x] `cargo test -p smasher-cli`
- [ ] (deferred to Jobsworth) Manual: `cargo run -p smasher-cli -- run examples/old-examples/hello-world.dot`
      completes

**Dependencies:** T7
**Files likely touched:** `smasher-cli/src/run.rs`, `docs/cli-reference.md`
**Estimated scope:** XS

## Checkpoint B: `smasher run` still works, denial works
- [ ] `make ci` clean
- [ ] hello-world and one codergen example run via `smasher run` (success criterion 5)
- [ ] `curl` denial observed with no hang (success criterion 3)
- [ ] Review with Jobsworth

---

## Phase 3: Web server

### T9: Web server runs pipelines through the CLI

**Description:** In `run_launch.rs`, when `provider == "claude-cli"`, build
`ClaudeCliBackend` (streaming, with the run's emitter and working dir, and the
allowlist from env) behind a small routing backend. The routing backend sends nodes
naming another provider to `AgentCodergenBackend`. Use it in both the top-level and
child registries. Update the `NoApiKeys` message to mention `SMASHER_CLAUDE_CLI`.

**Acceptance criteria:**
- [x] Integration test: server started via `start()` with only
      `SMASHER_CLAUDE_CLI=<fake>` and `SMASHER_PROVIDER=claude-cli`. It boots,
      runs a codergen pipeline, and the SSE stream carries `AgentMessage` /
      `AgentToolCallStarted` from the fake NDJSON.
- [x] Routing: a node with `provider="openai"` reaches the agent backend. A node
      with no provider reaches the CLI backend (unit test with recording backends).
- [x] With any other provider, behaviour is unchanged (existing web tests pass).

**Verification:**
- [x] `cargo test -p smasher-web`
- [ ] (deferred to Jobsworth) Manual: `SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=1 cargo run -p smasher-cli -- serve`
      with API keys unset, then run hello-world from the SPA

**Dependencies:** T5, T7
**Files likely touched:** `smasher-web/src/{run_launch.rs,backend.rs,server.rs}`,
`smasher-web/tests/…`
**Estimated scope:** M

## Checkpoint C: product design factory with no keys
- [ ] `examples/product_design_factory.dot` via the web server, no keys: valid
      `critic-report.json`, a synthesis recommendation, and `task_critic` describes
      the real screenshot (success criterion 2)
- [ ] Allowlist sufficient for a real candidate build. Adjust the default if not.
- [ ] Review with Jobsworth

---

## Phase 4: Desktop and docs

### T10: Desktop settings backend: Claude CLI provider

**Description:** Add a Claude CLI provider to `settings.rs` with no key var. Add
`claude_cli_path: Option<String>` and `claude_cli_allowed_tools: Option<Vec<String>>`
to `StoredSettings`. `env_vars` writes `SMASHER_CLAUDE_CLI` (resolved path) and
`SMASHER_CLAUDE_CLI_ALLOWED_TOOLS`. `SettingsView` exposes the resolved path and the
`claude --version` output or "not found", and a Tauri command re-detects on demand.

**Acceptance criteria:**
- [x] Default provider `claude-cli` with a saved path gives `SMASHER_PROVIDER=claude-cli`
      and `SMASHER_CLAUDE_CLI=<path>`, and no key vars.
- [x] Update validation accepts `claude-cli` as default provider without a key.
      Allowlist round-trips through `settings.json`.
- [x] The view reports the version from a fake binary, and "not found" for a
      missing one.

**Verification:**
- [x] `cargo test -p smasher-desktop`

**Dependencies:** T9
**Files likely touched:** `smasher-desktop/src/{settings.rs,commands.rs}`
**Estimated scope:** M

### T11: Settings dialog UI for Claude CLI

**Description:** `SettingsDialog.svelte` shows Claude CLI with a binary-path field
(prefilled from detection), version or "not found", and an editable allowlist.
The key field is hidden for it, and no "add an API key" prompt appears when it's the
default provider.

**Acceptance criteria:**
- [x] Component tests: the Claude CLI row has path, version and allowlist fields and
      no key field. Saving sends the path and list.
- [x] No API-key prompt when the default provider is `claude-cli`.

**Verification:**
- [x] Frontend tests pass (`frontend/tests/components/dashboard/SettingsDialog.test.ts`)
- [ ] (deferred to Jobsworth) Manual: `make desktop-dev`, pick Claude CLI, restart, run hello-world

**Dependencies:** T10
**Files likely touched:** `frontend/src/components/dashboard/SettingsDialog.svelte`,
`frontend/src/lib/native/index.ts`, `frontend/tests/components/dashboard/SettingsDialog.test.ts`
**Estimated scope:** S

### T12: Docs and backlog

**Description:** Document the provider, env vars and flag, and mark the backlog item
done.

**Acceptance criteria:**
- [x] `docs/config-reference.md`: `SMASHER_CLAUDE_CLI`, `SMASHER_CLAUDE_CLI_ALLOWED_TOOLS`,
      `claude-cli` as a `SMASHER_PROVIDER` value
- [x] `docs/cli-reference.md`: `--claude-skip-permissions` and the permission change
- [x] `tasks/BACKLOG.md` updated, and the spec's status set to done

**Verification:**
- [x] Docs match the flags in code (grep)

**Dependencies:** T11
**Files likely touched:** `docs/config-reference.md`, `docs/cli-reference.md`,
`docs/handler-reference.md`, `tasks/BACKLOG.md`
**Estimated scope:** S

## Checkpoint D: success criteria 1-6
- [ ] Desktop app, no API keys, Claude CLI selected: hello-world and a codergen
      pipeline complete with live events (criterion 1)
- [ ] Criteria 2-5 re-checked on the final build
- [ ] `make ci` clean, all `#[ignore]` real-CLI tests run by hand and pass (criterion 6)
- [ ] Ready for review / merge
