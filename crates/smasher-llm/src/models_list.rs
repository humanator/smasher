// ABOUTME: Provider-qualified model lists fetched from each provider's own list API.
// ABOUTME: Falls back to the OpenRouter list, then the static catalog; results are cached briefly.

use std::collections::HashMap;
use std::fmt;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;

use crate::modeldb::{ModelDb, OPENROUTER_MODELS_URL};
use crate::types::catalog::{self, Provider};

/// How long a fetched list is served from memory.
pub const DEFAULT_LIST_TTL: Duration = Duration::from_secs(300);

const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
const ANTHROPIC_API_VERSION: &str = "2023-06-01";

/// Claude CLI model aliases, in display order.
const CLAUDE_CLI_ALIASES: [(&str, &str); 3] = [
    ("claude-sonnet", "Claude Sonnet"),
    ("claude-opus", "Claude Opus"),
    ("claude-fable", "Claude Fable"),
];

/// One selectable model.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ModelEntry {
    pub id: String,
    pub label: String,
    pub aliases: Vec<String>,
}

impl ModelEntry {
    fn bare(id: String) -> Self {
        Self {
            label: id.clone(),
            id,
            aliases: Vec::new(),
        }
    }
}

/// Where a model list came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ListSource {
    /// The provider's own list API.
    Provider,
    /// The OpenRouter list (provider API was unavailable).
    Openrouter,
    /// The built-in catalog (everything else was unavailable).
    Static,
}

/// The models available for one provider, plus how they were found.
#[derive(Debug, Clone, Serialize)]
pub struct ModelList {
    pub provider: Provider,
    pub models: Vec<ModelEntry>,
    pub source: ListSource,
    /// Why the provider's own list could not be used, when a fallback was served.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Where and how to reach a provider's list API.
#[derive(Clone)]
pub struct ProviderEndpoint {
    pub provider: Provider,
    pub api_key: String,
    pub base_url: String,
}

impl fmt::Debug for ProviderEndpoint {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("ProviderEndpoint")
            .field("provider", &self.provider)
            .field("base_url", &self.base_url)
            .finish_non_exhaustive()
    }
}

impl ProviderEndpoint {
    /// The endpoint for `provider` as configured in the environment, mirroring
    /// `Client::from_env`. `None` when the provider has no key (or has no list API).
    pub fn from_env(provider: Provider) -> Option<Self> {
        let var = |name: &str| std::env::var(name).ok().filter(|v| !v.trim().is_empty());
        let (key, base_var, default_base) = match provider {
            Provider::Anthropic => (
                var("ANTHROPIC_API_KEY")?,
                "ANTHROPIC_BASE_URL",
                "https://api.anthropic.com",
            ),
            Provider::OpenAi => (
                var("OPENAI_API_KEY")?,
                "OPENAI_BASE_URL",
                "https://api.openai.com",
            ),
            Provider::Gemini => (
                var("GEMINI_API_KEY").or_else(|| var("GOOGLE_API_KEY"))?,
                "GEMINI_BASE_URL",
                "https://generativelanguage.googleapis.com",
            ),
            Provider::Ollama => (
                var("OLLAMA_API_KEY")?,
                "OLLAMA_BASE_URL",
                "https://ollama.com",
            ),
            Provider::ClaudeCli => return None,
        };
        Some(Self {
            provider,
            api_key: key,
            base_url: var(base_var).unwrap_or_else(|| default_base.to_string()),
        })
    }
}

/// Builds and caches per-provider model lists.
pub struct ModelCatalog {
    http: reqwest::Client,
    openrouter_url: String,
    ttl: Duration,
    cache: Mutex<HashMap<Provider, (Instant, ModelList)>>,
}

impl ModelCatalog {
    pub fn new(ttl: Duration) -> Self {
        Self::with_openrouter_url(ttl, OPENROUTER_MODELS_URL.to_string())
    }

