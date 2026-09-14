// ABOUTME: Headless-Chromium screenshot capture for design-factory candidates.
// ABOUTME: Serves a candidate directory locally and captures a PNG via CDP.

pub mod backend;
pub mod capture;
pub mod manifest;
pub mod server;
pub mod testing;

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use chrono::Utc;

pub use capture::CaptureError;
pub use manifest::Manifest;

use manifest::{ExitStatus, Viewport};

/// This crate's fixed location relative to the repo's `design-kit/` directory
/// (see `SPEC-render-capture.md` assumption 4 — a repo convention, not per-call
/// configuration).
fn design_kit_dir() -> PathBuf {
    PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/../../design-kit"))
}

/// Serves `candidate_dir`, captures a screenshot at `viewport`, and writes
/// `screenshot.png` plus `manifest.json` to `output_dir`.
pub async fn capture(
    candidate_dir: &Path,
    output_dir: &Path,
    viewport: Viewport,
) -> Result<Manifest, CaptureError> {
    let handle = server::start_server(candidate_dir, &design_kit_dir())
        .await
        .map_err(|e| match e {
            server::ServerError::MissingEntryPoint(dir) => CaptureError::MissingEntryPoint(dir),
            server::ServerError::Bind(err) => CaptureError::BrowserLaunch(err.to_string()),
        })?;

    let url = format!("http://{}/index.html", handle.addr);
    let screenshot = capture::capture_screenshot(&url, viewport).await;

    handle.shutdown().await;
    let screenshot = screenshot?;

    std::fs::create_dir_all(output_dir).map_err(|e| CaptureError::Capture(e.to_string()))?;
    std::fs::write(output_dir.join("screenshot.png"), &screenshot)
        .map_err(|e| CaptureError::Capture(e.to_string()))?;
    capture::copy_dir_recursive(candidate_dir, &output_dir.join("bundle"))
        .map_err(|e| CaptureError::Capture(e.to_string()))?;

    let manifest = Manifest {
        captured_at: Utc::now(),
        viewport,
        candidate_dir: candidate_dir.to_path_buf(),
        exit_status: ExitStatus::Success,
        artifacts: vec![
            manifest::ArtifactRef {
                kind: manifest::ArtifactKind::Screenshot,
                path: "screenshot.png".to_string(),
            },
            manifest::ArtifactRef {
                kind: manifest::ArtifactKind::LiveBundle,
                path: "bundle/index.html".to_string(),
            },
        ],
        generation_params: BTreeMap::new(),
    };

    let manifest_json =
        serde_json::to_string_pretty(&manifest).map_err(|e| CaptureError::Capture(e.to_string()))?;
    std::fs::write(output_dir.join("manifest.json"), manifest_json)
        .map_err(|e| CaptureError::Capture(e.to_string()))?;

    Ok(manifest)
}

#[cfg(test)]
mod tests {
    use std::path::{Path, PathBuf};

    use super::*;
    use crate::manifest::{ExitStatus, Viewport};

    fn fixture_candidate_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/candidate")
    }

    #[tokio::test]
    async fn capture_writes_screenshot_and_manifest_to_output_dir() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
        let output_dir = tempfile::tempdir().unwrap();
        let viewport = Viewport {
            width: capture::VIEWPORT_WIDTH,
            height: capture::VIEWPORT_HEIGHT,
        };

        let manifest = capture(&fixture_candidate_dir(), output_dir.path(), viewport)
            .await
            .expect("capture should succeed against the fixture candidate");

        assert_eq!(manifest.exit_status, ExitStatus::Success);
        assert_eq!(manifest.viewport, viewport);
        assert_eq!(manifest.candidate_dir, fixture_candidate_dir());

        let screenshot_path = output_dir.path().join("screenshot.png");
        let manifest_path = output_dir.path().join("manifest.json");
        let bundle_index_path = output_dir.path().join("bundle/index.html");
        assert!(screenshot_path.is_file());
        assert!(manifest_path.is_file());
        assert!(bundle_index_path.is_file());
        assert_eq!(
            std::fs::read_to_string(&bundle_index_path).unwrap(),
            std::fs::read_to_string(fixture_candidate_dir().join("index.html")).unwrap()
        );

        assert_eq!(
            manifest.artifacts,
            vec![
                manifest::ArtifactRef {
                    kind: manifest::ArtifactKind::Screenshot,
                    path: "screenshot.png".to_string(),
                },
                manifest::ArtifactRef {
                    kind: manifest::ArtifactKind::LiveBundle,
                    path: "bundle/index.html".to_string(),
                },
            ]
        );

        let written_manifest: Manifest =
            serde_json::from_str(&std::fs::read_to_string(manifest_path).unwrap()).unwrap();
        assert_eq!(written_manifest, manifest);
    }

    #[tokio::test]
    async fn capture_copies_nested_assets_into_the_bundle() {
        let _guard = tokio::task::spawn_blocking(crate::testing::acquire_browser_test_lock)
            .await
            .unwrap();
        let output_dir = tempfile::tempdir().unwrap();
        let viewport = Viewport {
            width: capture::VIEWPORT_WIDTH,
            height: capture::VIEWPORT_HEIGHT,
        };
        let candidate_dir =
            Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/candidate-with-assets");

        capture(&candidate_dir, output_dir.path(), viewport)
            .await
            .expect("capture should succeed against the fixture candidate");

        let bundled_asset = output_dir.path().join("bundle/assets/style.css");
        assert!(bundled_asset.is_file());
        assert_eq!(
            std::fs::read_to_string(&bundled_asset).unwrap(),
            std::fs::read_to_string(candidate_dir.join("assets/style.css")).unwrap()
        );
    }

    #[tokio::test]
    async fn capture_rejects_a_candidate_missing_index_html() {
        let candidate_dir = tempfile::tempdir().unwrap();
        let output_dir = tempfile::tempdir().unwrap();
        let viewport = Viewport {
            width: capture::VIEWPORT_WIDTH,
            height: capture::VIEWPORT_HEIGHT,
        };

        let result = capture(candidate_dir.path(), output_dir.path(), viewport).await;

        assert!(matches!(result, Err(CaptureError::MissingEntryPoint(_))));
    }
}
