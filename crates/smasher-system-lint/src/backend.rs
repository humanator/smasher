// ABOUTME: SystemLintToolBackend: ToolBackend impl dispatching "system_lint" natively.
// ABOUTME: Falls back to a wrapped Arc<dyn ToolBackend> for every other tool name.

use std::path::{Path, PathBuf};
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
    artifacts_base: PathBuf,
    working_dir: PathBuf,
}

impl SystemLintToolBackend {
    /// `artifacts_base` is the current run's own artifact directory — see
    /// `smasher_render_capture::backend::HybridToolBackend::new`.
    ///
    /// `working_dir` is the run's own working directory — a relative `candidate_dir`
    /// resolves against this, not the `smasher` process's own CWD. See
    /// `smasher_render_capture::backend::HybridToolBackend::new`.
    pub fn new(fallback: Arc<dyn ToolBackend>, artifacts_base: PathBuf, working_dir: PathBuf) -> Self {
        Self {
            fallback,
            artifacts_base,
            working_dir,
        }
    }

    fn resolve_candidate_dir(&self, candidate_dir: &str) -> PathBuf {
        let path = Path::new(candidate_dir);
        if path.is_absolute() {
            path.to_path_buf()
        } else {
            self.working_dir.join(path)
        }
    }

    async fn run_system_lint(&self, args: &Value) -> Result<Outcome, HandlerError> {
        let candidate_dir = args
            .get("candidate_dir")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("system_lint: missing candidate_dir".into()))?;
        let candidate_id = args
            .get("candidate_id")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("system_lint: missing candidate_id".into()))?;

        let resolved_candidate_dir = self.resolve_candidate_dir(candidate_dir);

        let report = match crate::lint(&resolved_candidate_dir) {
            Ok(report) => report,
            Err(e) => return Ok(Outcome::failure(e.to_string())),
        };

        let output_dir = report::artifact_dir(&self.artifacts_base, candidate_id);
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
        let backend = SystemLintToolBackend::new(
            fallback,
            PathBuf::from("/tmp/unused"),
            PathBuf::from("/tmp/unused"),
        );

        assert_eq!(backend.available_tools(), vec!["system_lint".to_string()]);
    }

    #[tokio::test]
    async fn unknown_tool_name_reaches_the_fallback() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = SystemLintToolBackend::new(
            fallback.clone(),
            PathBuf::from("/tmp/unused"),
            PathBuf::from("/tmp/unused"),
        );

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
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let backend = SystemLintToolBackend::new(
            fallback.clone(),
            artifacts_base.clone(),
            PathBuf::from("/tmp/unused"),
        );

        let candidate_id = "test-candidate";
        let args = json!({
            "candidate_dir": fixture_candidate_dir().to_str().unwrap(),
            "candidate_id": candidate_id,
        });

        let outcome = backend
            .execute_tool("system_lint", &args, &Context::default())
            .await
            .expect("system_lint should succeed against the clean-candidate fixture");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(!fallback.called.load(Ordering::SeqCst));

        let artifact_dir = crate::report::artifact_dir(&artifacts_base, candidate_id);
        let report_path = artifact_dir.join("lint-report.json");
        assert!(report_path.is_file());

        let contents = std::fs::read_to_string(&report_path).unwrap();
        let report: crate::LintReport = serde_json::from_str(&contents).unwrap();
        assert!(report.passed());
    }

    #[tokio::test]
    async fn relative_candidate_dir_resolves_against_working_dir() {
        let fallback = Arc::new(RecordingFallback::new());
        let artifacts_tmp = tempfile::tempdir().unwrap();
        let artifacts_base = artifacts_tmp.path().to_path_buf();
        let working_tmp = tempfile::tempdir().unwrap();
        let working_dir = working_tmp.path().to_path_buf();

        let candidate_subdir = "nested/candidate";
        let full_candidate_dir = working_dir.join(candidate_subdir);
        std::fs::create_dir_all(&full_candidate_dir).unwrap();
        std::fs::copy(
            fixture_candidate_dir().join("index.html"),
            full_candidate_dir.join("index.html"),
        )
        .unwrap();

        let backend = SystemLintToolBackend::new(
            fallback.clone(),
            artifacts_base.clone(),
            working_dir.clone(),
        );

        let candidate_id = "test-candidate-relative";
        let args = json!({
            "candidate_dir": candidate_subdir,
            "candidate_id": candidate_id,
        });

        let outcome = backend
            .execute_tool("system_lint", &args, &Context::default())
            .await
            .expect("system_lint should succeed against the working_dir-joined path");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(!fallback.called.load(Ordering::SeqCst));

        let artifact_dir = crate::report::artifact_dir(&artifacts_base, candidate_id);
        assert!(artifact_dir.join("lint-report.json").is_file());
    }

    #[tokio::test]
    async fn absolute_candidate_dir_is_used_as_is_regardless_of_working_dir() {
        let fallback = Arc::new(RecordingFallback::new());
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let backend = SystemLintToolBackend::new(
            fallback.clone(),
            artifacts_base.clone(),
            PathBuf::from("/does/not/exist"),
        );

        let candidate_id = "test-candidate-absolute";
        let args = json!({
            "candidate_dir": fixture_candidate_dir().to_str().unwrap(),
            "candidate_id": candidate_id,
        });

        let outcome = backend
            .execute_tool("system_lint", &args, &Context::default())
            .await
            .expect("absolute candidate_dir should succeed even with a bogus working_dir");

        assert!(matches!(outcome, Outcome::Success { .. }));

        let artifact_dir = crate::report::artifact_dir(&artifacts_base, candidate_id);
        assert!(artifact_dir.join("lint-report.json").is_file());
    }
}
