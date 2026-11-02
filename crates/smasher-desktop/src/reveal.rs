// ABOUTME: Decides whether "Show in Finder" may reveal a path: a .dot file in a workflows folder, or a run folder.
// ABOUTME: std only, with no Tauri types, so it can be tested without a webview or the GTK libraries.

use std::path::{Path, PathBuf};

pub const NOT_IN_WORKFLOWS_FOLDER: &str = "That file isn't in a workflows folder.";

pub const NOT_IN_RUNS_FOLDER: &str = "That folder isn't one of this app's runs.";

/// The canonical form of `path` if it's an existing `.dot` file inside one of
/// `dirs` once symlinks and `..` are resolved; otherwise the refusal message.
pub fn validate_reveal_path(path: &str, dirs: &[PathBuf]) -> Result<PathBuf, String> {
    let refuse = || NOT_IN_WORKFLOWS_FOLDER.to_string();
    let file = std::fs::canonicalize(path).map_err(|_| refuse())?;
    let is_dot = file.extension().is_some_and(|ext| ext == "dot");
    if !is_dot || !file.is_file() {
        return Err(refuse());
    }
    // A folder that doesn't exist yet (e.g. no workflow imported) holds nothing.
    let inside = dirs
        .iter()
        .filter_map(|dir| std::fs::canonicalize(dir).ok())
        .any(|dir| file.starts_with(&dir));
    if inside { Ok(file) } else { Err(refuse()) }
}

