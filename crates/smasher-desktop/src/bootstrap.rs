// ABOUTME: Builds the loopback-only server config and loads env for the embedded smasher-web server.
// ABOUTME: Kept free of Tauri types so port, host, and env behaviour are unit-testable headlessly.

use std::path::Path;

use smasher_web::server::{DEFAULT_PORT, ServerConfig, default_data_dir};

/// The only address the embedded server may bind: a security boundary
/// (local-only, no auth), so it's hard-coded rather than read from
/// `SMASHER_WEB_HOST` the way `ServerConfig::default()` does.
pub const LOOPBACK: [u8; 4] = [127, 0, 0, 1];

/// Port for the embedded server. Debug builds use the fixed port Vite's dev
/// proxy targets; release builds let the OS assign a free one.
pub fn port_for(debug: bool) -> u16 {
    if debug { DEFAULT_PORT } else { 0 }
}

/// The desktop's server config: the usual env-driven defaults for model,
/// provider, and directories, but always loopback and never an env-chosen port.
pub fn server_config() -> ServerConfig {
    ServerConfig {
        host: LOOPBACK,
        port: port_for(cfg!(debug_assertions)),
        ..ServerConfig::default()
    }
}

/// Load `.env` from the cwd, then from the data dir (`~/.smasher/.env` by
/// default). A Finder-launched app has cwd `/` and no shell env, so the data
/// dir file is where its API keys come from. Earlier values win.
pub fn load_env() {
    let _ = dotenvy::dotenv();
    load_env_from_data_dir(Path::new(&default_data_dir()));
}

/// Load `{data_dir}/.env` if it exists, without overriding vars already set.
pub fn load_env_from_data_dir(data_dir: &Path) {
    let _ = dotenvy::from_path(data_dir.join(".env"));
}

#[cfg(test)]
mod tests {
    use super::*;
    use smasher_web::server::DEFAULT_PORT;
    use tokio_util::sync::CancellationToken;

    #[test]
    fn port_is_os_assigned_in_release_builds() {
        assert_eq!(port_for(false), 0);
    }

    #[test]
    fn port_is_fixed_to_the_vite_proxy_target_in_debug_builds() {
        assert_eq!(port_for(true), DEFAULT_PORT);
    }

    #[test]
    #[serial_test::serial]
    fn host_is_loopback_even_when_smasher_web_host_asks_for_all_interfaces() {
        unsafe {
            std::env::set_var("SMASHER_WEB_HOST", "0.0.0.0");
        }
        let config = server_config();
        unsafe {
            std::env::remove_var("SMASHER_WEB_HOST");
        }

        assert_eq!(config.host, [127, 0, 0, 1]);
    }

    #[test]
    #[serial_test::serial]
    fn load_env_from_data_dir_sets_vars_from_its_dot_env() {
        let data_dir = tempfile::tempdir().unwrap();
        std::fs::write(
            data_dir.path().join(".env"),
            "SMASHER_DESKTOP_TEST_ENV_VAR=from-data-dir\n",
        )
        .unwrap();

        load_env_from_data_dir(data_dir.path());
        let value = std::env::var("SMASHER_DESKTOP_TEST_ENV_VAR");
        unsafe {
            std::env::remove_var("SMASHER_DESKTOP_TEST_ENV_VAR");
        }

        assert_eq!(value.as_deref(), Ok("from-data-dir"));
    }

    #[test]
    fn load_env_from_data_dir_without_a_dot_env_is_a_no_op() {
        let data_dir = tempfile::tempdir().unwrap();

        load_env_from_data_dir(data_dir.path());
    }

    #[tokio::test]
    async fn a_bind_conflict_on_the_desktop_config_is_an_error_not_a_window() {
        let data_dir = tempfile::tempdir().unwrap();
        let occupied = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = occupied.local_addr().unwrap().port();
        let mut config = server_config();
        config.port = port;
        config.data_dir = data_dir.path().display().to_string();
        config.workflow_dirs = vec![];

        let result = smasher_web::server::start_with_client(
            config,
            smasher_llm::client::Client::new(),
            CancellationToken::new(),
        )
        .await;

        let err = result.err().expect("an occupied port must fail to bind");
        assert!(err.to_string().contains(&format!("127.0.0.1:{port}")));
    }
}
