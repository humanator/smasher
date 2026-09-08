// ABOUTME: Chromiumoxide-driven screenshot capture over CDP.
// ABOUTME: Launches headless Chromium, navigates to a served URL, returns PNG bytes.

use chromiumoxide::browser::{Browser, BrowserConfig};
use chromiumoxide::cdp::browser_protocol::page::CaptureScreenshotFormat;
use chromiumoxide::page::ScreenshotParams;
use futures::StreamExt;
use thiserror::Error;

use crate::manifest::Viewport;

/// Fixed capture viewport for this slice (see `SPEC-render-capture.md` assumption 9).
pub const VIEWPORT_WIDTH: u32 = 1280;
pub const VIEWPORT_HEIGHT: u32 = 800;

#[derive(Debug, Error)]
pub enum CaptureError {
    #[error("candidate directory has no index.html: {0}")]
    MissingEntryPoint(String),
    #[error("failed to launch headless browser: {0}")]
    BrowserLaunch(String),
    #[error("screenshot capture failed: {0}")]
    Capture(String),
}

/// Launches headless Chromium, navigates to `url`, and returns PNG bytes captured
/// at `viewport`. Shuts the browser down before returning.
pub async fn capture_screenshot(url: &str, viewport: Viewport) -> Result<Vec<u8>, CaptureError> {
    // chromiumoxide defaults to a single fixed, shared profile directory reused by
    // every launch. Leftover state from a prior run (crash flags, session restore)
    // then leaks into this one, so give each capture its own fresh profile.
    let user_data_dir = tempfile::tempdir().map_err(|e| CaptureError::BrowserLaunch(e.to_string()))?;

    let config = BrowserConfig::builder()
        .window_size(viewport.width, viewport.height)
        .user_data_dir(user_data_dir.path())
        // Real Google Chrome's default New Tab Page embeds a "OneGoogleBar" iframe
        // that fires a navigation event chromiumoxide's CDP bindings can't
        // deserialize, killing the whole CDP connection. Starting on a blank tab
        // avoids the default tab ever loading that page.
        .arg("about:blank")
        .build()
        .map_err(CaptureError::BrowserLaunch)?;

    let (mut browser, mut handler) = Browser::launch(config)
        .await
        .map_err(|e| CaptureError::BrowserLaunch(e.to_string()))?;

    let handler_task = tokio::spawn(async move {
        while let Some(event) = handler.next().await {
            if event.is_err() {
                break;
            }
        }
    });

    let page = browser
        .new_page(url)
        .await
        .map_err(|e| CaptureError::Capture(e.to_string()))?;

    let png = page
        .screenshot(
            ScreenshotParams::builder()
                .format(CaptureScreenshotFormat::Png)
                .build(),
        )
        .await
        .map_err(|e| CaptureError::Capture(e.to_string()));

    let _ = browser.close().await;
    handler_task.abort();

    png
}
