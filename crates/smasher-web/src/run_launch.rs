// ABOUTME: Shared pipeline launch logic extracted from api.rs and pages.rs.
// ABOUTME: Handles run directory creation, backend initialization, and engine spawning for both fresh and resumed runs.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::AtomicU64;

use chrono::Utc;
use tokio_util::sync::CancellationToken;

use smasher_attractor::artifact::ArtifactStore;
use smasher_attractor::engine::{Engine, EngineConfig};
use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
use smasher_attractor::graph::Graph;
use smasher_attractor::handler::{CodergenHandler, HandlerRegistry, default_registry};
use smasher_attractor::http_interviewer::HttpInterviewer;
use smasher_attractor::interviewer::InterviewerHandler;
use smasher_attractor::log_sink::LogSink;
use smasher_attractor::manager_handler::ManagerHandler;
use smasher_attractor::parallel::ParallelHandler;
use smasher_attractor::state::{Checkpoint, Context, RunStatus};
use smasher_attractor::tool_handler::{ToolBackend, ToolHandler};

use crate::backend::{AgentCodergenBackend, LlmManagerBackend, LlmToolBackend};
use crate::error::WebError;
use crate::state::{AppState, RunRecord};

/// Information needed to resume a pipeline from a checkpoint.
pub struct ResumeInfo {
    pub checkpoint: Checkpoint,
    pub checkpoint_dir: PathBuf,
}

/// Configuration for launching a pipeline.
pub struct LaunchConfig {
    pub graph: Graph,
    pub dot_source: String,
    pub variables: HashMap<String, String>,
    pub model: String,
    pub provider: Option<String>,
    pub resume_info: Option<ResumeInfo>,
    pub workflow_id: Option<String>,
    pub use_checkpointing: bool,
}

/// Launches a pipeline (fresh or resumed) and returns the RunRecord.
/// This function encapsulates all the common logic from submit_pipeline, resume_run, and create_run.
///
/// # Parameters
/// - `state`: The app state containing runs, client, and configuration.
/// - `config`: Launch configuration with graph, variables, model, checkpoint info, etc.
///
/// # Returns
/// A RunRecord that should be inserted into `state.runs` by the caller.
pub async fn launch_pipeline(
    state: &AppState,
    config: LaunchConfig,
) -> Result<RunRecord, WebError> {
    let LaunchConfig {
        graph,
        dot_source,
        variables,
        model,
        provider,
        resume_info,
        workflow_id,
        use_checkpointing,
    } = config;
    let run_id = if resume_info.is_some() {
        // For resumed runs, use ulid like the API
        ulid::Ulid::new().to_string().to_lowercase()
    } else {
        // For fresh runs, use ulid by default (pages.rs uses uuid but we'll standardize on ulid)
        ulid::Ulid::new().to_string().to_lowercase()
    };

    // Create per-run artifact directory for isolation.
    let artifacts_base = std::path::Path::new(&state.data_dir).join("artifacts");
    let graph_name =
        smasher_attractor::run_dir::sanitize_graph_name(&graph.name.clone().unwrap_or_default());
    let run_directory = smasher_attractor::run_dir::RunDirectory::create(
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

    let run_working_dir = run_directory
        .manifest()
        .directories
        .root
        .display()
        .to_string();

    let emitter = Arc::new(PipelineEventEmitter::default());
    let event_log = Arc::new(PipelineEventLog::new());
    let cancellation = CancellationToken::new();
    let interviewer = HttpInterviewer::new().with_cancellation(cancellation.clone());
    let input_tokens = Arc::new(AtomicU64::new(0));
    let output_tokens = Arc::new(AtomicU64::new(0));

    let record = RunRecord {
        id: run_id.clone(),
        dot_source: dot_source.clone(),
        graph: graph.clone(),
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

    // Subscribe to events and drain into the in-memory log.
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

    // Subscribe to events and write JSONL log to disk.
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

    // Spawn pipeline execution.
    let run_id_clone = run_id.clone();
    let runs = Arc::clone(&state.runs);
    let client = Arc::clone(&state.client);
    let spawn_working_dir = run_working_dir.clone();
    let checkpoint_dir = run_directory.manifest().directories.checkpoints.clone();
    let candidate_artifacts_dir = run_directory.manifest().directories.artifacts.clone();
    let mut run_directory_clone = run_directory.clone();
    let resume_checkpoint = resume_info.map(|r| r.checkpoint);

    tokio::spawn(async move {
        let backend = Arc::new(AgentCodergenBackend::new(
            Arc::clone(&client),
            model.clone(),
            provider.clone(),
            spawn_working_dir.clone(),
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
            spawn_working_dir.clone(),
        ));
        let llm_tool_backend = Arc::new(LlmToolBackend::new(
            Arc::clone(&client),
            model.clone(),
            provider.clone(),
            spawn_working_dir.clone(),
        ));
        let render_capture_backend =
            Arc::new(smasher_render_capture::backend::HybridToolBackend::new(
                llm_tool_backend as Arc<dyn ToolBackend>,
                candidate_artifacts_dir.clone(),
                PathBuf::from(&spawn_working_dir),
            ));
        let system_lint_backend =
            Arc::new(smasher_system_lint::backend::SystemLintToolBackend::new(
                render_capture_backend as Arc<dyn ToolBackend>,
                candidate_artifacts_dir.clone(),
                PathBuf::from(&spawn_working_dir),
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
            enable_checkpointing: use_checkpointing,
            checkpoint_dir: if use_checkpointing {
                Some(checkpoint_dir)
            } else {
                None
            },
            cancellation_token: Some(cancellation),
            artifact_store: Some(artifact_store),
            ..EngineConfig::default()
        };

        let mut engine = Engine::with_config(graph, registry, config).with_emitter(emitter);
        if let Err(e) = engine.apply_sub_pipeline_transform(&spawn_working_dir) {
            tracing::warn!(error = %e, "sub-pipeline transform failed, continuing without");
        }
        let context = Context::default();

        for (key, value) in &variables {
            context.set(key, serde_json::Value::String(value.clone()));
        }

        let result = if let Some(checkpoint) = resume_checkpoint {
            engine.run_from_checkpoint(checkpoint, context).await
        } else {
            engine.run(context).await
        };

        let mut runs = runs.write().await;
        if let Some(record) = runs.get_mut(&run_id_clone) {
            record.completed_at = Some(Utc::now());
            match result {
                Ok(_) => {
                    record.status = RunStatus::Completed;
                }
                Err(e) => {
                    if matches!(e, smasher_attractor::engine::EngineError::Cancelled) {
                        record.status = RunStatus::Aborted;
                    } else {
                        record.status = RunStatus::Failed;
                        record.error = Some(e.to_string());
                    }
                }
            }

            // If this is a pages.rs-originated run with metadata, persist completion status
            // This is a no-op for API runs but needed for dashboard tracking.
            if let Err(e) = run_directory_clone.persist_run_metadata(
                workflow_id.clone(),
                Some(format!("{:?}", record.status)),
                record
                    .input_tokens
                    .load(std::sync::atomic::Ordering::Relaxed),
                record
                    .output_tokens
                    .load(std::sync::atomic::Ordering::Relaxed),
                record.completed_at,
            ) {
                tracing::warn!(error = %e, "failed to persist run metadata after run completion");
            }
        }
    });

    Ok(record)
}
