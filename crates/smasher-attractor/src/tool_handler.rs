// ABOUTME: Tool handler for tool nodes: runs a built-in `tool` or a shell `tool_command`.
// ABOUTME: Never falls back to an LLM; captures results in context for downstream nodes.

use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

use serde_json::{Value, json};
use smasher_agent::tools::truncation::truncate_output;

use crate::graph::{GraphNode, NodeAttrValue, NodeType};
use crate::handler::{Handler, HandlerError};
use crate::state::{Context, Outcome};
use crate::tool_command::{
    CommandConfig, CommandOutput, CommandRunner, CommandStatus, DEFAULT_TOOL_TIMEOUT,
};

/// Abstraction for executing external tools during pipeline processing.
///
/// Implementors provide the actual mechanism for running tools (CLI, API calls,
/// subprocess spawning, etc.) while the handler takes care of attribute extraction
/// and context bookkeeping.
#[async_trait::async_trait]
pub trait ToolBackend: Send + Sync {
    /// Execute a tool with the given name, arguments, and context.
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError>;

    /// List available tool names.
    fn available_tools(&self) -> Vec<String>;
}

/// The last link of a built-in tool chain: every name that reached it is
/// unknown. It never calls an LLM; a tool node that wants one uses an explicit
/// `outcome=fail` edge to a codergen node instead.
pub struct UnknownToolBackend {
    built_ins: Vec<String>,
}

impl UnknownToolBackend {
    /// Create the terminal backend. `built_ins` are the tool names the chain
    /// in front of it handles, listed in the failure message.
    pub fn new(built_ins: Vec<String>) -> Self {
        Self { built_ins }
    }
}

#[async_trait::async_trait]
impl ToolBackend for UnknownToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        _args: &Value,
        _context: &Context,
    ) -> Result<Outcome, HandlerError> {
        Ok(Outcome::failure(format!(
            "unknown tool '{tool_name}'; built-in tools are: {}",
            self.built_ins.join(", ")
        )))
    }

    fn available_tools(&self) -> Vec<String> {
        Vec::new()
    }
}

/// Upper bound, in bytes, for each `tool.*` value written to context.
pub const TOOL_CONTEXT_CAP: usize = 100_000;

/// How much of a failing command's stderr goes into the failure message.
const STDERR_TAIL_BYTES: usize = 2_000;

/// A node's non-blank `tool` attribute.
pub fn tool_attr(node: &GraphNode) -> Option<&str> {
    non_blank_attr(node, "tool")
}

/// A node's non-blank `tool_command` attribute.
pub fn tool_command_attr(node: &GraphNode) -> Option<&str> {
    non_blank_attr(node, "tool_command")
}

fn non_blank_attr<'a>(node: &'a GraphNode, key: &str) -> Option<&'a str> {
    match node.attrs.get(key) {
        Some(NodeAttrValue::String(s)) if !s.trim().is_empty() => Some(s),
        _ => None,
    }
}

/// The node's `timeout` attribute in seconds, or `DEFAULT_TOOL_TIMEOUT`.
///
/// Accepts a number (`timeout=600`), a numeric string (`timeout="600"`) or a
/// duration (`timeout="30s"`, which the parser turns into a `Duration`).
/// Returns an error message naming the node for anything else.
pub fn node_timeout(node: &GraphNode) -> Result<Duration, String> {
    let seconds = match node.attrs.get("timeout") {
        None => return Ok(DEFAULT_TOOL_TIMEOUT),
        Some(NodeAttrValue::Duration(d)) if !d.is_zero() => return Ok(*d),
        Some(NodeAttrValue::Number(n)) => Some(*n),
        Some(NodeAttrValue::String(s)) => s.trim().parse::<f64>().ok(),
        Some(_) => None,
    };
    match seconds {
        Some(n) if n.is_finite() && n > 0.0 => Ok(Duration::from_secs_f64(n)),
        _ => Err(format!(
            "tool node '{}' has an invalid timeout; use seconds, e.g. timeout=600 or timeout=\"30s\"",
            node.id
        )),
    }
}

