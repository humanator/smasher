// ABOUTME: Process plumbing shared by everything that spawns the `claude` CLI.
// ABOUTME: Finds the binary and builds a base command with nested-session env vars removed.

use std::ffi::OsStr;
use std::path::{Path, PathBuf};

/// True for model names the `claude` CLI accepts: full `claude-*` IDs and the
/// family aliases.
pub fn is_claude_model(model: &str) -> bool {
    model.starts_with("claude-") || matches!(model, "sonnet" | "opus" | "haiku")
}

/// Env vars the outer Claude Code session sets. If the inner `claude` process sees
/// them it thinks it's nested and refuses to launch, so they're always removed.
pub const NESTED_SESSION_ENV_VARS: [&str; 5] = [
    "CLAUDE_CODE_ENTRYPOINT",
    "CLAUDECODE",
    "CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS",
    "CLAUDE_CODE_SESSION",
];

/// Install locations checked after the explicit path and env var, relative to `$HOME`
/// where they start with `~/`. A Finder-launched app doesn't have `~/.local/bin` on
/// its `PATH`, so these are checked before `PATH`.
const WELL_KNOWN_LOCATIONS: [&str; 4] = [
    "~/.local/bin/claude",
    "~/.claude/local/claude",
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
];

/// Find the `claude` binary. Pure over its inputs so every rung can be tested.
///
/// Order: `explicit` (a saved setting) → `env_value` (`SMASHER_CLAUDE_CLI`, when it
/// holds a path rather than `1`) → well-known install locations → each directory in
/// `path_var`. A candidate counts only if it's an existing file.
pub fn resolve_binary(
    explicit: Option<&str>,
    env_value: Option<&str>,
    home: Option<&Path>,
    path_var: Option<&OsStr>,
) -> Option<PathBuf> {
    let configured = [explicit, env_value]
        .into_iter()
        .flatten()
        .map(str::trim)
        .filter(|v| !v.is_empty() && *v != "1")
        .map(PathBuf::from);

    let well_known = WELL_KNOWN_LOCATIONS
        .iter()
        .filter_map(|loc| match loc.strip_prefix("~/") {
            Some(rest) => home.map(|h| h.join(rest)),
            None => Some(PathBuf::from(loc)),
        });

    let on_path = path_var
        .map(|p| std::env::split_paths(p).collect::<Vec<_>>())
        .unwrap_or_default()
        .into_iter()
        .map(|dir| dir.join("claude"));

    configured
        .chain(well_known)
        .chain(on_path)
        .find(|candidate| candidate.is_file())
}

/// [`resolve_binary`] using this process's `SMASHER_CLAUDE_CLI`, `HOME` and `PATH`.
pub fn resolve_binary_from_env(explicit: Option<&str>) -> Option<PathBuf> {
    let env_value = std::env::var("SMASHER_CLAUDE_CLI").ok();
    let home = std::env::var_os("HOME").map(PathBuf::from);
    let path_var = std::env::var_os("PATH");
    resolve_binary(
        explicit,
        env_value.as_deref(),
        home.as_deref(),
        path_var.as_deref(),
    )
}

