# Implementation Plan: `workflow-catalog` (Module 1)

## Overview

`workflow-catalog` is the first module of the design-workflow-dashboard
redesign specced in `tasks/workflow-dashboard-design.md` (status: **Draft —
pending review** as of 2026-09-18 — this plan proceeds against the draft per
Jobsworth's instruction, but the spec itself hasn't been signed off). It
replaces `smasher-web`'s run-centric `/` dashboard with a landing page that
discovers `.dot`/`.gv` pipeline files under configured directories and lists
them as "workflows." Zero lines of this module exist in the current tree
(confirmed by direct grep — no `workflows.rs`, no `workflow_dirs` field, no
`/workflows*` routes).

**Supersedes** `tasks/archive/workflow-dashboard-plan-draft-v1.md` — a
narrative TDD-style draft of this same module, written minutes before this
plan. That draft's technical approach (config threading → pure scanner
module → route swap → create flow → stub detail page) is sound and this
plan adopts it, but reshapes it into this repo's acceptance-criteria +
dependency-graph + checkpoint format (matching the archived `gallery-gate`
plan/todo pair) and corrects several claims the draft got wrong — see
"Corrections to the superseded draft" below.

Grounded by reading the actual current code (not the old draft's prose
alone) immediately before writing this plan:
- `crates/smasher-web/src/state.rs:20-37` — `AppState` has exactly 4 fields
  (`runs`, `client`, `default_model`, `default_provider`, `data_dir` — no
  `workflow_dirs`) and `AppState::new` takes exactly those 4 constructor args
  (excluding `runs`, which is initialized internally).
- `crates/smasher-web/src/server.rs:55-64` — `ServerConfig` has no
  `workflow_dirs` field. `Default for ServerConfig` (lines 78-105) builds
  everything from env vars; no workflow-dir logic exists. `AppState::new` is
  called at line 124 (production) and lines 166, 179 (tests).
- `crates/smasher-cli/src/serve.rs` — `ServeArgs` (lines 12-31) has
  `--port`/`--model`/`--provider`/`--data-dir` only; `--data-dir`
  (lines 29-30) is the direct precedent for the new `--workflows-dir` flag's
  threading pattern (resolved in `run()`, `ServerConfig` built at lines 50-56).
- `crates/smasher-web/src/routes/pages.rs:263-274` — router has 9 routes.
  `/runs` exists as **`POST` only** (`submit_run`, line 287) — there is no
  `GET /runs`. `dashboard` (lines 280-285) is the current `/` handler,
  rendering `DashboardTemplate` (lines 29-33, `dashboard.html`).
- Templates directory (14 files) — `dashboard.html` exists and is the
  current `/` template. `run_list.html` exists and **is** currently used,
  via `{% include "run_list.html" %}` inside `dashboard.html:173` — only the
  standalone `RunListTemplate` Rust struct (`pages.rs:44-49`) is
  `#[allow(dead_code)]`. No `workflow_catalog.html`, `runs_page.html`,
  `workflow_new.html`, or `workflow_detail_stub.html` exist yet.
- `crates/smasher-cli/src/cli_spec.rs:399-415` —
  `serve_help_contains_expected_flags` asserts only that `--port`,
  `--model`, `--data-dir` are *present* in `serve --help` output; it is not
  exhaustive, so adding `--workflows-dir` will not break it.
- All 11 `AppState::new(...)` call sites (grep, workspace-wide):
  `state.rs:112`, `server.rs:124,166,179`, `routes/questions.rs:64`,
  `routes/pages.rs:873,882`, `routes/api.rs:822,919,960`, `routes/gallery.rs:489`
  — across 6 files. Any constructor-signature change touches all 11.
- Test convention confirmed: inline `#[cfg(test)] mod tests` in the same
  file (no separate `tests/` dir in `smasher-web`), per this repo's
  `CLAUDE.md` and e.g. `state.rs:105-210`, `server.rs:152-253`.

### Corrections to the superseded draft

- **Call-site count**: the draft implied ~5 `AppState::new` sites across 5
  files; there are **11 sites across 6 files** (it missed `state.rs`'s own
  test and undercounted `api.rs`'s three inline sites). Task 1 below uses
  the corrected list.
- **`cli_spec.rs` risk**: the draft treated the `serve --help` snapshot test
  as something the new flag "may need to update." It doesn't — the test
  only checks presence of three specific flags, not an exhaustive list.
  Downgraded from a required step to an optional nice-to-have in Task 1.
- **`run_list.html` "unused" framing**: the draft called it "currently
  unused" when proposing to reuse it for `/runs`. It's unused only as a
  *standalone template* (the Rust struct wrapping it is dead code) — the
  markup itself is live today via the `dashboard.html` include. Reusing it
  for a new `/runs` page is still the right move; the framing is corrected
  so nobody goes looking for a truly dead file.

### Open question this plan does **not** resolve (flagged for Jobsworth)

The module spec's own Routes section (`tasks/workflow-dashboard-design.md`,
"Module 1 Spec: workflow-catalog") lists exactly four routes — `GET /`,
`GET /workflows/{id}`, `GET /workflows/new`, `POST /workflows` — and its
Non-Goals section explicitly defers "whether there's a global cross-workflow
run list" to `workflow-run-shell`, calling it TBD. **No `GET /runs` route is
in the approved scope.** But `dashboard.html` today is the only UI surface
that lists runs (via `run_list.html`); once `/` becomes the catalog and
nothing replaces that listing, there is no UI path to run history at all
until `workflow-run-shell` ships — only bookmarked `/runs/{id}` URLs still
resolve. The superseded draft silently added `GET /runs` to close this gap
without spec sanction.

