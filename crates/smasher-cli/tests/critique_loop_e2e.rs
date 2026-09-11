// ABOUTME: End-to-end proof of the Phase 2 critique loop: render_capture -> system_lint +
// ABOUTME: task_critic -> synthesis, run as one continuous `smasher run` pipeline against
// ABOUTME: a real Ollama server, then read back through smasher-web's own scorecard logic.
//
// Requires a real Ollama server: `OLLAMA_API_KEY` (any non-empty string for a local,
// unauthenticated server) and `OLLAMA_BASE_URL` (e.g. `http://localhost:11434`) pointing
// at an instance serving a vision-capable model (this fixture uses `gemma4:31b-cloud`,
// available via Ollama Cloud through a signed-in local daemon). Also spawns a real
// headless Chromium for render_capture. #[ignore]'d: real network + real model calls,
// unlike this crate's other e2e tests which mock the LLM to prove zero calls.

use std::path::PathBuf;
use std::process::Command;

use smasher_system_lint::LintReport;
use smasher_task_critic_synthesis::{CriticReport, Recommendation, SynthesisReport};
use smasher_web::candidates::read_scorecard;

const RUN_ID: &str = "e2e-critique-loop-fixture";
const CANDIDATE_ID: &str = "candidate";

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
#[ignore = "needs a real Ollama server (OLLAMA_API_KEY + OLLAMA_BASE_URL) and real Chromium"]
async fn critique_loop_produces_real_artifacts_and_scorecard_data() {
    let _guard =
        tokio::task::spawn_blocking(smasher_render_capture::testing::acquire_browser_test_lock)
            .await
            .unwrap();

    let repo_root = repo_root();
    let artifact_dir = artifact_dir(&repo_root);
    std::fs::remove_dir_all(&artifact_dir).ok();

    let ollama_api_key =
        std::env::var("OLLAMA_API_KEY").expect("OLLAMA_API_KEY must be set for this test");
    let ollama_base_url =
        std::env::var("OLLAMA_BASE_URL").expect("OLLAMA_BASE_URL must be set for this test");

    let output = Command::new(env!("CARGO_BIN_EXE_smasher"))
        .current_dir(&repo_root)
        .args([
            "run",
            "crates/smasher-cli/tests/fixtures/critique_loop.dot",
            "--skip-preflight",
            "--skip-lint",
            "--no-tui",
        ])
        .env("OLLAMA_API_KEY", ollama_api_key)
        .env("OLLAMA_BASE_URL", ollama_base_url)
        .env_remove("ANTHROPIC_API_KEY")
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

    // render_capture's artifacts.
    assert!(artifact_dir.join("screenshot.png").is_file());
    assert!(artifact_dir.join("manifest.json").is_file());

    // system_lint's artifact: a real LintReport, deterministic and zero-LLM.
    let lint_report: LintReport = serde_json::from_str(
        &std::fs::read_to_string(artifact_dir.join("lint-report.json"))
            .expect("lint-report.json should exist"),
    )
    .expect("lint-report.json should parse as a real LintReport");
    assert!(!lint_report.checks.is_empty());

    // task_critic's artifact: a real vision-model verdict on the fixture candidate.
    let critic_report: CriticReport = serde_json::from_str(
        &std::fs::read_to_string(artifact_dir.join("critic-report.json"))
            .expect("critic-report.json should exist"),
    )
    .expect("critic-report.json should parse as a real CriticReport");
    assert_eq!(
        critic_report.persona,
        "a new user unfamiliar with the product"
    );
    assert_eq!(critic_report.task, "find the primary call-to-action button");

    // synthesis's artifact: reconciles the two reports above into a real recommendation.
    let synthesis_report: SynthesisReport = serde_json::from_str(
        &std::fs::read_to_string(artifact_dir.join("synthesis-report.json"))
            .expect("synthesis-report.json should exist"),
    )
    .expect("synthesis-report.json should parse as a real SynthesisReport");
    assert!(matches!(
        synthesis_report.recommendation,
        Recommendation::Proceed | Recommendation::Iterate
    ));
    assert!(!synthesis_report.reasons.is_empty());

    // The exact same read path smasher-web's gate card uses to build its
    // scorecards — proving a real gate view of this run would show real data,
    // not just that the raw artifact files happen to exist. read_scorecard
    // resolves "runs/..." relative to the current process's cwd (this test
    // binary's, which cargo sets to the crate dir, not repo_root), same as
    // the `smasher` subprocess above resolved it relative to the cwd we gave
    // it — so briefly cd into repo_root to match.
    let original_cwd = std::env::current_dir().unwrap();
    std::env::set_current_dir(&repo_root).unwrap();
    let scorecard = read_scorecard(RUN_ID, CANDIDATE_ID);
    std::env::set_current_dir(original_cwd).unwrap();

    assert!(scorecard.lint_passed().is_some());
    assert!(scorecard.critic_success().is_some());
    assert!(scorecard.synthesis_recommendation_label().is_some());

    std::fs::remove_dir_all(&artifact_dir).ok();
}
