// ABOUTME: CriticReport/SynthesisReport/CriticError and the artifact_dir() path helper.
// ABOUTME: Pure data and path logic; parsing/prompting lives in task_critic.rs and synthesis.rs.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// task_critic's verdict: whether the named persona could complete the named task
/// using only what is visible in the candidate's screenshot, plus any friction noted.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CriticReport {
    pub persona: String,
    pub task: String,
    pub success: bool,
    pub friction: Vec<String>,
    pub notes: String,
}

/// `synthesis`'s verdict: whether the pipeline should proceed with this candidate
/// or iterate on it, reconciling `system_lint`'s and `task_critic`'s reports.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Recommendation {
    Proceed,
    Iterate,
}

/// `synthesis`'s output: a recommendation plus reasons citing both input reports.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SynthesisReport {
    pub recommendation: Recommendation,
    pub reasons: Vec<String>,
}

#[derive(Debug, Error)]
pub enum CriticError {
    #[error("missing artifact for candidate {candidate_id}: {path}")]
    MissingArtifact { candidate_id: String, path: String },
    #[error("model response was not valid JSON: {response}")]
    UnparseableResponse { response: String },
}

/// Derives a candidate's artifact directory `<artifacts_base>/<candidate_id>/`, the
/// same layout `system-lint` and `render-capture` already read and write.
/// `artifacts_base` is the run's own artifact directory, not a hardcoded path.
pub fn artifact_dir(artifacts_base: &Path, candidate_id: &str) -> PathBuf {
    artifacts_base.join(candidate_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_report() -> CriticReport {
        CriticReport {
            persona: "new user".to_string(),
            task: "find the settings page".to_string(),
            success: true,
            friction: vec!["nav label unclear".to_string()],
            notes: "found it after two tries".to_string(),
        }
    }

    #[test]
    fn critic_report_serde_roundtrip() {
        let report = sample_report();
        let json = serde_json::to_string(&report).unwrap();
        let back: CriticReport = serde_json::from_str(&json).unwrap();
        assert_eq!(report, back);
    }

    #[test]
    fn artifact_dir_joins_base_and_candidate_id() {
        let path = artifact_dir(
            Path::new("/data/artifacts/run-123/artifacts"),
            "candidate-abc",
        );
        assert_eq!(
            path,
            std::path::PathBuf::from("/data/artifacts/run-123/artifacts/candidate-abc")
        );
    }

    #[test]
    fn missing_artifact_error_message_names_the_path() {
        let err = CriticError::MissingArtifact {
            candidate_id: "cand-1".to_string(),
            path: "/data/artifacts/run-1/artifacts/cand-1/screenshot.png".to_string(),
        };
        assert_eq!(
            err.to_string(),
            "missing artifact for candidate cand-1: /data/artifacts/run-1/artifacts/cand-1/screenshot.png"
        );
    }

    #[test]
    fn unparseable_response_error_carries_raw_text() {
        let err = CriticError::UnparseableResponse {
            response: "not json at all".to_string(),
        };
        assert!(err.to_string().contains("not json at all"));
    }

    #[test]
    fn synthesis_report_serde_roundtrip() {
        let report = SynthesisReport {
            recommendation: Recommendation::Iterate,
            reasons: vec!["lint clean but critic found friction".to_string()],
        };
        let json = serde_json::to_string(&report).unwrap();
        let back: SynthesisReport = serde_json::from_str(&json).unwrap();
        assert_eq!(report, back);
    }

    #[test]
    fn recommendation_serializes_snake_case() {
        assert_eq!(
            serde_json::to_string(&Recommendation::Proceed).unwrap(),
            "\"proceed\""
        );
        assert_eq!(
            serde_json::to_string(&Recommendation::Iterate).unwrap(),
            "\"iterate\""
        );
    }
}
