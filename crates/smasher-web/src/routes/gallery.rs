// ABOUTME: Validated gallery-gate decision endpoint for human visual selection.
// ABOUTME: Pure validate_decision plus POST /api/runs/{id}/gallery/{qid}/decision.

use axum::extract::{Path, State};
use axum::routing::post;
use axum::{Json, Router};
use serde::Deserialize;
use std::collections::HashMap;

use smasher_attractor::graph::{Graph, GraphNode, NodeAttrValue};
use smasher_attractor::http_interviewer::AnswerQuestionResponse;

use crate::candidates::{self, CandidateSummary};
use crate::error::WebError;
use crate::state::AppState;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<AppState> {
    Router::new().route(
        "/api/runs/{id}/gallery/{qid}/decision",
        post(submit_gallery_decision),
    )
}

// ---------------------------------------------------------------------------
// Decision types
// ---------------------------------------------------------------------------

/// A validated gallery decision: chosen candidate ids plus the outgoing edge.
pub struct GateDecision {
    pub selected: Vec<String>,
    pub decision: String,
}

/// Request body for the decision endpoint. Defaults keep a `{}` body
/// deserializable so it fails validation with 400 rather than 422.
#[derive(Debug, Deserialize)]
pub struct GateDecisionRequest {
    #[serde(default)]
    pub selected: Vec<String>,
    #[serde(default)]
    pub decision: String,
}

