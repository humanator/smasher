// ABOUTME: Shared application state for the web server including run records and LLM client.
// ABOUTME: Manages the lifecycle of pipeline runs with thread-safe concurrent access.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use chrono::{DateTime, Utc};
use serde::Serialize;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;

use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
use smasher_attractor::graph::Graph;
use smasher_attractor::http_interviewer::HttpInterviewer;
use smasher_attractor::state::RunStatus;

/// Shared application state cloned into each axum handler.
#[derive(Clone)]
pub struct AppState {
    pub runs: Arc<RwLock<HashMap<String, RunRecord>>>,
    /// The LLM client; swapped by [`AppState::reconfigure`] when provider keys change.
    client: Arc<std::sync::RwLock<Arc<smasher_llm::client::Client>>>,
    /// The model and provider new runs use when a request names none. Swapped by
    /// `PUT /api/settings`; each run copies it at submit, so runs in flight keep theirs.
    pub llm: Arc<std::sync::RwLock<crate::settings::LlmDefaults>>,
    pub data_dir: String,
    pub workflow_dirs: Vec<String>,
    /// Held by `PUT /api/workflows/{id}/graph` across its If-Match check and
    /// the write, so two saves in this process can't both pass the check.
    pub graph_save_lock: Arc<tokio::sync::Mutex<()>>,
    /// Cached per-provider model lists behind `GET /api/models`.
    pub models: Arc<smasher_llm::models_list::ModelCatalog>,
    /// Where to reach each provider's list API (read from the environment at boot).
    model_endpoints: Arc<std::sync::RwLock<Arc<Vec<smasher_llm::models_list::ProviderEndpoint>>>>,
}

impl AppState {
    pub fn new(
        client: smasher_llm::client::Client,
        default_model: String,
        default_provider: Option<String>,
        data_dir: String,
        workflow_dirs: Vec<String>,
    ) -> Self {
        Self {
            runs: Arc::new(RwLock::new(HashMap::new())),
            client: Arc::new(std::sync::RwLock::new(Arc::new(client))),
            llm: Arc::new(std::sync::RwLock::new(
                crate::settings::LlmDefaults::from_boot(default_model, default_provider),
            )),
            data_dir,
            workflow_dirs,
            graph_save_lock: Arc::new(tokio::sync::Mutex::new(())),
            models: Arc::new(smasher_llm::models_list::ModelCatalog::new(
                smasher_llm::models_list::DEFAULT_LIST_TTL,
            )),
            model_endpoints: Arc::new(std::sync::RwLock::new(Arc::new(env_model_endpoints()))),
        }
    }

    /// A copy of the current default model and provider.
    pub fn llm_defaults(&self) -> crate::settings::LlmDefaults {
        self.llm.read().expect("llm defaults lock").clone()
    }

    /// The current LLM client. Runs keep the one they were started with.
    pub fn client(&self) -> Arc<smasher_llm::client::Client> {
        Arc::clone(&self.client.read().expect("client lock"))
    }

    /// Where to reach each provider's model-list API right now.
    pub fn model_endpoints(&self) -> Arc<Vec<smasher_llm::models_list::ProviderEndpoint>> {
        Arc::clone(&self.model_endpoints.read().expect("endpoints lock"))
    }

    /// Replace the list-API endpoints (tests point them at local servers).
    pub fn with_model_endpoints(
        self,
        endpoints: Vec<smasher_llm::models_list::ProviderEndpoint>,
    ) -> Self {
        *self.model_endpoints.write().expect("endpoints lock") = Arc::new(endpoints);
        self
    }

    /// Swap in a new client and list-API endpoints, for when provider keys change.
    /// Runs already started keep the client they have; new runs and the model lists
    /// see the new one.
    pub fn reconfigure(
        &self,
        client: smasher_llm::client::Client,
        endpoints: Vec<smasher_llm::models_list::ProviderEndpoint>,
    ) {
        *self.client.write().expect("client lock") = Arc::new(client);
        *self.model_endpoints.write().expect("endpoints lock") = Arc::new(endpoints);
        self.models.invalidate();
    }
}