/// A `claude` command with the nested-session env vars removed. Callers add flags,
/// working dir and stdio.
pub fn base_command(binary: &Path) -> tokio::process::Command {
    let mut cmd = tokio::process::Command::new(binary);
    for var in NESTED_SESSION_ENV_VARS {
        cmd.env_remove(var);
    }
    cmd
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsString;

    fn touch(path: &Path) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, "#!/bin/sh\n").unwrap();
    }

    #[test]
    fn explicit_path_wins() {
        let dir = tempfile::tempdir().unwrap();
        let explicit = dir.path().join("explicit/claude");
        let from_env = dir.path().join("env/claude");
        touch(&explicit);
        touch(&from_env);

        let found = resolve_binary(explicit.to_str(), from_env.to_str(), Some(dir.path()), None);
        assert_eq!(found, Some(explicit));
    }

    #[test]
    fn env_path_used_when_no_explicit() {
        let dir = tempfile::tempdir().unwrap();
        let from_env = dir.path().join("env/claude");
        touch(&from_env);

        let found = resolve_binary(None, from_env.to_str(), Some(dir.path()), None);
        assert_eq!(found, Some(from_env));
    }

    #[test]
    fn missing_explicit_path_falls_through() {
        let dir = tempfile::tempdir().unwrap();
        let from_env = dir.path().join("env/claude");
        touch(&from_env);
        let missing = dir.path().join("nope/claude");

        let found = resolve_binary(missing.to_str(), from_env.to_str(), None, None);
        assert_eq!(found, Some(from_env));
    }

    #[test]
    fn env_value_one_is_not_a_path() {
        let dir = tempfile::tempdir().unwrap();
        let home_bin = dir.path().join(".local/bin/claude");
        touch(&home_bin);

        let found = resolve_binary(None, Some("1"), Some(dir.path()), None);
        assert_eq!(found, Some(home_bin));
    }

    #[test]
    fn home_local_bin_before_claude_local() {
        let dir = tempfile::tempdir().unwrap();
        let local_bin = dir.path().join(".local/bin/claude");
        let claude_local = dir.path().join(".claude/local/claude");
        touch(&local_bin);
        touch(&claude_local);

        let found = resolve_binary(None, None, Some(dir.path()), None);
        assert_eq!(found, Some(local_bin));
    }

    #[test]
    fn claude_local_used_when_local_bin_missing() {
        let dir = tempfile::tempdir().unwrap();
        let claude_local = dir.path().join(".claude/local/claude");
        touch(&claude_local);

        let found = resolve_binary(None, None, Some(dir.path()), None);
        assert_eq!(found, Some(claude_local));
    }

    #[test]
    fn path_searched_last_in_order() {
        let dir = tempfile::tempdir().unwrap();
        let first = dir.path().join("a");
        let second = dir.path().join("b");
        touch(&second.join("claude"));
        std::fs::create_dir_all(&first).unwrap();
        let path_var: OsString = std::env::join_paths([&first, &second]).unwrap();

        // `home` points at an empty dir so only the absolute well-known locations
        // could shadow PATH; those are skipped when absent on this machine.
        let empty_home = dir.path().join("home");
        let found = resolve_binary(None, None, Some(&empty_home), Some(&path_var));
        let expected = second.join("claude");
        let absolute_installed = ["/opt/homebrew/bin/claude", "/usr/local/bin/claude"]
            .iter()
            .find(|p| Path::new(p).is_file());
        match absolute_installed {
            Some(p) => assert_eq!(found, Some(PathBuf::from(p))),
            None => assert_eq!(found, Some(expected)),
        }
    }

    #[test]
    fn directory_named_claude_is_not_a_binary() {
        let dir = tempfile::tempdir().unwrap();
        let as_dir = dir.path().join("claude");
        std::fs::create_dir_all(&as_dir).unwrap();

        let found = resolve_binary(as_dir.to_str(), None, Some(&dir.path().join("h")), None);
        assert_ne!(found, Some(as_dir));
    }

    #[test]
    fn not_found_when_nothing_exists() {
        let dir = tempfile::tempdir().unwrap();
        if ["/opt/homebrew/bin/claude", "/usr/local/bin/claude"]
            .iter()
            .any(|p| Path::new(p).is_file())
        {
            // The absolute well-known locations exist on this machine, so "not
            // found" can't be observed here.
            return;
        }
        let empty = OsString::from(dir.path().join("empty"));
        let found = resolve_binary(
            Some(""),
            Some("1"),
            Some(&dir.path().join("h")),
            Some(&empty),
        );
        assert_eq!(found, None);
    }

    #[test]
    fn base_command_removes_nested_session_vars() {
        let cmd = base_command(Path::new("/bin/claude"));
        let removed: Vec<String> = cmd
            .as_std()
            .get_envs()
            .filter(|(_, v)| v.is_none())
            .map(|(k, _)| k.to_string_lossy().into_owned())
            .collect();
        for var in NESTED_SESSION_ENV_VARS {
            assert!(removed.iter().any(|r| r == var), "{var} not removed");
        }
        assert_eq!(cmd.as_std().get_program(), "/bin/claude");
    }
}
