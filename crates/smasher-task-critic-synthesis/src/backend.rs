// ABOUTME: TaskCriticSynthesisToolBackend: ToolBackend impl dispatching "task_critic" and
// ABOUTME: "synthesis" natively. Falls back to a wrapped Arc<dyn ToolBackend> for everything else.

use std::path::{Path, PathBuf};
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
/// once per candidate when `args` lists `candidate_ids`, falling back to `fallback` (typically the wrapped `SystemLintToolBackend`) for
/// every other tool name.
pub struct TaskCriticSynthesisToolBackend {
    fallback: Arc<dyn ToolBackend>,
    client: Client,
    task_critic_model: String,
    synthesis_model: String,
    default_provider: Option<String>,
    artifacts_base: PathBuf,
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

    /// Replaces the env-configured LLM client, e.g. with one holding a mock provider.
    pub fn with_client(mut self, client: Client) -> Self {
        self.client = client;
        self
    }

    /// Runs one tool against one candidate and writes its report file. The error is
    /// a plain message, so a multi-candidate call can collect them per candidate.
    async fn run_one(
        &self,
        tool: Tool,
        candidate_id: &str,
        args: &Value,
    ) -> Result<(PathBuf, Value), String> {
        let output_dir = artifact_dir(&self.artifacts_base, candidate_id);
        let provider = self.default_provider.as_deref();
        let report = match tool {
            Tool::TaskCritic => {
                let report = task_critic::run_task_critic(
                    &self.client,
                    &self.task_critic_model,
                    provider,
                    &output_dir,
                    args,
                )
                .await
                .map_err(|e| e.to_string())?;
                write_report_artifact(&output_dir, "critic-report.json", &report)?;
                serde_json::to_value(report)
            }
            Tool::Synthesis => {
                let report = synthesis::run_synthesis(
                    &self.client,
                    &self.synthesis_model,
                    provider,
                    &output_dir,
                    args,
                )
                .await
                .map_err(|e| e.to_string())?;
                write_report_artifact(&output_dir, "synthesis-report.json", &report)?;
                serde_json::to_value(report)
            }
        }
        .map_err(|e| format!("failed to serialize report: {e}"))?;
        Ok((output_dir, report))
    }

    async fn run_tool(&self, tool: Tool, args: &Value) -> Result<Outcome, HandlerError> {
        let candidate_ids = match parse_candidate_ids(args) {
            Ok(Some(ids)) => ids,
            Ok(None) => {
                let candidate_id = args
                    .get("candidate_id")
                    .and_then(Value::as_str)
                    .unwrap_or("");
                return Ok(match self.run_one(tool, candidate_id, args).await {
                    Ok((output_dir, report)) => Outcome::success_with(json!({
                        "artifact_dir": output_dir,
                        "report": report,
                    })),
                    Err(msg) => Outcome::failure(msg),
                });
            }
            Err(msg) => return Ok(Outcome::failure(format!("{}: {msg}", tool.name()))),
        };

        // Each candidate gets its own args with `candidate_id` set, so the per-candidate
        // functions (and their error messages) see exactly the single-candidate shape.
        let per_candidate_args: Vec<Value> = candidate_ids
            .iter()
            .map(|id| {
                let mut one = args.clone();
                if let Value::Object(ref mut map) = one {
                    map.remove("candidate_ids");
                    map.insert("candidate_id".to_string(), json!(id));
                }
                one
            })
            .collect();
        let results = futures::future::join_all(
            candidate_ids
                .iter()
                .zip(&per_candidate_args)
                .map(|(id, one)| self.run_one(tool, id, one)),
        )
        .await;

        let mut candidates = Vec::new();
        let mut failures = Vec::new();
        let mut proceed = Vec::new();
        let mut iterate = Vec::new();
        for (id, result) in candidate_ids.iter().zip(results) {
            match result {
                Ok((output_dir, report)) => {
                    match report.get("recommendation").and_then(Value::as_str) {
                        Some("proceed") => proceed.push(id.clone()),
                        Some("iterate") => iterate.push(id.clone()),
                        _ => {}
                    }
                    candidates.push(json!({
                        "candidate_id": id,
                        "artifact_dir": output_dir,
                        "report": report,
                    }));
                }
                Err(msg) => failures.push(format!("{id}: {msg}")),
            }
        }

        if !failures.is_empty() {
            return Ok(Outcome::failure(format!(
                "{} failed for {} of {} candidates: {}",
                tool.name(),
                failures.len(),
                candidate_ids.len(),
                failures.join("; ")
            )));
        }

        let mut data = json!({ "candidates": candidates });
        if tool == Tool::Synthesis {
            data["proceed"] = json!(proceed);
            data["iterate"] = json!(iterate);
        }
        Ok(Outcome::success_with(data))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Tool {
    TaskCritic,
    Synthesis,
}

impl Tool {
    fn name(self) -> &'static str {
        match self {
            Tool::TaskCritic => "task_critic",
            Tool::Synthesis => "synthesis",
        }
    }
}

/// Reads `args["candidate_ids"]`. `Ok(None)` means the single `candidate_id` form.
/// Rejects mixing both forms, an empty list, non-string entries, duplicates, and ids
/// that could escape the artifacts directory (the gallery's `valid_id` rule).
fn parse_candidate_ids(args: &Value) -> Result<Option<Vec<String>>, String> {
    let Some(list) = args.get("candidate_ids") else {
        return Ok(None);
    };
    if args.get("candidate_id").is_some() {
        return Err("set candidate_id or candidate_ids, not both".to_string());
    }
    let list = list
        .as_array()
        .ok_or("candidate_ids must be a list of candidate ids")?;
    if list.is_empty() {
        return Err("candidate_ids is empty".to_string());
    }

    let mut ids: Vec<String> = Vec::with_capacity(list.len());
    for entry in list {
        let id = entry
            .as_str()
            .ok_or_else(|| format!("candidate_ids entry {entry} is not a string"))?;
        if id.is_empty() || id.contains('/') || id.contains('\\') || id.contains("..") {
            return Err(format!(
                "invalid candidate id {id:?}: must be non-empty with no '/', '\\' or '..'"
            ));
        }
        if ids.iter().any(|seen| seen == id) {
            return Err(format!("candidate id {id:?} is listed twice"));
        }
        ids.push(id.to_string());
    }
    Ok(Some(ids))
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
            "task_critic" => self.run_tool(Tool::TaskCritic, args).await,
            "synthesis" => self.run_tool(Tool::Synthesis, args).await,
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
    use smasher_llm::provider::{ProviderAdapter, StreamResponse};
    use smasher_llm::types::{
        ContentPart, Error as LlmError, FinishReason, Provider, Request, Response, Usage,
    };

    use super::*;

    /// Answers every request with the same text, counting calls.
    struct FixedReplyAdapter {
        reply: &'static str,
        calls: std::sync::atomic::AtomicUsize,
    }

    #[async_trait::async_trait]
    impl ProviderAdapter for FixedReplyAdapter {
        fn provider_name(&self) -> &str {
            "anthropic"
        }

        async fn complete(&self, _request: &Request) -> Result<Response, LlmError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            Ok(Response {
                id: "mock".into(),
                model: "mock".into(),
                content: vec![ContentPart::text(self.reply)],
                finish_reason: Some(FinishReason::Stop),
                usage: Usage::default(),
                warnings: vec![],
                rate_limit: None,
                provider: None,
                raw: None,
            })
        }

        async fn stream(&self, _request: &Request) -> Result<StreamResponse, LlmError> {
            Err(LlmError::Other {
                message: "not used".into(),
                retryable: false,
            })
        }
    }

