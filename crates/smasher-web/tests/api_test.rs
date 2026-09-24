// ABOUTME: Integration tests for the JSON API using real HTTP against an ephemeral server.
// ABOUTME: Tests submit pipelines, poll status, and verify responses use proper JSON contracts.

use reqwest::Client;
use serde_json::json;
use std::time::Duration;
use tokio::task;

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

/// Simple workflow for testing: just start and exit (no LLM calls needed)
fn simple_workflow_dot() -> String {
    r#"
digraph SimpleTest {
  graph [
    goal="Simple test workflow",
    rankdir=LR
  ];

  Start [shape=Mdiamond, label="Start"];
  Exit [shape=Msquare, label="Exit"];

  Start -> Exit;
}
"#
    .to_string()
}

#[tokio::test]
async fn test_api_submit_and_poll_completion() {
    let (base_url, _server) = start_test_server().await;
    let client = Client::new();

    // Submit a simple pipeline
    let submit_response = client
        .post(format!("{}/api/runs", base_url))
        .json(&json!({
            "dot_source": simple_workflow_dot(),
            "variables": {},
            "model": None::<String>
        }))
        .send()
        .await
        .expect("failed to submit pipeline");

    assert_eq!(submit_response.status(), 200, "submit should return 200 OK");

    let submit_body: serde_json::Value = submit_response
        .json()
        .await
        .expect("failed to parse submit response");

    // Extract run id from response
    let run_id = submit_body["run_id"]
        .as_str()
        .expect("response should contain run_id field");

    // Poll status until completion (with timeout)
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(30);
    let mut final_status = None;

    while start.elapsed() < timeout {
        let status_response = client
            .get(format!("{}/api/runs/{}", base_url, run_id))
            .send()
            .await
            .expect("failed to get status");

        let status_body: serde_json::Value = status_response
            .json()
            .await
            .expect("failed to parse status response");

        let status = status_body["status"]
            .as_str()
            .expect("response should contain status field");

        let status_lower = status.to_lowercase();
        if status_lower == "completed" || status_lower == "failed" || status_lower == "aborted" {
            final_status = Some(status_lower.clone());
            break;
        }

        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    let final_status = final_status.expect("pipeline did not reach terminal state within timeout");
    assert!(
        final_status == "completed" || final_status == "failed" || final_status == "aborted",
        "pipeline should reach a terminal state, got: {}",
        final_status
    );
}
