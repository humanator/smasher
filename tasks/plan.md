# Implementation Plan: Tool nodes run commands directly (#22)

Spec: [`SPEC-tool-command.md`](SPEC-tool-command.md), approved 2026-09-26.
Branch: `feat/tool-command`. Tasks and checkpoints are in [`todo.md`](todo.md).

## Overview

Tool nodes stop reaching an LLM. `tool=` runs a built-in tool; `tool_command=`
runs a shell command with a timeout and a filtered environment, and its output
goes into context for conditions to branch on. `LlmToolBackend` is removed from
the web app and the CLI. Lint rejects tool nodes that set neither attribute, or
both.

## Architecture Decisions

- **The engine owns the runner.** `CommandRunner` lives in `smasher-attractor`
  (`tool_command.rs`) so the web app and the CLI share it. `ToolHandler` takes
  it through a builder (`with_commands(CommandConfig { working_dir, run_dir,
  cancel })`). The `Handler` trait is not changed.
- **A new runner rather than `exec_command`.** `LocalExecutionEnvironment::exec_command`
  can't expose the child's PID, so it can't kill the command on cancel.
  - **Process group:** the runner uses `Command::process_group(0)` and the
    agent's `kill_process_group`, made a `pub` free function. That avoids adding
    libc to `smasher-attractor`.
  - **Secrets:** it reuses the agent's secret-variable filter, extracted from
    `LocalExecutionEnvironment::new` into a `pub` const and a `pub fn`.
- **The handler writes context itself.** The engine never applies
  `Outcome.context_updates`, so `ToolHandler` sets `tool.*` with `context.set`,
  as it already does for `_tool_<id>`. This also makes the keys available on
  failure.
- **One env-name helper.** `SMASHER_CTX_<KEY>` normalisation is a `pub fn` in
  `tool_command.rs`. The CLI's `ShellCodergenBackend` uses it too, so both see
  the same names.
- **Only the chain's last link changes.** `UnknownToolBackend` in
  `tool_handler.rs` replaces `LlmToolBackend`. Built-in backends keep their
  `fallback` parameter.
- **Cancellation.** The engine checks the token only between nodes, so the
  runner races the command against it.
  - **Web app:** it already makes a `CancellationToken` per run
    (`run_launch.rs:134`). That token is moved into `EngineConfig`, so it's
    cloned for both tool registries (main and parallel-child) first.
  - **CLI:** `smasher run` has no token today. It creates one and shares it
    between `EngineConfig` and `CommandConfig`, so the stall watchdog's cancel
    reaches running commands. Ctrl-C still kills the process group through the
    terminal.
- **The CLI registers `ToolHandler` everywhere.** It builds the tool chain once
  and registers it in three places: the main registry, the `ParallelHandler`
  child registry (empty today), and `smasher resume` (Codergen only today).
- **Order.** The engine core comes first, since the runner's process-group
  kill is the riskiest part. Then the two apps are wired up, each with its own
  end-to-end test. Frontend and docs come last.

## Task List

### Phase 1: Engine
- [x] 1. `CommandRunner`: run, timeout, cancel, environment
- [x] 2. `ToolHandler` node contract, context keys, output files, `UnknownToolBackend`
- [x] 3. Lint rules E004, E005, W004
- [x] 4. Conditions accept a `context.` prefix

### Checkpoint A
- [x] `cargo test -p smasher-attractor`, clippy and fmt clean

### Phase 2: Wiring
- [x] 5. Web: remove `LlmToolBackend`, wire the runner, integration test
- [x] 6. CLI: remove `LlmToolBackend`, always register `ToolHandler` (main,
      parallel child, resume), cancel token, shared env-name helper, e2e test

### Checkpoint B
- [x] `make pre-commit` green; `smasher run --backend shell` on the fixture
      works with no API keys

### Phase 3: Editor and docs
- [x] 7. Node editor `ToolForm`: built-in tool or shell command (legacy
      editor-ui: comments only)
- [x] 8. Docs
- [ ] 9. Backlog updates

### Checkpoint C: Complete
- [ ] All spec success criteria met, frontend suites green against a
      fake-claude server, and a review with Jobsworth before merging

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The process-group kill leaves grandchildren running, or behaves differently on Linux CI | High | Task 1 tests a forked grandchild on both timeout and cancel, and checks by PID that it's gone. CI runs on Linux. |
| Removing the label fallback breaks a pipeline that relied on it | Med | All example tool nodes set `tool` or `tool_command` (checked). Lint E004 names the problem. |
| Some upstream-ported example scripts fail once run for real | Med | Out of scope by the spec; a backlog item covers it. Lint on examples stays green. |
| A test deleted along with its behaviour hides a regression | Low | Each deletion is listed in its commit message. The remaining behaviour gets new tests. |
| Frontend suites fail because the desktop app holds port 21541 | Low | Follow the BACKLOG test gotcha: quit the app and serve from this branch with the fake `claude`. |
| Flat `tool.*` keys overwrite each other when tool nodes run in parallel branches (one shared `Context`) | Low | Documented in the spec and dot-reference. Per-node results stay in `_tool_<id>` and `nodes/<id>/`. |
| Normalising `SMASHER_CTX_` names changes what `--backend shell` codergen scripts see | Low | No example uses the raw names. The change is called out in Task 6's commit message. |
| A timeout written as `30s` is parsed as a `Duration` and silently ignored | Med | Task 2 accepts `Duration` alongside a number or numeric string, with a test for each. |

## Open Questions

None.
