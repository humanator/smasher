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

/// Maximum length, in characters, of a trimmed per-candidate comment.
const MAX_COMMENT_CHARS: usize = 4000;

/// A validated gallery decision: chosen candidate ids plus the outgoing edge.
pub struct GateDecision {
    pub selected: Vec<String>,
    pub decision: String,
    pub comments: HashMap<String, String>,
}

/// Request body for the decision endpoint. Defaults keep a `{}` body
/// deserializable so it fails validation with 400 rather than 422.
#[derive(Debug, Deserialize)]
pub struct GateDecisionRequest {
    #[serde(default)]
    pub selected: Vec<String>,
    #[serde(default)]
    pub decision: String,
    #[serde(default)]
    pub comments: HashMap<String, String>,
}

/// Validate a candidate id against the same rules used for `selected`:
/// well-formed (no path traversal) and present among this gate's non-failed
/// candidates. Shared by both `selected` and `comments` validation so the
/// two never drift.
fn validate_candidate_id(id: &str, candidates: &[CandidateSummary]) -> Result<(), String> {
    if !crate::candidates::valid_id(id) {
        return Err(format!("invalid candidate id: {id}"));
    }
    match candidates.iter().find(|c| c.candidate_id == id) {
        Some(c) if !c.failed() => Ok(()),
        _ => Err(format!("unknown or failed candidate: {id}")),
    }
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
        validate_candidate_id(id, candidates)?;
    }

    // Comments are not restricted to selected candidates — critiquing a
    // candidate the human didn't check is the real use case.
    let mut comments = std::collections::BTreeMap::new();
    for (id, text) in &decision.comments {
        validate_candidate_id(id, candidates)?;
        let trimmed_text = text.trim();
        if trimmed_text.is_empty() {
            continue;
        }
        if trimmed_text.chars().count() > MAX_COMMENT_CHARS {
            return Err(format!(
                "comment on candidate {id} exceeds {MAX_COMMENT_CHARS} characters"
            ));
        }
        comments.insert(id.clone(), trimmed_text.to_string());
    }

    serde_json::to_string(&serde_json::json!({
        "selected": decision.selected,
        "decision": trimmed,
        "comments": comments,
    }))
    .map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Gate lookup + candidate_count resolution (dashboard card support)
// ---------------------------------------------------------------------------

/// Returns true when the node is an authoring-convention gallery gate:
/// an Interviewer node carrying `gallery="true"`.
///
/// Thin wrapper around the canonical `GraphNode::is_gallery_gate` — kept here
/// so existing callers in this module don't need to change.
pub fn is_gallery_gate(node: &GraphNode) -> bool {
    node.is_gallery_gate()
}

/// Locate the first gallery gate node in the graph, if any.
///
/// Only correct for graphs with at most one gallery gate. A pipeline with
/// more than one (e.g. a Discover gate and a separate Define gate) needs
/// `find_gallery_gate_for_node` instead — this always returns the *first*
/// gallery node regardless of which one, if any, currently has a pending
/// question.
pub fn find_gallery_gate(graph: &Graph) -> Option<&GraphNode> {
    graph.nodes.iter().find(|n| is_gallery_gate(n))
}

/// Locate the gallery gate node with the given id, if one exists.
///
/// Unlike `find_gallery_gate`, this works correctly when a graph has more
/// than one gallery gate: callers pass the node id a *specific pending
/// question* names, so the right gate is found regardless of how many other
/// gallery gates exist elsewhere in the graph.
pub fn find_gallery_gate_for_node<'a>(graph: &'a Graph, node_id: &str) -> Option<&'a GraphNode> {
    graph.node(node_id).filter(|n| is_gallery_gate(n))
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

