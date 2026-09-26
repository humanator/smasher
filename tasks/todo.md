# Todo: Tool nodes run commands directly (#22)

Spec: [`SPEC-tool-command.md`](SPEC-tool-command.md). Plan: [`plan.md`](plan.md).
Every task is TDD: write the test first, watch it fail, then implement. No task
spends tokens.

## Phase 1: Engine

## Task 1: `CommandRunner`

**Description:** A new `smasher-attractor/src/tool_command.rs` that runs a
command with `sh -c` in a given working directory, in its own process group,
with stdin null and stdout and stderr read concurrently. It returns
`{stdout, stderr, exit_code}` or a timeout, cancellation or spawn error.

The environment is the inherited one minus secret-looking variables (reusing
the agent's filter), plus `SMASHER_RUN_DIR`, `SMASHER_NODE_ID` and
`SMASHER_CTX_<KEY>` for context values whose key doesn't start with `_`. Keys
are upper-cased, and characters outside `[A-Z0-9_]` become `_`.

**Acceptance criteria:**
- [ ] The exit code and both streams are captured.
- [ ] On timeout or cancellation, the whole process group is SIGKILLed: a forked
      grandchild is gone afterwards.
- [ ] A planted `FOO_API_KEY` isn't visible to the command. The `SMASHER_*`
      variables are, with keys normalised.

**Verification:**
- [ ] `cargo test -p smasher-attractor tool_command`
- [ ] `cargo clippy -p smasher-attractor -- -D warnings`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/tool_command.rs` (new)
- `crates/smasher-attractor/src/lib.rs`
- `crates/smasher-agent/src/environment/mod.rs` (make the filter `pub` if needed)

**Estimated scope:** Small–Medium

## Task 2: `ToolHandler` node contract

**Description:** `ToolHandler::execute` dispatches on `tool` and
`tool_command`:
- neither or both: a failure outcome naming the node;
- `tool`: the built-in chain, as today;
- `tool_command`: `CommandRunner`, using the node's `timeout` attribute (a
  number or numeric string, in seconds), 600 by default.

The label is no longer used as a tool name. Add `with_commands(CommandConfig)`.

A command's result maps to outcomes as follows:
- exit 0 → `success_with({stdout, stderr, exit_code})`;
- non-zero → `failure("exit code N: <stderr tail 2000>")`;
- timeout → `failure("timed out after Ns")`;
- cancel → `failure("cancelled")`.

Whatever the outcome, set `tool.output` (trailing whitespace trimmed),
`tool.stderr` and `tool.exit_code`, each capped with `truncate_output` at
100,000 chars. Write the full streams to `nodes/<id>/stdout.txt` and
`stderr.txt`. Add `UnknownToolBackend`, which returns
`failure("unknown tool 'x'; built-in tools are: …")`.

**Acceptance criteria:**
- [ ] Each of the four attribute combinations gives the specified outcome.
- [ ] The context keys and output files are right on success and on failure.
- [ ] The label fallback tests are deleted, and new tests show the label is
      never used as a tool name.

**Verification:**
- [ ] `cargo test -p smasher-attractor tool_handler`

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-attractor/src/tool_handler.rs`
- `crates/smasher-attractor/src/tool_command.rs`

**Estimated scope:** Medium

## Task 3: Lint rules E004, E005, W004

**Description:** Add three rules for tool nodes:
- **E004:** sets neither `tool` nor `tool_command`.
- **E005:** sets both.
- **W004:** sets `args` together with `tool_command`.

Register them in `with_builtins()`, update the rule table in the doc comment,
and give `old-examples/parallel-fanout.dot`'s `fan_out` `shape=component`.

**Acceptance criteria:**
- [ ] Each rule fires on a bad node and stays silent on a good one.
- [ ] `all_examples_pass_lint` stays green.
- [ ] The web API rejects a graph with E004 (existing lint gate, `routes/api.rs:226`).

**Verification:**
- [ ] `cargo test -p smasher-attractor lint`
- [ ] `cargo test -p smasher-attractor --test example_lint`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/lint.rs`
- `examples/old-examples/parallel-fanout.dot`

**Estimated scope:** Small

## Task 4: Conditions accept a `context.` prefix

**Description:** When a condition key isn't found as written, strip a leading
`context.` and look again. Change `vulnerability_analyzer.dot`'s
`context.tool_stdout` edges to `context.tool.output`.

**Acceptance criteria:**
- [ ] `context.tool.output=x` matches when `tool.output` is `x`.
- [ ] A literal key `context.foo` still wins over `foo`.
- [ ] A missing key is still false.

**Verification:**
- [ ] `cargo test -p smasher-attractor condition`
- [ ] `cargo test -p smasher-attractor --test example_dot_parse`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/condition/mod.rs`
- `examples/vulnerability_analyzer.dot`

**Estimated scope:** Small

## Checkpoint A: after tasks 1–4
- [ ] `cargo test -p smasher-attractor` passes
- [ ] `cargo clippy --workspace -- -D warnings` and `cargo fmt --all -- --check` are clean
- [ ] Commit each task separately

## Phase 2: Wiring

## Task 5: Web app

**Description:** In `run_launch.rs`:
- End the tool chain with `UnknownToolBackend`.
- Give `ToolHandler` a `CommandConfig`: the working dir, the run root and the
  run's cancellation token.

Do this for both the main registry and the parallel-child registry. Delete
`LlmToolBackend` and its tests from `backend.rs`.

Add `crates/smasher-web/tests/tool_command_test.rs`. It boots the server with
only a fake `claude` that records calls and fails, and
`SMASHER_PROVIDER=claude-cli`. It runs three graphs:
1. branching on `tool.output`;
2. a failing command routed through an `outcome=fail` edge;
3. `product_design_factory.dot`'s `A11yCheck` node, read verbatim from the
   example.

**Acceptance criteria:**
- [ ] All three runs complete on the expected route, with
      `nodes/<id>/stdout.txt` written.
- [ ] The fake `claude` was never called.
- [ ] `grep -rn LlmToolBackend crates/smasher-web` finds nothing.

**Verification:**
- [ ] `cargo test -p smasher-web`

**Dependencies:** Tasks 2, 4

**Files likely touched:**
- `crates/smasher-web/src/run_launch.rs`
- `crates/smasher-web/src/backend.rs`
- `crates/smasher-web/tests/tool_command_test.rs` (new)

**Estimated scope:** Medium

## Task 6: CLI

**Description:** Register `ToolHandler` whether or not an LLM client exists.
The chain gets `task_critic`/`synthesis` only when a client exists, keeps
`system_lint` and `render_capture` always, and ends with
`UnknownToolBackend`. Pass a `CommandConfig`. Delete `LlmToolBackend` and its
tests from `llm_backends.rs`.

Add `tests/fixtures/tool_command.dot` and `tests/tool_command_e2e.rs`, which
runs `smasher run --backend shell` with no API keys set.

**Acceptance criteria:**
- [ ] The fixture completes on the expected branch with no API keys set.
- [ ] Existing CLI fixtures (`critique_loop`, `render_capture`, `system_lint`)
      still pass.
- [ ] `grep -rn LlmToolBackend crates/` finds nothing.

**Verification:**
- [ ] `cargo test -p smasher-cli`
- [ ] `cargo run -p smasher-cli -- run crates/smasher-cli/tests/fixtures/tool_command.dot --backend shell`

**Dependencies:** Tasks 2, 4

**Files likely touched:**
- `crates/smasher-cli/src/run.rs`
- `crates/smasher-cli/src/llm_backends.rs`
- `crates/smasher-cli/tests/tool_command_e2e.rs` (new)
- `crates/smasher-cli/tests/fixtures/tool_command.dot` (new)

**Estimated scope:** Medium

## Checkpoint B: after tasks 5–6
- [ ] `make pre-commit` is green (fmt-check, clippy, `cargo test --workspace`)
- [ ] Manual: the CLI fixture run above shows the branch taken and the output files

## Phase 3: Editor and docs

## Task 7: Node editor `ToolForm`

**Description:** Two modes:
- **Built-in tool:** a select of `render_capture`, `system_lint`,
  `task_critic` and `synthesis`, plus `args`.
- **Shell command:** a monospace `tool_command` textarea, plus `timeout`.

Switching mode clears the other mode's attributes. Remove "Custom…" and fix
the stale `routes/pages.rs` comment.

**Acceptance criteria:**
- [ ] A node with `tool_command` opens in shell mode, and one with `tool` opens
      in built-in mode.
- [ ] Switching modes writes and clears the right attributes.
- [ ] The "Custom…" option no longer exists.

**Verification:**
- [ ] `cd frontend && npm run check && npm run lint`
- [ ] `npx vitest run src/components/node-editor`

**Dependencies:** None (can run alongside Phase 2)

**Files likely touched:**
- `frontend/src/components/node-editor/nodeForms/ToolForm.svelte`
- its test file

**Estimated scope:** Small

## Task 8: Docs

**Description:** Document the new contract:
- **`dot-reference.md`:** the tool attributes (`tool`, `tool_command`,
  `timeout`, `args`), outcome/`tool.*` conditions and the `context.` prefix.
- **`handler-reference.md`:** the ToolHandler section; fix the shape table to
  match `node_type_from_shape`.
- **`config-reference.md`:** remove the tool-node half of the known limitation,
  keeping the manager half.
- **`parity-matrix.md`:** update the ToolHandler row.
- **`README.md`, `quickstart.md`:** fix the `hexagon` = Tool claims.

**Acceptance criteria:**
- [ ] No doc says a tool node falls back to its label or to an LLM.
- [ ] Every shape table agrees with `graph/mod.rs`.

**Verification:**
- [ ] `grep -rn "falls back to\|hexagon" docs README.md` reviewed by hand
- [ ] `cargo test --doc -p smasher-attractor`

**Dependencies:** Tasks 2–4

**Files likely touched:**
- `docs/dot-reference.md`
- `docs/handler-reference.md`
- `docs/config-reference.md`
- `docs/parity-matrix.md`
- `README.md`
- `docs/quickstart.md`

**Estimated scope:** Medium (docs only)

## Task 9: Backlog

**Description:** Update the backlog:
- **#22:** mark done.
- **#23:** narrow the known limitation to manager nodes.
- **New items:**
  - manager nodes' purpose;
  - the `_tool_x.status` nested-condition doc bug;
  - `smasher-conformance/src/convert.rs`'s Tool/Parallel shape swap;
  - making the upstream-ported example scripts work.

Move the spec, plan and todo to `tasks/archive/` as `*-tool-command.md` after
merge.

**Acceptance criteria:**
- [ ] BACKLOG matches the spec's "Backlog updates when done" section.

**Verification:**
- [ ] Read-through

**Dependencies:** Tasks 5–8

**Files likely touched:**
- `tasks/BACKLOG.md`

**Estimated scope:** XS

## Checkpoint C: Complete
- [ ] Spec success criteria 1–10 are each checked off with evidence
- [ ] Frontend suites pass against a fake-claude `smasher serve` from this
      branch (BACKLOG test gotcha), and `FAKE_CLAUDE_LOG` is empty
- [ ] Review with Jobsworth before merging to `main`
