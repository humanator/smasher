// ABOUTME: task_critic pipeline tool: one real vision-model call judging whether a named
// ABOUTME: persona can complete a named task against the candidate's captured screenshot.

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use serde::Deserialize;
use serde_json::Value;
use smasher_llm::client::Client;
use smasher_llm::types::{ContentPart, ImageData, ImageSourceType, Message, Request, Role};

use crate::report::{CriticError, CriticReport, artifact_dir};

const CRITIC_SYSTEM_PROMPT: &str = "You are a usability critic. You are shown a screenshot of \
a UI candidate, a persona, and a task that persona is trying to complete. Judge whether the \
persona could complete the task using only what is visible in the screenshot, and note any \
friction points. Reply with JSON only, no prose, no markdown fences, matching exactly this \
shape: {\"success\": bool, \"friction\": [string, ...], \"notes\": string}.";

/// The subset of fields the model itself is asked to produce. `persona`/`task` are
/// already known from the request and are not re-parsed from the model's reply.
#[derive(Debug, Deserialize)]
struct CriticResponseBody {
    success: bool,
    #[serde(default)]
    friction: Vec<String>,
    #[serde(default)]
    notes: String,
}

fn arg_str<'a>(args: &'a Value, field: &str) -> &'a str {
    args.get(field).and_then(Value::as_str).unwrap_or("")
}

fn parse_response(text: &str, persona: &str, task: &str) -> Result<CriticReport, CriticError> {
    let body: CriticResponseBody =
        serde_json::from_str(text).map_err(|_| CriticError::UnparseableResponse {
            response: text.to_string(),
        })?;

    Ok(CriticReport {
        persona: persona.to_string(),
        task: task.to_string(),
        success: body.success,
        friction: body.friction,
        notes: body.notes,
    })
}

/// Runs `task_critic` against the candidate's already-captured `screenshot.png`.
///
/// `args`: `{run_id, candidate_id, persona, task, model?, provider?}`. A missing
/// `screenshot.png` fails with `CriticError::MissingArtifact` before any network
/// call is attempted. `provider` overrides the model-name-based provider
/// inference `Client::complete()` otherwise does — needed for providers like
/// Ollama, whose model names (e.g. `"gemma4:31b-cloud"`) have no recognizable
/// prefix to infer from.
pub async fn run_task_critic(
    client: &Client,
    default_model: &str,
    args: &Value,
) -> Result<CriticReport, CriticError> {
    let run_id = arg_str(args, "run_id");
    let candidate_id = arg_str(args, "candidate_id");
    let persona = arg_str(args, "persona");
    let task = arg_str(args, "task");
    let model = args
        .get("model")
        .and_then(Value::as_str)
        .unwrap_or(default_model);
    let provider = args.get("provider").and_then(Value::as_str);

    let screenshot_path = artifact_dir(run_id, candidate_id).join("screenshot.png");
    let screenshot = std::fs::read(&screenshot_path).map_err(|_| CriticError::MissingArtifact {
        run_id: run_id.to_string(),
        candidate_id: candidate_id.to_string(),
        path: screenshot_path.display().to_string(),
    })?;

    let mut request = Request::new(
        model,
        vec![Message {
            role: Role::User,
            content: vec![
                ContentPart::text(format!("Persona: {persona}\nTask: {task}")),
                ContentPart::Image(ImageData {
                    source_type: ImageSourceType::Base64,
                    media_type: Some("image/png".to_string()),
                    data: BASE64.encode(&screenshot),
                }),
            ],
            name: None,
            tool_call_id: None,
        }],
    )
    .system_prompt(CRITIC_SYSTEM_PROMPT)
    .temperature(0.0);
    if let Some(provider) = provider {
        request = request.provider(provider);
    }

    let response =
        client
            .complete(request)
            .await
            .map_err(|e| CriticError::UnparseableResponse {
                response: e.to_string(),
            })?;
    let text = response.text().unwrap_or_default();

    parse_response(&text, persona, task)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn well_formed_response_parses_cleanly() {
        let text = r#"{"success": true, "friction": [], "notes": "found it right away"}"#;
        let report = parse_response(text, "new user", "find settings").unwrap();

        assert_eq!(report.persona, "new user");
        assert_eq!(report.task, "find settings");
        assert!(report.success);
        assert!(report.friction.is_empty());
        assert_eq!(report.notes, "found it right away");
    }

    #[test]
    fn response_with_friction_points_parses() {
        let text = r#"{"success": false, "friction": ["no visible button", "unclear label"], "notes": "gave up after 30s"}"#;
        let report = parse_response(text, "returning user", "cancel subscription").unwrap();

        assert!(!report.success);
        assert_eq!(
            report.friction,
            vec!["no visible button".to_string(), "unclear label".to_string()]
        );
    }

    #[test]
    fn non_json_response_produces_unparseable_response_with_raw_text() {
        let text = "Sure! The user succeeded at the task.";
        let err = parse_response(text, "new user", "find settings").unwrap_err();

        match err {
            CriticError::UnparseableResponse { response } => {
                assert_eq!(response, text);
            }
            other => panic!("expected UnparseableResponse, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn missing_screenshot_fails_before_any_network_call() {
        // No provider registered: if the implementation mistakenly called the
        // network before checking the file, that would surface as
        // UnparseableResponse (client error), not MissingArtifact — so asserting
        // the variant here also proves call ordering.
        let client = Client::new();
        let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
        let args = serde_json::json!({
            "run_id": run_id,
            "candidate_id": "no-such-candidate",
            "persona": "new user",
            "task": "find settings",
        });

        let err = run_task_critic(&client, "claude-sonnet-4-20250514", &args)
            .await
            .expect_err("missing screenshot.png must fail");

        assert!(matches!(err, CriticError::MissingArtifact { .. }));
    }

    #[tokio::test]
    async fn provider_override_changes_routing_before_any_network_call() {
        // No provider registered on this client at all, so neither case ever
        // makes a real network call — this proves args["provider"] reaches the
        // Request by observing which *routing* error comes back, distinguishing
        // "couldn't infer a provider for this model name" from "explicitly
        // routed to ollama, which just isn't configured on this client".
        let client = Client::new();
        let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
        let candidate_id = "provider-override-candidate";
        let dir = artifact_dir(&run_id, candidate_id);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("screenshot.png"),
            std::fs::read(
                std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .join("fixtures/candidate/screenshot.png"),
            )
            .unwrap(),
        )
        .unwrap();

        let base_args = serde_json::json!({
            "run_id": run_id,
            "candidate_id": candidate_id,
            "persona": "new user",
            "task": "find settings",
        });

        // Ollama model names (e.g. "gemma4:31b-cloud") have no prefix
        // `infer_provider` recognizes, so without an override this fails with
        // "not found" (ModelNotFound), never reaching provider configuration.
        let no_override_err = run_task_critic(&client, "gemma4:31b-cloud", &base_args)
            .await
            .unwrap_err();
        let CriticError::UnparseableResponse { response } = no_override_err else {
            panic!("expected UnparseableResponse wrapping a client routing error");
        };
        assert!(response.contains("not found"), "got: {response}");

        let mut args_with_provider = base_args.clone();
        args_with_provider["provider"] = serde_json::json!("ollama");
        let override_err = run_task_critic(&client, "gemma4:31b-cloud", &args_with_provider)
            .await
            .unwrap_err();
        let CriticError::UnparseableResponse { response } = override_err else {
            panic!("expected UnparseableResponse wrapping a client routing error");
        };
        assert!(
            response.contains("ollama") && response.contains("not configured"),
            "got: {response}"
        );

        std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
    }
}