/// Candidate ids belonging to this gate's own step, derived from the graph
/// rather than the run's full artifact history.
///
/// Walks backward from the gate through `predecessors`, reading the
/// `candidate_id` out of each Tool node's `args` JSON (the same field
/// `render_capture`/`system_lint`/`task_critic`/`synthesis` nodes are
/// authored with). Traversal stops behind an earlier gallery gate — those
/// candidates already had their own human decision and belong to a prior
/// step, not this one. A cycle (e.g. an "iterate" edge looping back through
/// this same gate) is safe: the visited set stops it from recursing forever.
///
/// Returns an empty set when the graph has no Tool nodes carrying a
/// `candidate_id` on the path behind this gate (e.g. hand-built test graphs,
/// or an authoring style this convention doesn't cover) — callers should
/// treat that as "unknown" and fall back to showing every candidate on disk
/// rather than an empty gallery.
pub fn candidate_ids_for_gate(graph: &Graph, gate_id: &str) -> std::collections::HashSet<String> {
    let mut seen = std::collections::HashSet::new();
    let mut ids = std::collections::HashSet::new();
    let mut stack: Vec<String> = graph
        .predecessors(gate_id)
        .into_iter()
        .map(String::from)
        .collect();

    while let Some(node_id) = stack.pop() {
        if !seen.insert(node_id.clone()) {
            continue;
        }
        let Some(node) = graph.node(&node_id) else {
            continue;
        };
        if let Some(id) = tool_candidate_id(node) {
            ids.insert(id);
        }
        if is_gallery_gate(node) {
            continue;
        }
        stack.extend(graph.predecessors(&node_id).into_iter().map(String::from));
    }

    ids
}

