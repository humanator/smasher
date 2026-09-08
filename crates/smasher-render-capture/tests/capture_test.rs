// ABOUTME: Integration test driving a real headless Chromium against the real
// ABOUTME: two-mount server, asserting a genuine PNG screenshot is produced.

use std::path::{Path, PathBuf};

use smasher_render_capture::capture::{VIEWPORT_HEIGHT, VIEWPORT_WIDTH, capture_screenshot};
use smasher_render_capture::manifest::Viewport;
use smasher_render_capture::server::start_server;

const PNG_MAGIC: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

fn fixture_candidate_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/candidate")
}

fn design_kit_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../design-kit")
}

#[tokio::test]
async fn captures_a_real_png_of_the_fixture_candidate() {
    let _ = tracing_subscriber::fmt::try_init();
    let handle = start_server(&fixture_candidate_dir(), &design_kit_dir())
        .await
        .expect("server should start against the fixture candidate");

    let url = format!("http://{}/index.html", handle.addr);
    let viewport = Viewport {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
    };
    let png = capture_screenshot(&url, viewport)
        .await
        .expect("headless Chromium should capture a screenshot");

    handle.shutdown().await;

    assert!(png.len() > PNG_MAGIC.len(), "screenshot should be non-trivial");
    assert_eq!(&png[..PNG_MAGIC.len()], &PNG_MAGIC, "output should be a valid PNG");
}
