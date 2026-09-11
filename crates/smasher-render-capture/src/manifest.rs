// ABOUTME: Manifest struct describing a completed capture run.
// ABOUTME: Also holds the artifact path helper deriving run/candidate output paths.

use std::path::{Path, PathBuf};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Record of a single `capture()` run, written alongside `screenshot.png`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Manifest {
    pub captured_at: DateTime<Utc>,
    pub viewport: Viewport,
    pub candidate_dir: PathBuf,
    pub exit_status: ExitStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Viewport {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum ExitStatus {
    Success,
    Failed { reason: String },
}

/// Derives a candidate's artifact directory `<artifacts_base>/<candidate_id>/`.
/// `artifacts_base` is the run's own artifact directory (e.g. from
/// `RunDirectory::manifest().directories.artifacts`), not a hardcoded path —
/// this is what keeps every tool's output under the one real run directory
/// instead of a second, CWD-relative tree.
pub fn artifact_dir(artifacts_base: &Path, candidate_id: &str) -> PathBuf {
    artifacts_base.join(candidate_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn manifest_serde_roundtrip() {
        let manifest = Manifest {
            captured_at: chrono::DateTime::parse_from_rfc3339("2026-09-08T12:00:00Z")
                .unwrap()
                .with_timezone(&chrono::Utc),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: std::path::PathBuf::from("/tmp/candidate"),
            exit_status: ExitStatus::Success,
        };

        let json = serde_json::to_string(&manifest).unwrap();
        let roundtripped: Manifest = serde_json::from_str(&json).unwrap();

        assert_eq!(manifest, roundtripped);
    }

    #[test]
    fn manifest_serde_roundtrip_failed_status() {
        let manifest = Manifest {
            captured_at: chrono::Utc::now(),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: std::path::PathBuf::from("/tmp/candidate"),
            exit_status: ExitStatus::Failed {
                reason: "boom".to_string(),
            },
        };

        let json = serde_json::to_string(&manifest).unwrap();
        let roundtripped: Manifest = serde_json::from_str(&json).unwrap();

        assert_eq!(manifest, roundtripped);
    }

    #[test]
    fn artifact_dir_joins_base_and_candidate_id() {
        let path = artifact_dir(Path::new("/data/artifacts/run-123/artifacts"), "candidate-abc");
        assert_eq!(
            path,
            std::path::PathBuf::from("/data/artifacts/run-123/artifacts/candidate-abc")
        );
    }
}
