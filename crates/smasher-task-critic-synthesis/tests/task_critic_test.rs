// ABOUTME: Integration tests for run_task_critic against a real fixture screenshot.
// ABOUTME: The live-LLM-calling test is #[ignore]'d and requires a real provider API key.

use std::path::Path;

use serde_json::json;
use smasher_llm::client::Client;
use smasher_task_critic_synthesis::report::{CriticError, artifact_dir};
use smasher_task_critic_synthesis::task_critic::run_task_critic;

fn fixture_screenshot_bytes() -> Vec<u8> {
    std::fs::read(Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/candidate/screenshot.png"))
        .expect("fixture screenshot.png must exist")
}

fn place_fixture_screenshot(run_id: &str, candidate_id: &str) {
    let dir = artifact_dir(run_id, candidate_id);
    std::fs::create_dir_all(&dir).expect("create artifact dir");
    std::fs::write(dir.join("screenshot.png"), fixture_screenshot_bytes())
        .expect("write fixture screenshot");
}

#[tokio::test]
async fn missing_screenshot_fails_before_any_network_call() {
    let client = Client::new(); // no providers registered
    let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
    let args = json!({
        "run_id": run_id,
        "candidate_id": "no-such-candidate",
        "persona": "new user",
        "task": "find settings",
    });

    let err = run_task_critic(&client, "claude-sonnet-4-20250514", &args)
        .await
        .expect_err("missing screenshot.png must fail");

    assert!(matches!(err, CriticError::MissingArtifact { .. }));
}

#[tokio::test]
#[ignore = "makes a real, billed call to a vision-capable model; requires a provider API key"]
async fn live_call_against_fixture_screenshot_produces_legible_report() {
    let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
    let candidate_id = "critic-fixture-candidate";
    place_fixture_screenshot(&run_id, candidate_id);

    let client = Client::from_env();
    let args = json!({
        "run_id": run_id,
        "candidate_id": candidate_id,
        "persona": "a new user unfamiliar with the product",
        "task": "find the primary call-to-action button",
    });

    let report = run_task_critic(&client, "claude-sonnet-4-20250514", &args)
        .await
        .expect("live task_critic call should succeed with a real API key");

    assert_eq!(report.persona, "a new user unfamiliar with the product");
    assert_eq!(report.task, "find the primary call-to-action button");
    // success/friction/notes come from the live model; only shape is asserted here.

    std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
}
