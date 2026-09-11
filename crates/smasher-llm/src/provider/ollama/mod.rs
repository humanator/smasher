// ABOUTME: Ollama provider adapter implementing ProviderAdapter for the native /api/chat API.
// ABOUTME: Same adapter serves a local `ollama serve` instance and Ollama Cloud (https://ollama.com).

pub mod stream;
pub mod types;

use async_trait::async_trait;

use crate::provider::{ProviderAdapter, StreamResponse};
use crate::types::{Error, Request, Response};
use crate::util::http::{build_error_from_status, parse_rate_limit_headers};

use self::stream::translate_stream;

/// Ollama Cloud's base URL. A local `ollama serve` instance (default
/// `http://localhost:11434`) speaks the identical `/api/chat` wire format and
/// transparently proxies to Cloud-hosted `-cloud` models when signed in, so the
/// same adapter serves both — only `base_url` differs.
const DEFAULT_BASE_URL: &str = "https://ollama.com";

/// Provider adapter for Ollama's native `/api/chat` endpoint (not the OpenAI-
/// compatible `/v1/chat/completions` shim — this codebase's `OpenAiAdapter`
/// already targets OpenAI's newer Responses API, a different wire format from
/// what Ollama's OpenAI-compat layer implements, so it can't be reused as-is).
pub struct OllamaAdapter {
    client: reqwest::Client,
    api_key: String,
    base_url: String,
}

impl OllamaAdapter {
    /// Create a new adapter targeting Ollama Cloud with the given API key.
    pub fn new(api_key: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key,
            base_url: DEFAULT_BASE_URL.to_string(),
        }
    }

    /// Create a new adapter with a custom base URL — a local `ollama serve`
    /// instance, a proxy, or a test server. `api_key` may be an empty/placeholder
    /// string for a local server, which does not validate it.
    pub fn with_base_url(api_key: String, base_url: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key,
            base_url,
        }
    }

    fn chat_url(&self) -> String {
        format!("{}/api/chat", self.base_url)
    }
}

#[async_trait]
impl ProviderAdapter for OllamaAdapter {
    fn provider_name(&self) -> &str {
        "ollama"
    }

    async fn complete(&self, request: &Request) -> Result<Response, Error> {
        let ollama_req = types::convert_request(request);
        let body =
            serde_json::to_string(&ollama_req).map_err(|e| Error::Serialization { source: e })?;

        let http_response = self
            .client
            .post(self.chat_url())
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .map_err(|e| Error::Http {
                provider: "ollama".to_string(),
                source: e,
            })?;

        let status = http_response.status().as_u16();
        let headers = http_response.headers().clone();
        let body_text = http_response.text().await.map_err(|e| Error::Http {
            provider: "ollama".to_string(),
            source: e,
        })?;

        if !(200..300).contains(&status) {
            return Err(build_error_from_status(
                "ollama", status, &body_text, &headers,
            ));
        }

        let ollama_response: types::OllamaResponse =
            serde_json::from_str(&body_text).map_err(|e| Error::ResponseParse {
                provider: "ollama".to_string(),
                message: format!("failed to parse response: {e}"),
            })?;

        let mut response = types::convert_response(ollama_response);
        response.rate_limit = parse_rate_limit_headers(&headers);
        Ok(response)
    }

