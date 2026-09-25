// ABOUTME: Boots the web server with only a fake `claude` CLI configured and runs a codergen
// ABOUTME: pipeline through it, checking the CLI's NDJSON events and token usage reach the run.

use std::os::unix::fs::PermissionsExt;
use std::time::Duration;

use futures::StreamExt;
use serde_json::{Value, json};
use tokio_util::sync::CancellationToken;

use smasher_web::server::{ServerConfig, start};

/// A fake `claude` that records argv, then (after a pause, so the test's SSE
/// subscription is in place) prints a tool call, a text block and a result.
fn fake_claude(dir: &std::path::Path) -> std::path::PathBuf {
    let tool_use = json!({"type": "assistant", "message": {"id": "m1", "content": [
        {"type": "tool_use", "id": "t1", "name": "Write",
         "input": {"file_path": "index.html", "content": "<p>hi</p>"}}
    ]}});
    let text = json!({"type": "assistant", "message": {"id": "m2", "content": [
        {"type": "text", "text": "Wrote index.html"}
    ]}});
    let result = json!({"type": "result", "subtype": "success", "is_error": false,
        "result": "Wrote index.html", "total_cost_usd": 0.0125,
        "usage": {"input_tokens": 18, "output_tokens": 161,
                  "cache_read_input_tokens": 31730, "cache_creation_input_tokens": 15363}});
    std::fs::write(
        dir.join("out.ndjson"),
        format!("{tool_use}\n{text}\n{result}\n"),
    )
    .unwrap();

    let script = dir.join("claude");
    let d = dir.display();
    std::fs::write(
        &script,
        format!(
            "#!/bin/sh\nprintf '%s\\0' \"$@\" > '{d}/argv.txt'\nsleep 1\ncat '{d}/out.ndjson'\n"
        ),
    )
    .unwrap();
    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
    script
}

/// Collects `(event, data)` pairs until the pipeline completes or aborts.
async fn collect_sse(url: String) -> Vec<(String, Value)> {
    let response = reqwest::get(&url).await.expect("SSE connect failed");
    let mut stream = response.bytes_stream();
    let (mut buf, mut name, mut events) = (String::new(), None::<String>, Vec::new());
    while let Some(Ok(chunk)) = stream.next().await {
        buf.push_str(&String::from_utf8_lossy(&chunk));
        while let Some(nl) = buf.find('\n') {
            let line = buf[..nl].trim_end_matches('\r').to_string();
            buf.drain(..=nl);
            if let Some(n) = line.strip_prefix("event: ") {
                name = Some(n.to_string());
            } else if let Some(data) = line.strip_prefix("data: ")
                && let Some(n) = name.take()
                && let Ok(value) = serde_json::from_str::<Value>(data)
            {
                let done = n == "pipeline_completed" || n == "pipeline_aborted";
                events.push((n, value));
                if done {
                    return events;
                }
            }
        }
    }
    events
}

#[tokio::test]
async fn server_runs_codergen_through_claude_cli_with_no_api_keys() {
    let dir = tempfile::tempdir().unwrap();
    let fake = fake_claude(dir.path());
    // SAFETY: this test binary has a single test, so nothing reads env concurrently.
    unsafe {
        std::env::set_var("SMASHER_CLAUDE_CLI", &fake);
        for key in [
            "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY",
            "GEMINI_API_KEY",
            "GOOGLE_API_KEY",
            "OLLAMA_API_KEY",
        ] {
            std::env::remove_var(key);
        }
    }

    let config = ServerConfig {
        port: 0,
        host: [127, 0, 0, 1],
        model: "claude-sonnet-5".into(),
        provider: Some("claude-cli".into()),
        data_dir: dir.path().join("data").display().to_string(),
        workflow_dirs: vec![],
    };
    let shutdown = CancellationToken::new();
    let server = start(config, shutdown.clone())
        .await
        .expect("server should boot with only the claude CLI configured");
    let base = format!("http://{}", server.addr);

    let dot = r#"digraph CliCodergen {
        start [shape=circle];
        build [shape=box, prompt="Write index.html"];
        done [shape=doublecircle];
        start -> build -> done;
    }"#;
    let submit: Value = reqwest::Client::new()
        .post(format!("{base}/api/runs"))
        .json(&json!({"dot_source": dot, "variables": {}}))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let run_id = submit["run_id"].as_str().expect("run_id").to_string();

    let events = tokio::time::timeout(
        Duration::from_secs(30),
        collect_sse(format!("{base}/api/runs/{run_id}/events")),
    )
    .await
    .expect("pipeline did not finish");
    let run: Value = reqwest::get(format!("{base}/api/runs/{run_id}"))
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    shutdown.cancel();

    let names: Vec<&str> = events.iter().map(|(n, _)| n.as_str()).collect();
    assert_eq!(names.last(), Some(&"pipeline_completed"), "{names:?}");
    assert!(!names.contains(&"node_failed"), "{events:?}");
    assert!(
        names.contains(&"agent_tool_call_started"),
        "no tool call event: {names:?}"
    );
    let message = events
        .iter()
        .find(|(n, _)| n == "agent_message")
        .map(|(_, v)| v.to_string())
        .expect("no agent_message event");
    assert!(message.contains("Wrote index.html"), "{message}");

    // The result line's usage reaches the run totals, cache tokens excluded.
    assert_eq!(run["input_tokens"], 18, "{run}");
    assert_eq!(run["output_tokens"], 161, "{run}");

    let argv = std::fs::read_to_string(dir.path().join("argv.txt")).unwrap();
    assert!(argv.contains("dontAsk"), "argv: {argv}");
    assert!(argv.contains("claude-sonnet-5"), "argv: {argv}");
}