/// Handler for Tool nodes.
///
/// A tool node sets exactly one of:
/// - `tool` (String): a built-in tool, dispatched to the `ToolBackend` chain,
///   with optional JSON `args`.
/// - `tool_command` (String): a shell command run by `CommandRunner`, with an
///   optional `timeout` (seconds, 600 by default). Its result is written to
///   the `tool.output`, `tool.stderr` and `tool.exit_code` context keys and
///   to `nodes/<id>/stdout.txt` and `stderr.txt` under the run directory.
///
/// Neither or both is a failure. The node's label is never used as a tool name.
pub struct ToolHandler {
    backend: Arc<dyn ToolBackend>,
    commands: Option<CommandRunner>,
}

impl ToolHandler {
    /// Create a new ToolHandler backed by the given backend.
    pub fn new(backend: Arc<dyn ToolBackend>) -> Self {
        Self {
            backend,
            commands: None,
        }
    }

    /// Let this handler run `tool_command` nodes: in `working_dir`, writing
    /// output files under `run_dir`, and stopping when `cancel` fires.
    pub fn with_commands(mut self, config: CommandConfig) -> Self {
        self.commands = Some(CommandRunner::new(config));
        self
    }

    async fn run_builtin(
        &self,
        node: &GraphNode,
        tool_name: &str,
        mut args: Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        // Fold `model=`/`provider=` node attrs into args as a fallback, same
        // override surface CodergenHandler already gives Codergen nodes. An
        // explicit "model"/"provider" key already inside the args JSON wins.
        if let Value::Object(ref mut map) = args {
            if !map.contains_key("model")
                && let Some(NodeAttrValue::String(s)) = node.attrs.get("model")
            {
                map.insert("model".to_string(), json!(s));
            }
            if !map.contains_key("provider")
                && let Some(NodeAttrValue::String(s)) = node.attrs.get("provider")
            {
                map.insert("provider".to_string(), json!(s));
            }
        }

        self.backend.execute_tool(tool_name, &args, context).await
    }

    async fn run_command(
        &self,
        node: &GraphNode,
        command: &str,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        let Some(runner) = &self.commands else {
            return Err(HandlerError::ExecutionFailed {
                handler: "tool".to_string(),
                node_id: node.id.clone(),
                message: format!(
                    "tool node '{}' has a tool_command but this handler has no CommandConfig",
                    node.id
                ),
            });
        };
        let timeout = match node_timeout(node) {
            Ok(timeout) => timeout,
            Err(message) => return Ok(Outcome::failure(message)),
        };

        let output = runner.run(command, &node.id, context, timeout).await;
        write_output_files(&runner.config().run_dir, &node.id, &output);

        let exit_code = match output.status {
            CommandStatus::Exited(code) => code,
            _ => -1,
        };
        let stdout = truncate_output(output.stdout.trim_end(), TOOL_CONTEXT_CAP);
        let stderr = truncate_output(&output.stderr, TOOL_CONTEXT_CAP);
        context.set("tool.output", json!(stdout));
        context.set("tool.stderr", json!(stderr));
        context.set("tool.exit_code", json!(exit_code.to_string()));

        Ok(match output.status {
            CommandStatus::Exited(0) => Outcome::success_with(json!({
                "stdout": truncate_output(&output.stdout, TOOL_CONTEXT_CAP),
                "stderr": stderr,
                "exit_code": 0,
            })),
            CommandStatus::Exited(code) => {
                let tail = stderr_tail(&output.stderr);
                if tail.is_empty() {
                    Outcome::failure(format!("exit code {code}"))
                } else {
                    Outcome::failure(format!("exit code {code}: {tail}"))
                }
            }
            CommandStatus::TimedOut(timeout) => {
                Outcome::failure(format!("timed out after {}s", timeout.as_secs_f64()))
            }
            CommandStatus::Cancelled => Outcome::failure("cancelled"),
            CommandStatus::SpawnFailed(message) => Outcome::failure(message),
        })
    }
}

