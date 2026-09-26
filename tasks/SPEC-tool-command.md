# Spec: Tool nodes run commands directly (backlog #22)

Status: draft, 2026-09-26. Awaiting Jobsworth's approval.

## Objective

Tool nodes (`shape=parallelogram`) and LLM nodes do different jobs, and users
should be able to tell which is which from the graph. Today they can't:

- Nothing reads `tool_command`. A tool node without a `tool` attribute sends its
  label to `LlmToolBackend`, which starts an LLM agent session and asks it to
  "execute" the tool. On API providers the agent usually improvises by running
  the command. This is slow, costs tokens and can differ between runs.
- Under claude-cli these nodes fail outright. That's the tool-node half of #23's
  known limitation: 34 `tool_command` nodes across 9 examples, including
  `A11yCheck` in `product_design_factory.dot`.

**Decided by Jobsworth 2026-09-26:**

1. A tool node runs its built-in `tool`, or runs its `tool_command` as a shell
   command. It never calls an LLM itself, on any provider. (The built-ins
   `task_critic` and `synthesis` make one LLM call each by design. They are
   named explicitly, so the node's author chose that.)
2. There is no LLM fallback. `LlmToolBackend` is removed from both apps. A
   tool node with neither attribute is an error, and so is one with both.
3. A user who wants an LLM fallback builds it in the graph: an edge conditioned
   on `outcome=fail` leading to a codergen node.
4. **Manager nodes are out of scope.** Their docs say they're human approval
   gates, but the code runs one LLM call, and only `old-examples/` use them.
   A new backlog item decides what they're for before fixing their claude-cli
   routing.
5. **Output:** use flat, upstream-style context keys, and let conditions take a
   `context.` prefix.
6. **Timeout:** the node's `timeout` attribute in seconds, 600 by default.
7. **Environment:** inherit the server's environment, filtered of secrets, plus
   `SMASHER_*` variables.

Who it's for: pipeline authors, and Jobsworth running the design factory on
claude-cli.

## Assumptions (correct any of these)

1. Work continues on this branch, renamed `feat/tool-command`. It already holds
   the decision commit `bd0e8b0`.
2. **The built-in decorator chain stays.** It currently runs
   `TaskCriticSynthesis` → `SystemLint` → `HybridToolBackend(render_capture)`,
   ending at `LlmToolBackend`. Only its last link changes: `LlmToolBackend` is
   replaced by `UnknownToolBackend`, which returns
   `Failure("unknown tool 'x'; built-in tools are: …")`. That's the smallest
   change, and every built-in backend keeps its `fallback` constructor
   parameter and tests.
3. `tool_command` runs through a new `CommandRunner` in `smasher-attractor`
   (`tool_command.rs`), modelled on the CLI's `ShellCodergenBackend`:
   `sh -c`, its own process group, and stdout and stderr read concurrently.
   It is not built on `LocalExecutionEnvironment::exec_command`, because
   that doesn't expose the child's PID and so can't kill the command when the
   run is cancelled. The runner reuses the agent's secret-variable filter,
   made `pub` if needed.
4. The working directory is the run's working directory: the run root, or the
   worktree when `smasher run --worktree` is used. That's the directory
   codergen agents write to, so commands and agents see the same files.
5. `smasher run` always registers `ToolHandler`, even with no LLM client
   (`--backend shell`). The LLM built-ins (`task_critic`, `synthesis`) are only
   added to the chain when a client exists. Without one, naming them gives
   the unknown-tool failure.
6. Example commands are run as written. Many were ported from upstream
   Attractor and assume its `.ai/attractor-runs/...` layout or shell variables
   that smasher doesn't set. Making every example's scripts succeed is **out of
   scope**. The success criteria name the examples that must work.

## Design

### Node contract

| Attributes | Result |
|---|---|
| `tool="name"` (+ optional `args` JSON) | Dispatch to the built-in chain. Unchanged apart from the terminal link. |
| `tool_command="…"` (+ optional `timeout`) | Run with `sh -c` in the working directory. |
| neither | Lint **E004**; at run time `Failure("tool node '<id>' needs a tool or tool_command attribute")` |
| both | Lint **E005**; at run time the same kind of failure, naming both |

The label is no longer used as a tool name. `args` combined with
`tool_command` gets lint warning **W004** ("args is ignored for tool_command").

### Running a command

- **Timeout:** the node's `timeout` attribute in seconds (a number or a numeric
  string), 600 if absent. On timeout, SIGKILL the process group and return
  `Failure("timed out after Ns")`.
- **Cancellation:** `ToolHandler` takes the run's `CancellationToken`. On
  cancel, kill the process group and return `Failure("cancelled")`.
- **Environment:** the inherited environment minus secret-looking variables,
  plus:
  - `SMASHER_RUN_DIR`: the run root;
  - `SMASHER_NODE_ID`: the node's id;
  - `SMASHER_CTX_<KEY>` for each context value whose key doesn't start with
    `_`. The key is upper-cased, with every character outside `[A-Z0-9_]`
    replaced by `_`.
