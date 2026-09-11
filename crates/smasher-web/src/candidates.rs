// ABOUTME: Candidate discovery for the gallery-view dashboard section, plus reading a
// ABOUTME: candidate's lint/critic/synthesis reports for the gate card's scorecards.

use std::path::Path;

use smasher_render_capture::manifest::{ExitStatus, Manifest};
use smasher_system_lint::LintReport;
use smasher_task_critic_synthesis::{CriticReport, Recommendation, SynthesisReport};

/// Rejects ids that could escape a filesystem path when joined into one:
/// empty strings, or any string containing `/`, `\`, or `..`.
pub fn valid_id(s: &str) -> bool {
    !s.is_empty() && !s.contains('/') && !s.contains('\\') && !s.contains("..")
}

/// A single `render_capture` artifact, ready to render as a gallery card.
#[derive(Debug, Clone)]
pub struct CandidateSummary {
    pub candidate_id: String,
    pub screenshot_url: String,
    pub manifest: Manifest,
}

impl CandidateSummary {
    pub fn failed(&self) -> bool {
        matches!(self.manifest.exit_status, ExitStatus::Failed { .. })
    }

    pub fn failure_reason(&self) -> Option<&str> {
        match &self.manifest.exit_status {
            ExitStatus::Failed { reason } => Some(reason.as_str()),
            ExitStatus::Success => None,
        }
    }
}

/// Scans `./runs/<run_id>/artifacts/` for candidate subdirectories with a
/// parseable `manifest.json`. Missing directories, unreadable entries, and
/// unparseable manifests are skipped rather than erroring the whole scan.
pub fn scan_candidates(run_id: &str) -> Vec<CandidateSummary> {
    scan_candidates_in(Path::new("."), run_id)
}

fn scan_candidates_in(base: &Path, run_id: &str) -> Vec<CandidateSummary> {
    if !valid_id(run_id) {
        return Vec::new();
    }

    let artifacts_dir = base.join("runs").join(run_id).join("artifacts");
    let Ok(entries) = std::fs::read_dir(&artifacts_dir) else {
        return Vec::new();
    };

    let mut candidates: Vec<CandidateSummary> = entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            if !entry.file_type().ok()?.is_dir() {
                return None;
            }
            let candidate_id = entry.file_name().to_str()?.to_string();
            if !valid_id(&candidate_id) {
                return None;
            }

            let contents = std::fs::read_to_string(entry.path().join("manifest.json")).ok()?;
            let manifest: Manifest = serde_json::from_str(&contents).ok()?;

            Some(CandidateSummary {
                screenshot_url: format!(
                    "/candidate-artifacts/{run_id}/artifacts/{candidate_id}/screenshot.png"
                ),
                candidate_id,
                manifest,
            })
        })
        .collect();

    candidates.sort_by(|a, b| a.candidate_id.cmp(&b.candidate_id));
    candidates
}

/// A candidate's lint/critic/synthesis reports, whichever of the three have been
/// written so far. Missing files are expected (a run can reach the gate before
/// the critics finish, or before they exist on the pipeline at all) — not errors.
#[derive(Debug, Clone, Default)]
pub struct CandidateScorecard {
    pub lint: Option<LintReport>,
    pub critic: Option<CriticReport>,
    pub synthesis: Option<SynthesisReport>,
}

impl CandidateScorecard {
    pub fn lint_passed(&self) -> Option<bool> {
        self.lint.as_ref().map(LintReport::passed)
    }

    pub fn lint_violations(&self) -> Vec<&str> {
        self.lint
            .iter()
            .flat_map(|r| r.checks.iter())
            .flat_map(|c| c.violations.iter())
            .map(String::as_str)
            .collect()
    }

    pub fn critic_success(&self) -> Option<bool> {
        self.critic.as_ref().map(|c| c.success)
    }

    pub fn critic_friction(&self) -> &[String] {
        self.critic
            .as_ref()
            .map(|c| c.friction.as_slice())
            .unwrap_or(&[])
    }