/// Pure validation: no AppState, no queue — unit-testable against fixture vecs.
///
/// Returns the canonical JSON string to forward through the existing
/// `answer_question` path.
pub fn validate_decision(
    candidates: &[CandidateSummary],
    decision: &GateDecision,
) -> Result<String, String> {
    let trimmed = decision.decision.trim();
    if trimmed.is_empty() {
        return Err("decision must name an outgoing edge".into());
    }
    for id in &decision.selected {
        if !crate::candidates::valid_id(id) {
            return Err(format!("invalid candidate id: {id}"));
        }
        match candidates.iter().find(|c| &c.candidate_id == id) {
            Some(c) if !c.failed() => {}
            _ => return Err(format!("unknown or failed candidate: {id}")),
        }
    }
    serde_json::to_string(&serde_json::json!({
        "selected": decision.selected,
        "decision": trimmed,
    }))
    .map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Gate lookup + candidate_count resolution (dashboard card support)
// ---------------------------------------------------------------------------

/// Returns true when the node is an authoring-convention gallery gate:
/// an Interviewer node carrying `gallery="true"`.
pub fn is_gallery_gate(node: &GraphNode) -> bool {
    // NOTE: the DOT parser coerces the string "true" into a boolean, so a
    // quoted gallery="true" arrives here as Bool(true), not String("true").
    // Accept both spellings.
    let gallery = match node.attrs.get("gallery") {
        Some(NodeAttrValue::Bool(true)) => true,
        Some(NodeAttrValue::String(s)) if s == "true" => true,
        _ => false,
    };
    gallery && node.node_type == smasher_attractor::graph::NodeType::Interviewer
}

/// Locate the first gallery gate node in the graph, if any.
pub fn find_gallery_gate(graph: &Graph) -> Option<&GraphNode> {
    graph.nodes.iter().find(|n| is_gallery_gate(n))
}

/// Resolve the expected candidate count for a gate card: display + warning,
/// never enforcement.
///
/// A `candidates=N` launch variable overrides everything; otherwise the
/// gate node's `candidate_count` attr accepts an integer literal or
/// `phase_default(<phase>)` with `discover=4`, `define=2`, `deliver=1`.
/// Returns `None` when no count is configured.
pub fn resolve_candidate_count(
    node: &GraphNode,
    variables: &HashMap<String, String>,
) -> Option<usize> {
    if let Some(var) = variables.get("candidates") {
        return var.trim().parse::<usize>().ok().filter(|&n| n > 0);
    }
    match node.attrs.get("candidate_count") {
        Some(NodeAttrValue::Number(n)) if *n > 0.0 => Some(*n as usize),
        Some(NodeAttrValue::String(s)) => {
            let s = s.trim();
            if let Ok(n) = s.parse::<usize>() {
                return if n > 0 { Some(n) } else { None };
            }
            phase_default(s)
        }
        _ => None,
    }
}

/// Map `phase_default(<phase>)` to its gallery size: discover=4, define=2,
/// deliver=1. Returns `None` for anything else.
fn phase_default(s: &str) -> Option<usize> {
    let phase = s
        .strip_prefix("phase_default(")?
        .strip_suffix(")")?
        .trim();
    match phase {
        "discover" => Some(4),
        "define" => Some(2),
        "deliver" => Some(1),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async fn submit_gallery_decision(
    State(state): State<AppState>,
    Path((id, qid)): Path<(String, String)>,
    Json(req): Json<GateDecisionRequest>,
) -> Result<Json<AnswerQuestionResponse>, WebError> {
    let runs = state.runs.read().await;
    let record = runs
        .get(&id)
        .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

    if !record
        .interviewer
        .list_questions()
        .questions
        .iter()
        .any(|q| q.id == qid)
    {
        return Ok(Json(AnswerQuestionResponse {
            success: false,
            error: Some(format!("question not found: {qid}")),
        }));
    }

    let decision = GateDecision {
        selected: req.selected,
        decision: req.decision,
    };
    let candidates = candidates::scan_candidates(&id);
    let canonical =
        validate_decision(&candidates, &decision).map_err(WebError::BadRequest)?;
    Ok(Json(record.interviewer.answer_question(&qid, &canonical)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use smasher_render_capture::manifest::{ExitStatus, Manifest, Viewport};
    use std::path::PathBuf;
    use tower::ServiceExt;

    fn summary(candidate_id: &str, failed: bool) -> CandidateSummary {
        CandidateSummary {
            candidate_id: candidate_id.into(),
            screenshot_url: format!("/candidate-artifacts/run/artifacts/{candidate_id}/screenshot.png"),
            manifest: Manifest {
                captured_at: chrono::Utc::now(),
                viewport: Viewport {
                    width: 1280,
                    height: 800,
                },
                candidate_dir: PathBuf::from("/tmp/candidate"),
                exit_status: if failed {
                    ExitStatus::Failed {
                        reason: "boom".into(),
                    }
                } else {
                    ExitStatus::Success
                },
            },
        }
    }

    fn decision(selected: &[&str], decision: &str) -> GateDecision {
        GateDecision {
            selected: selected.iter().map(|s| s.to_string()).collect(),
            decision: decision.into(),
        }
    }

    // ---------------------------------------------------------------
    // validate_decision unit tests
    // ---------------------------------------------------------------

    #[test]
    fn validate_decision_happy_path_returns_canonical_json() {
        let candidates = vec![summary("a", false), summary("b", false)];
        let canonical = validate_decision(&candidates, &decision(&["a"], "proceed")).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&canonical).unwrap();
        assert_eq!(parsed, serde_json::json!({"selected": ["a"], "decision": "proceed"}));
    }

    #[test]
    fn validate_decision_trims_a_padded_decision() {
        let candidates = vec![summary("a", false)];
        let canonical = validate_decision(&candidates, &decision(&["a"], "  proceed  ")).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&canonical).unwrap();
        assert_eq!(parsed["decision"], "proceed");
    }

    #[test]
    fn validate_decision_rejects_unknown_id() {
        let candidates = vec![summary("a", false)];
        let err = validate_decision(&candidates, &decision(&["forged"], "proceed")).unwrap_err();
        assert!(err.contains("forged"), "unexpected error: {err}");
    }

    #[test]
    fn validate_decision_rejects_failed_candidate() {
        let candidates = vec![summary("good", false), summary("bad", true)];
        let err = validate_decision(&candidates, &decision(&["bad"], "proceed")).unwrap_err();
        assert!(err.contains("bad"), "unexpected error: {err}");
    }

    #[test]
    fn validate_decision_rejects_traversal_id() {
        let candidates = vec![summary("a", false)];
        let err = validate_decision(&candidates, &decision(&["../x"], "proceed")).unwrap_err();
        assert!(err.contains("../x"), "unexpected error: {err}");
    }

    #[test]
    fn validate_decision_rejects_empty_decision() {
        let candidates = vec![summary("a", false)];
        assert!(validate_decision(&candidates, &decision(&["a"], "")).is_err());
        assert!(validate_decision(&candidates, &decision(&["a"], "   ")).is_err());
    }

    #[test]
    fn validate_decision_allows_empty_selection_for_reject_all() {
        let candidates = vec![summary("a", false)];
        let canonical = validate_decision(&candidates, &decision(&[], "iterate")).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&canonical).unwrap();
        assert_eq!(parsed, serde_json::json!({"selected": [], "decision": "iterate"}));
    }

    // ---------------------------------------------------------------
    // Endpoint integration tests (real fixtures + real pending question)
    // ---------------------------------------------------------------

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), "/tmp".into())
    }

    fn write_fixture_manifest(run_id: &str, candidate_id: &str, failed: bool) {
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
            candidate_dir: PathBuf::from("/tmp/candidate"),
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

    /// Insert a RunRecord sharing the given interviewer, so the test can
    /// drive a genuinely pending question through the endpoint.
    async fn insert_test_record_with(
        state: &AppState,
        id: &str,
        interviewer: smasher_attractor::http_interviewer::HttpInterviewer,
    ) {
        use chrono::Utc;
        use smasher_attractor::dot::parser;
        use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
        use smasher_attractor::graph;
        use smasher_attractor::state::RunStatus;
        use std::collections::HashMap;
        use std::sync::Arc;
        use std::sync::atomic::AtomicU64;
        use tokio_util::sync::CancellationToken;

        let dot_graph = parser::parse("digraph { a -> b }").unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        let record = crate::state::RunRecord {
            id: id.into(),
            dot_source: "digraph { a -> b }".into(),
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
        };
        state.runs.write().await.insert(id.into(), record);
    }

    /// Spawn a genuinely awaiting `ask()` and return its handle plus the
    /// pending question id once enqueued.
    async fn spawn_pending_ask(
        interviewer: smasher_attractor::http_interviewer::HttpInterviewer,
    ) -> (
        tokio::task::JoinHandle<Result<String, smasher_attractor::interviewer::InterviewerError>>,
        String,
    ) {
        use smasher_attractor::interviewer::Interviewer;
        use smasher_attractor::state::Context;

        let waiter = interviewer.clone();
        let handle = tokio::spawn(async move {
            let ctx = Context::new();
            waiter.ask("Human: pick direction(s)", &ctx).await
        });
        let qid = loop {
            let questions = interviewer.list_questions();
            if let Some(q) = questions.questions.first() {
                break q.id.clone();
            }
            tokio::task::yield_now().await;
        };
        (handle, qid)
    }

    fn post_decision_uri(run_id: &str, qid: &str) -> String {
        format!("/api/runs/{run_id}/gallery/{qid}/decision")
    }

    fn post_json(uri: String, body: serde_json::Value) -> Request<Body> {
        Request::builder()
            .method("POST")
            .uri(uri)
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap()
    }

    #[tokio::test]
    async fn decision_happy_path_unblocks_ask_with_canonical_json() {
        let run_id = "gallery-decision-happy";
        write_fixture_manifest(run_id, "candidate-a", false);
        write_fixture_manifest(run_id, "candidate-b", false);

        let state = test_state();
        let interviewer = smasher_attractor::http_interviewer::HttpInterviewer::new();
        insert_test_record_with(&state, run_id, interviewer.clone()).await;
        let (ask_handle, qid) = spawn_pending_ask(interviewer).await;

        let app = router().with_state(state.clone());
        let req = post_json(
            post_decision_uri(run_id, &qid),
            serde_json::json!({"selected": ["candidate-a"], "decision": "proceed"}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: AnswerQuestionResponse = serde_json::from_slice(&body).unwrap();
        assert!(parsed.success);

        let answer = ask_handle.await.unwrap().unwrap();
        let answer_json: serde_json::Value = serde_json::from_str(&answer).unwrap();
        assert_eq!(
            answer_json,
            serde_json::json!({"selected": ["candidate-a"], "decision": "proceed"})
        );

        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();
    }

    #[tokio::test]
    async fn decision_unknown_run_returns_404() {
        let app = router().with_state(test_state());
        let req = post_json(
            post_decision_uri("gallery-no-such-run", "q1"),
            serde_json::json!({"selected": [], "decision": "proceed"}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn decision_unknown_qid_leaves_question_pending() {
        let run_id = "gallery-decision-unknown-qid";
        write_fixture_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = smasher_attractor::http_interviewer::HttpInterviewer::new();
        insert_test_record_with(&state, run_id, interviewer.clone()).await;
        let (_ask_handle, real_qid) = spawn_pending_ask(interviewer.clone()).await;

        let app = router().with_state(state.clone());
        let req = post_json(
            post_decision_uri(run_id, "qid-does-not-exist"),
            serde_json::json!({"selected": ["candidate-a"], "decision": "proceed"}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: AnswerQuestionResponse = serde_json::from_slice(&body).unwrap();
        assert!(!parsed.success);

        // The real question is still pending.
        let pending = interviewer.list_questions();
        assert!(pending.questions.iter().any(|q| q.id == real_qid));

        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();
        // Abandon the spawned asker by answering directly so it does not linger.
        interviewer.answer_question(&real_qid, "cleanup");
    }

    #[tokio::test]
    async fn decision_forged_id_is_rejected_and_question_stays_pending() {
        let run_id = "gallery-decision-forged";
        write_fixture_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = smasher_attractor::http_interviewer::HttpInterviewer::new();
        insert_test_record_with(&state, run_id, interviewer.clone()).await;
        let (_ask_handle, qid) = spawn_pending_ask(interviewer.clone()).await;

        let app = router().with_state(state.clone());
        let req = post_json(
            post_decision_uri(run_id, &qid),
            serde_json::json!({"selected": ["forged-id"], "decision": "proceed"}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

        let pending = interviewer.list_questions();
        assert!(pending.questions.iter().any(|q| q.id == qid));

        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();
        interviewer.answer_question(&qid, "cleanup");
    }

    #[tokio::test]
    async fn decision_failed_candidate_is_rejected() {
        let run_id = "gallery-decision-failed-candidate";
        write_fixture_manifest(run_id, "candidate-good", false);
        write_fixture_manifest(run_id, "candidate-bad", true);

        let state = test_state();
        let interviewer = smasher_attractor::http_interviewer::HttpInterviewer::new();
        insert_test_record_with(&state, run_id, interviewer.clone()).await;
        let (_ask_handle, qid) = spawn_pending_ask(interviewer.clone()).await;

        let app = router().with_state(state.clone());
        let req = post_json(
            post_decision_uri(run_id, &qid),
            serde_json::json!({"selected": ["candidate-bad"], "decision": "proceed"}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

        let pending = interviewer.list_questions();
        assert!(pending.questions.iter().any(|q| q.id == qid));

        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();
        interviewer.answer_question(&qid, "cleanup");
    }

    #[tokio::test]
    async fn decision_empty_decision_is_rejected() {
        let run_id = "gallery-decision-empty";
        write_fixture_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = smasher_attractor::http_interviewer::HttpInterviewer::new();
        insert_test_record_with(&state, run_id, interviewer.clone()).await;
        let (_ask_handle, qid) = spawn_pending_ask(interviewer.clone()).await;

        let app = router().with_state(state.clone());
        let req = post_json(
            post_decision_uri(run_id, &qid),
            serde_json::json!({"selected": ["candidate-a"], "decision": "   "}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

        let pending = interviewer.list_questions();
        assert!(pending.questions.iter().any(|q| q.id == qid));

        std::fs::remove_dir_all(std::path::Path::new("runs").join(run_id)).ok();
        interviewer.answer_question(&qid, "cleanup");
    }

    // ---------------------------------------------------------------
    // Gate lookup + candidate_count unit tests
    // ---------------------------------------------------------------

    fn gallery_dot() -> &'static str {
        r#"digraph {
            Start [shape=Mdiamond];
            Gate1 [shape=hexagon, label="Human: pick direction(s)", gallery="true", candidate_count="phase_default(discover)"];
            NextA [shape=box];
            NextB [shape=box];
            Start -> Gate1;
            Gate1 -> NextA [label="proceed"];
            Gate1 -> NextB [label="iterate"];
        }"#
    }

    fn resolve_graph(dot: &str) -> smasher_attractor::graph::Graph {
        let parsed = smasher_attractor::dot::parser::parse(dot).unwrap();
        smasher_attractor::graph::resolve(&parsed).unwrap()
    }

    #[test]
    fn find_gallery_gate_locates_hexagon_gate() {
        let graph = resolve_graph(gallery_dot());
        let gate = find_gallery_gate(&graph).expect("gate should be found");
        assert_eq!(gate.id, "Gate1");
    }

    #[test]
    fn find_gallery_gate_ignores_non_gallery_graph() {
        let graph = resolve_graph("digraph { Start [shape=Mdiamond]; A [shape=box]; End [shape=Msquare]; Start -> A -> End; }");
        assert!(find_gallery_gate(&graph).is_none());
    }

    #[test]
    fn find_gallery_gate_ignores_diamond_conditional() {
        // shape=diamond maps to Conditional, which never pauses — not a gate.
        let graph = resolve_graph(
            r#"digraph {
                Start [shape=Mdiamond];
                Gate1 [shape=diamond, label="Human: pick", gallery="true"];
                End [shape=Msquare];
                Start -> Gate1 -> End;
            }"#,
        );
        assert!(find_gallery_gate(&graph).is_none());
    }

    fn gate_node(dot: &str) -> smasher_attractor::graph::GraphNode {
        resolve_graph(dot)
            .nodes
            .into_iter()
            .find(|n| n.id == "Gate1")
            .unwrap()
    }

    #[test]
    fn resolve_candidate_count_reads_integer_literal() {
        let node = gate_node(
            r#"digraph { Start [shape=Mdiamond]; Gate1 [shape=hexagon, candidate_count="3"]; End [shape=Msquare]; Start -> Gate1 -> End; }"#,
        );
        assert_eq!(resolve_candidate_count(&node, &HashMap::new()), Some(3));
    }

    #[test]
    fn resolve_candidate_count_reads_phase_defaults() {
        for (phase, expected) in [("discover", 4), ("define", 2), ("deliver", 1)] {
            let dot = format!(
                r#"digraph {{ Start [shape=Mdiamond]; Gate1 [shape=hexagon, candidate_count="phase_default({phase})"]; End [shape=Msquare]; Start -> Gate1 -> End; }}"#
            );
            let node = gate_node(&dot);
            assert_eq!(
                resolve_candidate_count(&node, &HashMap::new()),
                Some(expected),
                "phase {phase}"
            );
        }
    }

    #[test]
    fn resolve_candidate_count_launch_var_overrides_attr() {
        let node = gate_node(
            r#"digraph { Start [shape=Mdiamond]; Gate1 [shape=hexagon, candidate_count="3"]; End [shape=Msquare]; Start -> Gate1 -> End; }"#,
        );
        let vars = HashMap::from([("candidates".to_string(), "6".to_string())]);
        assert_eq!(resolve_candidate_count(&node, &vars), Some(6));
    }

    #[test]
    fn resolve_candidate_count_returns_none_when_unconfigured() {
        let node = gate_node(
            r#"digraph { Start [shape=Mdiamond]; Gate1 [shape=hexagon]; End [shape=Msquare]; Start -> Gate1 -> End; }"#,
        );
        assert_eq!(resolve_candidate_count(&node, &HashMap::new()), None);
    }

    #[test]
    fn resolve_candidate_count_returns_none_for_garbage() {
        let node = gate_node(
            r#"digraph { Start [shape=Mdiamond]; Gate1 [shape=hexagon, candidate_count="lots"]; End [shape=Msquare]; Start -> Gate1 -> End; }"#,
        );
        assert_eq!(resolve_candidate_count(&node, &HashMap::new()), None);
    }
}
