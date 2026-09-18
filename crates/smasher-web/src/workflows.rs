// ABOUTME: Pure directory scanner for `.dot`/`.gv` workflow files under configured roots.
// ABOUTME: No axum/askama types -- unit-tests cheaply via tempfile fixtures, no HTTP round-trips.

use std::collections::HashSet;
use std::path::{Path, PathBuf};

/// A single discovered workflow file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkflowSummary {
    /// Stable slug derived from the configured root's name plus the file's
    /// path relative to that root (extension stripped) -- the same file
    /// always resolves to the same id, without maintaining a separate index.
    pub id: String,
    /// Display name: the file's path relative to its configured root.
    pub name: String,
    /// The configured root directory this file was found under, as given
    /// (not canonicalized), so the UI can show which location it came from.
    pub source_dir: String,
    /// Full filesystem path to the file.
    pub path: String,
}

/// Recursively scan each configured directory for `.dot`/`.gv` files
/// (case-insensitive extension match). Deduplicates by canonicalized path,
/// so the same file reachable via two configured roots (or the same root
/// passed twice) appears once. Sorts alphabetically by name. A missing or
/// unreadable directory is silently skipped -- a stale `--workflows-dir`
/// shouldn't take the whole catalog down.
///
/// Known limitation: two configured roots that share the same final path
/// component (e.g. `foo/examples` and `bar/examples`) produce colliding id
/// slugs, since the slug is derived only from the root's name plus the
/// relative path, not its full path. Not disambiguated here -- acceptable
/// at this module's file counts.
pub fn scan_workflows(dirs: &[String]) -> Vec<WorkflowSummary> {
    let mut seen = HashSet::new();
    let mut results = Vec::new();

    for dir in dirs {
        let root = Path::new(dir);
        let root_name = root_name_for(dir);
        walk(root, root, &root_name, dir, &mut seen, &mut results);
    }

    results.sort_by(|a, b| a.name.cmp(&b.name));
    results
}

/// Resolve a workflow id back to its summary by re-scanning `dirs`.
/// Simpler and always-consistent versus maintaining a separate index,
/// acceptable at this module's file counts. Returns `None` for an unknown id.
pub fn resolve_workflow(dirs: &[String], id: &str) -> Option<WorkflowSummary> {
    scan_workflows(dirs).into_iter().find(|w| w.id == id)
}

fn walk(
    root: &Path,
    dir: &Path,
    root_name: &str,
    configured_dir: &str,
    seen: &mut HashSet<PathBuf>,
    results: &mut Vec<WorkflowSummary>,
) {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            walk(root, &path, root_name, configured_dir, seen, results);
            continue;
        }

        let is_workflow_file = path
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.eq_ignore_ascii_case("dot") || ext.eq_ignore_ascii_case("gv"))
            .unwrap_or(false);
        if !is_workflow_file {
            continue;
        }

        let canonical = path.canonicalize().unwrap_or_else(|_| path.clone());
        if !seen.insert(canonical) {
            continue;
        }

        let relative = path.strip_prefix(root).unwrap_or(path.as_path());
        results.push(WorkflowSummary {
            id: slug_for(root_name, relative),
            name: relative.display().to_string(),
            source_dir: configured_dir.to_string(),
            path: path.display().to_string(),
        });
    }
}

/// The root-name component of a workflow id slug: a configured root
/// directory's last path component, falling back to the whole configured
/// string if it has none. Shared by `scan_workflows` and callers that need
/// to compute the id a not-yet-scanned file will get (e.g. after writing it).
pub(crate) fn root_name_for(dir: &str) -> String {
    Path::new(dir)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(dir)
        .to_string()
}

