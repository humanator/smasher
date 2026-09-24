// ABOUTME: Tauri commands the SPA's settings modal invokes: read/save LLM settings and restart to apply them.
// ABOUTME: Thin wrappers over `settings`; errors cross the IPC boundary as display strings.

use std::path::PathBuf;

use crate::settings::{self, KEYCHAIN_SERVICE, Keychain, SettingsUpdate, SettingsView};

/// Commands the served origin may invoke. `build.rs` turns each into an
/// `allow-<name>` permission, which `capabilities/served-origin.json` grants.
pub const COMMANDS: [&str; 3] = ["get_llm_settings", "save_llm_settings", "restart_app"];

/// Where the settings live, managed as Tauri state.
pub struct SettingsLocation {
    pub data_dir: PathBuf,
}

#[tauri::command]
pub fn get_llm_settings(location: tauri::State<SettingsLocation>) -> Result<SettingsView, String> {
    settings::view(&location.data_dir, &Keychain::new(KEYCHAIN_SERVICE)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_llm_settings(
    location: tauri::State<SettingsLocation>,
    update: SettingsUpdate,
) -> Result<SettingsView, String> {
    settings::update(&location.data_dir, &Keychain::new(KEYCHAIN_SERVICE), update)
        .map_err(|e| e.to_string())
}

/// Relaunch the app so saved settings take effect at boot.
#[tauri::command]
pub fn restart_app(app: tauri::AppHandle) {
    app.restart();
}
