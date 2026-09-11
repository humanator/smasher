// ABOUTME: End-to-end proof that a render_capture Tool node dispatches natively
// ABOUTME: through `smasher run`, producing a real artifact and making zero LLM calls.

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
async fn render_capture_pipeline_makes_zero_llm_calls() {
    // Cross-process lock: this spawns a real headless Chromium (via the smasher
    // binary), same as smasher-render-capture's own tests. Running more than one
    // real Chrome instance at once across concurrently-run test binaries is flaky
    // (resource contention), so share that crate's lock.
    let _guard = tokio::task::spawn_blocking(
        smasher_render_capture::testing::acquire_browser_test_lock,
    )
    .await
    .unwrap();

    // No mocks are registered: any request that reaches this server is a real LLM
    // call that should never have happened, and shows up in received_requests().
    let mock_server = MockServer::start().await;

    let repo_root = repo_root();

    let output = Command::new(env!("CARGO_BIN_EXE_smasher"))
        .current_dir(&repo_root)
        .args([
            "run",
            "crates/smasher-cli/tests/fixtures/render_capture.dot",
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

    assert!(
        artifact_dir.join("screenshot.png").is_file(),
        "expected screenshot.png at {}",
        artifact_dir.display()
    );
    assert!(
        artifact_dir.join("manifest.json").is_file(),
        "expected manifest.json at {}",
        artifact_dir.display()
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
