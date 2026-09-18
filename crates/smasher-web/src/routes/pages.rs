// ABOUTME: HTML page route handlers serving askama templates for the dashboard UI.
// ABOUTME: Provides the browser-facing pages: dashboard, run detail, and fragments.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

use askama::Template;
use axum::Router;
use axum::extract::{Form, Path, State};
use axum::http::{HeaderMap, HeaderName, HeaderValue, StatusCode};
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post};

use smasher_attractor::events::PipelineEvent;
use smasher_attractor::rendering::{
    CachedRenderer, GraphRenderer, NodeExecutionStatus, RenderError, RenderFormat,
    StatusGraphvizRenderer,
};

use crate::candidates::{self, CandidateScorecard, CandidateSummary};
use crate::error::WebError;
use crate::state::{AppState, RunSummary};

// ---------------------------------------------------------------------------
// Template structs
// ---------------------------------------------------------------------------

#[derive(Template)]
#[template(path = "workflow_catalog.html")]
struct WorkflowCatalogTemplate {
    workflows: Vec<crate::workflows::WorkflowSummary>,
}

#[derive(Template)]
#[template(path = "runs_page.html")]
struct RunsPageTemplate {
    runs: Vec<RunSummary>,
}

#[derive(Template)]
#[template(path = "workflow_new.html")]
struct WorkflowNewTemplate {
    target_dirs: Vec<String>,
}

#[derive(Template)]
#[template(path = "workflow_detail.html")]
struct WorkflowDetailTemplate {
    workflow: crate::workflows::WorkflowSummary,
    dot_source: String,
    active_run: Option<RunSummary>,
    // Duplicated from `RunDetailTemplate` -- Askama template structs are
    // flat data, not composable, so `run_detail_body.html`'s `{% include %}`
    // needs these fields present here too when `active_run` is `Some`.
    historical_events: String,
    initial_input_tokens: u64,
    initial_output_tokens: u64,
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
    svg_content: Option<String>,
    error: Option<String>,
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

/// Template-friendly gate decision: candidate ids joined for display, timestamp
/// pre-formatted, decision-vs-log kept separate from `crate::sse`'s event rendering.
struct TemplateDecision {
    node_id: String,
    selected: Vec<String>,
    decision: String,
    comments: Vec<(String, String)>,
    timestamp: String,
}

impl From<crate::decision_history::GalleryDecision> for TemplateDecision {
    fn from(d: crate::decision_history::GalleryDecision) -> Self {
        let mut comments: Vec<(String, String)> = d.comments.into_iter().collect();
        comments.sort_by(|a, b| a.0.cmp(&b.0));
        Self {
            node_id: d.node_id,
            selected: d.selected,
            decision: d.decision,
            comments,
            timestamp: d.timestamp.to_rfc3339(),
        }
    }
}

#[derive(Template)]
#[template(path = "decision_history.html")]
struct DecisionHistoryTemplate {
    decisions: Vec<TemplateDecision>,
}

/// One gate-card candidate: its render-capture summary plus whichever of its
/// lint/critic/synthesis reports have been written so far.
struct GateCandidate {
    summary: CandidateSummary,
    scorecard: CandidateScorecard,
}

#[derive(Template)]
#[template(path = "gallery_gate.html")]
struct GalleryGateTemplate {
    run_id: String,
    question_id: String,
    candidates: Vec<GateCandidate>,
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
    pub brief: Option<String>,
    /// JSON-encoded `{node_id: {model?, provider?}}`, built client-side from the
    /// per-node override inputs. Each node defaults to the pipeline-wide `model`
    /// above unless listed here. Absent or malformed JSON is treated as empty.
    pub node_overrides: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct WorkflowRunForm {
    pub model: Option<String>,
    pub vars: Option<String>,
    pub brief: Option<String>,
    pub node_overrides: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct CreateWorkflowForm {
    pub name: String,
    pub target_dir: String,
    pub dot_source: String,
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
// Poll response helper
// ---------------------------------------------------------------------------
//
// The dashboard's polled sections (run status, token counter, questions,
// candidates, decisions, graph) used to re-render and swap their whole
// container on every tick regardless of whether anything had changed. That
// wiped out in-progress typing in the question form and tore down/reloaded
// any embedded candidate `<iframe>` every few seconds. `poll_response`
// fixes that at the response level: it fingerprints the rendered fragment
// and, when the requesting client's `X-If-Version` header already matches,
// tells htmx to skip the swap entirely via `HX-Reswap: none` instead of
// sending a body that would just replace the DOM with itself. See
// base.html's `data-poll` script for the client half that tracks and
// echoes the version.

const IF_VERSION_HEADER: &str = "x-if-version";
const FRAGMENT_VERSION_HEADER: &str = "x-fragment-version";

/// Cheap content fingerprint for a rendered fragment. Only ever compared
/// within a single running server process (the client echoes it back, it's
/// never persisted), so `DefaultHasher`'s lack of cross-process stability
/// doesn't matter here.
fn fragment_version(html: &str) -> String {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    html.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Renders a polled template and skips the DOM swap (`HX-Reswap: none`)
/// when the request's `X-If-Version` header already matches this render.
fn poll_response<T: Template>(headers: &HeaderMap, template: T) -> Response {
    let html = match template.render() {
        Ok(html) => html,
        Err(e) => {
            tracing::error!(error = %e, "template render failed");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("template error: {e}"),
            )
                .into_response();
        }
    };

    let version = fragment_version(&html);
    let unchanged = headers
        .get(IF_VERSION_HEADER)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|seen| seen == version);

    let mut response = if unchanged {
        (StatusCode::OK, [(HeaderName::from_static("hx-reswap"), "none")]).into_response()
    } else {
        Html(html).into_response()
    };
    response.headers_mut().insert(
        HeaderName::from_static(FRAGMENT_VERSION_HEADER),
        HeaderValue::from_str(&version).unwrap_or_else(|_| HeaderValue::from_static("0")),
    );
    response
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(workflow_catalog))
        .route("/workflows/new", get(workflow_new))
        .route("/workflows", post(create_workflow))
        .route("/workflows/{id}", get(workflow_detail))
        .route("/workflows/{id}/run", post(workflow_run))
        .route("/runs", get(runs_page).post(submit_run))
        .route("/runs/{id}", get(run_detail))
        .route("/runs/{id}/graph", get(run_graph))
        .route("/runs/{id}/status", get(run_status))
        .route("/runs/{id}/tokens", get(run_tokens))
        .route("/runs/{id}/questions", get(run_questions))
        .route("/runs/{id}/candidates", get(run_candidates))
        .route("/runs/{id}/decisions", get(run_decisions))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn workflow_catalog(State(state): State<AppState>) -> impl IntoResponse {
    let workflows = crate::workflows::scan_workflows(&state.workflow_dirs);
    HtmlTemplate(WorkflowCatalogTemplate { workflows })
}

async fn runs_page(State(state): State<AppState>) -> impl IntoResponse {
    let runs_map = state.runs.read().await;
    let runs = runs_for_workflow(&runs_map, None);
    HtmlTemplate(RunsPageTemplate { runs })
}

async fn workflow_new(State(state): State<AppState>) -> impl IntoResponse {
    HtmlTemplate(WorkflowNewTemplate {
        target_dirs: state.workflow_dirs.clone(),
    })
}

/// Writes the submitted DOT text to `{target_dir}/{name}.dot` and redirects
/// to the new workflow's detail page. `name` gets the same traversal-
/// rejection discipline `candidates::valid_id` already applies to candidate
/// ids: empty/whitespace-only and any `..`/`/`/`\` component are rejected
/// before anything touches disk.
async fn create_workflow(
    State(state): State<AppState>,
    Form(form): Form<CreateWorkflowForm>,
) -> Result<Response, WebError> {
    use smasher_attractor::dot::parser;

    let name = form.name.trim();
    if name.is_empty() {
        return Err(WebError::BadRequest(
            "workflow name must not be blank".into(),
        ));
    }
    if !crate::candidates::valid_id(name) {
        return Err(WebError::BadRequest(format!(
            "invalid workflow name: {name}"
        )));
    }
    // `target_dir` comes from a client-submitted form field (a <select>, but
    // nothing stops a forged request from sending any string) -- restrict
    // writes to directories the operator actually configured, not wherever
    // the request asks for.
    if !state.workflow_dirs.contains(&form.target_dir) {
        return Err(WebError::BadRequest(format!(
            "unknown target directory: {}",
            form.target_dir
        )));
    }

    parser::parse(&form.dot_source)?;

    let target_dir = std::path::Path::new(&form.target_dir);
    std::fs::create_dir_all(target_dir)?;
    let file_path = target_dir.join(format!("{name}.dot"));
    std::fs::write(&file_path, &form.dot_source)?;

    let root_name = crate::workflows::root_name_for(&form.target_dir);
    let id = crate::workflows::slug_for(&root_name, std::path::Path::new(&format!("{name}.dot")));

    Ok(axum::response::Redirect::to(&format!("/workflows/{id}")).into_response())
}

/// Runs scoped to a single workflow (`Some(id)`) or every run (`None`),
/// newest-first by `started_at` -- the shared row source behind both
/// `/runs` and a workflow's own Run History section.
fn runs_for_workflow(
    runs_map: &HashMap<String, crate::state::RunRecord>,
    workflow_id: Option<&str>,
) -> Vec<RunSummary> {
    let mut runs: Vec<RunSummary> = runs_map
        .values()
        .filter(|r| workflow_id.is_none() || r.workflow_id.as_deref() == workflow_id)
        .map(|r| r.to_summary())
        .collect();
    runs.sort_by(|a, b| b.started_at.cmp(&a.started_at));
    runs
}

/// A workflow's detail page: header, read-only DOT source, a Run form when
/// idle, or the same live sections `/runs/{id}` shows once a run exists --
/// plus a Run History table scoped to this workflow.
async fn workflow_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;
    let dot_source = std::fs::read_to_string(&workflow.path)?;

    let runs_map = state.runs.read().await;
    let runs = runs_for_workflow(&runs_map, Some(&id));
    // `runs_for_workflow` sorts newest-first, so the first entry is the
    // most-recently-started run for this workflow -- the "active" one.
    let active_run = runs.first().cloned();

    let (historical_events, initial_input_tokens, initial_output_tokens) = match &active_run {
        Some(active) => match runs_map.get(&active.id) {
            Some(record) => {
                let mut events = record.event_log.events();
                events.reverse();
                let historical_events: String =
                    events.iter().map(crate::sse::render_event_html).collect();
                (
                    historical_events,
                    record.input_tokens.load(Ordering::Relaxed),
                    record.output_tokens.load(Ordering::Relaxed),
                )
            }
            None => (String::new(), 0, 0),
        },
        None => (String::new(), 0, 0),
    };

    Ok(HtmlTemplate(WorkflowDetailTemplate {
        workflow,
        dot_source,
        active_run,
        historical_events,
        initial_input_tokens,
        initial_output_tokens,
        runs,
    }))
}

/// Launches a run of a workflow's current on-disk `.dot` file (read fresh,
/// not any page-load snapshot) and redirects back to the workflow's own
/// detail page rather than `/runs/{id}`, per the spec's redirect-target
/// decision.
async fn workflow_run(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Form(form): Form<WorkflowRunForm>,
) -> Result<Response, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;
    let dot_source = std::fs::read_to_string(&workflow.path)?;

