// ABOUTME: End-to-end proof that `smasher run --backend claude-cli` runs the `claude` binary
// ABOUTME: named by SMASHER_CLAUDE_CLI, using fake scripts so no real CLI or tokens are used.

use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

const API_KEYS: [&str; 5] = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OLLAMA_API_KEY",
];

fn write_script(path: &Path, body: &str) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, format!("#!/bin/sh\n{body}")).unwrap();
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o755)).unwrap();
}

/// A fake `claude` that appends its prompt (the argument after `-p`) to
/// `prompts.txt` and prints a plain-text answer, as `--print` mode does.
fn fake_claude(dir: &Path) -> PathBuf {
    let script = dir.join("fake").join("claude");
    let log = dir.join("prompts.txt");
    write_script(
        &script,
        &format!(
            "while [ $# -gt 0 ]; do\n  if [ \"$1\" = \"-p\" ]; then shift; printf '%s\\n---\\n' \"$1\" >> '{}'; break; fi\n  shift\ndone\necho 'fake claude answered'\n",
            log.display()
        ),
    );
    script
}

/// A `claude` placed first on `PATH` that only records that it ran, so a run
/// that ignores SMASHER_CLAUDE_CLI is caught without reaching a real binary.
fn decoy_path(dir: &Path) -> String {
    let bin = dir.join("decoy-bin");
    write_script(
        &bin.join("claude"),
        &format!(
            "touch '{}'\necho 'decoy claude from PATH'\nexit 1\n",
            dir.join("decoy-ran").display()
        ),
    );
    format!("{}:/usr/bin:/bin", bin.display())
}

/// `smasher run --backend claude-cli` from `dir`, with every provider key
/// removed, `HOME` inside `dir`, a decoy `claude` on `PATH`, and the fake one
/// named by `SMASHER_CLAUDE_CLI`.
fn run_claude_cli(dir: &Path, dot: &str) -> Output {
    let fake = fake_claude(dir);
    let pipeline = dir.join("pipeline.dot");
    std::fs::write(&pipeline, dot).unwrap();
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_smasher"));
    cmd.current_dir(dir)
        .env("HOME", dir)
        .env("PATH", decoy_path(dir))
        .env("SMASHER_CLAUDE_CLI", &fake)
        .args([
            "run",
            pipeline.to_str().unwrap(),
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
    cmd.output().expect("failed to run smasher binary")
}

fn describe(output: &Output) -> String {
    format!(
        "status: {}\nstdout: {}\nstderr: {}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
}

fn prompts(dir: &Path) -> String {
    std::fs::read_to_string(dir.join("prompts.txt")).unwrap_or_default()
}

#[test]
fn run_uses_the_claude_binary_named_by_smasher_claude_cli() {
    let dir = tempfile::tempdir().unwrap();
    let dir = dir.path().canonicalize().unwrap();
    let output = run_claude_cli(
        &dir,
        r#"digraph CliPath {
            start [shape=circle];
            build [shape=box, prompt="Write index.html"];
            done [shape=doublecircle];
            start -> build -> done;
        }"#,
    );

    assert!(output.status.success(), "{}", describe(&output));
    assert!(!dir.join("decoy-ran").exists(), "ran claude from PATH");
    assert!(
        prompts(&dir).contains("Write index.html"),
        "{}",
        describe(&output)
    );
}

#[test]
fn run_sends_manager_nodes_through_the_claude_cli() {
    let dir = tempfile::tempdir().unwrap();
    let dir = dir.path().canonicalize().unwrap();
    let output = run_claude_cli(
        &dir,
        r#"digraph CliManager {
            start [shape=circle];
            plan [shape=house, task="Plan the candidate builds"];
            done [shape=doublecircle];
            start -> plan -> done;
        }"#,
    );

    assert!(output.status.success(), "{}", describe(&output));
    assert!(!dir.join("decoy-ran").exists(), "ran claude from PATH");
    assert!(
        prompts(&dir).contains("Task: Plan the candidate builds"),
        "{}",
        describe(&output)
    );
}

#[test]
fn run_without_keys_points_at_smasher_claude_cli() {
    let dir = tempfile::tempdir().unwrap();
    let dir = dir.path().canonicalize().unwrap();
    let pipeline = dir.join("pipeline.dot");
    std::fs::write(
        &pipeline,
        "digraph NoKeys { start [shape=circle]; done [shape=doublecircle]; start -> done; }",
    )
    .unwrap();
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_smasher"));
    cmd.current_dir(&dir)
        .env("HOME", &dir)
        .env("PATH", decoy_path(&dir))
        .env_remove("SMASHER_CLAUDE_CLI")
        .args(["run", pipeline.to_str().unwrap(), "--no-tui"]);
    for key in API_KEYS {
        cmd.env_remove(key);
    }
    let output = cmd.output().expect("failed to run smasher binary");

    assert!(!output.status.success(), "{}", describe(&output));
    assert!(
        String::from_utf8_lossy(&output.stderr).contains("SMASHER_CLAUDE_CLI=1"),
        "{}",
        describe(&output)
    );
}
