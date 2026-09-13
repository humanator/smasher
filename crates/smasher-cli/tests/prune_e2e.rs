// ABOUTME: End-to-end proof that `smasher prune-artifacts` works against the real
// ABOUTME: compiled binary and real run directories on disk, dry-run and for real.

use std::path::Path;
use std::process::Command;

use chrono::Utc;
use smasher_attractor::run_dir::RunDirectory;

/// Creates a real run directory via `RunDirectory::create`, then backdates its
/// `manifest.json` `created_at` by rewriting the field directly — same technique as
/// the `smasher-attractor` integration test, since the public API always stamps
/// `Utc::now()`.
fn create_backdated_run(artifacts_base: &Path, run_id: &str, age_days: i64) {
    RunDirectory::create(artifacts_base, run_id, "e2e_graph", "digraph { a -> b }").unwrap();

    let manifest_path = artifacts_base.join(run_id).join("manifest.json");
    let mut value: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&manifest_path).unwrap()).unwrap();
    value["created_at"] =
        serde_json::Value::String((Utc::now() - chrono::Duration::days(age_days)).to_rfc3339());
    std::fs::write(&manifest_path, serde_json::to_string_pretty(&value).unwrap()).unwrap();
}

/// Builds a fresh fixture `{data_dir}/artifacts/` with one old run (10 days) and one
/// recent run (0 days).
fn build_fixture_data_dir(data_dir: &Path) {
    let artifacts_base = data_dir.join("artifacts");
    std::fs::create_dir_all(&artifacts_base).unwrap();
    create_backdated_run(&artifacts_base, "old-run", 10);
    create_backdated_run(&artifacts_base, "new-run", 0);
}

#[test]
fn prune_artifacts_dry_run_reports_without_removing_fixture_files() {
    let tmp = tempfile::tempdir().unwrap();
    build_fixture_data_dir(tmp.path());

    let output = Command::new(env!("CARGO_BIN_EXE_smasher"))
        .args([
            "prune-artifacts",
            "--data-dir",
            tmp.path().to_str().unwrap(),
            "--max-age-days",
            "1",
            "--dry-run",
        ])
        .output()
        .expect("failed to run smasher binary");

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        output.status.success(),
        "smasher prune-artifacts --dry-run should exit 0\nstderr: {stderr}"
    );
    assert!(
        stderr.contains("old-run"),
        "dry-run report should name the run that would be removed: {stderr}"
    );

    // Nothing on disk was actually touched.
    assert!(tmp.path().join("artifacts/old-run").exists());
    assert!(tmp.path().join("artifacts/new-run").exists());
}

#[test]
fn prune_artifacts_real_run_removes_expired_run_directories() {
    let tmp = tempfile::tempdir().unwrap();
    build_fixture_data_dir(tmp.path());

    let output = Command::new(env!("CARGO_BIN_EXE_smasher"))
        .args([
            "prune-artifacts",
            "--data-dir",
            tmp.path().to_str().unwrap(),
            "--max-age-days",
            "1",
        ])
        .output()
        .expect("failed to run smasher binary");

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        output.status.success(),
        "smasher prune-artifacts should exit 0\nstderr: {stderr}"
    );

    assert!(
        !tmp.path().join("artifacts/old-run").exists(),
        "old-run should have been removed from disk"
    );
    assert!(
        tmp.path().join("artifacts/new-run").exists(),
        "new-run should still be present"
    );
}