    create_run(
        &state,
        dot_source,
        form.model,
        form.vars,
        form.brief,
        form.node_overrides,
        Some(id.clone()),
    )
    .await?;

    let response = Response::builder()
        .status(StatusCode::OK)
        .header("HX-Redirect", format!("/workflows/{id}"))
        .body(axum::body::Body::empty())
        .unwrap();
    Ok(response)
}

async fn submit_run(
    State(state): State<AppState>,
    Form(form): Form<SubmitForm>,
) -> Result<Response, WebError> {
    let run_id = create_run(
        &state,
        form.dot_source,
        form.model,
        form.vars,
        form.brief,
        form.node_overrides,
        None,
    )
    .await?;

    let response = Response::builder()
        .status(StatusCode::OK)
        .header("HX-Redirect", format!("/runs/{run_id}"))
        .body(axum::body::Body::empty())
        .unwrap();
    Ok(response)
}

/// Validates, lints, and launches a pipeline run: parses `dot_source`,
/// applies variables/overrides/transforms, creates the run's artifact
/// directory, registers the `RunRecord`, and spawns the engine task.
/// Returns the new run's id. `workflow_id` is `Some(id)` when launched from
/// a workflow's detail page, `None` for the paste-a-DOT-file `/runs` form.
async fn create_run(
    state: &AppState,
    dot_source: String,
    model: Option<String>,
    vars: Option<String>,
    brief: Option<String>,
    node_overrides: Option<String>,
    workflow_id: Option<String>,
) -> Result<String, WebError> {
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
    use smasher_attractor::interviewer::InterviewerHandler;
    use smasher_attractor::lint::LintRunner;
    use smasher_attractor::log_sink::LogSink;
    use smasher_attractor::manager_handler::ManagerHandler;
    use smasher_attractor::parallel::ParallelHandler;
    use smasher_attractor::state::{Context, RunStatus};
    use smasher_attractor::tool_handler::{ToolBackend, ToolHandler};
    use smasher_attractor::transforms;

    use crate::backend::{AgentCodergenBackend, LlmManagerBackend, LlmToolBackend};
    use crate::state::RunRecord;

    let dot_graph = parser::parse(&dot_source)?;
    let mut resolved = graph::resolve(&dot_graph)?;

    let mut variables: HashMap<String, String> = HashMap::new();
    if let Some(ref vars_text) = vars {
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
    if let Some(brief) = brief.as_deref().map(str::trim).filter(|b| !b.is_empty()) {
        variables.insert("brief".into(), brief.to_string());
    }

    let model = model
        .filter(|m| !m.is_empty())
        .unwrap_or_else(|| state.default_model.clone());
    let provider = state.default_provider.clone();
    variables.insert("model".into(), model.clone());

    let node_overrides: HashMap<String, transforms::NodeOverride> = match node_overrides
        .as_deref()
        .filter(|s| !s.trim().is_empty())
    {
        Some(json) => serde_json::from_str(json)
            .map_err(|e| WebError::BadRequest(format!("invalid node_overrides JSON: {e}")))?,
        None => HashMap::new(),
    };
    transforms::apply_node_overrides(&mut resolved, &node_overrides);

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
    let mut run_directory = smasher_attractor::run_dir::RunDirectory::create(
        &artifacts_base,
        &run_id,
        &graph_name,
        &dot_source,
    )
    .map_err(|e| WebError::Internal(format!("failed to create run directory: {e}")))?;
    if let Err(e) = run_directory.symlink_into_root("design-kit", &crate::server::design_kit_dir())
    {
        tracing::warn!(error = %e, "failed to link design-kit into run directory");
    }
    std::fs::write(
        run_directory.manifest().directories.root.join("graph.dot"),
        &dot_source,
    )?;
    run_directory
        .persist_run_metadata(workflow_id.clone(), Some("Running".to_string()), 0, 0, None)
        .map_err(|e| WebError::Internal(format!("failed to persist run metadata: {e}")))?;
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
        dot_source: dot_source.clone(),
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
        workflow_id: workflow_id.clone(),
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
    let candidate_artifacts_dir = run_directory.manifest().directories.artifacts.clone();
    let mut run_directory_clone = run_directory.clone();
    tokio::spawn(async move {
        let backend = Arc::new(AgentCodergenBackend::new(
            Arc::clone(&client),
            model.clone(),
            provider.clone(),
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
            provider.clone(),
            run_working_dir.clone(),
        ));
        let llm_tool_backend = Arc::new(LlmToolBackend::new(
            Arc::clone(&client),
            model.clone(),
            provider.clone(),
            run_working_dir.clone(),
        ));
        let render_capture_backend =
            Arc::new(smasher_render_capture::backend::HybridToolBackend::new(
                llm_tool_backend as Arc<dyn ToolBackend>,
                candidate_artifacts_dir.clone(),
                PathBuf::from(&run_working_dir),
            ));
        let system_lint_backend =
            Arc::new(smasher_system_lint::backend::SystemLintToolBackend::new(
                render_capture_backend as Arc<dyn ToolBackend>,
                candidate_artifacts_dir.clone(),
                PathBuf::from(&run_working_dir),
            ));
        let tool_backend = Arc::new(
            smasher_task_critic_synthesis::backend::TaskCriticSynthesisToolBackend::new(
                system_lint_backend as Arc<dyn ToolBackend>,
                model.clone(),
                model.clone(),
                provider.clone(),
                candidate_artifacts_dir.clone(),
            ),
        );

        // Build a child registry for ParallelHandler to dispatch within parallel nodes.
        // Clone the backends as trait object Arcs for the child registry.
        let child_codergen: Arc<dyn smasher_attractor::handler::CodergenBackend> = backend.clone();
        let child_manager: Arc<dyn smasher_attractor::manager_handler::ManagerBackend> =
            manager_backend.clone();
        let child_tool: Arc<dyn smasher_attractor::tool_handler::ToolBackend> =
            tool_backend.clone();
        // Shared with InterviewerHandler below so a hexagon gate's
        // `question_source` attribute can pull a prior Codergen node's
        // response text out of the same store the engine records into.
        let artifact_store = ArtifactStore::new();

        let mut child_registry = HandlerRegistry::new();
        child_registry.register(Arc::new(CodergenHandler::new(child_codergen)));
        child_registry.register(Arc::new(
            InterviewerHandler::builder(Arc::clone(&interviewer_arc))
                .with_artifact_store(artifact_store.clone())
                .build(),
        ));
        child_registry.register(Arc::new(ManagerHandler::new(child_manager)));
        child_registry.register(Arc::new(ToolHandler::new(child_tool)));

        let mut registry = default_registry();
        registry.register(Arc::new(CodergenHandler::new(backend)));
        registry.register(Arc::new(
            InterviewerHandler::builder(interviewer_arc)
                .with_artifact_store(artifact_store.clone())
                .build(),
        ));
        registry.register(Arc::new(ManagerHandler::new(manager_backend)));
        registry.register(Arc::new(ToolHandler::new(tool_backend)));
        registry.register(Arc::new(ParallelHandler::new(Arc::new(child_registry))));

        let config = EngineConfig {
            max_steps: 1000,
            enable_checkpointing: true,
            checkpoint_dir: Some(checkpoint_dir),
            cancellation_token: Some(cancellation),
            artifact_store: Some(artifact_store),
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
            if let Err(e) = run_directory_clone.persist_run_metadata(
                workflow_id.clone(),
                Some(format!("{:?}", record.status)),
                record.input_tokens.load(Ordering::Relaxed),
                record.output_tokens.load(Ordering::Relaxed),
                record.completed_at,
            ) {
                tracing::warn!(error = %e, "failed to persist run metadata after run completion");
            }
        }
    });

    Ok(run_id)
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
    headers: HeaderMap,
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
    match cached.render(&record.graph, RenderFormat::Svg).await {
        Ok(output) => {
            let svg_content = String::from_utf8_lossy(&output.content).to_string();
            Ok(poll_response(
                &headers,
                GraphTemplate {
                    svg_content: Some(svg_content),
                    error: None,
                },
            ))
        }
        Err(e) => {
            tracing::error!(error = %e, "graph render failed");
            let error = match &e {
                RenderError::GraphvizUnavailable { .. } => {
                    "Graphviz's `dot` command isn't installed, or isn't on PATH. \
                     Install it (e.g. `brew install graphviz` on macOS, \
                     `apt install graphviz` on Debian/Ubuntu) and reload this page."
                        .to_string()
                }
                RenderError::GraphvizFailed { message } => {
                    format!("Graphviz failed to render this graph: {message}")
                }
                RenderError::UnsupportedFormat { .. } => e.to_string(),
            };
            Ok(poll_response(
                &headers,
                GraphTemplate {
                    svg_content: None,
                    error: Some(error),
                },
            ))
        }
    }
}

async fn run_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let summary = record.to_summary();
    Ok(poll_response(&headers, RunStatusTemplate { run: summary }))
}

async fn run_tokens(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let input = record.input_tokens.load(Ordering::Relaxed);
    let output = record.output_tokens.load(Ordering::Relaxed);
    Ok(poll_response(
        &headers,
        TokenTemplate {
            input_tokens: input,
            output_tokens: output,
        },
    ))
}

async fn run_questions(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, WebError> {
    use crate::routes::gallery::{
        candidate_ids_for_gate, find_gallery_gate_for_node, resolve_candidate_count,
    };

    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    let pending = record.interviewer.list_questions();
    // Find whichever pending question actually belongs to a gallery gate, and
    // use *that* gate — not just the graph's first gallery-shaped node. A
    // pipeline with more than one gallery gate (e.g. a Discover gate and a
    // separate Define gate) would otherwise only ever render a gate card for
    // the first one, silently degrading every later gate to a plain
    // free-text question card.
    let pending_gallery = pending.questions.iter().find_map(|q| {
        let node_id = q.node_id.as_deref()?;
        let gate = find_gallery_gate_for_node(&record.graph, node_id)?;
        Some((q.id.clone(), gate))
    });
    let gallery_question_id = pending_gallery.as_ref().map(|(qid, _)| qid.clone());
    // `gallery_question_id` is moved into the `gallery_gate_html` closure
    // below (it's consumed there via `?`), so keep a second clone to compare
    // against after the card is rendered.
    let dedupe_question_id = gallery_question_id.clone();
    let gate = pending_gallery.map(|(_, gate)| gate);
    let mut questions: Vec<TemplateQuestion> = pending
        .questions
        .into_iter()
        .map(TemplateQuestion::from)
        .collect();

    // Gallery gate card: the pending gallery gate + its candidates.
    // Renders alongside (not instead of) the plain question cards.
    let artifacts_base = std::path::Path::new(&state.data_dir).join("artifacts");
    let gallery_gate_html = gate.and_then(|gate| {
        let question_id = gallery_question_id?;
        let all = candidates::scan_candidates(&artifacts_base, &id);
        if all.is_empty() {
            return None;
        }
        // Scope the card to this gate's own step, not the run's whole
        // artifact history — a later gate shouldn't drag an earlier gate's
        // already-decided candidates back into the picture. Falls back to
        // showing everything found when the graph can't tell candidates
        // apart by step (e.g. no render_capture-style Tool nodes on record).
        let relevant_ids = candidate_ids_for_gate(&record.graph, &gate.id);
        let filtered: Vec<CandidateSummary> = if relevant_ids.is_empty() {
            Vec::new()
        } else {
            all.iter()
                .filter(|c| relevant_ids.contains(&c.candidate_id))
                .cloned()
                .collect()
        };
        let found = if filtered.is_empty() { all } else { filtered };
        let candidates: Vec<GateCandidate> = found
            .into_iter()
            .map(|summary| {
                let scorecard =
                    candidates::read_scorecard(&artifacts_base, &id, &summary.candidate_id);
                GateCandidate { summary, scorecard }
            })
            .collect();
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
            candidates,
            expected_count,
            outgoing_edges,
        }
        .render()
        .map_err(|e| {
            tracing::error!(error = %e, "gallery gate template render failed");
        })
        .ok()
    });

    // Suppress the redundant plain question card for the gate's own pending
    // question — but only once a gate card actually rendered. Keyed off the
    // rendered `Option`, not "is this node gallery-shaped": if the card
    // fails to render for any reason, the plain card must still be the
    // paused run's only way to answer.
    if gallery_gate_html.is_some()
        && let Some(qid) = &dedupe_question_id
    {
        questions.retain(|q| &q.id != qid);
    }

    Ok(poll_response(
        &headers,
        QuestionCardTemplate {
            run_id: id,
            questions,
            gallery_gate_html,
        },
    ))
}

async fn run_candidates(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, WebError> {
    {
        let runs = state.runs.read().await;
        runs.get(&id)
            .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    }

    let artifacts_base = std::path::Path::new(&state.data_dir).join("artifacts");
    let candidates = candidates::scan_candidates(&artifacts_base, &id);
    Ok(poll_response(
        &headers,
        CandidateGalleryTemplate {
            run_id: id,
            candidates,
        },
    ))
}

async fn run_decisions(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

    let events = record.event_log.events();
    let decisions = crate::decision_history::gallery_decisions(&events, &record.graph)
        .into_iter()
        .map(TemplateDecision::from)
        .collect();

    Ok(poll_response(&headers, DecisionHistoryTemplate { decisions }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use tower::ServiceExt;

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![])
    }

    /// A `test_state()` rooted at a fresh temp dir, for tests that need to write
    /// real candidate artifacts and read them back through a run's real
    /// `{data_dir}/artifacts/<run_id>/artifacts/` tree rather than sharing `/tmp`.
    fn test_state_with_data_dir() -> (AppState, tempfile::TempDir) {
        let data_dir = tempfile::tempdir().unwrap();
        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(
            client,
            "test-model".into(),
            None,
            data_dir.path().display().to_string(),
            vec![],
        );
        (state, data_dir)
    }

    /// `{data_dir}/artifacts/<run_id>/artifacts/<candidate_id>/`, the real layout
    /// a `RunDirectory` creates and `candidates::scan_candidates` reads back.
    fn candidate_fixture_dir(
        data_dir: &std::path::Path,
        run_id: &str,
        candidate_id: &str,
    ) -> std::path::PathBuf {
        data_dir
            .join("artifacts")
            .join(run_id)
            .join("artifacts")
            .join(candidate_id)
    }

    #[tokio::test]
    async fn root_shows_empty_state_with_no_workflows() {
        let app = router().with_state(test_state());
        let req = Request::builder().uri("/").body(Body::empty()).unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("SMASHER"));
        assert!(html.contains("No workflows found"));
    }

    #[tokio::test]
    async fn root_lists_workflows_found_under_configured_dirs() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();

        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(
            client,
            "test-model".into(),
            None,
            "/tmp".into(),
            vec![tmp.path().display().to_string()],
        );
        let app = router().with_state(state);
        let req = Request::builder().uri("/").body(Body::empty()).unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("hello.dot"));
        assert!(html.contains("/workflows/"));
    }

    #[tokio::test]
    async fn runs_page_lists_run_history() {
        let state = test_state();
        insert_test_record(&state, "run-for-runs-page").await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri("/runs")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("run-for-runs-page"));
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

    /// Regression coverage for the `run_detail_body.html` extraction --
    /// `/runs/{id}` must still render the same live sections (status,
    /// tokens, questions, candidates, graph, telemetry) it did before the
    /// markup moved into an `{% include %}`.
    #[tokio::test]
    async fn run_detail_renders_live_sections_for_a_real_run() {
        let state = test_state();
        insert_test_record(&state, "run-detail-render").await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri("/runs/run-detail-render")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("Run run-detail-render"));
        assert!(html.contains("hx-get=\"/runs/run-detail-render/status\""));
        assert!(html.contains("hx-get=\"/runs/run-detail-render/tokens\""));
        assert!(html.contains("id=\"question-list\""));
        assert!(html.contains("id=\"candidate-list\""));
        assert!(html.contains("id=\"graph-container\""));
        assert!(html.contains("id=\"telemetry-drawer\""));
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
    async fn submit_run_with_brief_field_sets_brief_variable() {
        let (state, _data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());
        // URL-encoded: dot_source=digraph { start [shape=circle]; a [shape=box]; end [shape=doublecircle]; start -> a -> end }
        // brief=Build+a+todo+app
        let body = "dot_source=digraph+%7B+start+%5Bshape%3Dcircle%5D%3B+a+%5Bshape%3Dbox%5D%3B+end+%5Bshape%3Ddoublecircle%5D%3B+start+-%3E+a+-%3E+end+%7D&brief=Build+a+todo+app";
        let req = Request::builder()
            .method("POST")
            .uri("/runs")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let run_id = resp
            .headers()
            .get("HX-Redirect")
            .unwrap()
            .to_str()
            .unwrap()
            .trim_start_matches("/runs/")
            .to_string();

        let runs = state.runs.read().await;
        let record = runs.get(&run_id).expect("run should be recorded");
        assert_eq!(record.variables.get("brief").map(String::as_str), Some("Build a todo app"));
    }

    /// Minimal `application/x-www-form-urlencoded` value encoder for building test
    /// bodies — percent-encodes everything outside a small unreserved set, matching
    /// what a browser's `FormData`/`URLSearchParams` would send.
    fn urlencode(s: &str) -> String {
        let mut out = String::with_capacity(s.len());
        for b in s.bytes() {
            match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                    out.push(b as char)
                }
                b' ' => out.push('+'),
                _ => out.push_str(&format!("%{b:02X}")),
            }
        }
        out
    }

    #[tokio::test]
    async fn submit_run_with_node_overrides_stamps_model_onto_the_named_node() {
        let (state, _data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());

        let dot_source =
            "digraph { start [shape=circle]; a [shape=box]; end [shape=doublecircle]; start -> a -> end }";
        let node_overrides = r#"{"a": {"model": "claude-opus-4", "provider": "anthropic"}}"#;
        let body = format!(
            "dot_source={}&node_overrides={}",
            urlencode(dot_source),
            urlencode(node_overrides)
        );
        let req = Request::builder()
            .method("POST")
            .uri("/runs")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let run_id = resp
            .headers()
            .get("HX-Redirect")
            .unwrap()
            .to_str()
            .unwrap()
            .trim_start_matches("/runs/")
            .to_string();

        let runs = state.runs.read().await;
        let record = runs.get(&run_id).expect("run should be recorded");
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
        let start_node = record.graph.nodes.iter().find(|n| n.id == "start").unwrap();
        assert_eq!(start_node.attrs.get("model"), None);
    }

    #[tokio::test]
    async fn submit_run_with_malformed_node_overrides_returns_bad_request() {
        let (state, _data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());

        let dot_source = "digraph { start [shape=circle]; end [shape=doublecircle]; start -> end }";
        let body = format!(
            "dot_source={}&node_overrides={}",
            urlencode(dot_source),
            urlencode("{not valid json")
        );
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
    async fn submit_run_without_brief_field_leaves_brief_unset() {
        let (state, _data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());
        let body = "dot_source=digraph+%7B+start+%5Bshape%3Dcircle%5D%3B+a+%5Bshape%3Dbox%5D%3B+end+%5Bshape%3Ddoublecircle%5D%3B+start+-%3E+a+-%3E+end+%7D";
        let req = Request::builder()
            .method("POST")
            .uri("/runs")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let run_id = resp
            .headers()
            .get("HX-Redirect")
            .unwrap()
            .to_str()
            .unwrap()
            .trim_start_matches("/runs/")
            .to_string();

        let runs = state.runs.read().await;
        let record = runs.get(&run_id).expect("run should be recorded");
        assert!(!record.variables.contains_key("brief"));
    }

    /// Sends a `POST /runs` request with the given raw (already
    /// urlencoded-if-needed) `dot_source` and returns the run id from the
    /// `HX-Redirect` response header.
    async fn submit_dot_source(app: axum::Router, dot_source: &str) -> String {
        let body = format!("dot_source={}", urlencode(dot_source));
        let req = Request::builder()
            .method("POST")
            .uri("/runs")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        resp.headers()
            .get("HX-Redirect")
            .unwrap()
            .to_str()
            .unwrap()
            .trim_start_matches("/runs/")
            .to_string()
    }

    #[tokio::test]
    async fn post_runs_writes_graph_dot_to_run_directory() {
        let (state, data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());
        let dot_source = "digraph { start [shape=circle]; end [shape=doublecircle]; start -> end }";

        let run_id = submit_dot_source(app, dot_source).await;

        let graph_dot = std::fs::read_to_string(
            data_dir.path().join("artifacts").join(&run_id).join("graph.dot"),
        )
        .expect("graph.dot should be written alongside manifest.json");
        assert_eq!(graph_dot, dot_source);
    }

    #[tokio::test]
    async fn post_runs_manifest_has_null_workflow_id_and_running_status() {
        let (state, data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());
        let dot_source = "digraph { start [shape=circle]; end [shape=doublecircle]; start -> end }";

        let run_id = submit_dot_source(app, dot_source).await;

        let manifest_json = std::fs::read_to_string(
            data_dir
                .path()
                .join("artifacts")
                .join(&run_id)
                .join("manifest.json"),
        )
        .unwrap();
        let manifest: serde_json::Value = serde_json::from_str(&manifest_json).unwrap();
        assert!(manifest["workflow_id"].is_null());
        assert_eq!(manifest["status"], "Running");
    }

    #[tokio::test]
    async fn run_reaching_terminal_state_persists_final_status_and_tokens_to_manifest() {
        use smasher_attractor::state::RunStatus;

        let (state, data_dir) = test_state_with_data_dir();
        let app = router().with_state(state.clone());
        // No `box`-shaped (Codergen) node -- a trivial pipeline that completes
        // without any real LLM calls, so the test can wait for a genuine
        // terminal transition instead of hitting the network.
        let dot_source = "digraph { start [shape=circle]; end [shape=doublecircle]; start -> end }";

        let run_id = submit_dot_source(app, dot_source).await;

        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
        let final_status = loop {
            let runs = state.runs.read().await;
            let record = runs.get(&run_id).expect("run should be recorded");
            if !matches!(record.status, RunStatus::Running) {
                break format!("{:?}", record.status);
            }
            drop(runs);
            if std::time::Instant::now() > deadline {
                panic!("run did not reach a terminal state in time");
            }
            tokio::time::sleep(std::time::Duration::from_millis(20)).await;
        };

        let manifest_json = std::fs::read_to_string(
            data_dir
                .path()
                .join("artifacts")
                .join(&run_id)
                .join("manifest.json"),
        )
        .unwrap();
        let manifest: serde_json::Value = serde_json::from_str(&manifest_json).unwrap();
        assert_eq!(manifest["status"], final_status);
        assert!(manifest["input_tokens"].is_u64());
        assert!(manifest["output_tokens"].is_u64());
        assert!(
            !manifest["completed_at"].is_null(),
            "completed_at should be stamped once the run reaches a terminal state"
        );
    }

    fn state_with_workflow_dir(dir: &std::path::Path) -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(
            client,
            "test-model".into(),
            None,
            "/tmp".into(),
            vec![dir.display().to_string()],
        )
    }

    #[tokio::test]
    async fn new_workflow_form_renders() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let req = Request::builder()
            .uri("/workflows/new")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("Add Workflow"));
        assert!(html.contains(&tmp.path().display().to_string()));
    }

    #[tokio::test]
    async fn create_workflow_writes_file_and_redirects() {
        let tmp = tempfile::tempdir().unwrap();
        let target_dir = tmp.path().display().to_string();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = format!(
            "name=hello&target_dir={}&dot_source={}",
            urlencode(&target_dir),
            urlencode("digraph { a -> b }")
        );
        let req = Request::builder()
            .method("POST")
            .uri("/workflows")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::SEE_OTHER);
        let location = resp
            .headers()
            .get("location")
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        assert!(location.starts_with("/workflows/"));

        let written = std::fs::read_to_string(tmp.path().join("hello.dot")).unwrap();
        assert_eq!(written, "digraph { a -> b }");
    }

    #[tokio::test]
    async fn create_workflow_rejects_invalid_dot() {
        let tmp = tempfile::tempdir().unwrap();
        let target_dir = tmp.path().display().to_string();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = format!(
            "name=hello&target_dir={}&dot_source={}",
            urlencode(&target_dir),
            urlencode("not a valid dot graph")
        );
        let req = Request::builder()
            .method("POST")
            .uri("/workflows")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::UNPROCESSABLE_ENTITY);
        assert!(!tmp.path().join("hello.dot").exists());
    }

    #[tokio::test]
    async fn create_workflow_rejects_blank_name() {
        let tmp = tempfile::tempdir().unwrap();
        let target_dir = tmp.path().display().to_string();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = format!(
            "name={}&target_dir={}&dot_source={}",
            urlencode("   "),
            urlencode(&target_dir),
            urlencode("digraph { a -> b }")
        );
        let req = Request::builder()
            .method("POST")
            .uri("/workflows")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
        assert_eq!(std::fs::read_dir(tmp.path()).unwrap().count(), 0);
    }

    #[tokio::test]
    async fn create_workflow_rejects_path_traversal_name() {
        let tmp = tempfile::tempdir().unwrap();
        let target_dir = tmp.path().display().to_string();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = format!(
            "name={}&target_dir={}&dot_source={}",
            urlencode("../../etc/passwd"),
            urlencode(&target_dir),
            urlencode("digraph { a -> b }")
        );
        let req = Request::builder()
            .method("POST")
            .uri("/workflows")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
        assert_eq!(std::fs::read_dir(tmp.path()).unwrap().count(), 0);
    }

    #[tokio::test]
    async fn create_workflow_rejects_unknown_target_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = format!(
            "name=hello&target_dir={}&dot_source={}",
            urlencode("/etc"),
            urlencode("digraph { a -> b }")
        );
        let req = Request::builder()
            .method("POST")
            .uri("/workflows")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn workflow_detail_known_id_shows_name_source_dir_and_dot_source() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();

        // The id encodes the configured root's *last path component*, which
        // is a random tempdir name here, not a fixed string -- compute it
        // the same way scan_workflows would rather than hardcoding it.
        let dirs = vec![tmp.path().display().to_string()];
        let real_id = crate::workflows::scan_workflows(&dirs)
            .first()
            .unwrap()
            .id
            .clone();

        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let req = Request::builder()
            .uri(format!("/workflows/{real_id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("hello.dot"));
        // askama HTML-escapes the raw DOT source (`>` -> `&gt;`), correctly.
        assert!(html.contains("digraph { a -&gt; b }"));
        assert!(html.contains("All workflows"));
    }

    #[tokio::test]
    async fn workflow_detail_unknown_id_returns_404() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let req = Request::builder()
            .uri("/workflows/no-such-id")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    /// Resolves the single workflow `scan_workflows` finds under `dir` --
    /// used by tests that need a real workflow id to address by URL.
    fn only_workflow_id(dir: &std::path::Path) -> String {
        let dirs = vec![dir.display().to_string()];
        crate::workflows::scan_workflows(&dirs).first().unwrap().id.clone()
    }

    #[tokio::test]
    async fn workflow_detail_with_no_runs_shows_run_form_not_live_sections() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let id = only_workflow_id(tmp.path());

        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let req = Request::builder()
            .uri(format!("/workflows/{id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);

        assert!(html.contains(&format!("hx-post=\"/workflows/{id}/run\"")));
        assert!(!html.contains("id=\"run-status\""));
        assert!(!html.contains("id=\"token-counter\""));
        assert!(!html.contains("id=\"question-list\""));
        assert!(!html.contains("id=\"candidate-list\""));
        assert!(!html.contains("id=\"graph-container\""));
    }

    #[tokio::test]
    async fn workflow_detail_with_a_run_shows_the_same_live_sections_as_run_detail() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let id = only_workflow_id(tmp.path());

        let state = state_with_workflow_dir(tmp.path());
        insert_test_record_for_workflow(&state, "run-1", Some(&id), chrono::Utc::now()).await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri(format!("/workflows/{id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);

        assert!(!html.contains(&format!("hx-post=\"/workflows/{id}/run\"")));
        assert!(html.contains("hx-get=\"/runs/run-1/status\""));
        assert!(html.contains("hx-get=\"/runs/run-1/tokens\""));
        assert!(html.contains("hx-get=\"/runs/run-1/questions\""));
        assert!(html.contains("hx-get=\"/runs/run-1/candidates\""));
        assert!(html.contains("hx-get=\"/runs/run-1/graph\""));
    }

    #[tokio::test]
    async fn workflow_detail_shows_dot_source_read_only_with_no_edit_form() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let id = only_workflow_id(tmp.path());

        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let req = Request::builder()
            .uri(format!("/workflows/{id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);

        assert!(html.contains("<pre class=\"dot-source-preview\">digraph { a -&gt; b }</pre>"));
        // The DOT source itself is never editable -- no textarea named
        // `dot_source` and no form that could write it back to disk (the
        // spec's "Never do: DOT editing"). Other run-parameter textareas
        // (vars/brief/node_overrides) are fine.
        assert!(!html.contains("name=\"dot_source\""));
        assert!(!html.contains("action=\"/workflows"));
    }

    #[tokio::test]
    async fn workflow_detail_run_history_is_scoped_to_the_workflow() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let workflow_a = only_workflow_id(tmp.path());

        let state = state_with_workflow_dir(tmp.path());
        let base = chrono::Utc::now();
        insert_test_record_for_workflow(&state, "run-a1", Some(&workflow_a), base).await;
        insert_test_record_for_workflow(
            &state,
            "run-a2",
            Some(&workflow_a),
            base + chrono::Duration::seconds(1),
        )
        .await;
        insert_test_record_for_workflow(
            &state,
            "run-b1",
            Some("some-other-workflow"),
            base + chrono::Duration::seconds(2),
        )
        .await;
        let app = router().with_state(state.clone());

        let req = Request::builder()
            .uri(format!("/workflows/{workflow_a}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.clone().oneshot(req).await.unwrap();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("run-a1"));
        assert!(html.contains("run-a2"));
        assert!(!html.contains("run-b1"));

        let req = Request::builder()
            .uri("/runs")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);
        assert!(html.contains("run-a1"));
        assert!(html.contains("run-a2"));
        assert!(html.contains("run-b1"));
    }

    #[tokio::test]
    async fn workflow_detail_active_run_is_the_most_recently_started_one() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let id = only_workflow_id(tmp.path());

        let state = state_with_workflow_dir(tmp.path());
        let base = chrono::Utc::now();
        insert_test_record_for_workflow(&state, "run-older", Some(&id), base).await;
        insert_test_record_for_workflow(
            &state,
            "run-newer",
            Some(&id),
            base + chrono::Duration::seconds(5),
        )
        .await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri(format!("/workflows/{id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);

        // The live section addresses the newer run...
        assert!(html.contains("hx-get=\"/runs/run-newer/status\""));
        assert!(!html.contains("hx-get=\"/runs/run-older/status\""));
        // ...but the history table still lists both.
        assert!(html.contains("run-older"));
        assert!(html.contains("run-newer"));
    }

    /// Found via manual QA: once a workflow has ever had a run, the Run form
    /// disappeared for good, even after that run finished (Completed,
    /// Failed, or -- as observed after a restart-survival check --
    /// Aborted). A workflow must stay re-runnable once its active run is no
    /// longer in flight.
    #[tokio::test]
    async fn workflow_detail_shows_run_form_again_once_active_run_is_terminal() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let id = only_workflow_id(tmp.path());

        let state = state_with_workflow_dir(tmp.path());
        insert_test_record_for_workflow_with_status(
            &state,
            "run-done",
            Some(&id),
            chrono::Utc::now(),
            smasher_attractor::state::RunStatus::Completed,
        )
        .await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri(format!("/workflows/{id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);

        assert!(
            html.contains(&format!("hx-post=\"/workflows/{id}/run\"")),
            "Run form should reappear once the active run is terminal:\n{html}"
        );
        // The finished run's own view should still be visible too.
        assert!(html.contains("hx-get=\"/runs/run-done/status\""));
    }

    /// While a run is genuinely still in flight (including paused at a
    /// human gate, which stays "Running" until answered), the Run form
    /// should stay hidden -- launching a second run isn't the right escape
    /// hatch for "waiting on my input."
    #[tokio::test]
    async fn workflow_detail_hides_run_form_while_active_run_is_running() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("hello.dot"), "digraph { a -> b }").unwrap();
        let id = only_workflow_id(tmp.path());

        let state = state_with_workflow_dir(tmp.path());
        insert_test_record_for_workflow(&state, "run-live", Some(&id), chrono::Utc::now()).await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri(format!("/workflows/{id}"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let html = String::from_utf8_lossy(&body);

        assert!(!html.contains(&format!("hx-post=\"/workflows/{id}/run\"")));
    }

    fn state_with_workflow_dir_and_data_dir(
        workflow_dir: &std::path::Path,
        data_dir: &std::path::Path,
    ) -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(
            client,
            "test-model".into(),
            None,
            data_dir.display().to_string(),
            vec![workflow_dir.display().to_string()],
        )
    }

    async fn post_workflow_run(app: axum::Router, id: &str) -> Response {
        let req = Request::builder()
            .method("POST")
            .uri(format!("/workflows/{id}/run"))
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(""))
            .unwrap();
        app.oneshot(req).await.unwrap()
    }

    #[tokio::test]
    async fn workflow_run_launches_run_with_workflow_id_and_redirects_to_workflow() {
        let workflow_dir = tempfile::tempdir().unwrap();
        std::fs::write(
            workflow_dir.path().join("hello.dot"),
            "digraph { start [shape=circle]; end [shape=doublecircle]; start -> end }",
        )
        .unwrap();
        let dirs = vec![workflow_dir.path().display().to_string()];
        let id = crate::workflows::scan_workflows(&dirs).first().unwrap().id.clone();

        let data_dir = tempfile::tempdir().unwrap();
        let state = state_with_workflow_dir_and_data_dir(workflow_dir.path(), data_dir.path());
        let app = router().with_state(state.clone());

        let resp = post_workflow_run(app, &id).await;
        assert_eq!(resp.status(), StatusCode::OK);
        assert_eq!(
            resp.headers().get("HX-Redirect").unwrap().to_str().unwrap(),
            format!("/workflows/{id}")
        );

        let runs = state.runs.read().await;
        let record = runs.values().next().expect("a run should have been recorded");
        assert_eq!(record.workflow_id, Some(id));
    }

    #[tokio::test]
    async fn workflow_run_reads_dot_source_fresh_not_a_stale_snapshot() {
        let workflow_dir = tempfile::tempdir().unwrap();
        let file_path = workflow_dir.path().join("hello.dot");
        std::fs::write(
            &file_path,
            "digraph { start [shape=circle]; end [shape=doublecircle]; start -> end }",
        )
        .unwrap();
        let dirs = vec![workflow_dir.path().display().to_string()];
        let id = crate::workflows::scan_workflows(&dirs).first().unwrap().id.clone();

        let data_dir = tempfile::tempdir().unwrap();
        let state = state_with_workflow_dir_and_data_dir(workflow_dir.path(), data_dir.path());
        let app = router().with_state(state.clone());

        let resp1 = post_workflow_run(app.clone(), &id).await;
        assert_eq!(resp1.status(), StatusCode::OK);

        std::fs::write(
            &file_path,
            "digraph { start [shape=circle]; middle; end [shape=doublecircle]; start -> middle -> end }",
        )
        .unwrap();

        let resp2 = post_workflow_run(app, &id).await;
        assert_eq!(resp2.status(), StatusCode::OK);

        let runs = state.runs.read().await;
        let mut records: Vec<_> = runs.values().collect();
        records.sort_by_key(|r| r.started_at);
        assert_eq!(records.len(), 2);
        assert!(!records[0].dot_source.contains("middle"));
        assert!(records[1].dot_source.contains("middle"));
    }

    #[tokio::test]
    async fn workflow_run_unknown_id_returns_404() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let resp = post_workflow_run(app, "no-such-id").await;
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
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
            workflow_id: None,
        };
        state.runs.write().await.insert(id.into(), record);
    }

    /// Like `insert_test_record`, but with an explicit `workflow_id` and
    /// `started_at` -- needed to test the workflow-scoped history filter and
    /// the "most-recently-started run is the active one" rule.
    async fn insert_test_record_for_workflow(
        state: &AppState,
        id: &str,
        workflow_id: Option<&str>,
        started_at: chrono::DateTime<chrono::Utc>,
    ) {
        use crate::state::RunRecord;
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
            started_at,
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
            workflow_id: workflow_id.map(String::from),
        };
        state.runs.write().await.insert(id.into(), record);
    }

    /// Like `insert_test_record_for_workflow`, but with an explicit
    /// terminal/non-terminal `status` -- needed to test that the Run form
    /// reappears once a workflow's active run has finished.
    async fn insert_test_record_for_workflow_with_status(
        state: &AppState,
        id: &str,
        workflow_id: Option<&str>,
        started_at: chrono::DateTime<chrono::Utc>,
        status: smasher_attractor::state::RunStatus,
    ) {
        use crate::state::RunRecord;
        use smasher_attractor::dot::parser;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph;
        use smasher_attractor::http_interviewer::HttpInterviewer;
        use std::sync::Arc;
        use tokio_util::sync::CancellationToken;

        let dot_graph = parser::parse("digraph { a -> b }").unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        let record = RunRecord {
            id: id.into(),
            dot_source: "digraph { a -> b }".into(),
            graph: resolved,
            status,
            started_at,
            completed_at: Some(started_at),
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: CancellationToken::new(),
            interviewer: HttpInterviewer::new(),
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: None,
            workflow_id: workflow_id.map(String::from),
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
        let (state, data_dir) = test_state_with_data_dir();
        let candidate_dir = candidate_fixture_dir(data_dir.path(), run_id, "candidate-fixture");
        std::fs::create_dir_all(&candidate_dir).unwrap();
        let manifest = Manifest {
            captured_at: chrono::Utc::now(),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: "/tmp/candidate-fixture".into(),
            exit_status: ExitStatus::Success,
            artifacts: Vec::new(),
            generation_params: std::collections::BTreeMap::new(),
        };
        std::fs::write(
            candidate_dir.join("manifest.json"),
            serde_json::to_string(&manifest).unwrap(),
        )
        .unwrap();

        insert_test_record(&state, run_id).await;
        let app = router().with_state(state);

        let req = Request::builder()
            .uri(format!("/runs/{run_id}/candidates"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

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
                bundle_url: None,
                manifest: Manifest {
                    captured_at: chrono::Utc::now(),
                    viewport,
                    candidate_dir: "/tmp/candidate-a".into(),
                    exit_status: ExitStatus::Success,
                    artifacts: Vec::new(),
                    generation_params: std::collections::BTreeMap::new(),
                },
            },
            CandidateSummary {
                candidate_id: "candidate-b".into(),
                screenshot_url: "/candidate-artifacts/run-1/artifacts/candidate-b/screenshot.png"
                    .into(),
                bundle_url: None,
                manifest: Manifest {
                    captured_at: chrono::Utc::now(),
                    viewport,
                    candidate_dir: "/tmp/candidate-b".into(),
                    exit_status: ExitStatus::Failed {
                        reason: "chromium launch failed".into(),
                    },
                    artifacts: Vec::new(),
                    generation_params: std::collections::BTreeMap::new(),
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
        assert!(!html.contains("<iframe"));
        // Static-<img>-fallback cards get no reload button — nothing to reset.
        assert!(!html.contains("candidate-reload-btn"));
    }

    #[test]
    fn candidate_gallery_template_renders_live_bundle_as_iframe() {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        let candidates = vec![CandidateSummary {
            candidate_id: "candidate-a".into(),
            screenshot_url: "/candidate-artifacts/run-1/artifacts/candidate-a/screenshot.png"
                .into(),
            bundle_url: Some(
                "/candidate-artifacts/run-1/artifacts/candidate-a/bundle/index.html".into(),
            ),
            manifest: Manifest {
                captured_at: chrono::Utc::now(),
                viewport: Viewport {
                    width: 1280,
                    height: 800,
                },
                candidate_dir: "/tmp/candidate-a".into(),
                exit_status: ExitStatus::Success,
                artifacts: Vec::new(),
                generation_params: std::collections::BTreeMap::new(),
            },
        }];

        let html = CandidateGalleryTemplate {
            run_id: "run-1".into(),
            candidates,
        }
        .render()
        .unwrap();

        assert!(html.contains(
            r#"<iframe src="/candidate-artifacts/run-1/artifacts/candidate-a/bundle/index.html""#
        ));
        assert!(html.contains(
            r#"data-src="/candidate-artifacts/run-1/artifacts/candidate-a/bundle/index.html""#
        ));
        assert!(html.contains(r#"sandbox="allow-scripts""#));
        assert!(html.contains("candidate-reload-btn"));
        assert!(!html.contains("<img"));
    }

    #[test]
    fn candidate_gallery_template_renders_generation_params_panel_when_present() {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        let candidates = vec![CandidateSummary {
            candidate_id: "candidate-a".into(),
            screenshot_url: "/candidate-artifacts/run-1/artifacts/candidate-a/screenshot.png"
                .into(),
            bundle_url: None,
            manifest: Manifest {
                captured_at: chrono::Utc::now(),
                viewport: Viewport {
                    width: 1280,
                    height: 800,
                },
                candidate_dir: "/tmp/candidate-a".into(),
                exit_status: ExitStatus::Success,
                artifacts: Vec::new(),
                generation_params: std::collections::BTreeMap::from([
                    ("prompt".to_string(), "a red button".to_string()),
                    ("persona".to_string(), "designer".to_string()),
                ]),
            },
        }];

        let html = CandidateGalleryTemplate {
            run_id: "run-1".into(),
            candidates,
        }
        .render()
        .unwrap();

        assert!(html.contains(r#"<details class="candidate-params">"#));
        assert!(html.contains("prompt"));
        assert!(html.contains("a red button"));
        assert!(html.contains("persona"));
        assert!(html.contains("designer"));
    }

    #[test]
    fn candidate_gallery_template_renders_no_params_panel_when_empty() {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        let candidates = vec![CandidateSummary {
            candidate_id: "candidate-a".into(),
            screenshot_url: "/candidate-artifacts/run-1/artifacts/candidate-a/screenshot.png"
                .into(),
            bundle_url: None,
            manifest: Manifest {
                captured_at: chrono::Utc::now(),
                viewport: Viewport {
                    width: 1280,
                    height: 800,
                },
                candidate_dir: "/tmp/candidate-a".into(),
                exit_status: ExitStatus::Success,
                artifacts: Vec::new(),
                generation_params: std::collections::BTreeMap::new(),
            },
        }];

        let html = CandidateGalleryTemplate {
            run_id: "run-1".into(),
            candidates,
        }
        .render()
        .unwrap();

        assert!(!html.contains("candidate-params"));
        assert!(!html.contains("<details"));
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
            workflow_id: None,
        };
        state.runs.write().await.insert(id.into(), record);
        interviewer
    }

    /// Push a genuinely pending question with a known id, optionally
    /// attributed to the node that raised it (as the real ask()/approve()
    /// call path does via `NODE_ID_CONTEXT_KEY`).
    fn push_pending_qid(
        interviewer: &smasher_attractor::http_interviewer::HttpInterviewer,
        qid: &str,
        node_id: Option<&str>,
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
            node_id: node_id.map(String::from),
            answer_tx: Some(tx),
        });
    }

    fn write_gate_manifest(run_id: &str, candidate_id: &str, failed: bool) {
        write_gate_manifest_with_artifacts(run_id, candidate_id, failed, Vec::new());
    }

    fn write_gate_manifest_with_artifacts(
        run_id: &str,
        candidate_id: &str,
        failed: bool,
        artifacts: Vec<smasher_render_capture::manifest::ArtifactRef>,
    ) {
        write_gate_manifest_with_artifacts_and_params(
            run_id,
            candidate_id,
            failed,
            artifacts,
            std::collections::BTreeMap::new(),
        );
    }

    fn write_gate_manifest_with_artifacts_and_params(
        run_id: &str,
        candidate_id: &str,
        failed: bool,
        artifacts: Vec<smasher_render_capture::manifest::ArtifactRef>,
        generation_params: std::collections::BTreeMap<String, String>,
    ) {
        use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};

        // Matches test_state()'s data_dir ("/tmp"): candidates live under
        // {data_dir}/artifacts/<run_id>/artifacts/<candidate_id>/.
        let dir = candidate_fixture_dir(std::path::Path::new("/tmp"), run_id, candidate_id);
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
            artifacts,
            generation_params,
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
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

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
        // No bundle artifact: falls back to the screenshot, both embedded and linked.
        assert!(html.contains(
            r#"<a href="/candidate-artifacts/gate-card-paused/artifacts/candidate-a/screenshot.png" target="_blank">"#
        ));
        assert!(html.contains("<img"));
        assert!(!html.contains("<iframe"));
        // The gate's own question no longer gets a redundant plain card now
        // that its gate card rendered (Task 5 dedupe).
        assert!(!html.contains("answer-input-q1"));
        // Non-failed candidates get an optional comment textarea (one each,
        // none for the failed candidate rendered via the failed_card macro).
        assert_eq!(html.matches("<textarea class=\"candidate-comment\"").count(), 2);
        assert!(html.contains(r#"<textarea class="candidate-comment" data-candidate="candidate-a""#));
        assert!(html.contains(r#"<textarea class="candidate-comment" data-candidate="candidate-b""#));
        assert!(!html.contains(r#"data-candidate="candidate-c""#));
    }

    #[tokio::test]
    async fn run_questions_gate_card_shows_live_bundle_as_iframe_linked_to_the_bundle() {
        use smasher_render_capture::manifest::{ArtifactKind, ArtifactRef};

        let run_id = "gate-card-live-bundle";
        write_gate_manifest_with_artifacts(
            run_id,
            "candidate-a",
            false,
            vec![ArtifactRef {
                kind: ArtifactKind::LiveBundle,
                path: "bundle/index.html".to_string(),
            }],
        );

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        let bundle_url = format!(
            "/candidate-artifacts/{run_id}/artifacts/candidate-a/bundle/index.html"
        );
        assert!(
            html.contains(&format!(r#"<a href="{bundle_url}" target="_blank">"#)),
            "anchor should point at the bundle URL, not the screenshot:\n{html}"
        );
        assert!(html.contains(&format!(r#"<iframe src="{bundle_url}""#)));
        assert!(html.contains(r#"sandbox="allow-scripts""#));
        assert!(!html.contains("<img"));
        // Checkbox selection structure survives.
        assert!(html.contains(r#"value="candidate-a""#));
        assert!(html.contains("<label class=\"candidate-card\">"));
    }

    #[tokio::test]
    async fn run_questions_gate_card_shows_params_panel_only_where_generation_params_set() {
        let run_id = "gate-card-params";
        write_gate_manifest_with_artifacts_and_params(
            run_id,
            "candidate-a",
            false,
            Vec::new(),
            std::collections::BTreeMap::from([
                ("prompt".to_string(), "a red button".to_string()),
                ("persona".to_string(), "designer".to_string()),
            ]),
        );
        write_gate_manifest(run_id, "candidate-b", false);

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains(r#"<details class="candidate-params">"#));
        assert!(html.contains("prompt"));
        assert!(html.contains("a red button"));
        // candidate-b has no generation_params: only one panel should render.
        assert_eq!(
            html.matches(r#"<details class="candidate-params">"#)
                .count(),
            1
        );
    }

    /// Two gallery gates in one graph (e.g. a Discover gate feeding a
    /// separate Define gate) — a real scenario for the design-factory
    /// pipeline, not a hypothetical edge case. Found live: the second gate's
    /// question degraded to a plain free-text card because the lookup always
    /// grabbed the graph's *first* gallery-shaped node, then failed to match
    /// it against the actually-pending question and gave up.
    const TWO_GALLERY_GATES_DOT: &str = r#"digraph {
        Start [shape=Mdiamond];
        Gate1 [shape=hexagon, label="Discover gate", gallery="true"];
        Middle [shape=box];
        Gate2 [shape=hexagon, label="Define gate", gallery="true"];
        Next [shape=box];
        Start -> Gate1;
        Gate1 -> Middle [label="proceed"];
        Middle -> Gate2;
        Gate2 -> Next [label="proceed"];
    }"#;

    #[tokio::test]
    async fn run_questions_shows_gate_card_for_the_second_of_two_gallery_gates() {
        let run_id = "gate-card-second-gate";
        write_gate_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, TWO_GALLERY_GATES_DOT).await;
        // Gate1's question is long done; only Gate2's is pending.
        push_pending_qid(&interviewer, "q1", Some("Gate2"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(
            html.contains(r#"<div class="gate-card""#),
            "gate card missing for the second gallery gate:\n{html}"
        );
        assert!(html.contains(r#"data-question-id="q1""#));
        assert!(html.contains(&format!("/api/runs/{run_id}/gallery/q1/decision")));
    }

    /// A graph where each phase's Tool nodes carry `candidate_id` in their
    /// `args`, the same authoring convention `examples/product_design_factory.dot`
    /// uses. Gate2's card must only show `define` — not `discover-a`, which
    /// belongs to Gate1's already-decided step but is still sitting on disk
    /// from earlier in the run.
    const TWO_GALLERY_GATES_WITH_RENDER_DOT: &str = r#"digraph {
        Start [shape=Mdiamond];
        RenderA [shape=parallelogram, tool="render_capture", args="{\"candidate_dir\": \"./a\", \"candidate_id\": \"discover-a\"}"];
        Gate1 [shape=hexagon, label="Discover gate", gallery="true"];
        RenderDefine [shape=parallelogram, tool="render_capture", args="{\"candidate_dir\": \"./define\", \"candidate_id\": \"define\"}"];
        Gate2 [shape=hexagon, label="Define gate", gallery="true"];
        Next [shape=box];
        Start -> RenderA -> Gate1;
        Gate1 -> RenderDefine [label="proceed"];
        RenderDefine -> Gate2;
        Gate2 -> Next [label="proceed"];
    }"#;

    #[tokio::test]
    async fn run_questions_gate_card_scopes_candidates_to_the_pending_gates_own_step() {
        let run_id = "gate-card-scoped-to-step";
        write_gate_manifest(run_id, "discover-a", false);
        write_gate_manifest(run_id, "define", false);

        let state = test_state();
        let interviewer =
            insert_graph_record(&state, run_id, TWO_GALLERY_GATES_WITH_RENDER_DOT).await;
        // Gate1's question is long done; only Gate2's is pending.
        push_pending_qid(&interviewer, "q1", Some("Gate2"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(
            html.contains(r#"<span class="candidate-id">define</span>"#),
            "missing this gate's own candidate:\n{html}"
        );
        assert!(
            !html.contains(r#"<span class="candidate-id">discover-a</span>"#),
            "an earlier gate's already-decided candidate leaked into this gate's card:\n{html}"
        );
    }

    #[tokio::test]
    async fn run_questions_gate_card_shows_scorecards_for_the_right_candidate() {
        let run_id = "gate-card-scorecards";
        write_gate_manifest(run_id, "candidate-a", false);
        write_gate_manifest(run_id, "candidate-b", false);

        let artifacts_dir = std::path::Path::new("/tmp/artifacts").join(run_id).join("artifacts");
        std::fs::write(
            artifacts_dir.join("candidate-a").join("lint-report.json"),
            r#"{"checks": [{"name": "token-adherence", "passed": false, "violations": ["raw hex color #fff"]}]}"#,
        )
        .unwrap();
        std::fs::write(
            artifacts_dir.join("candidate-a").join("critic-report.json"),
            r#"{"persona": "new user", "task": "find settings", "success": false, "friction": ["settings hidden in overflow menu"], "notes": "gave up"}"#,
        )
        .unwrap();
        std::fs::write(
            artifacts_dir.join("candidate-a").join("synthesis-report.json"),
            r#"{"recommendation": "iterate", "reasons": ["lint failed and critic found friction"]}"#,
        )
        .unwrap();
        // candidate-b deliberately has no reports: the pipeline hasn't run
        // critics against it yet, and its card should show no scorecard data.

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains("lint: fail"), "missing lint badge:\n{html}");
        assert!(html.contains("raw hex color #fff"));
        assert!(html.contains("critic: friction"));
        assert!(html.contains("settings hidden in overflow menu"));
        assert!(html.contains("synthesis: iterate"));
        assert!(html.contains("lint failed and critic found friction"));

        // Scorecard content must land on candidate-a's own slot, not candidate-b's:
        // candidate-b has no reports, so its slot div must be truly empty (no
        // stray whitespace either) for the existing `.lint-badge-slot:empty`
        // CSS rule to hide it.
        assert!(
            html.contains(r#"data-candidate="candidate-b"></div>"#),
            "candidate-b slot is not empty:\n{html}"
        );
    }

    #[tokio::test]
    async fn run_questions_plain_for_non_gallery_run() {
        let run_id = "gate-card-plain";
        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, PLAIN_DOT).await;
        push_pending_qid(&interviewer, "q1", None);

        let (status, html) = get_questions_html(state, run_id).await;

        assert_eq!(status, StatusCode::OK);
        assert!(!html.contains("data-question-id="));
        assert!(html.contains("question-card"));
    }

    #[tokio::test]
    async fn run_questions_dedupe_keeps_a_second_genuinely_plain_question() {
        let run_id = "gate-card-dedupe-keeps-plain";
        write_gate_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        // q1 belongs to the gallery gate (deduped away); q2 is a genuinely
        // separate, non-gallery pending question on the same run.
        push_pending_qid(&interviewer, "q1", Some("Gate1"));
        push_pending_qid(&interviewer, "q2", None);

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains(r#"<div class="gate-card""#), "gate card missing:\n{html}");
        assert!(!html.contains("answer-input-q1"), "gate's own question must be deduped");
        assert!(html.contains("answer-input-q2"), "unrelated plain question must still render");
    }

    #[tokio::test]
    async fn run_questions_no_gate_card_without_candidates() {
        let run_id = "gate-card-no-candidates";
        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

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
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(!html.contains("data-question-id="));
        assert!(html.contains("No pending questions."));
    }

    // ---------------------------------------------------------------
    // Decision history
    // ---------------------------------------------------------------

    async fn get_html(state: AppState, uri: &str) -> (StatusCode, String) {
        let app = router().with_state(state);
        let req = Request::builder().uri(uri).body(Body::empty()).unwrap();
        let resp = app.oneshot(req).await.unwrap();
        let status = resp.status();
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        (status, String::from_utf8_lossy(&body).into_owned())
    }

    fn push_gate_completed(
        state: &AppState,
        run_id: &str,
        node_id: &str,
        selected: &[&str],
        decision: &str,
    ) {
        use smasher_attractor::events::PipelineEvent;
        use smasher_attractor::state::Outcome;

        let runs = state.runs.try_read().unwrap();
        let record = runs.get(run_id).unwrap();
        record.event_log.push(PipelineEvent::NodeCompleted {
            node_id: node_id.into(),
            outcome: Outcome::success_with(serde_json::json!({
                "selected": selected,
                "decision": decision,
            }))
            .with_preferred_label(decision),
            duration_ms: 0,
            timestamp: chrono::Utc::now(),
        });
    }

    fn push_gate_completed_with_comments(
        state: &AppState,
        run_id: &str,
        node_id: &str,
        selected: &[&str],
        decision: &str,
        comments: &[(&str, &str)],
    ) {
        use smasher_attractor::events::PipelineEvent;
        use smasher_attractor::state::Outcome;

        let comments_obj: serde_json::Map<String, serde_json::Value> = comments
            .iter()
            .map(|(id, text)| ((*id).to_string(), serde_json::json!(text)))
            .collect();

        let runs = state.runs.try_read().unwrap();
        let record = runs.get(run_id).unwrap();
        record.event_log.push(PipelineEvent::NodeCompleted {
            node_id: node_id.into(),
            outcome: Outcome::success_with(serde_json::json!({
                "selected": selected,
                "decision": decision,
                "comments": comments_obj,
            }))
            .with_preferred_label(decision),
            duration_ms: 0,
            timestamp: chrono::Utc::now(),
        });
    }

    #[tokio::test]
    async fn run_decisions_shows_comments_sorted_by_candidate_id() {
        let run_id = "decisions-with-comments";
        let state = test_state();
        insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_gate_completed_with_comments(
            &state,
            run_id,
            "Gate1",
            &["candidate-a"],
            "proceed",
            &[("candidate-b", "tweak spacing"), ("candidate-a", "nice")],
        );

        let (status, html) = get_html(state, &format!("/runs/{run_id}/decisions")).await;

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains("decision-comments"));
        let a_pos = html.find("nice").expect("candidate-a comment present");
        let b_pos = html.find("tweak spacing").expect("candidate-b comment present");
        assert!(a_pos < b_pos, "comments must render sorted by candidate id");
    }

    #[tokio::test]
    async fn run_decisions_empty_state_for_run_with_no_gate_decisions() {
        let run_id = "decisions-empty";
        let state = test_state();
        insert_graph_record(&state, run_id, GALLERY_DOT).await;

        let (status, html) = get_html(state, &format!("/runs/{run_id}/decisions")).await;

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains("No gate decisions yet."));
    }

    #[tokio::test]
    async fn run_decisions_lists_recorded_gate_decisions() {
        let run_id = "decisions-recorded";
        let state = test_state();
        insert_graph_record(&state, run_id, GALLERY_DOT).await;
        push_gate_completed(&state, run_id, "Gate1", &["candidate-a"], "proceed");
        push_gate_completed(&state, run_id, "Gate1", &["candidate-b"], "iterate");

        let (status, html) = get_html(state, &format!("/runs/{run_id}/decisions")).await;

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains("Gate1"));
        assert!(html.contains("candidate-a"));
        assert!(html.contains("proceed"));
        assert!(html.contains("candidate-b"));
        assert!(html.contains("iterate"));
        // Pre-amendment fixture (no comments key): unchanged, no comments block.
        assert!(!html.contains("decision-comments"));
    }

    #[tokio::test]
    async fn run_decisions_not_found_for_unknown_run() {
        let state = test_state();
        let (status, _) = get_html(state, "/runs/no-such-run/decisions").await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    // ---------------------------------------------------------------
    // Branch picker: more than two outgoing edges (Task 8)
    // ---------------------------------------------------------------

    const THREE_EDGE_GALLERY_DOT: &str = r#"digraph {
        Start [shape=Mdiamond];
        Gate1 [shape=hexagon, label="Pick a direction", gallery="true"];
        Polish [shape=box];
        Redo [shape=box];
        Fork [shape=box];
        Start -> Gate1;
        Gate1 -> Polish [label="proceed"];
        Gate1 -> Redo [label="iterate"];
        Gate1 -> Fork [label="fork-new-direction"];
    }"#;

    #[tokio::test]
    async fn run_questions_gate_card_shows_a_button_per_outgoing_edge_beyond_two() {
        let run_id = "gate-card-three-edges";
        write_gate_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = insert_graph_record(&state, run_id, THREE_EDGE_GALLERY_DOT).await;
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        assert!(html.contains(">proceed<"));
        assert!(html.contains(">iterate<"));
        assert!(html.contains(">fork-new-direction<"));
        assert_eq!(html.matches("class=\"btn btn-primary btn-small gate-decision-btn\"").count(), 3);
    }

    #[tokio::test]
    async fn run_questions_gate_card_hint_honors_candidates_launch_var_override() {
        use crate::state::RunRecord;
        use smasher_attractor::dot::parser;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph;
        use smasher_attractor::http_interviewer::HttpInterviewer;
        use smasher_attractor::state::RunStatus;
        use std::sync::Arc;

        // Same DOT as the standard gate fixture (`candidate_count="phase_default(discover)"`,
        // i.e. 4 by default), but with a launch-time `candidates` variable set —
        // the mechanism this project uses instead of a dedicated `--candidates N`
        // flag, since `smasher run --var candidates=N` already threads a launch
        // variable into `RunRecord.variables` and `resolve_candidate_count` reads
        // it first. No DOT edit needed.
        let run_id = "gate-card-candidates-override";
        write_gate_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let parsed = parser::parse(GALLERY_DOT).unwrap();
        let resolved = graph::resolve(&parsed).unwrap();
        let interviewer = HttpInterviewer::new();
        let mut variables = HashMap::new();
        variables.insert("candidates".to_string(), "2".to_string());
        let record = RunRecord {
            id: run_id.into(),
            dot_source: GALLERY_DOT.into(),
            graph: resolved,
            status: RunStatus::Running,
            started_at: chrono::Utc::now(),
            completed_at: None,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: tokio_util::sync::CancellationToken::new(),
            interviewer: interviewer.clone(),
            variables,
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: None,
            workflow_id: None,
        };
        state.runs.write().await.insert(run_id.into(), record);
        push_pending_qid(&interviewer, "q1", Some("Gate1"));

        let (status, html) = get_questions_html(state, run_id).await;
        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();

        assert_eq!(status, StatusCode::OK);
        // Without the override this would read "Expected 4, found 1"
        // (phase_default(discover)) — the launch var wins.
        assert!(html.contains("Expected 2, found 1"), "hint not overridden:\n{html}");
    }
}