    fn backend_with_reply(
        artifacts_base: &Path,
        reply: &'static str,
    ) -> (TaskCriticSynthesisToolBackend, Arc<FixedReplyAdapter>) {
        let adapter = Arc::new(FixedReplyAdapter {
            reply,
            calls: Default::default(),
        });
        let mut client = Client::new();
        client.register_provider(Provider::Anthropic, adapter.clone());
        let (backend, _fallback) = backend_with_artifacts_base(artifacts_base.to_path_buf());
        (backend.with_client(client), adapter)
    }

    fn write_candidate(base: &Path, id: &str, files: &[(&str, &str)]) {
        let dir = base.join(id);
        std::fs::create_dir_all(&dir).unwrap();
        for (name, body) in files {
            std::fs::write(dir.join(name), body).unwrap();
        }
    }

    const CRITIC_REPORT: &str =
        r#"{"persona": "p", "task": "t", "success": true, "friction": [], "notes": ""}"#;
    const PASSING_LINT: &str =
        r#"{"checks": [{"name": "token-adherence", "passed": true, "violations": []}]}"#;
    const FAILING_LINT: &str =
        r#"{"checks": [{"name": "token-adherence", "passed": false, "violations": ["raw red"]}]}"#;

    #[tokio::test]
    async fn task_critic_with_candidate_ids_writes_one_report_per_candidate() {
        let tmp = tempfile::tempdir().unwrap();
        for id in ["discover-a", "discover-b", "discover-c"] {
            write_candidate(tmp.path(), id, &[("screenshot.png", "png")]);
        }
        let (backend, adapter) = backend_with_reply(
            tmp.path(),
            r#"{"success": true, "friction": [], "notes": "fine"}"#,
        );
        let args = json!({
            "candidate_ids": ["discover-a", "discover-b", "discover-c"],
            "persona": "new user",
            "task": "find settings",
        });

        let outcome = backend
            .execute_tool("task_critic", &args, &Context::default())
            .await
            .unwrap();

        let Outcome::Success { data, .. } = outcome else {
            panic!("expected Success, got {outcome:?}");
        };
        let candidates = data.unwrap()["candidates"].as_array().unwrap().clone();
        assert_eq!(candidates.len(), 3);
        assert_eq!(candidates[1]["candidate_id"], "discover-b");
        assert_eq!(candidates[1]["report"]["persona"], "new user");
        assert_eq!(adapter.calls.load(Ordering::SeqCst), 3);
        for id in ["discover-a", "discover-b", "discover-c"] {
            assert!(tmp.path().join(id).join("critic-report.json").exists());
        }
    }

