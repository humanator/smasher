// ABOUTME: Tauri build script: generates the app context from tauri.conf.json and capabilities.
// ABOUTME: Required by tauri::generate_context!() in main.rs; also declares the app's own IPC commands.

fn main() {
    // Must match `smasher_desktop::commands::COMMANDS` (build scripts can't
    // import the crate); capabilities_test checks each one is granted.
    let manifest = tauri_build::AppManifest::new().commands(&[
        "get_llm_settings",
        "save_llm_settings",
        "restart_app",
    ]);
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(manifest))
        .expect("failed to run tauri-build");
}