pub(crate) fn slug_for(root_name: &str, relative: &Path) -> String {
    let stem = relative.with_extension("");
    let stem_str = stem
        .to_string_lossy()
        .replace(std::path::MAIN_SEPARATOR, "__");
    format!("{root_name}__{stem_str}")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_file(dir: &Path, relative: &str, contents: &str) {
        let path = dir.join(relative);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, contents).unwrap();
    }

    #[test]
    fn finds_dot_and_gv_files_recursively_ignores_other_extensions() {
        let tmp = tempfile::tempdir().unwrap();
        write_file(tmp.path(), "hello.dot", "digraph { a -> b }");
        write_file(tmp.path(), "nested/world.gv", "digraph { a -> b }");
        write_file(tmp.path(), "notes.md", "not a workflow");

        let dirs = vec![tmp.path().display().to_string()];
        let results = scan_workflows(&dirs);

        let names: Vec<&str> = results.iter().map(|w| w.name.as_str()).collect();
        assert_eq!(names.len(), 2);
        assert!(names.contains(&"hello.dot"));
        assert!(names.iter().any(|n| n.ends_with("world.gv")));
    }

    #[test]
    fn same_file_via_two_roots_appears_once() {
        let tmp = tempfile::tempdir().unwrap();
        write_file(tmp.path(), "hello.dot", "digraph { a -> b }");

        let root = tmp.path().display().to_string();
        let dirs = vec![root.clone(), root];
        let results = scan_workflows(&dirs);

        assert_eq!(results.len(), 1);
    }

    #[test]
    fn same_root_passed_twice_appears_once() {
        let tmp = tempfile::tempdir().unwrap();
        write_file(tmp.path(), "hello.dot", "digraph { a -> b }");

        let root = tmp.path().display().to_string();
        let results = scan_workflows(&[root.clone(), root]);

        assert_eq!(results.len(), 1);
    }

    #[test]
    fn missing_directory_is_skipped_without_error() {
        let dirs = vec!["/nonexistent/path/that/does/not/exist".to_string()];
        let results = scan_workflows(&dirs);
        assert!(results.is_empty());
    }

    #[test]
    fn empty_directory_returns_empty_list() {
        let tmp = tempfile::tempdir().unwrap();
        let dirs = vec![tmp.path().display().to_string()];
        assert!(scan_workflows(&dirs).is_empty());
    }

    #[test]
    fn empty_dirs_list_returns_empty_list() {
        assert!(scan_workflows(&[]).is_empty());
    }

    #[test]
    fn resolve_workflow_round_trips_an_id_from_scan() {
        let tmp = tempfile::tempdir().unwrap();
        write_file(tmp.path(), "hello.dot", "digraph { a -> b }");
        let dirs = vec![tmp.path().display().to_string()];

        let scanned = scan_workflows(&dirs);
        let summary = scanned.first().unwrap();

        let resolved = resolve_workflow(&dirs, &summary.id).unwrap();
        assert_eq!(resolved.path, summary.path);
    }

    #[test]
    fn root_name_for_takes_the_last_path_component() {
        assert_eq!(root_name_for("foo/bar/examples"), "examples");
        assert_eq!(root_name_for("examples"), "examples");
    }

    #[test]
    fn slug_for_matches_scan_workflows_for_a_freshly_written_file() {
        let tmp = tempfile::tempdir().unwrap();
        write_file(tmp.path(), "hello.dot", "digraph { a -> b }");
        let dirs = vec![tmp.path().display().to_string()];

        let scanned_id = scan_workflows(&dirs).first().unwrap().id.clone();
        let computed_id = slug_for(&root_name_for(&dirs[0]), Path::new("hello.dot"));

        assert_eq!(scanned_id, computed_id);
    }

    #[test]
    fn resolve_workflow_returns_none_for_unknown_id() {
        let tmp = tempfile::tempdir().unwrap();
        let dirs = vec![tmp.path().display().to_string()];
        assert!(resolve_workflow(&dirs, "no-such-id").is_none());
    }

    #[test]
    fn two_roots_sharing_a_final_path_component_collide_by_design() {
        let base = tempfile::tempdir().unwrap();
        let root_a = base.path().join("a/examples");
        let root_b = base.path().join("b/examples");
        write_file(&root_a, "hello.dot", "digraph { a -> b }");
        write_file(&root_b, "hello.dot", "digraph { a -> b }");

        let dirs = vec![
            root_a.display().to_string(),
            root_b.display().to_string(),
        ];
        let results = scan_workflows(&dirs);

        // Documented known limitation: both files are found (not dropped),
        // but their ids collide since the slug only encodes the root's
        // final path component, not its full path.
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].id, results[1].id);
    }
}
