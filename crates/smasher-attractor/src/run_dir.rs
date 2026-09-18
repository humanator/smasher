// ABOUTME: Run directory layout with manifest file, per-node log dirs, and artifact storage.
// ABOUTME: Creates and manages the on-disk structure for a single pipeline run.

use std::path::{Path, PathBuf};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::state::StateError;

/// Describes the subdirectory layout within a run directory.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RunDirectories {
    pub root: PathBuf,
    pub checkpoints: PathBuf,
    pub node_logs: PathBuf,
    pub artifacts: PathBuf,
    pub events: PathBuf,
}

/// Serializable manifest describing a pipeline run's identity and layout.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RunManifest {
    pub run_id: String,
    pub graph_name: String,
    pub graph_hash: String,
    pub created_at: DateTime<Utc>,
    pub layout_version: u32,
    pub directories: RunDirectories,
    #[serde(default)]
    pub workflow_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub input_tokens: u64,
    #[serde(default)]
    pub output_tokens: u64,
    #[serde(default)]
    pub completed_at: Option<DateTime<Utc>>,
}

/// Builder and manager for run directory layout on disk.
///
/// Handles creating the directory tree, writing the manifest, and
/// providing convenience accessors for per-node subdirectories.
#[derive(Debug, Clone)]
pub struct RunDirectory {
    manifest: RunManifest,
}

/// Maximum length for a sanitized graph name.
const MAX_GRAPH_NAME_LEN: usize = 128;

/// Sanitize a graph name from user input for safe storage.
///
/// Strips path separators (`/`, `\`) and parent-directory traversals (`..`),
/// replacing them with underscores. Truncates to 128 characters and defaults
/// to `"unnamed"` if the result is empty.
pub fn sanitize_graph_name(raw: &str) -> String {
    let sanitized = raw.replace(['/', '\\'], "_").replace("..", "_");
    let trimmed = sanitized.trim();
    if trimmed.is_empty() {
        return "unnamed".to_string();
    }
    if trimmed.len() > MAX_GRAPH_NAME_LEN {
        // Truncate by chars, not bytes, to avoid splitting multi-byte UTF-8.
        trimmed.chars().take(MAX_GRAPH_NAME_LEN).collect()
    } else {
        trimmed.to_string()
    }
}

/// Compute a hex-encoded SHA256 hash of the given input.
fn sha256_hex(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    result
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>()
}

impl RunDirectory {
    /// Create a run directory structure on disk.
    ///
    /// Creates subdirectories for checkpoints, node logs, artifacts, and events
    /// under `{base_dir}/{run_id}/`, then writes a `manifest.json` file at the root.
    pub fn create(
        base_dir: &Path,
        run_id: &str,
        graph_name: &str,
        graph_source: &str,
    ) -> Result<Self, StateError> {
        let root = base_dir.join(run_id);
        let directories = RunDirectories {
            root: root.clone(),
            checkpoints: root.join("checkpoints"),
            node_logs: root.join("nodes"),
            artifacts: root.join("artifacts"),
            events: root.join("events"),
        };

        // Create all subdirectories
        std::fs::create_dir_all(&directories.checkpoints)?;
        std::fs::create_dir_all(&directories.node_logs)?;
        std::fs::create_dir_all(&directories.artifacts)?;
        std::fs::create_dir_all(&directories.events)?;

        let manifest = RunManifest {
            run_id: run_id.to_string(),
            graph_name: graph_name.to_string(),
            graph_hash: sha256_hex(graph_source),
            created_at: Utc::now(),
            layout_version: 1,
            directories,
            workflow_id: None,
            status: None,
            input_tokens: 0,
            output_tokens: 0,
            completed_at: None,
        };

        // Write manifest.json
        let manifest_json = serde_json::to_string_pretty(&manifest).map_err(|e| {
            StateError::SerializationError {
                message: e.to_string(),
            }
        })?;
        std::fs::write(root.join("manifest.json"), manifest_json)?;

        Ok(Self { manifest })
    }

    /// Open an existing run directory by reading its manifest.
    pub fn open(path: &Path) -> Result<Self, StateError> {
        let manifest_path = path.join("manifest.json");
        let contents = std::fs::read_to_string(&manifest_path)?;
        let manifest: RunManifest =
            serde_json::from_str(&contents).map_err(|e| StateError::DeserializationError {
                message: e.to_string(),
            })?;
        Ok(Self { manifest })
    }