- **stdin:** null.

### Results

- **Exit code 0:** `Outcome::success_with({stdout, stderr, exit_code})`.
- **Non-zero exit:** `Outcome::failure("exit code N: <last 2,000 chars of stderr>")`,
  not retryable.
- **Spawn error:** a failure outcome with the OS error.

Both success and failure write these context keys, so a fallback branch can
read them:
- `tool.output`: stdout with trailing whitespace trimmed;
- `tool.stderr`;
- `tool.exit_code`, as a string.

Each value in context is capped at 100,000 chars with `truncate_output`, which
keeps the head and tail. The full streams are written to
`nodes/<id>/stdout.txt` and `stderr.txt` in the run directory. `_tool_<id>`
keeps its current shape.

### Conditions

When a key isn't found as written, the evaluator strips a leading `context.`
and looks again. So `context.tool.output=clean` and `tool.output=clean` are
equivalent, as upstream. `vulnerability_analyzer.dot`'s
`context.tool_stdout=…` edges become `context.tool.output=…`.

### Sketch (style reference)

```rust
// In ToolHandler::execute
match (tool_attr(node), tool_command_attr(node)) {
    (Some(name), None) => self.run_builtin(node, &name, context).await,
    (None, Some(command)) => {
        let timeout = node_timeout(node).unwrap_or(DEFAULT_TOOL_TIMEOUT);
        let result = self.commands.run(&command, node, context, timeout).await;
        record_command_result(node, &result, context);
        Ok(result.into_outcome())
    }
    (None, None) => Ok(Outcome::failure(format!(
        "tool node '{}' needs a tool or tool_command attribute",
        node.id
    ))),
    (Some(_), Some(_)) => Ok(Outcome::failure(format!(
        "tool node '{}' sets both tool and tool_command; use one",
        node.id
    ))),
}
```

### Frontend

`ToolForm.svelte` offers two modes:
- **Built-in tool:** a select listing `render_capture`, `system_lint`,
  `task_critic` and `synthesis`, plus the `args` field.
- **Shell command:** a monospace textarea for `tool_command`, plus `timeout`.

Switching mode clears the other mode's attribute. The "Custom…" tool name goes,
and the stale comment pointing at `routes/pages.rs` is corrected.

## Tech Stack

Rust 2024 workspace, tokio, `nix`/`libc` process groups as in
`ShellCodergenBackend`, `tokio_util::CancellationToken`. Svelte 5 + Vitest for
the form. No new dependencies.

## Commands

```bash
cargo test -p smasher-attractor tool_       # handler, runner, lint rules
cargo test -p smasher-attractor condition   # context. prefix
cargo test -p smasher-web --test tool_command_test
cargo test -p smasher-cli --test tool_command_e2e
cargo test --workspace
cargo clippy --workspace -- -D warnings
cargo fmt --all -- --check
cd frontend && npm run check && npm run lint && npx vitest run src/components/node-editor
cargo run -p smasher-cli -- run crates/smasher-cli/tests/fixtures/tool_command.dot --backend shell
```

The frontend's real-API suites need a fake-claude `smasher serve`, as described
in the BACKLOG test gotcha.

## Project Structure (files this batch touches)

```
crates/smasher-attractor/src/tool_handler.rs     node contract, context keys, UnknownToolBackend
crates/smasher-attractor/src/tool_command.rs     new: CommandRunner
crates/smasher-attractor/src/lint.rs             E004, E005, W004
crates/smasher-attractor/src/condition/mod.rs    context. prefix
crates/smasher-agent/src/environment/mod.rs      make the secret filter pub (if needed)
crates/smasher-web/src/backend.rs                remove LlmToolBackend + tests
crates/smasher-web/src/run_launch.rs             terminal link, cancel token, both registries
crates/smasher-web/tests/tool_command_test.rs    new
crates/smasher-cli/src/llm_backends.rs           remove LlmToolBackend + tests
crates/smasher-cli/src/run.rs                    always register ToolHandler
crates/smasher-cli/tests/tool_command_e2e.rs     new, with a fixture DOT
frontend/src/components/node-editor/nodeForms/ToolForm.svelte (+ test)
examples/vulnerability_analyzer.dot              condition key
examples/old-examples/parallel-fanout.dot        fan_out → shape=component
docs/dot-reference.md, handler-reference.md, config-reference.md, parity-matrix.md
tasks/BACKLOG.md
```

## Code Style

- Match `tool_handler.rs`: `ABOUTME:` headers, doc comments on public items,
  `Outcome::failure` for expected failures, and `HandlerError` only for bugs.
- Error messages name the node id and say what to do.
- Tests live in the same file (`#[cfg(test)] mod tests`), with integration tests
  in `tests/`.
