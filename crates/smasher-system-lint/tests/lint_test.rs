// ABOUTME: Integration test running lint() against the clean and violating fixtures.
// ABOUTME: Proves the composed public API, not just each check in isolation.

use std::path::Path;

use smasher_system_lint::{LintError, lint};

#[test]
fn clean_candidate_passes_both_checks() {
    let report = lint(Path::new("fixtures/clean-candidate")).unwrap();
    assert!(
        report.passed(),
        "expected clean-candidate to pass: {report:?}"
    );
}

#[test]
fn violating_candidate_fails_both_checks_with_expected_violations() {
    let report = lint(Path::new("fixtures/violating-candidate")).unwrap();
    assert!(!report.passed());

    let token_check = report
        .checks
        .iter()
        .find(|c| c.name == "token-adherence")
        .unwrap();
    assert!(!token_check.passed);
    assert!(
        token_check
            .violations
            .iter()
            .any(|v| v.contains("raw hex color"))
    );
    assert!(
        token_check
            .violations
            .iter()
            .any(|v| v.contains("raw size"))
    );

    let kit_check = report
        .checks
        .iter()
        .find(|c| c.name == "kit-component-usage")
        .unwrap();
    assert!(!kit_check.passed);
    assert!(kit_check.violations.iter().any(|v| v.contains("button")));
    assert!(kit_check.violations.iter().any(|v| v.contains("input")));
    assert!(
        kit_check
            .violations
            .iter()
            .any(|v| v.contains("aria-modal"))
    );
}

#[test]
fn missing_index_html_returns_missing_entry_point_error() {
    let dir = tempfile::tempdir().unwrap();
    let result = lint(dir.path());
    assert!(matches!(result, Err(LintError::MissingEntryPoint(_))));
}