/// The last `STDERR_TAIL_BYTES` of stderr, cut on a char boundary, with
/// surrounding whitespace trimmed.
fn stderr_tail(stderr: &str) -> &str {
    let stderr = stderr.trim_end();
    let mut start = stderr.len().saturating_sub(STDERR_TAIL_BYTES);
    while !stderr.is_char_boundary(start) {
        start += 1;
    }
    stderr[start..].trim_start()
}

/// Write a command's full streams to `nodes/<id>/stdout.txt` and `stderr.txt`
/// under the run directory. Failing to write them doesn't fail the node.
fn write_output_files(run_dir: &Path, node_id: &str, output: &CommandOutput) {
    let dir = run_dir.join("nodes").join(node_id);
    let result = std::fs::create_dir_all(&dir)
        .and_then(|()| std::fs::write(dir.join("stdout.txt"), &output.stdout))
        .and_then(|()| std::fs::write(dir.join("stderr.txt"), &output.stderr));
    if let Err(e) = result {
        tracing::warn!(node_id, error = %e, "failed to write tool command output files");
    }
}

#[async_trait::async_trait]
impl Handler for ToolHandler {
    fn name(&self) -> &str {
        "tool"
    }

    async fn execute(&self, node: &GraphNode, context: &Context) -> Result<Outcome, HandlerError> {
        // Parse optional args attribute as JSON.
        let args = match node.attrs.get("args") {
            Some(NodeAttrValue::String(s)) => match serde_json::from_str::<Value>(s) {
                Ok(parsed) => parsed,
                Err(e) => {
                    return Ok(Outcome::failure(format!(
                        "invalid JSON in args attribute: {e}"
                    )));
                }
            },
            _ => json!({}),
        };

        let outcome = match (tool_attr(node), tool_command_attr(node)) {
            (Some(name), None) => self.run_builtin(node, name, args, context).await?,
            (None, Some(command)) => self.run_command(node, command, context).await?,
            (None, None) => {
                return Ok(Outcome::failure(format!(
                    "tool node '{}' needs a tool or tool_command attribute",
                    node.id
                )));
            }
            (Some(_), Some(_)) => {
                return Ok(Outcome::failure(format!(
                    "tool node '{}' sets both tool and tool_command; use one",
                    node.id
                )));
            }
        };

        // Store the result in context for downstream nodes.
        let serialized = match &outcome {
            Outcome::Success { data, .. } => json!({
                "status": "success",
                "data": data,
            }),
            Outcome::Failure {
                error, retryable, ..
            } => json!({
                "status": "failure",
                "error": error,
                "retryable": retryable,
            }),
            Outcome::PartialSuccess { data, .. } => json!({
                "status": "partial_success",
                "data": data,
            }),
            Outcome::Retry { reason, .. } => json!({
                "status": "retry",
                "reason": reason,
            }),
            Outcome::Skip { reason, .. } => json!({
                "status": "skip",
                "reason": reason,
            }),
        };
        context.set(format!("_tool_{}", node.id), serialized);

        Ok(outcome)
    }

