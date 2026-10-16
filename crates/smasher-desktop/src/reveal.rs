// ABOUTME: Decides whether "Show in Finder" may reveal a path: an existing .dot file inside a workflows folder.
// ABOUTME: std only, with no Tauri types, so it can be tested without a webview or the GTK libraries.

use std::path::PathBuf;

pub const NOT_IN_WORKFLOWS_FOLDER: &str = "That file isn't in a workflows folder.";

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
}
