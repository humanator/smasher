// ABOUTME: JSON graph API for the visual workflow editor: read/write a workflow's Graph as JSON.
// ABOUTME: Provides GET/PUT /api/workflows/{id}/graph and POST /api/workflows/new.

use std::collections::HashMap;

use axum::extract::{Path, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use smasher_attractor::dot::parser;
use smasher_attractor::graph::{self, Graph, GraphEdge, GraphNode, NodeAttrValue, NodeType};
use smasher_attractor::rendering::render_to_dot;

use crate::error::WebError;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/workflows/{id}/graph", get(get_graph).put(put_graph))
        .route("/api/workflows/new", post(create_graph))
}

// ---------------------------------------------------------------------------
// JSON graph shape (thin serde wrappers around Graph/GraphNode/GraphEdge)
// ---------------------------------------------------------------------------

// `pub(crate)` on these three so `routes::pages`'s `/workflows/{id}/edit`
// handler can reuse the exact same JSON shape (and the `From<&Graph>`
// conversions below) for its server-side graph bootstrap, per the plan's
// "call the underlying functions directly, don't loop back through HTTP"
// instruction — a second hand-rolled DTO here would risk silently
// diverging from what the real `GET /api/workflows/{id}/graph` returns.
#[derive(Debug, Default, Serialize, Deserialize, PartialEq)]
pub(crate) struct EditorGraph {
    name: Option<String>,
    nodes: Vec<EditorNode>,
    edges: Vec<EditorEdge>,
    /// Graph-level attrs (e.g. `goal`, `default_max_retry`) — carried
    /// through so a save doesn't drop them, the same data-loss risk fixed
    /// for `render_to_dot` itself. `default_node_attrs`/`default_edge_attrs`
    /// are deliberately not exposed here, matching that same fix's scope.
    #[serde(default)]
    graph_attrs: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct EditorNode {
    id: String,
    node_type: String,
    label: Option<String>,
    #[serde(default)]
    attrs: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub(crate) struct EditorEdge {
    from: String,
    to: String,
    label: Option<String>,
    condition: Option<String>,
    priority: Option<i32>,
    #[serde(default)]
    loop_restart: bool,
    #[serde(default)]
    attrs: HashMap<String, serde_json::Value>,
}

fn node_type_to_str(nt: &NodeType) -> &'static str {
    match nt {
        NodeType::Start => "Start",
        NodeType::Exit => "Exit",
        NodeType::Codergen => "Codergen",
        NodeType::Conditional => "Conditional",
        NodeType::Tool => "Tool",
        NodeType::Interviewer => "Interviewer",
        NodeType::Parallel => "Parallel",
        NodeType::FanIn => "FanIn",
        NodeType::Manager => "Manager",
        NodeType::SubPipeline => "SubPipeline",
        NodeType::Generic => "Generic",
    }
}

fn node_type_from_str(s: &str) -> Option<NodeType> {
    Some(match s {
        "Start" => NodeType::Start,
        "Exit" => NodeType::Exit,
        "Codergen" => NodeType::Codergen,
        "Conditional" => NodeType::Conditional,
        "Tool" => NodeType::Tool,
        "Interviewer" => NodeType::Interviewer,
        "Parallel" => NodeType::Parallel,
        "FanIn" => NodeType::FanIn,
        "Manager" => NodeType::Manager,
        "SubPipeline" => NodeType::SubPipeline,
        "Generic" => NodeType::Generic,
        _ => return None,
    })
}

fn attr_value_to_json(v: &NodeAttrValue) -> serde_json::Value {
    match v {
        NodeAttrValue::String(s) => serde_json::Value::String(s.clone()),
        NodeAttrValue::Number(n) => serde_json::Number::from_f64(*n)
            .map_or(serde_json::Value::Null, serde_json::Value::Number),
        NodeAttrValue::Bool(b) => serde_json::Value::Bool(*b),
        // No real fixture stores a Duration in a node/edge's generic attrs
        // today (typed handler fields read String/Number/Bool only), but
        // round-trip it as the same "{secs}s" string format
        // format_attr_value (rendering.rs) writes, so it can't silently
        // corrupt into a different type if one ever shows up.
        NodeAttrValue::Duration(d) => serde_json::Value::String(format!("{}s", d.as_secs())),
    }
}

fn attr_value_from_json(v: &serde_json::Value) -> Result<NodeAttrValue, WebError> {
    match v {
        serde_json::Value::String(s) => Ok(NodeAttrValue::String(s.clone())),
        serde_json::Value::Number(n) => n
            .as_f64()
            .map(NodeAttrValue::Number)
            .ok_or_else(|| WebError::BadRequest(format!("attr value out of range: {n}"))),
        serde_json::Value::Bool(b) => Ok(NodeAttrValue::Bool(*b)),
        other => Err(WebError::BadRequest(format!(
            "unsupported attr value type: {other}"
        ))),
    }
}

fn attrs_to_json(attrs: &HashMap<String, NodeAttrValue>) -> HashMap<String, serde_json::Value> {
    attrs
        .iter()
        .map(|(k, v)| (k.clone(), attr_value_to_json(v)))
        .collect()
}

fn attrs_from_json(
    attrs: HashMap<String, serde_json::Value>,
) -> Result<HashMap<String, NodeAttrValue>, WebError> {
    attrs
        .iter()
        .map(|(k, v)| Ok((k.clone(), attr_value_from_json(v)?)))
        .collect()
}

impl From<&Graph> for EditorGraph {
    fn from(g: &Graph) -> Self {
        EditorGraph {
            name: g.name.clone(),
            nodes: g.nodes.iter().map(EditorNode::from).collect(),
            edges: g.edges.iter().map(EditorEdge::from).collect(),
            graph_attrs: attrs_to_json(&g.graph_attrs),
        }
    }
}

impl From<&GraphNode> for EditorNode {
    fn from(n: &GraphNode) -> Self {
        EditorNode {
            id: n.id.clone(),
            node_type: node_type_to_str(&n.node_type).to_string(),
            label: n.label.clone(),
            attrs: attrs_to_json(&n.attrs),
        }
    }
}

impl From<&GraphEdge> for EditorEdge {
    fn from(e: &GraphEdge) -> Self {
        EditorEdge {
            from: e.from.clone(),
            to: e.to.clone(),
            label: e.label.clone(),
            condition: e.condition.clone(),
            priority: e.priority,
            loop_restart: e.loop_restart,
            attrs: attrs_to_json(&e.attrs),
        }
    }
}

impl EditorGraph {
    /// Convert back to a `Graph` for validation/rendering. `default_node_attrs`/
    /// `default_edge_attrs` are always empty on the result — this DTO never
    /// carries them, matching the same explicitly-out-of-scope gap in
    /// `render_to_dot` itself.
    fn into_graph(self) -> Result<Graph, WebError> {
        let nodes = self
            .nodes
            .into_iter()
            .map(|n| {
                let node_type = node_type_from_str(&n.node_type).ok_or_else(|| {
                    WebError::BadRequest(format!("unknown node_type: {}", n.node_type))
                })?;
                Ok(GraphNode {
                    id: n.id,
                    node_type,
                    label: n.label,
                    attrs: attrs_from_json(n.attrs)?,
                })
            })
            .collect::<Result<Vec<_>, WebError>>()?;

        let edges = self
            .edges
            .into_iter()
            .map(|e| {
                Ok(GraphEdge {
                    from: e.from,
                    to: e.to,
                    label: e.label,
                    condition: e.condition,
                    priority: e.priority,
                    loop_restart: e.loop_restart,
                    attrs: attrs_from_json(e.attrs)?,
                })
            })
            .collect::<Result<Vec<_>, WebError>>()?;

        Ok(Graph {
            name: self.name,
            nodes,
            edges,
            default_node_attrs: HashMap::new(),
            default_edge_attrs: HashMap::new(),
            graph_attrs: attrs_from_json(self.graph_attrs)?,
        })
    }
}

/// Parse, resolve, and render an `EditorGraph` to DOT source, validating
/// the generated source re-parses and re-resolves cleanly before returning
/// it — callers must not write to disk until this succeeds, so a rejected
/// save never touches the existing file.
fn validate_and_render(editor_graph: EditorGraph) -> Result<(String, Graph), WebError> {
    let graph = editor_graph.into_graph()?;
    let dot_source = render_to_dot(&graph);

    let ast = parser::parse(&dot_source)?;
    let resolved = graph::resolve(&ast)?;

    Ok((dot_source, resolved))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn get_graph(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<EditorGraph>, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;
    let dot_source = std::fs::read_to_string(&workflow.path)?;
    let ast = parser::parse(&dot_source)?;
    let resolved = graph::resolve(&ast)?;
    Ok(Json(EditorGraph::from(&resolved)))
}

async fn put_graph(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(editor_graph): Json<EditorGraph>,
) -> Result<Json<EditorGraph>, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;

    let (dot_source, resolved) = validate_and_render(editor_graph)?;
    std::fs::write(&workflow.path, &dot_source)?;

    Ok(Json(EditorGraph::from(&resolved)))
}

#[derive(Debug, Deserialize)]
struct CreateGraphRequest {
    name: String,
    target_dir: String,
    graph: EditorGraph,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateGraphResponse {
    id: String,
}

/// Writes a newly-created graph to `{target_dir}/{name}.dot`. Mirrors
/// `routes::pages::create_workflow`'s validation exactly (blank-name
/// rejection, `candidates::valid_id` traversal check, `target_dir` must be
/// one of the operator-configured `state.workflow_dirs`).
async fn create_graph(
    State(state): State<AppState>,
    Json(req): Json<CreateGraphRequest>,
) -> Result<Json<CreateGraphResponse>, WebError> {
    let name = req.name.trim();
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
    if !state.workflow_dirs.contains(&req.target_dir) {
        return Err(WebError::BadRequest(format!(
            "unknown target directory: {}",
            req.target_dir
        )));
    }

    let (dot_source, _resolved) = validate_and_render(req.graph)?;

    let target_dir = std::path::Path::new(&req.target_dir);
    std::fs::create_dir_all(target_dir)?;
    let file_path = target_dir.join(format!("{name}.dot"));
    std::fs::write(&file_path, &dot_source)?;

    let root_name = crate::workflows::root_name_for(&req.target_dir);
    let id = crate::workflows::slug_for(&root_name, std::path::Path::new(&format!("{name}.dot")));

    Ok(Json(CreateGraphResponse { id }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

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

    fn write_fixture(dir: &std::path::Path, name: &str, contents: &str) {
        std::fs::write(dir.join(name), contents).unwrap();
    }

    const FIXTURE_DOT: &str = r#"
digraph {
    goal="Prove the editor API round-trips";
    entry [shape=Mdiamond, label="Entry"];
    gen [shape=box, label="Generate", prompt="write the thing", model="claude-sonnet-4-20250514"];
    ask [shape=hexagon, label="Ask", question="proceed?", gallery=true];
    exit [shape=doublecircle, label="Exit"];

    entry -> gen;
    gen -> ask [condition="ask_next", priority=1];
    ask -> exit;
}
"#;

    async fn body_json<T: serde::de::DeserializeOwned>(resp: axum::response::Response) -> T {
        let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn get_graph_returns_node_and_edge_counts_and_representative_attrs() {
        let tmp = tempfile::tempdir().unwrap();
        write_fixture(tmp.path(), "hello.dot", FIXTURE_DOT);
        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let id = crate::workflows::scan_workflows(&[tmp.path().display().to_string()])
            .into_iter()
            .next()
            .unwrap()
            .id;

        let req = Request::builder()
            .uri(format!("/api/workflows/{id}/graph"))
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let graph: EditorGraph = body_json(resp).await;
        assert_eq!(graph.nodes.len(), 4);
        assert_eq!(graph.edges.len(), 3);

        let gen_node = graph.nodes.iter().find(|n| n.id == "gen").unwrap();
        assert_eq!(gen_node.node_type, "Codergen");
        assert_eq!(
            gen_node.attrs.get("prompt"),
            Some(&serde_json::Value::String("write the thing".to_string()))
        );

        let ask_node = graph.nodes.iter().find(|n| n.id == "ask").unwrap();
        assert_eq!(ask_node.node_type, "Interviewer");
        assert_eq!(
            ask_node.attrs.get("gallery"),
            Some(&serde_json::Value::Bool(true))
        );

        assert_eq!(
            graph.graph_attrs.get("goal"),
            Some(&serde_json::Value::String(
                "Prove the editor API round-trips".to_string()
            ))
        );
    }

    #[tokio::test]
    async fn get_graph_unknown_id_returns_404() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let req = Request::builder()
            .uri("/api/workflows/no-such-id/graph")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn put_graph_unknown_id_returns_404() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = serde_json::to_string(&EditorGraph {
            name: None,
            nodes: vec![],
            edges: vec![],
            graph_attrs: HashMap::new(),
        })
        .unwrap();
        let req = Request::builder()
            .method("PUT")
            .uri("/api/workflows/no-such-id/graph")
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn put_graph_with_added_node_and_removed_edge_persists_and_reparses() {
        let tmp = tempfile::tempdir().unwrap();
        write_fixture(tmp.path(), "hello.dot", FIXTURE_DOT);
        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let id = crate::workflows::scan_workflows(&[tmp.path().display().to_string()])
            .into_iter()
            .next()
            .unwrap()
            .id;

        // Fetch, add a node, drop the ask -> exit edge.
        let get_req = Request::builder()
            .uri(format!("/api/workflows/{id}/graph"))
            .body(Body::empty())
            .unwrap();
        let get_resp = app.clone().oneshot(get_req).await.unwrap();
        let mut graph: EditorGraph = body_json(get_resp).await;

        graph.nodes.push(EditorNode {
            id: "extra".to_string(),
            node_type: "Codergen".to_string(),
            label: Some("Extra".to_string()),
            attrs: HashMap::new(),
        });
        graph.edges.retain(|e| !(e.from == "ask" && e.to == "exit"));

        let put_body = serde_json::to_string(&graph).unwrap();
        let put_req = Request::builder()
            .method("PUT")
            .uri(format!("/api/workflows/{id}/graph"))
            .header("content-type", "application/json")
            .body(Body::from(put_body))
            .unwrap();
        let put_resp = app.clone().oneshot(put_req).await.unwrap();
        assert_eq!(put_resp.status(), StatusCode::OK);

        // File on disk parses and resolves cleanly.
        let on_disk = std::fs::read_to_string(tmp.path().join("hello.dot")).unwrap();
        let ast = parser::parse(&on_disk).unwrap();
        graph::resolve(&ast).unwrap();

        // A subsequent GET reflects the change.
        let get_req2 = Request::builder()
            .uri(format!("/api/workflows/{id}/graph"))
            .body(Body::empty())
            .unwrap();
        let get_resp2 = app.oneshot(get_req2).await.unwrap();
        let graph2: EditorGraph = body_json(get_resp2).await;
        assert_eq!(graph2.nodes.len(), 5);
        assert!(graph2.nodes.iter().any(|n| n.id == "extra"));
        assert!(
            !graph2
                .edges
                .iter()
                .any(|e| e.from == "ask" && e.to == "exit")
        );
    }

    #[tokio::test]
    async fn put_graph_that_fails_to_resolve_is_rejected_and_file_is_unchanged() {
        let tmp = tempfile::tempdir().unwrap();
        write_fixture(tmp.path(), "hello.dot", FIXTURE_DOT);
        let app = router().with_state(state_with_workflow_dir(tmp.path()));
        let id = crate::workflows::scan_workflows(&[tmp.path().display().to_string()])
            .into_iter()
            .next()
            .unwrap()
            .id;
        let before = std::fs::read_to_string(tmp.path().join("hello.dot")).unwrap();

        // Two nodes sharing the same id: renders fine, but re-parsing and
        // re-resolving the rendered DOT hits ResolutionError::DuplicateNode.
        let bad_graph = EditorGraph {
            name: None,
            nodes: vec![
                EditorNode {
                    id: "dup".to_string(),
                    node_type: "Codergen".to_string(),
                    label: Some("A".to_string()),
                    attrs: HashMap::new(),
                },
                EditorNode {
                    id: "dup".to_string(),
                    node_type: "Codergen".to_string(),
                    label: Some("B".to_string()),
                    attrs: HashMap::new(),
                },
            ],
            edges: vec![],
            graph_attrs: HashMap::new(),
        };
        let body = serde_json::to_string(&bad_graph).unwrap();
        let req = Request::builder()
            .method("PUT")
            .uri(format!("/api/workflows/{id}/graph"))
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert!(resp.status().is_client_error() || resp.status().is_server_error());
        assert_ne!(resp.status(), StatusCode::NOT_FOUND);

        let content_type = resp
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string();
        assert!(content_type.starts_with("application/json"));

        let after = std::fs::read_to_string(tmp.path().join("hello.dot")).unwrap();
        assert_eq!(before, after);
    }

    #[tokio::test]
    async fn create_graph_writes_new_file_and_returns_id() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let new_graph = EditorGraph {
            name: None,
            nodes: vec![
                EditorNode {
                    id: "a".to_string(),
                    node_type: "Start".to_string(),
                    label: Some("A".to_string()),
                    attrs: HashMap::new(),
                },
                EditorNode {
                    id: "b".to_string(),
                    node_type: "Exit".to_string(),
                    label: Some("B".to_string()),
                    attrs: HashMap::new(),
                },
            ],
            edges: vec![EditorEdge {
                from: "a".to_string(),
                to: "b".to_string(),
                label: None,
                condition: None,
                priority: None,
                loop_restart: false,
                attrs: HashMap::new(),
            }],
            graph_attrs: HashMap::new(),
        };
        let req_body = CreateGraphRequest {
            name: "brand-new".to_string(),
            target_dir: tmp.path().display().to_string(),
            graph: new_graph,
        };
        let body = serde_json::to_string(&serde_json::json!({
            "name": req_body.name,
            "target_dir": req_body.target_dir,
            "graph": req_body.graph,
        }))
        .unwrap();

        let req = Request::builder()
            .method("POST")
            .uri("/api/workflows/new")
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        let created: CreateGraphResponse = body_json_response(resp).await;
        assert!(tmp.path().join("brand-new.dot").exists());
        let resolved =
            crate::workflows::resolve_workflow(&[tmp.path().display().to_string()], &created.id);
        assert!(resolved.is_some());
    }

    async fn body_json_response(resp: axum::response::Response) -> CreateGraphResponse {
        let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn create_graph_rejects_target_dir_not_in_workflow_dirs() {
        let tmp = tempfile::tempdir().unwrap();
        let app = router().with_state(state_with_workflow_dir(tmp.path()));

        let body = serde_json::json!({
            "name": "nope",
            "target_dir": "/not/a/configured/dir",
            "graph": EditorGraph { name: None, nodes: vec![], edges: vec![], graph_attrs: HashMap::new() },
        })
        .to_string();
        let req = Request::builder()
            .method("POST")
            .uri("/api/workflows/new")
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn node_type_str_round_trips_every_variant() {
        let all = [
            NodeType::Start,
            NodeType::Exit,
            NodeType::Codergen,
            NodeType::Conditional,
            NodeType::Tool,
            NodeType::Interviewer,
            NodeType::Parallel,
            NodeType::FanIn,
            NodeType::Manager,
            NodeType::SubPipeline,
            NodeType::Generic,
        ];
        for nt in all {
            let s = node_type_to_str(&nt);
            assert_eq!(node_type_from_str(s), Some(nt));
        }
    }
}