    pub fn with_openrouter_url(ttl: Duration, openrouter_url: String) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(REQUEST_TIMEOUT)
                .build()
                .expect("reqwest client with a timeout builds"),
            openrouter_url,
            ttl,
            cache: Mutex::new(HashMap::new()),
        }
    }

    /// Forget every cached list (e.g. after an API key changes).
    pub fn invalidate(&self) {
        self.cache.lock().expect("model cache lock").clear();
    }

    /// The Claude CLI has no list API; it offers the Claude aliases.
    pub fn claude_cli_list() -> ModelList {
        ModelList {
            provider: Provider::ClaudeCli,
            models: CLAUDE_CLI_ALIASES
                .iter()
                .map(|(id, label)| ModelEntry {
                    id: (*id).to_string(),
                    label: (*label).to_string(),
                    aliases: Vec::new(),
                })
                .collect(),
            source: ListSource::Static,
            error: None,
        }
    }

    /// The built-in list for a provider that has no reachable list API.
    pub fn static_list(&self, provider: Provider) -> ModelList {
        ModelList {
            provider,
            models: static_models(provider),
            source: ListSource::Static,
            error: None,
        }
    }

    /// Models for the endpoint's provider: its own list, else OpenRouter's, else the
    /// static catalog. Never fails; `error` says why a fallback was used.
    pub async fn list(&self, endpoint: &ProviderEndpoint) -> ModelList {
        if let Some(cached) = self.cached(endpoint.provider) {
            return cached;
        }
        let list = self.fetch(endpoint).await;
        self.cache
            .lock()
            .expect("model cache lock")
            .insert(endpoint.provider, (Instant::now(), list.clone()));
        list
    }

    /// Like [`catalog::validate_pair`], but a model the provider's live list names is
    /// accepted too (when an endpoint is given).
    pub async fn validate_pair(
        &self,
        endpoint: Option<&ProviderEndpoint>,
        provider: Provider,
        model: &str,
    ) -> Result<(), String> {
        if let Some(endpoint) = endpoint {
            let live = self.list(endpoint).await;
            if live.source == ListSource::Provider
                && live.models.iter().any(|m| m.id == model.trim())
            {
                return Ok(());
            }
        }
        catalog::validate_pair(provider, model)
    }

    fn cached(&self, provider: Provider) -> Option<ModelList> {
        let cache = self.cache.lock().expect("model cache lock");
        let (at, list) = cache.get(&provider)?;
        (at.elapsed() < self.ttl).then(|| list.clone())
    }

    async fn fetch(&self, endpoint: &ProviderEndpoint) -> ModelList {
        let provider = endpoint.provider;
        let provider_error = match self.fetch_from_provider(endpoint).await {
            Ok(models) if !models.is_empty() => {
                return ModelList {
                    provider,
                    models,
                    source: ListSource::Provider,
                    error: None,
                };
            }
            Ok(_) => format!("{provider} returned no models"),
            Err(e) => e,
        };

        match self.fetch_from_openrouter(provider).await {
            Ok(models) if !models.is_empty() => ModelList {
                provider,
                models,
                source: ListSource::Openrouter,
                error: Some(provider_error),
            },
            other => {
                let openrouter_error = match other {
                    Ok(_) => "OpenRouter has no models for this provider".to_string(),
                    Err(e) => e,
                };
                ModelList {
                    provider,
                    models: static_models(provider),
                    source: ListSource::Static,
                    error: Some(format!("{provider_error}; {openrouter_error}")),
                }
            }
        }
    }

    async fn fetch_from_provider(
        &self,
        endpoint: &ProviderEndpoint,
    ) -> Result<Vec<ModelEntry>, String> {
        let base = endpoint.base_url.trim_end_matches('/');
        let request = match endpoint.provider {
            Provider::Anthropic => self
                .http
                .get(format!("{base}/v1/models?limit=1000"))
                .header("x-api-key", &endpoint.api_key)
                .header("anthropic-version", ANTHROPIC_API_VERSION),
            Provider::OpenAi => self
                .http
                .get(format!("{base}/v1/models"))
                .bearer_auth(&endpoint.api_key),
            Provider::Gemini => self
                .http
                .get(format!("{base}/v1beta/models?pageSize=1000"))
                .header("x-goog-api-key", &endpoint.api_key),
            Provider::Ollama => self
                .http
                .get(format!("{base}/api/tags"))
                .bearer_auth(&endpoint.api_key),
            Provider::ClaudeCli => return Err("claude-cli has no list API".to_string()),
        };
        let provider = endpoint.provider;
        let response = request
            .send()
            .await
            .map_err(|e| format!("{provider} list request failed: {e}"))?;
        let status = response.status();
        if !status.is_success() {
            return Err(format!("{provider} list request returned HTTP {status}"));
        }
        let body: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("{provider} list response was not JSON: {e}"))?;
        Ok(parse_provider_list(provider, &body))
    }

    async fn fetch_from_openrouter(&self, provider: Provider) -> Result<Vec<ModelEntry>, String> {
        let mut db = ModelDb::new(None, Duration::ZERO);
        db.fetch_from(&self.openrouter_url)
            .await
            .map_err(|e| format!("OpenRouter list failed: {e}"))?;
        Ok(db
            .models()
            .iter()
            .filter(|m| m.provider == provider)
            .map(|m| ModelEntry {
                id: m.id.clone(),
                label: m.display_name.clone(),
                aliases: Vec::new(),
            })
            .collect())
    }
}

