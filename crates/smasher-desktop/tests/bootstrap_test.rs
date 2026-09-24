// ABOUTME: Headless integration test: boots the embedded server from the desktop config, no window.
// ABOUTME: Proves it serves health + the SPA, is reachable only on loopback, and stops on cancel.

use std::net::{IpAddr, SocketAddr, UdpSocket};
use std::path::PathBuf;
use std::time::Duration;

use smasher_web::server::RunningServer;
use tokio_util::sync::CancellationToken;

/// Boot the server exactly as the desktop does, except for an ephemeral port
/// (debug builds default to 21541, which `smasher serve` may already hold) and
/// a throwaway data dir.
async fn boot(data_dir: &std::path::Path, shutdown: CancellationToken) -> RunningServer {
    let mut config = smasher_desktop::bootstrap::server_config();
    config.port = 0;
    config.data_dir = data_dir.display().to_string();
    config.workflow_dirs = vec![];

    smasher_web::server::start_with_client(config, smasher_llm::client::Client::new(), shutdown)
        .await
        .expect("embedded server should bind")
}

/// The IP of this machine's outbound (non-loopback) interface. Connecting a
/// UDP socket sends no packets; it only asks the OS which interface it would
/// route through. `None` when the machine has no network.
fn non_loopback_ip() -> Option<IpAddr> {
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("192.0.2.1:9").ok()?;
    let ip = socket.local_addr().ok()?.ip();
    (!ip.is_loopback() && !ip.is_unspecified()).then_some(ip)
}

fn spa_dist() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../frontend/dist")
}

#[tokio::test]
async fn embedded_server_answers_health_on_loopback() {
    let data_dir = tempfile::tempdir().unwrap();
    let shutdown = CancellationToken::new();
    let server = boot(data_dir.path(), shutdown.clone()).await;

    assert_eq!(server.addr.ip(), IpAddr::from([127, 0, 0, 1]));
    let resp = reqwest::get(format!("http://{}/api/health", server.addr))
        .await
        .unwrap();
    assert_eq!(resp.status(), reqwest::StatusCode::OK);

    shutdown.cancel();
}

#[tokio::test]
async fn embedded_server_serves_the_spa_index_at_root() {
    if !spa_dist().join("index.html").exists() {
        eprintln!(
            "skipping: frontend/dist not built (run `npm run build` in frontend/) at {}",
            spa_dist().display()
        );
        return;
    }
    let data_dir = tempfile::tempdir().unwrap();
    let shutdown = CancellationToken::new();
    let server = boot(data_dir.path(), shutdown.clone()).await;

    let resp = reqwest::get(format!("http://{}/", server.addr))
        .await
        .unwrap();

    assert_eq!(resp.status(), reqwest::StatusCode::OK);
    let content_type = resp.headers()[reqwest::header::CONTENT_TYPE]
        .to_str()
        .unwrap()
        .to_string();
    assert!(content_type.starts_with("text/html"), "got {content_type}");
    assert!(resp.text().await.unwrap().contains("<html"));

    shutdown.cancel();
}

#[tokio::test]
async fn embedded_server_is_unreachable_on_the_non_loopback_interface() {
    let Some(external_ip) = non_loopback_ip() else {
        eprintln!("skipping: no non-loopback interface on this machine");
        return;
    };
    let data_dir = tempfile::tempdir().unwrap();
    let shutdown = CancellationToken::new();
    let server = boot(data_dir.path(), shutdown.clone()).await;

    let external = SocketAddr::new(external_ip, server.addr.port());
    let attempt = tokio::time::timeout(
        Duration::from_secs(2),
        tokio::net::TcpStream::connect(external),
    )
    .await;

    // Either refused outright or never answered; a successful connect means
    // the server is reachable off-box.
    assert!(
        !matches!(attempt, Ok(Ok(_))),
        "server on {} accepted a connection on {external}",
        server.addr
    );
    // Sanity: the same port is live on loopback, so the refusal above is
    // about the interface, not a dead server.
    assert!(tokio::net::TcpStream::connect(server.addr).await.is_ok());

    shutdown.cancel();
}

#[tokio::test]
async fn cancelling_the_shutdown_token_stops_the_embedded_server() {
    let data_dir = tempfile::tempdir().unwrap();
    let shutdown = CancellationToken::new();
    let server = boot(data_dir.path(), shutdown.clone()).await;
    let addr = server.addr;

    shutdown.cancel();
    let result = tokio::time::timeout(Duration::from_secs(5), server.handle)
        .await
        .expect("server should stop promptly after cancel");

    assert!(result.unwrap().is_ok());
    assert!(tokio::net::TcpStream::connect(addr).await.is_err());
}