This plan takes the conservative reading — **Task 3 below adds `GET /runs`
anyway**, reusing the existing `run_list.html` fragment, because shipping a
UI with zero path to run history seems like a real regression a design-focused
user would hit immediately, not a hypothetical. But this is a scope call
beyond the spec's literal text, called out here explicitly rather than
silently folded in — reject Task 3's `GET /runs` half at review if the
TBD-until-`workflow-run-shell` reading was intentional.

## Architecture Decisions

- **Directory scanning is a pure, dependency-free module** (`workflows.rs`):
  no axum/askama types, so it unit-tests cheaply via `tempfile` fixtures
  without HTTP round-trips. Mirrors this repo's existing preference for
  isolating pure logic from route handlers (e.g. `gallery.rs`'s
  `validate_decision` helpers).
- **`{data_dir}/workflows` is always scanned, unconditionally.** Enforced
  once, at the `run_with_config`/CLI boundary where `ServerConfig` becomes
  `AppState`, not inside `workflows.rs` itself — the scanner stays a dumb
  "scan this list of dirs" function with no special-cased path, matching
  the spec's Configuration section.
- **Workflow id is a stable slug derived from path-relative-to-root**
  (`root_name__relative__path`, extension stripped), not a random id — the
  spec's Assumption 3 requires the same file to always resolve to the same
  URL. Resolving an id back to a path re-scans rather than maintaining a
  separate index (simpler, always-consistent, acceptable at the file counts
  this module deals with).
- **The existing paste/upload form is relocated, not deleted**, per the
  spec's explicit "ask first before deleting" boundary — `dashboard.html`
  only gets deleted once both its pieces (run list → `/runs`, paste/upload
  form → `/workflows/new`) have working landing spots, sequenced as the last
  step of Task 4 so there's never a window where the form exists nowhere.
- **New workflow filenames get the same path-traversal validation
  discipline `gallery.rs`'s `validate_candidate_id` already applies to
  candidate ids** — a `name` field of `../../etc/passwd` must be rejected,
  not written. No prior art existed for this specific input (new code, not
  reused code), but the validation *shape* (reject `..`/`/`/separators,
  require non-empty after trim) follows the established local pattern.
- **No new dependency.** `tempfile` is already a workspace dependency
  elsewhere; `workflows.rs`'s tests use it as a dev-dependency, added to
  `smasher-web`'s `Cargo.toml` only if not already present there.

## Dependency Graph

```
Task 1: --workflows-dir config thread    Task 2: workflows.rs scanner module
(serve.rs -> ServerConfig -> AppState)   (pure, no shared files with Task 1)
        │                                         │
        └────────────────┬────────────────────────┘
                          ▼
        Task 3: GET / renders catalog; GET /runs renders run history
        (vertical: config + scanner -> working landing page)
                          │
                          ▼
        Task 4: GET /workflows/new + POST /workflows create flow;
        dashboard.html retired (needs both relocation targets live first)
                          │
        ┌─────────────────┘
        │  (Task 5 only needs Tasks 1+2, not 3/4 — parallelizable)
        ▼
        Task 5: GET /workflows/{id} stub detail page
                          │
                          ▼
        Task 6 (Checkpoint): full workspace verification + spec
        Success Criteria sign-off, including the GET /runs open question
```

Tasks 1 and 2 have no shared files and can proceed in parallel. Task 3
depends on both. Task 4 depends on Task 3 (dashboard.html's two halves must
both have landing spots before deletion). Task 5 depends only on Tasks 1+2
and can run in parallel with 3/4. Task 6 depends on everything.

## Note on repo naming convention

This repo's convention (per `capability-map.md`) is one `SPEC-<module-id>.md`
per module at the `design-factory/` top level, with `plan-<module-id>.md` /
`todo-<module-id>.md` once archived. This module's spec currently lives
inside `tasks/workflow-dashboard-design.md` instead (a combined
capability-map + Module 1 spec document), which doesn't match that
convention. Not fixed here — flagging only, since renaming/splitting the
spec file wasn't part of what was asked or approved.

## Task summary

| Task | Files | What |
|------|-------|------|
| 1 | serve.rs, server.rs, state.rs, 11 `AppState::new` call sites | Thread `--workflows-dir` config through |
| 2 | workflows.rs (new), lib.rs, Cargo.toml (dev-dep) | Directory scanning + id⇄path slugging |
| 3 | pages.rs, workflow_catalog.html (new), runs_page.html (new) | `/` becomes the catalog; `/runs` (GET) shows run history |
| 4 | pages.rs, workflow_new.html (new), dashboard.html (deleted) | "Add Workflow" create flow; retire dashboard.html |
| 5 | pages.rs, workflow_detail_stub.html (new) | Stub `/workflows/{id}` detail page |
| 6 | — | Full workspace verification + spec sign-off |

See `tasks/todo.md` for full task-by-task acceptance criteria and
verification steps.
