// ABOUTME: Tauri commands the SPA invokes: read/save LLM settings, detect the Claude CLI, show a workflow in Finder.
// ABOUTME: Thin wrappers over `settings` and `reveal`; errors cross the IPC boundary as display strings.

use std::path::{Path, PathBuf};

use smasher_llm::provider::claude_cli::process::resolve_binary_from_env;

use crate::reveal::validate_reveal_path;
use crate::settings::{
    self, ClaudeCliDetection, KEYCHAIN_SERVICE, Keychain, SettingsUpdate, SettingsView,
};

/// Commands the served origin may invoke. `build.rs` turns each into an
/// `allow-<name>` permission, which `capabilities/served-origin.json` grants.
pub const COMMANDS: [&str; 4] = [
    "get_llm_settings",
    "save_llm_settings",
    "detect_claude_cli",
    "reveal_in_finder",
];

/// Where the settings live, managed as Tauri state.
pub struct SettingsLocation {
    pub data_dir: PathBuf,
}

/// The folders Show in Finder may reveal from: the server's effective workflow
/// dirs, imported-workflows folder included. Managed as Tauri state.
pub struct WorkflowDirs(pub Vec<PathBuf>);

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

/// Reveal a workflow's `.dot` file in Finder. Refuses anything that isn't an
/// existing `.dot` file inside one of the workflow folders.
#[tauri::command]
pub fn reveal_in_finder(dirs: tauri::State<WorkflowDirs>, path: String) -> Result<(), String> {
    let file = validate_reveal_path(&path, &dirs.0)?;
    reveal(&file)
}

#[cfg(target_os = "macos")]
fn reveal(file: &Path) -> Result<(), String> {
    // An argument list, never a shell string: the path is passed to `open` as-is.
    let status = std::process::Command::new("open")
        .arg("-R")
        .arg(file)
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("open -R failed ({status})"))
    }
}

#[cfg(not(target_os = "macos"))]
fn reveal(_file: &Path) -> Result<(), String> {
    Err("Show in Finder is only available on macOS.".to_string())
}
