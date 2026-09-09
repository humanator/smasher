// ABOUTME: HTML page route handlers serving askama templates for the dashboard UI.
// ABOUTME: Provides the browser-facing pages: dashboard, run detail, and fragments.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};

use askama::Template;
use axum::Router;
use axum::extract::{Form, Path, State};
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post};

use smasher_attractor::events::PipelineEvent;
use smasher_attractor::rendering::{
    CachedRenderer, GraphRenderer, NodeExecutionStatus, RenderFormat, StatusGraphvizRenderer,
};

use crate::candidates::{self, CandidateSummary};
use crate::error::WebError;
use crate::state::{AppState, RunSummary};

// ---------------------------------------------------------------------------
// Template structs
// ---------------------------------------------------------------------------

#[derive(Template)]
#[template(path = "dashboard.html")]
struct DashboardTemplate {
    runs: Vec<RunSummary>,
}

#[derive(Template)]
#[template(path = "run_detail.html")]
struct RunDetailTemplate {
    run: RunSummary,
    historical_events: String,
    initial_input_tokens: u64,
    initial_output_tokens: u64,
}

#[derive(Template)]
#[template(path = "run_list.html")]
#[allow(dead_code)]
struct RunListTemplate {
    runs: Vec<RunSummary>,
}

#[derive(Template)]
#[template(path = "run_status.html")]
struct RunStatusTemplate {
    run: RunSummary,
}

#[derive(Template)]
#[template(path = "graph.html")]
struct GraphTemplate {
    svg_content: String,
}

/// Template-friendly question summary with Display-compatible kind.
struct TemplateQuestion {
    id: String,
    question: String,
    choices: Vec<String>,
    kind_label: String,
}

impl From<smasher_attractor::http_interviewer::QuestionSummary> for TemplateQuestion {
    fn from(q: smasher_attractor::http_interviewer::QuestionSummary) -> Self {
        let kind_label = match q.kind {
            smasher_attractor::http_interviewer::QuestionKind::FreeForm => "Free Form",
            smasher_attractor::http_interviewer::QuestionKind::MultipleChoice => "Multiple Choice",
            smasher_attractor::http_interviewer::QuestionKind::Approval => "Approval",
        }
        .to_string();
        Self {
            id: q.id,
            question: q.question,
            choices: q.choices,
            kind_label,
        }
    }
}

#[derive(Template)]
#[template(path = "question_card.html")]
struct QuestionCardTemplate {
    run_id: String,
    questions: Vec<TemplateQuestion>,
    gallery_gate_html: Option<String>,
}

#[derive(Template)]
#[template(path = "token_counter.html")]
struct TokenTemplate {
    input_tokens: u64,
    output_tokens: u64,
}

#[derive(Template)]
#[template(path = "candidate_gallery.html")]
struct CandidateGalleryTemplate {
    run_id: String,
    candidates: Vec<CandidateSummary>,
}

#[derive(Template)]
#[template(path = "gallery_gate.html")]
struct GalleryGateTemplate {
    run_id: String,
    question_id: String,
    candidates: Vec<CandidateSummary>,
    expected_count: Option<usize>,
    outgoing_edges: Vec<String>,
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Deserialize)]
pub struct SubmitForm {
    pub dot_source: String,
    pub model: Option<String>,
    pub vars: Option<String>,
}

// ---------------------------------------------------------------------------
// Template response helper
// ---------------------------------------------------------------------------

struct HtmlTemplate<T: Template>(T);

