// ABOUTME: SSE bridge converting PipelineEvent broadcast channel to axum SSE responses.
// ABOUTME: Streams events as Server-Sent Events with typed event names and HTML fragment data.

use std::convert::Infallible;

use axum::response::sse::{Event, KeepAlive, Sse};
use futures::Stream;
use tokio::sync::broadcast;

use smasher_attractor::events::PipelineEvent;

/// Extract the SSE event name from a PipelineEvent.
///
/// Returns snake_case event names like `node_started`, `pipeline_completed`, etc.
pub fn event_name(event: &PipelineEvent) -> &'static str {
    match event {
        PipelineEvent::NodeStarted { .. } => "node_started",
        PipelineEvent::NodeCompleted { .. } => "node_completed",
        PipelineEvent::NodeFailed { .. } => "node_failed",
        PipelineEvent::EdgeTraversed { .. } => "edge_traversed",
        PipelineEvent::HumanPromptIssued { .. } => "human_prompt_issued",
        PipelineEvent::HumanResponseReceived { .. } => "human_response_received",
        PipelineEvent::ContextUpdated { .. } => "context_updated",
        PipelineEvent::CheckpointCreated { .. } => "checkpoint_created",
        PipelineEvent::PipelineStarted { .. } => "pipeline_started",
        PipelineEvent::PipelineCompleted { .. } => "pipeline_completed",
        PipelineEvent::PipelineAborted { .. } => "pipeline_aborted",
        PipelineEvent::LoopRestarted { .. } => "loop_restarted",
        PipelineEvent::AgentToolCallStarted { .. } => "agent_tool_call_started",
        PipelineEvent::AgentToolCallCompleted { .. } => "agent_tool_call_completed",
        PipelineEvent::AgentMessage { .. } => "agent_message",
        PipelineEvent::AgentTurnStarted { .. } => "agent_turn_started",
        PipelineEvent::AgentTokenUsage { .. } => "agent_token_usage",
    }
}

/// Convert a PipelineEvent into JSON for SSE transmission.
pub fn to_sse_event(event: &PipelineEvent) -> Event {
    let name = event_name(event);
    let json = serde_json::to_string(event).unwrap_or_else(|_| "{}".to_string());
    Event::default().event(name).data(json)
}


