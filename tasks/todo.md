# Todo: Tool nodes run commands directly (#22)

Spec: [`SPEC-tool-command.md`](SPEC-tool-command.md). Plan: [`plan.md`](plan.md).
Every task is TDD: write the test first, watch it fail, then implement. No task
spends tokens.

## Phase 1: Engine

## Task 1: `CommandRunner`

**Description:** A new `smasher-attractor/src/tool_command.rs` that runs a
command with `sh -c` in a given working directory. The command runs in its own
process group (`Command::process_group(0)`), with stdin null and stdout and
stderr read concurrently. It returns `{stdout, stderr, exit_code}` or a
timeout, cancellation or spawn error. It races the command against the
`CancellationToken` itself, because the engine only checks the token between
nodes.

In `smasher-agent/src/environment/mod.rs`:
- Extract the inline secret list (`API_KEY`, `TOKEN`, …) and
  `should_filter_env` into a `pub` const and a `pub fn`.
- Make `kill_process_group` a `pub` free function.
- Leave `LocalExecutionEnvironment` using both, with behaviour unchanged.

No libc in `smasher-attractor`.

The environment is the inherited one minus secret-looking variables, plus
`SMASHER_RUN_DIR`, `SMASHER_NODE_ID` and `SMASHER_CTX_<KEY>` for context values
whose key doesn't start with `_`. A `pub fn ctx_env_name(key)` builds the
`SMASHER_CTX_` names: keys are upper-cased, and characters outside `[A-Z0-9_]`
become `_`.

**Acceptance criteria:**
- [x] The exit code and both streams are captured.
- [x] On timeout or cancellation, the whole process group is SIGKILLed: a forked
      grandchild is gone afterwards.
- [x] A planted `FOO_API_KEY` isn't visible to the command. The `SMASHER_*`
      variables are, with keys normalised.
- [x] `smasher-agent`'s environment tests still pass.

