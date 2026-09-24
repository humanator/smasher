// ABOUTME: Integration tests for human-gate round trip and answer endpoint via real HTTP.
// ABOUTME: Tests JSON answer contract, pause/resume flow, and SSE JSON event shape.

use futures::StreamExt;
use reqwest::Client;
use serde_json::{Value, json};
use std::time::Duration;
use tokio::task;

/// Connects to the run's SSE stream and collects `(event_name, json_data)`
/// pairs until `pipeline_completed`/`pipeline_aborted` or the stream ends.
///
/// There is no event replay (see `sse.rs`/`api.rs::events_stream` — a live
/// `tokio::broadcast` subscription only, by design per the plan's "Known
/// accepted regression" section), so this only reliably captures events
/// emitted *after* the connection is established. Callers should connect
/// before triggering the events they want to observe.
async fn collect_sse_events(client: &Client, url: String) -> Vec<(String, Value)> {
    let response = client
        .get(&url)
        .send()
        .await
        .expect("failed to connect to SSE stream");
    let mut stream = response.bytes_stream();
    let mut buf = String::new();
    let mut current_event: Option<String> = None;
    let mut events = Vec::new();

    while let Some(chunk) = stream.next().await {
        let Ok(chunk) = chunk else { break };
        buf.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline) = buf.find('\n') {
            let line = buf[..newline].trim_end_matches('\r').to_string();
            buf.drain(..=newline);

            if let Some(name) = line.strip_prefix("event: ") {
                current_event = Some(name.to_string());
            } else if let Some(data) = line.strip_prefix("data: ")
                && let Some(name) = current_event.take()
                && let Ok(value) = serde_json::from_str::<Value>(data)
            {
                let terminal = name == "pipeline_completed" || name == "pipeline_aborted";
                events.push((name, value));
                if terminal {
                    return events;
                }
            }
        }
    }

    events
}

/// Helper to find an available port and start a test server
async fn start_test_server() -> (String, task::JoinHandle<()>) {
    // Bind to port 0 to get an ephemeral port using async tokio
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("failed to bind to port 0");
    let addr = listener.local_addr().expect("failed to get local address");
    let base_url = format!("http://{}", addr);

    // Build the app router and start serving
    let app = {
        let client = smasher_llm::client::Client::from_env();
        let state = smasher_web::state::AppState::new(
            client,
            "test-model".into(),
            None,
            "/tmp".into(),
            vec![],
        );
        smasher_web::server::build_router(state)
    };

    let server_task = task::spawn(async move {
        axum::serve(listener, app).await.expect("server error");
    });

    (base_url, server_task)
}

/// Simple workflow with a real human-gate node for testing.
///
/// `shape=hexagon` is what actually resolves to `NodeType::Interviewer`
/// (see `graph/mod.rs`'s shape table) — `shape=diamond` resolves to
/// `NodeType::Conditional` instead and never pauses for input, which is
/// why the previous version of this test never exercised a real gate.
fn human_gate_workflow_dot() -> String {
    r#"
digraph HumanGateTest {
  graph [
    goal="Test human-gate via API",
    rankdir=LR
  ];

  Start [shape=Mdiamond, label="Start"];

  Gate [
    shape=hexagon,
    label="Approve?"
  ];

  Exit [shape=Msquare, label="Exit"];

  Start -> Gate;
  Gate -> Exit [label="[Y] Yes"];
  Gate -> Exit [label="[N] No"];
}
"#
    .to_string()
}

