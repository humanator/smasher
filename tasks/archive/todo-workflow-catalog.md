# Task List: `workflow-catalog` (Module 1)

Full context in `tasks/plan.md`. Spec: `tasks/workflow-dashboard-design.md`
("Module 1 Spec: workflow-catalog", status Draft — pending review).
Conventions: `smasher/CLAUDE.md` — all files start with two `ABOUTME:`
comment lines, tests inline (`#[cfg(test)] mod tests`), TDD (test first),
real fixtures over mocking.

---

## Task 1: Thread `--workflows-dir` config through CLI → `ServerConfig` → `AppState`

**Description:** Add a `workflow_dirs: Vec<String>` field to `AppState`
(`crates/smasher-web/src/state.rs:20-37`) and thread it through
`AppState::new`'s signature. Add the same field to `ServerConfig`
(`crates/smasher-web/src/server.rs:55-64`); `Default for ServerConfig`
(lines 78-105) reads it from a `SMASHER_WORKFLOWS_DIR` env var
(comma-separated), defaulting to `["examples"]` when unset — same pattern
as the existing `data_dir` default. At the `run_with_config` call site
(`server.rs:124`), enforce the "`{data_dir}/workflows` is always scanned"
invariant once: append `{data_dir}/workflows` to the configured list if not
already present, before constructing `AppState`. Add a repeatable
`--workflows-dir <PATH>` flag to `ServeArgs`
(`crates/smasher-cli/src/serve.rs:12-31`), analogous to `--data-dir`
(lines 29-30); when passed one or more times it *replaces* the additional-
roots list (not `{data_dir}/workflows`, which is never replaceable) per the
spec's Configuration section. Update all 11 `AppState::new(...)` call sites
(`state.rs:112`; `server.rs:124,166,179`; `routes/questions.rs:64`;
`routes/pages.rs:873,882`; `routes/api.rs:822,919,960`; `routes/gallery.rs:489`)
to pass the new argument — test helpers pass `vec![]` (empty workflow dirs
is a valid, tested state per Task 2's empty-directory case).

**Acceptance criteria:**
- [x] `AppState` has a `workflow_dirs: Vec<String>` field; `AppState::new`'s
      test (`state.rs`) asserts it's stored correctly
- [x] `ServerConfig::default()` includes `{data_dir}/workflows` in its
      effective `workflow_dirs` even when `SMASHER_WORKFLOWS_DIR` is unset
- [x] `smasher serve --workflows-dir examples --workflows-dir other` merges
      both into the additional-roots list, deduplicated against
      `{data_dir}/workflows`
- [x] Omitting `--workflows-dir` falls back to the `["examples"]` default,
      not an empty list
- [x] All 11 pre-existing `AppState::new` call sites compile and pass with
      the new argument added

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web -p smasher-cli`
- [x] Build succeeds: `cargo check --workspace`
- [x] Optional (not required — `serve_help_contains_expected_flags` in
      `cli_spec.rs:399-415` only asserts presence of `--port`/`--model`/
      `--data-dir`, so it stays green either way): extend that test's
      `expected_flags` array to also assert `--workflows-dir` is documented
- [x] Manual check: none needed at this layer — covered by Task 6's smoke test

**Dependencies:** None — safe to do in parallel with Task 2 (no shared files)

**Files likely touched:**
- `smasher/crates/smasher-cli/src/serve.rs`
- `smasher/crates/smasher-web/src/server.rs`
- `smasher/crates/smasher-web/src/state.rs`
- `smasher/crates/smasher-web/src/routes/{pages,api,questions,gallery}.rs` (call sites only)

**Estimated scope:** Medium (4 files with real changes, 11 call sites mechanically updated)

---

## Task 2: `workflows.rs` — directory scanning and id⇄path slugging

**Description:** Create `crates/smasher-web/src/workflows.rs` as a pure,
framework-free module (no axum/askama types) exposing a `WorkflowSummary`
struct (`id`, `name`, `source_dir`, `path`), a `scan_workflows(dirs: &[String])
-> Vec<WorkflowSummary>` function that recursively walks each directory for
`.dot`/`.gv` files (case-insensitive extension match), deduplicates by
canonicalized path (the same file reachable via two configured roots appears
once), sorts alphabetically by name, and silently skips directories that
don't exist or can't be read (a stale `--workflows-dir` shouldn't take the
catalog down). Also expose `resolve_workflow(dirs: &[String], id: &str) ->
Option<WorkflowSummary>` (re-scans and finds by id — simpler and always-
consistent vs. maintaining a separate index, acceptable at this module's
file counts). The id slug is built from the file's path relative to its
configured root (e.g. root=`examples`, file=`examples/hello-world.dot` →
`examples__hello-world`), matching the spec's Assumption 3 (same file always
resolves to the same URL). Register the module in `crates/smasher-web/src/lib.rs`.
Add `tempfile` as a `smasher-web` dev-dependency if `Cargo.toml` doesn't
already have it (check first — several workspace crates already use it).

**Acceptance criteria:**
- [x] Scanning finds `.dot` and `.gv` files recursively, ignores other
      extensions (e.g. `.md`)
- [x] The same file reachable via two configured roots (or the same root
      passed twice) appears exactly once in the result
- [x] A missing/unreadable directory is skipped without erroring or
      panicking — result just excludes it
- [x] An empty directory (or empty `dirs` list) returns an empty list, not
      an error
- [x] `resolve_workflow` round-trips: an id produced by `scan_workflows`
      resolves back to the same path via `resolve_workflow`
- [x] `resolve_workflow` returns `None` for an unknown id (no panic)
- [x] Two configured roots with the same final path component (e.g.
      `foo/examples` and `bar/examples`) is a documented known limitation
      (colliding slugs), not silently mishandled — note it in a doc comment,
      don't attempt to fully disambiguate in this task

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web workflows::`
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] Manual check: none needed at this layer — pure module, covered by unit tests

