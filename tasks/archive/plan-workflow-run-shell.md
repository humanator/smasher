# Implementation Plan: `workflow-run-shell` (Module 2)

## Overview

`workflow-run-shell` is Module 2 of the design-workflow-dashboard redesign
(`design-factory/SPEC-workflow-run-shell.md`, status **Spec drafted** per
`capability-map.md`). It replaces `workflow_detail_stub.html` at
`GET /workflows/{id}` with the real detail page: run the workflow's `.dot`
file, watch it live (graph/status/tokens/events — the exact machinery
`/runs/{id}` already has), answer human-gate questions inline, browse
candidates/decision history, and see the workflow's own run history — then
survive a `smasher serve` restart without losing that run. Depends on
`workflow-catalog` (Done, archived).

Grounded by reading the actual current code immediately before writing this
plan (not the spec's pseudocode alone):

- `crates/smasher-attractor/src/run_dir.rs:24-31` — `RunManifest` has exactly
  5 fields today (`run_id`, `graph_name`, `graph_hash`, `created_at`,
  `layout_version`, `directories`); none of the 5 fields this module adds
  exist yet. `RunDirectory` (line 37) derives `Clone` — significant, see
  Architecture Decisions. `RunDirectory::create` (80-119) writes
  `manifest.json` once, at creation; there is no mutator today, only
  `manifest()` returning `&RunManifest` (132-135).
- `crates/smasher-web/src/state.rs:20-68` — `AppState` already has
  `workflow_dirs` (from `workflow-catalog`); `RunRecord` has no `workflow_id`
  field. `RunSummary` (71-82) is the serializable projection `to_summary()`
  (85-106) builds — both need the new field.
- `crates/smasher-web/src/routes/pages.rs` — `workflow_detail` (376-387)
  reads the file fresh and renders the stub, unchanged since
  `workflow-catalog`. `submit_run` (389-687) is one large function: parses
  the DOT, creates a `RunDirectory` (475-481, no `graph.dot` written —
  confirmed asymmetry with the CLI), builds a `RunRecord` literal (500-516),
  spawns the engine, and at the task's one terminal-transition point
  (664-678) mutates `record.status`/`record.completed_at` in memory only —
  nothing touches `manifest.json` after creation today. `run_detail`
  (689-713) and its sibling fragment handlers (`run_graph` 715-780,
  `run_status` 781-792, `run_tokens` 794-812, `run_questions` 814-923,
  `run_candidates` 925-945, `run_decisions` 947-...) all key off
  `state.runs.get(&id)` — none of them care whether that `RunRecord` came
  from a live spawn or a rehydrated manifest, which is what makes rehydration
  safe: `run_questions`' `record.interviewer.list_questions()` on a fresh,
  never-fed `HttpInterviewer` simply returns no pending questions, which is
  correct for any rehydrated (necessarily terminal) run. `router()` (289-302)
  has no `/workflows/{id}/run` route yet.
- `crates/smasher-web/src/server.rs:146-176` — `run_with_config` builds
  `AppState` then `build_router` then binds and serves; no rehydration call
  exists. `effective_workflow_dirs` (100-107) is the precedent for a small,
  independently-testable pure fn feeding into this boundary.
- `crates/smasher-web/templates/run_detail.html` — a full page (`{% extends
  "base.html" %}`) whose body (lines 6-125: status/token-counter/telemetry
  button/abort button, then questions/candidates/graph sections, then the
  telemetry drawer with the SSE event stream and decision-history poll) is
  not currently extractable as a partial — `workflow_detail.html` also needs
  to `{% extends "base.html" %}` as its own page, so Askama's single-parent
  `extends` model means these two pages cannot both directly render this
  body today. Precedent for factoring shared markup into a sibling
  `{% include %}`-able partial already exists in this same template
  (`run_status.html`, `token_counter.html` are both already tiny includes
  used from more than one place).
- `crates/smasher-web/templates/run_list.html` — iterates a `runs` variable
  with no filtering; whatever Rust code collects that `Vec<RunSummary>` is
  where a `workflow_id` filter belongs, not the template.
- `crates/smasher-attractor/src/events.rs:49-52` — `PipelineEvent` derives
  `Deserialize`, confirming `events.jsonl` is replayable. But
  `crates/smasher-attractor/src/log_sink.rs:381-399`'s `FileLogSink::append`
  wraps every event in a `LogEntry { sequence, event }` before serializing —
  replay must deserialize `LogEntry` per line and pull out `.event`, not
  deserialize `PipelineEvent` directly, or every line will fail to parse.
- `crates/smasher-cli/src/run.rs:929-931` — the CLI's existing
  `graph.dot`-into-run-root convention this module extends to web-originated
  runs: `std::fs::write(rd.manifest().directories.root.join("graph.dot"),
  &dot_source)?` immediately after `RunDirectory::create`.
- `RunRecord { ... }` literal construction sites (grep, workspace-wide): 10
  total — `state.rs:180` (test helper), `routes/questions.rs:115`,
  `routes/pages.rs:500,1468,1782,2408`, `routes/api.rs:221,566,1064`,
  `routes/gallery.rs:553`. Every one needs the new field once `RunRecord`
  gains `workflow_id`.

## Architecture Decisions

- **`RunDirectory` gains a `persist_run_metadata` mutator+writer, not ad hoc
  `std::fs::write` calls scattered in `smasher-web`.** Both write points this
  module needs (creation-time stamp of `workflow_id`/`status:"Running"`; the
  terminal-transition stamp of final `status`/tokens/`completed_at`) mutate
  the same in-memory `RunManifest` and re-serialize it to the same
  `manifest.json` path — that behavior belongs in `run_dir.rs` next to
  `create`/`open`, not duplicated in `pages.rs`.
- **The terminal-transition write needs its own `RunDirectory` handle inside
  the spawned task, which never captured one.** `submit_run`'s spawned
  closure today only captures `checkpoint_dir`/`candidate_artifacts_dir`
  (cloned `PathBuf`s), not `run_directory` itself. Since `RunDirectory`
  derives `Clone` (confirmed above), the fix is to clone `run_directory`
  before `tokio::spawn` and move the clone in, rather than reconstructing one
  via `RunDirectory::open` at the terminal point (extra disk read for no
  reason) or restructuring the closure's captures.
- **`workflow_detail.html` reuses `run_detail.html`'s live sections by
  extracting them into a new `run_detail_body.html` partial**, included from
  both `run_detail.html` (unchanged behavior, still the standalone
  `/runs/{id}` page) and `workflow_detail.html` (new). This is the concrete
  mechanism behind the spec's Assumption 1 ("composition of already-built
  partials... no new SSE/polling wiring") — without it, "reuse" would mean
  copy-pasting ~120 lines of markup, which the spec's Boundaries section
  rules out.
- **The Run-form redirect target is `/workflows/{id}` itself** (re-rendered
  with the new run as `active_run`), resolving the spec's Open Question 3.
  Chosen over a distinct `/workflows/{id}/runs/{run_id}` URL because the
  spec's own Success Criteria says the submission should land the human "on
  that run's live view without leaving the workflow's URL" — the plainest
  reading of "the workflow's URL" is the URL that's already in the address
  bar, not a new one. Follows the same `HX-Redirect` response-header pattern
  `submit_run` already uses (not a plain 302) since the Run form is an HTMX
  `hx-post`.
- **"Active run" for a workflow = its most-recently-started `RunRecord`** (by
  `started_at` descending) among those with matching `workflow_id`. The
  run-history table (via the `workflow_id`-filtered `run_list.html`
  collection) is not deduplicated against it — it lists every run for the
  workflow, including the active one, matching how `/runs` already lists
  every run today with no special-casing.
- **Rehydration merges into `AppState.runs` after construction, not via a
  new `AppState::new` parameter.** `AppState::new` stays a clean "empty
  runs map" constructor (10 call sites already depend on its current
  shape); `run_with_config` calls `rehydrate_runs(&state.data_dir).await`
  and writes the result into `state.runs` under a write-lock, once, before
  `build_router`.

