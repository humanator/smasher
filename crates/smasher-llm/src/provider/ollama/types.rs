// ABOUTME: Request/response conversion between the unified types and Ollama's native
// ABOUTME: /api/chat wire format (https://docs.ollama.com/api/chat), used for both local and Cloud.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::types::content::{ContentPart, ImageSourceType, ToolCallData, ToolResultData};
use crate::types::message::Message;
use crate::types::request::Request;
use crate::types::response::{FinishReason, Response, Usage};
use crate::types::response_format::ResponseFormat;
use crate::types::role::Role;
use crate::types::tool::ToolDefinition;

#[derive(Debug, Clone, Serialize)]
pub struct OllamaRequest {
    pub model: String,
    pub messages: Vec<OllamaMessage>,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<OllamaOptions>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<OllamaTool>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct OllamaMessage {
    pub role: String,
    #[serde(default)]
    pub content: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<OllamaToolCall>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct OllamaOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_predict: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop: Option<Vec<String>>,
}

impl OllamaOptions {
    fn is_empty(&self) -> bool {
        self.temperature.is_none()
            && self.top_p.is_none()
            && self.num_predict.is_none()
            && self.stop.is_none()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OllamaTool {
    #[serde(rename = "type")]
    pub kind: String,
    pub function: OllamaToolFunction,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OllamaToolFunction {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OllamaToolCall {
    pub function: OllamaToolCallFunction,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OllamaToolCallFunction {
    pub name: String,
    pub arguments: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OllamaResponse {
    pub model: String,
    #[serde(default)]
    pub message: OllamaMessage,
    #[serde(default)]
    pub done: bool,
    #[serde(default)]
    pub done_reason: Option<String>,
    #[serde(default)]
    pub prompt_eval_count: Option<u32>,
    #[serde(default)]
    pub eval_count: Option<u32>,
}

fn map_role(role: Role) -> &'static str {
    match role {
        // Ollama has no "developer" role; a developer-authored instruction is
        // closest in kind to a system message, same simplification `openai`'s
        // and `gemini`'s adapters make for roles their wire format lacks.
        Role::System | Role::Developer => "system",
        Role::User => "user",
        Role::Assistant => "assistant",
        Role::Tool => "tool",
    }
}

/// Converts one unified `Message` into zero or more `OllamaMessage`s. Almost
/// always exactly one; a message whose only content is tool results with no
/// preceding assistant tool call is still emitted as a single `tool` message.
fn convert_message(message: &Message) -> OllamaMessage {
    let role = map_role(message.role).to_string();
    let mut text_parts: Vec<&str> = Vec::new();
    let mut images: Vec<String> = Vec::new();
    let mut tool_calls: Vec<OllamaToolCall> = Vec::new();

    for part in &message.content {
        match part {
            ContentPart::Text { text } => text_parts.push(text),
            ContentPart::Image(image) => match image.source_type {
                // Ollama's native /api/chat only accepts inline base64 images,
                // not URLs; a URL-sourced image is dropped rather than fetched,
                // since this adapter never performs its own network fetches.
                ImageSourceType::Base64 => images.push(image.data.clone()),
                ImageSourceType::Url => {}
            },
            ContentPart::ToolCall(ToolCallData {
                name, arguments, ..
            }) => {
                let arguments = serde_json::from_str(arguments)
                    .unwrap_or_else(|_| serde_json::Value::String(arguments.clone()));
                tool_calls.push(OllamaToolCall {
                    function: OllamaToolCallFunction {
                        name: name.clone(),
                        arguments,
                    },
                });
            }
            ContentPart::ToolResult(ToolResultData { content, .. }) => text_parts.push(content),
            // Audio/document/thinking content has no Ollama chat-message analogue.
            _ => {}
        }
    }

    OllamaMessage {
        role,
        content: text_parts.join("\n\n"),
        images: (!images.is_empty()).then_some(images),
        tool_calls: (!tool_calls.is_empty()).then_some(tool_calls),
    }
}

pub fn convert_request(request: &Request) -> OllamaRequest {
    let mut messages = Vec::with_capacity(request.messages.len() + 1);
    if let Some(system_prompt) = &request.system_prompt {
        messages.push(OllamaMessage {
            role: "system".to_string(),
            content: system_prompt.clone(),
            images: None,
            tool_calls: None,
        });
    }
    messages.extend(request.messages.iter().map(convert_message));

    let options = OllamaOptions {
        temperature: request.temperature,
        top_p: request.top_p,
        num_predict: request.max_tokens,
        stop: request.stop_sequences.clone(),
    };

    let tools = request.tools.as_ref().map(|tools| {
        tools
            .iter()
            .map(|t: &ToolDefinition| OllamaTool {
                kind: "function".to_string(),
                function: OllamaToolFunction {
                    name: t.name.clone(),
                    description: t.description.clone(),
                    parameters: t.parameters.clone(),
                },
            })
            .collect()
    });

    OllamaRequest {
        model: request.model.clone(),
        messages,
        stream: false,
        options: (!options.is_empty()).then_some(options),
        format: matches!(request.response_format, Some(ResponseFormat::JsonObject))
            .then(|| "json".to_string()),
        tools,
    }
}

fn map_finish_reason(done_reason: Option<String>) -> Option<FinishReason> {
    done_reason.map(|reason| match reason.as_str() {
        "stop" => FinishReason::Stop,
        "length" => FinishReason::Length,
        other => FinishReason::Other(other.to_string()),
    })
}

pub fn convert_response(response: OllamaResponse) -> Response {
    let mut content = Vec::new();
    if !response.message.content.is_empty() {
        content.push(ContentPart::text(response.message.content));
    }
    for tool_call in response.message.tool_calls.into_iter().flatten() {
        content.push(ContentPart::ToolCall(ToolCallData {
            id: Uuid::new_v4().to_string(),
            name: tool_call.function.name,
            arguments: serde_json::to_string(&tool_call.function.arguments)
                .unwrap_or_else(|_| "{}".to_string()),
            raw_arguments: None,
        }));
    }

    Response {
        id: Uuid::new_v4().to_string(),
        model: response.model,
        content,
        finish_reason: map_finish_reason(response.done_reason),
        usage: Usage {
            input_tokens: response.prompt_eval_count.unwrap_or(0),
            output_tokens: response.eval_count.unwrap_or(0),
            ..Default::default()
        },
        warnings: Vec::new(),
        rate_limit: None,
        provider: Some("ollama".to_string()),
        raw: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::content::{ImageData, ImageSourceType};
    use crate::types::request::Request;

    // ── convert_request: messages ──────────────────────────────────────

    #[test]
    fn convert_request_basic_user_text() {
        let request = Request::new("gemma4:31b-cloud", vec![Message::user("hello")]);
        let ollama_req = convert_request(&request);

        assert_eq!(ollama_req.model, "gemma4:31b-cloud");
        assert_eq!(ollama_req.messages.len(), 1);
        assert_eq!(ollama_req.messages[0].role, "user");
        assert_eq!(ollama_req.messages[0].content, "hello");
        assert!(ollama_req.messages[0].images.is_none());
        assert!(!ollama_req.stream);
    }

    #[test]
    fn convert_request_system_prompt_becomes_leading_system_message() {
        let request = Request::new("m", vec![Message::user("hi")]).system_prompt("be terse");
        let ollama_req = convert_request(&request);

        assert_eq!(ollama_req.messages.len(), 2);
        assert_eq!(ollama_req.messages[0].role, "system");
        assert_eq!(ollama_req.messages[0].content, "be terse");
        assert_eq!(ollama_req.messages[1].role, "user");
    }

    #[test]
    fn convert_request_multiple_text_parts_join_with_blank_line() {
        let message = Message {
            role: Role::User,
            content: vec![ContentPart::text("first"), ContentPart::text("second")],
            name: None,
            tool_call_id: None,
        };
        let request = Request::new("m", vec![message]);
        let ollama_req = convert_request(&request);

        assert_eq!(ollama_req.messages[0].content, "first\n\nsecond");
    }

    #[test]
    fn convert_request_base64_image_goes_into_images_array() {
        let message = Message {
            role: Role::User,
            content: vec![
                ContentPart::text("what is this?"),
                ContentPart::Image(ImageData {
                    source_type: ImageSourceType::Base64,
                    media_type: Some("image/png".to_string()),
                    data: "aWNvbg==".to_string(),
                }),
            ],
            name: None,
            tool_call_id: None,
        };
        let request = Request::new("m", vec![message]);
        let ollama_req = convert_request(&request);

        assert_eq!(ollama_req.messages[0].content, "what is this?");
        assert_eq!(
            ollama_req.messages[0].images,
            Some(vec!["aWNvbg==".to_string()])
        );
    }

    #[test]
    fn convert_request_url_image_is_dropped_not_fetched() {
        let message = Message {
            role: Role::User,
            content: vec![ContentPart::Image(ImageData {
                source_type: ImageSourceType::Url,
                media_type: None,
                data: "https://example.com/cat.png".to_string(),
            })],
            name: None,
            tool_call_id: None,
        };
        let request = Request::new("m", vec![message]);
        let ollama_req = convert_request(&request);

        assert!(ollama_req.messages[0].images.is_none());
    }

    #[test]
    fn convert_request_developer_role_maps_to_system() {
        let request = Request::new("m", vec![Message::developer("follow style guide")]);
        let ollama_req = convert_request(&request);

        assert_eq!(ollama_req.messages[0].role, "system");
    }

    #[test]
    fn convert_request_tool_result_message_maps_to_tool_role() {
        let request = Request::new("m", vec![Message::tool_result("call_1", "42", false)]);
        let ollama_req = convert_request(&request);

        assert_eq!(ollama_req.messages[0].role, "tool");
        assert_eq!(ollama_req.messages[0].content, "42");
    }

    #[test]
    fn convert_request_assistant_tool_call_roundtrips_arguments_as_json_value() {
        let message = Message {
            role: Role::Assistant,
            content: vec![ContentPart::ToolCall(ToolCallData {
                id: "call_1".to_string(),
                name: "search".to_string(),
                arguments: r#"{"query":"rust"}"#.to_string(),
                raw_arguments: None,
            })],
            name: None,
            tool_call_id: None,
        };
        let request = Request::new("m", vec![message]);
        let ollama_req = convert_request(&request);

        let tool_calls = ollama_req.messages[0].tool_calls.as_ref().unwrap();
        assert_eq!(tool_calls.len(), 1);
        assert_eq!(tool_calls[0].function.name, "search");
        assert_eq!(
            tool_calls[0].function.arguments,
            serde_json::json!({"query": "rust"})
        );
    }

    // ── convert_request: options/format/tools ────────────────────────

    #[test]
    fn convert_request_no_sampling_params_omits_options() {
        let request = Request::new("m", vec![Message::user("hi")]);
        let ollama_req = convert_request(&request);
        assert!(ollama_req.options.is_none());
    }

    #[test]
    fn convert_request_temperature_and_max_tokens_populate_options() {
        let request = Request::new("m", vec![Message::user("hi")])
            .temperature(0.0)
            .max_tokens(256)
            .top_p(0.9)
            .stop_sequences(vec!["STOP".to_string()]);
        let ollama_req = convert_request(&request);

        let options = ollama_req.options.unwrap();
        assert_eq!(options.temperature, Some(0.0));
        assert_eq!(options.num_predict, Some(256));
        assert_eq!(options.top_p, Some(0.9));
        assert_eq!(options.stop, Some(vec!["STOP".to_string()]));
    }

    #[test]
    fn convert_request_json_object_format_sets_json_string() {
        let request = Request::new("m", vec![Message::user("hi")])
            .response_format(ResponseFormat::JsonObject);
        let ollama_req = convert_request(&request);
        assert_eq!(ollama_req.format, Some("json".to_string()));
    }

    #[test]
    fn convert_request_text_format_omits_format_field() {
        let request =
            Request::new("m", vec![Message::user("hi")]).response_format(ResponseFormat::Text);
        let ollama_req = convert_request(&request);
        assert_eq!(ollama_req.format, None);
    }

    #[test]
    fn convert_request_tools_convert_to_ollama_function_shape() {
        let tool = ToolDefinition::new(
            "get_weather",
            "Get the weather",
            serde_json::json!({"type": "object", "properties": {}}),
        );
        let request = Request::new("m", vec![Message::user("hi")]).tools(vec![tool]);
        let ollama_req = convert_request(&request);

        let tools = ollama_req.tools.unwrap();
        assert_eq!(tools.len(), 1);
        assert_eq!(tools[0].kind, "function");
        assert_eq!(tools[0].function.name, "get_weather");
        assert_eq!(tools[0].function.description, "Get the weather");
    }

    #[test]
    fn convert_request_stream_field_always_false() {
        let request = Request::new("m", vec![Message::user("hi")]).stream(true);
        let ollama_req = convert_request(&request);
        // convert_request always builds a non-streaming request; the adapter's
        // stream() method flips this field explicitly, same as Anthropic's.
        assert!(!ollama_req.stream);
    }

    // ── OllamaRequest JSON shape ──────────────────────────────────────

    #[test]
    fn ollama_request_serializes_without_null_options_or_format() {
        let request = Request::new("m", vec![Message::user("hi")]);
        let ollama_req = convert_request(&request);
        let value = serde_json::to_value(&ollama_req).unwrap();
        let obj = value.as_object().unwrap();

        assert!(!obj.contains_key("options"));
        assert!(!obj.contains_key("format"));
        assert!(!obj.contains_key("tools"));
        assert_eq!(obj["stream"], false);
    }

    #[test]
    fn ollama_message_omits_null_images_and_tool_calls() {
        let message = OllamaMessage {
            role: "user".to_string(),
            content: "hi".to_string(),
            images: None,
            tool_calls: None,
        };
        let value = serde_json::to_value(&message).unwrap();
        let obj = value.as_object().unwrap();
        assert!(!obj.contains_key("images"));
        assert!(!obj.contains_key("tool_calls"));
    }

    // ── convert_response ────────────────────────────────────────────

    fn response_json(body: &str) -> OllamaResponse {
        serde_json::from_str(body).unwrap()
    }

    #[test]
    fn convert_response_simple_text_reply() {
        let ollama_resp = response_json(
            r#"{
                "model": "gemma4:31b-cloud",
                "created_at": "2026-09-11T00:00:00Z",
                "message": {"role": "assistant", "content": "pong"},
                "done": true,
                "done_reason": "stop",
                "prompt_eval_count": 10,
                "eval_count": 2
            }"#,
        );

        let response = convert_response(ollama_resp);

        assert_eq!(response.model, "gemma4:31b-cloud");
        assert_eq!(response.text().as_deref(), Some("pong"));
        assert_eq!(response.finish_reason, Some(FinishReason::Stop));
        assert_eq!(response.usage.input_tokens, 10);
        assert_eq!(response.usage.output_tokens, 2);
        assert_eq!(response.provider.as_deref(), Some("ollama"));
    }

    #[test]
    fn convert_response_unrecognized_done_reason_maps_to_other() {
        let ollama_resp = response_json(
            r#"{
                "model": "m",
                "message": {"role": "assistant", "content": "hi"},
                "done": true,
                "done_reason": "content_filter"
            }"#,
        );
        let response = convert_response(ollama_resp);
        assert_eq!(
            response.finish_reason,
            Some(FinishReason::Other("content_filter".to_string()))
        );
    }

    #[test]
    fn convert_response_missing_done_reason_yields_none() {
        let ollama_resp = response_json(
            r#"{"model": "m", "message": {"role": "assistant", "content": "hi"}, "done": true}"#,
        );
        let response = convert_response(ollama_resp);
        assert_eq!(response.finish_reason, None);
    }

    #[test]
    fn convert_response_tool_calls_become_tool_call_content_parts() {
        let ollama_resp = response_json(
            r#"{
                "model": "m",
                "message": {
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [
                        {"function": {"name": "search", "arguments": {"q": "rust"}}}
                    ]
                },
                "done": true,
                "done_reason": "stop"
            }"#,
        );
        let response = convert_response(ollama_resp);

        assert_eq!(response.content.len(), 1);
        match &response.content[0] {
            ContentPart::ToolCall(data) => {
                assert_eq!(data.name, "search");
                assert_eq!(
                    serde_json::from_str::<serde_json::Value>(&data.arguments).unwrap(),
                    serde_json::json!({"q": "rust"})
                );
                assert!(!data.id.is_empty());
            }
            other => panic!("expected ToolCall, got {other:?}"),
        }
    }

    #[test]
    fn convert_response_empty_content_with_no_tool_calls_yields_no_content_parts() {
        let ollama_resp = response_json(
            r#"{"model": "m", "message": {"role": "assistant", "content": ""}, "done": true}"#,
        );
        let response = convert_response(ollama_resp);
        assert!(response.content.is_empty());
    }
}