impl<T: Template> IntoResponse for HtmlTemplate<T> {
    fn into_response(self) -> Response {
        match self.0.render() {
            Ok(html) => Html(html).into_response(),
            Err(e) => {
                tracing::error!(error = %e, "template render failed");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("template error: {e}"),
                )
                    .into_response()
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(dashboard))
        .route("/runs", post(submit_run))
        .route("/runs/{id}", get(run_detail))
        .route("/runs/{id}/graph", get(run_graph))
        .route("/runs/{id}/status", get(run_status))
        .route("/runs/{id}/tokens", get(run_tokens))
        .route("/runs/{id}/questions", get(run_questions))
        .route("/runs/{id}/candidates", get(run_candidates))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn dashboard(State(state): State<AppState>) -> impl IntoResponse {
    let runs_map = state.runs.read().await;
    let mut runs: Vec<RunSummary> = runs_map.values().map(|r| r.to_summary()).collect();
    runs.sort_by(|a, b| b.started_at.cmp(&a.started_at));
    HtmlTemplate(DashboardTemplate { runs })
}

async fn submit_run(
    State(state): State<AppState>,
    Form(form): Form<SubmitForm>,
) -> Result<Response, WebError> {
    use chrono::Utc;
    use std::sync::Arc;
    use tokio_util::sync::CancellationToken;

    use smasher_attractor::artifact::ArtifactStore;
    use smasher_attractor::dot::parser;
    use smasher_attractor::engine::{Engine, EngineConfig};
    use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
    use smasher_attractor::graph;
    use smasher_attractor::handler::{CodergenHandler, HandlerRegistry, default_registry};
    use smasher_attractor::http_interviewer::HttpInterviewer;
    use smasher_attractor::interviewer::{HumanGateHandler, InterviewerHandler};
    use smasher_attractor::lint::LintRunner;
    use smasher_attractor::log_sink::LogSink;
    use smasher_attractor::manager_handler::ManagerHandler;
    use smasher_attractor::parallel::ParallelHandler;
    use smasher_attractor::state::{Context, RunStatus};
    use smasher_attractor::tool_handler::{ToolBackend, ToolHandler};
    use smasher_attractor::transforms;

    use crate::backend::{AgentCodergenBackend, LlmManagerBackend, LlmToolBackend};
    use crate::state::RunRecord;

    let dot_graph = parser::parse(&form.dot_source)?;
    let mut resolved = graph::resolve(&dot_graph)?;

    let mut variables: HashMap<String, String> = HashMap::new();
    if let Some(ref vars_text) = form.vars {
        for line in vars_text.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                variables.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
    }

    let model = form
        .model
        .filter(|m| !m.is_empty())
        .unwrap_or_else(|| state.default_model.clone());
    variables.insert("model".into(), model.clone());

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

    let run_id = uuid::Uuid::new_v4().to_string();

    // Create per-run artifact directory for isolation.
    let artifacts_base = std::path::Path::new(&state.data_dir).join("artifacts");
    let graph_name =
        smasher_attractor::run_dir::sanitize_graph_name(&resolved.name.clone().unwrap_or_default());
    let run_directory = smasher_attractor::run_dir::RunDirectory::create(
        &artifacts_base,
        &run_id,
        &graph_name,
        &form.dot_source,
    )
    .map_err(|e| WebError::Internal(format!("failed to create run directory: {e}")))?;
    let run_working_dir = run_directory
        .manifest()
        .directories
        .root
        .display()
        .to_string();

    let emitter = Arc::new(PipelineEventEmitter::default());
    let event_log = Arc::new(PipelineEventLog::new());
    let cancellation = CancellationToken::new();
    let interviewer = HttpInterviewer::new();
    let input_tokens = Arc::new(AtomicU64::new(0));
    let output_tokens = Arc::new(AtomicU64::new(0));

    let record = RunRecord {
        id: run_id.clone(),
        dot_source: form.dot_source.clone(),
        graph: resolved.clone(),
        status: RunStatus::Running,
        started_at: Utc::now(),
        completed_at: None,
        emitter: Arc::clone(&emitter),
        event_log: Arc::clone(&event_log),
        cancellation: cancellation.clone(),
        interviewer: interviewer.clone(),
        variables: variables.clone(),
        error: None,
        input_tokens: Arc::clone(&input_tokens),
        output_tokens: Arc::clone(&output_tokens),
        run_working_dir: Some(run_working_dir.clone()),
    };

    {
        let mut runs = state.runs.write().await;
        runs.insert(run_id.clone(), record);
    }

    // Event log subscriber (in-memory for dashboard).
    let mut log_rx = emitter.subscribe();
    let log_clone = Arc::clone(&event_log);
    tokio::spawn(async move {
        loop {
            match log_rx.recv().await {
                Ok(event) => log_clone.push(event),
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(missed = n, "event log subscriber lagged");
                }
            }
        }
    });

    // Event log subscriber (JSONL file on disk).
    let mut file_log_rx = emitter.subscribe();
    let file_sink = smasher_attractor::log_sink::FileLogSink::new(run_directory.event_log_path());
    tokio::spawn(async move {
        loop {
            match file_log_rx.recv().await {
                Ok(event) => {
                    if let Err(e) = file_sink.append(event).await {
                        tracing::warn!(error = %e, "failed to write event to JSONL log");
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(missed = n, "file log subscriber lagged");
                }
            }
        }
    });

    // Pipeline execution task.
    let run_id_clone = run_id.clone();
    let runs = Arc::clone(&state.runs);
    let client = Arc::clone(&state.client);
    let checkpoint_dir = run_directory.manifest().directories.checkpoints.clone();
    tokio::spawn(async move {
        let backend = Arc::new(AgentCodergenBackend::new(
            Arc::clone(&client),
            model.clone(),
            run_working_dir.clone(),
            input_tokens,
            output_tokens,
            Arc::clone(&emitter),
        ));
        let interviewer_arc: Arc<dyn smasher_attractor::interviewer::Interviewer> =
            Arc::new(interviewer);

        let manager_backend = Arc::new(LlmManagerBackend::new(
            Arc::clone(&client),
            model.clone(),
            run_working_dir.clone(),
        ));
        let llm_tool_backend = Arc::new(LlmToolBackend::new(
            Arc::clone(&client),
            model.clone(),
            run_working_dir.clone(),
        ));
        let render_capture_backend =
            Arc::new(smasher_render_capture::backend::HybridToolBackend::new(
                llm_tool_backend as Arc<dyn ToolBackend>,
            ));
        let tool_backend = Arc::new(smasher_system_lint::backend::SystemLintToolBackend::new(
            render_capture_backend as Arc<dyn ToolBackend>,
        ));

        // Build a child registry for ParallelHandler to dispatch within parallel nodes.
        // Clone the backends as trait object Arcs for the child registry.
        let child_codergen: Arc<dyn smasher_attractor::handler::CodergenBackend> = backend.clone();
        let child_manager: Arc<dyn smasher_attractor::manager_handler::ManagerBackend> =
            manager_backend.clone();
        let child_tool: Arc<dyn smasher_attractor::tool_handler::ToolBackend> =
            tool_backend.clone();
        let mut child_registry = HandlerRegistry::new();
        child_registry.register(Arc::new(CodergenHandler::new(child_codergen)));
        child_registry.register(Arc::new(InterviewerHandler::new(Arc::clone(
            &interviewer_arc,
        ))));
        child_registry.register(Arc::new(HumanGateHandler::new(Arc::clone(
            &interviewer_arc,
        ))));
        child_registry.register(Arc::new(ManagerHandler::new(child_manager)));
        child_registry.register(Arc::new(ToolHandler::new(child_tool)));

        let mut registry = default_registry();
        registry.register(Arc::new(CodergenHandler::new(backend)));
        registry.register(Arc::new(InterviewerHandler::new(Arc::clone(
            &interviewer_arc,
        ))));
        registry.register(Arc::new(HumanGateHandler::new(interviewer_arc)));
        registry.register(Arc::new(ManagerHandler::new(manager_backend)));
        registry.register(Arc::new(ToolHandler::new(tool_backend)));
        registry.register(Arc::new(ParallelHandler::new(Arc::new(child_registry))));

        let config = EngineConfig {
            max_steps: 1000,
            enable_checkpointing: true,
            checkpoint_dir: Some(checkpoint_dir),
            cancellation_token: Some(cancellation),
            artifact_store: Some(ArtifactStore::new()),
            ..EngineConfig::default()
        };

        let mut engine = Engine::with_config(resolved, registry, config).with_emitter(emitter);
        if let Err(e) = engine.apply_sub_pipeline_transform(&run_working_dir) {
            tracing::warn!(error = %e, "sub-pipeline transform failed, continuing without");
        }
        let context = Context::default();

        for (key, value) in &variables {
            context.set(key, serde_json::Value::String(value.clone()));
        }

        let result = engine.run(context).await;

        let mut runs = runs.write().await;
        if let Some(record) = runs.get_mut(&run_id_clone) {
            record.completed_at = Some(Utc::now());
            match result {
                Ok(_) => record.status = RunStatus::Completed,
                Err(e) => {
                    if matches!(e, smasher_attractor::engine::EngineError::Cancelled) {
                        record.status = RunStatus::Aborted;
                    } else {
                        record.status = RunStatus::Failed;
                        record.error = Some(e.to_string());
                    }
                }
            }
        }
    });

    let response = Response::builder()
        .status(StatusCode::OK)
        .header("HX-Redirect", format!("/runs/{run_id}"))
        .body(axum::body::Body::empty())
        .unwrap();
    Ok(response)
}

async fn run_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let summary = record.to_summary();

    // Pre-render historical events (newest first to match SSE afterbegin order).
    let mut events = record.event_log.events();
    events.reverse();
    let historical_events: String = events.iter().map(crate::sse::render_event_html).collect();

    let initial_input_tokens = record.input_tokens.load(Ordering::Relaxed);
    let initial_output_tokens = record.output_tokens.load(Ordering::Relaxed);

    Ok(HtmlTemplate(RunDetailTemplate {
        run: summary,
        historical_events,
        initial_input_tokens,
        initial_output_tokens,
    }))
}

async fn run_graph(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

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

    let svg_content = String::from_utf8_lossy(&output.content).to_string();
    Ok(HtmlTemplate(GraphTemplate { svg_content }))
}

async fn run_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let summary = record.to_summary();
    Ok(HtmlTemplate(RunStatusTemplate { run: summary }))
}

