<!-- ABOUTME: Reference for all handler types in the smasher-attractor pipeline engine. -->
<!-- ABOUTME: Documents handler behavior, node attributes, context keys, and backend traits. -->

# Handler Reference

## Overview

Handlers are responsible for executing pipeline nodes. Each handler implements the
`Handler` trait and declares which `NodeType` it handles. The engine uses a
`HandlerRegistry` to find the first handler that matches a node's type.

```
trait Handler: Send + Sync {
    fn name(&self) -> &str;
    async fn execute(&self, node: &GraphNode, context: &Context) -> Result<Outcome, HandlerError>;
    fn handles(&self, node_type: &NodeType) -> bool;
}
```

### Outcome

Every handler returns an `Outcome`:

| Variant | Description |
|---------|-------------|
| `Success { data }` | Node completed. Optional JSON data payload. |
| `Failure { error, retryable }` | Node failed. Error message and whether retry is possible. |
| `Skip { reason }` | Node was skipped. Reason string explains why. |

### HandlerRegistry

The registry holds an ordered list of handlers. When the engine needs to execute a
node, it iterates the list and uses the first handler whose `handles()` method
returns `true` for the node's type. The `default_registry()` function creates a
registry with the built-in Start, Exit, and Conditional handlers.

---

## Built-in Handlers

### StartHandler

Handles `Start` nodes. Sets a context flag to mark the pipeline as started.

| Property | Value |
|----------|-------|
| **Name** | `start` |
| **Node type** | `Start` |
| **DOT shape** | `circle`, `point` or `Mdiamond` |
| **Attributes** | None |
| **Context key** | `_started` = `true` |
| **Outcome** | Always `Success` |

### ExitHandler

Handles `Exit` nodes. Sets a context flag to mark the pipeline as completed.

| Property | Value |
|----------|-------|
| **Name** | `exit` |
| **Node type** | `Exit` |
| **DOT shape** | `doublecircle` or `Msquare` |
| **Attributes** | None |
| **Context key** | `_completed` = `true` |
| **Outcome** | Always `Success` |

### ConditionalHandler

Handles `Conditional` nodes. Evaluates a condition expression against the current
context and returns success if the condition is true, failure if false.

| Property | Value |
|----------|-------|
| **Name** | `conditional` |
| **Node type** | `Conditional` |
| **DOT shape** | `diamond` |
| **Attributes** | `condition` (String) |
| **Outcome** | `Success` if condition is true, `Failure` if false |

