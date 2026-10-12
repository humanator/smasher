// ABOUTME: GET/PUT /api/settings: the default provider and model for new runs.
// ABOUTME: PUT validates the pair, saves it to settings.json, and applies it to runs started afterwards.

use std::path::Path;

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;

use smasher_llm::types::Provider;

use crate::error::WebError;
use crate::settings::{self, DefaultsSource, LlmDefaults};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
struct PutSettings {
    provider: Option<String>,
    model: Option<String>,
}

async fn get_settings(State(state): State<AppState>) -> Json<LlmDefaults> {
    Json(state.llm_defaults())
}

async fn put_settings(
    State(state): State<AppState>,
    Json(req): Json<PutSettings>,
) -> Result<Json<LlmDefaults>, WebError> {
    let provider_name = req
        .provider
        .as_deref()
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .ok_or_else(|| WebError::Unprocessable("a provider is required".into()))?;
    let provider: Provider = provider_name.parse().map_err(WebError::Unprocessable)?;
    if !state.client().has_provider(&provider) {
        return Err(WebError::Unprocessable(format!(
            "provider {provider} is not configured on this server"
        )));
    }
    let model = req.model.as_deref().map(str::trim).unwrap_or_default();
    if model.is_empty() {
        return Err(WebError::Unprocessable(format!(
            "choose a model for provider {provider}"
        )));
    }
    let endpoints = state.model_endpoints();
    let endpoint = endpoints.iter().find(|e| e.provider == provider);
    state
        .models
        .validate_pair(endpoint, provider, model)
        .await
        .map_err(WebError::Unprocessable)?;

    settings::save(Path::new(&state.data_dir), &provider.to_string(), model)
        .map_err(|e| WebError::Internal(e.to_string()))?;
    let saved = LlmDefaults {
        provider: Some(provider.to_string()),
        model: model.to_string(),
        source: DefaultsSource::Settings,
    };
    *state.llm.write().expect("llm defaults lock") = saved.clone();
    Ok(Json(saved))
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/settings", get(get_settings).put(put_settings))
}