async fn run_tokens(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let input = record.input_tokens.load(Ordering::Relaxed);
    let output = record.output_tokens.load(Ordering::Relaxed);
    Ok(HtmlTemplate(TokenTemplate {
        input_tokens: input,
        output_tokens: output,
    }))
}

async fn run_questions(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    use crate::routes::gallery::{find_gallery_gate, resolve_candidate_count};

    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let pending = record.interviewer.list_questions();
    let oldest_qid = pending.questions.first().map(|q| q.id.clone());
    let questions: Vec<TemplateQuestion> = pending
        .questions
        .into_iter()
        .map(TemplateQuestion::from)
        .collect();

    // Gallery gate card: first gallery node + pending questions + candidates.
    // Renders alongside (not instead of) the plain question cards.
    let gallery_gate_html = find_gallery_gate(&record.graph).and_then(|gate| {
        let question_id = oldest_qid?;
        let found = candidates::scan_candidates(&id);
        if found.is_empty() {
            return None;
        }
        let expected_count = resolve_candidate_count(gate, &record.variables);
        let outgoing_edges: Vec<String> = record
            .graph
            .edges_from(&gate.id)
            .into_iter()
            .map(|e| e.label.clone().unwrap_or_else(|| e.to.clone()))
            .collect();
        GalleryGateTemplate {
            run_id: id.clone(),
            question_id,
            candidates: found,
            expected_count,
            outgoing_edges,
        }
        .render()
        .map_err(|e| {
            tracing::error!(error = %e, "gallery gate template render failed");
        })
        .ok()
    });

    Ok(HtmlTemplate(QuestionCardTemplate {
        run_id: id,
        questions,
        gallery_gate_html,
    }))
}

