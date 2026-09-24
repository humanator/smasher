// ABOUTME: Tauri entrypoint — boots the local smasher-web server, then opens the window.
// ABOUTME: All business logic lives in smasher-web; this crate is bootstrapping + native shims only.

use std::path::PathBuf;

use smasher_desktop::bootstrap;
use smasher_desktop::commands::{self, SettingsLocation};
use smasher_desktop::settings::{self, KEYCHAIN_SERVICE, Keychain};
use tauri::{RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tokio_util::sync::CancellationToken;
use tracing_subscriber::EnvFilter;

fn main() {
    bootstrap::load_env();
    let data_dir = PathBuf::from(bootstrap::desktop_data_dir());
    // SAFETY: still single-threaded — nothing has spawned a thread yet.
    let settings_applied =
        unsafe { settings::apply_to_env(&data_dir, &Keychain::new(KEYCHAIN_SERVICE)) };

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            EnvFilter::new("smasher_desktop=info,smasher_web=info,smasher_attractor=info,smasher_agent=info,smasher_llm=info,tower_http=info")
        }))
        .init();
    if let Err(e) = settings_applied {
        tracing::error!(error = %e, "failed to apply saved LLM settings");
    }

    let shutdown = CancellationToken::new();
    let server_shutdown = shutdown.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .manage(SettingsLocation { data_dir })
        .invoke_handler(tauri::generate_handler![
            commands::get_llm_settings,
            commands::save_llm_settings,
            commands::restart_app
        ])
        .setup(move |app| {
            // Start even with no provider configured, so the settings modal
            // is reachable to add one; runs report the missing provider.
            let client = smasher_llm::client::Client::from_env();
            if client.registered_providers().is_empty() {
                tracing::warn!("no LLM provider configured; add one in Settings");
            }
            // Bind before any window exists: the window's URL needs the real
            // port, and a bind failure must never leave a blank window.
            let started = tauri::async_runtime::block_on(smasher_web::server::start_with_client(
                bootstrap::server_config(),
                client,
                server_shutdown.clone(),
            ));
            match started {
                Ok(server) => {
                    // `cargo tauri dev` points the window at Vite for HMR;
                    // Vite proxies `/api` and `/events` to our fixed debug port.
                    let dev_server = if tauri::is_dev() {
                        app.config()
                            .build
                            .dev_url
                            .as_ref()
                            .and_then(|url| url.socket_addrs(|| None).ok())
                            .and_then(|addrs| addrs.into_iter().next())
                    } else {
                        None
                    };
                    let url = bootstrap::window_url(dev_server, server.addr);
                    tracing::info!(%url, "opening window");
                    let url = url.parse()?;
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
