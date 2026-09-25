# Spec: `claude-cli-provider` — Run Pipelines Through `claude -p`

Status: **Merged to `main`** (2026-09-25) with a known limitation. Checkpoint C's
candidate and critique steps passed in a desktop run, but the other manual
checkpoints were not run before merge (see
[`todo-claude-cli-provider.md`](todo-claude-cli-provider.md)). **Correction:** this
spec says `LlmManagerBackend` and `LlmToolBackend` are single-turn and tool-less.
They aren't. Both run agent sessions with tools, so under claude-cli, generic tool
nodes and manager nodes fail. See `BACKLOG.md`, the known limitation and #22.
Was: draft, pending review (2026-09-24). Depends on `smasher-desktop` (done)
and the `DEFAULT_MODEL` change on `fix/default-model`.

## Objective

Let the web and desktop apps run pipelines through the local Claude Code CLI
(`claude -p`) instead of a provider API key. Everything goes through the CLI:
codergen (box) nodes, `task_critic` and `synthesis`, and the other single-call LLM
backends. With it selected, the app runs with **no API key at all**, using
whatever account `claude` is logged into.

`smasher run` already has a codergen-only version (`--backend claude-cli`, the
default, `crates/smasher-cli/src/run.rs:197`). The web server and desktop app
don't: they always use the API-key agent.

## Decisions (confirmed by Jobsworth 2026-09-24)

1. **One setting, not per-run or per-node.** The desktop Settings dialog gets
   "Claude CLI" as a provider choice. It applies to every run.
2. **Restricted tools, not `--dangerously-skip-permissions`.** Codergen runs stay
   unattended, but only an allowlist of tools is permitted. Anything else is denied
   instead of prompting (`--permission-mode dontAsk --allowedTools ...`).
3. **Every LLM node, not just codergen.** `task_critic` and `synthesis` go through
   the CLI too.

## Spike results (2026-09-24, `claude` 2.1.281, real calls)

- **Images work without file tools.** A user message with a base64 `image` block,
  sent over `--input-format stream-json` with `--tools ""`, was read correctly.
  `task_critic` can send its screenshot exactly as it does today.
- **Structured output works.** `--json-schema '<schema>'` returns the parsed object
  in the final `result` event's `structured_output` field (the raw text is still in
  `result`).
- **The default context is expensive, and trimming it fixes that.** A one-word
  answer cost **$0.24** with default flags (59k tokens of Claude Code system prompt
  and tools written to cache). With `--system-prompt <ours> --tools ""
  --strict-mcp-config --setting-sources "" --no-session-persistence` the same call
  cost **$0.004** (933 cache tokens) and gave the same answer.
- **`--model sonnet` resolved to `claude-sonnet-5`.** Aliases and full IDs both
  work, so `DEFAULT_MODEL` can be passed straight through.
- **`--bare` is out.** It skips keychain reads, which can break login-based auth.

## Design

### 1. `claude-cli` provider in `smasher-llm` (single-call LLM work)

A new `Provider::ClaudeCli` (`"claude-cli"`) and a `ClaudeCliAdapter`
implementing `ProviderAdapter`. It handles **single-turn, tool-less** requests,
which covers `task_critic`, `synthesis`, `LlmManagerBackend` and `LlmToolBackend`.

- Spawns `claude -p --input-format stream-json --output-format stream-json
  --verbose --tools "" --permission-mode dontAsk --strict-mcp-config
  --setting-sources "" --no-session-persistence`.
- `request.system_prompt` → `--system-prompt`. With no system prompt, a short
  neutral one is sent anyway, so Claude Code's own ~59k-token prompt is never
  used.
- `request.model` → `--model`.
- `request.response_format` as a JSON schema → `--json-schema`. The response text
  is the serialised `structured_output`.
- Messages go in as one stream-json user message, keeping text and image parts.
  Multi-turn history is flattened into that one message, labelled by role.
- Usage comes from the final `result` event's `modelUsage`: input, output, and
  cache read/creation tokens.
- **Errors:**
  - Spawn failure, non-zero exit, or `is_error: true` becomes a
    `smasher_llm::Error`, with stderr included.
  - A request carrying `tools` is rejected with a clear error, not silently
    stripped, because this adapter isn't an agent loop.
  - A "not logged in" failure is reported as auth, so the UI can tell the user to
    run `claude login`.
- **Registration:** `Client::from_env()` registers it when `SMASHER_CLAUDE_CLI` is
  set (value `1` or a path to the binary), using the same env-var pattern as the
  other providers.

Shared process plumbing lives here too, so the codergen backend reuses it rather
than duplicating it:
- finding the binary;
- stripping the nested-session env vars (today in `run.rs`);
- the base command.

### 2. Codergen through `claude -p` (agentic work)

