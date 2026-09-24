// ABOUTME: Reconstructs RunRecords from on-disk run directories at server startup.
// ABOUTME: Lets a run survive a `smasher serve` restart without losing its history.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::AtomicU64;

use smasher_attractor::events::{PipelineEventEmitter, PipelineEventLog};
use smasher_attractor::http_interviewer::HttpInterviewer;
use smasher_attractor::log_sink::LogEntry;
use smasher_attractor::run_dir::RunDirectory;
use smasher_attractor::state::RunStatus;
use tokio_util::sync::CancellationToken;

use crate::state::RunRecord;

/// Maps a manifest's persisted status string back to `RunStatus`. A run
/// found `"Running"` at server startup is definitionally stale -- no live
/// engine task exists for it in this fresh process -- so it normalizes to
/// `Aborted` rather than staying `Running` forever.
fn normalize_status(status: Option<&str>) -> Option<RunStatus> {
    match status {
        Some("Running") => Some(RunStatus::Aborted),
        Some("Completed") => Some(RunStatus::Completed),
        Some("Failed") => Some(RunStatus::Failed),
        Some("Aborted") => Some(RunStatus::Aborted),
        _ => None,
    }
}

/// Replays `{root}/events/events.jsonl` into a fresh `PipelineEventLog`, in
/// the order the events were originally appended. A missing or empty file
/// is fine -- zero events, not an error.
fn replay_event_log(root: &std::path::Path) -> PipelineEventLog {
    let log = PipelineEventLog::new();
    let Ok(contents) = std::fs::read_to_string(root.join("events").join("events.jsonl")) else {
        return log;
    };
    for line in contents.lines() {
        if line.trim().is_empty() {
            continue;
        }
        match serde_json::from_str::<LogEntry>(line) {
            Ok(entry) => log.push(entry.event),
            Err(e) => {
                tracing::warn!(error = %e, "skipping unparseable event log line during rehydration");
            }
        }
    }
    log
}

/// Reconstructs `RunRecord`s from every parseable run directory under
/// `{data_dir}/artifacts/`. A run directory that's missing its `.dot`
/// source, has an unparseable manifest, or has an unrecognized status is
/// skipped with a warning rather than sinking the whole scan or failing
/// server startup -- one bad directory must never block the others.
pub async fn rehydrate_runs(data_dir: &str) -> HashMap<String, RunRecord> {
    let mut rehydrated = HashMap::new();

    let artifacts_dir = std::path::Path::new(data_dir).join("artifacts");
    let Ok(entries) = std::fs::read_dir(&artifacts_dir) else {
        return rehydrated;
    };

    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let run_directory = match RunDirectory::open(&path) {
            Ok(run_directory) => run_directory,
            Err(e) => {
                tracing::warn!(path = %path.display(), error = %e, "skipping run directory with unparseable manifest during rehydration");
                continue;
            }
        };
        let manifest = run_directory.manifest();

        let dot_source = match std::fs::read_to_string(path.join("graph.dot")) {
            Ok(dot_source) => dot_source,
            Err(e) => {
                tracing::warn!(run_id = %manifest.run_id, error = %e, "skipping run with missing graph.dot during rehydration");
                continue;
            }
        };

        let graph = match smasher_attractor::dot::parser::parse(&dot_source)
            .map_err(|e| e.to_string())
            .and_then(|dot_graph| {
                smasher_attractor::graph::resolve(&dot_graph).map_err(|e| e.to_string())
            }) {
            Ok(graph) => graph,
            Err(e) => {
                tracing::warn!(run_id = %manifest.run_id, error = %e, "skipping run with unparseable graph.dot during rehydration");
                continue;
            }
        };

        let status = match normalize_status(manifest.status.as_deref()) {
            Some(status) => status,
            None => {
                tracing::warn!(run_id = %manifest.run_id, status = ?manifest.status, "skipping run with unrecognized status during rehydration");
                continue;
            }
        };

        let event_log = replay_event_log(&manifest.directories.root);
        let run_id = manifest.run_id.clone();
        let record = RunRecord {
            id: run_id.clone(),
            dot_source,
            graph,
            status,
            started_at: manifest.created_at,
            completed_at: manifest.completed_at,
            emitter: Arc::new(PipelineEventEmitter::default()),
            event_log: Arc::new(event_log),
            cancellation: CancellationToken::new(),
            interviewer: HttpInterviewer::new(),
            variables: HashMap::new(),
            error: None,
            input_tokens: Arc::new(AtomicU64::new(manifest.input_tokens)),
            output_tokens: Arc::new(AtomicU64::new(manifest.output_tokens)),
            run_working_dir: Some(manifest.directories.root.display().to_string()),
            workflow_id: manifest.workflow_id.clone(),
        };

        rehydrated.insert(run_id, record);
    }

    rehydrated
}

#[cfg(test)]
mod tests {
    use super::*;
    use smasher_attractor::events::PipelineEvent;