The `condition` attribute is parsed using the condition expression language
(see [Config Reference](config-reference.md#condition-expressions)).

---

## CodergenHandler

Handles `Codergen` nodes. Delegates prompt execution to a pluggable `CodergenBackend`
which manages the actual LLM interaction.

| Property | Value |
|----------|-------|
| **Name** | `codergen` |
| **Node type** | `Codergen` |
| **DOT shape** | `box` or `rectangle` (also the default when `shape` is omitted) |

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | String | No | The prompt text to send to the LLM. Falls back to node label if absent. |
| `model` | String | No | Override the LLM model for this node. |

### Backend Trait

```
trait CodergenBackend: Send + Sync {
    async fn generate(&self, prompt: &str, model: Option<&str>, context: &Context)
        -> Result<Outcome, HandlerError>;
}
```

If neither `prompt` nor label is present, returns `Failure("no prompt specified")`.

---

## ToolHandler

Handles `Tool` nodes. Runs a built-in tool through a pluggable `ToolBackend`
chain, or a shell command through `CommandRunner`. It never falls back to an
LLM.

| Property | Value |
|----------|-------|
| **Name** | `tool` |
| **Node type** | `Tool` |
| **DOT shape** | `parallelogram` |
| **Context keys** | `_tool_{node_id}`; `tool.output`, `tool.stderr`, `tool.exit_code` for commands |

### Attributes

A tool node sets exactly one of `tool` or `tool_command`. The node label is
never used as a tool name.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `tool` | String | One of these two | Built-in tool to run: `render_capture`, `system_lint`, `task_critic` or `synthesis`. |
| `tool_command` | String | One of these two | Shell command, run with `sh -c` in the run's working directory. |
| `args` | String (JSON) | No | JSON-encoded arguments for a built-in `tool`. Defaults to `{}`. Ignored for `tool_command` (lint W004). |
| `timeout` | Number, numeric string or duration | No | How long a `tool_command` may run: `600`, `"600"` or `"30s"`. Defaults to 600 seconds. |

### Built-in tools

`tool` is dispatched down a chain of `ToolBackend`s, each handling its own
names and passing the rest on:

```
TaskCriticSynthesisToolBackend  (task_critic, synthesis; only when an LLM client exists)
  -> SystemLintToolBackend      (system_lint)
  -> HybridToolBackend          (render_capture)
  -> UnknownToolBackend         (anything else: Failure("unknown tool 'x'; built-in tools are: ..."))
```

`task_critic` and `synthesis` make one LLM call each. No other tool node
reaches an LLM.

```
trait ToolBackend: Send + Sync {
    async fn execute_tool(&self, tool_name: &str, args: &Value, context: &Context)
        -> Result<Outcome, HandlerError>;
    fn available_tools(&self) -> Vec<String>;
}
```

### Shell commands

`ToolHandler::with_commands(CommandConfig { working_dir, run_dir, cancel })`
enables `tool_command`. The web app and the CLI both pass the run's working
directory, run directory and cancellation token. The command:

- runs in its own process group with stdin empty, and stdout and stderr read
  concurrently;
- inherits the environment minus secret-looking variables, plus
  `SMASHER_RUN_DIR`, `SMASHER_NODE_ID` and `SMASHER_CTX_<KEY>` (see the
  [DOT reference](dot-reference.md#tool-parallelogram));
- is killed, with its whole process group, on timeout or when the run is
  cancelled.

| Result | Outcome |
|--------|---------|
| Exit 0 | `Success` with data `{stdout, stderr, exit_code}` |
| Non-zero exit | `Failure("exit code N: <last 2,000 bytes of stderr>")` |
| Timeout | `Failure("timed out after Ns")` |
| Cancelled | `Failure("cancelled")` |
| Shell couldn't start | `Failure` with the OS error |

None of these failures is retryable. Whatever the result, `tool.output`
(stdout, trailing whitespace trimmed), `tool.stderr` and `tool.exit_code`
(`-1` after a timeout or cancel) are set in context, each capped at 100,000
bytes, and the full streams are written to `nodes/{node_id}/stdout.txt` and
`stderr.txt` in the run directory.

### Context Storage

The handler also stores the outcome in context under `_tool_{node_id}`:

```json
// On success:
{ "status": "success", "data": { ... } }

// On failure:
{ "status": "failure", "error": "message", "retryable": false }

// On skip:
{ "status": "skip", "reason": "message" }
```

### Error Handling

- If `args` contains invalid JSON, returns `Failure("invalid JSON in args attribute: ...")`.
  This is checked first.
- If neither `tool` nor `tool_command` is set, returns
  `Failure("tool node '<id>' needs a tool or tool_command attribute")`.
- If both are set, returns `Failure("tool node '<id>' sets both tool and tool_command; use one")`.
- If `timeout` isn't a positive number or duration, returns
  `Failure("tool node '<id>' has an invalid timeout; ...")`.
- If a backend returns a `HandlerError`, it propagates upward. So does a
  `tool_command` on a handler built without `with_commands`, which is a
  wiring bug.

---

## ManagerHandler

Handles `Manager` nodes. Delegates task coordination to a pluggable `ManagerBackend`.

| Property | Value |
|----------|-------|
| **Name** | `manager` |
| **Node type** | `Manager` |
| **DOT shape** | `house` |
| **Context key** | `_manager_{node_id}` |

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | String | No | Description of the task to coordinate. Falls back to node label. |
| `config` | String (JSON) | No | JSON-encoded configuration for the manager. Defaults to `{}`. |

### Backend Trait

```
trait ManagerBackend: Send + Sync {
    async fn coordinate(&self, task: &str, config: &Value, context: &Context)
        -> Result<Outcome, HandlerError>;
}
```

### Context Storage

Same structure as ToolHandler, stored under `_manager_{node_id}`.

### Error Handling

- If `config` contains invalid JSON, returns `Failure("invalid JSON in config attribute: ...")`.
- If neither `task` attribute nor label is present, returns `Failure("no task specified")`.

---

## ParallelHandler

Handles `Parallel` nodes. Executes downstream branches concurrently with bounded
concurrency and configurable failure behavior.

| Property | Value |
|----------|-------|
| **Name** | `parallel` |
| **Node type** | `Parallel` and `FanIn` |
| **DOT shape** | `component` (Parallel), `tripleoctagon` (FanIn) |

### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `max_concurrency` | Number | No | `10` | Maximum number of branches to execute simultaneously. |
| `fail_fast` | Bool | No | `false` | If true, cancel remaining branches on first failure. |

### Merge Strategies

After parallel branches complete, their context changes must be merged. Available
strategies:

| Strategy | Behavior |
|----------|----------|
| `LastWriteWins` | Later writes overwrite earlier ones (default). |
| `FirstWriteWins` | First write is preserved, later writes are discarded. |
| `Collect` | All values for the same key are collected into a JSON array. |
| `Error` | Conflicting writes cause a merge error. |

### Parallel Execution

The `execute_parallel()` function uses `futures::stream::buffer_unordered` to run
branches with bounded concurrency. It returns a `ParallelResult` containing:

- `outcomes`: Map of node ID to outcome.
- `succeeded`: List of node IDs that returned `Success`.
- `failed`: List of node IDs that returned `Failure`.

---

## InterviewerHandler

The single handler registered for `Interviewer` nodes. Poses questions to a
human or automated interviewer and captures responses. Supports approval,
multiple-choice, and free-form modes; the free-form path additionally
supports an optional timeout with a default-choice fallback, and reinterprets
its answer as a structured gallery decision on gates authored with
`gallery="true"`.

| Property | Value |
|----------|-------|
| **Name** | `interviewer` |
| **Node type** | `Interviewer` |
| **DOT shape** | `hexagon`, `oval` or `ellipse` |
| **Context key** | `{node_id}` |

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | String | No | The question to ask. Falls back to `prompt`, then node label. |
| `prompt` | String | No | Fallback for `question`. |
| `options` | String | No | Comma-separated list of answer options (multiple choice). |
| `approve` | Bool | No | If true, use the approval flow instead of free-form question. |
| `human.timeout_secs` | Number | No | Free-form mode only: seconds to wait before using `human.default_choice`. |
| `human.default_choice` | String | No | Free-form mode only: default answer if the timeout expires. |
| `gallery` | Bool | No | Free-form mode only: reinterpret the answer as `{"selected": [...], "decision": "..."}`. |

### Interviewer Trait

```
trait Interviewer: Send + Sync {
    async fn ask(&self, question: &str) -> Result<String, HandlerError>;
    async fn ask_with_options(&self, question: &str, options: &[String]) -> Result<String, HandlerError>;
    async fn approve(&self, question: &str) -> Result<bool, HandlerError>;
}
```

### Interviewer Implementations

| Implementation | Description |
|---------------|-------------|
| `AutoApproveInterviewer` | Always approves and returns a default answer. |
| `QueueInterviewer` | Reads answers from a pre-loaded queue (useful for testing). |
| `CallbackInterviewer` | Delegates to a caller-provided async closure. |
| `ConsoleInterviewer` | Reads answers from stdin interactively. |
| `RecordingInterviewer` | Wraps another interviewer and records all Q&A pairs. |
| `TimeoutInterviewer` | Wraps another interviewer with a configurable timeout. |
| `HttpInterviewer` | Queues questions for external HTTP clients via REST API. |

### Context Storage

The response (a plain string, or `{"selected": [...], "decision": "..."}` for
a gallery gate) is stored in context directly under the node's ID.

`HandlerRegistry` dispatches to the first registered handler whose
`handles()` matches a node's type, so exactly one handler may ever be
registered for `NodeType::Interviewer` in a given registry — `InterviewerHandler`
is that handler everywhere it's wired up (`smasher-cli`, `smasher-web`).

---

## HttpInterviewer

The HTTP interviewer enables external systems to answer pipeline questions via a
REST API.

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/questions` | List pending unanswered questions |
| `POST` | `/api/v1/questions/{id}/answer` | Submit an answer to a question |

### Question Types

| Kind | Description |
|------|-------------|
| `FreeForm` | Open-ended text question |
| `MultipleChoice` | Question with predefined answer options |
| `Approval` | Yes/no approval prompt |

### Flow

1. Pipeline reaches an interviewer node and queues a question.
2. External client polls `GET /api/v1/questions` to discover pending questions.
3. Client submits answer via `POST /api/v1/questions/{id}/answer`.
4. Pipeline receives the answer via an internal oneshot channel and resumes.

---

## SubPipelineHandler

Handles `SubPipeline` nodes. Loads and executes a nested DOT pipeline within the
current pipeline's context.

| Property | Value |
|----------|-------|
| **Node type** | `SubPipeline` |
| **DOT shape** | `folder` |

### Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `pipeline` | String | Yes | Path to the nested DOT pipeline file. |

---

## Node Type to Shape Mapping

The node type is determined by the `shape` attribute in the DOT file:

| DOT Shape | Node Type |
|-----------|-----------|
| `circle`, `point` or `Mdiamond` | Start |
| `doublecircle` or `Msquare` | Exit |
| `box` or `rectangle` (or no shape) | Codergen |
| `diamond` | Conditional |
| `hexagon`, `oval` or `ellipse` | Interviewer |
| `parallelogram` | Tool |
| `component` | Parallel |
| `tripleoctagon` | FanIn |
| `house` | Manager |
| `folder` | SubPipeline |
| (anything else) | Generic |

The mapping lives in `node_type_from_shape` (`crates/smasher-attractor/src/graph/mod.rs`).
