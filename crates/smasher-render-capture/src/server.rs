// ABOUTME: Ephemeral two-mount static server (axum + tower-http) for candidates.
// ABOUTME: Mounts a candidate directory at `/` and `design-kit/` at `/design-kit`.

use std::net::SocketAddr;
use std::path::Path;

use thiserror::Error;
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use tokio::task::JoinHandle;
use tower_http::services::ServeDir;

#[derive(Debug, Error)]
pub enum ServerError {
    #[error("candidate directory has no index.html: {0}")]
    MissingEntryPoint(String),
    #[error("failed to bind server: {0}")]
    Bind(#[from] std::io::Error),
}

/// A running ephemeral server. Dropping this without calling [`shutdown`](Self::shutdown)
/// leaves the server task running until the process exits; callers should always
/// shut it down once the screenshot has been captured.
pub struct ServerHandle {
    pub addr: SocketAddr,
    shutdown_tx: oneshot::Sender<()>,
    join_handle: JoinHandle<()>,
}

impl ServerHandle {
    pub async fn shutdown(self) {
        let _ = self.shutdown_tx.send(());
        let _ = self.join_handle.await;
    }
}

/// Starts the ephemeral two-mount server on an OS-assigned port: `candidate_dir` at
/// `/`, `design_kit_dir` at `/design-kit`. Returns once the server is bound and
/// accepting connections.
pub async fn start_server(
    candidate_dir: &Path,
    design_kit_dir: &Path,
) -> Result<ServerHandle, ServerError> {
    if !candidate_dir.join("index.html").is_file() {
        return Err(ServerError::MissingEntryPoint(
            candidate_dir.display().to_string(),
        ));
    }

    let app = axum::Router::new()
        .nest_service("/design-kit", ServeDir::new(design_kit_dir))
        .fallback_service(ServeDir::new(candidate_dir));

    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let addr = listener.local_addr()?;

    let (shutdown_tx, shutdown_rx) = oneshot::channel();
    let join_handle = tokio::spawn(async move {
        let _ = axum::serve(listener, app)
            .with_graceful_shutdown(async {
                let _ = shutdown_rx.await;
            })
            .await;
    });

    Ok(ServerHandle {
        addr,
        shutdown_tx,
        join_handle,
    })
}