**Dependencies:** None — safe to do in parallel with Task 1 (no shared files)

**Files likely touched:**
- `smasher/crates/smasher-web/src/workflows.rs` (new)
- `smasher/crates/smasher-web/src/lib.rs`
- `smasher/crates/smasher-web/Cargo.toml` (dev-dependency, only if missing)

**Estimated scope:** Small (1 new file, 2 mechanical edits)

---

## Task 3: `GET /` renders the workflow catalog; `GET /runs` renders run history

**Description:** Replace the `dashboard` handler and `DashboardTemplate`
(`crates/smasher-web/src/routes/pages.rs:29-33,280-285`) with a
`workflow_catalog` handler backed by a new `WorkflowCatalogTemplate`
(`templates/workflow_catalog.html`, new) that calls
`crate::workflows::scan_workflows(&state.workflow_dirs)` and renders each
result as a link to `/workflows/{id}`, with an explicit empty state
("No workflows found. Add one to get started.") when the list is empty.
Add a `GET /runs` handler (`runs_page`, backed by `RunsPageTemplate` /
`templates/runs_page.html`, new) that reuses the exact same
runs-map-to-`RunSummary` logic the old `dashboard` handler had, and
`{% include "run_list.html" %}`s the existing fragment — see `tasks/plan.md`'s
"Open question" section: this `GET /runs` half goes beyond the spec's
literal route list and should be confirmed, not assumed, at review. Update
the router (`pages.rs:263-274`): `/` now maps to `workflow_catalog`; `/runs`
gets both `.get(runs_page)` and the existing `.post(submit_run)` on the same
route entry. Do **not** delete `dashboard.html` yet — Task 4 needs it as the
source for relocating the paste/upload form first.

**Acceptance criteria:**
- [x] `GET /` with workflows present under configured dirs lists each one,
      linking to `/workflows/{id}`, showing its `source_dir`
