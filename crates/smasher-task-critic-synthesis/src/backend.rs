// ABOUTME: TaskCriticSynthesisToolBackend: ToolBackend impl dispatching "task_critic" and
// ABOUTME: "synthesis" natively. Falls back to a wrapped Arc<dyn ToolBackend> for everything else.

use std::path::Path;
use std::sync::Arc;

use serde::Serialize;
use serde_json::{Value, json};
use smasher_attractor::handler::HandlerError;
use smasher_attractor::state::{Context, Outcome};
use smasher_attractor::tool_handler::ToolBackend;
use smasher_llm::client::Client;

use crate::report::artifact_dir;
use crate::{synthesis, task_critic};

/// Writes `report` as pretty JSON to `output_dir/filename`, creating `output_dir`
/// first. Returns a plain error message (never a `HandlerError`/`Outcome`) on any
/// I/O/serialization problem, letting the caller decide how to surface it.
fn write_report_artifact<T: Serialize>(
    output_dir: &Path,
    filename: &str,
    report: &T,
) -> Result<(), String> {
    std::fs::create_dir_all(output_dir).map_err(|e| {
        format!(
            "failed to create artifact dir {}: {e}",
            output_dir.display()
        )
    })?;

    let report_path = output_dir.join(filename);
    let json_body = serde_json::to_string_pretty(report)
        .map_err(|e| format!("failed to serialize report: {e}"))?;
    std::fs::write(&report_path, json_body)
        .map_err(|e| format!("failed to write {}: {e}", report_path.display()))?;

    Ok(())
}

/// Dispatches `"task_critic"` and `"synthesis"` to their native implementations,
/// falling back to `fallback` (typically the wrapped `SystemLintToolBackend`) for
/// every other tool name.
pub struct TaskCriticSynthesisToolBackend {
    fallback: Arc<dyn ToolBackend>,
    client: Client,
    task_critic_model: String,
    synthesis_model: String,
    default_provider: Option<String>,
    artifacts_base: std::path::PathBuf,
}

impl TaskCriticSynthesisToolBackend {
    /// `artifacts_base` is the current run's own artifact directory — see
    /// `smasher_render_capture::backend::HybridToolBackend::new`. `default_provider`
    /// is the pipeline-wide provider override (e.g. `"ollama"`, needed when
    /// `task_critic_model`/`synthesis_model` aren't inferable by name); a node's own
    /// `args["provider"]` still takes precedence over it.
    pub fn new(
        fallback: Arc<dyn ToolBackend>,
        task_critic_model: String,
        synthesis_model: String,
        default_provider: Option<String>,
        artifacts_base: std::path::PathBuf,
    ) -> Self {
        Self {
            fallback,
            client: Client::from_env(),
            task_critic_model,
            synthesis_model,
            default_provider,
            artifacts_base,
        }
    }

    async fn run_task_critic(&self, args: &Value) -> Result<Outcome, HandlerError> {
        let candidate_id = args
            .get("candidate_id")
            .and_then(Value::as_str)
            .unwrap_or("");
        let output_dir = artifact_dir(&self.artifacts_base, candidate_id);

        let report = match task_critic::run_task_critic(
            &self.client,
            &self.task_critic_model,
            self.default_provider.as_deref(),
            &output_dir,
            args,
        )
        .await
        {
            Ok(report) => report,
            Err(e) => return Ok(Outcome::failure(e.to_string())),
        };

        if let Err(msg) = write_report_artifact(&output_dir, "critic-report.json", &report) {
            return Ok(Outcome::failure(msg));
        }

        Ok(Outcome::success_with(json!({
            "artifact_dir": output_dir,
            "report": report,
        })))
    }