- TDD: write each test first and watch it fail.

## Testing Strategy

Every test runs real shell commands. No LLM is called and nothing is mocked.

- **Unit tests (`tool_command.rs`, `tool_handler.rs`):**
  - success and failure outcomes, including the stderr tail in the message;
  - the three context keys, set on both success and failure;
  - trailing-whitespace trim and truncation;
  - timeout: a `sleep` that forks a grandchild, and both processes are gone
    afterwards (the process group is killed);
  - cancellation, the same way;
  - the working directory;
  - the environment: a planted `FOO_API_KEY` is absent, and `SMASHER_RUN_DIR`,
    `SMASHER_NODE_ID` and `SMASHER_CTX_*` are present with the key
    normalisation;
  - the neither and both failures;
  - the label is no longer used as a tool name;
  - an unknown `tool` name reaches `UnknownToolBackend`'s message.
- **Lint:** E004, E005 and W004, each firing and not firing.
  `all_examples_pass_lint` stays green.
- **Condition:** the `context.` prefix resolves, and a literal key still wins.
- **Web integration** (`tool_command_test.rs`): boot with only a fake `claude`
  that fails if called. Run `Start → Check(tool_command) → Exit`, where Check
  prints a value, and branch on `tool.output`. Assert the run completes on the
  expected branch, `nodes/Check/stdout.txt` exists, and the fake was never
  called. A second graph uses a failing command with an `outcome=fail` edge to
  a fallback node, and asserts that route was taken. A third graph runs
  `product_design_factory.dot`'s `A11yCheck` node, read verbatim from the
  example (success criterion 6).
- **CLI e2e** (`tool_command_e2e.rs`): `smasher run --backend shell` on the same
  fixture. This also proves `ToolHandler` is registered without a client.
- **Frontend (Vitest):** ToolForm mode switching writes and clears the right
  attributes. No run is started.
- The pre-existing tests for the label fallback and for `LlmToolBackend` are
  deleted along with the behaviour they cover. Each deletion is listed in the
  commit message.

## Boundaries

- **Always:** TDD; `make pre-commit` before each commit; keep the frontend
  suites free of LLM calls; update docs in the same batch.
- **Ask first:**
  - changing any behaviour of the built-in tools;
  - adding a dependency;
  - changing the `Handler` trait (cancellation goes through the `ToolHandler`
    constructor instead);
  - spending tokens, including the critical-path tests and a real claude-cli
    design-factory run.
- **Never:**
  - leave an LLM path reachable from a tool node without an explicit `tool=`;
  - run tool commands in the repo checkout instead of the run directory;
  - silence lint on examples to get to green.

## Success Criteria

1. No tool node reaches an LLM unless it names `task_critic` or `synthesis`.
   `LlmToolBackend` no longer exists (`grep` finds nothing).
2. A `tool_command` node runs its command. Exit code 0 means success and
   anything else is a failure. `tool.output`, `tool.stderr` and
   `tool.exit_code` are set, and a condition can branch on them with or without
   `context.`.
3. The node's `timeout` is honoured (600s by default). A timeout or a
   cancellation leaves no surviving processes.
4. Secret-looking variables are not passed to commands. The `SMASHER_*`
   variables are.
5. `smasher lint` reports E004 and E005, and the web API rejects those graphs.
6. With the fake `claude` and `SMASHER_PROVIDER=claude-cli`, the `A11yCheck`
   node, read verbatim from `product_design_factory.dot` by the web integration
   test and run as `Start → A11yCheck → Exit`, completes without calling the
   fake. The rest of the factory spends tokens, so it isn't run.
7. `smasher run --backend shell` runs a `tool_command` pipeline with no API keys
   set.
8. The node editor offers built-in tool or shell command, with no "Custom…"
   option.
9. The docs describe the new contract. The tool-node half of the
   config-reference known limitation is removed, and the handler-reference
   shape table matches `node_type_from_shape`.
10. `cargo test --workspace`, clippy, fmt, `npm run check`, lint and Vitest
    pass with zero warnings.

## Backlog updates when done

- **#22:** mark done and move it to the archive.
- **#23:** the known limitation now covers manager nodes only.
- **New:** decide what manager (`house`) nodes are for. The docs say human
  gate; the code runs one LLM call; only `old-examples/` use them. Then fix
  their claude-cli routing to match.
- **New:** the documented `_tool_fetch.status` condition can't match, because
  conditions don't read nested context values.
- **New:** `smasher-conformance/src/convert.rs` maps Tool→`component` and
  Parallel→`parallelogram`, the wrong way round.
- **New:** get the upstream-ported examples' scripts (semport, megaplan,
  sprint_exec, vulnerability_analyzer) working against smasher's run layout.

## Open Questions

None blocking. Assumption 2 (keep the decorator chain rather than build a
built-in tool registry) is the one most worth a second look.
