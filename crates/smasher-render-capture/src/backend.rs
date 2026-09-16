// ABOUTME: HybridToolBackend: dispatches `render_capture` natively, falls back
// ABOUTME: to a wrapped `ToolBackend` (e.g. `LlmToolBackend`) for every other tool.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde_json::{Value, json};
use smasher_attractor::handler::HandlerError;
use smasher_attractor::state::{Context, Outcome};
use smasher_attractor::tool_handler::ToolBackend;

use crate::capture;
use crate::manifest::{self, Viewport};

/// Dispatches `"render_capture"` to the native `capture()` call, falling back to
/// `fallback` (typically the existing LLM-mediated backend) for every other tool.
pub struct HybridToolBackend {
    fallback: Arc<dyn ToolBackend>,
    artifacts_base: PathBuf,
    working_dir: PathBuf,
}

impl HybridToolBackend {
    /// `artifacts_base` is the current run's own artifact directory (e.g.
    /// `RunDirectory::manifest().directories.artifacts`) — every candidate this
    /// backend captures is written under `artifacts_base/<candidate_id>/`.
    ///
    /// `working_dir` is the run's own working directory (e.g. `run.rs`'s
    /// `effective_working_dir`) — a relative `candidate_dir` resolves against this,
    /// not the `smasher` process's own CWD.
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

    async fn run_render_capture(&self, args: &Value) -> Result<Outcome, HandlerError> {
        let candidate_dir = args
            .get("candidate_dir")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("render_capture: missing candidate_dir".into()))?;
        let candidate_id = args
            .get("candidate_id")
            .and_then(Value::as_str)
            .ok_or_else(|| HandlerError::Other("render_capture: missing candidate_id".into()))?;

        let generation_params = match args.get("generation_params") {
            Some(v) => {
                serde_json::from_value::<BTreeMap<String, String>>(v.clone()).map_err(|e| {
                    HandlerError::Other(format!("render_capture: invalid generation_params: {e}"))
                })?
            }
            None => BTreeMap::new(),
        };

        let output_dir = manifest::artifact_dir(&self.artifacts_base, candidate_id);
        let viewport = Viewport {
            width: capture::VIEWPORT_WIDTH,
            height: capture::VIEWPORT_HEIGHT,
        };

        let resolved_candidate_dir = self.resolve_candidate_dir(candidate_dir);

        match crate::capture(
            &resolved_candidate_dir,
            &output_dir,
            viewport,
            generation_params,
        )
        .await
        {
            Ok(manifest) => Ok(Outcome::success_with(json!({
                "artifact_dir": output_dir,
                "manifest": manifest,
            }))),
            Err(e) => Ok(outcome_for_capture_error(e)),
        }
    }
}

/// Maps a capture failure to a retryable or non-retryable `Outcome::Failure`
/// per `CaptureError::is_retryable` — see that method for the reasoning.
fn outcome_for_capture_error(error: capture::CaptureError) -> Outcome {
    let message = error.to_string();
    if error.is_retryable() {
        Outcome::retryable_failure(message)
    } else {
        Outcome::failure(message)
    }
}

