// ABOUTME: End-to-end proof that `smasher run --backend shell` runs tool_command nodes with no
// ABOUTME: API keys (including inside a Parallel branch), and that `smasher resume` runs them too.

use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use wiremock::MockServer;

const API_KEYS: [&str; 5] = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OLLAMA_API_KEY",
];

fn fixture(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures")
        .join(name)
}

/// `smasher run` prints `Run directory: <path>` to stderr; parse that rather
/// than assuming any particular run id.
fn parse_run_directory(stderr: &str) -> PathBuf {
    stderr
        .lines()
        .find_map(|line| line.strip_prefix("Run directory: "))
        .map(PathBuf::from)
        .expect("smasher run should print its run directory to stderr")
}

/// A `smasher` command run from `cwd` (a tempdir, so no repo `.env` is loaded
/// and artifacts land there) with every provider key removed.
fn smasher(cwd: &Path) -> Command {
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_smasher"));
    cmd.current_dir(cwd);
    for key in API_KEYS {
        cmd.env_remove(key);
    }
    cmd
}

fn run_shell(cwd: &Path, dot: &Path) -> Output {
    smasher(cwd)
        .args([
            "run",
            dot.to_str().unwrap(),
            "--backend",
            "shell",
            "--no-tui",
        ])
        .output()
        .expect("failed to run smasher binary")
}

fn describe(output: &Output) -> String {
    format!(
        "status: {}\nstdout: {}\nstderr: {}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
}

fn read(path: PathBuf) -> String {
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

#[test]
fn shell_backend_runs_tool_command_branch_with_no_api_keys() {
    let cwd = tempfile::tempdir().unwrap();
    let output = run_shell(cwd.path(), &fixture("tool_command.dot"));
    assert!(output.status.success(), "{}", describe(&output));

    let run_dir = parse_run_directory(&String::from_utf8_lossy(&output.stderr));
    // The run (and so every command) lives under the invocation's cwd.
    assert!(
        run_dir.starts_with(cwd.path().canonicalize().unwrap()),
        "{}",
        run_dir.display()
    );
    assert_eq!(read(run_dir.join("nodes/Check/stdout.txt")), "clean\n");
    assert_eq!(read(run_dir.join("nodes/Clean/stdout.txt")), "took-clean\n");
    assert!(
        !run_dir.join("nodes/Dirty").exists(),
        "took the wrong branch"
    );
    // The shell codergen backend sees tool.output under the same normalised
    // name that tool commands use.
    assert_eq!(read(run_dir.join("report.txt")), "report: took-clean\n");
}

#[test]
fn shell_backend_runs_tool_command_inside_a_parallel_branch() {
    let cwd = tempfile::tempdir().unwrap();
    let output = run_shell(cwd.path(), &fixture("tool_command_parallel.dot"));
    assert!(output.status.success(), "{}", describe(&output));

    let run_dir = parse_run_directory(&String::from_utf8_lossy(&output.stderr));
    assert_eq!(read(run_dir.join("nodes/BranchA/stdout.txt")), "branch-a\n");
    assert_eq!(read(run_dir.join("nodes/BranchB/stdout.txt")), "branch-b\n");
}

#[tokio::test]
async fn resume_runs_a_pending_tool_node() {
    let cwd = tempfile::tempdir().unwrap();

    // The first run stops at Gate: its command fails until `go` exists.
    let output = run_shell(cwd.path(), &fixture("tool_command_resume.dot"));
    assert!(!output.status.success(), "{}", describe(&output));
    let run_dir = parse_run_directory(&String::from_utf8_lossy(&output.stderr));
    assert_eq!(read(run_dir.join("nodes/Gate/stdout.txt")), "");

    std::fs::write(run_dir.join("go"), "").unwrap();

    // `smasher resume` insists on a provider key. The key is fake and its base
    // URL points at a mock with no routes: any request would be a real LLM call
    // that should never happen.
    let mock_server = MockServer::start().await;
    let output = smasher(cwd.path())
        .args(["resume", run_dir.to_str().unwrap(), "--skip-preflight"])
        .env("ANTHROPIC_API_KEY", "e2e-test-fake-key")
        .env("ANTHROPIC_BASE_URL", mock_server.uri())
        .output()
        .expect("failed to run smasher binary");
    assert!(output.status.success(), "{}", describe(&output));
    assert_eq!(read(run_dir.join("nodes/Gate/stdout.txt")), "resumed\n");

    let received = mock_server.received_requests().await.unwrap();
    assert!(received.is_empty(), "unexpected LLM calls: {received:?}");
}