/// Reads the `candidate_id` a Tool node's `args` JSON names, if any.
fn tool_candidate_id(node: &GraphNode) -> Option<String> {
    let NodeAttrValue::String(args) = node.attrs.get("args")? else {
        return None;
    };
    let parsed: serde_json::Value = serde_json::from_str(args).ok()?;
    parsed.get("candidate_id")?.as_str().map(String::from)
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
    // Resolve everything needed from the run record and release the lock
    // before the synchronous candidate scan below, rather than holding the
    // `runs` read lock (blocking every other handler that touches this map)
    // for the duration of a filesystem walk.
    let interviewer = {
        let runs = state.runs.read().await;
        let record = runs
            .get(&id)
            .ok_or_else(|| WebError::NotFound(format!("run {id}")))?;

        // The question must belong to *a* gallery gate node, not just exist
        // somewhere in the pending queue — a Parallel fan-out can leave
        // another node's question pending at the same time, and answering
        // through this endpoint must never misroute that unrelated question.
        // Matched by the question's own node id, not "the first gallery gate
        // in the graph" — a pipeline with more than one gallery gate (e.g. a
        // Discover gate and a separate Define gate) would otherwise only ever
        // let the first one's questions through this endpoint.
        let belongs_to_gate = record.interviewer.list_questions().questions.iter().any(|q| {
            q.id == qid
                && q.node_id
                    .as_deref()
                    .is_some_and(|nid| find_gallery_gate_for_node(&record.graph, nid).is_some())
        });

        if !belongs_to_gate {
            return Ok(Json(AnswerQuestionResponse {
                success: false,
                error: Some(format!("question not found: {qid}")),
            }));
        }

        record.interviewer.clone()
    };

    let decision = GateDecision {
        selected: req.selected,
        decision: req.decision,
        comments: req.comments,
    };
    let run_id = id.clone();
    let artifacts_base = std::path::Path::new(&state.data_dir).join("artifacts");
    let candidates = tokio::task::spawn_blocking(move || {
        candidates::scan_candidates(&artifacts_base, &run_id)
    })
    .await
    .map_err(|e| WebError::Internal(format!("candidate scan task panicked: {e}")))?;
    let canonical =
        validate_decision(&candidates, &decision).map_err(WebError::BadRequest)?;
    Ok(Json(interviewer.answer_question(&qid, &canonical)))
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
            bundle_url: None,
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
                artifacts: Vec::new(),
                generation_params: std::collections::BTreeMap::new(),
            },
        }
    }

    fn decision(selected: &[&str], decision: &str) -> GateDecision {
        GateDecision {
            selected: selected.iter().map(|s| s.to_string()).collect(),
            decision: decision.into(),
            comments: HashMap::new(),
        }
    }

    fn decision_with_comments(
        selected: &[&str],
        decision: &str,
        comments: &[(&str, &str)],
    ) -> GateDecision {
        GateDecision {
            selected: selected.iter().map(|s| s.to_string()).collect(),
            decision: decision.into(),
            comments: comments
                .iter()
                .map(|(id, text)| (id.to_string(), text.to_string()))
                .collect(),
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
        assert_eq!(
            parsed,
            serde_json::json!({"selected": ["a"], "decision": "proceed", "comments": {}})
        );
    }

    #[test]
    fn validate_decision_accepts_comment_on_unselected_candidate() {
        let candidates = vec![summary("a", false), summary("b", false)];
        let canonical = validate_decision(
            &candidates,
            &decision_with_comments(&["a"], "proceed", &[("b", "tweak spacing")]),
        )
        .unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&canonical).unwrap();
        assert_eq!(parsed["comments"], serde_json::json!({"b": "tweak spacing"}));
    }

    #[test]
    fn validate_decision_rejects_comment_on_forged_id() {
        let candidates = vec![summary("a", false)];
        let err = validate_decision(
            &candidates,
            &decision_with_comments(&["a"], "proceed", &[("../x", "hi")]),
        )
        .unwrap_err();
        assert!(err.contains("../x"), "unexpected error: {err}");
    }

    #[test]
    fn validate_decision_rejects_comment_on_unknown_or_failed_id() {
        let candidates = vec![summary("good", false), summary("bad", true)];
        let err = validate_decision(
            &candidates,
            &decision_with_comments(&[], "proceed", &[("bad", "hi")]),
        )
        .unwrap_err();
        assert!(err.contains("bad"), "unexpected error: {err}");

        let err = validate_decision(
            &candidates,
            &decision_with_comments(&[], "proceed", &[("unknown", "hi")]),
        )
        .unwrap_err();
        assert!(err.contains("unknown"), "unexpected error: {err}");
    }

    #[test]
    fn validate_decision_rejects_overlong_comment() {
        let candidates = vec![summary("a", false)];
        let too_long = "x".repeat(4001);
        let err = validate_decision(
            &candidates,
            &decision_with_comments(&["a"], "proceed", &[("a", &too_long)]),
        )
        .unwrap_err();
        assert!(err.contains("a"), "unexpected error: {err}");
    }

    #[test]
    fn validate_decision_drops_whitespace_only_comment() {
        let candidates = vec![summary("a", false)];
        let canonical = validate_decision(
            &candidates,
            &decision_with_comments(&["a"], "proceed", &[("a", "   ")]),
        )
        .unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&canonical).unwrap();
        assert_eq!(parsed["comments"], serde_json::json!({}));
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
        assert_eq!(
            parsed,
            serde_json::json!({"selected": [], "decision": "iterate", "comments": {}})
        );
    }

    // ---------------------------------------------------------------
    // Endpoint integration tests (real fixtures + real pending question)
    // ---------------------------------------------------------------

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![])
    }

    fn write_fixture_manifest(run_id: &str, candidate_id: &str, failed: bool) {
        // Matches test_state()'s data_dir ("/tmp"): candidates live under
        // {data_dir}/artifacts/<run_id>/artifacts/<candidate_id>/.
        let dir = std::path::Path::new("/tmp/artifacts")
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
            artifacts: Vec::new(),
            generation_params: std::collections::BTreeMap::new(),
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

        // Must contain a real gallery gate node (matching the id
        // `spawn_pending_ask` attributes its question to) so
        // `submit_gallery_decision`'s node-id check has a gate to match.
        let dot_source = r#"digraph {
            Start [shape=Mdiamond];
            Gate1 [shape=hexagon, label="Human: pick direction(s)", gallery="true"];
            Next [shape=box];
            Start -> Gate1;
            Gate1 -> Next [label="proceed"];
        }"#;
        let dot_graph = parser::parse(dot_source).unwrap();
        let resolved = graph::resolve(&dot_graph).unwrap();
        let record = crate::state::RunRecord {
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
        use smasher_attractor::interviewer::{Interviewer, NODE_ID_CONTEXT_KEY};
        use smasher_attractor::state::Context;

        let waiter = interviewer.clone();
        let handle = tokio::spawn(async move {
            // Attribute the question to "Gate1", matching the gallery gate
            // node in `insert_test_record_with`'s graph, the same way
            // InterviewerHandler::execute does via Context::with_extra.
            let ctx = Context::new().with_extra(NODE_ID_CONTEXT_KEY, serde_json::json!("Gate1"));
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
            serde_json::json!({"selected": ["candidate-a"], "decision": "proceed", "comments": {}})
        );

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
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

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
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

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
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

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
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

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
        interviewer.answer_question(&qid, "cleanup");
    }

    #[tokio::test]
    async fn decision_rejects_qid_belonging_to_a_different_node() {
        // Regression for the Parallel fan-out bug: a non-gallery node's
        // question can be pending at the same time as the gallery gate's
        // (and even enqueued first). Answering through this endpoint with
        // that *other* question's id must be rejected, not misroute an
        // unrelated node's answer.
        use smasher_attractor::interviewer::{Interviewer, NODE_ID_CONTEXT_KEY};
        use smasher_attractor::state::Context;

        let run_id = "gallery-decision-cross-node";
        write_fixture_manifest(run_id, "candidate-a", false);

        let state = test_state();
        let interviewer = smasher_attractor::http_interviewer::HttpInterviewer::new();
        insert_test_record_with(&state, run_id, interviewer.clone()).await;

        // Enqueue the unrelated node's question first, so it's the oldest —
        // `spawn_pending_ask` assumes an empty queue (it grabs `.first()`),
        // so with two pending questions we find each one by its node id
        // instead, to avoid the two asks colliding on the same qid.
        async fn wait_for_qid_from(
            interviewer: &smasher_attractor::http_interviewer::HttpInterviewer,
            node_id: &str,
        ) -> String {
            loop {
                let questions = interviewer.list_questions();
                if let Some(q) = questions
                    .questions
                    .iter()
                    .find(|q| q.node_id.as_deref() == Some(node_id))
                {
                    return q.id.clone();
                }
                tokio::task::yield_now().await;
            }
        }

        let other_waiter = interviewer.clone();
        let other_handle = tokio::spawn(async move {
            let ctx = Context::new().with_extra(NODE_ID_CONTEXT_KEY, serde_json::json!("OtherNode"));
            other_waiter.ask("Unrelated question", &ctx).await
        });
        let other_qid = wait_for_qid_from(&interviewer, "OtherNode").await;

        let gate_waiter = interviewer.clone();
        let ask_handle = tokio::spawn(async move {
            let ctx = Context::new().with_extra(NODE_ID_CONTEXT_KEY, serde_json::json!("Gate1"));
            gate_waiter.ask("Human: pick direction(s)", &ctx).await
        });
        let gate_qid = wait_for_qid_from(&interviewer, "Gate1").await;

        let app = router().with_state(state.clone());
        let req = post_json(
            post_decision_uri(run_id, &other_qid),
            serde_json::json!({"selected": ["candidate-a"], "decision": "proceed"}),
        );
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        let parsed: AnswerQuestionResponse = serde_json::from_slice(&body).unwrap();
        assert!(
            !parsed.success,
            "must not answer a question belonging to a different node"
        );

        // Both questions are still pending — neither was misrouted.
        let pending = interviewer.list_questions();
        assert!(pending.questions.iter().any(|q| q.id == other_qid));
        assert!(pending.questions.iter().any(|q| q.id == gate_qid));

        std::fs::remove_dir_all(std::path::Path::new("/tmp/artifacts").join(run_id)).ok();
        interviewer.answer_question(&other_qid, "cleanup-other");
        interviewer.answer_question(&gate_qid, "cleanup-gate");
        other_handle.await.unwrap().unwrap();
        ask_handle.await.unwrap().unwrap();
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
