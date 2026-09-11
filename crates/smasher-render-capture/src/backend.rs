// ABOUTME: HybridToolBackend: dispatches `render_capture` natively, falls back
// ABOUTME: to a wrapped `ToolBackend` (e.g. `LlmToolBackend`) for every other tool.

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
}

impl HybridToolBackend {
    /// `artifacts_base` is the current run's own artifact directory (e.g.
    /// `RunDirectory::manifest().directories.artifacts`) — every candidate this
    /// backend captures is written under `artifacts_base/<candidate_id>/`.
    pub fn new(fallback: Arc<dyn ToolBackend>, artifacts_base: PathBuf) -> Self {
        Self {
            fallback,
            artifacts_base,
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

        let output_dir = manifest::artifact_dir(&self.artifacts_base, candidate_id);
        let viewport = Viewport {
            width: capture::VIEWPORT_WIDTH,
            height: capture::VIEWPORT_HEIGHT,
        };

        match crate::capture(Path::new(candidate_dir), &output_dir, viewport).await {
            Ok(manifest) => Ok(Outcome::success_with(json!({
                "artifact_dir": output_dir,
                "manifest": manifest,
            }))),
            Err(e) => Ok(Outcome::failure(e.to_string())),
        }
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
        let backend = HybridToolBackend::new(fallback, PathBuf::from("/tmp/unused"));

        assert_eq!(backend.available_tools(), vec!["render_capture".to_string()]);
    }

    #[tokio::test]
    async fn unknown_tool_name_reaches_the_fallback() {
        let fallback = Arc::new(RecordingFallback::new());
        let backend = HybridToolBackend::new(fallback.clone(), PathBuf::from("/tmp/unused"));

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
        let backend = HybridToolBackend::new(fallback.clone(), artifacts_base.clone());

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
}
