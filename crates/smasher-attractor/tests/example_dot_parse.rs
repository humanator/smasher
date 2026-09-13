// ABOUTME: Integration tests verifying that all example DOT files parse and resolve correctly.
// ABOUTME: Catches syntax errors in example pipelines and validates structural expectations.

use std::path::Path;

use smasher_attractor::dot::parser;
use smasher_attractor::graph::{self, NodeType};

/// Helper: read, parse, and resolve a DOT file from the examples directory.
fn load_example(filename: &str) -> graph::Graph {
    let workspace_root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    let path = workspace_root.join("examples").join(filename);
    let source = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", path.display()));
    let dot = parser::parse(&source)
        .unwrap_or_else(|e| panic!("failed to parse {}: {e}", path.display()));
    graph::resolve(&dot).unwrap_or_else(|e| panic!("failed to resolve {}: {e}", path.display()))
}

// ============================================================================
// consensus_task.dot
// ============================================================================

#[test]
fn consensus_task_parses_and_resolves() {
    let g = load_example("consensus_task.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn consensus_task_has_start_and_exit() {
    let g = load_example("consensus_task.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn consensus_task_has_review_consensus_node() {
    let g = load_example("consensus_task.dot");
    let node = g.node("ReviewConsensus").expect("missing ReviewConsensus");
    assert_eq!(node.node_type, NodeType::Codergen);
}

#[test]
fn consensus_task_has_loop_restart() {
    let g = load_example("consensus_task.dot");
    let loop_edges: Vec<_> = g.edges.iter().filter(|e| e.loop_restart).collect();
    assert!(
        !loop_edges.is_empty(),
        "consensus_task should have at least one loop_restart edge"
    );
}

#[test]
fn consensus_task_has_conditional_edges() {
    let g = load_example("consensus_task.dot");
    let cond_edges: Vec<_> = g.edges.iter().filter(|e| e.condition.is_some()).collect();
    assert!(
        cond_edges.len() >= 2,
        "consensus_task should have conditional edges"
    );
}

// ============================================================================
// consensus_task_parity.dot
// ============================================================================

#[test]
fn consensus_task_parity_parses_and_resolves() {
    let g = load_example("consensus_task_parity.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn consensus_task_parity_has_start_and_exit() {
    let g = load_example("consensus_task_parity.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn consensus_task_parity_has_parallel_fanout() {
    let g = load_example("consensus_task_parity.dot");
    let parallel_nodes: Vec<_> = g
        .nodes
        .iter()
        .filter(|n| n.node_type == NodeType::Parallel)
        .collect();
    assert!(
        !parallel_nodes.is_empty(),
        "parity variant should have Parallel (component) nodes"
    );
}

#[test]
fn consensus_task_parity_has_fanin_joins() {
    let g = load_example("consensus_task_parity.dot");
    let fanin_nodes: Vec<_> = g
        .nodes
        .iter()
        .filter(|n| n.node_type == NodeType::FanIn)
        .collect();
    assert!(
        !fanin_nodes.is_empty(),
        "parity variant should have FanIn (tripleoctagon) nodes"
    );
}

// ============================================================================
// megaplan.dot
// ============================================================================

#[test]
fn megaplan_parses_and_resolves() {
    let g = load_example("megaplan.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn megaplan_has_start_and_exit() {
    let g = load_example("megaplan.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn megaplan_has_interview_gate() {
    let g = load_example("megaplan.dot");
    let gate = g.node("InterviewGate").expect("missing InterviewGate");
    assert_eq!(gate.node_type, NodeType::Interviewer);
}

#[test]
fn megaplan_has_parallel_critique_fanout() {
    let g = load_example("megaplan.dot");
    let parallel_nodes: Vec<_> = g
        .nodes
        .iter()
        .filter(|n| n.node_type == NodeType::Parallel)
        .collect();
    assert!(
        parallel_nodes.len() >= 3,
        "megaplan should have multiple parallel fan-out nodes, got {}",
        parallel_nodes.len()
    );
}

#[test]
fn megaplan_is_largest_example() {
    let g = load_example("megaplan.dot");
    assert!(
        g.nodes.len() >= 40,
        "megaplan should have 40+ nodes, got {}",
        g.nodes.len()
    );
}

// ============================================================================
// megaplan_quality.dot
// ============================================================================

#[test]
fn megaplan_quality_parses_and_resolves() {
    let g = load_example("megaplan_quality.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn megaplan_quality_has_start_and_exit() {
    let g = load_example("megaplan_quality.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn megaplan_quality_has_goal_gate() {
    let g = load_example("megaplan_quality.dot");
    let gate = g
        .node("FinalQualityGate")
        .expect("missing FinalQualityGate");
    assert!(
        gate.attrs.contains_key("goal_gate"),
        "FinalQualityGate should have goal_gate attribute"
    );
}

// ============================================================================
// semport.dot
// ============================================================================

#[test]
fn semport_parses_and_resolves() {
    let g = load_example("semport.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn semport_has_start_and_exit() {
    let g = load_example("semport.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn semport_has_two_loop_restarts() {
    let g = load_example("semport.dot");
    let loop_edges: Vec<_> = g.edges.iter().filter(|e| e.loop_restart).collect();
    assert_eq!(
        loop_edges.len(),
        2,
        "semport has two loop phases (port loop + fix loop)"
    );
}

#[test]
fn semport_has_tool_nodes() {
    let g = load_example("semport.dot");
    let tool_nodes: Vec<_> = g
        .nodes
        .iter()
        .filter(|n| n.node_type == NodeType::Tool)
        .collect();
    assert!(
        tool_nodes.len() >= 5,
        "semport should have several tool (parallelogram) nodes, got {}",
        tool_nodes.len()
    );
}

// ============================================================================
// semport_thematic.dot
// ============================================================================

#[test]
fn semport_thematic_parses_and_resolves() {
    let g = load_example("semport_thematic.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn semport_thematic_has_start_and_exit() {
    let g = load_example("semport_thematic.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn semport_thematic_has_parallel_and_fanin() {
    let g = load_example("semport_thematic.dot");
    let has_parallel = g.nodes.iter().any(|n| n.node_type == NodeType::Parallel);
    let has_fanin = g.nodes.iter().any(|n| n.node_type == NodeType::FanIn);
    assert!(has_parallel, "should have Parallel nodes");
    assert!(has_fanin, "should have FanIn nodes");
}

// ============================================================================
// sprint_exec.dot
// ============================================================================

#[test]
fn sprint_exec_parses_and_resolves() {
    let g = load_example("sprint_exec.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn sprint_exec_has_start_and_exit() {
    let g = load_example("sprint_exec.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn sprint_exec_has_review_analysis_with_retry() {
    let g = load_example("sprint_exec.dot");
    let node = g.node("ReviewAnalysis").expect("missing ReviewAnalysis");
    assert_eq!(node.node_type, NodeType::Codergen);
    assert!(
        node.attrs.contains_key("goal_gate"),
        "ReviewAnalysis should be a goal_gate"
    );
}

#[test]
fn sprint_exec_has_multi_model_reviews() {
    let g = load_example("sprint_exec.dot");
    assert!(g.node("ReviewClaude").is_some());
    assert!(g.node("ReviewCodex").is_some());
    assert!(g.node("ReviewGemini").is_some());
}

#[test]
fn sprint_exec_has_cross_model_critiques() {
    let g = load_example("sprint_exec.dot");
    assert!(g.node("CritiqueClaudeOnCodex").is_some());
    assert!(g.node("CritiqueCodexOnClaude").is_some());
    assert!(g.node("CritiqueGeminiOnClaude").is_some());
}

// ============================================================================
// product_design_factory.dot
// ============================================================================

#[test]
fn product_design_factory_parses_and_resolves() {
    let g = load_example("product_design_factory.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn product_design_factory_has_start_and_exit() {
    let g = load_example("product_design_factory.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn product_design_factory_has_two_gallery_gates() {
    let g = load_example("product_design_factory.dot");
    for id in ["GalleryGate1", "GalleryGate2"] {
        let gate = g.node(id).unwrap_or_else(|| panic!("missing {id}"));
        assert_eq!(
            gate.node_type,
            NodeType::Interviewer,
            "{id} should resolve to an Interviewer node (hexagon), not Conditional (diamond)"
        );
        assert!(
            gate.is_gallery_gate(),
            "{id} should carry gallery=\"true\" so the human-gate path treats it as a gallery decision"
        );
    }
}

#[test]
fn product_design_factory_has_critique_parallel_fanout_and_join() {
    let g = load_example("product_design_factory.dot");
    let parallel = g
        .node("CritiqueParallel")
        .expect("missing CritiqueParallel");
    assert_eq!(parallel.node_type, NodeType::Parallel);
    let join = g.node("CritiqueJoin").expect("missing CritiqueJoin");
    assert_eq!(join.node_type, NodeType::FanIn);
}

#[test]
fn product_design_factory_has_native_tool_dispatch_for_every_pipeline_tool() {
    let g = load_example("product_design_factory.dot");
    for (id, tool) in [
        ("RenderDiscoverA", "render_capture"),
        ("RenderDefine", "render_capture"),
        ("SystemLint", "system_lint"),
        ("TaskCritic", "task_critic"),
        ("Synthesis", "synthesis"),
    ] {
        let node = g.node(id).unwrap_or_else(|| panic!("missing {id}"));
        assert_eq!(node.node_type, NodeType::Tool);
        match node.attrs.get("tool") {
            Some(smasher_attractor::graph::NodeAttrValue::String(t)) => assert_eq!(t, tool),
            other => panic!("{id} tool attr should be {tool:?}, got {other:?}"),
        }
    }
}

#[test]
fn product_design_factory_gates_route_on_the_edge_matching_the_decision() {
    let g = load_example("product_design_factory.dot");

    let gate1_edges: Vec<_> = g
        .edges_from("GalleryGate1")
        .into_iter()
        .filter_map(|e| e.label.as_deref())
        .collect();
    assert_eq!(gate1_edges, vec!["proceed"]);

    let mut gate2_edges: Vec<_> = g
        .edges_from("GalleryGate2")
        .into_iter()
        .filter_map(|e| e.label.as_deref())
        .collect();
    gate2_edges.sort();
    assert_eq!(gate2_edges, vec!["iterate", "proceed"]);
}

/// Engine-level proof (no LLM, no browser, no HTTP) that a real gallery
/// decision against this exact fixture graph — not a synthetic one — routes
/// through the same `HandlerRegistry` -> `InterviewerHandler` -> `select_edge`
/// path production code uses, landing on the edge the decision named rather
/// than falling through to an alphabetical tiebreak.
#[tokio::test]
async fn product_design_factory_gate2_answers_route_to_the_named_edge() {
    use smasher_attractor::edge::select_edge;
    use smasher_attractor::handler::HandlerRegistry;
    use smasher_attractor::interviewer::{InterviewerHandler, QueueInterviewer};
    use smasher_attractor::state::Context;
    use std::sync::Arc;

    let g = load_example("product_design_factory.dot");
    let gate = g.node("GalleryGate2").expect("missing GalleryGate2");

    for decision in ["iterate", "proceed"] {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response(format!(r#"{{"selected":["define"],"decision":"{decision}"}}"#));

        let mut registry = HandlerRegistry::new();
        registry.register(Arc::new(InterviewerHandler::new(queue)));

        let ctx = Context::new();
        let outcome = registry.execute(gate, &ctx).await.unwrap();
        assert_eq!(outcome.preferred_label(), Some(decision));

        let edge = select_edge(&g, "GalleryGate2", &ctx, Some(&outcome))
            .unwrap()
            .expect("an edge should be selected");
        assert_eq!(
            edge.label.as_deref(),
            Some(decision),
            "a {decision:?} decision must route down the {decision:?} edge, not fall through to a tiebreak"
        );
    }
}

/// Engine-level proof (no LLM, no browser, no HTTP) that `CritiqueParallel`'s
/// real edges — `-> SystemLint`, `-> TaskCritic` — are both actually dispatched
/// through a real `Engine`, against this exact fixture graph rather than the
/// synthetic `parallel_fanin_graph()` `engine_integration.rs`'s own Task 3
/// tests use. Resumes from a checkpoint planted right at `CritiqueParallel`
/// (Discover/Implement already "visited") so the test doesn't need real
/// `render_capture`/codergen handlers for the nodes upstream of it.
#[tokio::test]
async fn product_design_factory_critique_parallel_dispatches_both_branches() {
    use async_trait::async_trait;
    use smasher_attractor::engine::Engine;
    use smasher_attractor::graph::{GraphNode, NodeType};
    use smasher_attractor::handler::{Handler, HandlerError, HandlerRegistry};
    use smasher_attractor::interviewer::{InterviewerHandler, QueueInterviewer};
    use smasher_attractor::state::{Checkpoint, Context, Outcome};
    use std::sync::{Arc, Mutex};

    /// Records every node id it's invoked for; succeeds unconditionally.
    /// Stands in for every non-`Interviewer` handler this fixture would
    /// otherwise need (render_capture, system_lint, task_critic, synthesis,
    /// codergen, the tool-command a11y stub) — none of which are under test
    /// here, only whether the engine actually dispatches both `CritiqueParallel`
    /// branches.
    struct RecordingHandler {
        calls: Arc<Mutex<Vec<String>>>,
    }

    #[async_trait]
    impl Handler for RecordingHandler {
        fn name(&self) -> &str {
            "recording"
        }

        async fn execute(&self, node: &GraphNode, _context: &Context) -> Result<Outcome, HandlerError> {
            self.calls.lock().unwrap().push(node.id.clone());
            Ok(Outcome::success())
        }

        fn handles(&self, node_type: &NodeType) -> bool {
            !matches!(node_type, NodeType::Interviewer)
        }
    }

    let g = load_example("product_design_factory.dot");

    let calls = Arc::new(Mutex::new(Vec::new()));
    let queue = Arc::new(QueueInterviewer::new());
    queue.push_response(r#"{"selected":["define"],"decision":"proceed"}"#);

    let mut registry = HandlerRegistry::new();
    registry.register(Arc::new(RecordingHandler {
        calls: calls.clone(),
    }));
    registry.register(Arc::new(InterviewerHandler::new(queue)));

    // Plant a checkpoint as if Discover and Implement already ran, resuming
    // right at CritiqueParallel — the real Parallel node this fixture defines.
    let cp_ctx = Context::new();
    let mut checkpoint = Checkpoint::new("product_design_factory", "CritiqueParallel", &cp_ctx);
    for id in [
        "Start",
        "IAOptions",
        "RenderDiscoverA",
        "RenderDiscoverB",
        "RenderDiscoverC",
        "RenderDiscoverD",
        "GalleryGate1",
        "Implement",
        "RenderDefine",
    ] {
        checkpoint.mark_visited(id);
        checkpoint.add_outcome(id, Outcome::success());
    }

    let engine = Engine::new(g, registry);
    let result = engine
        .run_from_checkpoint(checkpoint, Context::new())
        .await
        .expect("pipeline should reach Exit via the proceed edge");

    let recorded = calls.lock().unwrap().clone();
    let system_lint_calls = recorded.iter().filter(|id| *id == "SystemLint").count();
    let task_critic_calls = recorded.iter().filter(|id| *id == "TaskCritic").count();
    // Exactly once each, not merely "at least once": SPEC-task-critic-synthesis.md's
    // Success Criteria requires "exactly one real LLM call made" per tool, and this is
    // the concrete guard that the concurrent Parallel dispatch doesn't double-invoke a
    // branch (e.g. via both the top-of-loop handler dispatch and the special-cased
    // branch dispatch) or drop it.
    assert_eq!(
        system_lint_calls, 1,
        "expected SystemLint dispatched exactly once, got {system_lint_calls} in {recorded:?}"
    );
    assert_eq!(
        task_critic_calls, 1,
        "expected TaskCritic dispatched exactly once, got {task_critic_calls} in {recorded:?}"
    );

    assert!(matches!(
        result.node_outcomes.get("SystemLint"),
        Some(Outcome::Success { .. })
    ));
    assert!(matches!(
        result.node_outcomes.get("TaskCritic"),
        Some(Outcome::Success { .. })
    ));
    assert!(result.visited_nodes.contains(&"CritiqueParallel".to_string()));
    assert!(result.visited_nodes.contains(&"CritiqueJoin".to_string()));
}

// ============================================================================
// vulnerability_analyzer.dot
// ============================================================================

#[test]
fn vulnerability_analyzer_parses_and_resolves() {
    let g = load_example("vulnerability_analyzer.dot");
    assert!(!g.nodes.is_empty());
    assert!(!g.edges.is_empty());
}

#[test]
fn vulnerability_analyzer_has_start_and_exit() {
    let g = load_example("vulnerability_analyzer.dot");
    assert_eq!(g.start_nodes().len(), 1);
    assert!(!g.exit_nodes().is_empty());
}

#[test]
fn vulnerability_analyzer_is_tool_only() {
    let g = load_example("vulnerability_analyzer.dot");
    let non_terminal: Vec<_> = g
        .nodes
        .iter()
        .filter(|n| n.node_type != NodeType::Start && n.node_type != NodeType::Exit)
        .collect();
    assert!(
        non_terminal.iter().all(|n| n.node_type == NodeType::Tool),
        "vulnerability_analyzer should be a pure tool pipeline (no LLM nodes)"
    );
}

#[test]
fn vulnerability_analyzer_has_conditional_findings_check() {
    let g = load_example("vulnerability_analyzer.dot");
    let cond_edges: Vec<_> = g
        .edges
        .iter()
        .filter(|e| e.condition.is_some() && e.from == "EvaluateFindings")
        .collect();
    assert_eq!(
        cond_edges.len(),
        2,
        "EvaluateFindings should branch on findings vs no_findings"
    );
}
