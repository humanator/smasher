// ABOUTME: ProviderAdapter that answers single-turn, tool-less requests by spawning `claude -p`.
// ABOUTME: Sends one stream-json user message and builds the Response from the final result event.

use std::path::PathBuf;
use std::process::Stdio;

use async_trait::async_trait;
use serde_json::{Value, json};
use tokio::io::AsyncWriteExt;

use super::process::base_command;
use crate::provider::{ProviderAdapter, StreamResponse};
use crate::types::{ContentPart, Error, FinishReason, Request, Response, Role, StreamEvent, Usage};

const PROVIDER: &str = "claude-cli";

/// Sent when the request has no system prompt, so Claude Code's own ~59k-token
/// agent prompt is never used for single-call work.
pub const DEFAULT_SYSTEM_PROMPT: &str =
    "You are a helpful assistant. Answer the user's request directly.";

/// Adapter over the local Claude Code CLI. Each request is one `claude -p` process.
pub struct ClaudeCliAdapter {
    binary: PathBuf,
}

impl ClaudeCliAdapter {
    pub fn new(binary: impl Into<PathBuf>) -> Self {
        Self {
            binary: binary.into(),
        }
    }
}

#[async_trait]
impl ProviderAdapter for ClaudeCliAdapter {
    fn provider_name(&self) -> &str {
        PROVIDER
    }

    async fn complete(&self, request: &Request) -> Result<Response, Error> {
        if request.tools.as_ref().is_some_and(|t| !t.is_empty()) {
            return Err(Error::InvalidRequest {
                provider: PROVIDER.into(),
                message: "the claude-cli provider answers single calls and can't run tools; \
                          use the claude-cli codergen backend for agent work"
                    .into(),
            });
        }

        let mut child = base_command(&self.binary)
            .args(build_args(request))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| Error::ConfigurationError {
                message: format!(
                    "failed to start the claude CLI at {}: {e}",
                    self.binary.display()
                ),
            })?;

        let mut input = build_input(request).to_string();
        input.push('\n');
        // Written concurrently with reading stdout, so a large image can't deadlock
        // against a full stdout pipe. Dropping stdin afterwards closes it.
        if let Some(mut stdin) = child.stdin.take() {
            tokio::spawn(async move {
                // A write error means the process already exited; its output says why.
                let _ = stdin.write_all(input.as_bytes()).await;
            });
        }

        let output = child.wait_with_output().await.map_err(|e| Error::Other {
            message: format!("failed waiting for the claude CLI: {e}"),
            retryable: false,
        })?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        let Some(result) = find_result_event(&stdout) else {
            if !output.status.success() {
                return Err(cli_error(&format!(
                    "claude CLI exited with {}: {}",
                    output.status,
                    stderr.trim()
                )));
            }
            return Err(Error::ResponseParse {
                provider: PROVIDER.into(),
                message: "claude CLI finished without a result event".into(),
            });
        };

        if result["is_error"].as_bool().unwrap_or(false) || !output.status.success() {
            let text = result["result"].as_str().unwrap_or("unknown error");
            return Err(cli_error(&format!("{text} {}", stderr.trim())));
        }

        Ok(build_response(request, result))
    }

    async fn stream(&self, request: &Request) -> Result<StreamResponse, Error> {
        // Token streaming is out of scope: run the call and replay it as a short stream.
        let response = self.complete(request).await?;
        let events = vec![
            Ok(StreamEvent::start(&response.id, &response.model)),
            Ok(StreamEvent::text_delta(response.text().unwrap_or_default())),
            Ok(StreamEvent::end(
                response.finish_reason.clone(),
                Some(response.usage.clone()),
            )),
        ];
        Ok(Box::pin(futures::stream::iter(events)))
    }
}

/// Flags for a single, tool-less call with Claude Code's own context trimmed away.
fn build_args(request: &Request) -> Vec<String> {
    let mut args: Vec<String> = [
        "-p",
        "--input-format",
        "stream-json",
        "--output-format",
        "stream-json",
        "--verbose",
        "--tools",
        "",
        "--permission-mode",
        "dontAsk",
        "--strict-mcp-config",
        "--setting-sources",
        "",
        "--no-session-persistence",
    ]
    .map(String::from)
    .to_vec();

    args.push("--system-prompt".into());
    args.push(system_prompt(request));

    if !request.model.is_empty() {
        args.push("--model".into());
        args.push(request.model.clone());
    }
    args
}