    fn handles(&self, node_type: &NodeType) -> bool {
        matches!(node_type, NodeType::Tool)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tool_command::CommandConfig;
    use std::collections::HashMap;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use tokio_util::sync::CancellationToken;

    // -- Test helpers -------------------------------------------------------

    /// Build a minimal GraphNode with the given type and optional attributes.
    fn make_node(id: &str, node_type: NodeType) -> GraphNode {
        GraphNode {
            id: id.to_string(),
            node_type,
            label: None,
            attrs: HashMap::new(),
        }
    }

    /// Build a GraphNode with a label.
    fn make_node_with_label(id: &str, node_type: NodeType, label: &str) -> GraphNode {
        GraphNode {
            id: id.to_string(),
            node_type,
            label: Some(label.to_string()),
            attrs: HashMap::new(),
        }
    }

    /// A test ToolBackend that echoes the tool name and args back as success data.
    struct EchoToolBackend;

    #[async_trait::async_trait]
    impl ToolBackend for EchoToolBackend {
        async fn execute_tool(
            &self,
            tool_name: &str,
            args: &Value,
            _context: &Context,
        ) -> Result<Outcome, HandlerError> {
            Ok(Outcome::success_with(json!({
                "tool": tool_name,
                "args": args,
            })))
        }

        fn available_tools(&self) -> Vec<String> {
            vec!["echo".to_string(), "format".to_string()]
        }
    }

    /// A test ToolBackend that always returns a failure.
    struct FailingToolBackend;

    #[async_trait::async_trait]
    impl ToolBackend for FailingToolBackend {
        async fn execute_tool(
            &self,
            tool_name: &str,
            _args: &Value,
            _context: &Context,
        ) -> Result<Outcome, HandlerError> {
            Ok(Outcome::failure(format!("tool '{tool_name}' is broken")))
        }

        fn available_tools(&self) -> Vec<String> {
            vec![]
        }
    }

    /// A test ToolBackend that returns a HandlerError instead of an Outcome.
    struct ErroringToolBackend;

    #[async_trait::async_trait]
    impl ToolBackend for ErroringToolBackend {
        async fn execute_tool(
            &self,
            tool_name: &str,
            _args: &Value,
            _context: &Context,
        ) -> Result<Outcome, HandlerError> {
            Err(HandlerError::ExecutionFailed {
                handler: "tool".to_string(),
                node_id: "unknown".to_string(),
                message: format!("backend error for '{tool_name}'"),
            })
        }

        fn available_tools(&self) -> Vec<String> {
            vec![]
        }
    }

    /// A test ToolBackend that tracks invocation count.
    struct CountingToolBackend {
        call_count: AtomicUsize,
    }

    impl CountingToolBackend {
        fn new() -> Self {
            Self {
                call_count: AtomicUsize::new(0),
            }
        }

        fn count(&self) -> usize {
            self.call_count.load(Ordering::SeqCst)
        }
    }

    #[async_trait::async_trait]
    impl ToolBackend for CountingToolBackend {
        async fn execute_tool(
            &self,
            _tool_name: &str,
            _args: &Value,
            _context: &Context,
        ) -> Result<Outcome, HandlerError> {
            self.call_count.fetch_add(1, Ordering::SeqCst);
            Ok(Outcome::success())
        }

        fn available_tools(&self) -> Vec<String> {
            vec!["counter".to_string()]
        }
    }

    // ---------------------------------------------------------------
    // Test 1: ToolHandler delegates to backend
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_delegates_to_backend() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t1", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("echo".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["tool"], "echo");
                assert_eq!(data["args"], json!({}));
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // Test 2: ToolHandler with args attribute (JSON)
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_with_args_attribute() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t2", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("format".to_string()),
        );
        node.attrs.insert(
            "args".to_string(),
            NodeAttrValue::String(r#"{"input": "hello", "style": "bold"}"#.to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["tool"], "format");
                assert_eq!(data["args"]["input"], "hello");
                assert_eq!(data["args"]["style"], "bold");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn tool_handler_folds_model_and_provider_attrs_into_args() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t-model", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("format".to_string()),
        );
        node.attrs.insert(
            "model".to_string(),
            NodeAttrValue::String("claude-opus-4".to_string()),
        );
        node.attrs.insert(
            "provider".to_string(),
            NodeAttrValue::String("anthropic".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["args"]["model"], "claude-opus-4");
                assert_eq!(data["args"]["provider"], "anthropic");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn tool_handler_explicit_args_model_wins_over_node_attr() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t-model-override", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("format".to_string()),
        );
        node.attrs.insert(
            "args".to_string(),
            NodeAttrValue::String(r#"{"model": "gemma4:31b-cloud"}"#.to_string()),
        );
        node.attrs.insert(
            "model".to_string(),
            NodeAttrValue::String("claude-opus-4".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["args"]["model"], "gemma4:31b-cloud");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // Test 4: ToolHandler no tool returns failure
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_no_tool_returns_failure() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let node = make_node("t4", NodeType::Tool);

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert!(result.is_failure());
        match result {
            Outcome::Failure { error, .. } => {
                assert_eq!(
                    error,
                    "tool node 't4' needs a tool or tool_command attribute"
                );
            }
            other => panic!("expected failure, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // Test 5: ToolHandler handles only Tool nodes
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_handles_only_tool_nodes() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        assert!(handler.handles(&NodeType::Tool));
        assert!(!handler.handles(&NodeType::Start));
        assert!(!handler.handles(&NodeType::Exit));
        assert!(!handler.handles(&NodeType::Codergen));
        assert!(!handler.handles(&NodeType::Conditional));
        assert!(!handler.handles(&NodeType::Interviewer));
        assert!(!handler.handles(&NodeType::Parallel));
        assert!(!handler.handles(&NodeType::Manager));
        assert!(!handler.handles(&NodeType::Generic));
    }

    // ---------------------------------------------------------------
    // Test 6: ToolHandler stores result in context
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_stores_result_in_context() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t5", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("echo".to_string()),
        );

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        let stored = ctx.get("_tool_t5").expect("should have stored result");
        assert_eq!(stored["status"], "success");
        assert!(stored["data"].is_object());
    }

    // ---------------------------------------------------------------
    // Test 7: ToolBackend available_tools
    // ---------------------------------------------------------------

    #[test]
    fn tool_backend_available_tools() {
        let backend = EchoToolBackend;
        let tools = backend.available_tools();
        assert_eq!(tools.len(), 2);
        assert!(tools.contains(&"echo".to_string()));
        assert!(tools.contains(&"format".to_string()));
    }

    // ---------------------------------------------------------------
    // Test 8: ToolHandler with invalid JSON args returns failure
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_invalid_json_args_returns_failure() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t6", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("echo".to_string()),
        );
        node.attrs.insert(
            "args".to_string(),
            NodeAttrValue::String("{not valid json}".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert!(result.is_failure());
        match result {
            Outcome::Failure { error, .. } => {
                assert!(error.contains("invalid JSON in args attribute"));
            }
            other => panic!("expected failure, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // Test 9: ToolHandler name is correct
    // ---------------------------------------------------------------

    #[test]
    fn tool_handler_name_is_correct() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);
        assert_eq!(handler.name(), "tool");
    }

    // ---------------------------------------------------------------
    // Test 10: ToolHandler stores failure outcome in context
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_stores_failure_in_context() {
        let backend = Arc::new(FailingToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t7", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("broken".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert!(result.is_failure());

        let stored = ctx.get("_tool_t7").expect("should have stored result");
        assert_eq!(stored["status"], "failure");
        assert!(stored["error"].as_str().unwrap().contains("broken"));
    }

    // ---------------------------------------------------------------
    // Test 11: ToolHandler propagates HandlerError from backend
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_propagates_handler_error() {
        let backend = Arc::new(ErroringToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node("t8", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("crash".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            HandlerError::ExecutionFailed { message, .. } => {
                assert!(message.contains("backend error for 'crash'"));
            }
            other => panic!("expected ExecutionFailed, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // Test 13: ToolHandler invokes backend exactly once
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_handler_invokes_backend_once() {
        let backend = Arc::new(CountingToolBackend::new());
        let backend_trait: Arc<dyn ToolBackend> = Arc::clone(&backend) as Arc<dyn ToolBackend>;
        let handler = ToolHandler::new(backend_trait);

        let mut node = make_node("t10", NodeType::Tool);
        node.attrs.insert(
            "tool".to_string(),
            NodeAttrValue::String("counter".to_string()),
        );

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        assert_eq!(backend.count(), 1);
    }

    // ---------------------------------------------------------------
    // Test 14: Empty tools list from failing backend
    // ---------------------------------------------------------------

    #[test]
    fn failing_backend_has_no_available_tools() {
        let backend = FailingToolBackend;
        assert!(backend.available_tools().is_empty());
    }

    // ---------------------------------------------------------------
    // Node contract: tool, tool_command, neither, both
    // ---------------------------------------------------------------

    fn set_attr(node: &mut GraphNode, key: &str, value: &str) {
        node.attrs
            .insert(key.to_string(), NodeAttrValue::String(value.to_string()));
    }

    fn failure_message(outcome: &Outcome) -> &str {
        match outcome {
            Outcome::Failure { error, .. } => error,
            other => panic!("expected failure, got {other:?}"),
        }
    }

    /// A handler whose commands run in `dir` (both working dir and run root).
    fn command_handler(dir: &std::path::Path) -> (ToolHandler, Arc<CountingToolBackend>) {
        let backend = Arc::new(CountingToolBackend::new());
        let handler = ToolHandler::new(Arc::clone(&backend) as Arc<dyn ToolBackend>).with_commands(
            CommandConfig {
                working_dir: dir.to_path_buf(),
                run_dir: dir.to_path_buf(),
                cancel: CancellationToken::new(),
            },
        );
        (handler, backend)
    }

    fn command_node(id: &str, command: &str) -> GraphNode {
        let mut node = make_node(id, NodeType::Tool);
        set_attr(&mut node, "tool_command", command);
        node
    }

    #[tokio::test]
    async fn tool_handler_label_is_not_used_as_tool_name() {
        let backend = Arc::new(CountingToolBackend::new());
        let handler = ToolHandler::new(Arc::clone(&backend) as Arc<dyn ToolBackend>);

        let node = make_node_with_label("t3", NodeType::Tool, "counter");
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        assert_eq!(
            failure_message(&result),
            "tool node 't3' needs a tool or tool_command attribute"
        );
        assert_eq!(backend.count(), 0, "the label must not reach the backend");
    }

    #[tokio::test]
    async fn tool_handler_label_does_not_override_tool_attribute() {
        let backend = Arc::new(EchoToolBackend);
        let handler = ToolHandler::new(backend);

        let mut node = make_node_with_label("t9", NodeType::Tool, "label_tool");
        set_attr(&mut node, "tool", "attr_tool");
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        assert_eq!(result.data().unwrap()["tool"], "attr_tool");
    }

    #[tokio::test]
    async fn tool_handler_both_tool_and_tool_command_fail() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, backend) = command_handler(dir.path());

        let mut node = command_node("both", "touch ran");
        set_attr(&mut node, "tool", "counter");
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        assert_eq!(
            failure_message(&result),
            "tool node 'both' sets both tool and tool_command; use one"
        );
        assert_eq!(backend.count(), 0);
        assert!(!dir.path().join("ran").exists(), "the command must not run");
    }

    #[tokio::test]
    async fn tool_handler_empty_attributes_count_as_absent() {
        let backend = Arc::new(CountingToolBackend::new());
        let handler = ToolHandler::new(Arc::clone(&backend) as Arc<dyn ToolBackend>);

        let mut node = make_node("blank", NodeType::Tool);
        set_attr(&mut node, "tool", "  ");
        set_attr(&mut node, "tool_command", "");
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        assert_eq!(
            failure_message(&result),
            "tool node 'blank' needs a tool or tool_command attribute"
        );
        assert_eq!(backend.count(), 0);
    }

    #[tokio::test]
    async fn tool_handler_unknown_tool_reaches_unknown_tool_backend() {
        let backend = Arc::new(UnknownToolBackend::new(vec![
            "render_capture".to_string(),
            "system_lint".to_string(),
        ]));
        let handler = ToolHandler::new(backend);

        let mut node = make_node("u", NodeType::Tool);
        set_attr(&mut node, "tool", "nope");
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        assert_eq!(
            failure_message(&result),
            "unknown tool 'nope'; built-in tools are: render_capture, system_lint"
        );
        assert!(!result.is_retryable());
    }

    #[test]
    fn unknown_tool_backend_provides_no_tools() {
        assert!(
            UnknownToolBackend::new(vec!["system_lint".to_string()])
                .available_tools()
                .is_empty()
        );
    }

    #[tokio::test]
    async fn tool_handler_invalid_args_fail_before_running_a_command() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, _) = command_handler(dir.path());

        let mut node = command_node("bad_args", "touch ran");
        set_attr(&mut node, "args", "{not valid json}");
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        assert!(failure_message(&result).contains("invalid JSON in args attribute"));
        assert!(!dir.path().join("ran").exists());
    }

    #[tokio::test]
    async fn tool_handler_tool_command_without_command_config_is_a_bug() {
        let handler = ToolHandler::new(Arc::new(EchoToolBackend));
        let node = command_node("unwired", "true");
        let err = handler.execute(&node, &Context::new()).await.unwrap_err();
        assert!(err.to_string().contains("unwired"), "{err}");
    }

    // ---------------------------------------------------------------
    // tool_command results
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn tool_command_success_sets_context_keys_and_output_files() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, backend) = command_handler(dir.path());
        let ctx = Context::new();

        let node = command_node("Check", "printf 'clean\\n\\n'; echo warn >&2");
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert!(result.is_success(), "{result:?}");
        let data = result.data().unwrap();
        assert_eq!(data["stdout"], "clean\n\n");
        assert_eq!(data["stderr"], "warn\n");
        assert_eq!(data["exit_code"], 0);
        assert_eq!(backend.count(), 0, "a command never reaches the backend");

        assert_eq!(ctx.get_string("tool.output").unwrap(), "clean");
        assert_eq!(ctx.get_string("tool.stderr").unwrap(), "warn\n");
        assert_eq!(ctx.get_string("tool.exit_code").unwrap(), "0");
        assert_eq!(ctx.get("_tool_Check").unwrap()["status"], "success");

        let node_dir = dir.path().join("nodes").join("Check");
        assert_eq!(
            std::fs::read_to_string(node_dir.join("stdout.txt")).unwrap(),
            "clean\n\n"
        );
        assert_eq!(
            std::fs::read_to_string(node_dir.join("stderr.txt")).unwrap(),
            "warn\n"
        );
    }

    #[tokio::test]
    async fn tool_command_non_zero_exit_fails_and_still_sets_context() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, _) = command_handler(dir.path());
        let ctx = Context::new();

        let node = command_node("Check", "echo partial; echo broken >&2; exit 2");
        let result = handler.execute(&node, &ctx).await.unwrap();

        assert_eq!(failure_message(&result), "exit code 2: broken");
        assert!(!result.is_retryable());
        assert_eq!(ctx.get_string("tool.output").unwrap(), "partial");
        assert_eq!(ctx.get_string("tool.stderr").unwrap(), "broken\n");
        assert_eq!(ctx.get_string("tool.exit_code").unwrap(), "2");
        assert_eq!(ctx.get("_tool_Check").unwrap()["status"], "failure");
        assert!(dir.path().join("nodes/Check/stdout.txt").exists());
        assert!(dir.path().join("nodes/Check/stderr.txt").exists());
    }

    #[tokio::test]
    async fn tool_command_failure_without_stderr_names_only_the_exit_code() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, _) = command_handler(dir.path());
        let result = handler
            .execute(&command_node("Check", "exit 1"), &Context::new())
            .await
            .unwrap();
        assert_eq!(failure_message(&result), "exit code 1");
    }

    #[tokio::test]
    async fn tool_command_failure_message_keeps_the_last_2000_bytes_of_stderr() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, _) = command_handler(dir.path());

        // 3,000 two-byte characters, then a marker: the cut must land on a
        // char boundary.
        let node = command_node(
            "Check",
            "i=0; while [ $i -lt 3000 ]; do printf 'é' >&2; i=$((i+1)); done; echo END >&2; exit 1",
        );
        let result = handler.execute(&node, &Context::new()).await.unwrap();

        let message = failure_message(&result);
        let tail = message.strip_prefix("exit code 1: ").unwrap();
        assert!(tail.len() <= 2000, "tail is {} bytes", tail.len());
        assert!(tail.len() >= 1990, "tail is {} bytes", tail.len());
        assert!(tail.ends_with("END"));
    }

    #[tokio::test]
    async fn tool_command_context_values_are_capped_but_files_are_full() {
        let dir = tempfile::tempdir().unwrap();
        let (handler, _) = command_handler(dir.path());
        let ctx = Context::new();

        let node = command_node("Big", "head -c 150000 /dev/zero | tr '\\0' a");
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());

        let output = ctx.get_string("tool.output").unwrap();
        assert!(output.len() <= TOOL_CONTEXT_CAP, "{} bytes", output.len());
        assert!(output.contains("truncated"));
        assert_eq!(
            std::fs::read_to_string(dir.path().join("nodes/Big/stdout.txt"))
                .unwrap()
                .len(),
            150_000
        );
    }

    #[tokio::test]
    async fn tool_command_runs_in_working_dir_and_writes_files_under_run_dir() {
        let work = tempfile::tempdir().unwrap();
        let run = tempfile::tempdir().unwrap();
        let handler = ToolHandler::new(Arc::new(EchoToolBackend)).with_commands(CommandConfig {
            working_dir: work.path().to_path_buf(),
            run_dir: run.path().to_path_buf(),
            cancel: CancellationToken::new(),
        });
        let ctx = Context::new();

        let node = command_node("Where", "pwd -P; echo \"$SMASHER_RUN_DIR\"");
        handler.execute(&node, &ctx).await.unwrap();

        let output = ctx.get_string("tool.output").unwrap();
        let mut lines = output.lines();
        assert_eq!(
            std::path::Path::new(lines.next().unwrap()),
            work.path().canonicalize().unwrap()
        );
        assert_eq!(lines.next().unwrap(), run.path().display().to_string());
        assert!(run.path().join("nodes/Where/stdout.txt").exists());
        assert!(!work.path().join("nodes").exists());
    }

    #[tokio::test]
    async fn tool_command_timeout_accepts_number_numeric_string_and_duration() {
        let values = [
            NodeAttrValue::Number(0.2),
            NodeAttrValue::String("0.2".to_string()),
            NodeAttrValue::Duration(std::time::Duration::from_millis(200)),
        ];
        for value in values {
            let dir = tempfile::tempdir().unwrap();
            let (handler, _) = command_handler(dir.path());
            let ctx = Context::new();
            let mut node = command_node("Slow", "sleep 5");
            node.attrs.insert("timeout".to_string(), value.clone());

            let started = std::time::Instant::now();
            let result = handler.execute(&node, &ctx).await.unwrap();

            assert_eq!(
                failure_message(&result),
                "timed out after 0.2s",
                "timeout {value:?}"
            );
            assert!(started.elapsed() < std::time::Duration::from_secs(4));
            assert_eq!(ctx.get_string("tool.exit_code").unwrap(), "-1");
        }
    }

    #[test]
    fn tool_command_timeout_defaults_to_600_seconds() {
        let node = command_node("n", "true");
        assert_eq!(node_timeout(&node), Ok(std::time::Duration::from_secs(600)));
    }

    #[tokio::test]
    async fn tool_command_invalid_timeout_fails_naming_the_node() {
        for value in [
            NodeAttrValue::String("soon".to_string()),
            NodeAttrValue::Number(0.0),
            NodeAttrValue::Number(-5.0),
            NodeAttrValue::Bool(true),
        ] {
            let dir = tempfile::tempdir().unwrap();
            let (handler, _) = command_handler(dir.path());
            let mut node = command_node("Odd", "touch ran");
            node.attrs.insert("timeout".to_string(), value.clone());

            let result = handler.execute(&node, &Context::new()).await.unwrap();

            let message = failure_message(&result);
            assert!(
                message.starts_with("tool node 'Odd' has an invalid timeout"),
                "{value:?}: {message}"
            );
            assert!(!dir.path().join("ran").exists());
        }
    }

    #[tokio::test]
    async fn tool_command_cancellation_fails_with_cancelled() {
        let dir = tempfile::tempdir().unwrap();
        let cancel = CancellationToken::new();
        let handler = ToolHandler::new(Arc::new(EchoToolBackend)).with_commands(CommandConfig {
            working_dir: dir.path().to_path_buf(),
            run_dir: dir.path().to_path_buf(),
            cancel: cancel.clone(),
        });
        tokio::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            cancel.cancel();
        });

        let result = handler
            .execute(&command_node("Long", "sleep 30"), &Context::new())
            .await
            .unwrap();
        assert_eq!(failure_message(&result), "cancelled");
    }
}