- [x] `GET /` with no workflows found shows the empty-state message, not an
      error or blank table
- [x] `GET /runs` returns 200 and lists existing run records (reusing the
      same `RunSummary` sort-by-`started_at`-descending logic the old
      dashboard had)
- [x] `POST /runs` (existing `submit_run` behavior) is unchanged — still
      works exactly as before on the same path
- [x] `dashboard.html` still exists and is untouched (deletion is Task 4's
      job, not this task's)

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` — new tests:
      `root_lists_workflows_found_under_configured_dirs`,
      `root_shows_empty_state_with_no_workflows`, `runs_page_lists_run_history`
      (check the existing test module's `insert_test_record`-style helper
      signature before reusing it verbatim)
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] Manual check (Browser tool or curl): `smasher serve --workflows-dir
      examples`, confirm `/` lists `examples/`'s `.dot` files and `/runs`
      shows run history separately

**Dependencies:** Tasks 1 and 2 (needs `state.workflow_dirs` and
`crate::workflows::scan_workflows`)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/workflow_catalog.html` (new)
- `smasher/crates/smasher-web/templates/runs_page.html` (new)

**Estimated scope:** Medium (1 file substantially changed, 2 new templates)

---

## Task 4: "Add Workflow" interim create flow; retire `dashboard.html`

**Description:** Add `GET /workflows/new` (renders `workflow_new.html`, new
— the DOT paste/upload form's markup relocated verbatim from
`dashboard.html`, plus a filename field and a target-directory choice) and
`POST /workflows` (writes the submitted DOT text to
`{chosen_dir}/{name}.dot`, redirects to `/workflows/{id}` — `SEE_OTHER`).
Server-side validation on `name`, using the same rejection discipline
`gallery.rs`'s `validate_candidate_id` applies to candidate ids (adapted for
filenames): reject empty/whitespace-only names (`BAD_REQUEST`), reject names
containing path separators or `..` components (`BAD_REQUEST` — path
traversal, e.g. `../../etc/passwd` must never escape the target directory),
reject DOT source that fails to parse (`UNPROCESSABLE_ENTITY`). Per the
design doc's "resolved tension," this form is explicitly interim — comment
noting it gets re-pointed at the real visual editor once `workflow-editor`
ships. Once both `/workflows/new` (this task) and `/runs` (Task 3) exist as
working landing spots for `dashboard.html`'s two pieces, delete
`dashboard.html`, its `DashboardTemplate` struct, and the old `dashboard`
handler (already unreferenced after Task 3's router change) — sequencing
matters: never delete before both relocation targets are live.

**Acceptance criteria:**
- [x] `GET /workflows/new` returns 200 with the paste/upload form
- [x] `POST /workflows` with a valid name + DOT source writes the file to
      the chosen directory and redirects (`303 SEE_OTHER`) to `/workflows/{id}`
- [x] `POST /workflows` with invalid DOT source (fails to parse) returns
      `422 UNPROCESSABLE_ENTITY`, writes nothing
- [x] `POST /workflows` with a blank/whitespace-only name returns
      `400 BAD_REQUEST`, writes nothing
- [x] `POST /workflows` with a name containing `..` or a path separator
      (e.g. `../../etc/passwd`, `sub/dir`) returns `400 BAD_REQUEST` and
      writes nothing outside the target directory — this case has no
      equivalent test in the superseded draft; added here because it's a
      real path-traversal vector on untrusted input, not hypothetical
- [x] `dashboard.html`, `DashboardTemplate`, and the `dashboard` handler no
      longer exist in the tree
- [x] The relocated form's markup is unchanged in substance (same fields,
      same behavior) — moved, not rewritten

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` — `new_workflow_form_renders`,
      `create_workflow_writes_file_and_redirects`,
      `create_workflow_rejects_invalid_dot`, `create_workflow_rejects_blank_name`,
      plus the new path-traversal rejection test above
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] Manual check (Browser tool): visit `/workflows/new`, submit a trivial
      pipeline, confirm redirect to the (stub, pending Task 5) detail page
      and that the new file appears back on `/`

**Dependencies:** Task 3 (needs `/runs` live before `dashboard.html` can be
safely deleted — both relocation targets must exist first)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/workflow_new.html` (new)
- `smasher/crates/smasher-web/templates/dashboard.html` (deleted)