    pub fn synthesis_recommendation_label(&self) -> Option<&'static str> {
        self.synthesis.as_ref().map(|s| match s.recommendation {
            Recommendation::Proceed => "proceed",
            Recommendation::Iterate => "iterate",
        })
    }

    pub fn synthesis_reasons(&self) -> &[String] {
        self.synthesis
            .as_ref()
            .map(|s| s.reasons.as_slice())
            .unwrap_or(&[])
    }
}

/// Reads whichever of `lint-report.json`/`critic-report.json`/`synthesis-report.json`
/// exist under `runs/<run_id>/artifacts/<candidate_id>/`. Callers pass already-
/// validated ids (e.g. from `scan_candidates`); this never touches disk outside
/// that directory since it only ever joins path segments, never parses them.
pub fn read_scorecard(run_id: &str, candidate_id: &str) -> CandidateScorecard {
    read_scorecard_in(Path::new("."), run_id, candidate_id)
}

fn read_scorecard_in(base: &Path, run_id: &str, candidate_id: &str) -> CandidateScorecard {
    let dir = base
        .join("runs")
        .join(run_id)
        .join("artifacts")
        .join(candidate_id);

    let read_json =
        |filename: &str| -> Option<String> { std::fs::read_to_string(dir.join(filename)).ok() };

    CandidateScorecard {
        lint: read_json("lint-report.json").and_then(|s| serde_json::from_str(&s).ok()),
        critic: read_json("critic-report.json").and_then(|s| serde_json::from_str(&s).ok()),
        synthesis: read_json("synthesis-report.json").and_then(|s| serde_json::from_str(&s).ok()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use smasher_render_capture::manifest::Viewport;
    use std::path::PathBuf;

    fn write_manifest(dir: &Path, candidate_id: &str, exit_status: ExitStatus) {
        let candidate_dir = dir.join("runs/run-1/artifacts").join(candidate_id);
        std::fs::create_dir_all(&candidate_dir).unwrap();
        let manifest = Manifest {
            captured_at: Utc::now(),
            viewport: Viewport {
                width: 1280,
                height: 800,
            },
            candidate_dir: PathBuf::from("/tmp/candidate"),
            exit_status,
        };
        std::fs::write(
            candidate_dir.join("manifest.json"),
            serde_json::to_string(&manifest).unwrap(),
        )
        .unwrap();
    }

    #[test]
    fn valid_id_rejects_empty_and_traversal_strings() {
        assert!(!valid_id(""));
        assert!(!valid_id("../etc"));
        assert!(!valid_id("a/b"));
        assert!(!valid_id("a\\b"));
    }

    #[test]
    fn valid_id_accepts_a_normal_id() {
        assert!(valid_id("a-normal-uuid-like-id"));
    }

    #[test]
    fn scan_candidates_returns_empty_when_artifacts_dir_missing() {
        let base = tempfile::tempdir().unwrap();
        assert!(scan_candidates_in(base.path(), "no-such-run").is_empty());
    }

    #[test]
    fn scan_candidates_rejects_traversal_run_id_before_touching_disk() {
        assert!(scan_candidates("../escape").is_empty());
    }

    #[test]
    fn scan_candidates_parses_success_and_failure_manifests() {
        let base = tempfile::tempdir().unwrap();
        write_manifest(base.path(), "candidate-a", ExitStatus::Success);
        write_manifest(
            base.path(),
            "candidate-b",
            ExitStatus::Failed {
                reason: "boom".to_string(),
            },
        );

        let candidates = scan_candidates_in(base.path(), "run-1");

        assert_eq!(candidates.len(), 2);

        let a = candidates.iter().find(|c| c.candidate_id == "candidate-a").unwrap();
        assert!(!a.failed());
        assert_eq!(a.failure_reason(), None);
        assert_eq!(
            a.screenshot_url,
            "/candidate-artifacts/run-1/artifacts/candidate-a/screenshot.png"
        );

        let b = candidates.iter().find(|c| c.candidate_id == "candidate-b").unwrap();
        assert!(b.failed());
        assert_eq!(b.failure_reason(), Some("boom"));
    }

    #[test]
    fn scan_candidates_skips_subdir_with_missing_or_malformed_manifest() {
        let base = tempfile::tempdir().unwrap();
        let artifacts_dir = base.path().join("runs/run-1/artifacts");

        // No manifest.json at all.
        std::fs::create_dir_all(artifacts_dir.join("no-manifest")).unwrap();

        // Malformed manifest.json.
        let malformed_dir = artifacts_dir.join("malformed");
        std::fs::create_dir_all(&malformed_dir).unwrap();
        std::fs::write(malformed_dir.join("manifest.json"), "not json").unwrap();

        // One valid one, to confirm the scan doesn't just bail out entirely.
        write_manifest(base.path(), "candidate-good", ExitStatus::Success);

        let candidates = scan_candidates_in(base.path(), "run-1");

        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].candidate_id, "candidate-good");
    }

    fn candidate_dir(base: &Path, run_id: &str, candidate_id: &str) -> PathBuf {
        let dir = base
            .join("runs")
            .join(run_id)
            .join("artifacts")
            .join(candidate_id);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn read_scorecard_returns_default_when_no_reports_exist() {
        let base = tempfile::tempdir().unwrap();
        candidate_dir(base.path(), "run-1", "candidate-a");

        let scorecard = read_scorecard_in(base.path(), "run-1", "candidate-a");

        assert!(scorecard.lint.is_none());
        assert!(scorecard.critic.is_none());
        assert!(scorecard.synthesis.is_none());
        assert_eq!(scorecard.lint_passed(), None);
        assert!(scorecard.lint_violations().is_empty());
        assert_eq!(scorecard.critic_success(), None);
        assert!(scorecard.critic_friction().is_empty());
        assert_eq!(scorecard.synthesis_recommendation_label(), None);
    }

    #[test]
    fn read_scorecard_parses_a_failing_lint_report() {
        let base = tempfile::tempdir().unwrap();
        let dir = candidate_dir(base.path(), "run-1", "candidate-a");
        std::fs::write(
            dir.join("lint-report.json"),
            r#"{"checks": [{"name": "token-adherence", "passed": false, "violations": ["raw hex color"]}]}"#,
        )
        .unwrap();

        let scorecard = read_scorecard_in(base.path(), "run-1", "candidate-a");

        assert_eq!(scorecard.lint_passed(), Some(false));
        assert_eq!(scorecard.lint_violations(), vec!["raw hex color"]);
    }

    #[test]
    fn read_scorecard_parses_critic_and_synthesis_reports() {
        let base = tempfile::tempdir().unwrap();
        let dir = candidate_dir(base.path(), "run-1", "candidate-a");
        std::fs::write(
            dir.join("critic-report.json"),
            r#"{"persona": "new user", "task": "find settings", "success": false, "friction": ["hidden menu"], "notes": "gave up"}"#,
        )
        .unwrap();
        std::fs::write(
            dir.join("synthesis-report.json"),
            r#"{"recommendation": "iterate", "reasons": ["critic found friction"]}"#,
        )
        .unwrap();

        let scorecard = read_scorecard_in(base.path(), "run-1", "candidate-a");

        assert_eq!(scorecard.critic_success(), Some(false));
        assert_eq!(scorecard.critic_friction(), &["hidden menu".to_string()]);
        assert_eq!(scorecard.synthesis_recommendation_label(), Some("iterate"));
        assert_eq!(
            scorecard.synthesis_reasons(),
            &["critic found friction".to_string()]
        );
    }

    #[test]
    fn read_scorecard_ignores_a_malformed_report_rather_than_panicking() {
        let base = tempfile::tempdir().unwrap();
        let dir = candidate_dir(base.path(), "run-1", "candidate-a");
        std::fs::write(dir.join("lint-report.json"), "not json").unwrap();

        let scorecard = read_scorecard_in(base.path(), "run-1", "candidate-a");

        assert!(scorecard.lint.is_none());
    }
}