/// `request.system_prompt` plus any system/developer messages, or the neutral default.
fn system_prompt(request: &Request) -> String {
    let parts: Vec<String> = request
        .system_prompt
        .iter()
        .cloned()
        .chain(
            request
                .messages
                .iter()
                .filter(|m| matches!(m.role, Role::System | Role::Developer))
                .filter_map(|m| m.text()),
        )
        .filter(|p| !p.trim().is_empty())
        .collect();
    if parts.is_empty() {
        DEFAULT_SYSTEM_PROMPT.to_string()
    } else {
        parts.join("\n\n")
    }
}

/// One stream-json user message carrying the conversation's content.
fn build_input(request: &Request) -> Value {
    let content: Vec<Value> = request
        .messages
        .iter()
        .filter(|m| !matches!(m.role, Role::System | Role::Developer))
        .flat_map(|m| m.content.iter())
        .filter_map(content_block)
        .collect();
    json!({
        "type": "user",
        "message": {"role": "user", "content": content}
    })
}

fn content_block(part: &ContentPart) -> Option<Value> {
    match part {
        ContentPart::Text { text } => Some(json!({"type": "text", "text": text})),
        _ => None,
    }
}

/// The last `result` event in the NDJSON output.
fn find_result_event(stdout: &str) -> Option<Value> {
    stdout
        .lines()
        .rev()
        .filter_map(|line| serde_json::from_str::<Value>(line.trim()).ok())
        .find(|v| v["type"] == "result")
}

fn build_response(request: &Request, result: Value) -> Response {
    let text = result["result"].as_str().unwrap_or_default().to_string();
    let model = result["modelUsage"]
        .as_object()
        .and_then(|m| m.keys().next().cloned())
        .unwrap_or_else(|| request.model.clone());
    Response {
        id: result["session_id"]
            .as_str()
            .map(String::from)
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        model,
        content: vec![ContentPart::Text { text }],
        finish_reason: Some(FinishReason::Stop),
        usage: usage_from(&result["modelUsage"]),
        warnings: Vec::new(),
        rate_limit: None,
        provider: Some(PROVIDER.into()),
        raw: Some(result),
    }
}

/// Sums `modelUsage` across models (the CLI may use more than one per call).
fn usage_from(model_usage: &Value) -> Usage {
    let sum = |field: &str| -> u32 {
        model_usage
            .as_object()
            .map(|m| m.values().filter_map(|u| u[field].as_u64()).sum::<u64>())
            .unwrap_or(0) as u32
    };
    let input_tokens = sum("inputTokens");
    let output_tokens = sum("outputTokens");
    Usage {
        input_tokens,
        output_tokens,
        cache_read_tokens: Some(sum("cacheReadInputTokens")),
        cache_creation_tokens: Some(sum("cacheCreationInputTokens")),
        reasoning_tokens: None,
        total_tokens: Some(input_tokens + output_tokens),
        raw: Some(model_usage.clone()),
    }
}