`ClaudeCliBackend` moves out of `smasher-cli/src/run.rs` into `smasher-attractor`,
next to the `CodergenBackend` trait, so `smasher-cli` and `smasher-web` share one
implementation. Its NDJSON streaming, event emitting and timeout handling are kept
as they are, and its existing fake-`claude` script tests move with it.

Changes when it moves:
- `--dangerously-skip-permissions` is replaced by `--permission-mode dontAsk
  --allowedTools <allowlist>`.
- The per-node `model` attribute is passed as `--model` instead of being ignored.
  With no node model, the setting's model is used.
- `--strict-mcp-config` and `--no-session-persistence` are added, so pipeline runs
  don't pick up your MCP servers or fill `~/.claude` with sessions.

Claude Code's default system prompt is **kept** for codergen, because that's the
agent doing the work. The ~59k-token cost is paid once per node and then cached.

**Default allowlist:** `Read Edit Write Glob Grep` and `Bash` limited to build and
inspection commands (exact patterns settled in the plan). It's editable in
Settings, stored as a list in `settings.json`, and passed through as
`SMASHER_CLAUDE_CLI_ALLOWED_TOOLS`.

### 3. Web server wiring

When the default provider (`SMASHER_PROVIDER`) is `claude-cli`:
- codergen nodes use the shared `ClaudeCliBackend` instead of
  `AgentCodergenBackend`;
- every single-call backend (`task_critic`, `synthesis`, manager, tool) already
  resolves `default_provider`, so it routes to `ClaudeCliAdapter` with no further
  change.

A node that names another provider explicitly (`provider="openai"`) still uses
that provider, provided its key is configured.

### 4. Desktop settings

- "Claude CLI" becomes a fifth entry in `settings.rs` `PROVIDERS`. It has no API
  key. Instead of a base URL it has a **binary path** field, auto-detected and
  editable.
- Choosing it as the default provider writes `SMASHER_PROVIDER=claude-cli` and
  `SMASHER_CLAUDE_CLI=<path>` at startup, like the other providers.
- **Finding the binary:** an app launched from Finder doesn't have `~/.local/bin`
  on its `PATH`. Resolve in this order:
  1. the path saved in settings;
  2. `SMASHER_CLAUDE_CLI` (when it holds a path);
  3. `~/.local/bin/claude`, `~/.claude/local/claude`, `/opt/homebrew/bin/claude`,
     `/usr/local/bin/claude`;
  4. `PATH`.
- The dialog shows the result of `claude --version`, or "not found".
- Startup without a key already works (`65056be`). With Claude CLI selected, no
  "add an API key" prompt is shown.

## Success criteria

1. With Claude CLI selected and **no API keys configured**,
   `examples/old-examples/hello-world.dot` and a codergen pipeline run to
   completion in the desktop app, with live events in the run view.
2. `examples/product_design_factory.dot` produces valid `critic-report.json` and a
   synthesis recommendation using only the CLI. `task_critic` sees the real
   screenshot.
3. A codergen prompt that tries a tool outside the allowlist (e.g. `curl`) is
   denied, and the run continues or fails cleanly. It never hangs.
4. A single-call adapter request costs about what the spike measured (under 2k
   cache-creation tokens), not 59k.
5. `smasher run --backend claude-cli` behaves as before, apart from the
   permission change (see Open questions).
6. `make ci` is clean. The new code has unit tests using a fake `claude` script
   (the existing pattern), plus one real-CLI integration test marked `#[ignore]`
   because it spends real money, run by hand at the checkpoint.

## Out of scope

- Choosing CLI vs API per run or per node.
- Streaming token-by-token text from the single-call adapter. It returns the final
  result, which is all `task_critic` and `synthesis` need.
- Budget caps (`--max-budget-usd`). Possible later setting.

## Open questions

1. **Should `smasher run` switch to the restricted allowlist too?** That's a
   behaviour change for existing CLI users. The alternative is to keep
   `--dangerously-skip-permissions` there behind a `--claude-skip-permissions`
   flag. Recommend: switch, and add the flag as the escape hatch.
2. **Does your global `~/.claude/CLAUDE.md` leak into codergen runs?**
   `--setting-sources ""` stops settings files loading, but CLAUDE.md discovery is
   separate (only `--bare` turns it off, and `--bare` breaks keychain auth).
   Pipeline agents obeying personal instructions (commit rules, "address me as
   Jobsworth") would be wrong. Check in the first plan task, and fall back to
   `--system-prompt`/`--append-system-prompt` framing if needed.
3. **Bash patterns in the default allowlist.** Design-kit candidates are static
   HTML/CSS/JS today, so a narrow list may be enough. Settle this against a real
   `product_design_factory.dot` run.
