// ABOUTME: Axum router assembly, binding, and graceful shutdown for the web server.
// ABOUTME: Configures routes, static file serving, CORS, and listens on port 21541.

use std::net::SocketAddr;

use axum::Router;
use tokio_util::sync::CancellationToken;
use tower_http::services::ServeDir;

use crate::state::AppState;

/// Default port for the smasher-web dashboard (5MA5H in leet).
pub const DEFAULT_PORT: u16 = 21541;

/// Absolute path to the repo's shared `design-kit/` component library,
/// resolved relative to this crate's manifest dir rather than the process's
/// cwd (which varies depending on how `smasher` was invoked).
pub fn design_kit_dir() -> std::path::PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../design-kit")
}

/// Build the complete axum router with all routes and middleware.
pub fn build_router(state: AppState) -> Router {
    let api_routes = crate::routes::api::router();
    let editor_api_routes = crate::routes::editor_api::router();
    let question_routes = crate::routes::questions::router();
    let gallery_routes = crate::routes::gallery::router();
    let static_files_routes = crate::routes::static_files::router();

    // Resolve static dir relative to the crate manifest, not the cwd.
    let static_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("static");
    // Every run's candidates live under `{data_dir}/artifacts/<run_id>/artifacts/`
    // (the same tree `RunDirectory` creates), so this mount root plus the
    // `/candidate-artifacts/<run_id>/artifacts/<candidate_id>/...` URL scheme
    // resolves straight through with no rewriting.
    let candidate_artifacts_dir = std::path::Path::new(&state.data_dir).join("artifacts");
    // A persisted candidate bundle's index.html references `/design-kit/...`
    // absolute paths (same convention as smasher-render-capture's own two-mount
    // server), so this mount has to exist for a bundle to render correctly here.
    let design_kit_dir = design_kit_dir();
    // Task 4's compiled `<workflow-canvas>` custom-element bundle
    // (`workflow-canvas.js` + `editor-ui.css`), checked into git rather than
    // built at Cargo build time (plan's Architecture Decisions -- no CI Node
    // setup exists to build it otherwise). Served straight out of
    // `editor-ui/dist/` rather than copied into `static/`, matching the
    // `design_kit_dir` mount's own pattern of pointing `ServeDir` at a
    // source-tree directory instead of duplicating files.
    let editor_ui_dist_dir =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("editor-ui/dist");

    Router::new()
        .merge(api_routes)
        .merge(editor_api_routes)
        .merge(question_routes)
        .merge(gallery_routes)
        // Merged (not nested under a prefix) so its fallback becomes the
        // whole router's fallback: anything not matched by the routes above
        // falls through to the SPA's serve-file-or-index.html handler at `/`.
        .merge(static_files_routes.with_state(state.clone()))
        .nest_service("/static", ServeDir::new(static_dir))
        .nest_service(
            "/candidate-artifacts",
            ServeDir::new(candidate_artifacts_dir),
        )
        .nest_service("/design-kit", ServeDir::new(design_kit_dir))
        .nest_service("/editor-ui", ServeDir::new(editor_ui_dist_dir))
        .with_state(state)
}

/// Configuration for the web dashboard server.
pub struct ServerConfig {
    pub port: u16,
    pub host: [u8; 4],
    pub model: String,
    /// Provider override for `model`, bypassing model-name-based inference —
    /// needed for providers whose model names (e.g. Ollama's
    /// `gemma4:31b-cloud`) have no recognizable prefix to infer from.
    pub provider: Option<String>,
    pub data_dir: String,
    pub workflow_dirs: Vec<String>,
}

/// Return the default data directory for smasher (~/.smasher).
///
/// Override with SMASHER_DATA_DIR env var.
pub fn default_data_dir() -> String {
    if let Ok(dir) = std::env::var("SMASHER_DATA_DIR") {
        return dir;
    }
    dirs::home_dir()
        .map(|h| h.join(".smasher").display().to_string())
        .unwrap_or_else(|| ".smasher".into())
}