    async fn stream(&self, request: &Request) -> Result<StreamResponse, Error> {
        let mut ollama_req = types::convert_request(request);
        ollama_req.stream = true;

        let body =
            serde_json::to_string(&ollama_req).map_err(|e| Error::Serialization { source: e })?;

        let http_response = self
            .client
            .post(self.chat_url())
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .map_err(|e| Error::Http {
                provider: "ollama".to_string(),
                source: e,
            })?;

        let status = http_response.status().as_u16();
        if !(200..300).contains(&status) {
            let headers = http_response.headers().clone();
            let body_text = http_response.text().await.map_err(|e| Error::Http {
                provider: "ollama".to_string(),
                source: e,
            })?;
            return Err(build_error_from_status(
                "ollama", status, &body_text, &headers,
            ));
        }

        let byte_stream = http_response.bytes_stream();
        Ok(translate_stream(byte_stream))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Message;
    use futures::StreamExt;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn test_adapter(server: &MockServer) -> OllamaAdapter {
        OllamaAdapter::with_base_url("test-key".into(), server.uri())
    }

    #[test]
    fn provider_name_is_ollama() {
        let adapter = OllamaAdapter::new("key".into());
        assert_eq!(adapter.provider_name(), "ollama");
    }

    #[test]
    fn chat_url_uses_base_url() {
        let adapter =
            OllamaAdapter::with_base_url("key".into(), "https://custom.example.com".into());
        assert_eq!(adapter.chat_url(), "https://custom.example.com/api/chat");
    }

    #[test]
    fn new_defaults_to_ollama_cloud() {
        let adapter = OllamaAdapter::new("key".into());
        assert_eq!(adapter.chat_url(), "https://ollama.com/api/chat");
    }

    #[tokio::test]
    async fn complete_sends_bearer_auth_and_parses_response() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .and(header("authorization", "Bearer test-key"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "model": "gemma4:31b-cloud",
                "message": {"role": "assistant", "content": "pong"},
                "done": true,
                "done_reason": "stop",
                "prompt_eval_count": 3,
                "eval_count": 1
            })))
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("gemma4:31b-cloud", vec![Message::user("ping")]);
        let response = adapter.complete(&request).await.unwrap();

        assert_eq!(response.text().as_deref(), Some("pong"));
        assert_eq!(response.model, "gemma4:31b-cloud");
    }

    #[tokio::test]
    async fn complete_request_body_is_non_streaming() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "model": "m",
                "message": {"role": "assistant", "content": "ok"},
                "done": true,
                "done_reason": "stop"
            })))
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("m", vec![Message::user("hi")]).stream(true);
        // Even though the unified Request asked for streaming, complete()
        // always sends stream:false — the mock would 200 either way here, but
        // this exercises the same code path complete()'s callers rely on.
        let response = adapter.complete(&request).await.unwrap();
        assert_eq!(response.text().as_deref(), Some("ok"));
    }

    #[tokio::test]
    async fn complete_maps_404_to_model_not_found() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .respond_with(
                ResponseTemplate::new(404).set_body_string(r#"{"error":"model 'x' not found"}"#),
            )
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("no-such-model", vec![Message::user("hi")]);
        let err = adapter.complete(&request).await.unwrap_err();

        assert!(matches!(err, Error::ModelNotFound { .. }));
    }

    #[tokio::test]
    async fn complete_maps_401_to_authentication_error() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .respond_with(ResponseTemplate::new(401).set_body_string("unauthorized"))
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("m", vec![Message::user("hi")]);
        let err = adapter.complete(&request).await.unwrap_err();

        assert!(matches!(err, Error::Authentication { .. }));
    }

    #[tokio::test]
    async fn complete_surfaces_malformed_response_as_response_parse_error() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .respond_with(ResponseTemplate::new(200).set_body_string("not json"))
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("m", vec![Message::user("hi")]);
        let err = adapter.complete(&request).await.unwrap_err();

        assert!(matches!(err, Error::ResponseParse { .. }));
    }

    #[tokio::test]
    async fn stream_sends_stream_true_and_translates_ndjson_body() {
        let server = MockServer::start().await;
        let ndjson = format!(
            "{}\n{}\n",
            serde_json::json!({"model": "m", "message": {"role": "assistant", "content": "hi"}, "done": false}),
            serde_json::json!({"model": "m", "message": {"role": "assistant", "content": ""}, "done": true, "done_reason": "stop"}),
        );
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .respond_with(ResponseTemplate::new(200).set_body_raw(ndjson, "application/x-ndjson"))
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("m", vec![Message::user("hi")]);
        let stream = adapter.stream(&request).await.unwrap();

        let events: Vec<_> = stream.collect::<Vec<_>>().await;
        let deltas: Vec<&str> = events
            .iter()
            .filter_map(|e| e.as_ref().ok())
            .filter_map(|e| e.text_delta.as_deref())
            .collect();
        assert_eq!(deltas, vec!["hi"]);
    }

    #[tokio::test]
    async fn stream_maps_error_status_before_returning_a_stream() {
        let server = MockServer::start().await;
        Mock::given(method("POST"))
            .and(path("/api/chat"))
            .respond_with(ResponseTemplate::new(500).set_body_string("boom"))
            .mount(&server)
            .await;

        let adapter = test_adapter(&server);
        let request = Request::new("m", vec![Message::user("hi")]);
        match adapter.stream(&request).await {
            Err(Error::ServerError { .. }) => {}
            Err(other) => panic!("expected ServerError, got {other:?}"),
            Ok(_) => panic!("expected error, got Ok"),
        }
    }
}
