// ABOUTME: CodergenBackend that runs each codergen node through the local `claude` CLI.
// ABOUTME: Streams NDJSON events to the pipeline emitter and enforces a per-node timeout.

use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::AtomicU32;
use std::time::Duration;

use smasher_llm::provider::claude_cli::process::base_command;

use crate::events::{PipelineEvent, PipelineEventEmitter};
use crate::handler::{CodergenBackend, HandlerError};
use crate::state::{Context, Outcome};

/// CodergenBackend that spawns `claude` CLI as a subprocess.
///
/// Builds a combined prompt from pipeline context and the node prompt, then
/// runs `claude --dangerously-skip-permissions --print -p <prompt>` with a
/// wall-clock timeout. Captures stdout as the outcome text.
pub struct ClaudeCliBackend {
    working_dir: String,
    timeout: Duration,
    /// Override the path to the `claude` binary (for testing).
    claude_path: Option<String>,
    /// When true, use `--output-format stream-json` and parse NDJSON events line by line.
    streaming: bool,
    /// Optional emitter for forwarding parsed NDJSON events to the TUI pipeline bridge.
    emitter: Option<Arc<PipelineEventEmitter>>,
    /// Consecutive timeout counter shared across invocations. When this reaches
    /// `max_consecutive_timeouts`, the backend aborts the pipeline.
    consecutive_timeouts: Arc<AtomicU32>,
    max_consecutive_timeouts: u32,
}

#[async_trait::async_trait]
impl CodergenBackend for ClaudeCliBackend {
    async fn generate(
        &self,
        prompt: &str,
        // The model/provider parameters are intentionally not forwarded to the
        // claude CLI — the CLI uses its own model selection. Per-node
        // model/provider overrides only apply to the agent backend.
        _model: Option<&str>,
        _provider: Option<&str>,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        // Build context summary from pipeline state, same logic as AgentCodergenBackend.
        let context_summary = context.to_string_map();
        let system_parts: Vec<String> = context_summary
            .iter()
            .filter(|(k, _)| !k.starts_with('_'))
            .map(|(k, v)| format!("{k}: {v}"))
            .collect();

        let combined_prompt = if system_parts.is_empty() {
            prompt.to_string()
        } else {
            format!(
                "Pipeline context:\n{}\n\n{}",
                system_parts.join("\n"),
                prompt
            )
        };

        let claude_bin = self.claude_path.as_deref().unwrap_or("claude");

        // `base_command` strips env vars that cause the inner claude process to
        // detect a nested session and refuse to launch. The outer Claude Code
        // session sets these.
        let mut cmd = base_command(Path::new(claude_bin));
        cmd.arg("--dangerously-skip-permissions");

        if self.streaming {
            // Stream JSON mode: read NDJSON events line-by-line and emit PipelineEvents.
            // The claude CLI requires --verbose when using --output-format=stream-json.
            cmd.arg("--verbose")
                .arg("--output-format")
                .arg("stream-json");
        } else {
            // Print mode: collect all output at the end.
            cmd.arg("--print");
        }

        cmd.arg("-p")
            .arg(&combined_prompt)
            .current_dir(&self.working_dir)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| HandlerError::Other(format!("failed to spawn claude CLI: {e}")))?;

