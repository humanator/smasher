// ABOUTME: LLM settings for the desktop app: models and base URLs in {data_dir}/settings.json, API keys in the macOS Keychain.
// ABOUTME: Applied as env vars at boot, before any thread starts, so every `Client::from_env()` call sees them.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use smasher_attractor::claude_cli_backend::{ALLOWED_TOOLS_ENV, DEFAULT_ALLOWED_TOOLS};
use smasher_llm::provider::claude_cli::process::resolve_binary_from_env;

/// Keychain service that holds the API keys, one entry per provider id.
pub const KEYCHAIN_SERVICE: &str = "com.smasher.desktop";

/// Placeholder key for a local `ollama serve`, which ignores it but which
/// `Client::from_env()` needs to see before it registers the Ollama adapter.
const LOCAL_OLLAMA_KEY: &str = "ollama";

/// A provider the settings modal can configure, and the env vars
/// `Client::from_env()` reads for it.
pub struct ProviderSpec {
    pub id: &'static str,
    pub label: &'static str,
    pub key_var: &'static str,
    pub base_url_var: &'static str,
}

pub const PROVIDERS: [ProviderSpec; 4] = [
    ProviderSpec {
        id: "anthropic",
        label: "Anthropic",
        key_var: "ANTHROPIC_API_KEY",
        base_url_var: "ANTHROPIC_BASE_URL",
    },
    ProviderSpec {
        id: "openai",
        label: "OpenAI",
        key_var: "OPENAI_API_KEY",
        base_url_var: "OPENAI_BASE_URL",
    },
    ProviderSpec {
        id: "gemini",
        label: "Gemini",
        key_var: "GEMINI_API_KEY",
        base_url_var: "GEMINI_BASE_URL",
    },
    ProviderSpec {
        id: "ollama",
        label: "Ollama",
        key_var: "OLLAMA_API_KEY",
        base_url_var: "OLLAMA_BASE_URL",
    },
];

fn provider(id: &str) -> Option<&'static ProviderSpec> {
    PROVIDERS.iter().find(|p| p.id == id)
}

/// The local Claude Code CLI. Not in [`PROVIDERS`]: it has no key or base URL,
/// just the path to the `claude` binary and the tools codergen runs may use.
pub const CLAUDE_CLI_ID: &str = "claude-cli";

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("failed to read {path}: {source}")]
    Read {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("{path} is not valid settings JSON: {source}")]
    Parse {
        path: PathBuf,
        source: serde_json::Error,
    },
    #[error("failed to write {path}: {source}")]
    Write {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("Keychain error for {provider}: {source}")]
    Keychain {
        provider: String,
        source: keyring::Error,
    },
    #[error("{0}")]
    Invalid(String),
}

/// The non-secret settings, as stored in `{data_dir}/settings.json`.
#[derive(Debug, Default, Clone, PartialEq, Serialize, Deserialize)]
pub struct StoredSettings {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_provider: Option<String>,
    /// Provider id -> base URL override.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub base_urls: BTreeMap<String, String>,
    /// Path to the `claude` binary. `None` searches the usual install locations.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claude_cli_path: Option<String>,
    /// Tools claude-cli codergen runs may use. `None` is the built-in default.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claude_cli_allowed_tools: Option<Vec<String>>,
}

pub fn settings_path(data_dir: &Path) -> PathBuf {
    data_dir.join("settings.json")
}

/// Read `{data_dir}/settings.json`; a missing file is empty settings.
pub fn load(data_dir: &Path) -> Result<StoredSettings, SettingsError> {
    let path = settings_path(data_dir);
    let text = match std::fs::read_to_string(&path) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(StoredSettings::default()),
        Err(source) => return Err(SettingsError::Read { path, source }),
    };
    serde_json::from_str(&text).map_err(|source| SettingsError::Parse { path, source })
}

