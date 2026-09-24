// ABOUTME: Tauri entrypoint — boots the local smasher-web server, then opens the window.
// ABOUTME: All business logic lives in smasher-web; this crate is bootstrapping + native shims only.

use smasher_desktop::bootstrap;
use tauri::{RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tokio_util::sync::CancellationToken;
use tracing_subscriber::EnvFilter;

fn main() {
    bootstrap::load_env();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            EnvFilter::new("smasher_desktop=info,smasher_web=info,smasher_attractor=info,smasher_agent=info,smasher_llm=info,tower_http=info")
        }))
        .init();

    let shutdown = CancellationToken::new();
    let server_shutdown = shutdown.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            // Bind before any window exists: the window's URL needs the real
            // port, and a bind failure must never leave a blank window.
            let started = tauri::async_runtime::block_on(smasher_web::server::start(
                bootstrap::server_config(),
                server_shutdown.clone(),
            ));
            match started {
                Ok(server) => {
                    let url = format!("http://{}/", server.addr).parse()?;
                    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                        .title("Smasher")
                        .inner_size(1440.0, 900.0)
                        .build()?;
                }
                Err(e) => {
                    tracing::error!(error = %e, "embedded server failed to start");
                    let handle = app.handle().clone();
                    app.dialog()
                        .message(e.to_string())
                        .title("Smasher couldn't start")
                        .kind(MessageDialogKind::Error)
                        .show(move |_| handle.exit(1));
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build the Tauri application");

    app.run(move |_, event| {
        if let RunEvent::Exit = event {
            shutdown.cancel();
        }
    });
}
