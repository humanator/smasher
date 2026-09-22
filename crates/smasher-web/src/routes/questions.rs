// ABOUTME: Interviewer question and answer route handlers for human-in-the-loop pipelines.
// ABOUTME: Lists pending questions (annotated with gallery-gate info when relevant) and
// ABOUTME: submits answers to the HttpInterviewer queue.

use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use smasher_attractor::http_interviewer::{
    AnswerQuestionRequest, AnswerQuestionResponse, QuestionSummary,
};

use crate::candidates;
use crate::error::WebError;
use crate::routes::api::CandidateResponse;
use crate::routes::gallery::{candidate_ids_for_gate, find_gallery_gate_for_node, resolve_candidate_count};
use crate::state::AppState;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/// The gallery-gate card data for whichever pending question, if any,
/// belongs to a gallery gate node (`shape=hexagon gallery="true"`). Mirrors
/// what `pages.rs::run_questions` computes for the HTMX `gallery_gate.html`
/// card, but as structured JSON instead of pre-rendered HTML.
#[derive(Debug, Serialize, Deserialize)]
pub struct GalleryGateSummary {
    pub question_id: String,
    pub candidates: Vec<CandidateResponse>,
    pub expected_count: Option<usize>,
    pub outgoing_edges: Vec<String>,
}

/// `GET /api/runs/{id}/questions` response. `questions` excludes whichever
/// question `gallery_gate` (when present) already covers — matching the
/// HTMX dashboard's dedup behavior of never showing both a gate card and a
/// redundant plain question card for the same pending question.
#[derive(Debug, Serialize, Deserialize)]
pub struct ListQuestionsWithGalleryResponse {
    pub questions: Vec<QuestionSummary>,
    pub gallery_gate: Option<GalleryGateSummary>,
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/runs/{id}/questions", get(list_questions))
        .route(
            "/api/runs/{id}/questions/{qid}/answer",
            post(answer_question),
        )
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn list_questions(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ListQuestionsWithGalleryResponse>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

    let pending = record.interviewer.list_questions();

    // Whichever pending question actually belongs to a gallery gate, matched
    // by the question's own node id — not just "the graph's first
    // gallery-shaped node" (a pipeline can have more than one gallery gate).
    let pending_gallery = pending.questions.iter().find_map(|q| {
        let node_id = q.node_id.as_deref()?;
        let gate = find_gallery_gate_for_node(&record.graph, node_id)?;
        Some((q.id.clone(), gate))
    });

    let mut questions = pending.questions;

    let gallery_gate = pending_gallery.and_then(|(question_id, gate)| {
        let artifacts_base = std::path::Path::new(&state.data_dir).join("artifacts");
        let all = candidates::scan_candidates(&artifacts_base, &id);
        if all.is_empty() {
            return None;
        }

        // Scope to this gate's own step, not the run's whole artifact
        // history, falling back to everything found when the graph can't
        // tell candidates apart by step.
        let relevant_ids = candidate_ids_for_gate(&record.graph, &gate.id);
        let filtered: Vec<_> = if relevant_ids.is_empty() {
            Vec::new()
        } else {
            all.iter()
                .filter(|c| relevant_ids.contains(&c.candidate_id))
                .cloned()
                .collect()
        };
        let found = if filtered.is_empty() { all } else { filtered };

        let candidate_responses: Vec<CandidateResponse> = found
            .into_iter()
            .map(|summary| {
                let scorecard =
                    candidates::read_scorecard(&artifacts_base, &id, &summary.candidate_id);
                CandidateResponse {
                    candidate_id: summary.candidate_id,
                    screenshot_url: summary.screenshot_url,
                    bundle_url: summary.bundle_url,
                    manifest: serde_json::to_value(&summary.manifest)
                        .unwrap_or(serde_json::Value::Null),
                    scorecard: serde_json::to_value(&scorecard)
                        .unwrap_or(serde_json::Value::Null),
                }
            })
            .collect();

        let expected_count = resolve_candidate_count(gate, &record.variables);
        let outgoing_edges: Vec<String> = record
            .graph
            .edges_from(&gate.id)
            .into_iter()
            .map(|e| e.label.clone().unwrap_or_else(|| e.to.clone()))
            .collect();

        // Suppress the redundant plain question card for the gate's own
        // pending question, matching the HTMX dashboard's dedup — but only
        // once a gate card is actually going to be present.
        questions.retain(|q| q.id != question_id);

        Some(GalleryGateSummary {
            question_id,
            candidates: candidate_responses,
            expected_count,
            outgoing_edges,
        })
    });

    Ok(Json(ListQuestionsWithGalleryResponse {
        questions,
        gallery_gate,
    }))
}

async fn answer_question(
    State(state): State<AppState>,
    Path((id, qid)): Path<(String, String)>,
    Json(req): Json<AnswerQuestionRequest>,
) -> Result<Json<AnswerQuestionResponse>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    Ok(Json(record.interviewer.answer_question(&qid, &req.answer)))
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
    async fn list_questions_not_found() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/api/runs/nonexistent/questions")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn answer_question_run_not_found() {
        let app = router().with_state(test_state());
        let body = serde_json::json!({"answer": "yes"});
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs/nonexistent/questions/q1/answer")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn answer_question_accepts_json() {
        use crate::state::RunRecord;
        use chrono::Utc;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph::Graph;
        use smasher_attractor::http_interviewer::HttpInterviewer;
        use smasher_attractor::interviewer::Interviewer;
        use smasher_attractor::state::{Context, RunStatus};
        use std::collections::HashMap;
        use std::sync::Arc;
        use std::sync::atomic::AtomicU64;
        use tokio_util::sync::CancellationToken;

