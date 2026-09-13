// ABOUTME: Integration tests for prune_artifacts against real RunDirectory trees on disk.
// ABOUTME: Backdates real manifests via JSON rewrite since RunDirectory::create() always stamps now().

use std::path::Path;

use chrono::{DateTime, Utc};

use smasher_attractor::run_dir::{ArtifactRetentionPolicy, RunDirectory, prune_artifacts};

/// Creates a real run directory via `RunDirectory::create`, then rewrites its
/// `manifest.json`'s `created_at` field directly on disk — the only way to backdate
/// a run, since the public API always stamps `Utc::now()`.
fn create_backdated_run(data_dir: &Path, run_id: &str, created_at: DateTime<Utc>) {
    RunDirectory::create(data_dir, run_id, "test_graph", "digraph { a -> b }").unwrap();

    let manifest_path = data_dir.join(run_id).join("manifest.json");
    let mut value: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&manifest_path).unwrap()).unwrap();
    value["created_at"] = serde_json::Value::String(created_at.to_rfc3339());
    std::fs::write(&manifest_path, serde_json::to_string_pretty(&value).unwrap()).unwrap();
}

#[test]
fn prune_artifacts_removes_real_backdated_run_directories() {
    let tmp = tempfile::tempdir().unwrap();
    // prune_artifacts scans {data_dir}/artifacts/<run_id>/, so run directories
    // must live one level under the base passed to it.
    let artifacts_base = tmp.path().join("artifacts");
    std::fs::create_dir_all(&artifacts_base).unwrap();

    let now = Utc::now();
    create_backdated_run(&artifacts_base, "old-run", now - chrono::Duration::days(10));
    create_backdated_run(&artifacts_base, "new-run", now);

    let policy = ArtifactRetentionPolicy {
        max_age: Some(chrono::Duration::days(1)),
        max_total_bytes: None,
    };
    let report = prune_artifacts(tmp.path(), &policy, false).unwrap();

    assert_eq!(report.removed_run_ids, vec!["old-run".to_string()]);
    assert!(!artifacts_base.join("old-run").exists());
    assert!(artifacts_base.join("new-run").exists());
    // The surviving run's manifest is still readable via the real RunDirectory API.
    RunDirectory::open(&artifacts_base.join("new-run")).unwrap();
}

#[test]
fn prune_artifacts_dry_run_leaves_real_run_directories_untouched() {
    let tmp = tempfile::tempdir().unwrap();
    let artifacts_base = tmp.path().join("artifacts");
    std::fs::create_dir_all(&artifacts_base).unwrap();

    let now = Utc::now();
    create_backdated_run(&artifacts_base, "old-run-a", now - chrono::Duration::days(10));
    create_backdated_run(&artifacts_base, "old-run-b", now - chrono::Duration::days(9));

    let policy = ArtifactRetentionPolicy {
        max_age: Some(chrono::Duration::days(1)),
        max_total_bytes: None,
    };
    let report = prune_artifacts(tmp.path(), &policy, true).unwrap();

    assert_eq!(
        report.removed_run_ids,
        vec!["old-run-a".to_string(), "old-run-b".to_string()]
    );
    // dry_run: true - nothing on disk was actually touched.
    RunDirectory::open(&artifacts_base.join("old-run-a")).unwrap();
    RunDirectory::open(&artifacts_base.join("old-run-b")).unwrap();
}
