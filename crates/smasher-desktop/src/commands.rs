// ABOUTME: Tauri commands the SPA's settings modal invokes: read/save LLM settings and detect the Claude CLI.
// ABOUTME: Thin wrappers over `settings`; errors cross the IPC boundary as display strings.

use std::path::PathBuf;

use smasher_llm::provider::claude_cli::process::resolve_binary_from_env;

use crate::settings::{
    self, ClaudeCliDetection, KEYCHAIN_SERVICE, Keychain, SettingsUpdate, SettingsView,
};

/// Commands the served origin may invoke. `build.rs` turns each into an
/// `allow-<name>` permission, which `capabilities/served-origin.json` grants.
pub const COMMANDS: [&str; 4] = [
    "get_llm_settings",
    "save_llm_settings",
    "detect_claude_cli",
    "restart_app",
];

/// Where the settings live, managed as Tauri state.
pub struct SettingsLocation {
    pub data_dir: PathBuf,
}

/// The running embedded server, managed as Tauri state so a saved key can be
/// applied to it in place.
pub struct ServerHandle(pub smasher_web::state::AppState);

#[tauri::command]
pub fn get_llm_settings(location: tauri::State<SettingsLocation>) -> Result<SettingsView, String> {
    settings::view(&location.data_dir, &Keychain::new(KEYCHAIN_SERVICE)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_llm_settings(
    location: tauri::State<SettingsLocation>,
    server: tauri::State<ServerHandle>,
    update: SettingsUpdate,
) -> Result<SettingsView, String> {
    let keychain = Keychain::new(KEYCHAIN_SERVICE);
    let view =
        settings::update(&location.data_dir, &keychain, update).map_err(|e| e.to_string())?;
    // New keys, base URLs and the Claude CLI path apply to the next run, no restart.
    let (client, endpoints) =
        settings::reload_client(&location.data_dir, &keychain).map_err(|e| e.to_string())?;
    server.0.reconfigure(client, endpoints);
    Ok(view)
}

/// Find the `claude` binary the app would use (`path` first; empty searches the
/// usual install locations) and report its version, or that it wasn't found.
#[tauri::command]
pub fn detect_claude_cli(path: String) -> ClaudeCliDetection {
    settings::detect_claude_cli(resolve_binary_from_env(Some(&path)))
}

/// Relaunch the app so saved settings take effect at boot.
#[tauri::command]
pub fn restart_app(app: tauri::AppHandle) {
    app.restart();
}