**Verification:**
- [x] `cargo test -p smasher-attractor tool_command`
- [x] `cargo test -p smasher-agent environment`
- [x] `cargo clippy -p smasher-attractor -p smasher-agent -- -D warnings`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/tool_command.rs` (new)
- `crates/smasher-attractor/src/lib.rs`
- `crates/smasher-agent/src/environment/mod.rs` (extract the filter and
  `kill_process_group`)

**Estimated scope:** Small–Medium

## Task 2: `ToolHandler` node contract

**Description:** `ToolHandler::execute` dispatches on `tool` and
`tool_command`:
- neither or both: a failure outcome naming the node;
- `tool`: the built-in chain, as today;
- `tool_command`: `CommandRunner`, using the node's `timeout` attribute, 600
  seconds by default. The attribute can be a number, a numeric string, or a
  `NodeAttrValue::Duration` (the parser turns `30s` into one).

`args` is still parsed as JSON before dispatch. The frontend's
`RUN_FAIL_CHECK` fixture expects "invalid JSON in args attribute".

The label is no longer used as a tool name. Add
`with_commands(CommandConfig { working_dir, run_dir, cancel })`: `execute`
only gets the node and the context, so this is how the handler learns them.

A command's result maps to outcomes as follows:
- exit 0 → `success_with({stdout, stderr, exit_code})`;
- non-zero → `failure("exit code N: <stderr tail 2000>")`;
- timeout → `failure("timed out after Ns")`;
- cancel → `failure("cancelled")`.

The stderr tail is the last 2,000 bytes, cut on a char boundary.

Whatever the outcome, `context.set` the keys `tool.output` (trailing
whitespace trimmed), `tool.stderr` and `tool.exit_code`. Don't return them as
`Outcome` context updates: the engine never applies those. Cap each value at
100,000 bytes with `smasher_agent::tools::truncation::truncate_output`, which
measures bytes and adds a marker.

Write the full streams to `nodes/<id>/stdout.txt` and `stderr.txt` under the
run dir, creating the directory. Add `UnknownToolBackend`, which returns
`failure("unknown tool 'x'; built-in tools are: …")`.

**Acceptance criteria:**
- [ ] Each of the four attribute combinations gives the specified outcome.
- [ ] The context keys and output files are right on success and on failure.
- [ ] `timeout` works as a number, a numeric string and a `Duration`.
- [ ] Invalid `args` JSON still fails with the existing message.
- [ ] These tests are deleted: `tool_handler_falls_back_to_label` and
      `tool_attribute_takes_precedence_over_label`.
- [ ] `tool_handler_no_tool_returns_failure` is rewritten for the new message.
- [ ] New tests show the label is never used as a tool name.
- [ ] The doc comment saying "Falls back to node label" is gone.

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

Register them in `with_builtins()` and update the rule table in the doc
comment. Two example fixes:
- `old-examples/parallel-fanout.dot`: give `fan_out` `shape=component` and
  reword its header comments, which say parallelogram means parallel.
- `old-examples/hello-world.dot:11-12`: fix the shape comments.

`all_examples_pass_lint` only reads top-level `examples/*.dot`, so lint the
`old-examples/` files by hand.

**Acceptance criteria:**
- [ ] Each rule fires on a bad node and stays silent on a good one.
- [ ] `all_examples_pass_lint` stays green.
- [ ] `smasher lint` is clean on `old-examples/parallel-fanout.dot`.
- [ ] The web API rejects a graph with E004 (existing lint gate, `routes/api.rs:226`).

**Verification:**
- [ ] `cargo test -p smasher-attractor lint`
- [ ] `cargo test -p smasher-attractor --test example_lint`
- [ ] `cargo run -p smasher-cli -- lint examples/old-examples/parallel-fanout.dot`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/lint.rs`
- `examples/old-examples/parallel-fanout.dot`
- `examples/old-examples/hello-world.dot`

**Estimated scope:** Small

## Task 4: Conditions accept a `context.` prefix

**Description:** When a condition key isn't found as written, strip a leading
`context.` and look again. Do this in both `evaluate_condition` and
`evaluate_condition_strict`. Change the `context.tool_stdout` edges to
`context.tool.output` in `vulnerability_analyzer.dot` and its `old-examples/`
copy.

**Acceptance criteria:**
- [ ] `context.tool.output=x` matches when `tool.output` is `x`, in both
      evaluators.
- [ ] A literal key `context.foo` still wins over `foo`.
- [ ] A missing key is still false. For example,
      `context.internal.loop_restart_count=0`, as used by
      `consensus_task*.dot`, behaves as before.

**Verification:**
- [ ] `cargo test -p smasher-attractor condition`
- [ ] `cargo test -p smasher-attractor --test example_dot_parse`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/condition/mod.rs`
- `examples/vulnerability_analyzer.dot`
- `examples/old-examples/vulnerability_analyzer.dot`

**Estimated scope:** Small

## Checkpoint A: after tasks 1–4
- [ ] `cargo test -p smasher-attractor` passes
- [ ] `cargo clippy --workspace -- -D warnings` and `cargo fmt --all -- --check` are clean
- [ ] Commit each task separately

## Phase 2: Wiring

## Task 5: Web app

**Description:** In `run_launch.rs`:
- End the tool chain with `UnknownToolBackend`.
- Give `ToolHandler` a `CommandConfig`: the working dir, the run root (the
  same directory in the web app) and the run's cancellation token. The token
  is moved into `EngineConfig` at :303, so clone it first.

Do this for both the main registry and the parallel-child registry. Delete
`LlmToolBackend` and its tests from `backend.rs`, including the ABOUTME
mention. Fix the ABOUTME in `smasher-render-capture/src/backend.rs`, which also
names it.

Add `crates/smasher-web/tests/tool_command_test.rs`, following
`tests/claude_cli_test.rs`:
- Copy its `fake_claude` and `collect_sse` helpers. There's no shared test
  module.
- Make the fake `claude` log its call and exit 1.
- Boot the server with `ServerConfig { provider: Some("claude-cli"), .. }` and
  `SMASHER_CLAUDE_CLI` pointing at the fake.
- The test sets env vars, so run the three graphs inside one `#[tokio::test]`:
1. branching on `tool.output`;
2. a failing command routed through an `outcome=fail` edge;
3. `product_design_factory.dot`'s `A11yCheck` node, read verbatim from the
   example.

**Acceptance criteria:**
- [ ] All three runs complete on the expected route, with
      `nodes/<id>/stdout.txt` written.
- [ ] The fake `claude` was never called: its log doesn't exist.
- [ ] `grep -rn LlmToolBackend crates/smasher-web/src crates/smasher-render-capture`
      finds nothing.

**Verification:**
- [ ] `cargo test -p smasher-web`

**Dependencies:** Tasks 2, 4

**Files likely touched:**
- `crates/smasher-web/src/run_launch.rs`
- `crates/smasher-web/src/backend.rs`
- `crates/smasher-render-capture/src/backend.rs` (ABOUTME)
- `crates/smasher-web/tests/tool_command_test.rs` (new)

**Estimated scope:** Medium

## Task 6: CLI

**Description:** Build the tool chain once, whether or not an LLM client
exists (today it's only built inside `if let Some(ref client)`, `run.rs:754`).
The chain:
- gets `task_critic` and `synthesis` only when a client exists;
- always keeps `system_lint` and `render_capture`;
- ends with `UnknownToolBackend`.

Register `ToolHandler` in the main registry, the `ParallelHandler` child
registry (empty today, `run.rs:794`), and `resume.rs` (Codergen only today,
:257).

`smasher run` has no `CancellationToken` today. Create one and share it
between `EngineConfig` and the `CommandConfig`.

Switch `ShellCodergenBackend`'s `SMASHER_CTX_` names to Task 1's
`ctx_env_name`. This is a behaviour change for `--backend shell`; list it in
the commit message.

Delete `LlmToolBackend` and its tests from `llm_backends.rs`.

Add these, following `system_lint_e2e.rs` (`CARGO_BIN_EXE_smasher`,
`parse_run_directory`, `--skip-preflight --no-tui`):
- `tests/fixtures/tool_command.dot`;
- a fixture with a tool node inside a `Parallel` branch;
- `tests/tool_command_e2e.rs`, which runs both fixtures with
  `smasher run --backend shell` and no API keys set, then resumes a run whose
  next node is a tool node.

**Acceptance criteria:**
- [ ] The fixture completes on the expected branch with no API keys set.
- [ ] The parallel fixture's tool node runs, and `nodes/<id>/stdout.txt` exists.
- [ ] `smasher resume` runs a pending tool node.
- [ ] `ShellCodergenBackend` and tool commands see the same `SMASHER_CTX_` name
      for a key such as `design.brief`.
- [ ] Existing CLI fixtures `render_capture` and `system_lint` still pass.
      (`critique_loop_e2e` is `#[ignore]` because it spends tokens, so it isn't
      run.)
- [ ] `grep -rn LlmToolBackend crates/*/src` finds nothing.

**Verification:**
- [ ] `cargo test -p smasher-cli`
- [ ] `cargo run -p smasher-cli -- run crates/smasher-cli/tests/fixtures/tool_command.dot --backend shell`

**Dependencies:** Tasks 1, 2, 4

**Files likely touched:**
- `crates/smasher-cli/src/run.rs`
- `crates/smasher-cli/src/resume.rs`
- `crates/smasher-cli/src/llm_backends.rs`
- `crates/smasher-cli/tests/tool_command_e2e.rs` (new)
- `crates/smasher-cli/tests/fixtures/tool_command.dot` (new)
- `crates/smasher-cli/tests/fixtures/tool_command_parallel.dot` (new)

**Estimated scope:** Medium

## Checkpoint B: after tasks 5–6
- [ ] `make pre-commit` is green (fmt-check, clippy, `cargo test --workspace`)
- [ ] Manual: the CLI fixture run above shows the branch taken and the output files
- [ ] `grep -rn LlmToolBackend crates/*/src` finds nothing

## Phase 3: Editor and docs

## Task 7: Node editor `ToolForm`

**Description:** Two modes:
- **Built-in tool:** a select of `render_capture`, `system_lint`,
  `task_critic` and `synthesis`, plus `args`.
- **Shell command:** a monospace `tool_command` textarea, plus `timeout`.

Switching mode clears the other mode's attributes. Remove "Custom…". Fix
the stale comments:
- the label-fallback comment at :12-19;
- the `routes/pages.rs` chain comment at :21-31 (the chain is built in
  `run_launch.rs`).

Update the Tool description in `nodeConfig.ts` to mention shell commands.

A Tool node newly added on the canvas has `attrs: {}` and gets lint E004 until
a mode is picked. That's expected; don't change the default.

In the legacy `crates/smasher-web/editor-ui/src/nodeForms/ToolForm.svelte`, fix
the stale comments only. Don't rebuild its checked-in `dist/`.

**Acceptance criteria:**
- [ ] A node with `tool_command` opens in shell mode, and one with `tool` opens
      in built-in mode.
- [ ] Switching modes writes and clears the right attributes.
- [ ] The "Custom…" option no longer exists, and the Custom tests at :26 and :48
      are rewritten.
- [ ] `grep -rn "LlmToolBackend\|pages.rs" frontend/src crates/smasher-web/editor-ui/src`
      finds nothing.

**Verification:**
- [ ] `cd frontend && npm run check && npm run lint`. `lint` runs
      `eslint --fix`, so check `git status` for rewrites.
- [ ] `npx vitest run tests/components/node-editor`

**Dependencies:** None (can run alongside Phase 2)

**Files likely touched:**
- `frontend/src/components/node-editor/nodeForms/ToolForm.svelte`
- `frontend/src/components/node-editor/nodeConfig.ts`
- `frontend/tests/components/node-editor/nodeForms/ToolForm.test.ts`
- `crates/smasher-web/editor-ui/src/nodeForms/ToolForm.svelte` (comments only)

**Estimated scope:** Small

## Task 8: Docs

**Description:** Document the new contract:
- **`dot-reference.md`:**
  - replace the label-fallback text (:80-87, :225-226);
  - document the tool attributes (`tool`, `tool_command`, `timeout` including
    `30s`, `args`), outcome/`tool.*` conditions and the `context.` prefix;
  - note that parallel branches share `tool.*`.
- **`handler-reference.md`:**
  - rewrite the ToolHandler section: shape `parallelogram` not `hexagon`, no
    label fallback, the new failure messages in place of "no tool specified";
  - fix the per-handler shape rows for Parallel, Interviewer and SubPipeline;
  - fix the summary table to match `node_type_from_shape`, adding the missing
    shapes.
- **`config-reference.md`:** remove the tool-node half of the known limitation,
  keeping the manager half. Leave the `_tool_fetch.status` example alone; it
  gets its own backlog item.
- **`parity-matrix.md`:** update the ToolHandler row.
- **`cli-reference.md`:** the `--backend` row says `shell` still runs tool
  nodes.
- **`README.md`, `quickstart.md`:** fix the whole shape list. Beyond
  `hexagon`=Tool, `parallelogram`=Parallel and `component`=SubPipeline are
  wrong, and `tripleoctagon`, `folder`, `Mdiamond` and `Msquare` are missing.
  Leave the "human approval gate" lines for manager nodes to the manager
  backlog item.
- **`skills/english-to-dotfile.md`:** fix the shape table (embedded in
  `smasher ingest`), adding a Tool row that says to use `tool` or
  `tool_command`.

**Acceptance criteria:**
- [ ] No doc says a tool node falls back to its label or to an LLM.
- [ ] Every shape table agrees with `graph/mod.rs`.

**Verification:**
- [ ] `grep -rn "falls back to\|hexagon\|LlmToolBackend\|no tool specified" docs README.md skills`
      is reviewed by hand.
- [ ] `cargo test -p smasher-cli ingest`, since the skill file is `include_str!`ed.

**Dependencies:** Tasks 2–6

**Files likely touched:**
- `docs/dot-reference.md`
- `docs/handler-reference.md`
- `docs/config-reference.md`
- `docs/parity-matrix.md`
- `docs/cli-reference.md`
- `README.md`
- `docs/quickstart.md`
- `skills/english-to-dotfile.md`

**Estimated scope:** Medium (docs only)

## Task 9: Backlog

**Description:** Update the backlog:
- **#22:** delete it (per the BACKLOG convention, the number is left as a gap).
- **#23:** narrow the known limitation to manager nodes.
- **New items, from #35:**
  - manager nodes' purpose, including the README/quickstart "human approval
    gate" lines;
  - the `_tool_fetch.status` nested-condition doc bug (`config-reference.md`);
  - `smasher-conformance/src/convert.rs`'s wrong shapes: the Tool/Parallel
    swap, FanIn→`trapezium` and Generic→`ellipse`, plus its test table;
  - making the upstream-ported example scripts work;
  - deleting the legacy `crates/smasher-web/editor-ui/` and its `/editor-ui`
    mount.

After merge, move the spec, plan and todo to `tasks/archive/` as
`SPEC-tool-command.md`, `plan-tool-command.md` and `todo-tool-command.md`.

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
