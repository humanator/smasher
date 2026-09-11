// ABOUTME: Translates Ollama's NDJSON /api/chat stream into unified StreamEvent values.
// ABOUTME: Unlike the other providers, Ollama streams plain newline-delimited JSON, not SSE.

use std::pin::Pin;

use bytes::Bytes;
use futures::Stream;
use uuid::Uuid;

use crate::types::{Error, StreamEvent, Usage};

use super::types::OllamaResponse;

fn map_finish_reason(done_reason: Option<String>) -> Option<crate::types::FinishReason> {
    use crate::types::FinishReason;
    done_reason.map(|reason| match reason.as_str() {
        "stop" => FinishReason::Stop,
        "length" => FinishReason::Length,
        other => FinishReason::Other(other.to_string()),
    })
}

/// Parse Ollama's raw NDJSON response body (one complete `OllamaResponse` JSON
/// object per line, no `data:` prefix) into unified `StreamEvent`s.
///
/// Buffers partial lines across chunk boundaries the same way `parse_sse_stream`
/// buffers partial SSE lines; newline (`0x0A`) never appears inside a multi-byte
/// UTF-8 sequence, so splitting on raw bytes is safe.
pub fn translate_stream(
    byte_stream: impl Stream<Item = Result<Bytes, reqwest::Error>> + Send + 'static,
) -> Pin<Box<dyn Stream<Item = Result<StreamEvent, Error>> + Send>> {
    use async_stream::try_stream;
    use futures::StreamExt;

    Box::pin(try_stream! {
        let mut byte_stream = std::pin::pin!(byte_stream);
        let mut byte_buf: Vec<u8> = Vec::new();
        let mut started = false;
        let content_index: u32 = 0;

        while let Some(chunk_result) = byte_stream.next().await {
            let chunk = chunk_result.map_err(|e| Error::Http {
                provider: "ollama".to_string(),
                source: e,
            })?;
            byte_buf.extend_from_slice(&chunk);

            while let Some(newline_pos) = byte_buf.iter().position(|&b| b == b'\n') {
                let line_bytes = byte_buf[..newline_pos].to_vec();
                byte_buf = byte_buf[newline_pos + 1..].to_vec();
                let line = String::from_utf8_lossy(&line_bytes);
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }

                let parsed: OllamaResponse = serde_json::from_str(line).map_err(|e| {
                    Error::ResponseParse {
                        provider: "ollama".to_string(),
                        message: format!("failed to parse NDJSON line: {e}"),
                    }
                })?;

                if !started {
                    yield StreamEvent::start(String::new(), parsed.model.clone());
                    yield StreamEvent::text_start(content_index);
                    started = true;
                }

                if !parsed.message.content.is_empty() {
                    yield StreamEvent::text_delta(parsed.message.content.clone())
                        .with_content_index(content_index);
                }

                if parsed.done {
                    yield StreamEvent::text_end(content_index);

                    // Ollama sends each tool call whole (no incremental argument
                    // streaming observed in its NDJSON chunks), so each becomes
                    // one start+delta+end triple on the final chunk.
                    for tool_call in parsed.message.tool_calls.into_iter().flatten() {
                        let call_id = Uuid::new_v4().to_string();
                        let arguments = serde_json::to_string(&tool_call.function.arguments)
                            .unwrap_or_default();
                        yield StreamEvent::tool_call_start(
                            call_id.clone(),
                            tool_call.function.name.clone(),
                            content_index,
                        );
                        yield StreamEvent::tool_call_delta(
                            call_id.clone(),
                            Some(tool_call.function.name),
                            arguments,
                        )
                        .with_content_index(content_index);
                        yield StreamEvent::tool_call_end(call_id);
                    }

                    let usage = Usage {
                        input_tokens: parsed.prompt_eval_count.unwrap_or(0),
                        output_tokens: parsed.eval_count.unwrap_or(0),
                        ..Default::default()
                    };
                    yield StreamEvent::end(map_finish_reason(parsed.done_reason), Some(usage));
                }
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::StreamEventType;
    use futures::stream;

    fn mock_stream(
        chunks: Vec<&str>,
    ) -> impl Stream<Item = Result<Bytes, reqwest::Error>> + Send + 'static {
        let owned: Vec<Result<Bytes, reqwest::Error>> = chunks
            .into_iter()
            .map(|s| Ok(Bytes::from(s.to_string())))
            .collect();
        stream::iter(owned)
    }

    async fn collect_events(
        stream: Pin<Box<dyn Stream<Item = Result<StreamEvent, Error>> + Send>>,
    ) -> Vec<StreamEvent> {
        use futures::StreamExt;
        stream
            .collect::<Vec<_>>()
            .await
            .into_iter()
            .map(|r| r.expect("unexpected error in ollama stream"))
            .collect()
    }

    #[tokio::test]
    async fn single_ndjson_line_per_chunk() {
        let lines = [
            r#"{"model":"m","message":{"role":"assistant","content":"1"},"done":false}"#,
            r#"{"model":"m","message":{"role":"assistant","content":",2"},"done":false}"#,
            r#"{"model":"m","message":{"role":"assistant","content":""},"done":true,"done_reason":"stop","prompt_eval_count":5,"eval_count":2}"#,
        ];
        let body: Vec<String> = lines.iter().map(|l| format!("{l}\n")).collect();
        let chunks: Vec<&str> = body.iter().map(String::as_str).collect();

        let events = collect_events(translate_stream(mock_stream(chunks))).await;

        assert_eq!(events[0].event_type, StreamEventType::Start);
        assert_eq!(events[0].model.as_deref(), Some("m"));
        assert_eq!(events[1].event_type, StreamEventType::TextStart);
        assert_eq!(events[2].event_type, StreamEventType::ContentDelta);
        assert_eq!(events[2].text_delta.as_deref(), Some("1"));
        assert_eq!(events[3].event_type, StreamEventType::ContentDelta);
        assert_eq!(events[3].text_delta.as_deref(), Some(",2"));
        assert_eq!(events[4].event_type, StreamEventType::TextEnd);
        assert_eq!(events[5].event_type, StreamEventType::End);
        assert_eq!(events[5].usage.as_ref().unwrap().input_tokens, 5);
        assert_eq!(events[5].usage.as_ref().unwrap().output_tokens, 2);
    }

    #[tokio::test]
    async fn ndjson_line_split_across_chunk_boundary_still_parses() {
        let full_line = r#"{"model":"m","message":{"role":"assistant","content":"hi"},"done":true,"done_reason":"stop"}"#;
        let (left, right) = full_line.split_at(full_line.len() / 2);
        let chunks = vec![left, right, "\n"];

        let events = collect_events(translate_stream(mock_stream(chunks))).await;

        let deltas: Vec<&str> = events
            .iter()
            .filter(|e| e.event_type == StreamEventType::ContentDelta)
            .map(|e| e.text_delta.as_deref().unwrap())
            .collect();
        assert_eq!(deltas, vec!["hi"]);
    }

    #[tokio::test]
    async fn tool_call_on_final_chunk_emits_start_delta_end_triple() {
        let line = r#"{"model":"m","message":{"role":"assistant","content":"","tool_calls":[{"function":{"name":"search","arguments":{"q":"rust"}}}]},"done":true,"done_reason":"stop"}"#;
        let events =
            collect_events(translate_stream(mock_stream(vec![&format!("{line}\n")]))).await;

        let types: Vec<StreamEventType> = events.iter().map(|e| e.event_type).collect();
        assert!(types.contains(&StreamEventType::ToolCallStart));
        assert!(types.contains(&StreamEventType::ToolCallDelta));
        assert!(types.contains(&StreamEventType::ToolCallEnd));

        let delta = events
            .iter()
            .find(|e| e.event_type == StreamEventType::ToolCallDelta)
            .unwrap();
        assert_eq!(delta.tool_name.as_deref(), Some("search"));
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(delta.arguments_delta.as_ref().unwrap())
                .unwrap(),
            serde_json::json!({"q": "rust"})
        );
    }

    #[tokio::test]
    async fn malformed_json_line_surfaces_as_response_parse_error() {
        let mut stream = translate_stream(mock_stream(vec!["not json\n"]));
        let first = futures::StreamExt::next(&mut stream).await.unwrap();
        assert!(matches!(first, Err(Error::ResponseParse { .. })));
    }

    #[tokio::test]
    async fn empty_lines_between_chunks_are_skipped() {
        let line = r#"{"model":"m","message":{"role":"assistant","content":"hi"},"done":true,"done_reason":"stop"}"#;
        let events = collect_events(translate_stream(mock_stream(vec![
            "\n",
            &format!("{line}\n"),
        ])))
        .await;
        assert!(!events.is_empty());
        assert_eq!(events[0].event_type, StreamEventType::Start);
    }
}
