// ABOUTME: Chromiumoxide-driven screenshot capture over CDP.
// ABOUTME: Launches headless Chromium, navigates to a served URL, returns PNG bytes.

use std::path::Path;

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

impl CaptureError {
    /// Whether re-running the same capture might succeed. `MissingEntryPoint`
    /// is a permanent problem with the candidate's own contents — retrying
    /// won't produce an index.html that isn't there. `BrowserLaunch` and
    /// `Capture` cover headless-Chromium/CDP flakiness (a crashed browser
    /// process, a dropped CDP connection mid-capture — see the "oneshot
    /// canceled" case this was added for) that a fresh attempt often clears.
    pub fn is_retryable(&self) -> bool {
        match self {
            CaptureError::MissingEntryPoint(_) => false,
            CaptureError::BrowserLaunch(_) | CaptureError::Capture(_) => true,
        }
    }
}

/// Launches headless Chromium, navigates to `url`, and returns PNG bytes captured
/// at `viewport`. Shuts the browser down before returning.
pub async fn capture_screenshot(url: &str, viewport: Viewport) -> Result<Vec<u8>, CaptureError> {
    // chromiumoxide defaults to a single fixed, shared profile directory reused by
    // every launch. Leftover state from a prior run (crash flags, session restore)
    // then leaks into this one, so give each capture its own fresh profile.
    let user_data_dir =
        tempfile::tempdir().map_err(|e| CaptureError::BrowserLaunch(e.to_string()))?;

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

/// Recursively copies every file and subdirectory under `src` into `dst`,
/// creating `dst` (and any nested directories) as needed.
pub fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let dst_path = dst.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir_recursive(&entry.path(), &dst_path)?;
        } else {
            std::fs::copy(entry.path(), dst_path)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::CaptureError;

    #[test]
    fn missing_entry_point_is_not_retryable() {
        assert!(!CaptureError::MissingEntryPoint("dir".into()).is_retryable());
    }

    #[test]
    fn browser_launch_failure_is_retryable() {
        assert!(CaptureError::BrowserLaunch("launch failed".into()).is_retryable());
    }

    #[test]
    fn capture_failure_is_retryable() {
        assert!(CaptureError::Capture("oneshot canceled".into()).is_retryable());
    }
}