## Dependency Graph

```
Task 1: RunManifest gains workflow_id/status/token/completed_at fields
        + RunDirectory::persist_run_metadata          (smasher-attractor)
                          │
                          ▼
Task 2: create_run() extraction; workflow_id threaded through RunRecord/
        RunSummary; graph.dot written for web runs too; manifest stamped
        at creation and at the terminal transition        (smasher-web)
                          │
              ── Checkpoint A: cargo test/clippy -p smasher-attractor
                 -p smasher-web green; POST /runs byte-for-byte unchanged ──
                          │
                          ▼
Task 3: POST /workflows/{id}/run route, using create_run()
                          │
                          ▼
Task 4: workflow_detail rewritten — run_detail_body.html partial extraction,
        Run form (idle) / live sections (active run) composition,
        workflow_id-filtered run-history table; stub template deleted
                          │
              ── Checkpoint B: manual browser pass — run a workflow end
                 to end from /workflows/{id}, confirm live sections and
                 gate Q&A work exactly as they do at /runs/{id} today ──
                          │
                          ▼
Task 5: Startup rehydration — rehydrate_runs() (manifest + graph.dot +
        events.jsonl replay, stale "Running" -> Aborted) + server.rs wiring
                          │
                          ▼
Task 6 (Checkpoint C, final): full workspace regression + manual restart-
        survival check against every item in the spec's Success Criteria
```

This module is one continuous vertical build, not several independent
slices — each task's route/page/persistence depends on the previous task's
plumbing existing, unlike `workflow-catalog`'s Tasks 1+2. No task pair here
is safely parallelizable.

## Task summary

| Task | Files | What |
|------|-------|------|
| 1 | `run_dir.rs` | `RunManifest` additive fields + `persist_run_metadata` |
| 2 | `state.rs`, `routes/{pages,api,questions,gallery}.rs` | `create_run()` extraction, `workflow_id` threading, `graph.dot` write, manifest stamps |
| 3 | `routes/pages.rs` | `POST /workflows/{id}/run` |
| 4 | `routes/pages.rs`, `run_detail.html`, `run_detail_body.html` (new), `workflow_detail.html` (new), `run_list.html` row source | Real detail page: composition + history filter |
| 5 | `run_dir.rs` or new `rehydrate.rs`, `server.rs` | Startup rehydration |
| 6 | — | Full regression + manual restart-survival verification |

See `tasks/todo-workflow-run-shell.md` for full task-by-task acceptance
criteria and verification steps.