    fn write_manifest(root: &std::path::Path, run_id: &str, status: Option<&str>) {
        std::fs::create_dir_all(root.join("events")).unwrap();
        let manifest = serde_json::json!({
            "run_id": run_id,
            "graph_name": "g",
            "graph_hash": "hash",
            "created_at": "2025-01-01T00:00:00Z",
            "layout_version": 1,
            "directories": {
                "root": root.display().to_string(),
                "checkpoints": root.join("checkpoints").display().to_string(),
                "node_logs": root.join("nodes").display().to_string(),
                "artifacts": root.join("artifacts").display().to_string(),
                "events": root.join("events").display().to_string(),
            },
            "workflow_id": serde_json::Value::Null,
            "status": status,
            "input_tokens": 10,
            "output_tokens": 20,
            "completed_at": serde_json::Value::Null,
        });
        std::fs::write(
            root.join("manifest.json"),
            serde_json::to_string_pretty(&manifest).unwrap(),
        )
        .unwrap();
    }

    #[tokio::test]
    async fn missing_artifacts_dir_rehydrates_to_empty_map() {
        let tmp = tempfile::tempdir().unwrap();
        let rehydrated =
            rehydrate_runs(&tmp.path().join("no-such-dir").display().to_string()).await;
        assert!(rehydrated.is_empty());
    }

    #[tokio::test]
    async fn empty_artifacts_dir_rehydrates_to_empty_map() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(tmp.path().join("artifacts")).unwrap();
        let rehydrated = rehydrate_runs(&tmp.path().display().to_string()).await;
        assert!(rehydrated.is_empty());
    }

    /// Serializes a `LogEntry` the same way `FileLogSink::append` does, so
    /// fixtures match the real on-disk JSONL shape instead of hand-rolled
    /// JSON that might drift from `PipelineEvent`'s actual field set.
    fn log_entry_line(sequence: u64, event: PipelineEvent) -> String {
        let mut line = serde_json::to_string(&LogEntry { sequence, event }).unwrap();
        line.push('\n');
        line
    }

    #[tokio::test]
    async fn running_status_normalizes_to_aborted() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("artifacts").join("run-1");
        std::fs::create_dir_all(&root).unwrap();
        write_manifest(&root, "run-1", Some("Running"));
        std::fs::write(root.join("graph.dot"), "digraph { a -> b }").unwrap();
        std::fs::write(
            root.join("events").join("events.jsonl"),
            log_entry_line(
                0,
                PipelineEvent::PipelineStarted {
                    graph_name: "g".to_string(),
                    timestamp: chrono::Utc::now(),
                },
            ),
        )
        .unwrap();

        let rehydrated = rehydrate_runs(&tmp.path().display().to_string()).await;
        let record = rehydrated.get("run-1").expect("run-1 should rehydrate");
        assert_eq!(record.status, RunStatus::Aborted);
        assert_eq!(
            record
                .input_tokens
                .load(std::sync::atomic::Ordering::Relaxed),
            10
        );
        assert_eq!(
            record
                .output_tokens
                .load(std::sync::atomic::Ordering::Relaxed),
            20
        );
    }

    #[tokio::test]
    async fn missing_graph_dot_is_skipped_without_failing_the_scan() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("artifacts").join("run-no-dot");
        std::fs::create_dir_all(&root).unwrap();
        write_manifest(&root, "run-no-dot", Some("Completed"));
        // No graph.dot written.

        let rehydrated = rehydrate_runs(&tmp.path().display().to_string()).await;
        assert!(rehydrated.is_empty());
    }

    #[tokio::test]
    async fn corrupt_manifest_is_skipped_while_valid_siblings_still_rehydrate() {
        let tmp = tempfile::tempdir().unwrap();

        let bad_root = tmp.path().join("artifacts").join("run-corrupt");
        std::fs::create_dir_all(&bad_root).unwrap();
        std::fs::write(bad_root.join("manifest.json"), "{ not valid json").unwrap();

        let good_root = tmp.path().join("artifacts").join("run-good");
        std::fs::create_dir_all(&good_root).unwrap();
        write_manifest(&good_root, "run-good", Some("Completed"));
        std::fs::write(good_root.join("graph.dot"), "digraph { a -> b }").unwrap();

        let rehydrated = rehydrate_runs(&tmp.path().display().to_string()).await;
        assert_eq!(rehydrated.len(), 1);
        assert!(rehydrated.contains_key("run-good"));
        assert!(!rehydrated.contains_key("run-corrupt"));
    }

    #[tokio::test]
    async fn event_log_replay_preserves_order() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join("artifacts").join("run-events");
        std::fs::create_dir_all(&root).unwrap();
        write_manifest(&root, "run-events", Some("Completed"));
        std::fs::write(root.join("graph.dot"), "digraph { a -> b }").unwrap();

        let jsonl = log_entry_line(
            0,
            PipelineEvent::PipelineStarted {
                graph_name: "g".to_string(),
                timestamp: chrono::Utc::now(),
            },
        ) + &log_entry_line(
            1,
            PipelineEvent::PipelineCompleted {
                outcome: smasher_attractor::state::Outcome::success(),
                total_nodes: 2,
                duration_ms: 10,
                timestamp: chrono::Utc::now(),
            },
        );
        std::fs::write(root.join("events").join("events.jsonl"), jsonl).unwrap();

        let rehydrated = rehydrate_runs(&tmp.path().display().to_string()).await;
        let record = rehydrated.get("run-events").unwrap();
        let events = record.event_log.events();
        assert_eq!(events.len(), 2);
        assert!(matches!(events[0], PipelineEvent::PipelineStarted { .. }));
        assert!(matches!(events[1], PipelineEvent::PipelineCompleted { .. }));
    }
}
