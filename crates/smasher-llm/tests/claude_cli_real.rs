// ABOUTME: Real-CLI checks for the claude-cli adapter. Each test spends real money, so all are
// ABOUTME: #[ignore]; run by hand with `cargo test -p smasher-llm --test claude_cli_real -- --ignored`.

use smasher_llm::provider::ProviderAdapter;
use smasher_llm::provider::claude_cli::{ClaudeCliAdapter, process::resolve_binary_from_env};
use smasher_llm::types::{
    ContentPart, DEFAULT_MODEL, ImageData, ImageSourceType, Message, Request, ResponseFormat, Role,
};

/// 16x16 solid red PNG.
const RED_SQUARE_PNG: &str = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR4nGP4z8BAEiJN9aiGUQ1DSgMAkPn/Afnh+ngAAAAASUVORK5CYII=";

fn adapter() -> ClaudeCliAdapter {
    let binary = resolve_binary_from_env(None).expect("no claude binary found");
    ClaudeCliAdapter::new(binary)
}

#[tokio::test]
#[ignore = "spends real money through the claude CLI"]
async fn real_text_answer() {
    let req = Request::new(
        DEFAULT_MODEL,
        vec![Message::user("Reply with exactly the word: pong")],
    );
    let resp = adapter().complete(&req).await.unwrap();
    assert!(
        resp.text().unwrap().to_lowercase().contains("pong"),
        "{resp:?}"
    );
}

#[tokio::test]
#[ignore = "spends real money through the claude CLI"]
async fn real_image_described() {
    let msg = Message {
        role: Role::User,
        content: vec![
            ContentPart::text("What colour is this image? Answer with one word."),
            ContentPart::Image(ImageData {
                source_type: ImageSourceType::Base64,
                media_type: Some("image/png".into()),
                data: RED_SQUARE_PNG.into(),
            }),
        ],
        name: None,
        tool_call_id: None,
    };
    let resp = adapter()
        .complete(&Request::new(DEFAULT_MODEL, vec![msg]))
        .await
        .unwrap();
    assert!(
        resp.text().unwrap().to_lowercase().contains("red"),
        "{resp:?}"
    );
}

#[tokio::test]
#[ignore = "spends real money through the claude CLI"]
async fn real_schema_object() {
    let schema = serde_json::json!({
        "type": "object",
        "properties": {"capital": {"type": "string"}},
        "required": ["capital"],
        "additionalProperties": false
    });
    let req = Request::new(
        DEFAULT_MODEL,
        vec![Message::user("What is the capital of France?")],
    )
    .response_format(ResponseFormat::JsonSchema {
        name: "capital".into(),
        schema,
        strict: true,
    });
    let resp = adapter().complete(&req).await.unwrap();
    let obj: serde_json::Value = serde_json::from_str(&resp.text().unwrap()).unwrap();
    assert_eq!(
        obj["capital"].as_str().map(str::to_lowercase).as_deref(),
        Some("paris")
    );
}

/// Success criterion 4: the trimmed context stays small (the untrimmed default is ~59k).
#[tokio::test]
#[ignore = "spends real money through the claude CLI"]
async fn real_cache_creation_stays_small() {
    let req = Request::new(DEFAULT_MODEL, vec![Message::user("Say hi.")]);
    let resp = adapter().complete(&req).await.unwrap();
    let created = resp.usage.cache_creation_tokens.unwrap_or(0);
    let read = resp.usage.cache_read_tokens.unwrap_or(0);
    assert!(
        created + read < 2_000,
        "cache creation {created} + read {read} should be under 2,000"
    );
}