    /// Return a reference to the run manifest.
    pub fn manifest(&self) -> &RunManifest {
        &self.manifest
    }

    /// Stamp rehydration metadata onto the manifest and rewrite `manifest.json`
    /// on disk, leaving every other field untouched.
    ///
    /// Called once at creation time (status `"Running"`) and again at the
    /// run's terminal transition (final status, token counts, completion
    /// time), so a server restart can reconstruct a run's state from disk
    /// alone.
    pub fn persist_run_metadata(
        &mut self,
        workflow_id: Option<String>,
        status: Option<String>,
        input_tokens: u64,
        output_tokens: u64,
        completed_at: Option<DateTime<Utc>>,
    ) -> Result<(), StateError> {
        self.manifest.workflow_id = workflow_id;
        self.manifest.status = status;
        self.manifest.input_tokens = input_tokens;
        self.manifest.output_tokens = output_tokens;
        self.manifest.completed_at = completed_at;

        let manifest_json = serde_json::to_string_pretty(&self.manifest).map_err(|e| {
            StateError::SerializationError {
                message: e.to_string(),
            }
        })?;
        std::fs::write(
            self.manifest.directories.root.join("manifest.json"),
            manifest_json,
        )?;

        Ok(())
    }

    /// Return the log directory path for a specific node.
    ///
    /// The directory is `{root}/nodes/{node_id}/`.
    pub fn node_log_dir(&self, node_id: &str) -> PathBuf {
        self.manifest.directories.node_logs.join(node_id)
    }

    /// Return the path to the checkpoint file.
    ///
    /// The path is `{root}/checkpoints/checkpoint.json`.
    pub fn checkpoint_path(&self) -> PathBuf {
        self.manifest
            .directories
            .checkpoints
            .join("checkpoint.json")
    }

    /// Return the artifact directory for a specific node.
    ///
    /// The directory is `{root}/artifacts/{node_id}/`.
    pub fn artifact_dir(&self, node_id: &str) -> PathBuf {
        self.manifest.directories.artifacts.join(node_id)
    }

    /// Return the path to the event log file.
    ///
    /// The path is `{root}/events/events.jsonl`.
    pub fn event_log_path(&self) -> PathBuf {
        self.manifest.directories.events.join("events.jsonl")
    }

    /// Symlink `target` into the run's root directory as `{root}/{name}`.
    ///
    /// Each run gets a fresh, isolated working directory with nothing in it,
    /// which leaves an agent with no way to find a shared, project-level
    /// resource (e.g. a design system component kit) by a relative path — it
    /// has to search for one, which is slow and unbounded. This exposes such
    /// a resource under a stable, predictable name inside the run directory
    /// instead.
    ///
    /// A no-op if `target` doesn't exist, so pipelines that don't need the
    /// resource aren't affected by its absence.
    pub fn symlink_into_root(&self, name: &str, target: &Path) -> Result<(), StateError> {
        if !target.exists() {
            return Ok(());
        }
        let link_path = self.manifest.directories.root.join(name);
        #[cfg(unix)]
        std::os::unix::fs::symlink(target, &link_path)?;
        #[cfg(not(unix))]
        let _ = link_path;
        Ok(())
    }
}

/// Policy controlling how long `{data_dir}/artifacts/<run_id>/` trees are kept.
///
/// Mirrors `log_sink::RetentionPolicy`'s shape. All fields are optional; when set,
/// runs exceeding the limits are pruned oldest-first (by `RunManifest.created_at`)
/// by `prune_artifacts`.
#[derive(Debug, Clone, Default)]
pub struct ArtifactRetentionPolicy {
    /// Remove runs older than this duration relative to now.
    pub max_age: Option<chrono::Duration>,
    /// Remove the oldest runs until the artifacts tree's total size is at or under
    /// this cap.
    pub max_total_bytes: Option<u64>,
}

/// Result of a `prune_artifacts` call: which runs were (or, for a dry run, would be)
/// removed, and how many bytes that reclaims.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct PruneReport {
    pub removed_run_ids: Vec<String>,
    pub bytes_reclaimed: u64,
}

/// Recursively sums the byte size of every file under `path`.
fn dir_size(path: &Path) -> u64 {
    let Ok(entries) = std::fs::read_dir(path) else {
        return 0;
    };
    entries
        .filter_map(Result::ok)
        .map(|entry| match entry.file_type() {
            Ok(file_type) if file_type.is_dir() => dir_size(&entry.path()),
            Ok(_) => entry.metadata().map(|m| m.len()).unwrap_or(0),
            Err(_) => 0,
        })
        .sum()
}