#[tokio::test]
async fn test_human_gate_answer_round_trip() {
    let (base_url, _server) = start_test_server().await;
    let client = Client::new();

    // Submit a pipeline with a human-gate.
    let submit_response = client
        .post(format!("{}/api/runs", base_url))
        .json(&json!({
            "dot_source": human_gate_workflow_dot(),
            "variables": {},
            "model": None::<String>
        }))
        .send()
        .await
        .expect("failed to submit pipeline");

    assert_eq!(submit_response.status(), 200);

    let submit_body: Value = submit_response
        .json()
        .await
        .expect("failed to parse submit response");

    let run_id = submit_body["run_id"]
        .as_str()
        .expect("response should contain run_id field")
        .to_string();

    // Connect to the SSE stream now, before triggering the answer, so the
    // node_completed(Gate)/edge_traversed/node_started(Exit)/pipeline_completed
    // tail is guaranteed to be captured (see collect_sse_events's doc comment
    // for why the *earlier* events aren't reliably catchable here).
    let sse_client = client.clone();
    let sse_url = format!("{}/api/runs/{}/events", base_url, run_id);
    let sse_task = task::spawn(async move { collect_sse_events(&sse_client, sse_url).await });

    // Poll /api/runs/{id}/questions until the gate has actually issued a
    // question. RunStatus has no Paused/Waiting variant (see
    // smasher-attractor's state.rs) — status stays "Running" the whole
    // time the pipeline is blocked on a human-gate answer, so the
    // question list is the only reliable pause signal.
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(10);
    let mut question_id = None;

    while start.elapsed() < timeout {
        let questions_response = client
            .get(format!("{}/api/runs/{}/questions", base_url, run_id))
            .send()
            .await
            .expect("failed to list questions");

        let questions_body: Value = questions_response
            .json()
            .await
            .expect("failed to parse questions response");

        if let Some(id) = questions_body["questions"]
            .get(0)
            .and_then(|q| q["id"].as_str())
        {
            question_id = Some(id.to_string());
            break;
        }

        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    let question_id = question_id.expect("gate should have issued a pending question");

    // Answer with the real JSON contract: `{"answer": "..."}`, not
    // `{"response": "..."}` — the handler extracts `AnswerQuestionRequest`,
    // whose only field is `answer` (see smasher-attractor's http_interviewer.rs).
    let answer_response = client
        .post(format!(
            "{}/api/runs/{}/questions/{}/answer",
            base_url, run_id, question_id
        ))
        .json(&json!({ "answer": "[Y] Yes" }))
        .send()
        .await
        .expect("failed to post answer");

    assert_eq!(
        answer_response.status(),
        200,
        "answering the real pending question should succeed"
    );

    let answer_body: Value = answer_response
        .json()
        .await
        .expect("failed to parse answer response");
    assert_eq!(answer_body["success"], true);

    // The answer should unblock the pipeline and let it run to completion.
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(10);
    let mut final_status = None;

    while start.elapsed() < timeout {
        let status_response = client
            .get(format!("{}/api/runs/{}", base_url, run_id))
            .send()
            .await
            .expect("failed to get status");

        let status_body: Value = status_response
            .json()
            .await
            .expect("failed to parse status");

        let status = status_body["status"]
            .as_str()
            .expect("should have status")
            .to_lowercase();

        if status == "completed" || status == "failed" || status == "aborted" {
            final_status = Some(status);
            break;
        }

        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    assert_eq!(
        final_status.as_deref(),
        Some("completed"),
        "pipeline should complete after the human-gate is answered"
    );

    // Assert on the JSON SSE payloads captured across the answer -> completion tail.
    let events = tokio::time::timeout(Duration::from_secs(5), sse_task)
        .await
        .expect("SSE collection task timed out")
        .expect("SSE collection task panicked");

    let event_names: Vec<&str> = events.iter().map(|(name, _)| name.as_str()).collect();
    assert!(
        event_names.contains(&"node_completed"),
        "expected a node_completed event in {event_names:?}"
    );
    assert!(
        event_names.contains(&"pipeline_completed"),
        "expected the stream to end in pipeline_completed, got {event_names:?}"
    );

    let gate_completed = events
        .iter()
        .find(|(name, data)| name == "node_completed" && data["node_id"] == "Gate")
        .expect("Gate's node_completed event should be present with JSON, not HTML, payload");
    assert_eq!(gate_completed.1["outcome"]["data"]["response"], "[Y] Yes");

    let pipeline_completed = events
        .last()
        .expect("at least one event should have been captured");
    assert_eq!(pipeline_completed.0, "pipeline_completed");
    assert_eq!(pipeline_completed.1["kind"], "pipeline_completed");
}
