// ABOUTME: SystemLintToolBackend: ToolBackend impl dispatching "system_lint" natively.
// ABOUTME: Falls back to a wrapped Arc<dyn ToolBackend> for every other tool name.

use std::path::Path;
use std::sync::Arc;

use serde_json::{Value, json};
use smasher_attractor::handler::HandlerError;
use smasher_attractor::state::{Context, Outcome};
use smasher_attractor::tool_handler::ToolBackend;

use crate::report;

/// Dispatches `"system_lint"` to the native `lint()` call, falling back to
/// `fallback` (typically the existing LLM-mediated backend) for every other tool.
pub struct SystemLintToolBackend {
    fallback: Arc<dyn ToolBackend>,
}

impl SystemLintToolBackend {
    pub fn new(fallback: Arc<dyn ToolBackend>) -> Self {
        Self { fallback }
    }

    async fn run_system_lint(&self, args: &Value) -> Result<Outcome, HandlerError> {
        let candidate_dir = args
            .get("candidate_dir")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("system_lint: missing candidate_dir".into()))?;
        let run_id = args
            .get("run_id")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("system_lint: missing run_id".into()))?;
        let candidate_id = args
            .get("candidate_id")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("system_lint: missing candidate_id".into()))?;

        let report = match crate::lint(Path::new(candidate_dir)) {
            Ok(report) => report,
            Err(e) => return Ok(Outcome::failure(e.to_string())),
        };

        let output_dir = report::artifact_dir(run_id, candidate_id);
        if let Err(e) = std::fs::create_dir_all(&output_dir) {
            return Ok(Outcome::failure(format!(
                "failed to create artifact dir {}: {e}",
                output_dir.display()
            )));
        }

        let report_path = output_dir.join("lint-report.json");
        let json_body = match serde_json::to_string_pretty(&report) {
            Ok(body) => body,
            Err(e) => return Ok(Outcome::failure(format!("failed to serialize report: {e}"))),
        };
        if let Err(e) = std::fs::write(&report_path, json_body) {
            return Ok(Outcome::failure(format!(
                "failed to write {}: {e}",
                report_path.display()
            )));
        }

        Ok(Outcome::success_with(json!({
            "artifact_dir": output_dir,
            "report": report,
        })))
    }
}

#[async_trait::async_trait]
impl ToolBackend for SystemLintToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        match tool_name {
            "system_lint" => self.run_system_lint(args).await,
            _ => self.fallback.execute_tool(tool_name, args, context).await,
        }
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["system_lint".to_string()]
    }
}

#[cfg(test)]
mod tests {
    use std::path::{Path, PathBuf};
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};

    use serde_json::{Value, json};
    use smasher_attractor::handler::HandlerError;
    use smasher_attractor::state::{Context, Outcome};
    use smasher_attractor::tool_handler::ToolBackend;

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

    fn fixture_candidate_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/clean-candidate")
    }

    #[test]
    fn available_tools_returns_exactly_system_lint() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = SystemLintToolBackend::new(fallback);

        assert_eq!(backend.available_tools(), vec!["system_lint".to_string()]);
    }

    #[tokio::test]
    async fn unknown_tool_name_reaches_the_fallback() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = SystemLintToolBackend::new(fallback.clone());

        let outcome = backend
            .execute_tool("some_other_tool", &json!({}), &Context::default())
            .await
            .expect("fallback should succeed");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(fallback.called.load(Ordering::SeqCst));
    }

    #[tokio::test]
    async fn system_lint_produces_artifact_and_never_touches_fallback() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = SystemLintToolBackend::new(fallback.clone());

        let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
        let candidate_id = "test-candidate";
        let args = json!({
            "candidate_dir": fixture_candidate_dir().to_str().unwrap(),
            "run_id": run_id,
            "candidate_id": candidate_id,
        });

        let outcome = backend
            .execute_tool("system_lint", &args, &Context::default())
            .await
            .expect("system_lint should succeed against the clean-candidate fixture");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(!fallback.called.load(Ordering::SeqCst));

        let artifact_dir = crate::report::artifact_dir(&run_id, candidate_id);
        let report_path = artifact_dir.join("lint-report.json");
        assert!(report_path.is_file());

        let contents = std::fs::read_to_string(&report_path).unwrap();
        let report: crate::LintReport = serde_json::from_str(&contents).unwrap();
        assert!(report.passed());

        std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
    }
}
