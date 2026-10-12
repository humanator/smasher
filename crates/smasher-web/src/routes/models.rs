// ABOUTME: GET /api/models: the models available for each configured LLM provider.
// ABOUTME: Lists come from the provider's API, with OpenRouter and static-catalog fallbacks.

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use futures::future::join_all;
use serde::Serialize;

use smasher_llm::models_list::{ModelCatalog, ModelEntry};
use smasher_llm::types::Provider;
use smasher_llm::types::catalog::default_model_for;

use crate::state::AppState;

/// Display order of providers in the response.
const PROVIDER_ORDER: [Provider; 5] = [
    Provider::Anthropic,
    Provider::OpenAi,
    Provider::Gemini,
    Provider::Ollama,
    Provider::ClaudeCli,
];

#[derive(Debug, Serialize)]
struct ProviderModels {
    /// The id the rest of the API accepts back (`Provider`'s Display form, e.g. `openai`).
    provider: String,
    label: &'static str,
    default_model: Option<&'static str>,
    models: Vec<ModelEntry>,
    source: smasher_llm::models_list::ListSource,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
struct ModelsResponse {
    providers: Vec<ProviderModels>,
}

fn label(provider: Provider) -> &'static str {
    match provider {
        Provider::Anthropic => "Anthropic",
        Provider::OpenAi => "OpenAI",
        Provider::Gemini => "Gemini",
        Provider::Ollama => "Ollama",
        Provider::ClaudeCli => "Claude CLI",
    }
}

async fn list_models(State(state): State<AppState>) -> Json<ModelsResponse> {
    let client = state.client();
    let endpoints = state.model_endpoints();
    let configured = PROVIDER_ORDER
        .into_iter()
        .filter(|p| client.has_provider(p));

    let lists = join_all(configured.map(|provider| {
        let (state, endpoints) = (&state, &endpoints);
        async move {
            let list = match endpoints.iter().find(|e| e.provider == provider) {
                _ if provider == Provider::ClaudeCli => ModelCatalog::claude_cli_list(),
                Some(endpoint) => state.models.list(endpoint).await,
                None => state.models.static_list(provider),
            };
            ProviderModels {
                provider: provider.to_string(),
                label: label(provider),
                default_model: default_model_for(provider),
                models: list.models,
                source: list.source,
                error: list.error,
            }
        }
    }))
    .await;

    Json(ModelsResponse { providers: lists })
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/models", get(list_models))
}