    #[tokio::test]
    async fn one_failing_candidate_fails_the_node_but_keeps_the_others_reports() {
        let tmp = tempfile::tempdir().unwrap();
        write_candidate(tmp.path(), "has-shot", &[("screenshot.png", "png")]);
        let (backend, _adapter) = backend_with_reply(
            tmp.path(),
            r#"{"success": true, "friction": [], "notes": ""}"#,
        );
        let args = json!({ "candidate_ids": ["has-shot", "no-shot"] });

        let outcome = backend
            .execute_tool("task_critic", &args, &Context::default())
            .await
            .unwrap();

        let Outcome::Failure { error, .. } = outcome else {
            panic!("expected Failure, got {outcome:?}");
        };
        assert!(error.starts_with("task_critic failed for 1 of 2 candidates: no-shot: "));
        assert!(error.contains("missing artifact"));
        assert!(tmp.path().join("has-shot/critic-report.json").exists());
    }

    #[tokio::test]
    async fn synthesis_with_candidate_ids_splits_proceed_and_iterate_under_lint_must_pass() {
        let tmp = tempfile::tempdir().unwrap();
        write_candidate(
            tmp.path(),
            "clean",
            &[
                ("lint-report.json", PASSING_LINT),
                ("critic-report.json", CRITIC_REPORT),
            ],
        );
        write_candidate(
            tmp.path(),
            "off-system",
            &[
                ("lint-report.json", FAILING_LINT),
                ("critic-report.json", CRITIC_REPORT),
            ],
        );
        let (backend, _adapter) = backend_with_reply(
            tmp.path(),
            r#"{"recommendation": "proceed", "reasons": ["model is happy"]}"#,
        );
        let args = json!({
            "candidate_ids": ["clean", "off-system"],
            "lint_must_pass": true,
        });

        let outcome = backend
            .execute_tool("synthesis", &args, &Context::default())
            .await
            .unwrap();

        let Outcome::Success { data, .. } = outcome else {
            panic!("expected Success, got {outcome:?}");
        };
        let data = data.unwrap();
        assert_eq!(data["proceed"], json!(["clean"]));
        assert_eq!(data["iterate"], json!(["off-system"]));
        let written: SynthesisReportFile = serde_json::from_str(
            &std::fs::read_to_string(tmp.path().join("off-system/synthesis-report.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(written.recommendation, "iterate");
        assert!(written.reasons[0].contains("token-adherence"));
    }

    #[tokio::test]
    async fn synthesis_without_lint_must_pass_trusts_the_model() {
        let tmp = tempfile::tempdir().unwrap();
        write_candidate(
            tmp.path(),
            "off-system",
            &[
                ("lint-report.json", FAILING_LINT),
                ("critic-report.json", CRITIC_REPORT),
            ],
        );
        let (backend, _adapter) = backend_with_reply(
            tmp.path(),
            r#"{"recommendation": "proceed", "reasons": ["model is happy"]}"#,
        );

        let outcome = backend
            .execute_tool(
                "synthesis",
                &json!({ "candidate_id": "off-system" }),
                &Context::default(),
            )
            .await
            .unwrap();

        let Outcome::Success { data, .. } = outcome else {
            panic!("expected Success, got {outcome:?}");
        };
        assert_eq!(data.unwrap()["report"]["recommendation"], "proceed");
    }

    #[derive(serde::Deserialize)]
    struct SynthesisReportFile {
        recommendation: String,
        reasons: Vec<String>,
    }

    #[tokio::test]
    async fn bad_candidate_ids_fail_before_any_llm_call() {
        let tmp = tempfile::tempdir().unwrap();
        let (backend, adapter) = backend_with_reply(tmp.path(), "{}");
        let cases = [
            (json!({"candidate_ids": []}), "empty"),
            (json!({"candidate_ids": "a"}), "must be a list"),
            (json!({"candidate_ids": [1]}), "not a string"),
            (json!({"candidate_ids": ["a", "a"]}), "listed twice"),
            (json!({"candidate_ids": ["../x"]}), "invalid candidate id"),
            (json!({"candidate_ids": [""]}), "invalid candidate id"),
            (
                json!({"candidate_ids": ["a"], "candidate_id": "a"}),
                "not both",
            ),
        ];

        for (args, expected) in cases {
            let outcome = backend
                .execute_tool("synthesis", &args, &Context::default())
                .await
                .unwrap();
            let Outcome::Failure { error, .. } = outcome else {
                panic!("expected Failure for {args}, got {outcome:?}");
            };
            assert!(error.starts_with("synthesis: "), "{error}");
            assert!(error.contains(expected), "{args}: {error}");
        }
        assert_eq!(adapter.calls.load(Ordering::SeqCst), 0);
    }

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
