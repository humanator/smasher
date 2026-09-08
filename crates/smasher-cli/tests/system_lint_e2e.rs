// ABOUTME: End-to-end proof that a system_lint Tool node dispatches natively
// ABOUTME: through `smasher run`, producing lint-report.json and making zero LLM calls.

use std::path::PathBuf;
use std::process::Command;

use wiremock::MockServer;

const RUN_ID: &str = "e2e-system-lint-fixture";
const CANDIDATE_ID: &str = "fixture";

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

fn artifact_dir(repo_root: &std::path::Path) -> PathBuf {
    repo_root
        .join("runs")
        .join(RUN_ID)
        .join("artifacts")
        .join(CANDIDATE_ID)
}

#[tokio::test]
async fn system_lint_pipeline_makes_zero_llm_calls() {
    // No mocks are registered: any request that reaches this server is a real LLM
    // call that should never have happened, and shows up in received_requests().
    let mock_server = MockServer::start().await;

    let repo_root = repo_root();
    let artifact_dir = artifact_dir(&repo_root);
    std::fs::remove_dir_all(&artifact_dir).ok();

    let output = Command::new(env!("CARGO_BIN_EXE_smasher"))
        .current_dir(&repo_root)
        .args([
            "run",
            "crates/smasher-cli/tests/fixtures/system_lint.dot",
            "--skip-preflight",
            "--skip-lint",
            "--no-tui",
        ])
        .env("ANTHROPIC_API_KEY", "e2e-test-fake-key")
        .env("ANTHROPIC_BASE_URL", mock_server.uri())
        .env_remove("OPENAI_API_KEY")
        .env_remove("GEMINI_API_KEY")
        .output()
        .expect("failed to run smasher binary");

    assert!(
        output.status.success(),
        "smasher run should exit 0\nstdout: {}\nstderr: {}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let report_path = artifact_dir.join("lint-report.json");
    assert!(
        report_path.is_file(),
        "expected lint-report.json at {}",
        report_path.display()
    );

    let contents = std::fs::read_to_string(&report_path).unwrap();
    let report: smasher_system_lint::LintReport = serde_json::from_str(&contents).unwrap();
    assert!(
        report.passed(),
        "expected the clean-candidate fixture to pass both checks: {report:?}"
    );

    let received = mock_server
        .received_requests()
        .await
        .expect("request recording should be enabled by default");
    assert!(
        received.is_empty(),
        "expected zero LLM calls, but the mock server received: {received:?}"
    );

    std::fs::remove_dir_all(&artifact_dir).ok();
}
