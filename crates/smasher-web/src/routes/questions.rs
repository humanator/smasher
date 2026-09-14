// ABOUTME: Interviewer question and answer route handlers for human-in-the-loop pipelines.
// ABOUTME: Lists pending questions and submits answers to the HttpInterviewer queue.

use axum::extract::{Form, Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};

use smasher_attractor::http_interviewer::{
    AnswerQuestionRequest, AnswerQuestionResponse, ListQuestionsResponse,
};

use crate::error::WebError;
use crate::state::AppState;

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
) -> Result<Json<ListQuestionsResponse>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;
    Ok(Json(record.interviewer.list_questions()))
}

async fn answer_question(
    State(state): State<AppState>,
    Path((id, qid)): Path<(String, String)>,
    Form(req): Form<AnswerQuestionRequest>,
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
        AppState::new(client, "test-model".into(), None, "/tmp".into())
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
        let req = Request::builder()
            .method("POST")
            .uri("/api/runs/nonexistent/questions/q1/answer")
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from("answer=yes"))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    /// Regression guard: `question_card.html`'s `<form hx-post=...>` has no
    /// `hx-ext="json-enc"`, so htmx (like any plain HTML form) submits it as
    /// `application/x-www-form-urlencoded` — not JSON. This exercises the
    /// exact content type and body shape that form actually sends, proving
    /// the plain (non-gallery) human-gate answer path works from a real
    /// browser rather than only from a test client free to pick JSON.
    #[tokio::test]
    async fn answer_question_accepts_the_content_type_the_rendered_form_sends() {
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
        };
        state.runs.write().await.insert("run1".into(), record);

        let iv_clone = interviewer.clone();
        let ask_handle =
            tokio::spawn(async move { iv_clone.ask("Continue?", &Context::new()).await });

        // Let the enqueue land, then read the qid the queue assigned it —
        // exactly what the rendered question_card.html form would target.
        tokio::task::yield_now().await;
        let qid = interviewer.list_questions().questions[0].id.clone();

        let req = Request::builder()
            .method("POST")
            .uri(format!("/api/runs/run1/questions/{qid}/answer"))
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from("answer=yes"))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let answered = ask_handle.await.unwrap();
        assert_eq!(answered.unwrap(), "yes");
    }
}
