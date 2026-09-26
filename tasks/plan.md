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
  can't expose the child's PID, so it can't kill the command on cancel. The
  runner copies `ShellCodergenBackend`'s process-group handling and reuses the
  agent's secret-variable filter.
- **Only the chain's last link changes.** `UnknownToolBackend` in
  `tool_handler.rs` replaces `LlmToolBackend`. Built-in backends keep their
  `fallback` parameter.
- **Cancellation.** The web app already makes a `CancellationToken` per run
  (`run_launch.rs:134`); it's passed to both tool registries (main and
  parallel-child). The CLI passes its token if `smasher run` has one; otherwise
  it passes a fresh token that is never cancelled, and Ctrl-C kills the process
  group through the terminal as today.
- **Order.** The engine core comes first, since the runner's process-group
  kill is the riskiest part. Then the two apps are wired up, each with its own
  end-to-end test. Frontend and docs come last.

## Task List

### Phase 1: Engine
- [ ] 1. `CommandRunner`: run, timeout, cancel, environment
- [ ] 2. `ToolHandler` node contract, context keys, output files, `UnknownToolBackend`
- [ ] 3. Lint rules E004, E005, W004
- [ ] 4. Conditions accept a `context.` prefix

### Checkpoint A
- [ ] `cargo test -p smasher-attractor`, clippy and fmt clean

### Phase 2: Wiring
- [ ] 5. Web: remove `LlmToolBackend`, wire the runner, integration test
- [ ] 6. CLI: remove `LlmToolBackend`, always register `ToolHandler`, e2e test

### Checkpoint B
- [ ] `make pre-commit` green; `smasher run --backend shell` on the fixture
      works with no API keys

### Phase 3: Editor and docs
- [ ] 7. Node editor `ToolForm`: built-in tool or shell command
- [ ] 8. Docs
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

## Open Questions

None.
