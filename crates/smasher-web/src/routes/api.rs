// ABOUTME: JSON API route handlers for pipeline submission, status, cancellation, and events.
// ABOUTME: Provides the /api/* endpoints consumed by HTMX and external clients.

use std::collections::HashMap;
use std::sync::atomic::Ordering;

use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use smasher_attractor::dot::parser;
use smasher_attractor::events::PipelineEvent;
use smasher_attractor::graph;
use smasher_attractor::lint::LintRunner;
use smasher_attractor::rendering::{
    CachedRenderer, GraphRenderer, NodeExecutionStatus, RenderFormat, StatusGraphvizRenderer,
};
use smasher_attractor::state::{Checkpoint, RunStatus};
use smasher_attractor::transforms;

use crate::error::WebError;
use crate::sse;
use crate::state::{AppState, RunSummary};

// Test-only imports
#[cfg(test)]
use std::sync::Arc;
#[cfg(test)]
use chrono::Utc;
#[cfg(test)]
use tokio_util::sync::CancellationToken;
#[cfg(test)]
use std::sync::atomic::AtomicU64;
#[cfg(test)]
use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
#[cfg(test)]
use smasher_attractor::http_interviewer::HttpInterviewer;

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct SubmitRequest {
    pub dot_source: String,
    #[serde(default)]
    pub variables: HashMap<String, String>,
    pub model: Option<String>,
    /// Per-node model/provider overrides, keyed by node id. Each node defaults
    /// to the pipeline-wide `model`/`state.default_provider` unless listed here.
    #[serde(default)]
    pub node_overrides: HashMap<String, transforms::NodeOverride>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubmitResponse {
    pub run_id: String,
    pub status: String,
    pub run_working_dir: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListRunsResponse {
    pub runs: Vec<RunSummary>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CancelResponse {
    pub success: bool,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub input_tokens: u64,
    pub output_tokens: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResumeResponse {
    pub run_id: String,
    pub status: String,
    pub resumed_from_node: String,
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", get(health))
        .route("/api/runs", post(submit_pipeline).get(list_runs))
        .route("/api/runs/{id}", get(get_run))
        .route("/api/runs/{id}/events", get(events_stream))
        .route("/api/runs/{id}/cancel", post(cancel_run))
        .route("/api/runs/{id}/resume", post(resume_run))
        .route("/api/runs/{id}/tokens", get(get_tokens))
        .route("/api/runs/{id}/graph", get(render_graph))
        .route("/api/graph/nodes", post(list_graph_nodes))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".into(),
    })
}

#[derive(Debug, Deserialize)]
struct GraphNodesRequest {
    dot_source: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GraphNodeSummary {
    id: String,
    node_type: String,
    label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GraphNodesResponse {
    nodes: Vec<GraphNodeSummary>,
}

/// Parses and resolves `dot_source` and returns its nodes (id, type, label) so the
/// dashboard can render a per-node model/provider override row for each one before
/// a run is submitted. Does not lint or execute the graph — a pipeline with lint
/// errors still returns its node list here so the override UI stays usable while
/// the DOT is being edited.
async fn list_graph_nodes(
    Json(req): Json<GraphNodesRequest>,
) -> Result<Json<GraphNodesResponse>, WebError> {
    let dot_graph = parser::parse(&req.dot_source)?;
    let resolved = graph::resolve(&dot_graph)?;

    let nodes = resolved
        .nodes
        .iter()
        .map(|node| GraphNodeSummary {
            id: node.id.clone(),
            node_type: smasher_attractor::stylesheet::node_type_name(&node.node_type).to_string(),
            label: node.label.clone(),
        })
        .collect();

    Ok(Json(GraphNodesResponse { nodes }))
}

async fn submit_pipeline(
    State(state): State<AppState>,
    Json(req): Json<SubmitRequest>,
) -> Result<Json<SubmitResponse>, WebError> {
    // Parse and resolve the graph.
    let dot_graph = parser::parse(&req.dot_source)?;
    let mut resolved = graph::resolve(&dot_graph)?;

    let mut variables = req.variables.clone();
    let model = req.model.unwrap_or_else(|| state.default_model.clone());
    let provider = state.default_provider.clone();
    variables.insert("model".into(), model.clone());

    transforms::apply_node_overrides(&mut resolved, &req.node_overrides);
    transforms::apply_transforms(&mut resolved, &variables, None);

    // Lint the resolved graph and reject pipelines with errors.
    let lint_report = LintRunner::with_builtins().run(&resolved);
    if lint_report.has_errors() {
        let msgs: Vec<String> = lint_report
            .errors()
            .iter()
            .map(|d| d.message.clone())
            .collect();
        return Err(WebError::BadRequest(format!(
            "Pipeline lint errors: {}",
            msgs.join("; ")
        )));
    }

    let record = crate::run_launch::launch_pipeline(
        &state,
        crate::run_launch::LaunchConfig {
            graph: resolved,
            dot_source: req.dot_source.clone(),
            variables,
            model,
            provider,
            resume_info: None,
            workflow_id: None,
            use_checkpointing: true,
        },
    )
    .await?;

    let run_id = record.id.clone();
    let run_working_dir = record.run_working_dir.clone().unwrap_or_default();

    {
        let mut runs = state.runs.write().await;
        runs.insert(run_id.clone(), record);
    }

    // Return the run working directory as a relative path from the project working dir.
    let relative_working_dir = std::path::Path::new(&run_working_dir)
        .strip_prefix(&state.data_dir)
        .map(|p| p.display().to_string())
        .unwrap_or(run_working_dir);

    Ok(Json(SubmitResponse {
        run_id,
        status: "Running".into(),
        run_working_dir: Some(relative_working_dir),
    }))
}

async fn list_runs(State(state): State<AppState>) -> Json<ListRunsResponse> {
    let runs = state.runs.read().await;
    let mut summaries: Vec<RunSummary> = runs.values().map(|r| r.to_summary()).collect();
    summaries.sort_by(|a, b| b.started_at.cmp(&a.started_at));
    Json(ListRunsResponse { runs: summaries })
}

async fn get_run(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<RunSummary>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    Ok(Json(record.to_summary()))
}

async fn events_stream(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<
    axum::response::sse::Sse<
        impl futures::Stream<Item = Result<axum::response::sse::Event, std::convert::Infallible>>,
    >,
    WebError,
> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let rx = record.emitter.subscribe();
    Ok(sse::event_stream(rx))
}

async fn cancel_run(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<CancelResponse>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

    if record.status != RunStatus::Running {
        return Ok(Json(CancelResponse {
            success: false,
            status: format!("{:?}", record.status),
        }));
    }

    record.cancellation.cancel();
    Ok(Json(CancelResponse {
        success: true,
        status: "Aborted".into(),
    }))
}

async fn resume_run(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ResumeResponse>, WebError> {
    // Look up the existing run record to get its checkpoint and graph.
    let (dot_source, graph, variables, checkpoint_json) = {
        let runs = state.runs.read().await;
        let record = runs
            .get(&id)
            .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

        // Only completed or failed runs can be resumed.
        match record.status {
            RunStatus::Completed | RunStatus::Failed | RunStatus::Aborted => {}
            _ => {
                return Err(WebError::BadRequest(format!(
                    "run {id} is still {:?} and cannot be resumed",
                    record.status
                )));
            }
        }

        // Read the checkpoint from disk using the run's working directory.
        let run_dir = record
            .run_working_dir
            .as_ref()
            .ok_or_else(|| WebError::Internal("run has no working directory".into()))?;

        let cp_path = std::path::Path::new(run_dir)
            .join("checkpoints")
            .join("checkpoint.json");

        let cp_json = std::fs::read_to_string(&cp_path).map_err(|e| {
            WebError::Internal(format!(
                "cannot read checkpoint at {}: {e}",
                cp_path.display()
            ))
        })?;

        (
            record.dot_source.clone(),
            record.graph.clone(),
            record.variables.clone(),
            cp_json,
        )
    };

    let checkpoint = Checkpoint::from_json(&checkpoint_json)
        .map_err(|e| WebError::Internal(format!("invalid checkpoint: {e}")))?;

    let resumed_from_node = checkpoint.current_node.clone();

    let model = variables
        .get("model")
        .cloned()
        .unwrap_or_else(|| state.default_model.clone());
    let provider = state.default_provider.clone();

    let record = crate::run_launch::launch_pipeline(
        &state,
        crate::run_launch::LaunchConfig {
            graph,
            dot_source,
            variables,
            model,
            provider,
            resume_info: Some(crate::run_launch::ResumeInfo {
                checkpoint,
                checkpoint_dir: std::path::PathBuf::new(),
            }),
            workflow_id: None,
            use_checkpointing: false,
        },
    )
    .await?;

    let run_id = record.id.clone();

    {
        let mut runs = state.runs.write().await;
        runs.insert(run_id.clone(), record);
    }

    Ok(Json(ResumeResponse {
        run_id,
        status: "Running".into(),
        resumed_from_node,
    }))
}

async fn get_tokens(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<TokenResponse>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    Ok(Json(TokenResponse {
        input_tokens: record.input_tokens.load(Ordering::Relaxed),
        output_tokens: record.output_tokens.load(Ordering::Relaxed),
    }))
}

async fn render_graph(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<axum::response::Response, WebError> {
    use axum::response::IntoResponse;

    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

    // Build node status map from event log.
    let events = record.event_log.events();
    let mut statuses: HashMap<String, NodeExecutionStatus> = HashMap::new();

    for event in &events {
        match event {
            PipelineEvent::NodeStarted { node_id, .. } => {
                statuses.insert(node_id.clone(), NodeExecutionStatus::Running);
            }
            PipelineEvent::NodeCompleted { node_id, .. } => {
                statuses.insert(node_id.clone(), NodeExecutionStatus::Done);
            }
            PipelineEvent::NodeFailed { node_id, .. } => {
                statuses.insert(node_id.clone(), NodeExecutionStatus::Failed);
            }
            _ => {}
        }
    }

    let renderer = StatusGraphvizRenderer::new(statuses);
    let cached = CachedRenderer::new(renderer);
    let output = cached
        .render(&record.graph, RenderFormat::Svg)
        .await
        .map_err(|e| WebError::Internal(format!("graph render failed: {e}")))?;

    Ok((
        [(axum::http::header::CONTENT_TYPE, "image/svg+xml")],
        output.content,
    )
        .into_response())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![])
    }

    #[tokio::test]
    async fn health_returns_ok() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/api/health")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn list_runs_empty() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/api/runs")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: ListRunsResponse = serde_json::from_slice(&body).unwrap();
        assert!(parsed.runs.is_empty());
    }

    #[tokio::test]
    async fn get_run_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/api/runs/nonexistent")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn cancel_run_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs/nonexistent/cancel")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn events_stream_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/api/runs/nonexistent/events")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn graph_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/api/runs/nonexistent/graph")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn submit_invalid_dot_returns_error() {
        let app = router().with_state(test_state());
        let body = serde_json::json!({
            "dot_source": "not a valid dot graph",
            "variables": {}
        });
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn submit_valid_dot_creates_run() {
        let tmp = tempfile::tempdir().unwrap();
        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(
            client,
            "test-model".into(),
            None,
            tmp.path().display().to_string(),
            vec![],
        );
        let app = router().with_state(state.clone());
        let body = serde_json::json!({
            "dot_source": "digraph { start [shape=circle]; a [shape=box]; end [shape=doublecircle]; start -> a -> end }",
            "variables": {}
        });
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: SubmitResponse = serde_json::from_slice(&body).unwrap();
        assert!(!parsed.run_id.is_empty());
        assert_eq!(parsed.status, "Running");

        // Verify per-run working directory is returned and contains the run ID.
        assert!(parsed.run_working_dir.is_some());
        let dir = parsed.run_working_dir.unwrap();
        assert!(dir.contains(&parsed.run_id));

        // Verify the run exists in state.
        let runs = state.runs.read().await;
        assert!(runs.contains_key(&parsed.run_id));
    }

    #[tokio::test]
    async fn submit_with_node_overrides_stamps_model_onto_the_named_node() {
        let tmp = tempfile::tempdir().unwrap();
        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(
            client,
            "test-model".into(),
            None,
            tmp.path().display().to_string(),
            vec![],
        );
        let app = router().with_state(state.clone());
        let body = serde_json::json!({
            "dot_source": "digraph { start [shape=circle]; a [shape=box]; end [shape=doublecircle]; start -> a -> end }",
            "variables": {},
            "node_overrides": {
                "a": {"model": "claude-opus-4", "provider": "anthropic"}
            }
        });
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: SubmitResponse = serde_json::from_slice(&body).unwrap();

        let runs = state.runs.read().await;
        let record = runs.get(&parsed.run_id).unwrap();
        let node_a = record
            .graph
            .nodes
            .iter()
            .find(|n| n.id == "a")
            .expect("node 'a' should exist in the resolved graph");
        assert_eq!(
            node_a.attrs.get("model"),
            Some(&smasher_attractor::graph::NodeAttrValue::String(
                "claude-opus-4".to_string()
            ))
        );
        assert_eq!(
            node_a.attrs.get("provider"),
            Some(&smasher_attractor::graph::NodeAttrValue::String(
                "anthropic".to_string()
            ))
        );

        // Untouched nodes stay untouched.
        let start_node = record.graph.nodes.iter().find(|n| n.id == "start").unwrap();
        assert_eq!(start_node.attrs.get("model"), None);
    }

    #[tokio::test]
    async fn list_graph_nodes_returns_id_type_and_label_for_each_node() {
        let app = router().with_state(test_state());
        let body = serde_json::json!({
            "dot_source": "digraph { start [shape=circle]; a [label=\"Do a thing\"]; end [shape=doublecircle]; start -> a -> end }"
        });
        let req = Request::builder()
            .method("POST")
            .uri("/api/graph/nodes")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: GraphNodesResponse = serde_json::from_slice(&body).unwrap();

        assert_eq!(parsed.nodes.len(), 3);
        let node_a = parsed.nodes.iter().find(|n| n.id == "a").unwrap();
        assert_eq!(node_a.label.as_deref(), Some("Do a thing"));
    }

    #[tokio::test]
    async fn list_graph_nodes_rejects_invalid_dot() {
        let app = router().with_state(test_state());
        let body = serde_json::json!({ "dot_source": "not a valid dot graph" });
        let req = Request::builder()
            .method("POST")
            .uri("/api/graph/nodes")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    /// Insert a RunRecord directly into state for handler testing.
    async fn insert_test_record(
        state: &AppState,
        id: &str,
        status: RunStatus,
    ) -> CancellationToken {
        let dot_graph = parser::parse("digraph { a -> b }").unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        let token = CancellationToken::new();
        let record = crate::state::RunRecord {
            id: id.into(),
            dot_source: "digraph { a -> b }".into(),
            graph: resolved,
            status,
            started_at: Utc::now(),
            completed_at: None,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: token.clone(),
            interviewer: HttpInterviewer::new(),
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: Some("/srv/project/artifacts/test-run-1".into()),
            workflow_id: None,
        };
        state.runs.write().await.insert(id.into(), record);
        token
    }

    #[tokio::test]
    async fn cancel_running_run_returns_success() {
        let state = test_state();
        let _token = insert_test_record(&state, "run-cancel-1", RunStatus::Running).await;
        let app = router().with_state(state);
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs/run-cancel-1/cancel")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: CancelResponse = serde_json::from_slice(&body).unwrap();
        assert!(parsed.success);
        assert_eq!(parsed.status, "Aborted");
    }

    #[tokio::test]
    async fn cancel_completed_run_returns_failure() {
        let state = test_state();
        let _token = insert_test_record(&state, "run-done-1", RunStatus::Completed).await;
        let app = router().with_state(state);
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs/run-done-1/cancel")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: CancelResponse = serde_json::from_slice(&body).unwrap();
        assert!(!parsed.success);
        assert_eq!(parsed.status, "Completed");
    }

    #[tokio::test]
    async fn get_run_returns_relative_working_dir() {
        let state = test_state();
        let _token = insert_test_record(&state, "run-dir-1", RunStatus::Running).await;
        let app = router().with_state(state);
        let req = Request::builder()
            .uri("/api/runs/run-dir-1")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: RunSummary = serde_json::from_slice(&body).unwrap();
        // run_working_dir should be relative, not the absolute path we stored.
        assert_eq!(parsed.run_working_dir, Some("artifacts/test-run-1".into()));
    }

    #[tokio::test]
    async fn submit_lint_errors_return_bad_request() {
        let app = router().with_state(test_state());
        // A graph with no start node triggers a lint error.
        let body = serde_json::json!({
            "dot_source": "digraph { a [shape=box]; b [shape=doublecircle]; a -> b }",
            "variables": {}
        });
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn get_tokens_for_existing_run() {
        let state = test_state();
        let _token = insert_test_record(&state, "run-tok-1", RunStatus::Running).await;
        let app = router().with_state(state);
        let req = Request::builder()
            .uri("/api/runs/run-tok-1/tokens")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: TokenResponse = serde_json::from_slice(&body).unwrap();
        assert_eq!(parsed.input_tokens, 0);
        assert_eq!(parsed.output_tokens, 0);
    }
}