/// Parse the comma-separated `SMASHER_WORKFLOWS_DIR` env var value into a
/// list of configured workflow directories, falling back to `["examples"]`
/// when unset. Pure (takes the already-read env value) so it's testable
/// without touching global process state.
fn parse_workflow_dirs_env(env_val: Option<&str>) -> Vec<String> {
    match env_val {
        Some(val) => val.split(',').map(|s| s.trim().to_string()).collect(),
        None => vec!["examples".to_string()],
    }
}

/// Return the default configured workflow directories, from
/// `SMASHER_WORKFLOWS_DIR` (comma-separated) or `["examples"]` if unset.
pub fn default_workflow_dirs() -> Vec<String> {
    parse_workflow_dirs_env(std::env::var("SMASHER_WORKFLOWS_DIR").ok().as_deref())
}

/// Merge the configured workflow directories with the always-scanned
/// `{data_dir}/workflows` root, enforcing that invariant exactly once at
/// the `ServerConfig` -> `AppState` boundary. Deduplicates so passing
/// `{data_dir}/workflows` explicitly doesn't produce two scans of it.
pub fn effective_workflow_dirs(data_dir: &str, configured: &[String]) -> Vec<String> {
    let required = format!("{data_dir}/workflows");
    let mut dirs: Vec<String> = configured.to_vec();
    if !dirs.contains(&required) {
        dirs.push(required);
    }
    dirs
}

impl Default for ServerConfig {
    fn default() -> Self {
        let port = std::env::var("SMASHER_WEB_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(DEFAULT_PORT);

        let host = match std::env::var("SMASHER_WEB_HOST").ok().as_deref() {
            Some("0.0.0.0") => [0, 0, 0, 0],
            _ => [127, 0, 0, 1],
        };

        let model =
            std::env::var("SMASHER_MODEL").unwrap_or_else(|_| "claude-sonnet-4-20250514".into());

        let provider = std::env::var("SMASHER_PROVIDER").ok();

        let data_dir = default_data_dir();
        let workflow_dirs = default_workflow_dirs();

        Self {
            port,
            host,
            model,
            provider,
            data_dir,
            workflow_dirs,
        }
    }
}

/// Start the web server with default configuration from env vars.
pub async fn run() -> Result<(), Box<dyn std::error::Error>> {
    run_with_config(ServerConfig::default()).await
}

/// Failure to bring the web server up.
#[derive(Debug, thiserror::Error)]
pub enum ServerError {
    #[error(
        "no API keys found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or OLLAMA_API_KEY."
    )]
    NoApiKeys,

    #[error("failed to bind {addr}: {source}")]
    Bind {
        addr: SocketAddr,
        source: std::io::Error,
    },
}

/// A server whose listener is bound and which is serving on a spawned task.
pub struct RunningServer {
    /// The actual bound address (the real port when the config asked for 0).
    pub addr: SocketAddr,
    /// Completes once the shutdown token is cancelled and connections drain.
    pub handle: tokio::task::JoinHandle<std::io::Result<()>>,
}

/// Start the web server with explicit configuration.
pub async fn run_with_config(config: ServerConfig) -> Result<(), Box<dyn std::error::Error>> {
    let shutdown = CancellationToken::new();
    let server = start(config, shutdown.clone()).await?;
    tokio::spawn(async move {
        shutdown_signal().await;
        shutdown.cancel();
    });
    server.handle.await??;
    Ok(())
}

/// Bind the listener and start serving on a spawned task, returning once the
/// address is bound so callers know the server is ready to accept
/// connections. Serving stops when `shutdown` is cancelled.
pub async fn start(
    config: ServerConfig,
    shutdown: CancellationToken,
) -> Result<RunningServer, ServerError> {
    let client = smasher_llm::client::Client::from_env();
    if client.registered_providers().is_empty() {
        return Err(ServerError::NoApiKeys);
    }
    bind_and_serve(config, client, shutdown).await
}

