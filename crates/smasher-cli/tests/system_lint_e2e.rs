// ABOUTME: End-to-end proof that a system_lint Tool node dispatches natively
// ABOUTME: through `smasher run`, producing lint-report.json and making zero LLM calls.

use std::path::{Path, PathBuf};
use std::process::Command;

use wiremock::MockServer;

const CANDIDATE_ID: &str = "fixture";

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

/// `smasher run` assigns its own run id and prints `Run directory: <path>` to
/// stderr (an absolute path under `{cwd}/artifacts/<run_id>/`) — parse that
/// rather than assuming any particular id.
fn parse_run_directory(stderr: &str) -> PathBuf {
    stderr
        .lines()
        .find_map(|line| line.strip_prefix("Run directory: "))
        .map(PathBuf::from)
        .expect("smasher run should print its run directory to stderr")
}

fn artifact_dir(run_directory: &Path) -> PathBuf {
    run_directory.join("artifacts").join(CANDIDATE_ID)
}

#[tokio::test]
async fn system_lint_pipeline_makes_zero_llm_calls() {
    // No mocks are registered: any request that reaches this server is a real LLM
    // call that should never have happened, and shows up in received_requests().
    let mock_server = MockServer::start().await;

    let repo_root = repo_root();

    // `system_lint`'s candidate_dir now resolves relative paths against the run's
    // own working directory, not the smasher process's CWD (see
    // candidate-workdir-resolution). This fixture lives outside any run
    // directory, so it needs an absolute candidate_dir — same pattern the unit
    // tests in smasher-render-capture/smasher-system-lint already use for their
    // own fixtures. Substitute the placeholder in the static .dot fixture with a
    // real absolute path and run that copy instead of the static file.
    let fixture_candidate_dir = repo_root
        .join("crates/smasher-system-lint/fixtures/clean-candidate")
        .canonicalize()
        .expect("fixture candidate dir should exist");
    let dot_template = std::fs::read_to_string(
        repo_root.join("crates/smasher-cli/tests/fixtures/system_lint.dot"),
    )
    .expect("failed to read system_lint.dot fixture");
    let dot_contents = dot_template.replace(
        "{{FIXTURE_CANDIDATE_DIR}}",
        &fixture_candidate_dir.display().to_string(),
    );
    let dot_dir = tempfile::tempdir().expect("failed to create tempdir for rendered .dot");
    let dot_path = dot_dir.path().join("system_lint.dot");
    std::fs::write(&dot_path, dot_contents).expect("failed to write rendered .dot fixture");

    let output = Command::new(env!("CARGO_BIN_EXE_smasher"))
        .current_dir(&repo_root)
        .args([
            "run",
            dot_path.to_str().unwrap(),
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

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        output.status.success(),
        "smasher run should exit 0\nstdout: {}\nstderr: {stderr}",
        String::from_utf8_lossy(&output.stdout),
    );

    let run_directory = parse_run_directory(&stderr);
    let artifact_dir = artifact_dir(&run_directory);

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

    std::fs::remove_dir_all(&run_directory).ok();
}