/// CLI failures are never retried: each attempt is a paid call. A login problem is
/// reported as authentication so the UI can point at `claude login`.
fn cli_error(message: &str) -> Error {
    let lower = message.to_lowercase();
    if lower.contains("not logged in")
        || lower.contains("/login")
        || lower.contains("invalid api key")
    {
        return Error::Authentication {
            provider: PROVIDER.into(),
            message: format!("{} (run `claude login`)", message.trim()),
        };
    }
    Error::Other {
        message: format!("claude-cli: {}", message.trim()),
        retryable: false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Message, ToolDefinition};
    use futures::StreamExt;
    use serde_json::json;
    use std::os::unix::fs::PermissionsExt;
    use std::path::Path;

    /// A fake `claude` that records argv (NUL-separated) and stdin next to itself,
    /// prints `stdout` and `stderr`, and exits with `code`.
    fn fake_claude(dir: &Path, stdout: &str, stderr: &str, code: i32) -> PathBuf {
        std::fs::write(dir.join("stdout.txt"), stdout).unwrap();
        std::fs::write(dir.join("stderr.txt"), stderr).unwrap();
        let d = dir.display();
        let script = format!(
            "#!/bin/sh\nprintf '%s\\0' \"$@\" > '{d}/argv.txt'\ncat > '{d}/stdin.txt'\ncat '{d}/stdout.txt'\ncat '{d}/stderr.txt' >&2\nexit {code}\n"
        );
        let path = dir.join("claude");
        std::fs::write(&path, script).unwrap();
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
        path
    }

    fn argv(dir: &Path) -> Vec<String> {
        std::fs::read_to_string(dir.join("argv.txt"))
            .unwrap()
            .split_terminator('\0')
            .map(String::from)
            .collect()
    }

    fn stdin_json(dir: &Path) -> serde_json::Value {
        let raw = std::fs::read_to_string(dir.join("stdin.txt")).unwrap();
        let mut lines = raw.lines().filter(|l| !l.trim().is_empty());
        let first = lines.next().expect("stdin was empty");
        assert!(lines.next().is_none(), "expected exactly one stdin message");
        serde_json::from_str(first).unwrap()
    }

    fn result_line(result: &str) -> String {
        json!({
            "type": "result",
            "subtype": "success",
            "is_error": false,
            "result": result,
            "session_id": "sess-1",
            "total_cost_usd": 0.004,
            "modelUsage": {
                "claude-sonnet-5": {
                    "inputTokens": 12,
                    "outputTokens": 5,
                    "cacheReadInputTokens": 100,
                    "cacheCreationInputTokens": 900,
                    "costUSD": 0.004
                }
            }
        })
        .to_string()
    }

    fn ok_stdout(result: &str) -> String {
        let init = json!({"type": "system", "subtype": "init", "session_id": "sess-1"});
        let assistant = json!({
            "type": "assistant",
            "message": {"content": [{"type": "text", "text": result}]}
        });
        format!("{init}\n{assistant}\n{}\n", result_line(result))
    }

    fn arg_after<'a>(args: &'a [String], flag: &str) -> Option<&'a str> {
        args.iter()
            .position(|a| a == flag)
            .and_then(|i| args.get(i + 1))
            .map(String::as_str)
    }

    #[tokio::test]
    async fn sends_isolation_flags_system_prompt_and_model() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req =
            Request::new("claude-sonnet-5", vec![Message::user("ping")]).system_prompt("Be terse.");

        adapter.complete(&req).await.unwrap();

        let args = argv(dir.path());
        assert_eq!(
            args,
            vec![
                "-p",
                "--input-format",
                "stream-json",
                "--output-format",
                "stream-json",
                "--verbose",
                "--tools",
                "",
                "--permission-mode",
                "dontAsk",
                "--strict-mcp-config",
                "--setting-sources",
                "",
                "--no-session-persistence",
                "--system-prompt",
                "Be terse.",
                "--model",
                "claude-sonnet-5",
            ]
        );
    }

    #[tokio::test]
    async fn default_system_prompt_when_none_given() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        adapter.complete(&req).await.unwrap();

        let args = argv(dir.path());
        assert_eq!(
            arg_after(&args, "--system-prompt"),
            Some(DEFAULT_SYSTEM_PROMPT)
        );
    }

    #[tokio::test]
    async fn system_messages_join_the_system_prompt() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new(
            "claude-sonnet-5",
            vec![Message::system("From messages"), Message::user("ping")],
        )
        .system_prompt("From field");

        adapter.complete(&req).await.unwrap();

        let args = argv(dir.path());
        assert_eq!(
            arg_after(&args, "--system-prompt"),
            Some("From field\n\nFrom messages")
        );
    }

    #[tokio::test]
    async fn user_text_goes_to_stdin_as_one_stream_json_message() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        adapter.complete(&req).await.unwrap();

        assert_eq!(
            stdin_json(dir.path()),
            json!({
                "type": "user",
                "message": {
                    "role": "user",
                    "content": [{"type": "text", "text": "ping"}]
                }
            })
        );
    }

    #[tokio::test]
    async fn response_text_and_usage_come_from_result_event() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let resp = adapter.complete(&req).await.unwrap();

        assert_eq!(resp.text().as_deref(), Some("pong"));
        assert_eq!(resp.model, "claude-sonnet-5");
        assert_eq!(resp.provider.as_deref(), Some("claude-cli"));
        assert_eq!(resp.usage.input_tokens, 12);
        assert_eq!(resp.usage.output_tokens, 5);
        assert_eq!(resp.usage.cache_read_tokens, Some(100));
        assert_eq!(resp.usage.cache_creation_tokens, Some(900));
        assert_eq!(resp.usage.total_tokens, Some(17));
    }

    #[tokio::test]
    async fn usage_sums_across_models() {
        let dir = tempfile::tempdir().unwrap();
        let line = json!({
            "type": "result", "subtype": "success", "is_error": false, "result": "ok",
            "modelUsage": {
                "claude-sonnet-5": {"inputTokens": 10, "outputTokens": 2,
                    "cacheReadInputTokens": 0, "cacheCreationInputTokens": 50},
                "claude-haiku-4-5": {"inputTokens": 3, "outputTokens": 1,
                    "cacheReadInputTokens": 7, "cacheCreationInputTokens": 0}
            }
        });
        let bin = fake_claude(dir.path(), &format!("{line}\n"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("sonnet", vec![Message::user("ping")]);

        let resp = adapter.complete(&req).await.unwrap();

        assert_eq!(resp.usage.input_tokens, 13);
        assert_eq!(resp.usage.output_tokens, 3);
        assert_eq!(resp.usage.cache_read_tokens, Some(7));
        assert_eq!(resp.usage.cache_creation_tokens, Some(50));
    }

    #[tokio::test]
    async fn missing_binary_is_a_non_retryable_error() {
        let dir = tempfile::tempdir().unwrap();
        let adapter = ClaudeCliAdapter::new(dir.path().join("no-such-claude"));
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let err = adapter.complete(&req).await.unwrap_err();

        assert!(matches!(err, Error::ConfigurationError { .. }), "{err:?}");
        assert!(err.to_string().contains("no-such-claude"));
        assert!(!err.retryable());
    }

    #[tokio::test]
    async fn non_zero_exit_carries_stderr() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), "", "boom: something broke", 2);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let err = adapter.complete(&req).await.unwrap_err();

        assert!(err.to_string().contains("boom: something broke"), "{err}");
        assert!(!err.retryable());
    }

    #[tokio::test]
    async fn is_error_result_is_an_error() {
        let dir = tempfile::tempdir().unwrap();
        let line = json!({
            "type": "result", "subtype": "error_during_execution",
            "is_error": true, "result": "model overloaded"
        });
        let bin = fake_claude(dir.path(), &format!("{line}\n"), "", 1);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let err = adapter.complete(&req).await.unwrap_err();

        assert!(err.to_string().contains("model overloaded"), "{err}");
        assert!(!err.retryable());
    }

    #[tokio::test]
    async fn not_logged_in_is_an_authentication_error() {
        let dir = tempfile::tempdir().unwrap();
        let line = json!({
            "type": "result", "subtype": "success", "is_error": true,
            "result": "Not logged in · Please run /login"
        });
        let bin = fake_claude(dir.path(), &format!("{line}\n"), "", 1);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let err = adapter.complete(&req).await.unwrap_err();

        match &err {
            Error::Authentication { provider, message } => {
                assert_eq!(provider, "claude-cli");
                assert!(message.contains("claude login"), "{message}");
            }
            other => panic!("expected Authentication, got {other:?}"),
        }
        assert!(!err.retryable());
    }

    #[tokio::test]
    async fn exit_zero_without_result_event_is_a_parse_error() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), "{\"type\":\"system\"}\nnot json\n", "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let err = adapter.complete(&req).await.unwrap_err();

        assert!(matches!(err, Error::ResponseParse { .. }), "{err:?}");
    }

    #[tokio::test]
    async fn request_with_tools_is_rejected_without_spawning() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let tool = ToolDefinition {
            name: "lookup".into(),
            description: "look something up".into(),
            parameters: json!({"type": "object"}),
        };
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]).tools(vec![tool]);

        let err = adapter.complete(&req).await.unwrap_err();

        assert!(matches!(err, Error::InvalidRequest { .. }), "{err:?}");
        assert!(!err.retryable());
        assert!(!dir.path().join("argv.txt").exists());
    }

    #[tokio::test]
    async fn stream_emits_start_text_and_finish() {
        let dir = tempfile::tempdir().unwrap();
        let bin = fake_claude(dir.path(), &ok_stdout("pong"), "", 0);
        let adapter = ClaudeCliAdapter::new(&bin);
        let req = Request::new("claude-sonnet-5", vec![Message::user("ping")]);

        let events: Vec<_> = adapter
            .stream(&req)
            .await
            .unwrap()
            .map(|e| e.unwrap())
            .collect()
            .await;

        use crate::types::StreamEventType as T;
        let kinds: Vec<_> = events.iter().map(|e| e.event_type).collect();
        assert_eq!(kinds.first(), Some(&T::Start));
        assert_eq!(kinds.last(), Some(&T::End));
        let text: String = events.iter().filter_map(|e| e.text_delta.clone()).collect();
        assert_eq!(text, "pong");
        let end = events.last().unwrap();
        assert_eq!(end.usage.as_ref().map(|u| u.output_tokens), Some(5));
    }
}