fn static_models(provider: Provider) -> Vec<ModelEntry> {
    if provider == Provider::ClaudeCli {
        return ModelCatalog::claude_cli_list().models;
    }
    catalog::models_for_provider(provider)
        .into_iter()
        .map(|m| ModelEntry {
            id: m.id.to_string(),
            label: m.display_name.to_string(),
            aliases: m.aliases.iter().map(|a| (*a).to_string()).collect(),
        })
        .collect()
}

/// Name fragments that mark an OpenAI model as not usable for text generation.
const OPENAI_NON_CHAT: [&str; 9] = [
    "audio",
    "realtime",
    "transcribe",
    "tts",
    "image",
    "embedding",
    "moderation",
    "search",
    "instruct",
];

fn is_openai_chat_model(id: &str) -> bool {
    let family = id.starts_with("gpt-")
        || id.starts_with("chatgpt-")
        || ["o1", "o3", "o4"]
            .iter()
            .any(|p| id == *p || id.starts_with(&format!("{p}-")));
    family && !OPENAI_NON_CHAT.iter().any(|bad| id.contains(bad))
}

fn str_field<'a>(value: &'a serde_json::Value, key: &str) -> Option<&'a str> {
    value.get(key)?.as_str()
}

fn parse_provider_list(provider: Provider, body: &serde_json::Value) -> Vec<ModelEntry> {
    let items = |key: &str| {
        body.get(key)
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default()
    };
    match provider {
        Provider::Anthropic => items("data")
            .iter()
            .filter_map(|m| {
                let id = str_field(m, "id")?;
                Some(ModelEntry {
                    id: id.to_string(),
                    label: str_field(m, "display_name").unwrap_or(id).to_string(),
                    aliases: Vec::new(),
                })
            })
            .collect(),
        Provider::OpenAi => items("data")
            .iter()
            .filter_map(|m| str_field(m, "id"))
            .filter(|id| is_openai_chat_model(id))
            .map(|id| ModelEntry::bare(id.to_string()))
            .collect(),
        Provider::Gemini => items("models")
            .iter()
            .filter(|m| {
                m.get("supportedGenerationMethods")
                    .and_then(|v| v.as_array())
                    .is_some_and(|ms| ms.iter().any(|x| x == "generateContent"))
            })
            .filter_map(|m| {
                let id = str_field(m, "name")?.trim_start_matches("models/");
                Some(ModelEntry {
                    id: id.to_string(),
                    label: str_field(m, "displayName").unwrap_or(id).to_string(),
                    aliases: Vec::new(),
                })
            })
            .collect(),
        Provider::Ollama => items("models")
            .iter()
            .filter_map(|m| str_field(m, "name"))
            .map(|id| ModelEntry::bare(id.to_string()))
            .collect(),
        Provider::ClaudeCli => Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::time::Duration;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn endpoint(provider: Provider, server: &MockServer) -> ProviderEndpoint {
        ProviderEndpoint {
            provider,
            api_key: "test-key".into(),
            base_url: server.uri(),
        }
    }

    fn catalog_with_openrouter(url: &str) -> ModelCatalog {
        ModelCatalog::with_openrouter_url(Duration::from_secs(60), url.to_string())
    }

    /// A catalog whose OpenRouter fallback points at a closed port.
    fn catalog_without_openrouter() -> ModelCatalog {
        catalog_with_openrouter("http://127.0.0.1:1/models")
    }

    fn ids(list: &ModelList) -> Vec<&str> {
        list.models.iter().map(|m| m.id.as_str()).collect()
    }

    #[tokio::test]
    async fn anthropic_list_comes_from_the_provider() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/v1/models"))
            .and(header("x-api-key", "test-key"))
            .and(header("anthropic-version", "2023-06-01"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": [
                    {"id": "claude-opus-5", "display_name": "Claude Opus 5"},
                    {"id": "claude-sonnet-5", "display_name": "Claude Sonnet 5"}
                ]
            })))
            .mount(&server)
            .await;

        let list = catalog_without_openrouter()
            .list(&endpoint(Provider::Anthropic, &server))
            .await;

        assert_eq!(list.source, ListSource::Provider);
        assert_eq!(list.error, None);
        assert_eq!(ids(&list), ["claude-opus-5", "claude-sonnet-5"]);
        assert_eq!(list.models[0].label, "Claude Opus 5");
    }

    #[tokio::test]
    async fn openai_list_keeps_chat_models_only() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/v1/models"))
            .and(header("authorization", "Bearer test-key"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": [
                    {"id": "gpt-5.2"},
                    {"id": "o3"},
                    {"id": "text-embedding-3-small"},
                    {"id": "whisper-1"},
                    {"id": "gpt-4o-realtime-preview"}
                ]
            })))
            .mount(&server)
            .await;

        let list = catalog_without_openrouter()
            .list(&endpoint(Provider::OpenAi, &server))
            .await;

        assert_eq!(list.source, ListSource::Provider);
        assert_eq!(ids(&list), ["gpt-5.2", "o3"]);
    }

    #[tokio::test]
    async fn gemini_list_strips_prefix_and_needs_generate_content() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/v1beta/models"))
            .and(header("x-goog-api-key", "test-key"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "models": [
                    {"name": "models/gemini-2.5-pro", "displayName": "Gemini 2.5 Pro",
                     "supportedGenerationMethods": ["generateContent"]},
                    {"name": "models/embedding-001", "displayName": "Embedding",
                     "supportedGenerationMethods": ["embedContent"]}
                ]
            })))
            .mount(&server)
            .await;

        let list = catalog_without_openrouter()
            .list(&endpoint(Provider::Gemini, &server))
            .await;

        assert_eq!(list.source, ListSource::Provider);
        assert_eq!(ids(&list), ["gemini-2.5-pro"]);
        assert_eq!(list.models[0].label, "Gemini 2.5 Pro");
    }

    #[tokio::test]
    async fn ollama_list_reads_tags() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/api/tags"))
            .and(header("authorization", "Bearer test-key"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "models": [{"name": "gemma4:31b-cloud"}, {"name": "llama3:8b"}]
            })))
            .mount(&server)
            .await;

        let list = catalog_without_openrouter()
            .list(&endpoint(Provider::Ollama, &server))
            .await;

        assert_eq!(list.source, ListSource::Provider);
        assert_eq!(ids(&list), ["gemma4:31b-cloud", "llama3:8b"]);
    }

    #[tokio::test]
    async fn provider_failure_falls_back_to_openrouter() {
        let provider = MockServer::start().await;
        Mock::given(method("GET"))
            .respond_with(ResponseTemplate::new(500))
            .mount(&provider)
            .await;
        let openrouter = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/models"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": [
                    {"id": "openai/gpt-5.2", "name": "GPT-5.2", "context_length": 400000},
                    {"id": "anthropic/claude-opus-5", "name": "Opus 5", "context_length": 1000000}
                ]
            })))
            .mount(&openrouter)
            .await;

        let list = catalog_with_openrouter(&format!("{}/models", openrouter.uri()))
            .list(&endpoint(Provider::OpenAi, &provider))
            .await;

        assert_eq!(list.source, ListSource::Openrouter);
        assert_eq!(ids(&list), ["gpt-5.2"]);
        assert!(list.error.as_deref().unwrap().contains("500"), "{list:?}");
    }

    #[tokio::test]
    async fn everything_down_falls_back_to_the_static_catalog() {
        let provider = MockServer::start().await;
        Mock::given(method("GET"))
            .respond_with(ResponseTemplate::new(401))
            .mount(&provider)
            .await;

        let list = catalog_without_openrouter()
            .list(&endpoint(Provider::Anthropic, &provider))
            .await;

        assert_eq!(list.source, ListSource::Static);
        assert!(ids(&list).contains(&"claude-opus-5"), "{list:?}");
        assert!(list.error.as_deref().unwrap().contains("401"), "{list:?}");
    }

    #[tokio::test]
    async fn unreachable_ollama_has_an_empty_static_list_and_an_error() {
        let ep = ProviderEndpoint {
            provider: Provider::Ollama,
            api_key: "k".into(),
            base_url: "http://127.0.0.1:1".into(),
        };

        let list = catalog_without_openrouter().list(&ep).await;

        assert_eq!(list.source, ListSource::Static);
        assert!(list.models.is_empty());
        assert!(list.error.is_some());
    }

    #[test]
    fn claude_cli_lists_aliases_only() {
        let list = ModelCatalog::claude_cli_list();

        assert_eq!(list.provider, Provider::ClaudeCli);
        assert_eq!(list.source, ListSource::Static);
        assert_eq!(list.error, None);
        assert_eq!(ids(&list), ["claude-sonnet", "claude-opus", "claude-fable"]);
    }

    #[tokio::test]
    async fn second_list_is_served_from_the_cache() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/api/tags"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"models": [{"name": "a"}]})),
            )
            .expect(1)
            .mount(&server)
            .await;
        let catalog = catalog_without_openrouter();
        let ep = endpoint(Provider::Ollama, &server);

        let first = catalog.list(&ep).await;
        let second = catalog.list(&ep).await;

        assert_eq!(ids(&first), ids(&second));
    }

    #[tokio::test]
    async fn expired_cache_entries_are_refetched() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/api/tags"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"models": [{"name": "a"}]})),
            )
            .expect(2)
            .mount(&server)
            .await;
        let catalog =
            ModelCatalog::with_openrouter_url(Duration::ZERO, "http://127.0.0.1:1".into());
        let ep = endpoint(Provider::Ollama, &server);

        catalog.list(&ep).await;
        catalog.list(&ep).await;
    }

    #[tokio::test]
    async fn validate_pair_accepts_a_model_the_provider_lists() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/v1/models"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "data": [{"id": "gpt-oddname"}]
            })))
            .mount(&server)
            .await;
        let catalog = catalog_without_openrouter();
        let ep = endpoint(Provider::OpenAi, &server);

        assert_eq!(
            catalog
                .validate_pair(Some(&ep), Provider::OpenAi, "gpt-oddname")
                .await,
            Ok(())
        );
        // Without the live list the static rules still apply.
        assert!(
            catalog
                .validate_pair(None, Provider::OpenAi, "claude-opus-5")
                .await
                .is_err()
        );
    }

    #[test]
    fn endpoint_debug_never_shows_the_key() {
        let ep = ProviderEndpoint {
            provider: Provider::Anthropic,
            api_key: "sk-secret".into(),
            base_url: "http://x".into(),
        };

        assert!(!format!("{ep:?}").contains("sk-secret"));
    }
}
