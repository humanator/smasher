// ABOUTME: Runs a tool node's `tool_command` with `sh -c` in its own process group.
// ABOUTME: Handles timeout, cancellation, a secret-filtered environment and SMASHER_* variables.

use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;

#[cfg(unix)]
use smasher_agent::environment::kill_process_group;
use smasher_agent::environment::{DEFAULT_ENV_FILTER, env_key_is_filtered};
use tokio::io::{AsyncRead, AsyncReadExt};
use tokio::process::Command;
/// Re-exported because it's part of `CommandConfig`, so callers without a
/// direct `tokio-util` dependency can build one.
pub use tokio_util::sync::CancellationToken;

use crate::state::Context;

/// How long a `tool_command` may run when the node sets no `timeout`.
pub const DEFAULT_TOOL_TIMEOUT: Duration = Duration::from_secs(600);

/// Where and how a tool node's commands run. Passed to `ToolHandler` through
/// its constructor, since `Handler::execute` only sees the node and context.
#[derive(Debug, Clone)]
pub struct CommandConfig {
    /// Directory commands run in: the run root, or the worktree.
    pub working_dir: PathBuf,
    /// The run root, exported as `SMASHER_RUN_DIR` and home of `nodes/<id>/`.
    pub run_dir: PathBuf,
    /// The run's cancellation token. The engine only checks it between nodes,
    /// so the runner races each command against it.
    pub cancel: CancellationToken,
}

/// How a command ended.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CommandStatus {
    /// The shell exited with this code (-1 if killed by a signal).
    Exited(i32),
    /// The timeout elapsed and the process group was killed.
    TimedOut(Duration),
    /// The run was cancelled and the process group was killed.
    Cancelled,
    /// The shell couldn't be started.
    SpawnFailed(String),
}

/// A finished command: its status and captured streams. The streams are empty
/// after a timeout, cancellation or spawn failure.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandOutput {
    pub status: CommandStatus,
    pub stdout: String,
    pub stderr: String,
}

/// Runs `tool_command` strings for tool nodes.
#[derive(Debug, Clone)]
pub struct CommandRunner {
    config: CommandConfig,
}

impl CommandRunner {
    /// Create a runner for the given working directory, run root and token.
    pub fn new(config: CommandConfig) -> Self {
        Self { config }
    }

    /// The runner's configuration.
    pub fn config(&self) -> &CommandConfig {
        &self.config
    }

    /// Run `command` with `sh -c` in the working directory, in its own
    /// process group, with stdin null.
    ///
    /// The environment is the inherited one minus secret-looking variables,
    /// plus `SMASHER_RUN_DIR`, `SMASHER_NODE_ID` and a `SMASHER_CTX_<KEY>` for
    /// each context value whose key doesn't start with `_`. On timeout or
    /// cancellation the whole process group is SIGKILLed.
    pub async fn run(
        &self,
        command: &str,
        node_id: &str,
        context: &Context,
        timeout: Duration,
    ) -> CommandOutput {
        if self.config.cancel.is_cancelled() {
            return CommandOutput::without_streams(CommandStatus::Cancelled);
        }

        let mut cmd = Command::new("sh");
        cmd.arg("-c")
            .arg(command)
            .current_dir(&self.config.working_dir)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        #[cfg(unix)]
        cmd.process_group(0);

        cmd.env_clear();
        for (key, value) in std::env::vars_os() {
            if !env_key_is_filtered(&key.to_string_lossy(), DEFAULT_ENV_FILTER) {
                cmd.env(key, value);
            }
        }
        cmd.env("SMASHER_RUN_DIR", &self.config.run_dir);
        cmd.env("SMASHER_NODE_ID", node_id);
        for (key, value) in context.to_string_map() {
            if !key.starts_with('_') {
                cmd.env(ctx_env_name(&key), value);
            }
        }

        let mut child = match cmd.spawn() {
            Ok(child) => child,
            Err(e) => {
                return CommandOutput::without_streams(CommandStatus::SpawnFailed(format!(
                    "failed to start `sh -c` in {}: {e}",
                    self.config.working_dir.display()
                )));
            }
        };
        let pid = child.id();

        // Read both streams concurrently so neither pipe fills and blocks the
        // command.
        let stdout = read_to_string(child.stdout.take());
        let stderr = read_to_string(child.stderr.take());
        let finished = async {
            let (status, stdout, stderr) = tokio::join!(child.wait(), stdout, stderr);
            (status, stdout, stderr)
        };

        let stopped = tokio::select! {
            (status, stdout, stderr) = finished => {
                return match status {
                    Ok(status) => CommandOutput {
                        status: CommandStatus::Exited(status.code().unwrap_or(-1)),
                        stdout,
                        stderr,
                    },
                    Err(e) => CommandOutput::without_streams(CommandStatus::SpawnFailed(
                        format!("failed to wait for command: {e}"),
                    )),
                };
            }
            _ = tokio::time::sleep(timeout) => CommandStatus::TimedOut(timeout),
            _ = self.config.cancel.cancelled() => CommandStatus::Cancelled,
        };

        #[cfg(unix)]
        if let Some(pid) = pid {
            kill_process_group(pid);
        }
        // Reap the shell so it doesn't linger as a zombie.
        let _ = child.wait().await;
        CommandOutput::without_streams(stopped)
    }
}

