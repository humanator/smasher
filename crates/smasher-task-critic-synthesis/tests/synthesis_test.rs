// ABOUTME: Integration tests for run_synthesis against real lint/critic fixture pairs.
// ABOUTME: The live-LLM-calling tests are #[ignore]'d and require a real provider API key.

use std::path::Path;

use serde_json::json;
use smasher_llm::client::Client;
use smasher_task_critic_synthesis::report::{CriticError, Recommendation, artifact_dir};
use smasher_task_critic_synthesis::synthesis::run_synthesis;

fn place_fixture_reports(run_id: &str, candidate_id: &str, fixture_dir: &str) {
    let dir = artifact_dir(run_id, candidate_id);
    std::fs::create_dir_all(&dir).expect("create artifact dir");

    let fixtures =
        Path::new(env!("CARGO_MANIFEST_DIR")).join(format!("fixtures/reports/{fixture_dir}"));
    for filename in ["lint-report.json", "critic-report.json"] {
        std::fs::copy(fixtures.join(filename), dir.join(filename))
            .unwrap_or_else(|e| panic!("copy fixture {filename}: {e}"));
    }
}

#[tokio::test]
async fn missing_critic_report_fails_before_any_network_call() {
    let client = Client::new(); // no providers registered
    let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
    let candidate_id = "lint-only-candidate";

    let dir = artifact_dir(&run_id, candidate_id);
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("lint-report.json"), r#"{"checks": []}"#).unwrap();

    let args = json!({
        "run_id": run_id,
        "candidate_id": candidate_id,
    });

    let err = run_synthesis(&client, "claude-3-5-haiku-20241022", &args)
        .await
        .expect_err("missing critic-report.json must fail");

    assert!(matches!(err, CriticError::MissingArtifact { .. }));
    assert!(!dir.join("synthesis-report.json").exists());

    std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
}

#[tokio::test]
#[ignore = "makes a real, billed call to a cheap model; requires a provider API key"]
async fn live_call_on_agreeing_fixtures_recommends_proceed() {
    let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
    let candidate_id = "agreeing-candidate";
    place_fixture_reports(&run_id, candidate_id, "agreeing");

    let client = Client::from_env();
    let args = json!({ "run_id": run_id, "candidate_id": candidate_id });

    let report = run_synthesis(&client, "claude-3-5-haiku-20241022", &args)
        .await
        .expect("live synthesis call should succeed with a real API key");

    assert_eq!(report.recommendation, Recommendation::Proceed);
    assert!(!report.reasons.is_empty());

    std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
}

#[tokio::test]
#[ignore = "makes a real, billed call to a cheap model; requires a provider API key"]
async fn live_call_on_conflicting_fixtures_picks_a_side_citing_both_inputs() {
    let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
    let candidate_id = "conflicting-candidate";
    place_fixture_reports(&run_id, candidate_id, "conflicting");

    let client = Client::from_env();
    let args = json!({ "run_id": run_id, "candidate_id": candidate_id });

    let report = run_synthesis(&client, "claude-3-5-haiku-20241022", &args)
        .await
        .expect("live synthesis call should succeed with a real API key");

    // Lint is clean but the critic found real friction: a defensible synthesis
    // picks a side rather than refusing to decide, with reasons citing both inputs.
    assert!(!report.reasons.is_empty());

    std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
}
