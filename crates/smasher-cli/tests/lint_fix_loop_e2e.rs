// ABOUTME: End-to-end proof that examples/lint_fix_loop.dot feeds system_lint findings back to the
// ABOUTME: agent and loops until the page passes, with no human step; a fake `claude` stands in.

use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::Command;

const API_KEYS: [&str; 5] = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OLLAMA_API_KEY",
];

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap()
}

fn fixture(name: &str) -> PathBuf {
    repo_root()
        .join("crates/smasher-system-lint/fixtures")
        .join(name)
        .join("index.html")
}

/// A fake `claude` playing the agent, run (like the shell steps) in the run's own
/// folder. Asked to fix the page, it saves the lint report it was pointed at to
/// `seen-report-<n>.json`, then writes a page that passes. Otherwise it builds a
/// page that fails. Each prompt is logged.
fn fake_claude(dir: &Path) -> PathBuf {
    let script = dir.join("fake").join("claude");
    std::fs::create_dir_all(script.parent().unwrap()).unwrap();
    let body = format!(
        r#"#!/bin/sh
while [ $# -gt 0 ]; do
  if [ "$1" = "-p" ]; then shift; prompt="$1"; break; fi
  shift
done
printf '%s\n---\n' "$prompt" >> '{log}'
mkdir -p candidate
case "$prompt" in
  *candidate-lint.json*)
    n=$(ls seen-report-*.json 2>/dev/null | wc -l | tr -d ' ')
    cp candidate-lint.json "seen-report-$n.json"
    cp '{clean}' candidate/index.html ;;
  *) cp '{violating}' candidate/index.html ;;
esac
echo 'done'
"#,
        log = dir.join("prompts.txt").display(),
        clean = fixture("clean-candidate").display(),
        violating = fixture("violating-candidate").display(),
    );
    std::fs::write(&script, body).unwrap();
    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
    script
}

#[test]
fn lint_findings_loop_back_to_the_agent_until_the_page_passes() {
    let dir = tempfile::tempdir().unwrap();
    let dir = dir.path().canonicalize().unwrap();
    let fake = fake_claude(&dir);

    let mut cmd = Command::new(env!("CARGO_BIN_EXE_smasher"));
    cmd.current_dir(&dir)
        .env("HOME", &dir)
        .env("SMASHER_CLAUDE_CLI", &fake)
        .args([
            "run",
            repo_root()
                .join("examples/lint_fix_loop.dot")
                .to_str()
                .unwrap(),
            "--backend",
            "claude-cli",
            "--no-tui",
            "--skip-preflight",
            "--interviewer",
            "none",
        ]);
    for key in API_KEYS {
        cmd.env_remove(key);
    }
    let output = cmd.output().expect("failed to run smasher binary");
    let prompts = std::fs::read_to_string(dir.join("prompts.txt")).unwrap_or_default();
    let describe = format!(
        "status: {}\nstderr: {}\nprompts:\n{prompts}",
        output.status,
        String::from_utf8_lossy(&output.stderr)
    );

    assert!(output.status.success(), "{describe}");
    let run_dir = String::from_utf8_lossy(&output.stderr)
        .lines()
        .find_map(|line| line.strip_prefix("Run directory: ").map(PathBuf::from))
        .expect("smasher run should print its run directory");
    // Built once, fixed once: the loop ran exactly one fix pass, then passed.
    assert_eq!(prompts.matches("\n---\n").count(), 2, "{describe}");

    // The fix pass was handed the failing report.
    let seen = std::fs::read_to_string(run_dir.join("seen-report-0.json"))
        .unwrap_or_else(|_| panic!("the fix pass never saw a lint report\n{describe}"));
    let report: smasher_system_lint::LintReport = serde_json::from_str(&seen).unwrap();
    assert!(
        !report.passed(),
        "the report handed to the fix pass should fail: {report:?}"
    );
    assert!(
        report.checks.iter().any(|c| !c.violations.is_empty()),
        "{report:?}"
    );

    // And the page it left behind passes.
    let last: smasher_system_lint::LintReport = serde_json::from_str(
        &std::fs::read_to_string(run_dir.join("candidate-lint.json")).unwrap(),
    )
    .unwrap();
    assert!(last.passed(), "{last:?}");
}
