// ABOUTME: Boots the web server on the claude-cli provider with a fake `claude` that fails if
// ABOUTME: called, and runs tool_command pipelines to prove tool nodes never reach an LLM.

use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde_json::{Value, json};
use tokio_util::sync::CancellationToken;

use smasher_web::server::{ServerConfig, start};

/// A fake `claude` that logs that it was called, then exits 1.
fn fake_claude(dir: &Path) -> PathBuf {
    let script = dir.join("claude");
    let log = dir.join("claude-called.log");
    std::fs::write(
        &script,
        format!(
            "#!/bin/sh\necho called \"$@\" >> '{}'\nexit 1\n",
            log.display()
        ),
    )
    .unwrap();
    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
    script
}

/// Submit a pipeline, wait for it to leave `running`, and return the final
/// run JSON and the run's directory.
async fn run_pipeline(base: &str, data_dir: &Path, dot: &str) -> (Value, PathBuf) {
    let client = reqwest::Client::new();
    let submit: Value = client
        .post(format!("{base}/api/runs"))
        .json(&json!({"dot_source": dot, "variables": {}}))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let run_id = submit["run_id"]
        .as_str()
        .unwrap_or_else(|| panic!("no run_id: {submit}"))
        .to_string();

    let deadline = tokio::time::Instant::now() + Duration::from_secs(30);
    loop {
        let run: Value = client
            .get(format!("{base}/api/runs/{run_id}"))
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        if run["status"] != "Running" {
            return (run, data_dir.join("artifacts").join(&run_id));
        }
        assert!(
            tokio::time::Instant::now() < deadline,
            "run {run_id} still running"
        );
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}

fn read(path: PathBuf) -> String {
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

/// Pull one node statement out of a DOT file by id, up to its closing `];`.
fn node_statement(dot: &str, id: &str) -> String {
    let start = dot
        .find(&format!("  {id} ["))
        .unwrap_or_else(|| panic!("node {id} not found"));
    let end = start + dot[start..].find("];").expect("unterminated node") + 2;
    dot[start..end].to_string()
}

#[tokio::test]
async fn tool_command_nodes_run_without_calling_an_llm_on_claude_cli() {
    let dir = tempfile::tempdir().unwrap();
    let fake = fake_claude(dir.path());
    let called_log = dir.path().join("claude-called.log");
    // SAFETY: this test binary has a single test, so nothing reads env concurrently.
    unsafe {
        std::env::set_var("SMASHER_CLAUDE_CLI", &fake);
        for key in [
            "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY",
            "GEMINI_API_KEY",
            "GOOGLE_API_KEY",
            "OLLAMA_API_KEY",
        ] {
            std::env::remove_var(key);
        }
    }

    let data_dir = dir.path().join("data");
    let config = ServerConfig {
        port: 0,
        host: [127, 0, 0, 1],
        model: "claude-sonnet-5".into(),
        provider: Some("claude-cli".into()),
        data_dir: data_dir.display().to_string(),
        workflow_dirs: vec![],
    };
    let shutdown = CancellationToken::new();
    let server = start(config, shutdown.clone())
        .await
        .expect("server should boot with only the claude CLI configured");
    let base = format!("http://{}", server.addr);

    // 1. Branch on the command's output, with and without the context. prefix.
    let (run, run_dir) = run_pipeline(
        &base,
        &data_dir,
        r#"digraph ToolBranch {
            start [shape=Mdiamond];
            Check [shape=parallelogram, tool_command="echo clean; pwd -P > where.txt"];
            Clean [shape=parallelogram, tool_command="echo took-clean"];
            Dirty [shape=parallelogram, tool_command="echo took-dirty"];
            done [shape=Msquare];
            start -> Check;
            Check -> Clean [label="clean", condition="context.tool.output=clean"];
            Check -> Dirty [label="dirty", condition="tool.output!=clean"];
            Clean -> done;
            Dirty -> done;
        }"#,
    )
    .await;
    assert_eq!(run["status"], "Completed", "{run}");
    assert_eq!(read(run_dir.join("nodes/Check/stdout.txt")), "clean\n");
    assert_eq!(read(run_dir.join("nodes/Clean/stdout.txt")), "took-clean\n");
    assert!(
        !run_dir.join("nodes/Dirty").exists(),
        "took the wrong branch"
    );
    // The command ran in the run directory, not the server's cwd.
    assert_eq!(
        PathBuf::from(read(run_dir.join("where.txt")).trim()),
        run_dir.canonicalize().unwrap()
    );

    // 2. A failing command routes through an outcome=fail edge, and the
    // fallback sees the failed command's exit code.
    let (run, run_dir) = run_pipeline(
        &base,
        &data_dir,
        r#"digraph ToolFallback {
            start [shape=Mdiamond];
            Check [shape=parallelogram, tool_command="echo boom >&2; exit 3"];
            Next [shape=parallelogram, tool_command="echo next"];
            Fallback [shape=parallelogram, tool_command="echo fallback after $SMASHER_CTX_TOOL_EXIT_CODE"];
            done [shape=Msquare];
            start -> Check;
            Check -> Next [label="ok", condition="outcome=success"];
            Check -> Fallback [label="failed", condition="outcome=fail"];
            Next -> done;
            Fallback -> done;
        }"#,
    )
    .await;
    assert_eq!(run["status"], "Completed", "{run}");
    assert_eq!(read(run_dir.join("nodes/Check/stderr.txt")), "boom\n");
    assert_eq!(
        read(run_dir.join("nodes/Fallback/stdout.txt")),
        "fallback after 3\n"
    );
    assert!(
        !run_dir.join("nodes/Next").exists(),
        "took the success edge"
    );

    // 3. The design factory's A11yCheck node, verbatim from the example.
    let factory = std::fs::read_to_string(
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../examples/product_design_factory.dot"),
    )
    .unwrap();
    let a11y = node_statement(&factory, "A11yCheck");
    assert!(a11y.contains("tool_command="), "{a11y}");
    let (run, run_dir) = run_pipeline(
        &base,
        &data_dir,
        &format!(
            "digraph A11y {{\n  Start [shape=Mdiamond];\n{a11y}\n  Exit [shape=Msquare];\n  Start -> A11yCheck -> Exit;\n}}"
        ),
    )
    .await;
    assert_eq!(run["status"], "Completed", "{run}");
    assert!(read(run_dir.join("nodes/A11yCheck/stdout.txt")).contains("axe-core stub"));

    shutdown.cancel();
    assert!(
        !called_log.exists(),
        "the fake claude was called: {}",
        std::fs::read_to_string(&called_log).unwrap_or_default()
    );
}
