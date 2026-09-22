// ABOUTME: Disk-based SPA static file serving with fallback to index.html for SPA routing.
// ABOUTME: Supports configurable dist directory via SMASHER_SPA_DIST environment variable.

use std::path::PathBuf;

use axum::response::IntoResponse;
use axum::{http::StatusCode, Router};

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
            // Create router with SPA fallback: serve file if exists, fallback to index.html
            Router::new()
                .fallback(axum::routing::any(
                    spa_fallback_handler,
                ))
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

/// SPA fallback handler: tries to serve the requested file, falls back to index.html.
async fn spa_fallback_handler(
    req: axum::http::Request<axum::body::Body>,
) -> impl IntoResponse {
    let dist_path = dist_path();
    let path_str = req.uri().path().trim_start_matches('/');

    // Try to serve the requested file first
    let file_path = dist_path.join(path_str);

    // Security check: ensure the file is within dist_path and try to serve it
    if let (Ok(canonical_file), Ok(canonical_dist)) = (
        std::fs::canonicalize(&file_path),
        std::fs::canonicalize(&dist_path),
    )
        && canonical_file.starts_with(&canonical_dist)
            && let Ok(content) = tokio::fs::read_to_string(&file_path).await {
                return (StatusCode::OK, content).into_response();
            }

    // File not found or security check failed, try index.html fallback
    let index_path = dist_path.join("index.html");
    match tokio::fs::read_to_string(&index_path).await {
        Ok(content) => (StatusCode::OK, content).into_response(),
        Err(_) => (StatusCode::NOT_FOUND, "404 - SPA index not found").into_response(),
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