/// Endpoints for every provider that has a key in the environment.
fn env_model_endpoints() -> Vec<smasher_llm::models_list::ProviderEndpoint> {
    use smasher_llm::models_list::ProviderEndpoint;
    use smasher_llm::types::Provider;
    [
        Provider::Anthropic,
        Provider::OpenAi,
        Provider::Gemini,
        Provider::Ollama,
    ]
    .into_iter()
    .filter_map(ProviderEndpoint::from_env)
    .collect()
}

/// A single pipeline execution record.
pub struct RunRecord {
    pub id: String,
    pub dot_source: String,
    pub graph: Graph,
    pub status: RunStatus,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub emitter: Arc<PipelineEventEmitter>,
    pub event_log: Arc<PipelineEventLog>,
    pub cancellation: CancellationToken,
    pub interviewer: HttpInterviewer,
    pub variables: HashMap<String, String>,
    pub error: Option<String>,
    pub input_tokens: Arc<AtomicU64>,
    pub output_tokens: Arc<AtomicU64>,
    pub run_working_dir: Option<String>,
    /// The workflow catalog entry this run was launched from, if any —
    /// `None` for runs submitted via the paste-a-DOT-file `/runs` form.
    pub workflow_id: Option<String>,
}

/// Serializable summary of a run for API responses.
#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct RunSummary {
    pub id: String,
    pub status: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub graph_name: Option<String>,
    pub error: Option<String>,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub run_working_dir: Option<String>,
    pub workflow_id: Option<String>,
    /// Ids of the graph's gallery gates, sorted. The SPA uses them to keep
    /// gallery picks out of Answered Questions.
    #[serde(default)]
    pub gallery_gates: Vec<String>,
}

impl RunRecord {
    pub fn to_summary(&self) -> RunSummary {
        RunSummary {
            id: self.id.clone(),
            status: format!("{:?}", self.status),
            started_at: self.started_at.to_rfc3339(),
            completed_at: self.completed_at.map(|t| t.to_rfc3339()),
            graph_name: self.graph.name.clone(),
            error: self.error.clone(),
            input_tokens: self.input_tokens.load(Ordering::Relaxed),
            output_tokens: self.output_tokens.load(Ordering::Relaxed),
            run_working_dir: self.run_working_dir.as_ref().map(|dir| {
                // Expose only the relative path (artifacts/{run_id}/...) to avoid
                // leaking absolute server filesystem paths in API responses and UI.
                let path = std::path::Path::new(dir);
                path.file_name()
                    .and_then(|name| name.to_str())
                    .map(|name| format!("artifacts/{name}"))
                    .unwrap_or_else(|| dir.clone())
            }),
            workflow_id: self.workflow_id.clone(),
            gallery_gates: self.gallery_gates(),
        }
    }

    fn gallery_gates(&self) -> Vec<String> {
        let mut ids: Vec<String> = self
            .graph
            .nodes
            .iter()
            .filter(|node| node.is_gallery_gate())
            .map(|node| node.id.clone())
            .collect();
        ids.sort();
        ids
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_state_new_creates_empty_runs() {
        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![]);
        // runs map should be empty on creation
        let runs = state.runs.try_read().unwrap();
        assert!(runs.is_empty());
    }

    #[test]
    fn app_state_new_stores_workflow_dirs() {
        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(
            client,
            "test-model".into(),
            None,
            "/tmp".into(),
            vec!["examples".into(), "/tmp/workflows".into()],
        );
        assert_eq!(
            state.workflow_dirs,
            vec!["examples".to_string(), "/tmp/workflows".to_string()]
        );
    }

    #[test]
    fn run_summary_serializes_to_json() {
        let summary = RunSummary {
            id: "test-123".into(),
            status: "Running".into(),
            started_at: "2025-01-01T00:00:00Z".into(),
            completed_at: None,
            graph_name: Some("my_pipeline".into()),
            error: None,
            input_tokens: 0,
            output_tokens: 0,
            run_working_dir: None,
            workflow_id: None,
            gallery_gates: vec![],
        };
        let json = serde_json::to_value(&summary).unwrap();
        assert_eq!(json["id"], "test-123");
        assert_eq!(json["status"], "Running");
        assert!(json["completed_at"].is_null());
    }