**Estimated scope:** Medium (1 file substantially changed, 1 new template, 1 deleted)

---

## Task 5: Stub `GET /workflows/{id}` detail page

**Description:** Add a `GET /workflows/{id}` route (`workflow_detail`
handler) that resolves `id` via `crate::workflows::resolve_workflow`, reads
the file's raw DOT source, and renders a placeholder page
(`workflow_detail_stub.html`, new) showing the workflow's name, source
directory, and raw DOT text in a `<pre>` block, with a note that run/
monitor/edit/Q&A land with `workflow-run-shell`. An unknown id returns
`404 NOT_FOUND`, not a panic or 500. Per the spec's Resolved Questions, this
stub is intentionally acceptable — `workflow-catalog` ships independently of
`workflow-run-shell`.

**Acceptance criteria:**
- [x] `GET /workflows/{id}` for a known workflow returns 200, showing its
      name, source directory, and raw DOT source
- [x] `GET /workflows/{id}` for an unknown id returns `404 NOT_FOUND`
- [x] The stub page links back to `/` ("All workflows")
- [x] No run/monitor/edit/Q&A functionality is implemented here — purely a
      read-only placeholder, per scope

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` — new tests for known-id 200
      and unknown-id 404
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] Manual check (Browser tool): click a workflow link from `/`, confirm
      the stub renders its raw DOT source; visit a bogus `/workflows/nope`,
      confirm 404 rather than a crash

**Dependencies:** Tasks 1 and 2 only (`state.workflow_dirs` +
`crate::workflows::resolve_workflow`) — parallelizable with Tasks 3/4, no
shared template or router-section conflict beyond the router file itself

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/workflow_detail_stub.html` (new)

**Estimated scope:** Small (1 file, 1 new template)

---

## Checkpoint: `workflow-catalog` complete

- [x] `cargo test --workspace` and `cargo clippy --workspace` pass; no new
      warnings beyond this repo's pre-existing baseline
- [x] Every one of the spec's Success Criteria
      (`tasks/workflow-dashboard-design.md`, "Module 1 Spec") is checked
      against actual behavior, not assumed:
      - `smasher serve --workflows-dir examples` lists every `.dot`/`.gv`
        file under `examples/` recursively, sorted alphabetically
      - Multiple `--workflows-dir` flags merge into one deduplicated list
      - "Add Workflow" creates a file on disk and redirects to its (stub)
        detail page
      - Existing `/runs/{id}` routes and their tests are untouched
      - `cargo test --workspace` passes; directory-scanning and
        add-workflow-write-path tests exist
- [x] Manual (Browser tool): full click-through — `/` → click a workflow →
      stub detail page → back to `/` → "Add Workflow" → submit → redirected
      to new stub → new workflow now appears on `/` → `/runs` still shows
      run history
- [x] **Decision needed from Jobsworth**: confirm or reject Task 3's
      unsanctioned `GET /runs` addition (see `tasks/plan.md`'s "Open
      question" section) — if rejected, `/runs` should be pulled and the
      run-history gap left explicitly open pending `workflow-run-shell`.
      **Resolved 2026-09-18: approved as-is** — `GET /runs` stays.
- [x] Update `capability-map.md`: add a `workflow-catalog` row (Status:
      terse per existing convention — `Done` or `In progress`, no more)
- [ ] Human review — once approved, move `tasks/plan.md`/`tasks/todo.md` to
      `tasks/archive/` as `plan-workflow-catalog.md` / `todo-workflow-catalog.md`