/// A run directory's identity, on-disk path, and stats needed to decide whether
/// to prune it.
struct PrunableRun {
    run_id: String,
    path: PathBuf,
    created_at: DateTime<Utc>,
    size: u64,
}

/// Scans `{data_dir}/artifacts/` for run directories with a parseable
/// `manifest.json`, oldest-first. Missing directories, unreadable entries, and
/// malformed manifests are skipped rather than erroring the whole scan — same
/// convention as `smasher-web`'s `scan_candidates`.
fn scan_runs(data_dir: &Path) -> Vec<PrunableRun> {
    let artifacts_dir = data_dir.join("artifacts");
    let Ok(entries) = std::fs::read_dir(&artifacts_dir) else {
        return Vec::new();
    };

    let mut runs: Vec<PrunableRun> = entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            if !entry.file_type().ok()?.is_dir() {
                return None;
            }
            let path = entry.path();
            let contents = std::fs::read_to_string(path.join("manifest.json")).ok()?;
            let manifest: RunManifest = serde_json::from_str(&contents).ok()?;
            let size = dir_size(&path);
            Some(PrunableRun {
                run_id: manifest.run_id,
                path,
                created_at: manifest.created_at,
                size,
            })
        })
        .collect();

    runs.sort_by_key(|r| r.created_at);
    runs
}