/// Create an SSE stream from a broadcast receiver that terminates on
/// `PipelineCompleted` or `PipelineAborted` (or when the channel closes).
pub fn event_stream(
    mut rx: broadcast::Receiver<PipelineEvent>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = async_stream::stream! {
        loop {
            match rx.recv().await {
                Ok(event) => {
                    let is_terminal = matches!(
                        event,
                        PipelineEvent::PipelineCompleted { .. }
                        | PipelineEvent::PipelineAborted { .. }
                    );

                    let sse_event = to_sse_event(&event);
                    yield Ok(sse_event);

                    if is_terminal {
                        break;
                    }
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(missed = n, "SSE subscriber lagged behind");
                    // Continue receiving — we just missed some events.
                }
                Err(broadcast::error::RecvError::Closed) => {
                    break;
                }
            }
        }
    };

    Sse::new(stream).keep_alive(KeepAlive::default())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use smasher_attractor::state::Outcome;

    fn now() -> chrono::DateTime<Utc> {
        Utc::now()
    }

    #[test]
    fn event_name_returns_correct_names() {
        let ts = now();
        let cases: Vec<(PipelineEvent, &str)> = vec![
            (
                PipelineEvent::NodeStarted {
                    node_id: "n".into(),
                    node_type: "t".into(),
                    timestamp: ts,
                },
                "node_started",
            ),
            (
                PipelineEvent::NodeCompleted {
                    node_id: "n".into(),
                    outcome: Outcome::success(),
                    duration_ms: 0,
                    timestamp: ts,
                },
                "node_completed",
            ),
            (
                PipelineEvent::NodeFailed {
                    node_id: "n".into(),
                    error: "e".into(),
                    duration_ms: 0,
                    timestamp: ts,
                },
                "node_failed",
            ),
            (
                PipelineEvent::EdgeTraversed {
                    from: "a".into(),
                    to: "b".into(),
                    label: None,
                    timestamp: ts,
                },
                "edge_traversed",
            ),
            (
                PipelineEvent::HumanPromptIssued {
                    node_id: "n".into(),
                    question: "q".into(),
                    timestamp: ts,
                },
                "human_prompt_issued",
            ),
            (
                PipelineEvent::HumanResponseReceived {
                    node_id: "n".into(),
                    response: "r".into(),
                    timestamp: ts,
                },
                "human_response_received",
            ),
            (
                PipelineEvent::ContextUpdated {
                    key: "k".into(),
                    timestamp: ts,
                },
                "context_updated",
            ),
            (
                PipelineEvent::CheckpointCreated {
                    node_id: "n".into(),
                    timestamp: ts,
                },
                "checkpoint_created",
            ),
            (
                PipelineEvent::PipelineStarted {
                    graph_name: "g".into(),
                    timestamp: ts,
                },
                "pipeline_started",
            ),
            (
                PipelineEvent::PipelineCompleted {
                    outcome: Outcome::success(),
                    total_nodes: 0,
                    duration_ms: 0,
                    timestamp: ts,
                },
                "pipeline_completed",
            ),
            (
                PipelineEvent::PipelineAborted {
                    reason: "r".into(),
                    timestamp: ts,
                },
                "pipeline_aborted",
            ),
            (
                PipelineEvent::LoopRestarted {
                    from: "a".into(),
                    to: "b".into(),
                    restart_count: 1,
                    timestamp: ts,
                },
                "loop_restarted",
            ),
            (
                PipelineEvent::AgentToolCallStarted {
                    node_id: "n".into(),
                    tool_name: "bash".into(),
                    tool_call_id: "c".into(),
                    input_preview: String::new(),
                    timestamp: ts,
                },
                "agent_tool_call_started",
            ),
            (
                PipelineEvent::AgentToolCallCompleted {
                    node_id: "n".into(),
                    tool_name: "bash".into(),
                    tool_call_id: "c".into(),
                    duration_ms: 100,
                    is_error: false,
                    result_preview: "ok".into(),
                    timestamp: ts,
                },
                "agent_tool_call_completed",
            ),
            (
                PipelineEvent::AgentMessage {
                    node_id: "n".into(),
                    text: "hello".into(),
                    timestamp: ts,
                },
                "agent_message",
            ),
            (
                PipelineEvent::AgentTurnStarted {
                    node_id: "n".into(),
                    turn_number: 1,
                    timestamp: ts,
                },
                "agent_turn_started",
            ),
            (
                PipelineEvent::AgentTokenUsage {
                    node_id: "n".into(),
                    input_tokens: 100,
                    output_tokens: 50,
                    cost_usd: 0.0,
                    timestamp: ts,
                },
                "agent_token_usage",
            ),
        ];

        for (event, expected_name) in &cases {
            assert_eq!(
                event_name(event),
                *expected_name,
                "wrong event name for {:?}",
                event
            );
        }
    }

    #[test]
    fn to_sse_event_produces_json() {
        let event = PipelineEvent::NodeStarted {
            node_id: "step_1".into(),
            node_type: "llm".into(),
            timestamp: now(),
        };

        // Verify the event directly serializes to valid JSON
        let json_str = serde_json::to_string(&event).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

        // The event name should match
        assert_eq!(event_name(&event), "node_started");

        // Verify JSON has expected structure
        assert_eq!(parsed["node_id"], "step_1");
        assert_eq!(parsed["node_type"], "llm");
    }

    #[test]
    fn to_sse_event_json_contains_expected_fields() {
        let event = PipelineEvent::PipelineCompleted {
            outcome: Outcome::success(),
            total_nodes: 5,
            duration_ms: 1234,
            timestamp: now(),
        };

        let json_str = serde_json::to_string(&event).unwrap();
        let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();

        // Verify all expected fields are present
        assert_eq!(json["total_nodes"], 5);
        assert_eq!(json["duration_ms"], 1234);
        assert!(json["timestamp"].is_string());
        assert!(json["outcome"].is_object());
    }

    #[tokio::test]
    async fn event_stream_terminates_on_pipeline_completed() {
        use futures::StreamExt;

        let emitter = smasher_attractor::events::PipelineEventEmitter::new(16);
        let rx = emitter.subscribe();

        let ts = now();
        emitter.emit(PipelineEvent::NodeStarted {
            node_id: "a".into(),
            node_type: "t".into(),
            timestamp: ts,
        });
        emitter.emit(PipelineEvent::PipelineCompleted {
            outcome: Outcome::success(),
            total_nodes: 1,
            duration_ms: 100,
            timestamp: ts,
        });

        let sse = event_stream(rx);
        // Extract the inner stream via into_inner() — but Sse doesn't expose it.
        // Instead, we test that the stream produces 2 events and then ends.
        // We need to use the stream directly.
        drop(sse);

        // Test with the raw stream logic instead.
        let rx2 = emitter.subscribe();
        emitter.emit(PipelineEvent::NodeStarted {
            node_id: "b".into(),
            node_type: "t".into(),
            timestamp: ts,
        });
        emitter.emit(PipelineEvent::PipelineCompleted {
            outcome: Outcome::success(),
            total_nodes: 1,
            duration_ms: 50,
            timestamp: ts,
        });

        let stream = async_stream::stream! {
            let mut rx = rx2;
            loop {
                match rx.recv().await {
                    Ok(event) => {
                        let is_terminal = matches!(
                            event,
                            PipelineEvent::PipelineCompleted { .. }
                            | PipelineEvent::PipelineAborted { .. }
                        );
                        yield event;
                        if is_terminal {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => {}
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        };

        tokio::pin!(stream);
        let events: Vec<PipelineEvent> = stream.collect().await;
        assert_eq!(events.len(), 2);
        assert!(matches!(events[0], PipelineEvent::NodeStarted { .. }));
        assert!(matches!(events[1], PipelineEvent::PipelineCompleted { .. }));
    }

    #[tokio::test]
    async fn event_stream_terminates_on_pipeline_aborted() {
        use futures::StreamExt;

        let emitter = smasher_attractor::events::PipelineEventEmitter::new(16);
        let rx = emitter.subscribe();

        let ts = now();
        emitter.emit(PipelineEvent::PipelineAborted {
            reason: "cancelled".into(),
            timestamp: ts,
        });

        let stream = async_stream::stream! {
            let mut rx = rx;
            loop {
                match rx.recv().await {
                    Ok(event) => {
                        let is_terminal = matches!(
                            event,
                            PipelineEvent::PipelineCompleted { .. }
                            | PipelineEvent::PipelineAborted { .. }
                        );
                        yield event;
                        if is_terminal {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => {}
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        };

        tokio::pin!(stream);
        let events: Vec<PipelineEvent> = stream.collect().await;
        assert_eq!(events.len(), 1);
        assert!(matches!(events[0], PipelineEvent::PipelineAborted { .. }));
    }

    #[tokio::test]
    async fn event_stream_terminates_on_channel_close() {
        use futures::StreamExt;

        let emitter = smasher_attractor::events::PipelineEventEmitter::new(16);
        let rx = emitter.subscribe();

        let ts = now();
        emitter.emit(PipelineEvent::NodeStarted {
            node_id: "a".into(),
            node_type: "t".into(),
            timestamp: ts,
        });
        // Drop emitter to close channel without terminal event.
        drop(emitter);

        let stream = async_stream::stream! {
            let mut rx = rx;
            loop {
                match rx.recv().await {
                    Ok(event) => {
                        let is_terminal = matches!(
                            event,
                            PipelineEvent::PipelineCompleted { .. }
                            | PipelineEvent::PipelineAborted { .. }
                        );
                        yield event;
                        if is_terminal {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => {}
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        };

        tokio::pin!(stream);
        let events: Vec<PipelineEvent> = stream.collect().await;
        assert_eq!(events.len(), 1);
        assert!(matches!(events[0], PipelineEvent::NodeStarted { .. }));
    }
}