/// Write `{data_dir}/settings.json`, creating `data_dir` if needed.
pub fn save(data_dir: &Path, settings: &StoredSettings) -> Result<(), SettingsError> {
    let path = settings_path(data_dir);
    let write = |path: &Path| -> std::io::Result<()> {
        std::fs::create_dir_all(data_dir)?;
        let json = serde_json::to_string_pretty(settings).expect("settings always serialize");
        std::fs::write(path, json + "\n")
    };
    write(&path).map_err(|source| SettingsError::Write { path, source })
}

/// API keys in the macOS Keychain: one generic-password entry per provider id
/// under `service`.
pub struct Keychain {
    service: String,
}

impl Keychain {
    pub fn new(service: impl Into<String>) -> Self {
        Self {
            service: service.into(),
        }
    }

    fn entry(&self, provider: &str) -> Result<keyring::Entry, SettingsError> {
        keyring::Entry::new(&self.service, provider).map_err(|source| SettingsError::Keychain {
            provider: provider.into(),
            source,
        })
    }

    pub fn get(&self, provider: &str) -> Result<Option<String>, SettingsError> {
        match self.entry(provider)?.get_password() {
            Ok(key) => Ok(Some(key)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(source) => Err(SettingsError::Keychain {
                provider: provider.into(),
                source,
            }),
        }
    }

    pub fn set(&self, provider: &str, key: &str) -> Result<(), SettingsError> {
        self.entry(provider)?
            .set_password(key)
            .map_err(|source| SettingsError::Keychain {
                provider: provider.into(),
                source,
            })
    }

    /// Remove the key; removing one that isn't there is fine.
    pub fn delete(&self, provider: &str) -> Result<(), SettingsError> {
        match self.entry(provider)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(source) => Err(SettingsError::Keychain {
                provider: provider.into(),
                source,
            }),
        }
    }

    /// Every stored key, by provider id.
    pub fn all(&self) -> Result<BTreeMap<String, String>, SettingsError> {
        let mut keys = BTreeMap::new();
        for spec in &PROVIDERS {
            if let Some(key) = self.get(spec.id)? {
                keys.insert(spec.id.to_string(), key);
            }
        }
        Ok(keys)
    }
}

/// The env vars that make `Client::from_env()` and `ServerConfig::default()`
/// see these settings. A local Ollama (base URL set, no key) gets a
/// placeholder key so its adapter still registers. With Claude CLI as the
/// default provider, `claude_binary` (as resolved at boot) is exported, or `1`
/// to let the client search when none was found.
pub fn env_vars(
    settings: &StoredSettings,
    keys: &BTreeMap<String, String>,
    claude_binary: Option<&Path>,
) -> Vec<(&'static str, String)> {
    let mut vars = Vec::new();
    if let Some(model) = &settings.default_model {
        vars.push(("SMASHER_MODEL", model.clone()));
    }
    if let Some(provider) = &settings.default_provider {
        vars.push(("SMASHER_PROVIDER", provider.clone()));
    }
    for spec in &PROVIDERS {
        let base_url = settings.base_urls.get(spec.id);
        match keys.get(spec.id) {
            Some(key) => vars.push((spec.key_var, key.clone())),
            None if spec.id == "ollama" && base_url.is_some() => {
                vars.push((spec.key_var, LOCAL_OLLAMA_KEY.into()))
            }
            None => {}
        }
        if let Some(url) = base_url {
            vars.push((spec.base_url_var, url.clone()));
        }
    }
    if settings.default_provider.as_deref() == Some(CLAUDE_CLI_ID) {
        let binary = claude_binary.map_or_else(|| "1".into(), |p| p.display().to_string());
        vars.push(("SMASHER_CLAUDE_CLI", binary));
        if let Some(tools) = &settings.claude_cli_allowed_tools {
            vars.push((ALLOWED_TOOLS_ENV, tools.join(",")));
        }
    }
    vars
}

