// ABOUTME: LintReport/CheckResult structs and the artifact path helper.
// ABOUTME: Pure data and path logic, no parsing or checks.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// Result of a single named check (`"token-adherence"` | `"kit-component-usage"`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CheckResult {
    pub name: String,
    pub passed: bool,
    pub violations: Vec<String>,
}

/// Aggregate report of every check run against a candidate.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LintReport {
    pub checks: Vec<CheckResult>,
}

impl LintReport {
    /// True iff every check in the report passed.
    pub fn passed(&self) -> bool {
        self.checks.iter().all(|c| c.passed)
    }
}

/// Derives the artifact output directory `runs/<run_id>/artifacts/<candidate_id>/`.
pub fn artifact_dir(run_id: &str, candidate_id: &str) -> PathBuf {
    PathBuf::from("runs")
        .join(run_id)
        .join("artifacts")
        .join(candidate_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn passing_check(name: &str) -> CheckResult {
        CheckResult {
            name: name.to_string(),
            passed: true,
            violations: vec![],
        }
    }

    fn failing_check(name: &str) -> CheckResult {
        CheckResult {
            name: name.to_string(),
            passed: false,
            violations: vec!["raw hex color".to_string()],
        }
    }

    #[test]
    fn passed_true_when_all_checks_pass() {
        let report = LintReport {
            checks: vec![passing_check("token-adherence"), passing_check("kit-component-usage")],
        };
        assert!(report.passed());
    }

    #[test]
    fn passed_false_when_any_check_fails() {
        let report = LintReport {
            checks: vec![passing_check("token-adherence"), failing_check("kit-component-usage")],
        };
        assert!(!report.passed());
    }

    #[test]
    fn lint_report_serde_roundtrip() {
        let report = LintReport {
            checks: vec![passing_check("token-adherence"), failing_check("kit-component-usage")],
        };

        let json = serde_json::to_string(&report).unwrap();
        let roundtripped: LintReport = serde_json::from_str(&json).unwrap();

        assert_eq!(report, roundtripped);
    }

    #[test]
    fn artifact_dir_joins_run_and_candidate_id() {
        let path = artifact_dir("run-123", "candidate-abc");
        assert_eq!(
            path,
            std::path::PathBuf::from("runs/run-123/artifacts/candidate-abc")
        );
    }
}
