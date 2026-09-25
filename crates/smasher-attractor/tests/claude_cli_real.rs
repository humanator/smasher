// ABOUTME: Real-CLI check that a codergen run through claude -p denies tools outside the allowlist.
// ABOUTME: Spends real money, so #[ignore]; run with `cargo test -p smasher-attractor --test claude_cli_real -- --ignored`.

use std::time::Duration;

use smasher_attractor::claude_cli_backend::ClaudeCliBackend;
use smasher_attractor::handler::CodergenBackend;
use smasher_attractor::state::Context;
use smasher_llm::provider::claude_cli::process::resolve_binary_from_env;

/// Success criterion 3: `curl` isn't on the allowlist, so it's denied and the node
/// ends (success or failure) well inside the timeout instead of hanging.
#[tokio::test]
#[ignore = "spends real money through the claude CLI"]
async fn real_curl_is_denied_and_the_node_ends() {
    let binary = resolve_binary_from_env(None).expect("no claude binary found");
    let dir = tempfile::tempdir().unwrap();
    let backend = ClaudeCliBackend::new(dir.path().display().to_string(), Duration::from_secs(180))
        .with_claude_path(binary.display().to_string())
        .with_streaming(true)
        .with_default_model(Some("sonnet".into()))
        .with_max_consecutive_timeouts(0);

    let outcome = backend
        .generate(
            "Use the Bash tool to run exactly `curl -sI https://example.com`. \
             If the command is denied, reply with the single word DENIED.",
            None,
            None,
            &Context::new(),
        )
        .await
        .expect("backend error");

    let text = format!("{outcome:?}");
    assert!(!text.contains("timed out"), "node hung: {text}");
    assert!(text.contains("DENIED"), "curl was not denied: {text}");
}