/// Load the settings and keys and export them as env vars, overriding any
/// already set: the settings modal is what the user sees, so it wins.
///
/// # Safety
///
/// Calls `std::env::set_var`, so it must run before any other thread starts.
pub unsafe fn apply_to_env(data_dir: &Path, keychain: &Keychain) -> Result<(), SettingsError> {
    let settings = load(data_dir)?;
    let keys = keychain.all()?;
    let claude_binary = resolve_binary_from_env(settings.claude_cli_path.as_deref());
    for (name, value) in env_vars(&settings, &keys, claude_binary.as_deref()) {
        unsafe { std::env::set_var(name, value) };
    }
    Ok(())
}

/// One provider as the settings modal shows it. The key itself never leaves
/// the Keychain; the modal only learns whether one is stored.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ProviderView {
    pub id: String,
    pub label: String,
    pub base_url: String,
    pub has_key: bool,
}

/// The Claude CLI settings as the modal shows them. Detection (the resolved
/// binary and its version) is a separate call, [`detect_claude_cli`], so reading
/// settings never spawns a process.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ClaudeCliView {
    /// The saved binary path; empty means "search the usual locations".
    pub path: String,
    /// The allowlist in effect: the saved one, or the default.
    pub allowed_tools: Vec<String>,
    pub default_allowed_tools: Vec<String>,
}

/// What the settings modal reads.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SettingsView {
    pub default_model: String,
    pub default_provider: String,
    pub providers: Vec<ProviderView>,
    pub claude_cli: ClaudeCliView,
    pub settings_path: String,
}

/// Which `claude` binary would be used, and what `claude --version` says.
/// Both `None` means not found.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ClaudeCliDetection {
    pub path: Option<String>,
    pub version: Option<String>,
}

/// Run `<binary> --version`. `--version` makes no model call.
pub fn detect_claude_cli(binary: Option<PathBuf>) -> ClaudeCliDetection {
    let version = binary.as_ref().and_then(|b| {
        let output = std::process::Command::new(b)
            .arg("--version")
            .output()
            .ok()?;
        output
            .status
            .success()
            .then(|| String::from_utf8_lossy(&output.stdout).trim().to_string())
    });
    ClaudeCliDetection {
        path: binary.map(|b| b.display().to_string()),
        version,
    }
}

/// One provider as the settings modal saves it. `api_key`: `None` leaves the
/// stored key alone, `Some("")` removes it, anything else replaces it.
#[derive(Debug, Clone, Deserialize)]
pub struct ProviderUpdate {
    pub id: String,
    #[serde(default)]
    pub base_url: String,
    #[serde(default)]
    pub api_key: Option<String>,
}

/// What the settings modal saves. Empty strings mean "not set".
#[derive(Debug, Clone, Deserialize)]
pub struct SettingsUpdate {
    #[serde(default)]
    pub default_model: String,
    #[serde(default)]
    pub default_provider: String,
    #[serde(default)]
    pub providers: Vec<ProviderUpdate>,
    /// Path to the `claude` binary; empty searches the usual locations.
    #[serde(default)]
    pub claude_cli_path: String,
    /// Tools claude-cli codergen runs may use. Blank entries are dropped; an
    /// empty list, or the default list, stores nothing.
    #[serde(default)]
    pub claude_cli_allowed_tools: Vec<String>,
}

pub fn view(data_dir: &Path, keychain: &Keychain) -> Result<SettingsView, SettingsError> {
    let settings = load(data_dir)?;
    let mut providers = Vec::new();
    for spec in &PROVIDERS {
        providers.push(ProviderView {
            id: spec.id.into(),
            label: spec.label.into(),
            base_url: settings.base_urls.get(spec.id).cloned().unwrap_or_default(),
            has_key: keychain.get(spec.id)?.is_some(),
        });
    }
    let default_allowed_tools: Vec<String> = DEFAULT_ALLOWED_TOOLS.map(String::from).to_vec();
    Ok(SettingsView {
        default_model: settings.default_model.unwrap_or_default(),
        default_provider: settings.default_provider.unwrap_or_default(),
        providers,
        claude_cli: ClaudeCliView {
            path: settings.claude_cli_path.unwrap_or_default(),
            allowed_tools: settings
                .claude_cli_allowed_tools
                .unwrap_or_else(|| default_allowed_tools.clone()),
            default_allowed_tools,
        },
        settings_path: settings_path(data_dir).display().to_string(),
    })
}