        let state = test_state();
        let app = router().with_state(state.clone());

        let interviewer = HttpInterviewer::new();
        let record = RunRecord {
            id: "run1".into(),
            dot_source: String::new(),
            graph: Graph {
                name: None,
                nodes: vec![],
                edges: vec![],
                default_node_attrs: HashMap::new(),
                default_edge_attrs: HashMap::new(),
                graph_attrs: HashMap::new(),
            },
            status: RunStatus::Running,
            started_at: Utc::now(),
            completed_at: None,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: CancellationToken::new(),
            interviewer: interviewer.clone(),
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: None,
            workflow_id: None,
        };
        state.runs.write().await.insert("run1".into(), record);

        let iv_clone = interviewer.clone();
        let ask_handle =
            tokio::spawn(async move { iv_clone.ask("Continue?", &Context::new()).await });

        // Let the enqueue land, then read the qid the queue assigned it —
        // exactly what the rendered question_card.html form would target.
        tokio::task::yield_now().await;
        let qid = interviewer.list_questions().questions[0].id.clone();

        let body = serde_json::json!({"answer": "yes"});
        let req = Request::builder()
            .method("POST")
            .uri(format!("/api/runs/run1/questions/{qid}/answer"))
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let answered = ask_handle.await.unwrap();
        assert_eq!(answered.unwrap(), "yes");
    }

    // ---------------------------------------------------------------
    // gallery_gate field on GET /api/runs/{id}/questions
    // ---------------------------------------------------------------

    fn gallery_gate_record(
        id: &str,
        interviewer: smasher_attractor::http_interviewer::HttpInterviewer,
    ) -> crate::state::RunRecord {
        use chrono::Utc;
        use smasher_attractor::dot::parser;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph;
        use smasher_attractor::state::RunStatus;
        use std::collections::HashMap;
        use std::sync::Arc;
        use std::sync::atomic::AtomicU64;
        use tokio_util::sync::CancellationToken;

        let dot_source = r#"digraph {
            Start [shape=Mdiamond];
            Gate1 [shape=hexagon, label="Pick one", gallery="true", candidate_count="2"];
            Proceed [shape=box];
            Iterate [shape=box];
            Start -> Gate1;
            Gate1 -> Proceed [label="proceed"];
            Gate1 -> Iterate [label="iterate"];
        }"#;
        let dot_graph = parser::parse(dot_source).unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        crate::state::RunRecord {
            id: id.into(),
            dot_source: dot_source.into(),
            graph: resolved,
            status: RunStatus::Running,
            started_at: Utc::now(),
            completed_at: None,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(PipelineEventLog::new()),
            cancellation: CancellationToken::new(),
            interviewer,
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(0)),
            output_tokens: Arc::new(AtomicU64::new(0)),
            run_working_dir: None,
            workflow_id: None,
        }
    }

    async fn spawn_gate_ask(
        interviewer: smasher_attractor::http_interviewer::HttpInterviewer,
    ) -> String {
        use smasher_attractor::interviewer::{Interviewer, NODE_ID_CONTEXT_KEY};
        use smasher_attractor::state::Context;

        let waiter = interviewer.clone();
        tokio::spawn(async move {
            let ctx = Context::new().with_extra(NODE_ID_CONTEXT_KEY, serde_json::json!("Gate1"));
            let _ = waiter.ask("Pick one", &ctx).await;
        });
        loop {
            let questions = interviewer.list_questions();
            if let Some(q) = questions.questions.first() {
                return q.id.clone();
            }
            tokio::task::yield_now().await;
        }
    }

    fn write_candidate_manifest(run_id: &str, candidate_id: &str) {
        // Matches test_state()'s data_dir ("/tmp").
        let dir = std::path::Path::new("/tmp/artifacts")
            .join(run_id)
            .join("artifacts")
            .join(candidate_id);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("manifest.json"),
            serde_json::json!({
                "captured_at": chrono::Utc::now(),
                "viewport": {"width": 1280, "height": 800},
                "candidate_dir": "/tmp/candidate",
                "exit_status": {"status": "success"},
                "artifacts": [],
                "generation_params": {},
            })
            .to_string(),
        )
        .unwrap();
    }

    async fn get_questions_json(
        app: axum::Router,
        run_id: &str,
    ) -> ListQuestionsWithGalleryResponse {
        let req = Request::builder()
            .uri(format!("/api/runs/{run_id}/questions"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&body).unwrap()
    }

    #[tokio::test]
    async fn list_questions_gallery_gate_is_none_for_a_plain_question() {
        use smasher_attractor::http_interviewer::HttpInterviewer;
        use smasher_attractor::interviewer::Interviewer;
        use smasher_attractor::state::Context;

        let run_id = "questions-plain";
        let state = test_state();
        let interviewer = HttpInterviewer::new();
        state
            .runs
            .write()
            .await
            .insert(run_id.into(), gallery_gate_record(run_id, interviewer.clone()));

        let iv = interviewer.clone();
        let ask_handle = tokio::spawn(async move { iv.ask("Continue?", &Context::new()).await });
        tokio::task::yield_now().await;
        let qid = interviewer.list_questions().questions[0].id.clone();

        let app = router().with_state(state);
        let parsed = get_questions_json(app, run_id).await;

        assert!(parsed.gallery_gate.is_none());
        assert!(parsed.questions.iter().any(|q| q.id == qid));

        interviewer.answer_question(&qid, "cleanup");
        ask_handle.await.unwrap().unwrap();
    }

    #[tokio::test]
    async fn list_questions_gallery_gate_is_none_without_candidates_on_disk() {
        use smasher_attractor::http_interviewer::HttpInterviewer;

        let run_id = "questions-gate-no-candidates";
        let state = test_state();
        let interviewer = HttpInterviewer::new();
        state
            .runs
            .write()
            .await
            .insert(run_id.into(), gallery_gate_record(run_id, interviewer.clone()));

        let qid = spawn_gate_ask(interviewer.clone()).await;

        let app = router().with_state(state);
        let parsed = get_questions_json(app, run_id).await;

        assert!(parsed.gallery_gate.is_none());
        assert!(
            parsed.questions.iter().any(|q| q.id == qid),
            "plain card must still cover the gate's question when no gate card renders"
        );

        interviewer.answer_question(&qid, "cleanup");
    }

    #[tokio::test]
    async fn list_questions_includes_gallery_gate_and_dedupes_plain_question() {
        use smasher_attractor::http_interviewer::HttpInterviewer;

        let run_id = "questions-gate-with-candidates";
        write_candidate_manifest(run_id, "candidate-a");
        write_candidate_manifest(run_id, "candidate-b");

        let state = test_state();
        let interviewer = HttpInterviewer::new();
        state
            .runs
            .write()
            .await
            .insert(run_id.into(), gallery_gate_record(run_id, interviewer.clone()));

        let qid = spawn_gate_ask(interviewer.clone()).await;

        let app = router().with_state(state);
        let parsed = get_questions_json(app, run_id).await;

        let gate = parsed.gallery_gate.expect("gallery gate should be present");
        assert_eq!(gate.question_id, qid);
        assert_eq!(gate.expected_count, Some(2));
        let mut edges = gate.outgoing_edges.clone();
        edges.sort();
        assert_eq!(edges, vec!["iterate".to_string(), "proceed".to_string()]);
        let mut ids: Vec<_> = gate.candidates.iter().map(|c| c.candidate_id.clone()).collect();
        ids.sort();
        assert_eq!(ids, vec!["candidate-a".to_string(), "candidate-b".to_string()]);

        assert!(
            !parsed.questions.iter().any(|q| q.id == qid),
            "gate's own question must be deduped out of the plain questions list"
        );

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
        interviewer.answer_question(&qid, "cleanup");
    }
}