        if self.streaming {
            // Streaming path: read stdout line-by-line as NDJSON and emit PipelineEvents.
            // stderr is consumed in the background to prevent pipe buffer deadlock.
            let emitter = self.emitter.clone();
            let node_id = context.get_string("_current_node_id").unwrap_or_default();

            let stdout = child
                .stdout
                .take()
                .ok_or_else(|| HandlerError::Other("failed to get stdout handle".to_string()))?;
            let stderr_handle = child.stderr.take();

            let stderr_task = tokio::spawn(async move {
                let mut buf = Vec::new();
                if let Some(mut err) = stderr_handle {
                    tokio::io::AsyncReadExt::read_to_end(&mut err, &mut buf).await?;
                }
                Ok::<Vec<u8>, std::io::Error>(buf)
            });

            // Spawn NDJSON parsing as a task so it can run concurrently with child.wait().
            let stdout_task = tokio::spawn(async move {
                use tokio::io::AsyncBufReadExt;
                let reader = tokio::io::BufReader::new(stdout);
                let mut lines = reader.lines();
                let mut result_text: Option<String> = None;
                // Track cumulative token counts to emit deltas. Claude CLI reports
                // cumulative usage per assistant message, so we subtract the previous
                // cumulative value to get the incremental tokens for each step.
                let mut prev_input_tokens: u64 = 0;
                let mut prev_output_tokens: u64 = 0;
                // Deduplicate per-step token emissions by message ID (parallel tool
                // calls share the same ID with identical usage data).
                let mut seen_msg_ids: std::collections::HashSet<String> =
                    std::collections::HashSet::new();

                while let Some(line) = lines.next_line().await? {
                    let line = line.trim().to_string();
                    if line.is_empty() {
                        continue;
                    }
                    let Ok(obj) = serde_json::from_str::<serde_json::Value>(&line) else {
                        continue;
                    };
                    match obj.get("type").and_then(|v| v.as_str()) {
                        Some("assistant") => {
                            // Emit per-step token usage from the assistant message (deduped).
                            if let Some(ref emitter) = emitter {
                                let msg_id =
                                    obj["message"]["id"].as_str().unwrap_or("").to_string();
                                if !msg_id.is_empty() && seen_msg_ids.insert(msg_id) {
                                    let cumulative_in = obj["message"]["usage"]["input_tokens"]
                                        .as_u64()
                                        .unwrap_or(0);
                                    let cumulative_out = obj["message"]["usage"]["output_tokens"]
                                        .as_u64()
                                        .unwrap_or(0);
                                    // Emit the delta (increment since last message).
                                    let delta_in = cumulative_in.saturating_sub(prev_input_tokens);
                                    let delta_out =
                                        cumulative_out.saturating_sub(prev_output_tokens);
                                    prev_input_tokens = cumulative_in;
                                    prev_output_tokens = cumulative_out;
                                    if delta_in > 0 || delta_out > 0 {
                                        emitter.emit(PipelineEvent::AgentTokenUsage {
                                            node_id: node_id.clone(),
                                            input_tokens: delta_in,
                                            output_tokens: delta_out,
                                            cost_usd: 0.0,
                                            timestamp: chrono::Utc::now(),
                                        });
                                    }
                                }
                            }

                            let Some(content) = obj["message"]["content"].as_array() else {
                                continue;
                            };
                            for block in content {
                                match block.get("type").and_then(|v| v.as_str()) {
                                    Some("tool_use") => {
                                        let tool_name =
                                            block["name"].as_str().unwrap_or("").to_string();
                                        let tool_call_id =
                                            block["id"].as_str().unwrap_or("").to_string();
                                        let input_preview =
                                            smasher_agent::session::tool_input_preview_from_value(
                                                &tool_name,
                                                &block["input"],
                                            );
                                        if let Some(ref emitter) = emitter {
                                            emitter.emit(PipelineEvent::AgentToolCallStarted {
                                                node_id: node_id.clone(),
                                                tool_name,
                                                tool_call_id,
                                                input_preview,
                                                timestamp: chrono::Utc::now(),
                                            });
                                        }
                                    }
                                    Some("text") => {
                                        let text = block["text"].as_str().unwrap_or("").to_string();
                                        if let Some(ref emitter) = emitter {
                                            emitter.emit(PipelineEvent::AgentMessage {
                                                node_id: node_id.clone(),
                                                text,
                                                timestamp: chrono::Utc::now(),
                                            });
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                        Some("result") => {
                            result_text = Some(obj["result"].as_str().unwrap_or("").to_string());
                            // Emit final cost from the result line.
                            if let Some(ref emitter) = emitter {
                                let cost_usd = obj["total_cost_usd"].as_f64().unwrap_or(0.0);
                                if cost_usd > 0.0 {
                                    emitter.emit(PipelineEvent::AgentTokenUsage {
                                        node_id: node_id.clone(),
                                        input_tokens: 0,
                                        output_tokens: 0,
                                        cost_usd,
                                        timestamp: chrono::Utc::now(),
                                    });
                                }
                            }
                        }
                        _ => {}
                    }
                }

                Ok::<Option<String>, std::io::Error>(result_text)
            });

            let (status, result_text, stderr) = match tokio::time::timeout(self.timeout, async {
                let status = child.wait();
                let stdout_join = async { stdout_task.await.map_err(std::io::Error::other)? };
                let stderr_join = async { stderr_task.await.map_err(std::io::Error::other)? };
                let (status, result_text, stderr) =
                    tokio::try_join!(status, stdout_join, stderr_join)?;
                Ok::<(std::process::ExitStatus, Option<String>, Vec<u8>), std::io::Error>((
                    status,
                    result_text,
                    stderr,
                ))
            })
            .await
            {
                Ok(Ok(result)) => result,
                Ok(Err(e)) => {
                    return Err(HandlerError::Other(format!(
                        "failed to run claude CLI: {e}"
                    )));
                }
                Err(_) => {
                    let _ = child.kill().await;
                    return self.record_timeout();
                }
            };

            // Any non-timeout completion (success or error) resets the counter.
            self.consecutive_timeouts
                .store(0, std::sync::atomic::Ordering::Relaxed);

            if !status.success() {
                let stderr = String::from_utf8_lossy(&stderr);
                let code = status
                    .code()
                    .map(|c| c.to_string())
                    .unwrap_or_else(|| "unknown".to_string());
                return Err(HandlerError::Other(format!(
                    "claude CLI exit code {code}: {stderr}"
                )));
            }

            let text = result_text.unwrap_or_default();
            return Ok(Outcome::success_with(serde_json::json!({"response": text})));
        }

        // Non-streaming path: collect all stdout at the end.

        // Take stdout/stderr handles before waiting so we can read them
        // concurrently with the child process. Reading must happen in parallel
        // with wait(): if the child produces more output than the OS pipe
        // buffer (64KB on Linux, 16KB on macOS), the child blocks on write
        // and wait() never returns, causing a deadlock.
        let stdout_handle = child.stdout.take();
        let stderr_handle = child.stderr.take();

        let stdout_task = tokio::spawn(async move {
            let mut buf = Vec::new();
            if let Some(mut out) = stdout_handle {
                tokio::io::AsyncReadExt::read_to_end(&mut out, &mut buf).await?;
            }
            Ok::<Vec<u8>, std::io::Error>(buf)
        });

        let stderr_task = tokio::spawn(async move {
            let mut buf = Vec::new();
            if let Some(mut err) = stderr_handle {
                tokio::io::AsyncReadExt::read_to_end(&mut err, &mut buf).await?;
            }
            Ok::<Vec<u8>, std::io::Error>(buf)
        });

        let output = match tokio::time::timeout(self.timeout, async {
            let status = child.wait();
            let stdout_join = async { stdout_task.await.map_err(std::io::Error::other)? };
            let stderr_join = async { stderr_task.await.map_err(std::io::Error::other)? };
            let (status, stdout, stderr) = tokio::try_join!(status, stdout_join, stderr_join)?;
            Ok::<std::process::Output, std::io::Error>(std::process::Output {
                status,
                stdout,
                stderr,
            })
        })
        .await
        {
            Ok(Ok(output)) => output,
            Ok(Err(e)) => {
                return Err(HandlerError::Other(format!(
                    "failed to run claude CLI: {e}"
                )));
            }
            Err(_) => {
                let _ = child.kill().await;
                return self.record_timeout();
            }
        };

        // Any non-timeout completion (success or error) resets the counter.
        self.consecutive_timeouts
            .store(0, std::sync::atomic::Ordering::Relaxed);

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let code = output
                .status
                .code()
                .map(|c| c.to_string())
                .unwrap_or_else(|| "unknown".to_string());
            return Err(HandlerError::Other(format!(
                "claude CLI exit code {code}: {stderr}"
            )));
        }

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(Outcome::success_with(serde_json::json!({"response": text})))
    }
}

impl ClaudeCliBackend {
    /// A backend running `claude` from `PATH` in `working_dir`, in print mode, with
    /// no emitter and aborting after 3 consecutive timeouts.
    pub fn new(working_dir: impl Into<String>, timeout: Duration) -> Self {
        Self {
            working_dir: working_dir.into(),
            timeout,
            claude_path: None,
            streaming: false,
            emitter: None,
            consecutive_timeouts: Arc::new(AtomicU32::new(0)),
            max_consecutive_timeouts: 3,
        }
    }

    /// Use this `claude` binary instead of the one on `PATH`.
    pub fn with_claude_path(mut self, path: impl Into<String>) -> Self {
        self.claude_path = Some(path.into());
        self
    }

    /// Read `--output-format stream-json` events as they arrive and emit them.
    pub fn with_streaming(mut self, streaming: bool) -> Self {
        self.streaming = streaming;
        self
    }

    /// Forward parsed stream events to this emitter.
    pub fn with_emitter(mut self, emitter: Arc<PipelineEventEmitter>) -> Self {
        self.emitter = Some(emitter);
        self
    }

    /// Abort the pipeline after this many timeouts in a row (0 never aborts).
    pub fn with_max_consecutive_timeouts(mut self, max: u32) -> Self {
        self.max_consecutive_timeouts = max;
        self
    }

    /// Record a timeout. Returns `Ok(Outcome::failure(...))` for non-abort
    /// timeouts (so the engine can route to error edges or retry), and
    /// `Err(HandlerError)` when the consecutive threshold is reached (to
    /// kill the pipeline immediately).
    fn record_timeout(&self) -> Result<Outcome, HandlerError> {
        let count = self
            .consecutive_timeouts
            .fetch_add(1, std::sync::atomic::Ordering::Relaxed)
            + 1;
        if self.max_consecutive_timeouts > 0 && count >= self.max_consecutive_timeouts {
            Err(HandlerError::Other(format!(
                "aborting: {} consecutive timeouts ({}s each). \
                 Consider increasing --agent-timeout or simplifying node prompts.",
                count,
                self.timeout.as_secs()
            )))
        } else {
            Ok(Outcome::failure(format!(
                "claude CLI timed out after {}s ({}/{} consecutive timeouts)",
                self.timeout.as_secs(),
                count,
                self.max_consecutive_timeouts
            )))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ---- ClaudeCliBackend streaming mode tests ----

    #[tokio::test]
    async fn claude_cli_backend_streaming_uses_output_format_stream_json() {
        let tmp = tempfile::tempdir().unwrap();
        let args_file = tmp.path().join("captured_args.txt");
        let ndjson_file = tmp.path().join("output.ndjson");
        std::fs::write(
            &ndjson_file,
            "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"duration_ms\":1,\"result\":\"done\"}\n",
        )
        .unwrap();
        let script_path = tmp.path().join("claude");
        let script_content = format!(
            "#!/bin/sh\necho \"$@\" > {}\ncat {}\n",
            args_file.display(),
            ndjson_file.display()
        );
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_streaming(true)
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        backend
            .generate("test prompt", None, None, &ctx)
            .await
            .unwrap();

        let captured = std::fs::read_to_string(&args_file).unwrap();
        assert!(
            !captured.contains("--print"),
            "streaming mode should not pass --print, got: {captured}"
        );
        assert!(
            captured.contains("--output-format"),
            "streaming mode should pass --output-format, got: {captured}"
        );
        assert!(
            captured.contains("stream-json"),
            "streaming mode should use stream-json format, got: {captured}"
        );
    }

    #[tokio::test]
    async fn claude_cli_backend_streaming_returns_result_from_result_line() {
        let tmp = tempfile::tempdir().unwrap();
        let ndjson_file = tmp.path().join("output.ndjson");
        std::fs::write(
            &ndjson_file,
            concat!(
                "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"intermediate\"}]}}\n",
                "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"duration_ms\":100,\"result\":\"the final answer\"}\n"
            ),
        )
        .unwrap();
        let script_path = tmp.path().join("claude");
        let script_content = format!("#!/bin/sh\ncat {}\n", ndjson_file.display());
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_streaming(true)
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        let result = backend.generate("test", None, None, &ctx).await.unwrap();

        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                let response = data["response"].as_str().unwrap();
                assert_eq!(response, "the final answer");
            }
            other => panic!("expected success, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn claude_cli_backend_streaming_emits_agent_message_for_text_blocks() {
        let tmp = tempfile::tempdir().unwrap();
        let ndjson_file = tmp.path().join("output.ndjson");
        std::fs::write(
            &ndjson_file,
            concat!(
                "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"hello world\"}]}}\n",
                "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"duration_ms\":1,\"result\":\"hello world\"}\n"
            ),
        )
        .unwrap();
        let script_path = tmp.path().join("claude");
        let script_content = format!("#!/bin/sh\ncat {}\n", ndjson_file.display());
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let emitter = Arc::new(crate::events::PipelineEventEmitter::default());
        let mut rx = emitter.subscribe();

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_streaming(true)
        .with_emitter(Arc::clone(&emitter))
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        ctx.set("_current_node_id", serde_json::json!("node1"));
        backend.generate("test", None, None, &ctx).await.unwrap();
        drop(emitter);

        let mut agent_messages = Vec::new();
        while let Ok(event) = rx.try_recv() {
            if let crate::events::PipelineEvent::AgentMessage { text, node_id, .. } = event {
                agent_messages.push((text, node_id));
            }
        }

        assert_eq!(agent_messages.len(), 1, "expected one AgentMessage event");
        assert_eq!(agent_messages[0].0, "hello world");
        assert_eq!(agent_messages[0].1, "node1");
    }

    #[tokio::test]
    async fn claude_cli_backend_streaming_emits_tool_call_started_for_tool_use() {
        let tmp = tempfile::tempdir().unwrap();
        let ndjson_file = tmp.path().join("output.ndjson");
        std::fs::write(
            &ndjson_file,
            concat!(
                "{\"type\":\"assistant\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"tool_use\",\"id\":\"tc1\",\"name\":\"bash\",\"input\":{\"command\":\"ls\"}}]}}\n",
                "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"duration_ms\":1,\"result\":\"done\"}\n"
            ),
        )
        .unwrap();
        let script_path = tmp.path().join("claude");
        let script_content = format!("#!/bin/sh\ncat {}\n", ndjson_file.display());
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let emitter = Arc::new(crate::events::PipelineEventEmitter::default());
        let mut rx = emitter.subscribe();

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_streaming(true)
        .with_emitter(Arc::clone(&emitter))
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        ctx.set("_current_node_id", serde_json::json!("coder_node"));
        backend.generate("test", None, None, &ctx).await.unwrap();
        drop(emitter);

        let mut tool_starts = Vec::new();
        while let Ok(event) = rx.try_recv() {
            if let crate::events::PipelineEvent::AgentToolCallStarted {
                tool_name,
                tool_call_id,
                node_id,
                ..
            } = event
            {
                tool_starts.push((tool_name, tool_call_id, node_id));
            }
        }

        assert_eq!(
            tool_starts.len(),
            1,
            "expected one AgentToolCallStarted event"
        );
        assert_eq!(tool_starts[0].0, "bash");
        assert_eq!(tool_starts[0].1, "tc1");
        assert_eq!(tool_starts[0].2, "coder_node");
    }

    // ---- Backend flag tests ----

    // ---- ClaudeCliBackend tests ----

    #[tokio::test]
    async fn claude_cli_backend_captures_stdout_as_response() {
        let tmp = tempfile::tempdir().unwrap();
        let script_path = tmp.path().join("claude");
        std::fs::write(&script_path, "#!/bin/sh\necho \"hello from fake claude\"\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        let result = backend
            .generate("test prompt", None, None, &ctx)
            .await
            .unwrap();

        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                let response = data["response"].as_str().unwrap();
                assert_eq!(response, "hello from fake claude");
            }
            other => panic!("expected success, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn claude_cli_backend_passes_prompt_to_process() {
        let tmp = tempfile::tempdir().unwrap();
        // Script that writes all args to a file so we can inspect them.
        let args_file = tmp.path().join("captured_args.txt");
        let script_path = tmp.path().join("claude");
        let script_content = format!(
            "#!/bin/sh\necho \"$@\" > {}\necho \"done\"\n",
            args_file.display()
        );
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        backend
            .generate("my special prompt", None, None, &ctx)
            .await
            .unwrap();

        let captured = std::fs::read_to_string(&args_file).unwrap();
        assert!(
            captured.contains("--dangerously-skip-permissions"),
            "should pass --dangerously-skip-permissions, got: {captured}"
        );
        assert!(
            captured.contains("--print"),
            "should pass --print, got: {captured}"
        );
        assert!(
            captured.contains("-p"),
            "should pass -p flag, got: {captured}"
        );
    }

    #[tokio::test]
    async fn claude_cli_backend_returns_error_on_nonzero_exit() {
        let tmp = tempfile::tempdir().unwrap();
        let script_path = tmp.path().join("claude");
        std::fs::write(&script_path, "#!/bin/sh\nexit 1\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        let result = backend.generate("test prompt", None, None, &ctx).await;

        assert!(result.is_err(), "non-zero exit should produce an error");
        let err = result.unwrap_err();
        let msg = err.to_string();
        assert!(
            msg.contains("exit"),
            "error should mention exit code, got: {msg}"
        );
    }

    #[tokio::test]
    async fn claude_cli_backend_times_out() {
        let tmp = tempfile::tempdir().unwrap();
        let script_path = tmp.path().join("claude");
        // Script that sleeps longer than our timeout.
        std::fs::write(&script_path, "#!/bin/sh\nsleep 30\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_millis(100),
        )
        .with_claude_path(script_path.display().to_string())
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        let result = backend.generate("test prompt", None, None, &ctx).await;

        // Non-abort timeout returns Ok(Outcome::failure), not Err
        let outcome = result.expect("timeout should return Ok(failure), not Err");
        assert!(
            outcome.is_failure(),
            "timeout should produce a failure outcome"
        );
        let msg = format!("{outcome:?}");
        assert!(
            msg.to_lowercase().contains("timeout") || msg.to_lowercase().contains("timed out"),
            "outcome should mention timeout, got: {msg}"
        );
    }

    #[tokio::test]
    async fn claude_cli_backend_consecutive_timeouts_abort() {
        let tmp = tempfile::tempdir().unwrap();
        let script_path = tmp.path().join("claude");
        std::fs::write(&script_path, "#!/bin/sh\nsleep 30\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_millis(100),
        )
        .with_claude_path(script_path.display().to_string())
        .with_max_consecutive_timeouts(2);

        let ctx = crate::state::Context::new();

        // First timeout: returns Ok(failure) with "1/2"
        let outcome1 = backend.generate("test", None, None, &ctx).await.unwrap();
        assert!(outcome1.is_failure());
        let msg1 = format!("{outcome1:?}");
        assert!(
            msg1.contains("1/2"),
            "first timeout should show 1/2, got: {msg1}"
        );

        // Second timeout: triggers abort (returns Err)
        let err2 = backend
            .generate("test", None, None, &ctx)
            .await
            .unwrap_err()
            .to_string();
        assert!(
            err2.contains("aborting"),
            "second timeout should abort, got: {err2}"
        );
    }

    #[tokio::test]
    async fn claude_cli_backend_includes_context_in_prompt() {
        let tmp = tempfile::tempdir().unwrap();
        // Script that writes the prompt arg (everything after -p) to a file.
        let prompt_file = tmp.path().join("captured_prompt.txt");
        let script_path = tmp.path().join("claude");
        // Capture the argument after -p.
        let script_content = format!(
            "#!/bin/sh\nwhile [ $# -gt 0 ]; do\n  if [ \"$1\" = \"-p\" ]; then\n    shift\n    echo \"$1\" > {}\n    break\n  fi\n  shift\ndone\necho \"done\"\n",
            prompt_file.display()
        );
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let backend = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script_path.display().to_string())
        .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        ctx.set("project_name", serde_json::json!("my_project"));
        ctx.set("_internal", serde_json::json!("hidden"));

        backend
            .generate("do the thing", None, None, &ctx)
            .await
            .unwrap();

        let captured = std::fs::read_to_string(&prompt_file).unwrap();
        assert!(
            captured.contains("project_name"),
            "prompt should include context key, got: {captured}"
        );
        assert!(
            captured.contains("my_project"),
            "prompt should include context value, got: {captured}"
        );
        assert!(
            !captured.contains("_internal"),
            "prompt should NOT include underscore-prefixed keys, got: {captured}"
        );
        assert!(
            captured.contains("do the thing"),
            "prompt should include original prompt, got: {captured}"
        );
    }

    #[tokio::test]
    async fn claude_cli_backend_sets_working_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let pwd_file = tmp.path().join("captured_pwd.txt");
        let script_path = tmp.path().join("claude");
        let script_content = format!("#!/bin/sh\npwd > {}\necho \"done\"\n", pwd_file.display());
        std::fs::write(&script_path, script_content).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&script_path, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let work_dir = tmp.path().display().to_string();
        let backend = ClaudeCliBackend::new(work_dir.clone(), std::time::Duration::from_secs(10))
            .with_claude_path(script_path.display().to_string())
            .with_max_consecutive_timeouts(3);

        let ctx = crate::state::Context::new();
        backend.generate("test", None, None, &ctx).await.unwrap();

        let captured_pwd = std::fs::read_to_string(&pwd_file).unwrap();
        let captured_pwd = captured_pwd.trim();
        // Resolve symlinks for comparison (macOS /tmp -> /private/tmp).
        let expected = std::fs::canonicalize(tmp.path()).unwrap();
        let actual = std::fs::canonicalize(captured_pwd).unwrap();
        assert_eq!(actual, expected, "working dir should match");
    }

    // ---- TUI flag tests ----
    /// A fake `claude` that records its argv, NUL-separated, to `argv.txt` and prints
    /// a successful stream-json result.
    fn argv_recording_claude(dir: &std::path::Path) -> std::path::PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let script = dir.join("claude");
        let result = r#"{"type":"result","subtype":"success","is_error":false,"result":"ok"}"#;
        std::fs::write(
            &script,
            format!(
                "#!/bin/sh\nprintf '%s\\0' \"$@\" > '{}/argv.txt'\necho '{result}'\n",
                dir.display()
            ),
        )
        .unwrap();
        std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
        script
    }

    fn recorded_argv(dir: &std::path::Path) -> Vec<String> {
        std::fs::read_to_string(dir.join("argv.txt"))
            .unwrap()
            .split_terminator('\0')
            .map(String::from)
            .collect()
    }

    #[tokio::test]
    async fn claude_cli_backend_exact_argv_in_both_modes() {
        let tmp = tempfile::tempdir().unwrap();
        let script = argv_recording_claude(tmp.path());
        let ctx = crate::state::Context::new();

        let streaming = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script.display().to_string())
        .with_streaming(true);
        streaming.generate("do it", None, None, &ctx).await.unwrap();
        assert_eq!(
            recorded_argv(tmp.path()),
            vec![
                "--dangerously-skip-permissions",
                "--verbose",
                "--output-format",
                "stream-json",
                "-p",
                "do it",
            ]
        );

        let print = ClaudeCliBackend::new(
            tmp.path().display().to_string(),
            std::time::Duration::from_secs(10),
        )
        .with_claude_path(script.display().to_string());
        print.generate("do it", None, None, &ctx).await.unwrap();
        assert_eq!(
            recorded_argv(tmp.path()),
            vec!["--dangerously-skip-permissions", "--print", "-p", "do it"]
        );
    }
}