#[async_trait::async_trait]
impl ToolBackend for HybridToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        match tool_name {
            "render_capture" => self.run_render_capture(args).await,
            _ => self.fallback.execute_tool(tool_name, args, context).await,
        }
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["render_capture".to_string()]
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
        Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/candidate")
    }

    #[test]
    fn available_tools_returns_exactly_render_capture() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = HybridToolBackend::new(
            fallback,
            PathBuf::from("/tmp/unused"),
            PathBuf::from("/tmp/unused"),
        );

        assert_eq!(backend.available_tools(), vec!["render_capture".to_string()]);
    }

    #[tokio::test]
    async fn unknown_tool_name_reaches_the_fallback() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = HybridToolBackend::new(
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
    async fn render_capture_produces_artifact_and_never_touches_fallback() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
        let fallback = Arc::new(RecordingFallback::new());
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let backend = HybridToolBackend::new(
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
            .execute_tool("render_capture", &args, &Context::default())
            .await
            .expect("render_capture should succeed against the fixture candidate");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(!fallback.called.load(Ordering::SeqCst));

        let artifact_dir = crate::manifest::artifact_dir(&artifacts_base, candidate_id);
        assert!(artifact_dir.join("screenshot.png").is_file());
        assert!(artifact_dir.join("manifest.json").is_file());
    }

    #[tokio::test]
    async fn render_capture_writes_generation_params_into_manifest() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
        let fallback = Arc::new(RecordingFallback::new());
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let backend = HybridToolBackend::new(
            fallback.clone(),
            artifacts_base.clone(),
            PathBuf::from("/tmp/unused"),
        );

        let candidate_id = "test-candidate-params";
        let args = json!({
            "candidate_dir": fixture_candidate_dir().to_str().unwrap(),
            "candidate_id": candidate_id,
            "generation_params": {"prompt": "a red button", "persona": "designer"},
        });

        let outcome = backend
            .execute_tool("render_capture", &args, &Context::default())
            .await
            .expect("render_capture should succeed against the fixture candidate");

        assert!(matches!(outcome, Outcome::Success { .. }));

        let artifact_dir = crate::manifest::artifact_dir(&artifacts_base, candidate_id);
        let manifest: crate::manifest::Manifest = serde_json::from_str(
            &std::fs::read_to_string(artifact_dir.join("manifest.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(
            manifest.generation_params,
            BTreeMap::from([
                ("prompt".to_string(), "a red button".to_string()),
                ("persona".to_string(), "designer".to_string()),
            ])
        );
    }

    #[tokio::test]
    async fn render_capture_omitting_generation_params_writes_empty_map() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
        let fallback = Arc::new(RecordingFallback::new());
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let backend = HybridToolBackend::new(
            fallback.clone(),
            artifacts_base.clone(),
            PathBuf::from("/tmp/unused"),
        );

        let candidate_id = "test-candidate-no-params";
        let args = json!({
            "candidate_dir": fixture_candidate_dir().to_str().unwrap(),
            "candidate_id": candidate_id,
        });

        let outcome = backend
            .execute_tool("render_capture", &args, &Context::default())
            .await
            .expect("render_capture should succeed against the fixture candidate");

        assert!(matches!(outcome, Outcome::Success { .. }));

        let artifact_dir = crate::manifest::artifact_dir(&artifacts_base, candidate_id);
        let manifest: crate::manifest::Manifest = serde_json::from_str(
            &std::fs::read_to_string(artifact_dir.join("manifest.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(manifest.generation_params, BTreeMap::new());
    }

    #[test]
    fn outcome_for_capture_error_marks_missing_entry_point_non_retryable() {
        let outcome =
            outcome_for_capture_error(crate::capture::CaptureError::MissingEntryPoint("dir".into()));
        match outcome {
            Outcome::Failure { retryable, .. } => assert!(!retryable),
            other => panic!("expected Outcome::Failure, got {other:?}"),
        }
    }

    #[test]
    fn outcome_for_capture_error_marks_browser_launch_failure_retryable() {
        let outcome =
            outcome_for_capture_error(crate::capture::CaptureError::BrowserLaunch("boom".into()));
        match outcome {
            Outcome::Failure { retryable, .. } => assert!(retryable),
            other => panic!("expected Outcome::Failure, got {other:?}"),
        }
    }

    #[test]
    fn outcome_for_capture_error_marks_capture_failure_retryable() {
        let outcome = outcome_for_capture_error(crate::capture::CaptureError::Capture(
            "oneshot canceled".into(),
        ));
        match outcome {
            Outcome::Failure { retryable, .. } => assert!(retryable),
            other => panic!("expected Outcome::Failure, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn render_capture_of_missing_entry_point_surfaces_as_non_retryable_failure() {
        let fallback = Arc::new(RecordingFallback::new());
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let empty_candidate_dir = tempfile::tempdir().unwrap();
        let backend = HybridToolBackend::new(
            fallback.clone(),
            artifacts_base,
            PathBuf::from("/tmp/unused"),
        );

        let args = json!({
            "candidate_dir": empty_candidate_dir.path().to_str().unwrap(),
            "candidate_id": "test-candidate-missing-entry",
        });

        let outcome = backend
            .execute_tool("render_capture", &args, &Context::default())
            .await
            .expect("missing entry point should surface as a failure outcome, not a handler error");

        match outcome {
            Outcome::Failure { retryable, .. } => assert!(!retryable),
            other => panic!("expected Outcome::Failure, got {other:?}"),
        }
        assert!(!fallback.called.load(Ordering::SeqCst));
    }

    #[tokio::test]
    async fn render_capture_rejects_malformed_generation_params() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = HybridToolBackend::new(
            fallback.clone(),
            PathBuf::from("/tmp/unused"),
            PathBuf::from("/tmp/unused"),
        );

        let args = json!({
            "candidate_dir": fixture_candidate_dir().to_str().unwrap(),
            "candidate_id": "test-candidate-bad-params",
            "generation_params": {"prompt": {"nested": "object"}},
        });

        let result = backend
            .execute_tool("render_capture", &args, &Context::default())
            .await;

        assert!(result.is_err());
        assert!(!fallback.called.load(Ordering::SeqCst));
    }

    #[tokio::test]
    async fn relative_candidate_dir_resolves_against_working_dir() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
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

        let backend =
            HybridToolBackend::new(fallback.clone(), artifacts_base.clone(), working_dir.clone());

        let candidate_id = "test-candidate-relative";
        let args = json!({
            "candidate_dir": candidate_subdir,
            "candidate_id": candidate_id,
        });

        let outcome = backend
            .execute_tool("render_capture", &args, &Context::default())
            .await
            .expect("render_capture should succeed against the working_dir-joined path");

        assert!(matches!(outcome, Outcome::Success { .. }));
        assert!(!fallback.called.load(Ordering::SeqCst));

        let artifact_dir = crate::manifest::artifact_dir(&artifacts_base, candidate_id);
        assert!(artifact_dir.join("screenshot.png").is_file());
    }

    #[tokio::test]
    async fn absolute_candidate_dir_is_used_as_is_regardless_of_working_dir() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
        let fallback = Arc::new(RecordingFallback::new());
        let tmp = tempfile::tempdir().unwrap();
        let artifacts_base = tmp.path().to_path_buf();
        let backend = HybridToolBackend::new(
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
            .execute_tool("render_capture", &args, &Context::default())
            .await
            .expect("absolute candidate_dir should succeed even with a bogus working_dir");

        assert!(matches!(outcome, Outcome::Success { .. }));

        let artifact_dir = crate::manifest::artifact_dir(&artifacts_base, candidate_id);
        assert!(artifact_dir.join("screenshot.png").is_file());
    }
}
