// ABOUTME: Manifest struct describing a completed capture run.
// ABOUTME: Also holds the artifact path helper deriving run/candidate output paths.

use std::collections::BTreeMap;
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
    #[serde(default)]
    pub artifacts: Vec<ArtifactRef>,
    #[serde(default)]
    pub generation_params: BTreeMap<String, String>,
}

/// A single stored artifact for a candidate, beyond the historical bare
/// `screenshot.png`. `path` is relative to the candidate's own artifact directory.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ArtifactRef {
    pub kind: ArtifactKind,
    pub path: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ArtifactKind {
    Screenshot,
    /// A persisted, standalone-servable copy of the candidate directory.
    LiveBundle,
    /// Reserved for a future interaction-recording producer; unused today.
    Recording,
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
            artifacts: Vec::new(),
            generation_params: BTreeMap::new(),
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
            artifacts: Vec::new(),
            generation_params: BTreeMap::new(),
        };

        let json = serde_json::to_string(&manifest).unwrap();
        let roundtripped: Manifest = serde_json::from_str(&json).unwrap();

        assert_eq!(manifest, roundtripped);
    }

    #[test]
    fn manifest_serde_roundtrip_with_artifacts() {
        let manifest = Manifest {
            captured_at: chrono::Utc::now(),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: std::path::PathBuf::from("/tmp/candidate"),
            exit_status: ExitStatus::Success,
            artifacts: vec![
                ArtifactRef {
                    kind: ArtifactKind::Screenshot,
                    path: "screenshot.png".to_string(),
                },
                ArtifactRef {
                    kind: ArtifactKind::LiveBundle,
                    path: "bundle/index.html".to_string(),
                },
            ],
            generation_params: BTreeMap::from([
                ("prompt".to_string(), "a red button".to_string()),
                ("persona".to_string(), "designer".to_string()),
            ]),
        };

        let json = serde_json::to_string(&manifest).unwrap();
        let roundtripped: Manifest = serde_json::from_str(&json).unwrap();

        assert_eq!(manifest, roundtripped);
    }

    #[test]
    fn manifest_deserializes_without_artifacts_or_generation_params_keys_for_backward_compat() {
        let legacy_json = serde_json::json!({
            "captured_at": "2026-09-08T12:00:00Z",
            "viewport": {"width": 1280, "height": 800},
            "candidate_dir": "/tmp/candidate",
            "exit_status": {"status": "success"}
        })
        .to_string();

        let manifest: Manifest = serde_json::from_str(&legacy_json).unwrap();

        assert_eq!(manifest.artifacts, Vec::new());
        assert_eq!(manifest.generation_params, BTreeMap::new());
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
