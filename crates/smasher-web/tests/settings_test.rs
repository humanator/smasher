// ABOUTME: Integration tests for GET/PUT /api/settings against a real booted server and a temp data dir.
// ABOUTME: Covers validation, persistence to settings.json, restart reload, and key hygiene; no LLM calls.

use std::sync::Arc;

use reqwest::StatusCode;
use serde_json::{Value, json};
use smasher_llm::client::Client;
use smasher_llm::provider::anthropic::AnthropicAdapter;
use smasher_llm::provider::claude_cli::ClaudeCliAdapter;
use smasher_llm::provider::ollama::OllamaAdapter;
use smasher_llm::types::Provider;
use smasher_web::server::{ServerConfig, start_with_client};
use tokio_util::sync::CancellationToken;

const SECRET: &str = "sk-test-secret";

fn client() -> Client {
    let mut client = Client::new();
    client.register_provider(
        Provider::ClaudeCli,
        Arc::new(ClaudeCliAdapter::new("claude")),
    );
    client.register_provider(
        Provider::Anthropic,
        Arc::new(AnthropicAdapter::with_base_url(
            SECRET.into(),
            "http://127.0.0.1:1".into(),
        )),
    );
    client.register_provider(
        Provider::Ollama,
        Arc::new(OllamaAdapter::with_base_url(
            SECRET.into(),
            "http://127.0.0.1:1".into(),
        )),
    );
    client
}

/// Boot a server on `data_dir` (a restart when called again on the same dir).
async fn boot(data_dir: &std::path::Path) -> String {
    let config = ServerConfig {
        port: 0,
        host: [127, 0, 0, 1],
        model: smasher_llm::types::DEFAULT_MODEL.into(),
        provider: None,
        data_dir: data_dir.display().to_string(),
        workflow_dirs: vec![],
    };
    let server = start_with_client(config, client(), CancellationToken::new())
        .await
        .expect("server boots");
    format!("http://{}", server.addr)
}

async fn get(base: &str) -> Value {
    let resp = reqwest::get(format!("{base}/api/settings")).await.unwrap();
    assert_eq!(resp.status(), 200);
    resp.json().await.unwrap()
}

async fn put(base: &str, body: Value) -> reqwest::Response {
    reqwest::Client::new()
        .put(format!("{base}/api/settings"))
        .json(&body)
        .send()
        .await
        .unwrap()
}

async fn expect_422(resp: reqwest::Response) -> String {
    assert_eq!(resp.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let body: Value = resp.json().await.unwrap();
    body["error"].as_str().expect("error message").to_string()
}

#[tokio::test]
async fn fresh_server_reports_the_built_in_default() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    let body = get(&base).await;

    assert_eq!(body["model"], smasher_llm::types::DEFAULT_MODEL);
    assert!(body["provider"].is_null(), "{body}");
    assert_eq!(body["source"], "default");
}

#[tokio::test]
async fn put_then_get_round_trips_and_persists_to_settings_json() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    let resp = put(
        &base,
        json!({"provider": "claude-cli", "model": "claude-opus"}),
    )
    .await;
    assert_eq!(resp.status(), 200);
    let put_body: Value = resp.json().await.unwrap();

    let got = get(&base).await;
    assert_eq!(got, put_body);
    assert_eq!(got["provider"], "claude-cli");
    assert_eq!(got["model"], "claude-opus");
    assert_eq!(got["source"], "settings");
    let stored: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.path().join("settings.json")).unwrap())
            .unwrap();
    assert_eq!(stored["default_provider"], "claude-cli");
    assert_eq!(stored["default_model"], "claude-opus");
}

#[tokio::test]
async fn put_keeps_the_desktop_fields_already_in_settings_json() {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(
        dir.path().join("settings.json"),
        r#"{"base_urls": {"ollama": "http://localhost:11434"}, "claude_cli_path": "/x/claude"}"#,
    )
    .unwrap();
    let base = boot(dir.path()).await;

    put(
        &base,
        json!({"provider": "claude-cli", "model": "claude-sonnet"}),
    )
    .await;

    let stored: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.path().join("settings.json")).unwrap())
            .unwrap();
    assert_eq!(stored["base_urls"]["ollama"], "http://localhost:11434");
    assert_eq!(stored["claude_cli_path"], "/x/claude");
    assert_eq!(stored["default_model"], "claude-sonnet");
}

#[tokio::test]
async fn saved_settings_survive_a_restart_and_override_the_boot_config() {
    let dir = tempfile::tempdir().unwrap();
    let first = boot(dir.path()).await;
    put(
        &first,
        json!({"provider": "anthropic", "model": "claude-opus-5"}),
    )
    .await;

    let second = boot(dir.path()).await;
    let body = get(&second).await;

    assert_eq!(body["provider"], "anthropic");
    assert_eq!(body["model"], "claude-opus-5");
    assert_eq!(body["source"], "settings");
}

#[tokio::test]
async fn a_corrupt_settings_file_falls_back_to_the_boot_config() {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("settings.json"), "{ not json").unwrap();
    let base = boot(dir.path()).await;

    let body = get(&base).await;

    assert_eq!(body["source"], "default");
}

#[tokio::test]
async fn a_settings_file_that_is_not_an_object_falls_back_to_the_boot_config() {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("settings.json"), "[1, 2]").unwrap();
    let base = boot(dir.path()).await;

    assert_eq!(get(&base).await["source"], "default");
}

#[tokio::test]
async fn a_model_from_another_provider_is_rejected_and_nothing_is_saved() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    let message = expect_422(
        put(
            &base,
            json!({"provider": "claude-cli", "model": "gemma4:31b-cloud"}),
        )
        .await,
    )
    .await;

    assert!(message.contains("gemma4:31b-cloud"), "{message}");
    assert!(!dir.path().join("settings.json").exists());
    assert_eq!(get(&base).await["source"], "default");
}

#[tokio::test]
async fn a_provider_that_is_not_configured_is_rejected() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    let message =
        expect_422(put(&base, json!({"provider": "openai", "model": "gpt-5.2"})).await).await;

    assert!(message.contains("openai"), "{message}");
}

#[tokio::test]
async fn an_unknown_provider_is_rejected() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    expect_422(put(&base, json!({"provider": "nope", "model": "x"})).await).await;
}

#[tokio::test]
async fn ollama_without_a_model_is_rejected_not_defaulted() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    expect_422(put(&base, json!({"provider": "ollama", "model": ""})).await).await;
    expect_422(put(&base, json!({"provider": "ollama"})).await).await;
    assert!(!dir.path().join("settings.json").exists());
}

#[tokio::test]
async fn ollama_with_a_model_is_accepted() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    let resp = put(
        &base,
        json!({"provider": "ollama", "model": "gemma4:31b-cloud"}),
    )
    .await;

    assert_eq!(resp.status(), 200);
}

#[tokio::test]
async fn responses_never_contain_api_keys() {
    let dir = tempfile::tempdir().unwrap();
    let base = boot(dir.path()).await;

    let put_text = put(
        &base,
        json!({"provider": "anthropic", "model": "claude-opus-5"}),
    )
    .await
    .text()
    .await
    .unwrap();
    let get_text = reqwest::get(format!("{base}/api/settings"))
        .await
        .unwrap()
        .text()
        .await
        .unwrap();

    assert!(!put_text.contains(SECRET) && !get_text.contains(SECRET));
}