async fn bind_and_serve(
    config: ServerConfig,
    client: smasher_llm::client::Client,
    shutdown: CancellationToken,
) -> Result<RunningServer, ServerError> {
    tracing::info!(data_dir = %config.data_dir, model = %config.model, provider = ?config.provider, "agent configuration");

    let workflow_dirs = effective_workflow_dirs(&config.data_dir, &config.workflow_dirs);
    let state = AppState::new(
        client,
        config.model,
        config.provider,
        config.data_dir,
        workflow_dirs,
    );
    let rehydrated = crate::rehydrate::rehydrate_runs(&state.data_dir).await;
    state.runs.write().await.extend(rehydrated);
    let app = build_router(state);

    let requested = SocketAddr::from((config.host, config.port));
    let listener = tokio::net::TcpListener::bind(requested)
        .await
        .map_err(|source| ServerError::Bind {
            addr: requested,
            source,
        })?;
    let addr = listener.local_addr().map_err(|source| ServerError::Bind {
        addr: requested,
        source,
    })?;
    tracing::info!(%addr, "smasher dashboard starting");

    let handle = tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async move { shutdown.cancelled().await })
            .await
    });

    Ok(RunningServer { addr, handle })
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install ctrl+c handler");
    tracing::info!("shutdown signal received, draining connections...");
    // SSE streams for active runs stay open indefinitely, which prevents
    // graceful shutdown from completing. Force exit after a short grace period.
    tokio::spawn(async {
        tokio::time::sleep(std::time::Duration::from_secs(3)).await;
        tracing::info!("shutdown timeout reached, exiting");
        std::process::exit(0);
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[test]
    fn default_port_is_21541() {
        assert_eq!(DEFAULT_PORT, 21541);
    }

    fn test_state() -> AppState {
        let client = smasher_llm::client::Client::from_env();
        AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![])
    }

    #[test]
    fn parse_workflow_dirs_env_defaults_to_examples_when_unset() {
        assert_eq!(parse_workflow_dirs_env(None), vec!["examples".to_string()]);
    }

    #[test]
    fn parse_workflow_dirs_env_splits_comma_separated_value() {
        assert_eq!(
            parse_workflow_dirs_env(Some("a, b ,c")),
            vec!["a".to_string(), "b".to_string(), "c".to_string()]
        );
    }

    #[test]
    fn effective_workflow_dirs_appends_data_dir_workflows_when_absent() {
        assert_eq!(
            effective_workflow_dirs("/tmp/data", &["examples".to_string()]),
            vec!["examples".to_string(), "/tmp/data/workflows".to_string()]
        );
    }

    #[test]
    fn effective_workflow_dirs_does_not_duplicate_data_dir_workflows() {
        assert_eq!(
            effective_workflow_dirs(
                "/tmp/data",
                &["examples".to_string(), "/tmp/data/workflows".to_string()]
            ),
            vec!["examples".to_string(), "/tmp/data/workflows".to_string()]
        );
    }

    #[tokio::test]
    async fn candidate_artifacts_mount_serves_a_real_file() {
        let data_dir = tempfile::tempdir().unwrap();
        let dir = data_dir
            .path()
            .join("artifacts/run-server-test/artifacts/candidate-server-test");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("screenshot.png"), b"not a real png, just bytes").unwrap();

        let client = smasher_llm::client::Client::from_env();
        let state = AppState::new(
            client,
            "test-model".into(),
            None,
            data_dir.path().display().to_string(),
            vec![],
        );
        let app = build_router(state);
        let req = Request::builder()
            .uri("/candidate-artifacts/run-server-test/artifacts/candidate-server-test/screenshot.png")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_eq!(resp.status(), StatusCode::OK);
        let content_type = resp
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string();
        assert_eq!(content_type, "image/png");
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        assert_eq!(&body[..], b"not a real png, just bytes");
    }

    #[tokio::test]
    async fn candidate_artifacts_mount_does_not_escape_its_root() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/candidate-artifacts/..%2f..%2fCargo.toml")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_ne!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn static_mount_is_unaffected_by_the_new_candidate_artifacts_mount() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/static/style.css")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn design_kit_mount_serves_a_real_file() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/design-kit/tokens.css")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn design_kit_mount_does_not_escape_its_root() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/design-kit/..%2f..%2fCargo.toml")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_ne!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn editor_ui_mount_serves_the_compiled_workflow_canvas_bundle() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/editor-ui/workflow-canvas.js")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_eq!(resp.status(), StatusCode::OK);
        let content_type = resp
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string();
        assert!(content_type.contains("javascript"));
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        assert!(!body.is_empty());
    }

    #[tokio::test]
    async fn editor_ui_mount_serves_the_compiled_css() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/editor-ui/editor-ui.css")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        assert!(!body.is_empty());
    }

    // Bare `#[serial]` (default, unnamed group) -- deliberately the *same*
    // lock static_files.rs's own SMASHER_SPA_DIST tests use (both modules
    // are compiled into one test binary), so this test can't race them for
    // the env var.
    #[tokio::test]
    #[serial_test::serial]
    async fn root_serves_the_spa_not_the_old_dashboard() {
        let temp_dir = tempfile::tempdir().unwrap();
        let index_content = "<html><body>real SPA build</body></html>";
        std::fs::write(temp_dir.path().join("index.html"), index_content).unwrap();

        unsafe {
            std::env::set_var("SMASHER_SPA_DIST", temp_dir.path());
        }

        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        unsafe {
            std::env::remove_var("SMASHER_SPA_DIST");
        }

        assert_eq!(resp.status(), StatusCode::OK);
        let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        assert_eq!(String::from_utf8_lossy(&body), index_content);
    }

    fn ephemeral_config(data_dir: &std::path::Path) -> ServerConfig {
        ServerConfig {
            port: 0,
            host: [127, 0, 0, 1],
            model: "test-model".into(),
            provider: None,
            data_dir: data_dir.display().to_string(),
            workflow_dirs: vec![],
        }
    }

    #[tokio::test]
    async fn bind_and_serve_on_port_zero_returns_a_real_loopback_port_serving_health() {
        let data_dir = tempfile::tempdir().unwrap();
        let shutdown = CancellationToken::new();

        let server = bind_and_serve(
            ephemeral_config(data_dir.path()),
            smasher_llm::client::Client::new(),
            shutdown.clone(),
        )
        .await
        .unwrap();

        assert_eq!(server.addr.ip(), std::net::Ipv4Addr::LOCALHOST);
        assert_ne!(server.addr.port(), 0);
        let resp = reqwest::get(format!("http://{}/api/health", server.addr))
            .await
            .unwrap();
        assert_eq!(resp.status(), reqwest::StatusCode::OK);

        shutdown.cancel();
    }

    #[tokio::test]
    async fn bind_and_serve_on_an_already_bound_port_errors_naming_the_address() {
        let data_dir = tempfile::tempdir().unwrap();
        let occupied = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = occupied.local_addr().unwrap().port();
        let mut config = ephemeral_config(data_dir.path());
        config.port = port;

        let err = bind_and_serve(
            config,
            smasher_llm::client::Client::new(),
            CancellationToken::new(),
        )
        .await
        .err()
        .expect("binding an occupied port must fail");

        assert!(matches!(err, ServerError::Bind { .. }));
        assert!(err.to_string().contains(&format!("127.0.0.1:{port}")));
    }

    #[tokio::test]
    async fn cancelling_the_shutdown_token_stops_the_server() {
        let data_dir = tempfile::tempdir().unwrap();
        let shutdown = CancellationToken::new();
        let server = bind_and_serve(
            ephemeral_config(data_dir.path()),
            smasher_llm::client::Client::new(),
            shutdown.clone(),
        )
        .await
        .unwrap();

        shutdown.cancel();
        let result = tokio::time::timeout(std::time::Duration::from_secs(5), server.handle)
            .await
            .expect("server should stop promptly after cancel");

        assert!(result.unwrap().is_ok());
        assert!(tokio::net::TcpStream::connect(server.addr).await.is_err());
    }

    #[tokio::test]
    async fn editor_ui_mount_does_not_escape_its_root() {
        let app = build_router(test_state());
        let req = Request::builder()
            .uri("/editor-ui/..%2f..%2fCargo.toml")
            .body(Body::empty())
            .unwrap();
        let resp = app.oneshot(req).await.unwrap();

        assert_ne!(resp.status(), StatusCode::OK);
    }
}