fn non_empty(value: &str) -> Option<String> {
    let value = value.trim();
    (!value.is_empty()).then(|| value.to_string())
}

/// Validate `update`, then write settings.json and the Keychain. Nothing is
/// written if validation fails.
pub fn update(
    data_dir: &Path,
    keychain: &Keychain,
    update: SettingsUpdate,
) -> Result<SettingsView, SettingsError> {
    let default_provider = non_empty(&update.default_provider);
    if let Some(id) = &default_provider
        && id != CLAUDE_CLI_ID
        && provider(id).is_none()
    {
        return Err(SettingsError::Invalid(format!("unknown provider \"{id}\"")));
    }

    let mut base_urls = BTreeMap::new();
    for p in &update.providers {
        let spec = provider(&p.id)
            .ok_or_else(|| SettingsError::Invalid(format!("unknown provider \"{}\"", p.id)))?;
        if let Some(url) = non_empty(&p.base_url) {
            if !(url.starts_with("http://") || url.starts_with("https://")) {
                return Err(SettingsError::Invalid(format!(
                    "{} base URL must start with http:// or https://",
                    spec.label
                )));
            }
            base_urls.insert(p.id.clone(), url.trim_end_matches('/').to_string());
        }
    }

    let claude_cli_path = non_empty(&update.claude_cli_path);
    if let Some(path) = &claude_cli_path
        && !Path::new(path).is_file()
    {
        return Err(SettingsError::Invalid(format!(
            "Claude CLI binary not found at {path}"
        )));
    }
    let allowed_tools: Vec<String> = update
        .claude_cli_allowed_tools
        .iter()
        .filter_map(|t| non_empty(t))
        .collect();
    let claude_cli_allowed_tools = (!allowed_tools.is_empty()
        && allowed_tools != DEFAULT_ALLOWED_TOOLS)
        .then_some(allowed_tools);

    save(
        data_dir,
        &StoredSettings {
            default_model: non_empty(&update.default_model),
            default_provider,
            base_urls,
            claude_cli_path,
            claude_cli_allowed_tools,
        },
    )?;
    for p in &update.providers {
        match p.api_key.as_deref().map(str::trim) {
            None => {}
            Some("") => keychain.delete(&p.id)?,
            Some(key) => keychain.set(&p.id, key)?,
        }
    }
    view(data_dir, keychain)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A real Keychain under a throwaway service name, emptied on drop so
    /// tests never touch the app's own keys.
    struct TestKeychain(Keychain);

    impl TestKeychain {
        fn new() -> Self {
            let service = format!("{KEYCHAIN_SERVICE}.test.{}", uuid::Uuid::new_v4());
            Self(Keychain::new(service))
        }
    }

    impl Drop for TestKeychain {
        fn drop(&mut self) {
            for spec in &PROVIDERS {
                let _ = self.0.delete(spec.id);
            }
        }
    }

    fn provider_update(id: &str, base_url: &str, api_key: Option<&str>) -> ProviderUpdate {
        ProviderUpdate {
            id: id.into(),
            base_url: base_url.into(),
            api_key: api_key.map(Into::into),
        }
    }

    fn settings_update(
        model: &str,
        provider: &str,
        providers: Vec<ProviderUpdate>,
    ) -> SettingsUpdate {
        SettingsUpdate {
            default_model: model.into(),
            default_provider: provider.into(),
            providers,
            claude_cli_path: String::new(),
            claude_cli_allowed_tools: Vec::new(),
        }
    }

    #[test]
    fn missing_settings_file_loads_as_empty_settings() {
        let dir = tempfile::tempdir().unwrap();

        assert_eq!(load(dir.path()).unwrap(), StoredSettings::default());
    }

    #[test]
    fn saved_settings_load_back() {
        let dir = tempfile::tempdir().unwrap();
        let data_dir = dir.path().join("not-yet-created");
        let settings = StoredSettings {
            default_model: Some("gemma4:31b-cloud".into()),
            default_provider: Some("ollama".into()),
            base_urls: BTreeMap::from([("ollama".into(), "http://localhost:11434".into())]),
            ..Default::default()
        };

        save(&data_dir, &settings).unwrap();

        assert_eq!(load(&data_dir).unwrap(), settings);
    }

    #[test]
    fn corrupt_settings_file_is_a_parse_error_naming_the_file() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::write(settings_path(dir.path()), "{ not json").unwrap();

        let err = load(dir.path()).unwrap_err();

        assert!(matches!(err, SettingsError::Parse { .. }));
        assert!(err.to_string().contains("settings.json"));
    }

    #[test]
    fn env_vars_export_model_provider_keys_and_base_urls() {
        let settings = StoredSettings {
            default_model: Some("gpt-5".into()),
            default_provider: Some("openai".into()),
            base_urls: BTreeMap::from([("openai".into(), "https://proxy.example".into())]),
            ..Default::default()
        };
        let keys = BTreeMap::from([("openai".to_string(), "sk-test".to_string())]);

        assert_eq!(
            env_vars(&settings, &keys, None),
            vec![
                ("SMASHER_MODEL", "gpt-5".to_string()),
                ("SMASHER_PROVIDER", "openai".to_string()),
                ("OPENAI_API_KEY", "sk-test".to_string()),
                ("OPENAI_BASE_URL", "https://proxy.example".to_string()),
            ]
        );
    }

    #[test]
    fn local_ollama_without_a_key_gets_a_placeholder_key_so_it_registers() {
        let settings = StoredSettings {
            base_urls: BTreeMap::from([("ollama".into(), "http://localhost:11434".into())]),
            ..Default::default()
        };

        assert_eq!(
            env_vars(&settings, &BTreeMap::new(), None),
            vec![
                ("OLLAMA_API_KEY", "ollama".to_string()),
                ("OLLAMA_BASE_URL", "http://localhost:11434".to_string()),
            ]
        );
    }

    #[test]
    fn empty_settings_export_nothing() {
        assert!(env_vars(&StoredSettings::default(), &BTreeMap::new(), None).is_empty());
    }

    #[test]
    fn keychain_round_trips_a_key_and_deletes_it() {
        let keychain = TestKeychain::new();

        assert_eq!(keychain.0.get("anthropic").unwrap(), None);
        keychain.0.set("anthropic", "sk-ant-test").unwrap();
        assert_eq!(
            keychain.0.get("anthropic").unwrap().as_deref(),
            Some("sk-ant-test")
        );
        keychain.0.delete("anthropic").unwrap();
        assert_eq!(keychain.0.get("anthropic").unwrap(), None);
    }

    #[test]
    fn deleting_a_missing_keychain_key_is_ok() {
        let keychain = TestKeychain::new();

        keychain.0.delete("gemini").unwrap();
    }

    #[test]
    fn view_lists_every_provider_without_exposing_keys() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();
        keychain.0.set("gemini", "secret-gemini-key").unwrap();

        let view = view(dir.path(), &keychain.0).unwrap();

        let ids: Vec<_> = view.providers.iter().map(|p| p.id.as_str()).collect();
        assert_eq!(ids, ["anthropic", "openai", "gemini", "ollama"]);
        let gemini = view.providers.iter().find(|p| p.id == "gemini").unwrap();
        assert!(gemini.has_key);
        assert!(
            !serde_json::to_string(&view)
                .unwrap()
                .contains("secret-gemini-key")
        );
    }

    #[test]
    fn update_writes_settings_and_keys_then_returns_the_new_view() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();

        let view = update(
            dir.path(),
            &keychain.0,
            settings_update(
                " gemma4:31b-cloud ",
                "ollama",
                vec![
                    provider_update("ollama", "http://localhost:11434/", None),
                    provider_update("anthropic", "", Some(" sk-ant-new ")),
                ],
            ),
        )
        .unwrap();

        assert_eq!(view.default_model, "gemma4:31b-cloud");
        assert_eq!(view.default_provider, "ollama");
        let ollama = view.providers.iter().find(|p| p.id == "ollama").unwrap();
        assert_eq!(ollama.base_url, "http://localhost:11434");
        assert_eq!(
            keychain.0.get("anthropic").unwrap().as_deref(),
            Some("sk-ant-new")
        );
    }

    #[test]
    fn update_with_no_api_key_leaves_the_stored_key_alone() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();
        keychain.0.set("openai", "sk-keep").unwrap();

        update(
            dir.path(),
            &keychain.0,
            settings_update("", "", vec![provider_update("openai", "", None)]),
        )
        .unwrap();

        assert_eq!(
            keychain.0.get("openai").unwrap().as_deref(),
            Some("sk-keep")
        );
    }

    #[test]
    fn update_with_an_empty_api_key_removes_the_stored_key() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();
        keychain.0.set("openai", "sk-remove").unwrap();

        update(
            dir.path(),
            &keychain.0,
            settings_update("", "", vec![provider_update("openai", "", Some(""))]),
        )
        .unwrap();

        assert_eq!(keychain.0.get("openai").unwrap(), None);
    }

    #[test]
    fn update_rejects_an_unknown_default_provider_and_writes_nothing() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();

        let err = update(
            dir.path(),
            &keychain.0,
            settings_update(
                "m",
                "mistral",
                vec![provider_update("openai", "", Some("sk-x"))],
            ),
        )
        .unwrap_err();

        assert!(err.to_string().contains("mistral"));
        assert!(!settings_path(dir.path()).exists());
        assert_eq!(keychain.0.get("openai").unwrap(), None);
    }

    #[test]
    fn update_rejects_a_base_url_without_an_http_scheme() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();

        let err = update(
            dir.path(),
            &keychain.0,
            settings_update(
                "",
                "",
                vec![provider_update("ollama", "localhost:11434", None)],
            ),
        )
        .unwrap_err();

        assert!(err.to_string().contains("Ollama base URL"));
        assert!(!settings_path(dir.path()).exists());
    }

    #[test]
    fn update_rejects_an_unknown_provider_id() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();

        let err = update(
            dir.path(),
            &keychain.0,
            settings_update("", "", vec![provider_update("mistral", "", None)]),
        )
        .unwrap_err();

        assert!(matches!(err, SettingsError::Invalid(_)));
    }

    // ---- Claude CLI ----

    fn claude_cli_settings(path: Option<&str>, tools: Option<Vec<&str>>) -> StoredSettings {
        StoredSettings {
            default_provider: Some(CLAUDE_CLI_ID.into()),
            claude_cli_path: path.map(Into::into),
            claude_cli_allowed_tools: tools.map(|t| t.into_iter().map(Into::into).collect()),
            ..Default::default()
        }
    }

    fn fake_claude(dir: &Path, version: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let path = dir.join("claude");
        std::fs::write(&path, format!("#!/bin/sh\necho '{version}'\n")).unwrap();
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
        path
    }

    #[test]
    fn claude_cli_default_exports_provider_and_binary_and_no_keys() {
        let settings = claude_cli_settings(Some("/saved/claude"), None);
        let binary = PathBuf::from("/resolved/claude");

        assert_eq!(
            env_vars(&settings, &BTreeMap::new(), Some(&binary)),
            vec![
                ("SMASHER_PROVIDER", "claude-cli".to_string()),
                ("SMASHER_CLAUDE_CLI", "/resolved/claude".to_string()),
            ]
        );
    }

    #[test]
    fn claude_cli_default_without_a_found_binary_asks_the_client_to_search() {
        let settings = claude_cli_settings(None, None);

        assert_eq!(
            env_vars(&settings, &BTreeMap::new(), None),
            vec![
                ("SMASHER_PROVIDER", "claude-cli".to_string()),
                ("SMASHER_CLAUDE_CLI", "1".to_string()),
            ]
        );
    }

    #[test]
    fn claude_cli_allowlist_is_exported_comma_separated() {
        let settings = claude_cli_settings(None, Some(vec!["Read", "Bash(npm run build:*)"]));
        let binary = PathBuf::from("/resolved/claude");

        let vars = env_vars(&settings, &BTreeMap::new(), Some(&binary));

        assert!(vars.contains(&(
            "SMASHER_CLAUDE_CLI_ALLOWED_TOOLS",
            "Read,Bash(npm run build:*)".to_string()
        )));
    }

    #[test]
    fn claude_cli_is_not_exported_when_another_provider_is_default() {
        let settings = StoredSettings {
            default_provider: Some("anthropic".into()),
            claude_cli_path: Some("/saved/claude".into()),
            ..Default::default()
        };
        let binary = PathBuf::from("/resolved/claude");

        let vars = env_vars(&settings, &BTreeMap::new(), Some(&binary));

        assert!(
            vars.iter()
                .all(|(name, _)| !name.starts_with("SMASHER_CLAUDE_CLI"))
        );
    }

    #[test]
    fn update_accepts_claude_cli_without_a_key_and_round_trips_path_and_allowlist() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();
        let binary = fake_claude(dir.path(), "2.1.281 (Claude Code)");
        let mut update = settings_update("sonnet", "claude-cli", vec![]);
        update.claude_cli_path = binary.display().to_string();
        update.claude_cli_allowed_tools = vec![" Read ".into(), "".into(), "Write".into()];

        let view = super::update(dir.path(), &keychain.0, update).unwrap();

        let stored = load(dir.path()).unwrap();
        assert_eq!(stored.default_provider.as_deref(), Some("claude-cli"));
        assert_eq!(stored.claude_cli_path, Some(binary.display().to_string()));
        assert_eq!(
            stored.claude_cli_allowed_tools,
            Some(vec!["Read".to_string(), "Write".to_string()])
        );
        assert_eq!(view.default_provider, "claude-cli");
        assert_eq!(view.claude_cli.path, binary.display().to_string());
        assert_eq!(view.claude_cli.allowed_tools, vec!["Read", "Write"]);
    }

    #[test]
    fn default_allowlist_is_not_stored_so_it_tracks_future_defaults() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();
        let mut update = settings_update("", "claude-cli", vec![]);
        update.claude_cli_allowed_tools = DEFAULT_ALLOWED_TOOLS.map(String::from).to_vec();

        let view = super::update(dir.path(), &keychain.0, update).unwrap();

        assert_eq!(load(dir.path()).unwrap().claude_cli_allowed_tools, None);
        assert_eq!(
            view.claude_cli.allowed_tools,
            DEFAULT_ALLOWED_TOOLS.to_vec()
        );
    }

    #[test]
    fn update_rejects_a_claude_cli_path_that_does_not_exist() {
        let dir = tempfile::tempdir().unwrap();
        let keychain = TestKeychain::new();
        let mut update = settings_update("", "claude-cli", vec![]);
        update.claude_cli_path = dir.path().join("nope").display().to_string();

        let err = super::update(dir.path(), &keychain.0, update).unwrap_err();

        assert!(err.to_string().contains("Claude CLI"), "{err}");
        assert!(!settings_path(dir.path()).exists());
    }

    #[test]
    fn detect_reports_the_binary_version() {
        let dir = tempfile::tempdir().unwrap();
        let binary = fake_claude(dir.path(), "2.1.281 (Claude Code)");

        let detected = detect_claude_cli(Some(binary.clone()));

        assert_eq!(detected.path.as_deref(), Some(binary.to_str().unwrap()));
        assert_eq!(detected.version.as_deref(), Some("2.1.281 (Claude Code)"));
    }

    #[test]
    fn detect_reports_not_found_for_a_missing_binary() {
        let detected = detect_claude_cli(None);

        assert_eq!(detected.path, None);
        assert_eq!(detected.version, None);
    }
}
