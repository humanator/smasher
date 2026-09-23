// ABOUTME: Disk-based SPA static file serving with fallback to index.html for SPA routing.
// ABOUTME: Supports configurable dist directory via SMASHER_SPA_DIST environment variable.

use std::path::PathBuf;

use axum::response::IntoResponse;
use axum::{http::StatusCode, Router};
use tower_http::services::{ServeDir, ServeFile};

use crate::state::AppState;

/// Creates a static file serving router for SPA assets.
/// Falls back to index.html for unknown paths (SPA routing pattern).
///
/// # Configuration
/// - Looks for dist directory at `SMASHER_SPA_DIST` environment variable
/// - Defaults to `../../frontend/dist` relative to the crate root
/// - Returns 404s for all requests if the directory doesn't exist
pub fn router() -> Router<AppState> {
    let dist_path = dist_path();

    // Check if dist directory exists; if not, log a warning and return a router
    // that 404s everything (graceful degradation)
    match std::fs::metadata(&dist_path) {
        Ok(metadata) if metadata.is_dir() => {
            tracing::info!(path = %dist_path.display(), "serving SPA from dist directory");
            // ServeDir does real mime-type sniffing from each file's extension
            // and its own path-traversal hardening (same as the /editor-ui,
            // /design-kit, /candidate-artifacts, /static mounts below in
            // server.rs) -- unlike the hand-rolled `read_to_string` +
            // `(StatusCode::OK, String)` handler this replaced, which stamped
            // every response `text/plain` regardless of the file served,
            // silently breaking module script and stylesheet loading in a
            // real browser (that handler's tests only ever asserted on
            // status/body, never Content-Type). Falls back to index.html
            // for any path ServeDir can't find on disk (SPA routing).
            let index_path = dist_path.join("index.html");
            let serve_dir = ServeDir::new(&dist_path).fallback(ServeFile::new(index_path));
            Router::new().fallback_service(serve_dir)
        }
        Ok(_) => {
            tracing::warn!(path = %dist_path.display(), "dist path exists but is not a directory");
            Router::new().fallback(not_found_handler)
        }
        Err(e) => {
            tracing::warn!(path = %dist_path.display(), error = %e, "SPA dist directory not found; static serving will 404");
            Router::new().fallback(not_found_handler)
        }
    }
}

/// Constructs the dist directory path.
/// Prefers `SMASHER_SPA_DIST` environment variable, falls back to default.
fn dist_path() -> PathBuf {
    if let Ok(dist) = std::env::var("SMASHER_SPA_DIST") {
        PathBuf::from(dist)
    } else {
        // Default: ../../frontend/dist relative to crate root
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap_or(&PathBuf::from("."))
            .parent()
            .unwrap_or(&PathBuf::from("."))
            .join("frontend")
            .join("dist")
    }
}

/// Fallback for when dist directory doesn't exist.
async fn not_found_handler() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "404 - SPA dist directory not available")
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use axum::http::Request;
    use serial_test::serial;
    use tower::ServiceExt;

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![])
    }

    #[tokio::test]
    #[serial]
    async fn serves_index_html_for_unknown_paths() {
        // Create a temp directory with test files
        let temp_dir = tempfile::tempdir().unwrap();
        let index_content = "<html><body>SPA Root</body></html>";
        std::fs::write(temp_dir.path().join("index.html"), index_content).unwrap();

        // Set env var to point to temp dir
        unsafe {
            std::env::set_var("SMASHER_SPA_DIST", temp_dir.path());
        }

        let app = router().with_state(test_state());

        // Request unknown path
        let req = Request::builder()
            .uri("/some/unknown/path")
            .body(axum::body::Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body = to_bytes(res.into_body(), usize::MAX).await.unwrap();
        assert_eq!(String::from_utf8_lossy(&body), index_content);

        // Cleanup
        unsafe {
            std::env::remove_var("SMASHER_SPA_DIST");
        }
    }

    #[tokio::test]
    #[serial]
    async fn serves_real_static_files() {
        let temp_dir = tempfile::tempdir().unwrap();
        std::fs::write(temp_dir.path().join("index.html"), "index").unwrap();
        std::fs::write(temp_dir.path().join("app.js"), "console.log('app');").unwrap();

        unsafe {
            std::env::set_var("SMASHER_SPA_DIST", temp_dir.path());
        }

        let app = router().with_state(test_state());

        // Request real file
        let req = Request::builder()
            .uri("/app.js")
            .body(axum::body::Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        let body = to_bytes(res.into_body(), usize::MAX).await.unwrap();
        assert_eq!(String::from_utf8_lossy(&body), "console.log('app');");

        unsafe {
            std::env::remove_var("SMASHER_SPA_DIST");
        }
    }

    // Regression test: the hand-rolled fallback handler used to return
    // every file (JS, CSS, index.html alike) as `(StatusCode::OK, String)`,
    // which axum's IntoResponse always stamps `text/plain; charset=utf-8`
    // regardless of the file it came from. A real browser refuses to
    // execute a <script type="module"> served as text/plain, so the SPA
    // never booted -- this only showed up in a real browser because every
    // prior test here only asserted on status/body, never Content-Type.
    #[tokio::test]
    #[serial]
    async fn serves_js_and_css_with_correct_content_types() {
        let temp_dir = tempfile::tempdir().unwrap();
        std::fs::write(temp_dir.path().join("index.html"), "<html></html>").unwrap();
        std::fs::write(temp_dir.path().join("app.js"), "console.log('app');").unwrap();
        std::fs::write(temp_dir.path().join("app.css"), "body { color: red; }").unwrap();

        unsafe {
            std::env::set_var("SMASHER_SPA_DIST", temp_dir.path());
        }

        let app = router().with_state(test_state());

        let js_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/app.js")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let js_content_type = js_res
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string();
        assert!(
            js_content_type.contains("javascript"),
            "expected a JS content-type, got {js_content_type:?}"
        );

        let css_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/app.css")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let css_content_type = css_res
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string();
        assert!(
            css_content_type.contains("css"),
            "expected a CSS content-type, got {css_content_type:?}"
        );

        let index_res = app
            .oneshot(
                Request::builder()
                    .uri("/some/unknown/spa/route")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let index_content_type = index_res
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string();
        assert!(
            index_content_type.contains("text/html"),
            "expected an HTML content-type for the index.html SPA fallback, got {index_content_type:?}"
        );

        unsafe {
            std::env::remove_var("SMASHER_SPA_DIST");
        }
    }

    #[tokio::test]
    #[serial]
    async fn handles_missing_dist_directory_gracefully() {
        // Use a non-existent path
        unsafe {
            std::env::set_var("SMASHER_SPA_DIST", "/nonexistent/path/to/dist");
        }

        let app = router().with_state(test_state());

        let req = Request::builder()
            .uri("/any/path")
            .body(axum::body::Body::empty())
            .unwrap();

        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        unsafe {
            std::env::remove_var("SMASHER_SPA_DIST");
        }
    }
}