/// The canonical form of `path` if it's an existing directory inside `runs_dir`
/// once symlinks and `..` are resolved; otherwise the refusal message. The API
/// reports a run folder relative to the data dir (`artifacts/{run_id}`), so a
/// relative `path` is taken from `runs_dir`'s parent.
pub fn validate_reveal_run_dir(path: &str, runs_dir: &Path) -> Result<PathBuf, String> {
    let refuse = || NOT_IN_RUNS_FOLDER.to_string();
    let path = Path::new(path);
    let path = match runs_dir.parent() {
        Some(data_dir) if path.is_relative() => data_dir.join(path),
        _ => path.to_path_buf(),
    };
    let dir = std::fs::canonicalize(path).map_err(|_| refuse())?;
    // A runs folder that doesn't exist yet holds nothing.
    let base = std::fs::canonicalize(runs_dir).map_err(|_| refuse())?;
    if dir.is_dir() && dir.starts_with(&base) {
        Ok(dir)
    } else {
        Err(refuse())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// A fresh, empty directory under the system temp dir, removed on drop.
    struct TempDir(PathBuf);

    impl TempDir {
        fn new() -> Self {
            static NEXT: AtomicUsize = AtomicUsize::new(0);
            let dir = std::env::temp_dir().join(format!(
                "smasher-reveal-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir_all(&dir).unwrap();
            TempDir(dir)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn touch(path: &Path) -> String {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, "digraph G {}").unwrap();
        path.display().to_string()
    }

    #[test]
    fn accepts_a_dot_file_inside_a_workflows_folder() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        let file = touch(&dir.join("design").join("review.dot"));

        let revealed = validate_reveal_path(&file, std::slice::from_ref(&dir)).unwrap();

        assert_eq!(revealed, fs::canonicalize(&file).unwrap());
    }

    #[test]
    fn accepts_a_file_in_any_of_several_folders() {
        let root = TempDir::new();
        let examples = root.path().join("examples");
        let imported = root.path().join("data").join("workflows");
        let file = touch(&imported.join("mine.dot"));

        assert!(validate_reveal_path(&file, &[examples, imported]).is_ok());
    }

    #[test]
    fn refuses_a_dot_file_outside_every_folder() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        fs::create_dir_all(&dir).unwrap();
        let file = touch(&root.path().join("elsewhere.dot"));

        assert_eq!(
            validate_reveal_path(&file, &[dir]),
            Err(NOT_IN_WORKFLOWS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_file_that_is_not_dot() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        let file = touch(&dir.join("notes.txt"));

        assert_eq!(
            validate_reveal_path(&file, &[dir]),
            Err(NOT_IN_WORKFLOWS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_folder_named_like_a_dot_file() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        let folder = dir.join("trick.dot");
        fs::create_dir_all(&folder).unwrap();

        assert_eq!(
            validate_reveal_path(&folder.display().to_string(), &[dir]),
            Err(NOT_IN_WORKFLOWS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_dot_dot_escape() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        fs::create_dir_all(&dir).unwrap();
        touch(&root.path().join("secret.dot"));
        let escape = dir.join("..").join("secret.dot").display().to_string();

        assert_eq!(
            validate_reveal_path(&escape, &[dir]),
            Err(NOT_IN_WORKFLOWS_FOLDER.to_string())
        );
    }

    #[cfg(unix)]
    #[test]
    fn refuses_a_symlink_that_points_out_of_the_folder() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        fs::create_dir_all(&dir).unwrap();
        let outside = touch(&root.path().join("outside.dot"));
        let link = dir.join("link.dot");
        std::os::unix::fs::symlink(&outside, &link).unwrap();

        assert_eq!(
            validate_reveal_path(&link.display().to_string(), &[dir]),
            Err(NOT_IN_WORKFLOWS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_missing_file() {
        let root = TempDir::new();
        let dir = root.path().join("workflows");
        fs::create_dir_all(&dir).unwrap();
        let missing = dir.join("gone.dot").display().to_string();

        assert_eq!(
            validate_reveal_path(&missing, &[dir]),
            Err(NOT_IN_WORKFLOWS_FOLDER.to_string())
        );
    }

    #[test]
    fn skips_a_folder_that_does_not_exist_yet() {
        let root = TempDir::new();
        let missing_dir = root.path().join("not-yet");
        let dir = root.path().join("workflows");
        let file = touch(&dir.join("ok.dot"));

        assert!(validate_reveal_path(&file, &[missing_dir, dir]).is_ok());
    }

    #[test]
    fn accepts_a_run_folder_inside_the_runs_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        let run = runs.join("run-1");
        fs::create_dir_all(&run).unwrap();

        let revealed = validate_reveal_run_dir(&run.display().to_string(), &runs).unwrap();

        assert_eq!(revealed, fs::canonicalize(&run).unwrap());
    }

    #[test]
    fn accepts_a_run_folder_given_relative_to_the_data_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        let run = runs.join("run-1");
        fs::create_dir_all(&run).unwrap();

        let revealed = validate_reveal_run_dir("artifacts/run-1", &runs).unwrap();

        assert_eq!(revealed, fs::canonicalize(&run).unwrap());
    }

    #[test]
    fn refuses_a_relative_dot_dot_escape_from_the_runs_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        fs::create_dir_all(&runs).unwrap();
        fs::create_dir_all(root.path().join("secrets")).unwrap();

        assert_eq!(
            validate_reveal_run_dir("artifacts/../secrets", &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_file_in_the_runs_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        let file = touch(&runs.join("run-1").join("events.json"));

        assert_eq!(
            validate_reveal_run_dir(&file, &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_missing_run_folder() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        fs::create_dir_all(&runs).unwrap();
        let missing = runs.join("run-gone").display().to_string();

        assert_eq!(
            validate_reveal_run_dir(&missing, &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_when_the_runs_dir_does_not_exist() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        let elsewhere = root.path().join("elsewhere");
        fs::create_dir_all(&elsewhere).unwrap();

        assert_eq!(
            validate_reveal_run_dir(&elsewhere.display().to_string(), &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_folder_outside_the_runs_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        fs::create_dir_all(&runs).unwrap();
        let outside = root.path().join("workflows");
        fs::create_dir_all(&outside).unwrap();

        assert_eq!(
            validate_reveal_run_dir(&outside.display().to_string(), &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }

    #[test]
    fn refuses_a_dot_dot_escape_from_the_runs_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        fs::create_dir_all(runs.join("run-1")).unwrap();
        let escape = runs.join("run-1").join("..").join("..");

        assert_eq!(
            validate_reveal_run_dir(&escape.display().to_string(), &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }

    #[cfg(unix)]
    #[test]
    fn refuses_a_symlink_that_points_out_of_the_runs_dir() {
        let root = TempDir::new();
        let runs = root.path().join("artifacts");
        fs::create_dir_all(&runs).unwrap();
        let outside = root.path().join("outside");
        fs::create_dir_all(&outside).unwrap();
        let link = runs.join("run-link");
        std::os::unix::fs::symlink(&outside, &link).unwrap();

        assert_eq!(
            validate_reveal_run_dir(&link.display().to_string(), &runs),
            Err(NOT_IN_RUNS_FOLDER.to_string())
        );
    }
}
