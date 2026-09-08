// ABOUTME: Public entry point for design-system conformance checks.
// ABOUTME: Re-exports LintReport/LintError and the lint() library API.

pub mod backend;
pub mod checks;
pub mod report;

use std::path::Path;

use thiserror::Error;

pub use report::{CheckResult, LintReport};

#[derive(Debug, Error)]
pub enum LintError {
    #[error("candidate directory has no index.html: {0}")]
    MissingEntryPoint(String),
}

/// Runs both design-system conformance checks against a candidate directory:
/// `token-adherence` (raw colors/spacing) and `kit-component-usage` (kit
/// classes/attributes).
pub fn lint(candidate_dir: &Path) -> Result<LintReport, LintError> {
    let index_html_path = candidate_dir.join("index.html");
    if !index_html_path.is_file() {
        return Err(LintError::MissingEntryPoint(
            candidate_dir.display().to_string(),
        ));
    }

    let html = std::fs::read_to_string(&index_html_path)
        .map_err(|_| LintError::MissingEntryPoint(candidate_dir.display().to_string()))?;

    let css = checks::token_adherence::extract_css(candidate_dir);
    let token_violations = checks::token_adherence::lint_css(&css);
    let token_check = CheckResult {
        name: "token-adherence".to_string(),
        passed: token_violations.is_empty(),
        violations: token_violations,
    };

    let kit_violations = checks::kit_usage::check_kit_usage(&html);
    let kit_check = CheckResult {
        name: "kit-component-usage".to_string(),
        passed: kit_violations.is_empty(),
        violations: kit_violations,
    };

    Ok(LintReport {
        checks: vec![token_check, kit_check],
    })
}