impl CommandOutput {
    fn without_streams(status: CommandStatus) -> Self {
        Self {
            status,
            stdout: String::new(),
            stderr: String::new(),
        }
    }
}

/// Read a child's pipe to the end as lossy UTF-8.
async fn read_to_string<R: AsyncRead + Unpin>(pipe: Option<R>) -> String {
    let mut buf = Vec::new();
    if let Some(mut pipe) = pipe {
        let _ = pipe.read_to_end(&mut buf).await;
    }
    String::from_utf8_lossy(&buf).into_owned()
}

/// The environment variable a context key is exported as: `SMASHER_CTX_`
/// plus the key upper-cased, with every character outside `[A-Z0-9_]`
/// replaced by `_` (so `design.brief` becomes `SMASHER_CTX_DESIGN_BRIEF`).
pub fn ctx_env_name(key: &str) -> String {
    let normalised: String = key
        .chars()
        .map(|c| {
            let c = c.to_ascii_uppercase();
            if c.is_ascii_alphanumeric() || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();
    format!("SMASHER_CTX_{normalised}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn temp_dir() -> tempfile::TempDir {
        tempfile::tempdir().expect("temp dir")
    }

    fn runner_in(dir: &std::path::Path) -> CommandRunner {
        CommandRunner::new(CommandConfig {
            working_dir: dir.to_path_buf(),
            run_dir: dir.to_path_buf(),
            cancel: CancellationToken::new(),
        })
    }

    /// Whether a process with this PID still exists (zombies are reaped by init
    /// shortly after the group is killed, so poll for up to two seconds).
    async fn process_gone(pid: u32) -> bool {
        for _ in 0..40 {
            let alive = std::process::Command::new("kill")
                .args(["-0", &pid.to_string()])
                .stderr(std::process::Stdio::null())
                .status()
                .map(|s| s.success())
                .unwrap_or(false);
            if !alive {
                return true;
            }
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
        false
    }

    /// A command that backgrounds a grandchild, records its PID, and then
    /// blocks, so killing only the shell would leave the grandchild running.
    const FORKING_SLEEPER: &str = "sleep 30 > /dev/null 2>&1 & echo $! > grandchild.pid; sleep 30";

    async fn read_grandchild_pid(dir: &std::path::Path) -> u32 {
        for _ in 0..40 {
            if let Ok(s) = std::fs::read_to_string(dir.join("grandchild.pid"))
                && let Ok(pid) = s.trim().parse()
            {
                return pid;
            }
            tokio::time::sleep(Duration::from_millis(25)).await;
        }
        panic!("grandchild.pid was never written");
    }

    #[test]
    fn ctx_env_name_upper_cases_and_replaces_other_characters() {
        assert_eq!(ctx_env_name("design.brief"), "SMASHER_CTX_DESIGN_BRIEF");
        assert_eq!(ctx_env_name("tool.output"), "SMASHER_CTX_TOOL_OUTPUT");
        assert_eq!(ctx_env_name("a-b c/d"), "SMASHER_CTX_A_B_C_D");
        assert_eq!(ctx_env_name("already_OK_1"), "SMASHER_CTX_ALREADY_OK_1");
        assert_eq!(ctx_env_name("café"), "SMASHER_CTX_CAF_");
    }

    #[tokio::test]
    async fn tool_command_captures_exit_code_and_both_streams() {
        let dir = temp_dir();
        let out = runner_in(dir.path())
            .run(
                "echo out; echo err >&2; exit 3",
                "n1",
                &Context::new(),
                DEFAULT_TOOL_TIMEOUT,
            )
            .await;
        assert_eq!(out.status, CommandStatus::Exited(3));
        assert_eq!(out.stdout, "out\n");
        assert_eq!(out.stderr, "err\n");
    }

    #[tokio::test]
    async fn tool_command_success_is_exit_zero() {
        let dir = temp_dir();
        let out = runner_in(dir.path())
            .run("printf ok", "n1", &Context::new(), DEFAULT_TOOL_TIMEOUT)
            .await;
        assert_eq!(out.status, CommandStatus::Exited(0));
        assert_eq!(out.stdout, "ok");
        assert_eq!(out.stderr, "");
    }

    #[tokio::test]
    async fn tool_command_reads_large_output_on_both_streams() {
        // More than a pipe buffer on each stream: reading them one after the
        // other would deadlock.
        let dir = temp_dir();
        let out = runner_in(dir.path())
            .run(
                "head -c 200000 /dev/zero | tr '\\0' a; head -c 200000 /dev/zero | tr '\\0' b >&2",
                "n1",
                &Context::new(),
                Duration::from_secs(20),
            )
            .await;
        assert_eq!(out.status, CommandStatus::Exited(0));
        assert_eq!(out.stdout.len(), 200_000);
        assert_eq!(out.stderr.len(), 200_000);
    }

    #[tokio::test]
    async fn tool_command_runs_in_the_working_directory() {
        let dir = temp_dir();
        let out = runner_in(dir.path())
            .run("pwd -P", "n1", &Context::new(), DEFAULT_TOOL_TIMEOUT)
            .await;
        assert_eq!(
            std::path::Path::new(out.stdout.trim()),
            dir.path().canonicalize().unwrap()
        );
    }

    #[tokio::test]
    async fn tool_command_stdin_is_null() {
        let dir = temp_dir();
        let out = runner_in(dir.path())
            .run("cat", "n1", &Context::new(), Duration::from_secs(5))
            .await;
        assert_eq!(out.status, CommandStatus::Exited(0));
        assert_eq!(out.stdout, "");
    }

    #[tokio::test]
    async fn tool_command_spawn_failure_is_reported() {
        let dir = temp_dir();
        let missing = dir.path().join("does-not-exist");
        let out = runner_in(&missing)
            .run("true", "n1", &Context::new(), DEFAULT_TOOL_TIMEOUT)
            .await;
        assert!(
            matches!(out.status, CommandStatus::SpawnFailed(_)),
            "got {:?}",
            out.status
        );
    }

    #[tokio::test]
    async fn tool_command_timeout_kills_the_process_group() {
        let dir = temp_dir();
        let runner = runner_in(dir.path());
        let started = std::time::Instant::now();
        let out = runner
            .run(
                FORKING_SLEEPER,
                "n1",
                &Context::new(),
                Duration::from_millis(500),
            )
            .await;
        assert_eq!(
            out.status,
            CommandStatus::TimedOut(Duration::from_millis(500))
        );
        assert!(started.elapsed() < Duration::from_secs(10));
        let grandchild = read_grandchild_pid(dir.path()).await;
        assert!(
            process_gone(grandchild).await,
            "grandchild {grandchild} survived the timeout"
        );
    }

    #[tokio::test]
    async fn tool_command_cancellation_kills_the_process_group() {
        let dir = temp_dir();
        let runner = runner_in(dir.path());
        let cancel = runner.config().cancel.clone();
        let dir_path = dir.path().to_path_buf();
        tokio::spawn(async move {
            // Cancel only once the grandchild exists.
            read_grandchild_pid(&dir_path).await;
            cancel.cancel();
        });
        let started = std::time::Instant::now();
        let out = runner
            .run(FORKING_SLEEPER, "n1", &Context::new(), DEFAULT_TOOL_TIMEOUT)
            .await;
        assert_eq!(out.status, CommandStatus::Cancelled);
        assert!(started.elapsed() < Duration::from_secs(10));
        let grandchild = read_grandchild_pid(dir.path()).await;
        assert!(
            process_gone(grandchild).await,
            "grandchild {grandchild} survived cancellation"
        );
    }

    #[tokio::test]
    async fn tool_command_already_cancelled_token_does_not_run() {
        let dir = temp_dir();
        let runner = runner_in(dir.path());
        runner.config().cancel.cancel();
        let out = runner
            .run("touch ran", "n1", &Context::new(), DEFAULT_TOOL_TIMEOUT)
            .await;
        assert_eq!(out.status, CommandStatus::Cancelled);
        assert!(!dir.path().join("ran").exists());
    }

    #[tokio::test]
    async fn tool_command_environment_filters_secrets_and_adds_smasher_vars() {
        // A variable name no other test uses, so setting it can't race them.
        // SAFETY: no other test reads or writes this variable.
        unsafe { std::env::set_var("SMASHER_TOOL_COMMAND_TEST_API_KEY", "leaked") };
        unsafe { std::env::set_var("SMASHER_TOOL_COMMAND_TEST_PLAIN", "kept") };

        let dir = temp_dir();
        let ctx = Context::new();
        ctx.set("design.brief", json!("a calm dashboard"));
        ctx.set("count", json!(3));
        ctx.set("_internal", json!("hidden"));

        let out = runner_in(dir.path())
            .run("env", "Check", &ctx, DEFAULT_TOOL_TIMEOUT)
            .await;
        let env = out.stdout;

        assert!(!env.contains("SMASHER_TOOL_COMMAND_TEST_API_KEY"), "{env}");
        assert!(!env.contains("leaked"), "{env}");
        assert!(
            env.contains("SMASHER_TOOL_COMMAND_TEST_PLAIN=kept"),
            "{env}"
        );
        assert!(
            env.contains(&format!("SMASHER_RUN_DIR={}", dir.path().display())),
            "{env}"
        );
        assert!(env.contains("SMASHER_NODE_ID=Check"), "{env}");
        assert!(
            env.contains("SMASHER_CTX_DESIGN_BRIEF=a calm dashboard"),
            "{env}"
        );
        assert!(env.contains("SMASHER_CTX_COUNT=3"), "{env}");
        assert!(!env.contains("hidden"), "{env}");
        assert!(!env.contains("SMASHER_CTX__INTERNAL"), "{env}");
    }
}
