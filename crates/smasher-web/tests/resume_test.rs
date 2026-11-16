// ABOUTME: Integration tests for POST /api/runs/{id}/resume over real HTTP, using tool-only
// ABOUTME: pipelines that fail on purpose so no LLM is ever called.

use reqwest::Client;
use serde_json::{Value, json};
use std::time::Duration;

/// A tool node that exits non-zero with no failure edge, so the run fails
/// after writing a checkpoint.
const FAILING_DOT: &str = r#"digraph FailsOnce {
    start [shape=Mdiamond];
    Check [shape=parallelogram, tool_command="exit 3"];
    done [shape=Msquare];
    start -> Check;
    Check -> done [condition="outcome=success"];
}"#;

/// Boot a server with one workflow (`fails.dot`) in a temp workflow dir.
/// Returns the base URL, the workflow id, and the temp dirs to keep alive.
async fn start_server() -> (String, String, Vec<tempfile::TempDir>) {
    let workflow_dir = tempfile::tempdir().unwrap();
    std::fs::write(workflow_dir.path().join("fails.dot"), FAILING_DOT).unwrap();
    let workflow_dirs = vec![workflow_dir.path().display().to_string()];
    let workflow_id = smasher_web::workflows::scan_workflows(&workflow_dirs)
        .into_iter()
        .next()
        .unwrap()
        .id;

    let data_dir = tempfile::tempdir().unwrap();
    let state = smasher_web::state::AppState::new(
        smasher_llm::client::Client::from_env(),
        "test-model".into(),
        None,
        data_dir.path().display().to_string(),
        workflow_dirs,
    );
    let app = smasher_web::server::build_router(state);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    (base, workflow_id, vec![workflow_dir, data_dir])
}

/// Poll a run until it leaves `Running`, returning its summary.
async fn settled(base: &str, run_id: &str) -> Value {
    let client = Client::new();
    for _ in 0..300 {
        let run: Value = client
            .get(format!("{base}/api/runs/{run_id}"))
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        if run["status"] != "Running" {
            return run;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    panic!("run {run_id} still running");
}

async fn post_for_run_id(url: String, body: Value) -> String {
    let response: Value = Client::new()
        .post(url)
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    response["run_id"]
        .as_str()
        .unwrap_or_else(|| panic!("no run_id: {response}"))
        .to_string()
}

#[tokio::test]
async fn resumed_workflow_run_keeps_its_workflow_and_is_itself_resumable() {
    let (base, workflow_id, _dirs) = start_server().await;

    let first = post_for_run_id(format!("{base}/api/workflows/{workflow_id}/run"), json!({})).await;
    let first_run = settled(&base, &first).await;
    assert_eq!(first_run["status"], "Failed", "{first_run}");
    assert_eq!(first_run["resumable"], true, "{first_run}");

    let resumed = post_for_run_id(format!("{base}/api/runs/{first}/resume"), json!({})).await;
    let resumed_run = settled(&base, &resumed).await;
    assert_eq!(resumed_run["workflow_id"], workflow_id, "{resumed_run}");
    assert_eq!(resumed_run["status"], "Failed", "{resumed_run}");
    assert_eq!(resumed_run["resumable"], true, "{resumed_run}");
}

#[tokio::test]
async fn resumed_ad_hoc_run_has_no_workflow() {
    let (base, _workflow_id, _dirs) = start_server().await;

    let first = post_for_run_id(
        format!("{base}/api/runs"),
        json!({"dot_source": FAILING_DOT, "variables": {}}),
    )
    .await;
    let first_run = settled(&base, &first).await;
    assert_eq!(first_run["status"], "Failed", "{first_run}");

    let resumed = post_for_run_id(format!("{base}/api/runs/{first}/resume"), json!({})).await;
    let resumed_run = settled(&base, &resumed).await;
    assert!(resumed_run["workflow_id"].is_null(), "{resumed_run}");
    assert_eq!(resumed_run["resumable"], true, "{resumed_run}");
}
