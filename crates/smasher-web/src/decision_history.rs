// ABOUTME: Gate decision history: extracts every gallery-gate decision recorded in a
// ABOUTME: run's event log into a display-ready, chronological record for the dashboard.

use chrono::{DateTime, Utc};

use smasher_attractor::events::PipelineEvent;
use smasher_attractor::graph::Graph;

/// One recorded gallery-gate decision: which candidates were selected, which
/// outgoing edge the human picked, and when.
#[derive(Debug, Clone, PartialEq)]
pub struct GalleryDecision {
    pub node_id: String,
    pub selected: Vec<String>,
    pub decision: String,
    pub timestamp: DateTime<Utc>,
}

/// Extracts every gallery-gate decision from a run's event log, oldest first —
/// this is a rationale record read like a narrative, not a live feed. A gate
/// node can appear more than once if a pipeline loop revisits it.
pub fn gallery_decisions(events: &[PipelineEvent], graph: &Graph) -> Vec<GalleryDecision> {
    events
        .iter()
        .filter_map(|event| {
            let PipelineEvent::NodeCompleted {
                node_id,
                outcome,
                timestamp,
                ..
            } = event
            else {
                return None;
            };
            if !graph.node(node_id).is_some_and(|n| n.is_gallery_gate()) {
                return None;
            }
            let data = outcome.data()?;
            let decision = data.get("decision")?.as_str()?.to_string();
            let selected = data
                .get("selected")?
                .as_array()?
                .iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect();
            Some(GalleryDecision {
                node_id: node_id.clone(),
                selected,
                decision,
                timestamp: *timestamp,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use smasher_attractor::dot::parser;
    use smasher_attractor::graph;
    use smasher_attractor::state::Outcome;
    use serde_json::json;

    const GALLERY_DOT: &str = r#"digraph {
        Start [shape=Mdiamond];
        Gate1 [shape=hexagon, label="Pick", gallery="true"];
        NextA [shape=box];
        NextB [shape=box];
        Start -> Gate1;
        Gate1 -> NextA [label="proceed"];
        Gate1 -> NextB [label="iterate"];
    }"#;

    fn gallery_graph() -> Graph {
        let parsed = parser::parse(GALLERY_DOT).unwrap();
        graph::resolve(&parsed).unwrap()
    }

    fn completed(node_id: &str, outcome: Outcome, timestamp: DateTime<Utc>) -> PipelineEvent {
        PipelineEvent::NodeCompleted {
            node_id: node_id.to_string(),
            outcome,
            duration_ms: 0,
            timestamp,
        }
    }

    #[test]
    fn extracts_a_single_gate_decision() {
        let graph = gallery_graph();
        let ts = Utc::now();
        let events = vec![completed(
            "Gate1",
            Outcome::success_with(json!({"selected": ["candidate-a"], "decision": "proceed"}))
                .with_preferred_label("proceed"),
            ts,
        )];

        let decisions = gallery_decisions(&events, &graph);

        assert_eq!(decisions.len(), 1);
        assert_eq!(decisions[0].node_id, "Gate1");
        assert_eq!(decisions[0].selected, vec!["candidate-a".to_string()]);
        assert_eq!(decisions[0].decision, "proceed");
        assert_eq!(decisions[0].timestamp, ts);
    }

    #[test]
    fn preserves_chronological_order_across_revisits() {
        let graph = gallery_graph();
        let first = Utc::now();
        let second = first + chrono::Duration::seconds(5);
        let events = vec![
            completed(
                "Gate1",
                Outcome::success_with(json!({"selected": ["a"], "decision": "iterate"})),
                first,
            ),
            completed(
                "Gate1",
                Outcome::success_with(json!({"selected": ["b"], "decision": "proceed"})),
                second,
            ),
        ];

        let decisions = gallery_decisions(&events, &graph);

        assert_eq!(decisions.len(), 2);
        assert_eq!(decisions[0].decision, "iterate");
        assert_eq!(decisions[1].decision, "proceed");
    }

    #[test]
    fn ignores_non_gate_node_completions() {
        let graph = gallery_graph();
        let events = vec![completed(
            "Start",
            Outcome::success_with(json!({"response": "yes"})),
            Utc::now(),
        )];

        assert!(gallery_decisions(&events, &graph).is_empty());
    }

    #[test]
    fn ignores_plain_human_gate_answers_that_look_structured() {
        // A gate node with no `gallery="true"` attr must never be reinterpreted,
        // even if its outcome data happens to carry selected/decision keys.
        let dot = r#"digraph {
            Start [shape=Mdiamond];
            Gate1 [shape=hexagon, label="Approve?"];
            Start -> Gate1;
        }"#;
        let parsed = parser::parse(dot).unwrap();
        let graph = graph::resolve(&parsed).unwrap();
        let events = vec![completed(
            "Gate1",
            Outcome::success_with(json!({"selected": ["a"], "decision": "proceed"})),
            Utc::now(),
        )];

        assert!(gallery_decisions(&events, &graph).is_empty());
    }

    #[test]
    fn ignores_events_with_no_data() {
        let graph = gallery_graph();
        let events = vec![completed("Gate1", Outcome::success(), Utc::now())];

        assert!(gallery_decisions(&events, &graph).is_empty());
    }

    #[test]
    fn returns_empty_for_no_decisions() {
        let graph = gallery_graph();
        assert!(gallery_decisions(&[], &graph).is_empty());
    }
}