    #[test]
    fn run_summary_with_error() {
        let summary = RunSummary {
            id: "test-456".into(),
            status: "Failed".into(),
            started_at: "2025-01-01T00:00:00Z".into(),
            completed_at: Some("2025-01-01T00:01:00Z".into()),
            graph_name: None,
            error: Some("node X failed".into()),
            input_tokens: 100,
            output_tokens: 50,
            run_working_dir: None,
            workflow_id: None,
            gallery_gates: vec![],
        };
        let json = serde_json::to_value(&summary).unwrap();
        assert_eq!(json["error"], "node X failed");
        assert!(json["completed_at"].is_string());
    }

    /// Helper to create a minimal RunRecord for testing to_summary().
    fn make_test_record(
        status: RunStatus,
        working_dir: Option<String>,
        workflow_id: Option<String>,
    ) -> RunRecord {
        use smasher_attractor::dot::parser;
        use smasher_attractor::graph;
        let dot_graph = parser::parse("digraph { a -> b }").unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        RunRecord {
            id: "test-run-id".into(),
            dot_source: "digraph { a -> b }".into(),
            graph: resolved,
            status,
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
            run_working_dir: working_dir,
            workflow_id,
        }
    }

    #[test]
    fn to_summary_exposes_relative_working_dir() {
        let record = make_test_record(
            RunStatus::Running,
            Some("/home/user/project/artifacts/abc-123".into()),
            None,
        );
        let summary = record.to_summary();
        assert_eq!(summary.run_working_dir, Some("artifacts/abc-123".into()));
    }

    #[test]
    fn to_summary_handles_none_working_dir() {
        let record = make_test_record(RunStatus::Running, None, None);
        let summary = record.to_summary();
        assert!(summary.run_working_dir.is_none());
    }

    #[test]
    fn to_summary_aborted_status() {
        let record = make_test_record(RunStatus::Aborted, None, None);
        let summary = record.to_summary();
        assert_eq!(summary.status, "Aborted");
    }

    #[test]
    fn to_summary_completed_status() {
        let record = make_test_record(RunStatus::Completed, None, None);
        let summary = record.to_summary();
        assert_eq!(summary.status, "Completed");
    }

    #[test]
    fn to_summary_carries_workflow_id_when_some() {
        let record = make_test_record(RunStatus::Running, None, Some("wf-42".to_string()));
        let summary = record.to_summary();
        assert_eq!(summary.workflow_id, Some("wf-42".to_string()));
    }

    #[test]
    fn to_summary_lists_gallery_gates_sorted() {
        use smasher_attractor::dot::parser;
        use smasher_attractor::graph;
        let mut record = make_test_record(RunStatus::Running, None, None);
        record.graph = graph::resolve(
            &parser::parse(
                r#"digraph {
  start [shape=Mdiamond];
  zeta [shape=hexagon, gallery="true"];
  pick [shape=hexagon, gallery="true"];
  ask [shape=hexagon];
  exit [shape=Msquare];
  start -> zeta -> pick -> ask -> exit;
}"#,
            )
            .unwrap(),
        )
        .unwrap();

        let summary = record.to_summary();
        assert_eq!(
            summary.gallery_gates,
            vec!["pick".to_string(), "zeta".to_string()]
        );
    }

    #[test]
    fn to_summary_has_no_gallery_gates_for_a_graph_without_them() {
        let record = make_test_record(RunStatus::Running, None, None);
        let summary = record.to_summary();
        assert!(summary.gallery_gates.is_empty());
    }

    #[test]
    fn to_summary_carries_workflow_id_when_none() {
        let record = make_test_record(RunStatus::Running, None, None);
        let summary = record.to_summary();
        assert_eq!(summary.workflow_id, None);
    }
}