async fn run_candidates(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    {
        let runs = state.runs.read().await;
        runs.get(&id)
            .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    }

    let candidates = candidates::scan_candidates(&id);
    Ok(HtmlTemplate(CandidateGalleryTemplate {
        run_id: id,
        candidates,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use tower::ServiceExt;

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), "/tmp".into())
    }

    #[tokio::test]
    async fn dashboard_returns_html() {
        let app = router().with_state(test_state());
        let req = Request::builder().uri("/").body(Body::empty()).unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("SMASHER"));
        assert!(html.contains("Submit Pipeline"));
    }

    #[tokio::test]
    async fn run_detail_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/runs/nonexistent")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn run_status_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/runs/nonexistent/status")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn submit_lint_errors_return_bad_request() {
        let app = router().with_state(test_state());
        // A graph with no start node triggers a lint error.
        // URL-encoded: digraph { a [shape=box]; b [shape=doublecircle]; a -> b }
        let body = "dot_source=digraph+%7B+a+%5Bshape%3Dbox%5D%3B+b+%5Bshape%3Ddoublecircle%5D%3B+a+-%3E+b+%7D";
        let req = Request::builder()
            .method("POST")
            .uri("/runs")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn run_questions_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/runs/nonexistent/questions")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    /// Insert a minimal RunRecord directly into state for handler testing,
    /// mirroring `routes::api::tests::insert_test_record`.
    async fn insert_test_record(state: &AppState, id: &str) {
        use crate::state::RunRecord;
        use chrono::Utc;
        use smasher_attractor::dot::parser;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph;
        use smasher_attractor::http_interviewer::HttpInterviewer;
        use smasher_attractor::state::RunStatus;
        use std::sync::Arc;
        use tokio_util::sync::CancellationToken;

        let dot_graph = parser::parse("digraph { a -> b }").unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        let record = RunRecord {
            id: id.into(),
            dot_source: "digraph { a -> b }".into(),
            graph: resolved,
            status: RunStatus::Running,
            started_at: Utc::now(),
            completed_at: None,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: CancellationToken::new(),
            interviewer: HttpInterviewer::new(),
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: None,
        };
        state.runs.write().await.insert(id.into(), record);
    }

    #[tokio::test]
    async fn run_candidates_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/runs/nonexistent/candidates")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn run_candidates_returns_empty_state_for_run_with_no_artifacts() {
        let state = test_state();
        insert_test_record(&state, "run-candidates-empty").await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri("/runs/run-candidates-empty/candidates")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("No candidates yet"));
    }

    #[tokio::test]
    async fn run_candidates_returns_candidate_cards_for_real_fixture_artifacts() {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        let run_id = "run-candidates-with-fixtures";
        let candidate_dir = std::path::Path::new("runs")
            .join(run_id)
            .join("artifacts")
            .join("candidate-fixture");
        std::fs::create_dir_all(&candidate_dir).unwrap();
        let manifest = Manifest {
            captured_at: chrono::Utc::now(),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: "/tmp/candidate-fixture".into(),
            exit_status: ExitStatus::Success,
        };
        std::fs::write(
            candidate_dir.join("manifest.json"),
            serde_json::to_string(&manifest).unwrap(),
        )
        .unwrap();

        let state = test_state();
        insert_test_record(&state, run_id).await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri(format!("/runs/{run_id}/candidates"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();

        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("candidate-fixture"));
        assert!(html.contains(
            "/candidate-artifacts/run-candidates-with-fixtures/artifacts/candidate-fixture/screenshot.png"
        ));
    }

    #[test]
    fn candidate_gallery_template_renders_success_and_failure_cards() {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        let viewport = Viewport {
            width: 1280,
            height: 800,
        };
        let candidates = vec![
            CandidateSummary {
                candidate_id: "candidate-a".into(),
                screenshot_url: "/candidate-artifacts/run-1/artifacts/candidate-a/screenshot.png"
                    .into(),
                manifest: Manifest {
                    captured_at: chrono::Utc::now(),
                    viewport,
                    candidate_dir: "/tmp/candidate-a".into(),
                    exit_status: ExitStatus::Success,
                },
            },
            CandidateSummary {
                candidate_id: "candidate-b".into(),
                screenshot_url: "/candidate-artifacts/run-1/artifacts/candidate-b/screenshot.png"
                    .into(),
                manifest: Manifest {
                    captured_at: chrono::Utc::now(),
                    viewport,
                    candidate_dir: "/tmp/candidate-b".into(),
                    exit_status: ExitStatus::Failed {
                        reason: "chromium launch failed".into(),
                    },
                },
            },
        ];

        let html = CandidateGalleryTemplate {
            run_id: "run-1".into(),
            candidates,
        }
        .render()
        .unwrap();

        assert!(html.contains("/candidate-artifacts/run-1/artifacts/candidate-a/screenshot.png"));
        assert!(html.contains("chromium launch failed"));
        assert!(html.contains("candidate-card-failed"));
    }

    #[test]
    fn candidate_gallery_template_renders_empty_state() {
        let html = CandidateGalleryTemplate {
            run_id: "run-1".into(),
            candidates: vec![],
        }
        .render()
        .unwrap();

        assert!(html.contains("No candidates yet"));
    }

    // ---------------------------------------------------------------
    // Gate card (gallery-gate) tests
    // ---------------------------------------------------------------

    const GALLERY_DOT: &str = r#"digraph {
        Start [shape=Mdiamond];
        Gate1 [shape=hexagon, label="Human: pick direction(s)", gallery="true", candidate_count="phase_default(discover)"];
        NextA [shape=box];
        NextB [shape=box];
        Start -> Gate1;
        Gate1 -> NextA [label="proceed"];
        Gate1 -> NextB [label="iterate"];
    }"#;

    const PLAIN_DOT: &str =
        "digraph { Start [shape=Mdiamond]; A [shape=box]; End [shape=Msquare]; Start -> A -> End; }";

    /// Insert a RunRecord with the given DOT graph, returning its interviewer
    /// (shares the queue with the stored record).
    async fn insert_graph_record(
        state: &AppState,
        id: &str,
        dot: &str,
    ) -> smasher_attractor::http_interviewer::HttpInterviewer {
        use crate::state::RunRecord;
        use chrono::Utc;
        use smasher_attractor::dot::parser;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph;
        use smasher_attractor::http_interviewer::HttpInterviewer;
        use smasher_attractor::state::RunStatus;
        use std::sync::Arc;

        let parsed = parser::parse(dot).unwrap();
        let resolved = graph::resolve(&parsed).unwrap();
        let interviewer = HttpInterviewer::new();
        let record = RunRecord {
            id: id.into(),
            dot_source: dot.into(),
            graph: resolved,
            status: RunStatus::Running,
            started_at: Utc::now(),
            completed_at: None,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: tokio_util::sync::CancellationToken::new(),
            interviewer: interviewer.clone(),
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: None,
        };
        state.runs.write().await.insert(id.into(), record);
        interviewer
    }

    /// Push a genuinely pending question with a known id.
    fn push_pending_qid(
        interviewer: &smasher_attractor::http_interviewer::HttpInterviewer,
        qid: &str,
    ) {
        use smasher_attractor::http_interviewer::{PendingQuestion, QuestionKind};
        use std::time::Instant;

        let (tx, _rx) = tokio::sync::oneshot::channel();
        interviewer.queue().push(PendingQuestion {
            id: qid.into(),
            question: "Human: pick direction(s)".into(),
            choices: vec![],
            kind: QuestionKind::FreeForm,
            created_at: Instant::now(),
            answer_tx: Some(tx),
        });
    }

    fn write_gate_manifest(run_id: &str, candidate_id: &str, failed: bool) {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        let dir = std::path::Path::new("runs")
            .join(run_id)
            .join("artifacts")
            .join(candidate_id);
        std::fs::create_dir_all(&dir).unwrap();
        let manifest = Manifest {
            captured_at: chrono::Utc::now(),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: "/tmp/candidate".into(),
            exit_status: if failed {
                ExitStatus::Failed {
                    reason: "boom".into(),
                }
            } else {
                ExitStatus::Success
            },
        };
        std::fs::write(
            dir.join("manifest.json"),
            serde_json::to_string(&manifest).unwrap(),
        )
        .unwrap();
    }

    async fn get_questions_html(state: AppState, run_id: &str) -> (StatusCode, String) {
        let app = router().with_state(state);
        let req = Request::builder()
            .uri(format!("/runs/{run_id}/questions"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let status = resp.status();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        (status, String::from_utf8_lossy(&body).into_owned())
    }

    #[tokio::test]
    async fn run_questions_shows_gate_card_for_paused_gallery_run() {
        let run_id = "gate-card-paused";
        write_gate_manifest(run_id, "candidate-a", false);
        write_gate_manifest(run_id, "candidate-b", false);
        write_gate_manifest(run_id, "candidate-c", true);

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1");

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains(r#"<div class="gate-card""#), "gate card missing:\n{html}");
        assert!(html.contains(r#"data-question-id="q1""#));
        assert!(html.contains(
            "/api/runs/gate-card-paused/gallery/q1/decision"
        ));
        // Live candidates get checkboxes; the failed one does not.
        assert!(html.contains(r#"value="candidate-a""#));
        assert!(html.contains(r#"value="candidate-b""#));
        assert!(!html.contains(r#"value="candidate-c""#));
        // Expected-vs-found hint + one button per outgoing edge.
        assert!(html.contains("Expected 4, found 3"));
        assert!(html.contains(">proceed<"));
        assert!(html.contains(">iterate<"));
        // Lint-badge slot + reject-all note + click-to-expand anchor.
        assert!(html.contains("lint-badge-slot"));
        assert!(html.contains("reject-all"));
        assert!(html.contains("target=\"_blank\""));
        // Plain cards still render alongside.
        assert!(html.contains("question-card"));
    }

    #[tokio::test]
    async fn run_questions_plain_for_non_gallery_run() {
        let run_id = "gate-card-plain";
        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, PLAIN_DOT).await;
        push_pending_qid(&interviewer, "q1");

        let (status, html) = get_questions_html(state, run_id).await;

        assert_eq!(status, StatusCode::OK);
        assert!(!html.contains("data-question-id="));
        assert!(html.contains("question-card"));
    }

    #[tokio::test]
    async fn run_questions_no_gate_card_without_candidates() {
        let run_id = "gate-card-no-candidates";
        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1");

        let (status, html) = get_questions_html(state, run_id).await;

        assert_eq!(status, StatusCode::OK);
        assert!(!html.contains("data-question-id="));
        assert!(html.contains("question-card"));
    }

    #[tokio::test]
    async fn run_questions_no_gate_card_without_pending() {
        let run_id = "gate-card-no-pending";
        write_gate_manifest(run_id, "candidate-a", false);

        let state = test_state();
        insert_graph_record(&state, run_id, GALLERY_DOT).await;

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(!html.contains("data-question-id="));
        assert!(html.contains("No pending questions."));
    }
}
