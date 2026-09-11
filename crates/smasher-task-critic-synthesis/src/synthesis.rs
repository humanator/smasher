// ABOUTME: synthesis pipeline tool: one real text-only LLM call reconciling system_lint's
// ABOUTME: lint-report.json and task_critic's critic-report.json into a proceed/iterate call.

use serde::Deserialize;
use serde_json::Value;
use smasher_llm::client::Client;
use smasher_llm::types::{Message, Request};

use crate::report::{CriticError, Recommendation, SynthesisReport, artifact_dir};

const SYNTHESIS_SYSTEM_PROMPT: &str = "You are reconciling two reports about a UI candidate: \
a deterministic design-system lint report and a usability critic's task report. Decide \
whether the pipeline should proceed with this candidate or iterate on it, and give reasons \
that cite both reports. Reply with JSON only, no prose, no markdown fences, matching exactly \
this shape: {\"recommendation\": \"proceed\"|\"iterate\", \"reasons\": [string, ...]}.";

#[derive(Debug, Deserialize)]
struct SynthesisResponseBody {
    recommendation: Recommendation,
    #[serde(default)]
    reasons: Vec<String>,
}

fn arg_str<'a>(args: &'a Value, field: &str) -> &'a str {
    args.get(field).and_then(Value::as_str).unwrap_or("")
}

fn read_report_artifact(
    run_id: &str,
    candidate_id: &str,
    filename: &str,
) -> Result<String, CriticError> {
    let path = artifact_dir(run_id, candidate_id).join(filename);
    std::fs::read_to_string(&path).map_err(|_| CriticError::MissingArtifact {
        run_id: run_id.to_string(),
        candidate_id: candidate_id.to_string(),
        path: path.display().to_string(),
    })
}

fn parse_response(text: &str) -> Result<SynthesisReport, CriticError> {
    let body: SynthesisResponseBody =
        serde_json::from_str(text).map_err(|_| CriticError::UnparseableResponse {
            response: text.to_string(),
        })?;

    Ok(SynthesisReport {
        recommendation: body.recommendation,
        reasons: body.reasons,
    })
}

/// Runs `synthesis` against a candidate's already-written `lint-report.json` and
/// `critic-report.json`.
///
/// `args`: `{run_id, candidate_id, model?}`. A missing `lint-report.json` or
/// `critic-report.json` fails with `CriticError::MissingArtifact` naming the exact
/// missing file, before any network call is attempted.
pub async fn run_synthesis(
    client: &Client,
    default_model: &str,
    args: &Value,
) -> Result<SynthesisReport, CriticError> {
    let run_id = arg_str(args, "run_id");
    let candidate_id = arg_str(args, "candidate_id");
    let model = args
        .get("model")
        .and_then(Value::as_str)
        .unwrap_or(default_model);

    let lint_report = read_report_artifact(run_id, candidate_id, "lint-report.json")?;
    let critic_report = read_report_artifact(run_id, candidate_id, "critic-report.json")?;

    let prompt =
        format!("lint-report.json:\n{lint_report}\n\ncritic-report.json:\n{critic_report}");

    let request = Request::new(model, vec![Message::user(prompt)])
        .system_prompt(SYNTHESIS_SYSTEM_PROMPT)
        .temperature(0.0);

    let response =
        client
            .complete(request)
            .await
            .map_err(|e| CriticError::UnparseableResponse {
                response: e.to_string(),
            })?;
    let text = response.text().unwrap_or_default();

    parse_response(&text)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn well_formed_proceed_response_parses_cleanly() {
        let text =
            r#"{"recommendation": "proceed", "reasons": ["lint clean", "critic succeeded"]}"#;
        let report = parse_response(text).unwrap();

        assert_eq!(report.recommendation, Recommendation::Proceed);
        assert_eq!(
            report.reasons,
            vec!["lint clean".to_string(), "critic succeeded".to_string()]
        );
    }

    #[test]
    fn well_formed_iterate_response_parses_cleanly() {
        let text = r#"{"recommendation": "iterate", "reasons": ["critic found friction despite clean lint"]}"#;
        let report = parse_response(text).unwrap();

        assert_eq!(report.recommendation, Recommendation::Iterate);
    }

    #[test]
    fn non_json_response_produces_unparseable_response_with_raw_text() {
        let text = "I think you should proceed.";
        let err = parse_response(text).unwrap_err();

        match err {
            CriticError::UnparseableResponse { response } => assert_eq!(response, text),
            other => panic!("expected UnparseableResponse, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn missing_critic_report_fails_before_any_network_call_and_names_the_file() {
        // No provider registered: an early network call would surface as
        // UnparseableResponse (client error), not MissingArtifact — asserting the
        // variant also proves call ordering.
        let client = Client::new();
        let run_id = format!("test-run-{}", uuid::Uuid::new_v4());
        let candidate_id = "no-critic-report-candidate";

        // Only lint-report.json exists; critic-report.json is deliberately absent.
        let dir = artifact_dir(&run_id, candidate_id);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("lint-report.json"), r#"{"checks": []}"#).unwrap();

        let args = serde_json::json!({
            "run_id": run_id,
            "candidate_id": candidate_id,
        });

        let err = run_synthesis(&client, "claude-3-5-haiku-20241022", &args)
            .await
            .expect_err("missing critic-report.json must fail");

        match err {
            CriticError::MissingArtifact { path, .. } => {
                assert!(path.ends_with("critic-report.json"));
            }
            other => panic!("expected MissingArtifact, got {other:?}"),
        }
        assert!(!dir.join("synthesis-report.json").exists());

        std::fs::remove_dir_all(format!("runs/{run_id}")).ok();
    }
}