/// Removes whole `{data_dir}/artifacts/<run_id>/` trees, oldest-first, until the
/// tree satisfies `policy`. Never deletes a partial run — a run's artifacts are
/// kept or discarded as a unit. `dry_run: true` computes and returns the same
/// report without touching disk.
pub fn prune_artifacts(
    data_dir: &Path,
    policy: &ArtifactRetentionPolicy,
    dry_run: bool,
) -> Result<PruneReport, StateError> {
    let runs = scan_runs(data_dir);

    let mut to_remove: Vec<usize> = Vec::new();

    if let Some(max_age) = policy.max_age {
        let cutoff = Utc::now() - max_age;
        for (i, run) in runs.iter().enumerate() {
            if run.created_at < cutoff {
                to_remove.push(i);
            }
        }
    }

    if let Some(max_total_bytes) = policy.max_total_bytes {
        let mut total: u64 = runs.iter().map(|r| r.size).sum();
        for (i, run) in runs.iter().enumerate() {
            if total <= max_total_bytes {
                break;
            }
            if !to_remove.contains(&i) {
                to_remove.push(i);
            }
            total = total.saturating_sub(run.size);
        }
    }

    to_remove.sort_unstable();
    to_remove.dedup();

    let mut report = PruneReport::default();
    for i in to_remove {
        let run = &runs[i];
        report.removed_run_ids.push(run.run_id.clone());
        report.bytes_reclaimed += run.size;
        if !dry_run {
            std::fs::remove_dir_all(&run.path)?;
        }
    }

    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    // ---------------------------------------------------------------
    // RunManifest serde round-trip
    // ---------------------------------------------------------------

    #[test]
    fn run_manifest_serde_roundtrip() {
        let manifest = RunManifest {
            run_id: "run-42".to_string(),
            graph_name: "my_pipeline".to_string(),
            graph_hash: "abc123def456".to_string(),
            created_at: Utc::now(),
            layout_version: 1,
            directories: RunDirectories {
                root: PathBuf::from("/tmp/runs/run-42"),
                checkpoints: PathBuf::from("/tmp/runs/run-42/checkpoints"),
                node_logs: PathBuf::from("/tmp/runs/run-42/nodes"),
                artifacts: PathBuf::from("/tmp/runs/run-42/artifacts"),
                events: PathBuf::from("/tmp/runs/run-42/events"),
            },
            workflow_id: None,
            status: None,
            input_tokens: 0,
            output_tokens: 0,
            completed_at: None,
        };

        let json_str = serde_json::to_string_pretty(&manifest).unwrap();
        let restored: RunManifest = serde_json::from_str(&json_str).unwrap();

        assert_eq!(manifest, restored);
    }

    // ---------------------------------------------------------------
    // RunManifest defaults the 5 rehydration fields on an old-shape manifest
    // ---------------------------------------------------------------

    #[test]
    fn run_manifest_defaults_rehydration_fields_from_old_shape_json() {
        let old_shape_json = r#"{
            "run_id": "run-old",
            "graph_name": "legacy_pipeline",
            "graph_hash": "deadbeef",
            "created_at": "2024-01-01T00:00:00Z",
            "layout_version": 1,
            "directories": {
                "root": "/tmp/runs/run-old",
                "checkpoints": "/tmp/runs/run-old/checkpoints",
                "node_logs": "/tmp/runs/run-old/nodes",
                "artifacts": "/tmp/runs/run-old/artifacts",
                "events": "/tmp/runs/run-old/events"
            }
        }"#;

        let manifest: RunManifest = serde_json::from_str(old_shape_json).unwrap();

        assert_eq!(manifest.workflow_id, None);
        assert_eq!(manifest.status, None);
        assert_eq!(manifest.input_tokens, 0);
        assert_eq!(manifest.output_tokens, 0);
        assert_eq!(manifest.completed_at, None);
    }

    // ---------------------------------------------------------------
    // RunManifest with all 5 new fields populated round-trips unchanged
    // ---------------------------------------------------------------

    #[test]
    fn run_manifest_populated_rehydration_fields_roundtrip() {
        let manifest = RunManifest {
            run_id: "run-99".to_string(),
            graph_name: "my_pipeline".to_string(),
            graph_hash: "abc123def456".to_string(),
            created_at: Utc::now(),
            layout_version: 1,
            directories: RunDirectories {
                root: PathBuf::from("/tmp/runs/run-99"),
                checkpoints: PathBuf::from("/tmp/runs/run-99/checkpoints"),
                node_logs: PathBuf::from("/tmp/runs/run-99/nodes"),
                artifacts: PathBuf::from("/tmp/runs/run-99/artifacts"),
                events: PathBuf::from("/tmp/runs/run-99/events"),
            },
            workflow_id: Some("wf-1".to_string()),
            status: Some("Completed".to_string()),
            input_tokens: 123,
            output_tokens: 456,
            completed_at: Some(Utc::now()),
        };

        let json_str = serde_json::to_string_pretty(&manifest).unwrap();
        let restored: RunManifest = serde_json::from_str(&json_str).unwrap();

        assert_eq!(manifest, restored);
    }

    // ---------------------------------------------------------------
    // persist_run_metadata mutates in-memory manifest and rewrites manifest.json
    // ---------------------------------------------------------------

    #[test]
    fn persist_run_metadata_mutates_memory_and_disk() {
        let tmp = tempfile::tempdir().unwrap();
        let mut run_dir =
            RunDirectory::create(tmp.path(), "run-persist", "g", "digraph { a -> b }").unwrap();

        let completed_at = Utc::now();
        run_dir
            .persist_run_metadata(
                Some("wf-42".to_string()),
                Some("Completed".to_string()),
                10,
                20,
                Some(completed_at),
            )
            .unwrap();

        assert_eq!(run_dir.manifest().workflow_id, Some("wf-42".to_string()));
        assert_eq!(run_dir.manifest().status, Some("Completed".to_string()));
        assert_eq!(run_dir.manifest().input_tokens, 10);
        assert_eq!(run_dir.manifest().output_tokens, 20);
        assert_eq!(run_dir.manifest().completed_at, Some(completed_at));

        let contents =
            std::fs::read_to_string(tmp.path().join("run-persist").join("manifest.json")).unwrap();
        let on_disk: RunManifest = serde_json::from_str(&contents).unwrap();

        assert_eq!(on_disk.workflow_id, Some("wf-42".to_string()));
        assert_eq!(on_disk.status, Some("Completed".to_string()));
        assert_eq!(on_disk.input_tokens, 10);
        assert_eq!(on_disk.output_tokens, 20);
        assert_eq!(on_disk.completed_at, Some(completed_at));
    }

    // ---------------------------------------------------------------
    // persist_run_metadata leaves the original fields untouched
    // ---------------------------------------------------------------

    #[test]
    fn persist_run_metadata_leaves_original_fields_unchanged() {
        let tmp = tempfile::tempdir().unwrap();
        let mut run_dir =
            RunDirectory::create(tmp.path(), "run-stable", "g", "digraph { a -> b }").unwrap();

        let run_id_before = run_dir.manifest().run_id.clone();
        let graph_name_before = run_dir.manifest().graph_name.clone();
        let graph_hash_before = run_dir.manifest().graph_hash.clone();
        let created_at_before = run_dir.manifest().created_at;
        let layout_version_before = run_dir.manifest().layout_version;
        let directories_before = run_dir.manifest().directories.clone();

        run_dir
            .persist_run_metadata(
                Some("wf-1".to_string()),
                Some("Running".to_string()),
                0,
                0,
                None,
            )
            .unwrap();

        assert_eq!(run_dir.manifest().run_id, run_id_before);
        assert_eq!(run_dir.manifest().graph_name, graph_name_before);
        assert_eq!(run_dir.manifest().graph_hash, graph_hash_before);
        assert_eq!(run_dir.manifest().created_at, created_at_before);
        assert_eq!(run_dir.manifest().layout_version, layout_version_before);
        assert_eq!(run_dir.manifest().directories, directories_before);
    }

    // ---------------------------------------------------------------
    // persist_run_metadata called twice leaves only the second call's values
    // ---------------------------------------------------------------

    #[test]
    fn persist_run_metadata_second_call_overwrites_first() {
        let tmp = tempfile::tempdir().unwrap();
        let mut run_dir =
            RunDirectory::create(tmp.path(), "run-twice", "g", "digraph { a -> b }").unwrap();

        run_dir
            .persist_run_metadata(
                Some("wf-1".to_string()),
                Some("Running".to_string()),
                0,
                0,
                None,
            )
            .unwrap();

        let completed_at = Utc::now();
        run_dir
            .persist_run_metadata(
                Some("wf-1".to_string()),
                Some("Completed".to_string()),
                50,
                75,
                Some(completed_at),
            )
            .unwrap();

        let contents =
            std::fs::read_to_string(tmp.path().join("run-twice").join("manifest.json")).unwrap();
        let on_disk: RunManifest = serde_json::from_str(&contents).unwrap();

        assert_eq!(on_disk.status, Some("Completed".to_string()));
        assert_eq!(on_disk.input_tokens, 50);
        assert_eq!(on_disk.output_tokens, 75);
        assert_eq!(on_disk.completed_at, Some(completed_at));
    }

    // ---------------------------------------------------------------
    // RunDirectory::create creates all subdirectories
    // ---------------------------------------------------------------

    #[test]
    fn create_creates_all_subdirectories() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-1", "test_graph", "digraph { a -> b }").unwrap();

        let root = tmp.path().join("run-1");
        assert!(root.exists(), "root directory should exist");
        assert!(
            root.join("checkpoints").is_dir(),
            "checkpoints dir should exist"
        );
        assert!(root.join("nodes").is_dir(), "nodes dir should exist");
        assert!(
            root.join("artifacts").is_dir(),
            "artifacts dir should exist"
        );
        assert!(root.join("events").is_dir(), "events dir should exist");

        // Manifest fields should reflect the directory structure
        let dirs = &run_dir.manifest().directories;
        assert_eq!(dirs.root, root);
        assert_eq!(dirs.checkpoints, root.join("checkpoints"));
        assert_eq!(dirs.node_logs, root.join("nodes"));
        assert_eq!(dirs.artifacts, root.join("artifacts"));
        assert_eq!(dirs.events, root.join("events"));
    }

    // ---------------------------------------------------------------
    // RunDirectory::create writes valid manifest.json
    // ---------------------------------------------------------------

    #[test]
    fn create_writes_valid_manifest_json() {
        let tmp = tempfile::tempdir().unwrap();
        let _run_dir = RunDirectory::create(
            tmp.path(),
            "run-abc",
            "pipeline_x",
            "digraph { start -> end }",
        )
        .unwrap();

        let manifest_path = tmp.path().join("run-abc").join("manifest.json");
        assert!(manifest_path.exists(), "manifest.json should be written");

        let contents = std::fs::read_to_string(&manifest_path).unwrap();
        let value: serde_json::Value = serde_json::from_str(&contents).unwrap();

        assert_eq!(value["run_id"], "run-abc");
        assert_eq!(value["graph_name"], "pipeline_x");
        assert_eq!(value["layout_version"], 1);
        // graph_hash should be present and non-empty
        assert!(!value["graph_hash"].as_str().unwrap().is_empty());
    }

    // ---------------------------------------------------------------
    // RunDirectory::open reads manifest back
    // ---------------------------------------------------------------

    #[test]
    fn open_reads_manifest_back() {
        let tmp = tempfile::tempdir().unwrap();
        let created =
            RunDirectory::create(tmp.path(), "run-reopen", "my_graph", "digraph { x -> y }")
                .unwrap();

        let opened = RunDirectory::open(&tmp.path().join("run-reopen")).unwrap();

        assert_eq!(created.manifest().run_id, opened.manifest().run_id);
        assert_eq!(created.manifest().graph_name, opened.manifest().graph_name);
        assert_eq!(created.manifest().graph_hash, opened.manifest().graph_hash);
        assert_eq!(
            created.manifest().layout_version,
            opened.manifest().layout_version
        );
        assert_eq!(
            created.manifest().directories,
            opened.manifest().directories
        );
    }

    // ---------------------------------------------------------------
    // graph_hash is deterministic
    // ---------------------------------------------------------------

    #[test]
    fn graph_hash_is_deterministic() {
        let source = "digraph { a -> b; b -> c; }";

        let tmp1 = tempfile::tempdir().unwrap();
        let run1 = RunDirectory::create(tmp1.path(), "run-1", "g", source).unwrap();

        let tmp2 = tempfile::tempdir().unwrap();
        let run2 = RunDirectory::create(tmp2.path(), "run-2", "g", source).unwrap();

        assert_eq!(
            run1.manifest().graph_hash,
            run2.manifest().graph_hash,
            "same source should produce the same hash"
        );

        // Different source should produce a different hash
        let tmp3 = tempfile::tempdir().unwrap();
        let run3 = RunDirectory::create(tmp3.path(), "run-3", "g", "digraph { x -> y }").unwrap();

        assert_ne!(
            run1.manifest().graph_hash,
            run3.manifest().graph_hash,
            "different sources should produce different hashes"
        );
    }

    // ---------------------------------------------------------------
    // graph_hash is valid SHA256 (64 hex characters)
    // ---------------------------------------------------------------

    #[test]
    fn graph_hash_is_valid_sha256_hex() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-sha", "g", "digraph { a -> b }").unwrap();

        let hash = &run_dir.manifest().graph_hash;
        assert_eq!(hash.len(), 64, "SHA256 hex string should be 64 characters");
        assert!(
            hash.chars().all(|c| c.is_ascii_hexdigit()),
            "hash should contain only hex characters"
        );
    }

    // ---------------------------------------------------------------
    // node_log_dir returns correct path
    // ---------------------------------------------------------------

    #[test]
    fn node_log_dir_returns_correct_path() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-logs", "g", "digraph { a -> b }").unwrap();

        let log_dir = run_dir.node_log_dir("node_alpha");
        assert_eq!(
            log_dir,
            tmp.path().join("run-logs").join("nodes").join("node_alpha")
        );
    }

    // ---------------------------------------------------------------
    // artifact_dir returns correct path
    // ---------------------------------------------------------------

    #[test]
    fn artifact_dir_returns_correct_path() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-arts", "g", "digraph { a -> b }").unwrap();

        let art_dir = run_dir.artifact_dir("node_beta");
        assert_eq!(
            art_dir,
            tmp.path()
                .join("run-arts")
                .join("artifacts")
                .join("node_beta")
        );
    }

    // ---------------------------------------------------------------
    // checkpoint_path returns correct path
    // ---------------------------------------------------------------

    #[test]
    fn checkpoint_path_returns_correct_path() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-cp", "g", "digraph { a -> b }").unwrap();

        let cp_path = run_dir.checkpoint_path();
        assert_eq!(
            cp_path,
            tmp.path()
                .join("run-cp")
                .join("checkpoints")
                .join("checkpoint.json")
        );
    }

    // ---------------------------------------------------------------
    // event_log_path returns correct path
    // ---------------------------------------------------------------

    #[test]
    fn event_log_path_returns_correct_path() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-ev", "g", "digraph { a -> b }").unwrap();

        let ev_path = run_dir.event_log_path();
        assert_eq!(
            ev_path,
            tmp.path()
                .join("run-ev")
                .join("events")
                .join("events.jsonl")
        );
    }

    // ---------------------------------------------------------------
    // symlink_into_root
    // ---------------------------------------------------------------

    #[test]
    fn symlink_into_root_links_an_existing_target() {
        let tmp = tempfile::tempdir().unwrap();
        let target_dir = tmp.path().join("shared-kit");
        std::fs::create_dir_all(&target_dir).unwrap();
        std::fs::write(target_dir.join("marker.txt"), "hello").unwrap();

        let run_dir =
            RunDirectory::create(tmp.path(), "run-link", "g", "digraph { a -> b }").unwrap();
        run_dir
            .symlink_into_root("design-kit", &target_dir)
            .unwrap();

        let link_path = tmp.path().join("run-link").join("design-kit");
        assert!(link_path.is_symlink());
        // The link resolves through to the real file.
        assert_eq!(
            std::fs::read_to_string(link_path.join("marker.txt")).unwrap(),
            "hello"
        );
    }

    #[test]
    fn symlink_into_root_is_a_noop_when_target_is_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let run_dir =
            RunDirectory::create(tmp.path(), "run-nolink", "g", "digraph { a -> b }").unwrap();

        let result = run_dir.symlink_into_root("design-kit", &tmp.path().join("does-not-exist"));

        assert!(result.is_ok());
        assert!(!tmp.path().join("run-nolink").join("design-kit").exists());
    }

    // ---------------------------------------------------------------
    // open fails for non-existent directory
    // ---------------------------------------------------------------

    #[test]
    fn open_fails_for_nonexistent_directory() {
        let result = RunDirectory::open(Path::new("/tmp/this_does_not_exist_at_all"));
        assert!(result.is_err());
    }

    // ---------------------------------------------------------------
    // sha256_hex unit test
    // ---------------------------------------------------------------

    #[test]
    fn sha256_hex_known_value() {
        // SHA256 of empty string is well-known
        let hash = sha256_hex("");
        assert_eq!(
            hash,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    // ---------------------------------------------------------------
    // sanitize_graph_name tests
    // ---------------------------------------------------------------

    #[test]
    fn sanitize_replaces_forward_slashes() {
        assert_eq!(sanitize_graph_name("foo/bar/baz"), "foo_bar_baz");
    }

    #[test]
    fn sanitize_replaces_backslashes() {
        assert_eq!(sanitize_graph_name("foo\\bar\\baz"), "foo_bar_baz");
    }

    #[test]
    fn sanitize_replaces_dot_dot_traversal() {
        assert_eq!(
            sanitize_graph_name("../../../etc/passwd"),
            "______etc_passwd"
        );
    }

    #[test]
    fn sanitize_empty_string_defaults_to_unnamed() {
        assert_eq!(sanitize_graph_name(""), "unnamed");
    }

    #[test]
    fn sanitize_whitespace_only_defaults_to_unnamed() {
        assert_eq!(sanitize_graph_name("   "), "unnamed");
    }

    #[test]
    fn sanitize_truncates_long_names() {
        let long_name = "a".repeat(200);
        let result = sanitize_graph_name(&long_name);
        assert_eq!(result.len(), MAX_GRAPH_NAME_LEN);
    }

    #[test]
    fn sanitize_preserves_normal_names() {
        assert_eq!(sanitize_graph_name("my_pipeline"), "my_pipeline");
    }

    #[test]
    fn sanitize_handles_mixed_dangerous_input() {
        assert_eq!(sanitize_graph_name("../../foo/bar\\baz"), "____foo_bar_baz");
    }

    #[test]
    fn sanitize_slashes_only_produces_underscores() {
        assert_eq!(sanitize_graph_name("///"), "___");
    }

    #[test]
    fn sanitize_truncates_unicode_by_chars_not_bytes() {
        // 200 CJK characters — each is 3 bytes in UTF-8 (600 bytes total).
        // Truncation at MAX_GRAPH_NAME_LEN=128 chars should produce valid UTF-8.
        let cjk = "\u{4e00}".repeat(200);
        let result = sanitize_graph_name(&cjk);
        assert_eq!(result.chars().count(), MAX_GRAPH_NAME_LEN);
        // Must be valid UTF-8 (no partial chars).
        assert!(std::str::from_utf8(result.as_bytes()).is_ok());
    }

    #[test]
    fn sanitize_emoji_at_truncation_boundary() {
        // Emoji are 4 bytes each. Fill past the limit to test boundary.
        let emoji = "\u{1F600}".repeat(200);
        let result = sanitize_graph_name(&emoji);
        assert_eq!(result.chars().count(), MAX_GRAPH_NAME_LEN);
        assert!(std::str::from_utf8(result.as_bytes()).is_ok());
    }

    // ---------------------------------------------------------------
    // prune_artifacts
    // ---------------------------------------------------------------

    /// Writes a fake `{data_dir}/artifacts/<run_id>/manifest.json` with the given
    /// `created_at`, plus a `payload` file of `size_bytes` under the run dir, without
    /// going through `RunDirectory::create` (which always stamps `Utc::now()` and
    /// offers no way to backdate).
    fn write_fake_run(data_dir: &Path, run_id: &str, created_at: DateTime<Utc>, size_bytes: usize) {
        let root = data_dir.join("artifacts").join(run_id);
        std::fs::create_dir_all(&root).unwrap();
        let manifest = RunManifest {
            run_id: run_id.to_string(),
            graph_name: "g".to_string(),
            graph_hash: "hash".to_string(),
            created_at,
            layout_version: 1,
            directories: RunDirectories {
                root: root.clone(),
                checkpoints: root.join("checkpoints"),
                node_logs: root.join("nodes"),
                artifacts: root.join("artifacts"),
                events: root.join("events"),
            },
            workflow_id: None,
            status: None,
            input_tokens: 0,
            output_tokens: 0,
            completed_at: None,
        };
        std::fs::write(
            root.join("manifest.json"),
            serde_json::to_string_pretty(&manifest).unwrap(),
        )
        .unwrap();
        std::fs::write(root.join("payload"), vec![0u8; size_bytes]).unwrap();
    }

    #[test]
    fn prune_artifacts_max_age_removes_only_older_run_dirs() {
        let tmp = tempfile::tempdir().unwrap();
        let now = Utc::now();
        write_fake_run(tmp.path(), "old-run", now - chrono::Duration::days(10), 10);
        write_fake_run(tmp.path(), "new-run", now, 10);

        let policy = ArtifactRetentionPolicy {
            max_age: Some(chrono::Duration::days(1)),
            max_total_bytes: None,
        };
        let report = prune_artifacts(tmp.path(), &policy, false).unwrap();

        assert_eq!(report.removed_run_ids, vec!["old-run".to_string()]);
        assert!(!tmp.path().join("artifacts/old-run").exists());
        assert!(tmp.path().join("artifacts/new-run").exists());
    }

    #[test]
    fn prune_artifacts_max_total_bytes_removes_oldest_first_until_under_cap() {
        let tmp = tempfile::tempdir().unwrap();
        let now = Utc::now();
        write_fake_run(tmp.path(), "run-a", now - chrono::Duration::days(3), 10_000);
        write_fake_run(tmp.path(), "run-b", now - chrono::Duration::days(2), 10_000);
        write_fake_run(tmp.path(), "run-c", now - chrono::Duration::days(1), 10_000);

        // Each run dir is the same size (same payload size, same-length manifest
        // fields), so a cap of 1.5x one run's real on-disk size (manifest.json +
        // payload) sits strictly between "keep 1" and "keep 2" — forcing exactly
        // the two oldest runs out.
        let one_run_size = dir_size(&tmp.path().join("artifacts/run-c"));
        let cap = one_run_size + one_run_size / 2;

        let policy = ArtifactRetentionPolicy {
            max_age: None,
            max_total_bytes: Some(cap),
        };
        let report = prune_artifacts(tmp.path(), &policy, false).unwrap();

        assert_eq!(
            report.removed_run_ids,
            vec!["run-a".to_string(), "run-b".to_string()]
        );
        assert!(!tmp.path().join("artifacts/run-a").exists());
        assert!(!tmp.path().join("artifacts/run-b").exists());
        assert!(tmp.path().join("artifacts/run-c").exists());
    }

    #[test]
    fn prune_artifacts_removes_nothing_when_within_limits() {
        let tmp = tempfile::tempdir().unwrap();
        let now = Utc::now();
        write_fake_run(tmp.path(), "run-a", now, 10);

        let policy = ArtifactRetentionPolicy {
            max_age: Some(chrono::Duration::days(30)),
            max_total_bytes: Some(1_000_000),
        };
        let report = prune_artifacts(tmp.path(), &policy, false).unwrap();

        assert!(report.removed_run_ids.is_empty());
        assert_eq!(report.bytes_reclaimed, 0);
        assert!(tmp.path().join("artifacts/run-a").exists());
    }

    #[test]
    fn prune_artifacts_dry_run_reports_without_touching_disk() {
        let tmp = tempfile::tempdir().unwrap();
        let now = Utc::now();
        write_fake_run(tmp.path(), "old-run", now - chrono::Duration::days(10), 10);

        let policy = ArtifactRetentionPolicy {
            max_age: Some(chrono::Duration::days(1)),
            max_total_bytes: None,
        };
        let report = prune_artifacts(tmp.path(), &policy, true).unwrap();

        assert_eq!(report.removed_run_ids, vec!["old-run".to_string()]);
        // Nothing was actually deleted.
        assert!(std::fs::metadata(tmp.path().join("artifacts/old-run")).is_ok());
        assert!(std::fs::metadata(tmp.path().join("artifacts/old-run/manifest.json")).is_ok());
    }
}
