# Workflow Catalog (Module 1) Implementation Plan

**Goal:** Replace `smasher-web`'s run-centric `/` dashboard with a workflow-first
landing page that discovers `.dot`/`.gv` files under configured directories,
lists them as workflows, and lets a user create a new one. Scoped to module
`workflow-catalog` from `docs/plans/2026-09-18-workflow-dashboard-design.md`.

**Architecture:** One new pure module (`workflows.rs`) does directory
scanning and id⇄path slugging with no framework dependencies, so it's cheap
to unit test. Five new/changed routes in `routes/pages.rs` consume it. The
existing submit-run form's paste/upload UI is relocated (not deleted) from
`/` to `/workflows/new`; its "Run History" table is relocated from `/` to a
new standalone `/runs` page, reusing the existing (currently unused)
`run_list.html` fragment. `{data_dir}/workflows/` is always scanned
regardless of `--workflows-dir` overrides, since it's where "Add Workflow"
writes — that invariant is enforced once, at config-assembly time in
`server.rs`, so `workflows.rs` itself stays a dumb list-of-dirs scanner.

**Tech Stack:** Rust 1.85+, axum, askama, clap, TDD (test first per this
repo's `CLAUDE.md`)

---

## Task 1: Thread `--workflows-dir` through CLI → `ServerConfig` → `AppState`

**Files:**
- Modify: `crates/smasher-cli/src/serve.rs`
- Modify: `crates/smasher-web/src/server.rs`
- Modify: `crates/smasher-web/src/state.rs`
- Modify (mechanical): every `AppState::new(...)` call site (`server.rs`,
  `routes/pages.rs`, `routes/api.rs`, `routes/questions.rs`,
  `routes/gallery.rs` test modules)

**Why:** `AppState` currently has no concept of where workflow files live.
`data_dir` is the existing precedent for exactly this kind of threading
(CLI flag → `ServerConfig` → `AppState`), so this follows the same shape.

**Step 1: Write failing tests**

In `crates/smasher-web/src/state.rs`, extend the existing test module:

```rust
#[test]
fn app_state_new_stores_workflow_dirs() {
    let client = smasher_llm::client::Client::from_env();
    let state = AppState::new(
        client,
        "test-model".into(),
        None,
        "/tmp".into(),
        vec!["examples".into(), "/tmp/workflows".into()],
    );
    assert_eq!(state.workflow_dirs, vec!["examples", "/tmp/workflows"]);
}
```

In `crates/smasher-web/src/server.rs`'s test module, add:

```rust
#[test]
fn default_config_includes_data_dir_workflows() {
    let config = ServerConfig::default();
    assert!(config.workflow_dirs.iter().any(|d| d.ends_with("workflows")));
}
```

**Step 2: Run tests to verify they fail**

Run: `cargo test -p smasher-web workflow_dirs -- --nocapture`
Expected: FAIL — `AppState::new` has the wrong arity, `ServerConfig` has no
`workflow_dirs` field.

**Step 3: Add the field and thread it through**

`crates/smasher-web/src/state.rs` — add to `AppState`:

```rust
pub struct AppState {
    pub runs: Arc<RwLock<HashMap<String, RunRecord>>>,
    pub client: Arc<smasher_llm::client::Client>,
    pub default_model: String,
    pub default_provider: Option<String>,
    pub data_dir: String,
    /// Effective, final list of directories scanned for `.dot`/`.gv`
    /// workflow files. Always includes `{data_dir}/workflows` — see
    /// `ServerConfig`'s doc comment for why that's assembled in `server.rs`
    /// rather than here.
    pub workflow_dirs: Vec<String>,
}

impl AppState {
    pub fn new(
        client: smasher_llm::client::Client,
        default_model: String,
        default_provider: Option<String>,
        data_dir: String,
        workflow_dirs: Vec<String>,
    ) -> Self {
        Self {
            runs: Arc::new(RwLock::new(HashMap::new())),
            client: Arc::new(client),
            default_model,
            default_provider,
            data_dir,
            workflow_dirs,
        }
    }
}
```

`crates/smasher-web/src/server.rs` — add to `ServerConfig`:

```rust
pub struct ServerConfig {
    pub port: u16,
    pub host: [u8; 4],
    pub model: String,
    pub provider: Option<String>,
    pub data_dir: String,
    /// Additional read roots for workflow discovery, on top of the
    /// always-included `{data_dir}/workflows`. Defaults to `["examples"]`.
    pub workflow_dirs: Vec<String>,
}
```

Update `Default for ServerConfig`:

```rust
let data_dir = default_data_dir();
let workflow_dirs = std::env::var("SMASHER_WORKFLOWS_DIR")
    .map(|s| s.split(',').map(str::trim).map(String::from).collect())
    .unwrap_or_else(|_| vec!["examples".to_string()]);

Self {
    port,
    host,
    model,
    provider,
    data_dir,
    workflow_dirs,
}
```

Update `run_with_config` where `AppState::new` is called — this is where the
"`{data_dir}/workflows` is always scanned" invariant gets enforced once:

```rust
let mut workflow_dirs = config.workflow_dirs.clone();
let data_dir_workflows = format!("{}/workflows", config.data_dir);
if !workflow_dirs.contains(&data_dir_workflows) {
    workflow_dirs.push(data_dir_workflows);
}

let state = AppState::new(
    client,
    config.model,
    config.provider,
    config.data_dir,
    workflow_dirs,
);
```

`crates/smasher-cli/src/serve.rs` — add the flag and plumb it into
`ServerConfig`:

```rust
/// Additional directories to scan for `.dot`/`.gv` workflow files
/// (repeatable). `{data-dir}/workflows` is always scanned too. Defaults to
/// `["examples"]` when omitted.
#[arg(long = "workflows-dir")]
pub workflows_dir: Vec<PathBuf>,
```

In `run()`, after `data_dir` is resolved:

```rust
let workflow_dirs = if args.workflows_dir.is_empty() {
    defaults.workflow_dirs
} else {
    args.workflows_dir
        .into_iter()
        .map(|p| p.display().to_string())
        .collect()
};

let config = ServerConfig {
    port: args.port,
    host: defaults.host,
    model,
    provider,
    data_dir,
    workflow_dirs,
};
```

**Step 4: Fix all `AppState::new` call sites**

Grep: `grep -rn "AppState::new(" crates/smasher-web/src`. Every test helper
passes `"/tmp".into()` for `data_dir` today — add `vec![]` as the trailing
arg (empty workflow dirs is a valid, tested state per Task 2's
empty-directory case). Known sites: `server.rs` (`test_state`, one other
inline construction around line 179), `routes/pages.rs` (`test_state`, one
inline construction around line 882), `routes/api.rs` (`test_state`, two
inline constructions), `routes/questions.rs` (`test_state`),
`routes/gallery.rs` (`test_state`).

**Step 5: Run tests to verify they pass**

Run: `cargo test --workspace`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add crates/smasher-cli/src/serve.rs crates/smasher-web/src/server.rs crates/smasher-web/src/state.rs crates/smasher-web/src/routes/*.rs
git commit -m "feat(web): thread --workflows-dir config through ServerConfig and AppState"
```

---

## Task 2: `workflows.rs` — directory scanning and id⇄path slugging

**Files:**
- Create: `crates/smasher-web/src/workflows.rs`
- Modify: `crates/smasher-web/src/lib.rs` (register module)

**Why:** Pure, framework-free logic — the part of this feature worth
unit-testing in isolation rather than through HTTP round-trips.

**Step 1: Write failing tests**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn write_dot(dir: &std::path::Path, name: &str) {
        fs::write(dir.join(name), "digraph { a -> b }").unwrap();
    }

    #[test]
    fn scan_finds_dot_and_gv_files_recursively() {
        let tmp = tempfile::tempdir().unwrap();
        write_dot(tmp.path(), "top.dot");
        let sub = tmp.path().join("nested");
        fs::create_dir(&sub).unwrap();
        write_dot(&sub, "child.gv");
        fs::write(tmp.path().join("readme.md"), "not a workflow").unwrap();

        let results = scan_workflows(&[tmp.path().display().to_string()]);
        let names: Vec<&str> = results.iter().map(|w| w.name.as_str()).collect();
        assert_eq!(names, vec!["child", "top"]); // alphabetical by name
    }

    #[test]
    fn scan_deduplicates_same_file_seen_via_two_roots() {
        let tmp = tempfile::tempdir().unwrap();
        write_dot(tmp.path(), "shared.dot");
        let dir = tmp.path().display().to_string();

        let results = scan_workflows(&[dir.clone(), dir]);
        assert_eq!(results.len(), 1);
    }

    #[test]
    fn scan_skips_missing_directories_without_erroring() {
        let results = scan_workflows(&["/definitely/does/not/exist".to_string()]);
        assert!(results.is_empty());
    }

    #[test]
    fn scan_empty_directory_returns_empty_list() {
        let tmp = tempfile::tempdir().unwrap();
        let results = scan_workflows(&[tmp.path().display().to_string()]);
        assert!(results.is_empty());
    }

    #[test]
    fn resolve_workflow_round_trips_through_its_own_id() {
        let tmp = tempfile::tempdir().unwrap();
        write_dot(tmp.path(), "roundtrip.dot");
        let dirs = vec![tmp.path().display().to_string()];

        let found = scan_workflows(&dirs);
        assert_eq!(found.len(), 1);
        let resolved = resolve_workflow(&dirs, &found[0].id).unwrap();
        assert_eq!(resolved.path, found[0].path);
    }

    #[test]
    fn resolve_workflow_returns_none_for_unknown_id() {
        let tmp = tempfile::tempdir().unwrap();
        let dirs = vec![tmp.path().display().to_string()];
        assert!(resolve_workflow(&dirs, "nope").is_none());
    }
}
```

Add `tempfile` as a dev-dependency of `smasher-web` if not already present:
`grep -n "tempfile" crates/smasher-web/Cargo.toml` first — several other
crates in the workspace already use it, so it's likely already available at
the workspace level; add `tempfile = { workspace = true }` under
`[dev-dependencies]` if the crate doesn't have it yet.

**Step 2: Run tests to verify they fail**

Run: `cargo test -p smasher-web workflows:: -- --nocapture`
Expected: FAIL — module doesn't exist yet.

**Step 3: Implement**

```rust
// ABOUTME: Discovers .dot/.gv pipeline files under configured directories and exposes them as browsable workflows.
// ABOUTME: Owns the id<->path slug scheme shared by the catalog list and the workflow detail/create routes.

use std::collections::HashSet;
use std::path::{Path, PathBuf};

/// A discovered `.dot`/`.gv` pipeline file, ready to list on the workflow
/// catalog page.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkflowSummary {
    /// Stable slug used in `/workflows/{id}` URLs. Round-trips back to
    /// `path` via `resolve_workflow` as long as the configured directories
    /// haven't changed.
    pub id: String,
    /// Filename stem, e.g. "hello-world".
    pub name: String,
    /// The configured root directory this file was found under, for
    /// display (disambiguates same-named files across roots).
    pub source_dir: String,
    /// Canonicalized absolute path to the file on disk.
    pub path: PathBuf,
}

/// Recursively scan `dirs` for `.dot`/`.gv` files and return them as a
/// flat, alphabetically-sorted-by-name list, deduplicated by canonical
/// path (the same file reachable via two configured roots appears once).
/// A directory that doesn't exist or can't be read is skipped rather than
/// erroring — a stale `--workflows-dir` shouldn't take the whole catalog
/// down.
pub fn scan_workflows(dirs: &[String]) -> Vec<WorkflowSummary> {
    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for dir in dirs {
        let root = Path::new(dir);
        let Ok(root) = root.canonicalize() else { continue };
        scan_dir(&root, &root, dir, &mut seen, &mut out);
    }
    out.sort_by(|a, b| a.name.cmp(&b.name).then(a.id.cmp(&b.id)));
    out
}

fn scan_dir(
    root: &Path,
    dir: &Path,
    source_label: &str,
    seen: &mut HashSet<PathBuf>,
    out: &mut Vec<WorkflowSummary>,
) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_dir(root, &path, source_label, seen, out);
            continue;
        }
        let is_workflow_file = path
            .extension()
            .and_then(|e| e.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("dot") || ext.eq_ignore_ascii_case("gv"));
        if !is_workflow_file {
            continue;
        }
        let Ok(canonical) = path.canonicalize() else { continue };
        if !seen.insert(canonical.clone()) {
            continue;
        }
        let name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unnamed")
            .to_string();
        out.push(WorkflowSummary {
            id: slug_for(root, &canonical),
            name,
            source_dir: source_label.to_string(),
            path: canonical,
        });
    }
}

/// Build the `/workflows/{id}` slug from a file's path relative to its
/// configured root, e.g. root=`examples`, file=`examples/hello-world.dot`
/// -> `examples__hello-world`. Path separators become `__` so the slug is
/// a single URL segment.
///
/// Known limitation: two configured roots with the same final path
/// component (e.g. `foo/examples` and `bar/examples`) produce colliding
/// slugs. Not disambiguated further in this module — acceptable for the
/// default two-root setup this module ships with; revisit if it bites.
pub(crate) fn slug_for(root: &Path, file: &Path) -> String {
    let rel = file.strip_prefix(root).unwrap_or(file).with_extension("");
    let root_name = root.file_name().and_then(|n| n.to_str()).unwrap_or("root");
    let rel_str = rel
        .components()
        .map(|c| c.as_os_str().to_string_lossy().into_owned())
        .collect::<Vec<_>>()
        .join("__");
    format!("{root_name}__{rel_str}")
}

/// Resolve a `/workflows/{id}` slug back to a file on disk by re-scanning
/// the configured directories. Simpler and always-correct vs. maintaining
/// a separate id index, at the cost of a directory walk per lookup — fine
/// at the file counts a design-workflow catalog deals with.
pub fn resolve_workflow(dirs: &[String], id: &str) -> Option<WorkflowSummary> {
    scan_workflows(dirs).into_iter().find(|w| w.id == id)
}
```

In `crates/smasher-web/src/lib.rs`, add `pub mod workflows;`.

**Step 4: Run tests to verify they pass**

Run: `cargo test -p smasher-web workflows:: -- --nocapture`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add crates/smasher-web/src/workflows.rs crates/smasher-web/src/lib.rs crates/smasher-web/Cargo.toml
git commit -m "feat(web): add workflows module for .dot/.gv discovery and id slugging"
```

---

## Task 3: Workflow catalog replaces `/`; run history moves to `/runs`

**Files:**
- Modify: `crates/smasher-web/src/routes/pages.rs`
- Create: `crates/smasher-web/templates/workflow_catalog.html`
- Create: `crates/smasher-web/templates/runs_page.html`
- Delete: `crates/smasher-web/templates/dashboard.html` (its two pieces are
  relocated: the run-history table to `runs_page.html`/this task, the
  paste/upload form to `workflow_new.html`/Task 4 — nothing is dropped)

**Why:** This is the actual IA swap: `/` stops being "submit a run" and
becomes "browse workflows." Per the design doc's boundary, this is a move
of existing functionality, not a deletion — verify both landing spots exist
before deleting `dashboard.html`.

**Step 1: Write failing tests**

In `crates/smasher-web/src/routes/pages.rs`'s test module:

```rust
#[tokio::test]
async fn root_lists_workflows_found_under_configured_dirs() {
    let tmp = tempfile::tempdir().unwrap();
    std::fs::write(tmp.path().join("sample.dot"), "digraph { a -> b }").unwrap();
    let mut state = test_state();
    state.workflow_dirs = vec![tmp.path().display().to_string()];

    let app = crate::server::build_router(state);
    let response = app
        .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let html = String::from_utf8(body.to_vec()).unwrap();
    assert!(html.contains("sample"));
}

#[tokio::test]
async fn root_shows_empty_state_with_no_workflows() {
    let mut state = test_state();
    state.workflow_dirs = vec![];
    let app = crate::server::build_router(state);
    let response = app
        .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let html = String::from_utf8(body.to_vec()).unwrap();
    assert!(html.contains("No workflows found"));
}

#[tokio::test]
async fn runs_page_lists_run_history() {
    let state = test_state();
    insert_test_record(&state, "run-abc").await; // existing test helper
    let app = crate::server::build_router(state);
    let response = app
        .oneshot(Request::builder().uri("/runs").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let html = String::from_utf8(body.to_vec()).unwrap();
    assert!(html.contains("run-abc"));
}
```

Check `insert_test_record`'s existing signature (used elsewhere in this
test module already) before reusing it verbatim.

**Step 2: Run tests to verify they fail**

Run: `cargo test -p smasher-web root_lists_workflows runs_page_lists -- --nocapture`
Expected: FAIL — `/` still renders the old submit form; `/runs` GET doesn't exist (only POST does).

**Step 3: Implement**

Template structs, replacing `DashboardTemplate`:

```rust
#[derive(Template)]
#[template(path = "workflow_catalog.html")]
struct WorkflowCatalogTemplate {
    workflows: Vec<crate::workflows::WorkflowSummary>,
}

#[derive(Template)]
#[template(path = "runs_page.html")]
struct RunsPageTemplate {
    runs: Vec<RunSummary>,
}
```

`WorkflowSummary` needs `id`, `name`, `source_dir` (all `String`) rendered
by askama — already public fields, no `Display` gaps.

Handlers, replacing `dashboard`:

```rust
async fn workflow_catalog(State(state): State<AppState>) -> impl IntoResponse {
    let workflows = crate::workflows::scan_workflows(&state.workflow_dirs);
    HtmlTemplate(WorkflowCatalogTemplate { workflows })
}

async fn runs_page(State(state): State<AppState>) -> impl IntoResponse {
    let runs_map = state.runs.read().await;
    let mut runs: Vec<RunSummary> = runs_map.values().map(|r| r.to_summary()).collect();
    runs.sort_by(|a, b| b.started_at.cmp(&a.started_at));
    HtmlTemplate(RunsPageTemplate { runs })
}
```

Router:

```rust
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(workflow_catalog))
        .route("/runs", get(runs_page).post(submit_run))
        // ... rest unchanged ...
}
```

`templates/workflow_catalog.html`:

```html
{% extends "base.html" %}

{% block title %}SMASHER — Workflows{% endblock %}

{% block content %}
<section class="workflow-catalog-section">
    <div class="section-header">
        <h2>Workflows</h2>
        <a href="/workflows/new" class="btn btn-primary">Add Workflow</a>
    </div>
    <table class="workflow-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Source</th>
            </tr>
        </thead>
        <tbody>
            {% for workflow in workflows %}
            <tr>
                <td><a href="/workflows/{{ workflow.id }}">{{ workflow.name }}</a></td>
                <td class="workflow-source">{{ workflow.source_dir }}</td>
            </tr>
            {% endfor %}
            {% if workflows.is_empty() %}
            <tr>
                <td colspan="2" class="empty-state">No workflows found. Add one to get started.</td>
            </tr>
            {% endif %}
        </tbody>
    </table>
</section>
{% endblock %}
```

`templates/runs_page.html`:

```html
{% extends "base.html" %}

{% block title %}SMASHER — Run History{% endblock %}

{% block content %}
<section class="runs-section">
    <h2>Run History</h2>
    <div id="run-list-container">
        {% include "run_list.html" %}
    </div>
</section>
{% endblock %}
```

Delete `templates/dashboard.html` and the now-unused `DashboardTemplate`
struct and `dashboard` handler — **only after** Task 4 has moved the
paste/upload form to `workflow_new.html`. (Sequencing note: do the deletion
at the end of Task 4, not here, so there's no window where the form exists
nowhere.)

**Step 4: Run tests to verify they pass**

Run: `cargo test -p smasher-web`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add crates/smasher-web/src/routes/pages.rs crates/smasher-web/templates/workflow_catalog.html crates/smasher-web/templates/runs_page.html
git commit -m "feat(web): replace / with the workflow catalog; move run history to /runs"
```

---

## Task 4: "Add Workflow" interim create flow

**Files:**
- Modify: `crates/smasher-web/src/routes/pages.rs`
- Create: `crates/smasher-web/templates/workflow_new.html`
- Delete: `crates/smasher-web/templates/dashboard.html`

**Why:** Per the design doc's resolved tension, "Add Workflow" uses a plain
DOT paste/upload form now (relocating the current `/` form's markup) and
gets re-pointed at the real visual editor once `workflow-editor` ships.

**Step 1: Write failing tests**

```rust
#[tokio::test]
async fn new_workflow_form_renders() {
    let app = crate::server::build_router(test_state());
    let response = app
        .oneshot(Request::builder().uri("/workflows/new").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn create_workflow_writes_file_and_redirects() {
    let tmp = tempfile::tempdir().unwrap();
    let mut state = test_state();
    state.data_dir = tmp.path().display().to_string();
    state.workflow_dirs = vec![format!("{}/workflows", state.data_dir)];
    let app = crate::server::build_router(state);

    let body = "name=my-new-pipeline&dot_source=digraph+%7B+a+-%3E+b+%7D";
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/workflows")
                .header("content-type", "application/x-www-form-urlencoded")
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::SEE_OTHER);
    let written = tmp.path().join("workflows").join("my-new-pipeline.dot");
    assert!(written.exists());
    assert_eq!(std::fs::read_to_string(written).unwrap(), "digraph { a -> b }");
}

#[tokio::test]
async fn create_workflow_rejects_invalid_dot() {
    let tmp = tempfile::tempdir().unwrap();
    let mut state = test_state();
    state.data_dir = tmp.path().display().to_string();
    let app = crate::server::build_router(state);

    let body = "name=broken&dot_source=not+valid+dot+%7B";
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/workflows")
                .header("content-type", "application/x-www-form-urlencoded")
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn create_workflow_rejects_blank_name() {
    let app = crate::server::build_router(test_state());
    let body = "name=&dot_source=digraph+%7B+a+-%3E+b+%7D";
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/workflows")
                .header("content-type", "application/x-www-form-urlencoded")
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
```

**Step 2: Run tests to verify they fail**

Run: `cargo test -p smasher-web new_workflow_form create_workflow -- --nocapture`
Expected: FAIL — routes don't exist.

**Step 3: Implement**

Form type and template struct:

```rust
#[derive(Debug, serde::Deserialize)]
pub struct NewWorkflowForm {
    pub name: String,
    pub dot_source: String,
}

#[derive(Template)]
#[template(path = "workflow_new.html")]
struct WorkflowNewTemplate;
```

Handlers:

```rust
async fn new_workflow_form() -> impl IntoResponse {
    HtmlTemplate(WorkflowNewTemplate)
}

async fn create_workflow(
    State(state): State<AppState>,
    Form(form): Form<NewWorkflowForm>,
) -> Result<Response, WebError> {
    let name = form.name.trim();
    if name.is_empty() {
        return Err(WebError::BadRequest("workflow name is required".into()));
    }
    // Validate before writing anything to disk. ParseError converts to
    // WebError via the existing #[from] impl -> 422.
    smasher_attractor::dot::parser::parse(&form.dot_source)?;

    let workflows_dir = std::path::Path::new(&state.data_dir).join("workflows");
    std::fs::create_dir_all(&workflows_dir)?;

    let filename = smasher_attractor::run_dir::sanitize_graph_name(name);
    let file_path = workflows_dir.join(format!("{filename}.dot"));
    if file_path.exists() {
        return Err(WebError::BadRequest(format!(
            "a workflow named '{filename}' already exists"
        )));
    }
    std::fs::write(&file_path, &form.dot_source)?;

    let canonical_root = workflows_dir.canonicalize()?;
    let canonical_file = file_path.canonicalize()?;
    let id = crate::workflows::slug_for(&canonical_root, &canonical_file);

    Ok(Response::builder()
        .status(StatusCode::SEE_OTHER)
        .header("Location", format!("/workflows/{id}"))
        .body(axum::body::Body::empty())
        .unwrap()
        .into_response())
}
```

Router:

```rust
.route("/workflows/new", get(new_workflow_form))
.route("/workflows", post(create_workflow))
```

`templates/workflow_new.html` — the paste/upload half of the old
`dashboard.html`, trimmed to creation-only fields (no `brief`/`vars`/model
overrides — those are execution concerns that belong to
`workflow-run-shell`, not creation):

```html
{% extends "base.html" %}

{% block title %}SMASHER — Add Workflow{% endblock %}

{% block content %}
<section class="submit-section">
    <h2>Add Workflow</h2>
    <form method="post" action="/workflows" class="submit-form">
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" placeholder="my-pipeline" required>
        </div>
        <div class="form-group">
            <label for="dot_source">DOT Source</label>
            <div class="dot-source-header">
                <label for="dot_file" class="btn btn-small dot-upload-btn">
                    Upload .dot file
                    <input type="file" id="dot_file" accept=".dot,.gv" hidden>
                </label>
                <span id="dot-file-name" class="dot-file-name"></span>
            </div>
            <textarea id="dot_source" name="dot_source" rows="10"
                placeholder='digraph pipeline {
    plan -> implement -> review
    review -> implement [label="revise"]
}' required></textarea>
        </div>
        <script>
            document.getElementById('dot_file').addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                document.getElementById('dot-file-name').textContent = file.name;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    document.getElementById('dot_source').value = ev.target.result;
                };
                reader.readAsText(file);
            });
        </script>
        <button type="submit" class="btn btn-primary">Save Workflow</button>
    </form>
</section>
{% endblock %}
```

Now delete `templates/dashboard.html`, the `DashboardTemplate` struct, and
the `dashboard` handler function from `pages.rs` — both destinations
(`workflow_new.html` here, `runs_page.html` in Task 3) exist, so nothing is
lost.

**Step 4: Run tests to verify they pass**

Run: `cargo test -p smasher-web`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add crates/smasher-web/src/routes/pages.rs crates/smasher-web/templates/workflow_new.html
git rm crates/smasher-web/templates/dashboard.html
git commit -m "feat(web): add interim Add Workflow create flow at /workflows/new"
```

---

## Task 5: Stub `/workflows/{id}` detail page

**Files:**
- Modify: `crates/smasher-web/src/routes/pages.rs`
- Create: `crates/smasher-web/templates/workflow_detail_stub.html`

**Why:** `workflow-run-shell` isn't specced yet (deliberately, per the
capability map), but `/workflows/{id}` needs to resolve to something so
links from the catalog and the create flow don't dead-end.

**Step 1: Write failing tests**

```rust
#[tokio::test]
async fn workflow_detail_shows_raw_dot_source() {
    let tmp = tempfile::tempdir().unwrap();
    std::fs::write(tmp.path().join("demo.dot"), "digraph { a -> b }").unwrap();
    let mut state = test_state();
    state.workflow_dirs = vec![tmp.path().display().to_string()];
    let workflow = crate::workflows::scan_workflows(&state.workflow_dirs)
        .into_iter()
        .next()
        .unwrap();

    let app = crate::server::build_router(state);
    let response = app
        .oneshot(
            Request::builder()
                .uri(format!("/workflows/{}", workflow.id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let html = String::from_utf8(body.to_vec()).unwrap();
    assert!(html.contains("digraph { a -&gt; b }") || html.contains("digraph { a -> b }"));
}

#[tokio::test]
async fn workflow_detail_404s_for_unknown_id() {
    let app = crate::server::build_router(test_state());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/workflows/does-not-exist")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
```

**Step 2: Run tests to verify they fail**

Run: `cargo test -p smasher-web workflow_detail -- --nocapture`
Expected: FAIL — route doesn't exist.

**Step 3: Implement**

```rust
#[derive(Template)]
#[template(path = "workflow_detail_stub.html")]
struct WorkflowDetailStubTemplate {
    name: String,
    source_dir: String,
    dot_source: String,
}

async fn workflow_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;
    let dot_source = std::fs::read_to_string(&workflow.path)?;
    Ok(HtmlTemplate(WorkflowDetailStubTemplate {
        name: workflow.name,
        source_dir: workflow.source_dir,
        dot_source,
    }))
}
```

Router:

```rust
.route("/workflows/{id}", get(workflow_detail))
```

`templates/workflow_detail_stub.html`:

```html
{% extends "base.html" %}

{% block title %}SMASHER — {{ name }}{% endblock %}

{% block content %}
<section class="workflow-detail-section">
    <div class="section-header">
        <h2>{{ name }}</h2>
        <a href="/" class="btn btn-small">&larr; All workflows</a>
    </div>
    <p class="field-hint">
        Source: {{ source_dir }} — run, monitor, edit, and Q&amp;A land with
        the workflow-run-shell module. For now, here's the raw DOT source.
    </p>
    <pre class="dot-source-preview">{{ dot_source }}</pre>
</section>
{% endblock %}
```

**Step 4: Run tests to verify they pass**

Run: `cargo test -p smasher-web`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add crates/smasher-web/src/routes/pages.rs crates/smasher-web/templates/workflow_detail_stub.html
git commit -m "feat(web): add stub /workflows/{id} detail page"
```

---

## Task 6: Full workspace verification

**Files:** none (verification only)

**Why:** Confirm nothing outside `smasher-web` broke (e.g. `smasher-cli`'s
`cli_spec.rs` snapshot-style tests that assert on `--help` output).

**Step 1: Run the full suite**

```bash
cargo check --workspace
cargo test --workspace
cargo clippy --workspace
```

Expected: ALL PASS. Pay particular attention to
`crates/smasher-cli/src/cli_spec.rs` (asserts on `serve --help` text — the
new `--workflows-dir` flag's help output may need the test's expected-flags
list updated) and any doc-comment examples in `README.md` that reference
`smasher serve` flags.

**Step 2: Manual smoke check**

```bash
cargo run -p smasher-cli -- serve --workflows-dir examples
```

Open `http://127.0.0.1:21541/` — should list `.dot`/`.gv` files under
`examples/` and `~/.smasher/workflows/`. Click "Add Workflow," save a
trivial pipeline, confirm it redirects to a detail stub showing the raw
source, and confirm it now also appears back on `/`. Visit `/runs` and
confirm existing run-history behavior is unchanged.

**Step 3: Commit** (only if Step 1 required fixes)

```bash
git add -A && git commit -m "fix(cli): update serve --help flag assertions for --workflows-dir"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | serve.rs, server.rs, state.rs, + call sites | Thread `--workflows-dir` config through |
| 2 | workflows.rs (new), lib.rs | Directory scanning + id⇄path slugging |
| 3 | pages.rs, workflow_catalog.html, runs_page.html | `/` becomes the catalog; run history moves to `/runs` |
| 4 | pages.rs, workflow_new.html | "Add Workflow" interim create flow; retire dashboard.html |
| 5 | pages.rs, workflow_detail_stub.html | Stub `/workflows/{id}` detail page |
| 6 | — | Full workspace verification |

Tasks 1 and 2 are independent. Task 3 depends on 1 and 2. Task 4 depends on
3 (needs both relocation targets to exist before deleting `dashboard.html`).
Task 5 depends on 1 and 2 (not on 3/4). Task 6 depends on everything.

Recommended execution order: 1 → 2 → 3 → 4 → 5 → 6.
