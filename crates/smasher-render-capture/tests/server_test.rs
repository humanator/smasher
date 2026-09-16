// ABOUTME: Integration tests for the ephemeral three-mount static server.
// ABOUTME: Verifies candidate + design-kit + static mounts over a real HTTP client.

use std::path::{Path, PathBuf};

use smasher_render_capture::server::{ServerError, start_server};

fn fixture_candidate_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/candidate")
}

fn design_kit_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../design-kit")
}

fn static_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../smasher-web/static")
}

#[tokio::test]
async fn serves_candidate_and_design_kit_mounts() {
    let handle = start_server(&fixture_candidate_dir(), &design_kit_dir(), &static_dir())
        .await
        .expect("server should start against a valid candidate");

    let client = reqwest::Client::new();

    let candidate_resp = client
        .get(format!("http://{}/index.html", handle.addr))
        .send()
        .await
        .expect("request to candidate mount should succeed");
    assert_eq!(candidate_resp.status(), 200);

    let kit_resp = client
        .get(format!("http://{}/design-kit/tokens.css", handle.addr))
        .send()
        .await
        .expect("request to design-kit mount should succeed");
    assert_eq!(kit_resp.status(), 200);

    handle.shutdown().await;
}

#[tokio::test]
async fn serves_static_mount() {
    let handle = start_server(&fixture_candidate_dir(), &design_kit_dir(), &static_dir())
        .await
        .expect("server should start against a valid candidate");

    let client = reqwest::Client::new();

    let static_resp = client
        .get(format!("http://{}/static/style.css", handle.addr))
        .send()
        .await
        .expect("request to static mount should succeed");
    assert_eq!(static_resp.status(), 200);

    handle.shutdown().await;
}

#[tokio::test]
async fn missing_index_html_is_rejected_before_serving() {
    let empty_dir = tempfile::tempdir().unwrap();

    let result = start_server(empty_dir.path(), &design_kit_dir(), &static_dir()).await;

    assert!(matches!(result, Err(ServerError::MissingEntryPoint(_))));
}
