# Design-Workflow Dashboard — Capability Map & Module 1 Spec (workflow-catalog)

**Date:** 2026-09-18
**Status:** Draft — pending review

---

## Problem

The current smasher-web dashboard IA is centered on runs, not workflows: `/` is a
"submit a run" form (paste/upload DOT text, hit go), `/runs/{id}` shows execution
state. There's no first-class concept of a DOT pipeline file as a persistent,
browsable, re-runnable "workflow" — every submission is ephemeral text with no
link back to its source file, and the UI has no orientation toward design work
(reviewing/editing pipeline structure) versus purely running software-factory
pipelines.

We're redesigning the IA around **workflows**: a landing page lists all known
`.dot` files as workflows; selecting one opens a per-workflow page to run it,
monitor progress, edit it, answer human-gate questions, and review artifacts.

## Capability Map

| Module id | Responsibility | Depends on |
|---|---|---|
| `workflow-catalog` | Landing page: discover `.dot`/`.gv` files under configurable path(s), list as workflows, link to detail page | — |
| `workflow-run-shell` | Workflow detail page: run the pipeline, monitor progress (SSE/graph), respond to human-gate questions, browse per-stage artifacts | `workflow-catalog` |
| `workflow-editor` | Visual node editor: select/add/edit/delete nodes, save back to the `.dot` file | `workflow-catalog` |

Build order: `workflow-catalog` → `workflow-run-shell` (parallelizable with
`workflow-editor` once that module is specced). `workflow-editor` is a follow-on
module, specced separately — except for one forward reference, below.

**Resolved tension:** the catalog's "Add Workflow" action is meant to open the
visual editor to create a new file from scratch, but `workflow-editor` is
deferred. v1 of `workflow-catalog` ships "Add Workflow" using the same plain
DOT-paste/upload form the current `/` dashboard already has (now saving to a
chosen directory instead of directly running), and that button gets re-pointed
at the real visual editor once `workflow-editor` ships. This avoids blocking
`workflow-catalog` on an unspecced module while keeping the button's
destination a one-line swap later.

## Non-Goals (this document)

- React or any frontend framework change — stays HTMX/askama per decision.
- Removing `/runs` or per-run history entirely — TBD when `workflow-run-shell`
  is specced (a run still belongs to a workflow, but whether there's a global
  cross-workflow run list is an open question for that module, not this one).

## Forward reference: run history doesn't survive a server restart

Investigated during this spec (not a `workflow-catalog` fix, but important
enough to record here so it isn't lost): run data already persists correctly
on disk — `crates/smasher-attractor/src/run_dir.rs`'s `RunDirectory`/
`RunManifest` writes a manifest + checkpoints/events/artifacts per run under
`data_dir`, and `smasher resume` already reads it back. The actual gap is that
`AppState.runs` (`crates/smasher-web/src/state.rs`) is an in-memory
`HashMap<String, RunRecord>` that's never rehydrated from those on-disk
manifests when `smasher serve` starts — so the dashboard's run list resets on
every server restart even though the underlying data is intact. **Requirement
for `workflow-run-shell`'s spec:** scan `data_dir` on startup and rehydrate
the run list from existing `RunManifest` files.

---

## Module 1 Spec: `workflow-catalog`

### Objective
Replace `/` with a landing page that lists every `.dot`/`.gv` file found under
one or more configured directories as a "workflow," so a design-focused user
orients around pipelines-as-files rather than one-off run submissions.
Selecting a workflow navigates to its detail page (owned by
`workflow-run-shell`, built next).

### Assumptions
1. Workflow display name = filename stem (e.g. `landing-page-redesign.dot` →
   "landing-page-redesign"); no separate title metadata format introduced yet.
2. Configured directories merge into one flat, alphabetically sorted list;
   each entry shows its source directory as a subtitle/tag so duplicate
   filenames across paths stay disambiguated.
3. Workflow "id" for routing is a stable slug derived from the file's path
   relative to its configured root (e.g. `examples/hello-world.dot` →
   `examples__hello-world`), not a random/generated id — the same file always
   resolves to the same URL.
4. Catalog itself does no execution, monitoring, or Q&A — purely discovery +
   navigation + the interim "Add Workflow" create flow.

→ Correct now or these stand.

### Configuration
- New CLI flag on `smasher serve`: `--workflows-dir <PATH>` (repeatable),
  analogous to the existing `--data-dir` (`crates/smasher-cli/src/serve.rs`).
- `ServerConfig` / `AppState` gains a `workflow_dirs: Vec<String>` field,
  threaded through the same way `data_dir` is today (`serve.rs` →
  `ServerConfig` → `AppState::new`, `crates/smasher-web/src/state.rs`).
- **`{data_dir}/workflows/` is always scanned**, unconditionally — it's where
  "Add Workflow" writes new files (default `~/.smasher/workflows`, created if
  missing), so it can never be excluded or the create flow would produce
  workflows the catalog can't see.
- **`--workflows-dir` (repeatable) controls the *additional* read roots.**
  Defaults to `["examples"]` when omitted. Passing `--workflows-dir` one or
  more times replaces this additional-roots list (not `{data_dir}/workflows`,
  which is never replaceable).
- Effective scan list = `{data_dir}/workflows` + the additional roots above,
  deduplicated.

### Routes (additive/replacing)
- `GET /` — now renders the workflow catalog (replaces the submit-run form).
- `GET /workflows/{id}` — stub for now; renders a placeholder page until
  `workflow-run-shell` lands (not a 404, so links don't dead-end during
  incremental rollout).
- `GET /workflows/new` — the interim "Add Workflow" form (DOT paste/upload +
  filename + target directory).
- `POST /workflows` — writes the new `.dot` file to the chosen directory,
  redirects to `/workflows/{id}`.

### Success Criteria
- `smasher serve --workflows-dir examples` shows a landing page listing every
  `.dot`/`.gv` file under `examples/` (recursively), sorted alphabetically,
  each linking to `/workflows/{id}`.
- Multiple `--workflows-dir` flags merge into one deduplicated list.
- "Add Workflow" creates a new `.dot` file on disk in a configured directory
  and redirects to its (stub) detail page.
- Existing `/runs/{id}` routes and their tests are untouched (run-shell
  migration is a separate module).
- `cargo test --workspace` passes; new tests cover directory scanning
  (multi-path merge, empty-directory case) and the add-workflow write path.

### Boundaries
- **Always:** follow the two-line `ABOUTME:` header convention and
  TDD (test first) per this repo's `CLAUDE.md`.
- **Ask first:** removing the existing `/` submit-run form's code paths
  outright rather than migrating them (per global instruction to request
  permission before rewriting existing implementations) — plan is to move,
  not delete, the paste/upload logic into the new `/workflows/new` form.
- **Never:** touch `/runs/{id}` internals — out of scope for this module.

### Resolved Questions
1. Default `--workflows-dir` = `["examples", "{data_dir}/workflows"]`, both
   user-editable via config/flags (see Configuration above).
2. Flat list regardless of subdirectory nesting — no grouping/sections.
3. A stub `/workflows/{id}` placeholder is acceptable; `workflow-catalog`
   ships independently of `workflow-run-shell`.
