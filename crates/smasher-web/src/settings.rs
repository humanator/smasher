// ABOUTME: The persisted default LLM provider and model, shared with the desktop app's settings.json.
// ABOUTME: Reads and writes only default_model/default_provider; every other key in the file is kept.

use std::path::{Path, PathBuf};

use serde::Serialize;
use serde_json::{Map, Value};

use crate::state::AppState;

const MODEL_KEY: &str = "default_model";
const PROVIDER_KEY: &str = "default_provider";

/// Where the current default came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DefaultsSource {
    /// `{data_dir}/settings.json`.
    Settings,
    /// `SMASHER_MODEL` / `SMASHER_PROVIDER` (or a config the embedder passed in).
    Env,
    /// The built-in default model.
    Default,
}

/// The model and provider new runs use when a request names none.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LlmDefaults {
    pub provider: Option<String>,
    pub model: String,
    pub source: DefaultsSource,
}

impl LlmDefaults {
    /// The defaults a server was booted with. Anything other than the built-in model
    /// with no provider counts as coming from the environment.
    pub fn from_boot(model: String, provider: Option<String>) -> Self {
        let source = if provider.is_none() && model == smasher_llm::types::DEFAULT_MODEL {
            DefaultsSource::Default
        } else {
            DefaultsSource::Env
        };
        Self {
            provider,
            model,
            source,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("{path} is not valid settings JSON: {source}")]
    Parse {
        path: PathBuf,
        source: serde_json::Error,
    },
    #[error("could not access {path}: {source}")]
    Io {
        path: PathBuf,
        source: std::io::Error,
    },
}

pub fn settings_path(data_dir: &Path) -> PathBuf {
    data_dir.join("settings.json")
}

/// The whole settings file as a JSON object; a missing file is an empty object.
fn read_object(data_dir: &Path) -> Result<Map<String, Value>, SettingsError> {
    let path = settings_path(data_dir);
    let text = match std::fs::read_to_string(&path) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Map::new()),
        Err(source) => return Err(SettingsError::Io { path, source }),
    };
    serde_json::from_str(&text).map_err(|source| SettingsError::Parse { path, source })
}

fn non_empty(map: &Map<String, Value>, key: &str) -> Option<String> {
    map.get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

/// The saved defaults, when the file names a model.
pub fn load_saved(data_dir: &Path) -> Result<Option<LlmDefaults>, SettingsError> {
    let map = read_object(data_dir)?;
    Ok(non_empty(&map, MODEL_KEY).map(|model| LlmDefaults {
        provider: non_empty(&map, PROVIDER_KEY),
        model,
        source: DefaultsSource::Settings,
    }))
}

/// Save the defaults, leaving every other key in the file as it was.
pub fn save(data_dir: &Path, provider: &str, model: &str) -> Result<(), SettingsError> {
    let mut map = read_object(data_dir)?;
    map.insert(PROVIDER_KEY.into(), Value::String(provider.into()));
    map.insert(MODEL_KEY.into(), Value::String(model.into()));

    let path = settings_path(data_dir);
    let io = |source| SettingsError::Io {
        path: path.clone(),
        source,
    };
    std::fs::create_dir_all(data_dir).map_err(io)?;
    let json = serde_json::to_string_pretty(&Value::Object(map)).expect("settings serialize");
    // Write beside the file, then rename, so a crash never leaves half a file.
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, json).map_err(io)?;
    std::fs::rename(&tmp, &path).map_err(io)
}

/// At boot, let the saved defaults override the environment's. A corrupt file is
/// logged and ignored rather than stopping the server.
pub fn apply_stored_defaults(state: &AppState) {
    match load_saved(Path::new(&state.data_dir)) {
        Ok(Some(saved)) => *state.llm.write().expect("llm defaults lock") = saved,
        Ok(None) => {}
        Err(e) => tracing::warn!("ignoring saved LLM settings: {e}"),
    }
}
