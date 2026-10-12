// ABOUTME: Integration tests for GET /api/models against a real booted server.
// ABOUTME: Provider list APIs are played by a local axum server speaking each list format.

use std::sync::Arc;

use axum::Router;
use axum::http::StatusCode;
use axum::routing::get;
use serde_json::{Value, json};
use smasher_llm::client::Client;
use smasher_llm::models_list::ProviderEndpoint;
use smasher_llm::provider::anthropic::AnthropicAdapter;
use smasher_llm::provider::claude_cli::ClaudeCliAdapter;
use smasher_llm::provider::ollama::OllamaAdapter;
use smasher_llm::types::Provider;
use smasher_web::state::AppState;

const SECRET: &str = "sk-test-secret";

/// Serve `app` on an ephemeral port; returns its base URL.
async fn serve(app: Router) -> String {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    base
}

/// A fake Anthropic list API.
async fn fake_anthropic() -> String {
    serve(Router::new().route(
        "/v1/models",
        get(|| async {
            axum::Json(json!({"data": [
                {"id": "claude-opus-5", "display_name": "Claude Opus 5"},
                {"id": "claude-sonnet-5", "display_name": "Claude Sonnet 5"}
            ]}))
        }),
    ))
    .await
}

async fn failing_provider() -> String {
    serve(Router::new().fallback(|| async { StatusCode::INTERNAL_SERVER_ERROR })).await
}

fn endpoint(provider: Provider, base_url: &str) -> ProviderEndpoint {
    ProviderEndpoint {
        provider,
        api_key: SECRET.into(),
        base_url: base_url.into(),
    }
}

/// Boot the real router around `client` and `endpoints`; returns the server URL.
async fn boot(client: Client, endpoints: Vec<ProviderEndpoint>) -> String {
    let state = AppState::new(client, "test-model".into(), None, "/tmp".into(), vec![])
        .with_model_endpoints(endpoints);
    serve(smasher_web::server::build_router(state)).await
}

async fn get_models(base: &str) -> Value {
    let resp = reqwest::get(format!("{base}/api/models")).await.unwrap();
    assert_eq!(resp.status(), 200);
    resp.json().await.unwrap()
}

fn provider<'a>(body: &'a Value, name: &str) -> &'a Value {
    body["providers"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["provider"] == name)
        .unwrap_or_else(|| panic!("{name} missing from {body}"))
}

#[tokio::test]
async fn lists_exactly_the_configured_providers() {
    let anthropic = fake_anthropic().await;
    let mut client = Client::new();
    client.register_provider(
        Provider::Anthropic,
        Arc::new(AnthropicAdapter::with_base_url(
            SECRET.into(),
            anthropic.clone(),
        )),
    );
    client.register_provider(
        Provider::ClaudeCli,
        Arc::new(ClaudeCliAdapter::new("claude")),
    );
    let base = boot(client, vec![endpoint(Provider::Anthropic, &anthropic)]).await;

    let body = get_models(&base).await;

    let names: Vec<&str> = body["providers"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| p["provider"].as_str().unwrap())
        .collect();
    assert_eq!(names, ["anthropic", "claude-cli"]);
}

#[tokio::test]
async fn anthropic_entry_carries_live_models_and_default() {
    let anthropic = fake_anthropic().await;
    let mut client = Client::new();
    client.register_provider(
        Provider::Anthropic,
        Arc::new(AnthropicAdapter::with_base_url(
            SECRET.into(),
            anthropic.clone(),
        )),
    );
    let base = boot(client, vec![endpoint(Provider::Anthropic, &anthropic)]).await;

    let body = get_models(&base).await;
    let entry = provider(&body, "anthropic");

    assert_eq!(entry["label"], "Anthropic");
    assert_eq!(entry["default_model"], "claude-opus-5");
    assert_eq!(entry["source"], "provider");
    assert!(entry.get("error").is_none(), "{entry}");
    assert_eq!(entry["models"][0]["id"], "claude-opus-5");
    assert_eq!(entry["models"][0]["label"], "Claude Opus 5");
}

#[tokio::test]
async fn claude_cli_lists_aliases_with_a_default() {
    let mut client = Client::new();
    client.register_provider(
        Provider::ClaudeCli,
        Arc::new(ClaudeCliAdapter::new("claude")),
    );
    let base = boot(client, vec![]).await;

    let body = get_models(&base).await;
    let entry = provider(&body, "claude-cli");

    assert_eq!(entry["label"], "Claude CLI");
    assert_eq!(entry["default_model"], "claude-sonnet");
    assert_eq!(entry["models"][1]["id"], "claude-opus");
}

#[tokio::test]
async fn ollama_has_no_default_model() {
    let mut client = Client::new();
    client.register_provider(
        Provider::Ollama,
        Arc::new(OllamaAdapter::with_base_url(
            SECRET.into(),
            "http://127.0.0.1:1".into(),
        )),
    );
    let base = boot(
        client,
        vec![endpoint(Provider::Ollama, "http://127.0.0.1:1")],
    )
    .await;

    let body = get_models(&base).await;
    let entry = provider(&body, "ollama");

    assert!(entry["default_model"].is_null(), "{entry}");
}

#[tokio::test]
async fn failing_list_api_still_returns_200_with_fallback_and_error() {
    let down = failing_provider().await;
    let mut client = Client::new();
    client.register_provider(
        Provider::Anthropic,
        Arc::new(AnthropicAdapter::with_base_url(SECRET.into(), down.clone())),
    );
    let base = boot(client, vec![endpoint(Provider::Anthropic, &down)]).await;

    let body = get_models(&base).await;
    let entry = provider(&body, "anthropic");

    assert!(entry["error"].as_str().unwrap().contains("500"), "{entry}");
    assert!(!entry["models"].as_array().unwrap().is_empty(), "{entry}");
    assert_ne!(entry["source"], "provider");
}

#[tokio::test]
async fn no_providers_configured_returns_an_empty_list() {
    let base = boot(Client::new(), vec![]).await;

    let body = get_models(&base).await;

    assert_eq!(body["providers"], json!([]));
}

#[tokio::test]
async fn response_never_contains_api_keys() {
    let anthropic = fake_anthropic().await;
    let mut client = Client::new();
    client.register_provider(
        Provider::Anthropic,
        Arc::new(AnthropicAdapter::with_base_url(
            SECRET.into(),
            anthropic.clone(),
        )),
    );
    let base = boot(client, vec![endpoint(Provider::Anthropic, &anthropic)]).await;

    let text = reqwest::get(format!("{base}/api/models"))
        .await
        .unwrap()
        .text()
        .await
        .unwrap();

    assert!(!text.contains(SECRET), "{text}");
}