    async fn run_synthesis(&self, args: &Value) -> Result<Outcome, HandlerError> {
        let candidate_id = args
            .get("candidate_id")
            .and_then(Value::as_str)
            .unwrap_or("");
        let output_dir = artifact_dir(&self.artifacts_base, candidate_id);

        let report = match synthesis::run_synthesis(
            &self.client,
            &self.synthesis_model,
            self.default_provider.as_deref(),
            &output_dir,
            args,
        )
        .await
        {
            Ok(report) => report,
            Err(e) => return Ok(Outcome::failure(e.to_string())),
        };

        if let Err(msg) = write_report_artifact(&output_dir, "synthesis-report.json", &report) {
            return Ok(Outcome::failure(msg));
        }

        Ok(Outcome::success_with(json!({
            "artifact_dir": output_dir,
            "report": report,
        })))
    }
}

#[async_trait::async_trait]
impl ToolBackend for TaskCriticSynthesisToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        match tool_name {
            "task_critic" => self.run_task_critic(args).await,
            "synthesis" => self.run_synthesis(args).await,
            _ => self.fallback.execute_tool(tool_name, args, context).await,
        }
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["task_critic".to_string(), "synthesis".to_string()]
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};

    use serde_json::json;

    use super::*;

    struct RecordingFallback {
        called: AtomicBool,
    }

    impl RecordingFallback {
        fn new() -> Self {
            Self {
                called: AtomicBool::new(false),
            }
        }
    }

    #[async_trait::async_trait]
    impl ToolBackend for RecordingFallback {
        async fn execute_tool(
            &self,
            _tool_name: &str,
            _args: &Value,
            _context: &Context,
        ) -> Result<Outcome, HandlerError> {
            self.called.store(true, Ordering::SeqCst);
            Ok(Outcome::success())
        }

        fn available_tools(&self) -> Vec<String> {
            vec!["fallback_tool".to_string()]
        }
    }

    fn backend_with_recording_fallback() -> (TaskCriticSynthesisToolBackend, Arc<RecordingFallback>)
    {
        backend_with_artifacts_base(std::path::PathBuf::from("/tmp/unused"))
    }

    fn backend_with_artifacts_base(
        artifacts_base: std::path::PathBuf,
    ) -> (TaskCriticSynthesisToolBackend, Arc<RecordingFallback>) {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = TaskCriticSynthesisToolBackend::new(
            fallback.clone(),
            "claude-sonnet-4-20250514".to_string(),
            "claude-3-5-haiku-20241022".to_string(),
            None,
            artifacts_base,
        );
        (backend, fallback)
    }

    #[test]
    fn available_tools_returns_task_critic_and_synthesis() {
        let (backend, _fallback) = backend_with_recording_fallback();
        assert_eq!(
            backend.available_tools(),
            vec!["task_critic".to_string(), "synthesis".to_string()]
        );
    }

    #[tokio::test]
    async fn unknown_tool_name_reaches_the_fallback() {
        let (backend, fallback) = backend_with_recording_fallback();

        let outcome = backend
            .execute_tool("some_other_tool", &json!({}), &Context::default())
            .await
            .expect("fallback should succeed");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(fallback.called.load(Ordering::SeqCst));
    }

    #[tokio::test]
    async fn task_critic_missing_screenshot_fails_and_never_touches_fallback() {
        let tmp = tempfile::tempdir().unwrap();
        let (backend, fallback) = backend_with_artifacts_base(tmp.path().to_path_buf());
        let args = json!({
            "candidate_id": "no-such-candidate",
            "persona": "new user",
            "task": "find settings",
        });

        let outcome = backend
            .execute_tool("task_critic", &args, &Context::default())
            .await
            .expect("execute_tool itself should not error");

        match outcome {
            Outcome::Failure { error, .. } => {
                assert!(error.contains("missing artifact"));
            }
            other => panic!("expected Failure, got {other:?}"),
        }
        assert!(!fallback.called.load(Ordering::SeqCst));
    }

    #[tokio::test]
    async fn synthesis_dispatch_never_touches_fallback() {
        let (backend, fallback) = backend_with_recording_fallback();

        let outcome = backend
            .execute_tool("synthesis", &json!({}), &Context::default())
            .await
            .expect("execute_tool itself should not error");

        assert!(matches!(outcome, Outcome::Failure { .. }));
        assert!(!fallback.called.load(Ordering::SeqCst));
    }
}
