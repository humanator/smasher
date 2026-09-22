# Smasher API Reference

Complete reference for the smasher CLI, configuration, handler interfaces, HTTP API,
event system, lint rules, and stylesheet format.

---

## Table of Contents

1. [CLI Commands](#cli-commands)
2. [Environment Variables](#environment-variables)
3. [Handler Interface](#handler-interface)
4. [Engine Configuration](#engine-configuration)
5. [HTTP API Endpoints](#http-api-endpoints)
6. [Event System](#event-system)
7. [Lint Rules](#lint-rules)
8. [Stylesheet Format](#stylesheet-format)
9. [DOT Shape-to-NodeType Mapping](#dot-shape-to-nodetype-mapping)

---

## CLI Commands

The `smasher` binary provides three subcommands for AI workflow orchestration.

### Global Flags

| Flag | Description |
|---|---|
| `-v`, `--verbose` | Enable verbose (debug-level) logging to stderr. Without this flag, only `warn`-level messages are shown. The `RUST_LOG` environment variable overrides the default filter. |
| `--env-file <PATH>` | Load environment variables from a specific `.env` file. Overrides any vars already set by the default `.env` in the current directory. |
| `-h`, `--help` | Print help information. |
| `-V`, `--version` | Print version information. |

### `smasher complete`

Send a one-shot prompt to an LLM. Streams text deltas to stdout by default.

```
smasher complete [OPTIONS] [PROMPT]
```

| Argument / Flag | Description |
|---|---|
| `<PROMPT>` | Positional prompt text. Omit if using `--file`. |
| `--file <PATH>` | Read the prompt from a file instead. |
| `--model <MODEL>` | Model identifier (default: `claude-sonnet-4-20250514`). |
| `--max-tokens <N>` | Maximum tokens to generate. |
| `--temperature <FLOAT>` | Sampling temperature (0.0 - 2.0). |
| `--system <TEXT>` | System prompt to prepend. |
| `--json` | Output the full Response as pretty-printed JSON instead of streaming text. |

Examples:

```bash
# Stream a completion to stdout
smasher complete "Explain monads in one paragraph"

# Use a specific model with a system prompt
smasher complete --model gpt-4o --system "You are a Rust expert" "How do I use Pin?"

# Read prompt from file, get JSON response
smasher complete --file prompt.txt --json

# Control generation length
smasher complete --max-tokens 200 --temperature 0.3 "Write a haiku"
```

### `smasher chat`

Start an interactive agent chat session with tool access. The agent has access to
six built-in tools: `read_file`, `write_file`, `edit_file`, `shell`, `grep`, and `glob`.

```
smasher chat [OPTIONS]
```

| Argument / Flag | Description |
|---|---|
| `--model <MODEL>` | Model identifier (default: `claude-sonnet-4-20250514`). |
| `--max-turns <N>` | Maximum agentic turns before the session ends (default: 100). |
| `--system <TEXT>` | System prompt override. |
| `--working-dir <PATH>` | Working directory for tool operations (default: current directory). |

Interactive commands:
- Type a message and press Enter to send it.
- Type `exit`, `quit`, or `/quit` to leave.
- EOF (Ctrl-D) also ends the session.

Tool call progress is printed to stderr. At session end, usage statistics are printed.

Example:

```bash
smasher chat --model claude-sonnet-4-20250514 --working-dir ./my-project
```

### `smasher run`

Execute a DOT-based pipeline.

```
smasher run [OPTIONS] <PIPELINE>
```

| Argument / Flag | Description |
|---|---|
| `<PIPELINE>` | Path to the DOT pipeline file (positional, required). |
| `--var <KEY=VALUE>` | Variable assignment, repeatable. Variables are injected into the pipeline context. |
| `--model <MODEL>` | Model identifier for codergen nodes (default: `claude-sonnet-4-20250514`). Also injected as the `model` variable. |
| `--max-steps <N>` | Maximum pipeline steps before forced stop (default: 1000). |
| `--stylesheet <PATH>` | Path to a stylesheet file for graph attribute overrides. |

The pipeline output is the final context snapshot, printed to stdout as pretty-printed JSON.

Examples:

```bash
# Run a pipeline
smasher run pipeline.dot

# With variables and a stylesheet
smasher run pipeline.dot --var env=production --var version=2.0 --stylesheet styles.css

# Limit execution steps
smasher run pipeline.dot --max-steps 50
```

### Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success. |
| 1 | General / uncategorized error (`CliError::Other`). |
| 2 | LLM provider error (`CliError::Llm`). |
| 3 | Agent session error (`CliError::Session`). |
| 4 | Pipeline engine error (`CliError::Engine`). |
| 5 | Parse, resolution, or stylesheet error (`CliError::Resolution`, `CliError::DotParse`, `CliError::Stylesheet`). |
| 6 | I/O error (`CliError::Io`). |

### Output Conventions

- **stdout**: primary output (streamed text, JSON responses, pipeline results).
- **stderr**: logging, diagnostics, tool call progress, and error messages.
- Verbose mode (`-v`) enables `debug`-level tracing to stderr.
- Without `-v`, only `warn`-level messages are shown.
- The `RUST_LOG` environment variable overrides the default filter level.

---

## Environment Variables

### API Keys

The LLM client discovers providers from the environment. Set one or more:

| Variable | Provider | Required For |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic (Claude models) | `claude-*` model identifiers |
| `OPENAI_API_KEY` | OpenAI | `gpt-*`, `o1-*`, `o3-*` model identifiers |
| `GEMINI_API_KEY` | Google Gemini | `gemini-*` model identifiers |

At least one API key must be set. If none are found, the CLI exits with an error.

### .env File Support

The CLI loads environment variables from `.env` files in two stages:

1. **Automatic**: On startup, `dotenvy` loads `.env` from the current directory (silently
   ignored if the file does not exist).
2. **Explicit**: If `--env-file <PATH>` is passed, that file is loaded and its values
   override any previously set variables.

### Logging

| Variable | Description |
|---|---|
| `RUST_LOG` | Override the default log filter. Takes precedence over `-v`. Follows the `tracing_subscriber::EnvFilter` syntax (e.g. `debug`, `smasher_llm=trace`, `warn`). |

---

## Handler Interface

The `Handler` trait is the core abstraction for executing pipeline nodes. Every node in a
pipeline graph is processed by a handler that matches its type.

### The Handler Trait

```rust
#[async_trait]
pub trait Handler: Send + Sync {
    /// A short name identifying this handler type.
    fn name(&self) -> &str;

    /// Execute the handler for a given node with shared context.
    async fn execute(
        &self,
        node: &GraphNode,
        context: &Context,
    ) -> Result<Outcome, HandlerError>;

    /// Whether this handler can process the given node type.
    fn handles(&self, node_type: &NodeType) -> bool;
}
```

### Implementing a Custom Handler

```rust
use std::sync::Arc;
use async_trait::async_trait;
use smasher_attractor::graph::{GraphNode, NodeType};
use smasher_attractor::handler::{Handler, HandlerError, HandlerRegistry};
use smasher_attractor::state::{Context, Outcome};
use serde_json::json;

struct MyHandler;

#[async_trait]
impl Handler for MyHandler {
    fn name(&self) -> &str { "my_handler" }

    async fn execute(
        &self,
        node: &GraphNode,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        // Read from context, do work, write results back.
        context.set(format!("{}_done", node.id), json!(true));
        Ok(Outcome::success())
    }

    fn handles(&self, node_type: &NodeType) -> bool {
        matches!(node_type, NodeType::Generic)
    }
}

// Register with a HandlerRegistry:
let mut registry = HandlerRegistry::new();
registry.register(Arc::new(MyHandler));
```

### HandlerRegistry

The `HandlerRegistry` maps node types to concrete handler implementations. The first
registered handler whose `handles()` method returns `true` for a node type wins.

| Method | Description |
|---|---|
| `HandlerRegistry::new()` | Create an empty registry. |
| `register(handler)` | Register a handler. First match wins. |
| `get_handler(node_type)` | Find the first handler that can process the given type. |
| `execute(node, context)` | Look up and execute the matching handler. Returns `HandlerError::NoHandler` if none matches. |

### Built-in Handlers

| Handler | Node Type | Behavior |
|---|---|---|
| `StartHandler` | `NodeType::Start` | Sets `_started` in context, returns success. |
| `ExitHandler` | `NodeType::Exit` | Sets `_completed` in context, returns success. |
| `ConditionalHandler` | `NodeType::Conditional` | Parses and evaluates the `condition` attribute against the context. Returns success with `{"result": true/false}`. |
| `CodergenHandler` | `NodeType::Codergen` | Delegates to a pluggable `CodergenBackend`. Uses `prompt` attribute or falls back to node label. |

### default_registry()

Returns a registry pre-loaded with `StartHandler`, `ExitHandler`, and `ConditionalHandler`.
`CodergenHandler` is excluded because it requires a `CodergenBackend` instance.

### HandlerError

```rust
pub enum HandlerError {
    ExecutionFailed { handler: String, node_id: String, message: String },
    NoHandler { node_type: String },
    Other(String),
}
```

### CodergenBackend Trait

For LLM-powered code generation nodes, implement this trait:

```rust
#[async_trait]
pub trait CodergenBackend: Send + Sync {
    async fn generate(
        &self,
        prompt: &str,
        model: Option<&str>,
        context: &Context,
    ) -> Result<Outcome, HandlerError>;
}
```

The `CodergenHandler` reads the `prompt` attribute from the node (falling back to the
node's `label`), and optionally the `model` attribute, then delegates to the backend.

---

## Engine Configuration

The `EngineConfig` struct controls pipeline execution behavior.

```rust
pub struct EngineConfig {
    /// Maximum nodes to visit before forced stop (prevents infinite loops).
    pub max_steps: usize,
    /// Whether to create checkpoints during execution.
    pub enable_checkpointing: bool,
}
```

### Defaults

| Field | Default Value |
|---|---|
| `max_steps` | 1000 |
| `enable_checkpointing` | true |

### Engine Methods

| Method | Description |
|---|---|
| `Engine::new(graph, registry)` | Create an engine with default configuration. |
| `Engine::with_config(graph, registry, config)` | Create an engine with custom configuration. |
| `engine.run(context)` | Run the pipeline from the start node. |
| `engine.run_from_checkpoint(checkpoint, context)` | Resume from a saved checkpoint. |

### ExecutionResult

The result of a completed pipeline execution:

```rust
pub struct ExecutionResult {
    pub visited_nodes: Vec<String>,
    pub node_outcomes: HashMap<String, Outcome>,
    pub final_context: HashMap<String, serde_json::Value>,
    pub steps_taken: usize,
    pub checkpoint: Option<Checkpoint>,
    pub loop_restarts: LoopCounter,
}
```

### EngineError

```rust
pub enum EngineError {
    NoStartNode,
    MultipleStartNodes { ids: Vec<String> },
    NodeNotFound { node_id: String },
    MaxStepsExceeded { max_steps: usize },
    Handler(HandlerError),
    EdgeSelection(EdgeSelectionError),
    GoalEnforcement(GoalError),
    RetryExhausted { node_id: String, message: String },
}
```

### Execution Behavior

- The engine finds the single `Start` node and walks the graph, executing handlers.
- After each node, it selects the next edge based on conditions, outcome, and priority.
- Nodes returning retryable failures are retried according to per-node `RetryPolicy`.
- `loop_restart` edges increment a loop counter and clear context entries prefixed
  with the source node's ID.
- At completion, goal gates are enforced: all nodes with `goal=true` must have been visited.
- If checkpointing is enabled, a `Checkpoint` is included in the result.

---

## HTTP API Endpoints

The smasher-web HTTP API exposes a complete JSON+SSE contract for pipeline execution.
The default server binds to `127.0.0.1:21541`.

### Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint. |
| `POST` | `/api/runs` | Submit a pipeline for execution. |
| `GET` | `/api/runs` | List all pipeline runs. |
| `GET` | `/api/runs/{id}` | Get status of a specific run. |
| `POST` | `/api/runs/{id}/cancel` | Cancel a running pipeline. |
| `POST` | `/api/runs/{id}/resume` | Resume a completed/failed/aborted run from checkpoint. |
| `GET` | `/api/runs/{id}/tokens` | Get input/output token counts for a run. |
| `GET` | `/api/runs/{id}/graph` | Render the run's graph as SVG with node execution status. |
| `GET` | `/api/runs/{id}/events` | Stream run events as Server-Sent Events (JSON). |
| `GET` | `/api/runs/{id}/candidates` | List gallery-gate candidate summaries with scorecards. |
| `GET` | `/api/runs/{id}/decisions` | List recorded gallery-gate decisions, oldest first. |
| `GET` | `/api/runs/{id}/questions` | List pending human-gate questions. |
| `POST` | `/api/runs/{id}/questions/{qid}/answer` | Answer a human-gate question (JSON). |
| `POST` | `/api/graph/nodes` | Parse DOT source and return node list. |
| `GET` | `/api/workflows` | List all discovered workflow files from configured directories. |
| `POST` | `/editor/workflows` | Save a new workflow (used by node-editor). |
| `PUT` | `/editor/workflows/{id}/graph` | Update an existing workflow's graph (used by node-editor). |
| `POST` | `/api/runs/{id}/gallery/{qid}/decision` | Submit a gallery-gate decision (used by gallery-gate component). |
| `GET` | `/spa/*` | Serve the `smasher-spa` static bundle, with SPA-style fallback to `index.html` for unmatched paths. Not yet mounted at `/` (still owned by the legacy dashboard until `smasher-spa` ships parity, see the Boundaries section of `SPEC-smasher-web-api.md`). |

### POST /api/runs -- Submit Pipeline

Request body:

```json
{
  "dot_source": "digraph { start [shape=circle]; exit [shape=doublecircle]; start -> exit; }",
  "variables": {"env": "production", "version": "1.0"},
  "model": "claude-sonnet-4-20250514"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dot_source` | string | yes | DOT graph source defining the pipeline topology. |
| `variables` | object | yes | Key-value pairs injected into the pipeline context. |
| `model` | string | no | Optional model override for LLM nodes. |

Response body:

```json
{
  "run_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "Running",
  "run_working_dir": "artifacts/01ARZ3NDEKTSV4RRFFQ69G5FAV"
}
```

`status` is always `"Running"` on submit (submission is synchronous only up to launch; execution continues in the background). `run_working_dir` is relative to the server's `data_dir`.

### GET /api/runs -- List Runs

Response body — `runs` is a list of the same shape as `GET /api/runs/{id}` below:

```json
{
  "runs": [
    {
      "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "status": "Completed",
      "started_at": "2026-02-07T10:00:00Z",
      "completed_at": "2026-02-07T10:00:05Z",
      "graph_name": "pipeline_a",
      "error": null,
      "input_tokens": 0,
      "output_tokens": 0,
      "run_working_dir": "artifacts/01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "workflow_id": null
    }
  ]
}
```

### GET /api/runs/{id} -- Run Status

Response body (flat `RunSummary`, no nested `metadata` wrapper):

```json
{
  "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "Running",
  "started_at": "2026-02-07T10:00:00Z",
  "completed_at": null,
  "graph_name": "my_pipeline",
  "error": null,
  "input_tokens": 0,
  "output_tokens": 0,
  "run_working_dir": "artifacts/01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "workflow_id": null
}
```

`status` is one of `Running`, `Completed`, `Failed`, `Aborted` (PascalCase — it's Rust's `{:?}` `Debug` output of `RunStatus`, not a lowercase string).

### GET /api/runs/{id}/events -- SSE Event Stream

Streams `PipelineEvent` objects as Server-Sent Events with JSON data payloads.

**Format:**
```
event: event_name
data: {"field": "value", ...}
```

The stream terminates when `pipeline_completed` or `pipeline_aborted` is received.

All 17 event types listed in the [PipelineEvent Variants](#pipelineevent-variants) section below.

### POST /api/runs/{id}/cancel -- Cancel Run

Cancels a running pipeline. Only works on runs with status "Running".

Response body (200 OK):

```json
{
  "success": true,
  "status": "Aborted"
}
```

### POST /api/runs/{id}/resume -- Resume Run

Resume a completed, failed, or aborted run from its last checkpoint. Creates a new run with a fresh id.

Response body (200 OK):

```json
{
  "run_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "Running",
  "resumed_from_node": "node_id"
}
```

### GET /api/runs/{id}/tokens -- Token Usage

Returns cumulative input/output token counts for a run.

Response body (200 OK):

```json
{
  "input_tokens": 5000,
  "output_tokens": 12000
}
```

### GET /api/runs/{id}/candidates -- Gallery Gate Candidates

List all candidate summaries (from render-capture artifacts) for a run, including scorecards.

Response body (200 OK):

```json
{
  "candidates": [
    {
      "candidate_id": "candidate-001",
      "screenshot_url": "/candidate-artifacts/run-abc/artifacts/candidate-001/screenshot.png",
      "bundle_url": "/candidate-artifacts/run-abc/artifacts/candidate-001/bundle.html",
      "manifest": { },
      "scorecard": { }
    }
  ]
}
```

Returns empty array if run exists but has no candidates yet.

### GET /api/runs/{id}/decisions -- Gallery Gate Decision History

List every recorded gallery-gate decision for a run, extracted from its event log,
oldest first. A gate node can appear more than once if a pipeline loop revisits it.

Response body (200 OK):

```json
{
  "decisions": [
    {
      "node_id": "Gate1",
      "selected": ["candidate-001"],
      "decision": "proceed",
      "comments": { "candidate-002": "needs more contrast" },
      "timestamp": "2026-01-01T00:00:00Z"
    }
  ]
}
```

Returns an empty array if the run exists but has no recorded gate decisions yet.

### GET /api/runs/{id}/questions -- List Questions

List all pending human-gate questions for a run. Poll this to detect a pause — `RunStatus`
has no `Paused`/`Waiting` variant, so `status` stays `"Running"` the entire time a run is
blocked on a human-gate answer; a non-empty `questions` array is the actual pause signal.

Response body (200 OK):

```json
{
  "questions": [
    {
      "id": "q-uuid-1",
      "question": "Is this acceptable?",
      "choices": [],
      "kind": "free_form",
      "node_id": "gate_node"
    }
  ],
  "gallery_gate": null
}
```

`kind` is one of `free_form`, `multiple_choice`, `approval`. `choices` is populated for
`multiple_choice` questions, empty otherwise.

`gallery_gate` is non-null when the pending question belongs to a gallery gate node
(`shape=hexagon gallery="true"`) *and* that gate's candidates exist on disk; the matching
question is omitted from `questions` in that case (never both a plain question and a gate
card for the same pending question). Its candidates and answer routing go through
[`GET /api/runs/{id}/candidates`](#get-apirunsidcandidates----gallery-gate-candidates)'s
`CandidateResponse` shape and
[`POST /api/runs/{id}/gallery/{qid}/decision`](#post-apirunsidgalleryqiddecision----gallery-gate-decision),
not the plain answer endpoint below:

```json
{
  "questions": [],
  "gallery_gate": {
    "question_id": "q-uuid-2",
    "candidates": [ /* CandidateResponse[], see List Candidates */ ],
    "expected_count": 3,
    "outgoing_edges": ["proceed", "iterate"]
  }
}
```

`expected_count` is a display hint only (from a `candidates=N` launch variable or the gate
node's `candidate_count` attribute), never enforced. `outgoing_edges` are the gate's outgoing
edge labels (falling back to the target node id when an edge has no label) — the valid
`decision` values for the gallery decision endpoint.

### POST /api/runs/{id}/questions/{qid}/answer -- Answer Question

Answer a human-gate question with a JSON body. Requires `Content-Type: application/json`;
a form-encoded body is rejected with `415 Unsupported Media Type`.

Request body (application/json):

```json
{
  "answer": "yes"
}
```

Response body (200 OK):

```json
{
  "success": true
}
```

On failure (e.g. unknown question id), `success` is `false` and an `error` field is included.

### GET /api/workflows -- List Workflows

List all discovered workflow files from the server's configured workflow directories.

Response body (200 OK):

```json
{
  "workflows": [
    {
      "id": "examples__consensus_task",
      "name": "consensus_task.dot",
      "source_dir": "examples",
      "path": "examples/consensus_task.dot"
    }
  ],
  "available_target_dirs": ["examples"]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable slug derived from source directory and relative path. |
| `name` | string | Display name (relative path from configured root). |
| `source_dir` | string | The configured directory root this workflow was found under. |
| `path` | string | Full filesystem path to the workflow file. |
| `available_target_dirs` | string[] | The server's configured workflow directories (`--workflow-dir`), regardless of whether any workflow has been found under them yet. Used to populate the node-editor's "new workflow" target-directory picker; `POST /api/workflows/new`'s `target_dir` must be one of these. |

Empty array if no workflows are configured or found.

### POST /editor/workflows -- Create Workflow

Create a new workflow file via the node-editor. Used by the editor UI to save newly-created pipelines.

Request body:

```json
{
  "dot_source": "digraph { ... }",
  "name": "my_workflow",
  "target_dir": "examples"
}
```

Response body (200 OK):

```json
{
  "id": "examples__my_workflow",
  "name": "my_workflow.dot",
  "source_dir": "examples",
  "path": "examples/my_workflow.dot"
}
```

### PUT /editor/workflows/{id}/graph -- Update Workflow

Update an existing workflow's graph definition (used by the node-editor's save/update flow).

Request body:

```json
{
  "dot_source": "digraph { ... }"
}
```

Response body (200 OK): Same shape as Create Workflow above.

### POST /api/runs/{id}/gallery/{qid}/decision -- Gallery-Gate Decision

Submit a gallery-gate decision (selected candidates, edge, optional comments).

Request body:

```json
{
  "edge": "candidate-001",
  "selected": ["candidate-001", "candidate-003"],
  "comment": "Selected best and most cost-effective options"
}
```

Response body (200 OK):

```json
{
  "success": true
}
```

### GET /api/health -- Health Check

Returns a 200 OK if the server is running.

Response body:

```json
{
  "status": "ok"
}
```

### GET /spa/* -- Static SPA Serving

Serves the `smasher-spa` build's static assets, disk-based (not embedded in the binary).
Falls back to `index.html` for any unmatched path (SPA client-side routing pattern).

Configuration:

- Reads the dist directory from the `SMASHER_SPA_DIST` environment variable.
- Defaults to `../../frontend/dist` relative to the `smasher-web` crate.
- If the dist directory doesn't exist at server startup, the mount 404s everything
  instead of crashing the server — useful on a dev machine with no `smasher-spa`
  build yet.

Not yet mounted at `/` — the legacy askama/HTMX dashboard (`pages.rs`) still owns `/`
until `smasher-spa` ships and confirms dashboard parity (the final-cutover task).

### Run Statuses

`status` values are PascalCase (Rust `Debug` output of `RunStatus`), not lowercase:

| Status | Description |
|---|---|
| `Running` | Pipeline is actively executing (also covers "paused on a human-gate question" — see [List Questions](#get-apirunsidquestions----list-questions)). |
| `Completed` | Pipeline finished successfully. |
| `Failed` | Pipeline terminated with an error. |
| `Aborted` | Pipeline was cancelled before completion. |

### Server Configuration

```rust
pub struct ServerConfig {
    pub port: u16,               // Default: 21541
    pub host: [u8; 4],           // Default: [127, 0, 0, 1] (never binds beyond localhost)
    pub model: String,           // Default LLM model for pipeline execution
    pub provider: Option<String>,// Optional provider override, bypasses model-name inference
    pub data_dir: String,        // Default: ~/.smasher (override: SMASHER_DATA_DIR)
    pub workflow_dirs: Vec<String>, // Additional dirs scanned for .dot/.gv workflow files
}
```

---

## Event System

Pipeline execution emits structured events via `tokio::sync::broadcast` for real-time
observability. Events carry a UTC timestamp and a `kind` tag for JSON serialization.

### PipelineEvent Variants

All events are emitted on `/api/runs/{id}/events` as SSE with JSON data payloads. All events include a UTC `timestamp`.

| Event Name | JSON Fields | Description |
|---|---|---|
| `pipeline_started` | `graph_name`, `timestamp` | Pipeline began executing. |
| `pipeline_completed` | `outcome`, `total_nodes`, `duration_ms`, `timestamp` | Pipeline finished successfully. |
| `pipeline_aborted` | `reason`, `timestamp` | Pipeline was cancelled/aborted. |
| `node_started` | `node_id`, `node_type`, `timestamp` | Node began execution. |
| `node_completed` | `node_id`, `outcome`, `duration_ms`, `timestamp` | Node finished with outcome. |
| `node_failed` | `node_id`, `error`, `duration_ms`, `timestamp` | Node execution failed. |
| `edge_traversed` | `from`, `to`, `label`, `timestamp` | Edge was followed between nodes. |
| `loop_restarted` | `from`, `to`, `restart_count`, `timestamp` | Loop edge was followed; context cleared. |
| `context_updated` | `key`, `timestamp` | Pipeline context variable was updated. |
| `checkpoint_created` | `node_id`, `timestamp` | Execution checkpoint persisted. |
| `human_prompt_issued` | `node_id`, `question`, `timestamp` | Human-gate prompt issued; awaiting response. |
| `human_response_received` | `node_id`, `response`, `timestamp` | Human provided an answer; resuming. |
| `agent_turn_started` | `node_id`, `turn_number`, `timestamp` | Agent agentic turn began. |
| `agent_message` | `node_id`, `text`, `timestamp` | Agent emitted a message. |
| `agent_tool_call_started` | `node_id`, `tool_name`, `tool_call_id`, `input_preview`, `timestamp` | Agent invoked a tool. |
| `agent_tool_call_completed` | `node_id`, `tool_name`, `tool_call_id`, `duration_ms`, `is_error`, `result_preview`, `timestamp` | Tool execution completed. |
| `agent_token_usage` | `node_id`, `input_tokens`, `output_tokens`, `cost_usd`, `timestamp` | LLM token usage recorded. |

### Event Classification

- **Node events** (`is_node_event()`): `node_started`, `node_completed`, `node_failed`
- **Pipeline events** (`is_pipeline_event()`): `pipeline_started`, `pipeline_completed`, `pipeline_aborted`

### PipelineEventEmitter

Broadcasts events to multiple subscribers.

```rust
let emitter = PipelineEventEmitter::new(64);  // channel capacity
let mut rx = emitter.subscribe();

emitter.emit(PipelineEvent::PipelineStarted {
    graph_name: "demo".into(),
    timestamp: Utc::now(),
});

// In an async task:
let event = rx.recv().await.unwrap();
```

| Method | Description |
|---|---|
| `PipelineEventEmitter::new(capacity)` | Create with given broadcast channel capacity. |
| `PipelineEventEmitter::default()` | Create with capacity 256. |
| `emit(event)` | Send an event. Silently dropped if no subscribers. |
| `subscribe()` | Get a new receiver for future events. |
| `subscriber_count()` | Number of active subscribers. |

### PipelineEventLog

Collects events in memory for post-hoc analysis. Thread-safe via `Arc<Mutex<Vec>>`.

| Method | Description |
|---|---|
| `PipelineEventLog::new()` | Create an empty log. |
| `push(event)` | Append an event. |
| `events()` | Clone of all collected events. |
| `events_for_node(node_id)` | Events matching a specific node. |
| `len()` / `is_empty()` | Event count queries. |
| `summary()` | Build a `PipelineExecutionSummary` from collected events. Returns `None` if no `PipelineStarted` event exists. |

---

## Lint Rules

The lint system validates pipeline graph structure before execution. Each issue is
reported as a `Diagnostic` with severity, code, message, optional node ID, and suggestion.

### Built-in Rules

| Code | Severity | Rule Name | Description | Fix |
|---|---|---|---|---|
| E001 | Error | `no_start_node` | Graph has no start node. | Add a node with `shape="circle"` or `shape="point"`. |
| E002 | Error | `multiple_start_nodes` | Graph has more than one start node. | Remove extra start nodes so the graph has exactly one entry point. |
| E003 | Error | `no_exit_node` | Graph has no exit node. | Add a node with `shape="doublecircle"`. |
| W001 | Warning | `unreachable_node` | A non-start node has no incoming edges. | Add an edge leading to the node, or remove it. |
| W002 | Warning | `dead_end_node` | A non-exit node has no outgoing edges. | Add an outgoing edge or change it to an exit node. |
| W003 | Warning | `missing_condition` | A conditional node has an outgoing edge without a condition. | Add a `condition` attribute to the edge. |
| I001 | Info | `empty_label_edge` | An edge has no label or an empty label. | Add a label for clarity. |

### Severity Levels

Ordered from least to most severe: `Info` < `Warning` < `Error`.

### Using the Lint System

```rust
use smasher_attractor::lint::{LintRunner, Severity};

// Run all built-in rules:
let runner = LintRunner::with_builtins();
let report = runner.run(&graph);

if report.has_errors() {
    for diag in report.errors() {
        eprintln!("[{}] {}: {}", diag.code, diag.severity, diag.message);
        if let Some(suggestion) = &diag.suggestion {
            eprintln!("  suggestion: {}", suggestion);
        }
    }
}

// Check if the graph is fully clean (no errors or warnings):
assert!(report.is_clean());
```

### Custom Rules

Implement the `LintRule` trait and register with `LintRunner::add_rule`:

```rust
pub trait LintRule {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn check(&self, graph: &Graph) -> Vec<Diagnostic>;
}
```

### Diagnostic Structure

```rust
pub struct Diagnostic {
    pub severity: Severity,      // Info, Warning, or Error
    pub code: String,            // e.g. "E001", "W002"
    pub message: String,         // Human-readable description
    pub node_id: Option<String>, // Node involved, if applicable
    pub suggestion: Option<String>, // How to fix the issue
}
```

---

## Stylesheet Format

Stylesheets use a CSS-like syntax to configure graph node attributes without modifying
the DOT source. They support selectors, typed values, and specificity-based cascading.

### Syntax

```css
selector {
    property: value;
    property: value;
}
```

### Selectors

| Syntax | Selector Type | Specificity | Description |
|---|---|---|---|
| `*` | All | 0 (lowest) | Matches every node. |
| `codergen` | NodeType | 1 | Matches nodes of the named type. |
| `.critical` | Class | 2 | Matches nodes whose `class` attribute contains the name. |
| `#node_42` | Id | 3 (highest) | Matches the node with the exact ID. |

Valid node type names: `start`, `exit`, `codergen`, `conditional`, `tool`,
`interviewer`, `parallel`, `manager`, `subpipeline`, `generic`.

### Values

| Type | Syntax | Examples |
|---|---|---|
| String | `"quoted text"` | `"claude-sonnet-4-20250514"`, `"hello world"` |
| Number | bare numeric | `4096`, `0.7`, `3` |
| Duration | number + suffix | `30s` (seconds), `5m` (minutes), `2h` (hours) |
| Boolean | `true` / `false` | `true`, `false` |

### Comments

Block comments are supported: `/* comment text */`

### Specificity and Cascading

Rules are applied in specificity order. Within the same specificity level, later rules
override earlier ones. Properties from lower-specificity rules are preserved unless
explicitly overridden by a higher-specificity rule.

Cascade order (lowest to highest): `*` < NodeType < `.class` < `#id`

### Example Stylesheet

```css
/* Base settings for all nodes */
* {
    temperature: 0.5;
    timeout: 30s;
}

/* All codergen nodes use this model by default */
codergen {
    model: "claude-sonnet-4-20250514";
    max_tokens: 4096;
    temperature: 0.7;
}

/* Critical nodes get more retries */
.critical {
    retries: 3;
    timeout: 120s;
}

/* Override a specific node */
#final_review {
    model: "claude-opus-4-20250514";
    temperature: 0.2;
}
```

Given a node `#final_review` of type `codergen` with class `critical`, the effective
attributes are:

| Property | Value | Source |
|---|---|---|
| `temperature` | 0.2 | `#final_review` (Id, specificity 3) |
| `model` | `"claude-opus-4-20250514"` | `#final_review` (Id, specificity 3) |
| `max_tokens` | 4096 | `codergen` (NodeType, specificity 1) |
| `retries` | 3 | `.critical` (Class, specificity 2) |
| `timeout` | 120s | `.critical` (Class, specificity 2) |

### Stylesheet API

```rust
use smasher_attractor::stylesheet::Stylesheet;

let stylesheet = Stylesheet::parse(input)?;

// Get effective attributes for a node:
let attrs = stylesheet.apply(&node);

// Get all matching rules for a node:
let rules = stylesheet.matching_rules(&node);
```

---

## DOT Shape-to-NodeType Mapping

When resolving a DOT file into a semantic graph, the `shape` attribute on nodes
determines their `NodeType`.

| Shape | NodeType | Description |
|---|---|---|
| `circle`, `point`, `Mdiamond` | `Start` | Entry point of the pipeline. |
| `doublecircle`, `Msquare` | `Exit` | Terminal node. |
| `box`, `rectangle` | `Codergen` | Code generation node (runs an agent session). |
| `diamond` | `Conditional` | Conditional branching node. |
| `hexagon`, `oval`, `ellipse` | `Interviewer` | Human-gate node — pauses the pipeline for a question/answer round trip via `GET /api/runs/{id}/questions` + `POST .../answer`. |
| `parallelogram` | `Tool` | Tool execution node (e.g. `render_capture`). |
| `component` | `Parallel` | Parallel fan-out node. |
| `tripleoctagon` | `FanIn` | Parallel fan-in join node. |
| `house` | `Manager` | Manager/coordinator node. |
| `folder` | `SubPipeline` | Sub-pipeline node referencing an external DOT file. |
| *(any other)* | `Generic` | Generic processing node. |

### Edge Attributes

| Attribute | Type | Description |
|---|---|---|
| `label` | string | Human-readable edge label. Also used as fallback for `condition`. |
| `condition` | string | Boolean expression evaluated against context (e.g. `status=done`). |
| `priority` | integer | Edge selection priority (higher values are preferred). |
| `loop_restart` | boolean | When true, traversing this edge clears source-node context entries and increments the loop counter. |

### Node Attributes

| Attribute | Type | Description |
|---|---|---|
| `shape` | string | Determines node type (see table above). |
| `label` | string | Human-readable node label. Used as fallback prompt for codergen nodes. |
| `prompt` | string | Explicit prompt for codergen nodes. |
| `model` | string | Model override for codergen nodes. |
| `condition` | string | Boolean condition for conditional nodes (e.g. `key=value`). |
| `goal` | boolean | When `true`, the engine enforces that this node is visited. |
| `class` | string | Space-separated class names for stylesheet matching. |
