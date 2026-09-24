# Spec: `workflow-run-shell` — Workflow Detail Page (Run, Monitor, Q&A, Artifacts)

Module id: `workflow-run-shell` (see `capability-map.md` and
`tasks/workflow-dashboard-design.md` Module 2). Depends on: `workflow-catalog`
(Done). Second build slice of the design-workflow-dashboard redesign, after
`workflow-catalog`.

## Objective

Replace the `workflow_detail_stub.html` placeholder at `GET /workflows/{id}`
with the real detail page: launch a run of that workflow's `.dot` file,
monitor its live progress (graph, status, tokens, event stream — reusing the
exact SSE/polling machinery already built for `/runs/{id}`), answer
human-gate questions (gallery gate + plain question cards, already built),
browse that run's candidates/artifacts and decision history (already built),
and see the workflow's own run history across multiple runs. Editing the DOT
graph itself stays out of scope — that's `workflow-editor`, a separate
deferred module.

Who uses it: a design-focused human who found a workflow file via the catalog
(`workflow-catalog`) and wants to run it, watch it work, answer its gate
questions, and review what it produced — all from the workflow's own URL,
without a paste-the-DOT-text detour.

Success looks like: open `/workflows/{id}` for a real `.dot` file, click Run,
watch the graph/status/tokens update live, answer a paused human-gate
question inline, see the candidate gallery populate, see the run appear in
this workflow's own run history — then restart `smasher serve` and reopen
`/workflows/{id}`: that run (status, graph, artifacts) is still there, not
lost to the in-memory-only reset `tasks/workflow-dashboard-design.md`'s
forward-reference flagged.

## Assumptions

Three decisions were confirmed with Jobsworth before drafting (editing
scope, `/runs`' fate, rehydration scope); the rest fill in underneath them,
grounded by reading the current `crates/smasher-web/src/routes/pages.rs`
(`workflow_detail`, `submit_run`, `run_detail`), `crates/smasher-web/src/state.rs`
(`AppState`, `RunRecord`, `RunSummary`), `crates/smasher-attractor/src/run_dir.rs`
(`RunManifest`, `RunDirectory`), and `crates/smasher-cli/src/run.rs`'s
`graph.dot`/`run.tgz`/checkpoint conventions — not guessed.

1. **The detail page is a composition of already-built partials, not a
   rewrite.** `run_detail.html`'s status/tokens/graph/questions/candidates/
   telemetry-drawer/decision-history sections are the proven shape.
   `workflow_detail_stub.html` is replaced by a template that keeps a
   workflow header (name, source dir, back-to-catalog link) at top, a "Run"
   trigger when idle, and — once at least one run exists — the same live
   sections `run_detail.html` already has, addressed by that run's id. No new
   SSE/polling wiring, no new gallery-gate/question-card code; this module
   wires existing pieces to a workflow id instead of a bare run id.
2. **One workflow can have many runs; the detail page shows its most recent
   run live and a history list of the rest.** Confirmed with Jobsworth: keep
   `/runs` (global, cross-workflow) exactly as it is today, and add a
   workflow-scoped view alongside it rather than removing `/runs` or limiting
   a workflow to one visible run. `RunRecord`, `RunManifest`, and `RunSummary`
   each gain `workflow_id: Option<String>` (`None` for the pre-existing
   paste-based `/runs` path some tests and possibly future ad-hoc runs still
   use) so runs can be filtered by workflow without a separate index.
3. **No DOT editing in this module.** Confirmed with Jobsworth. The page
   shows the file's current DOT source read-only (the same `<pre>` block
   `workflow_detail_stub.html` already renders) for reference only — no
   textarea, no save-back-to-file action; that is `workflow-editor`'s job.
   Running re-reads the file from disk at submit time, not the page-load
   snapshot, so an externally-edited file always runs its latest content —
   this costs nothing extra (`workflow_detail` already does a fresh
   `std::fs::read_to_string` per page load; the run route does the same per
   submit).
4. **New route `POST /workflows/{id}/run`.** It resolves the workflow by id
   (`workflows::resolve_workflow`), reads its file fresh, and forwards to the
   same run-creation logic `submit_run` already has — extracted into a
   shared internal fn (e.g. `create_run(state, dot_source, model, vars,
   brief, node_overrides, workflow_id) -> Result<String, WebError>` returning
   the new run id) so `POST /runs`'s existing paste-based path keeps working
   byte-for-byte, just calling the same fn with `workflow_id: None`. The new
   route stamps `workflow_id: Some(id)` on the created `RunRecord`. Model /
   vars / brief / node-overrides remain the same form inputs `submit_run`
   already accepts on this page; only `dot_source` stops being a
   client-supplied field for the workflow path.
5. **Rehydration extends `RunManifest` in place, not a new parallel store** —
   the scope Jobsworth picked over a list-only or deferred rehydration.
   Additive fields, each `#[serde(default)]` so every existing on-disk
   `manifest.json` (none of which have these fields today) still parses:
   - `workflow_id: Option<String>` — set at creation per assumption 4.
   - `status: String` — the same `format!("{:?}", RunStatus)` shape
     `RunSummary.status` already uses (`"Running"`, `"Completed"`,
     `"Failed"`, `"Aborted"`). Written `"Running"` at creation, overwritten in
     place (re-serialize `manifest.json`) at the one existing terminal
     transition point in `submit_run`'s spawned task where `record.status`
     and `record.completed_at` are already set — same event, one more write.
   - `input_tokens: u64` / `output_tokens: u64` — written once, at that same
     terminal-transition point, from the atomics' final values. A rehydrated
     old run only ever needs to display a final count, never a live-updating
     one, so no intermediate persistence is needed.
   - `completed_at: Option<DateTime<Utc>>` — same terminal-transition write.
   The DOT text itself is persisted the way the CLI already does it:
   `graph.dot` written into the run's root directory immediately after
   `RunDirectory::create`, both in `submit_run` and the new route. This fixes
   an existing asymmetry as a side effect, not a separate ticket — today only
   CLI-originated runs (`crates/smasher-cli/src/run.rs:934`) get a
   `graph.dot`; web-originated runs have none, so nothing about them can be
   resumed or rehydrated.
6. **On `smasher serve` startup, scan `{data_dir}/artifacts/*/manifest.json`
   and rehydrate one `RunRecord` per manifest into `AppState.runs`**, before
   the router starts accepting connections. For each manifest: reparse
   `graph.dot` (skip that run with a logged warning if `graph.dot` is
   missing — a pre-existing run from before this change, or a manifest this
   module's own bug wrote without it); rebuild `event_log` by replaying
   `events/events.jsonl` into a fresh `PipelineEventLog` (so the historical
   event list and graph-status rendering behave identically to a live run's);
   construct fresh, inert `emitter` / `cancellation` / `interviewer` values
   purely to satisfy `RunRecord`'s shape — a rehydrated run is never
   auto-resumed (that's `smasher resume`'s job, unchanged and out of scope
   here), so nothing ever publishes to that emitter or answers that
   interviewer. **Any manifest whose persisted `status` still reads
   `"Running"` is normalized to `Aborted` on load** — a `"Running"` status
   found at server startup is definitionally stale, since this fresh process
   has no live engine task for it. `RunStatus` gains no new variant for this;
   reusing `Aborted` keeps every existing exhaustive match on `RunStatus`
   unchanged. A manifest that fails to parse or whose directory is otherwise
   malformed is skipped with a warning — rehydration never fails server
   startup.
7. **The workflow detail page's run-history list reuses `run_list.html`'s
   existing table markup, filtered by `workflow_id`.** Whatever collects
   `Vec<RunSummary>` for that template gains a `workflow_id: Option<&str>`
   filter parameter (`/runs`'s existing page passes `None` — unfiltered,
   unchanged; the new workflow route passes `Some(id)`) rather than forking
   the template.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

Same as `workflow-catalog`: Rust, `smasher-attractor` (`RunManifest`,
`RunStatus` reuse — no new enum variant) and `smasher-web` (`state.rs`,
`run_dir.rs`, `routes/pages.rs`, `server.rs` startup) — no new crate, no new
frontend dependency. `askama` templates and HTMX polling/SSE exactly as
`run_detail.html` already does it.

## Commands

```bash
# Build and test the touched crates in isolation
cargo check -p smasher-attractor -p smasher-web
cargo test -p smasher-attractor run_dir
cargo test -p smasher-web
cargo clippy -p smasher-attractor -p smasher-web

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# Manual verification
smasher serve --workflows-dir examples
# open http://127.0.0.1:21541/workflows/{id}, click Run, watch it execute,
# answer a gate question, confirm candidates + history render; then Ctrl-C
# the server, restart it, and confirm the same run still shows up with its
# artifacts intact.
```

## Project Structure

```
crates/smasher-attractor/src/
  run_dir.rs                # touched: RunManifest gains workflow_id, status,
                             #      input_tokens, output_tokens, completed_at
                             #      (all #[serde(default)])

crates/smasher-web/src/
  state.rs                  # touched: RunRecord + RunSummary gain
                             #      workflow_id: Option<String>
  routes/pages.rs            # touched: submit_run's body extracted into a
                             #      shared create_run() fn; new
                             #      workflow_run handler (POST /workflows/{id}/run);
                             #      workflow_detail rewritten (real page, not stub);
                             #      run_list row source gains workflow_id filter;
                             #      terminal-transition point also persists
                             #      status/tokens/completed_at to manifest.json
  routes/mod.rs               # touched: register new route
  server.rs                  # touched: rehydrate_runs() called once before
                             #      build_router/serve on startup
  workflows.rs                # unchanged: resolve_workflow already does what's needed

crates/smasher-web/templates/
  workflow_detail.html        # new: replaces workflow_detail_stub.html --
                             #      header + Run form (idle) + run_detail.html's
                             #      live sections (once a run exists) + run-history table
  workflow_detail_stub.html   # deleted
  run_list.html               # touched: no markup change, only the Rust-side
                             #      row source gains a filter (template itself
                             #      unaffected if it just iterates `runs`)

docs/design-factory/
  SPEC-workflow-run-shell.md  # this file
  capability-map.md           # touched: workflow-run-shell status -> Done when complete
```

## Code Style

Additive manifest fields with `#[serde(default)]`, matching the same pattern
`gallery-gate`'s `GalleryAnswer.comments` already established in this
codebase:

```rust
// crates/smasher-attractor/src/run_dir.rs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RunManifest {
    pub run_id: String,
    pub graph_name: String,
    pub graph_hash: String,
    pub created_at: DateTime<Utc>,
    pub layout_version: u32,
    pub directories: RunDirectories,
    #[serde(default)]
    pub workflow_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub input_tokens: u64,
    #[serde(default)]
    pub output_tokens: u64,
    #[serde(default)]
    pub completed_at: Option<DateTime<Utc>>,
}
```

Shared run-creation fn, extracted so both entry points stay in lockstep:

```rust
// crates/smasher-web/src/routes/pages.rs
async fn create_run(
    state: &AppState,
    dot_source: String,
    model: Option<String>,
    vars: Option<String>,
    brief: Option<String>,
    node_overrides: Option<String>,
    workflow_id: Option<String>,
) -> Result<String, WebError> {
    // ... existing submit_run body, unchanged, plus:
    //   1. std::fs::write(run_directory's root.join("graph.dot"), &dot_source)?;
    //   2. RunRecord { workflow_id: workflow_id.clone(), ..as today }
    //   3. manifest write with workflow_id + status: "Running" before spawning
}

async fn workflow_run(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Form(form): Form<WorkflowRunForm>, // model/vars/brief/node_overrides only
) -> Result<Response, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;
    let dot_source = std::fs::read_to_string(&workflow.path)?;
    let run_id = create_run(
        &state, dot_source, form.model, form.vars, form.brief,
        form.node_overrides, Some(id),
    ).await?;
    Ok(redirect_to(format!("/workflows/{}/runs/{run_id}", /* or however the
        live section addresses it client-side */)))
}
```

Startup rehydration, called once from `server.rs` before `build_router`:

```rust
// crates/smasher-web/src/state.rs (or a new rehydrate.rs beside it)
pub async fn rehydrate_runs(data_dir: &str) -> HashMap<String, RunRecord> {
    let mut runs = HashMap::new();
    let artifacts_root = std::path::Path::new(data_dir).join("artifacts");
    let Ok(entries) = std::fs::read_dir(&artifacts_root) else { return runs; };

    for entry in entries.flatten() {
        let root = entry.path();
        let Ok(run_dir) = smasher_attractor::run_dir::RunDirectory::open(&root) else { continue };
        let manifest = run_dir.manifest();

        let Ok(dot_source) = std::fs::read_to_string(root.join("graph.dot")) else {
            tracing::warn!(run_id = %manifest.run_id, "no graph.dot, skipping rehydration");
            continue;
        };
        // parse + resolve dot_source into a Graph; replay events.jsonl into a
        // fresh PipelineEventLog; normalize a persisted "Running" status to
        // Aborted; construct RunRecord with inert emitter/cancellation/interviewer.
        // ... push into `runs` keyed by manifest.run_id ...
    }
    runs
}
```

```html
{# templates/workflow_detail.html -- shape, not final markup #}
{% extends "base.html" %}
{% block content %}
<div class="workflow-detail">
  <a href="/" class="btn btn-small">&larr; All workflows</a>
  <h2>{{ workflow.name }}</h2>
  <p class="field-hint">Source: {{ workflow.source_dir }}</p>
  <details class="dot-source-preview"><summary>DOT source</summary>
    <pre>{{ dot_source }}</pre>
  </details>

  {% match active_run %}
    {% when Some with (run) %}
      {# same live sections run_detail.html already renders, addressed by run.id #}
    {% when None %}
      <form hx-post="/workflows/{{ workflow.id }}/run" hx-swap="none">
        {# model / vars / brief / node_overrides inputs, same as today's submit form #}
        <button type="submit" class="btn">Run</button>
      </form>
  {% endmatch %}

  <section class="run-history-section">
    <h3>Run History</h3>
    {% include "run_list.html" %} {# runs already filtered by workflow_id server-side #}
  </section>
</div>
{% endblock %}
```

## Testing Strategy

Per this repo's testing standard: real filesystem fixtures, real axum test
requests, no mocking of the thing under test.

- **Unit (`smasher-attractor`, `run_dir.rs`):** `RunManifest` deserializes an
  old-shape `manifest.json` fixture (none of the new fields present) with
  every new field defaulted (`workflow_id: None`, `status: None`,
  `input_tokens: 0`, `output_tokens: 0`, `completed_at: None`); round-trips a
  fully-populated manifest unchanged.
- **Unit (`smasher-web`, rehydration fn):** a fixture run dir with
  `manifest.json` (status `"Running"`), `graph.dot`, and a small
  `events.jsonl` rehydrates into a `RunRecord` with status normalized to
  `Aborted`; a fixture missing `graph.dot` is skipped, not panicking; an
  empty `artifacts/` directory rehydrates zero runs; a corrupt
  `manifest.json` is skipped with the rest of the directory still processed.
- **Integration (`routes/pages.rs`, existing axum test pattern):**
  `POST /workflows/{id}/run` for a known workflow launches a run whose
  `RunRecord.workflow_id` equals `id` and whose dot source matches the file's
  current contents (write the fixture file, change it, submit, assert the
  *new* content ran — proves assumption 3's "reads fresh, not page-load
  snapshot"); unknown workflow id → 404; `GET /workflows/{id}` shows the Run
  form when no run exists yet and the live run sections once one does;
  `POST /runs` (existing paste path) still creates a `RunRecord` with
  `workflow_id: None` and passes unchanged.
- **Integration (run-history filter):** two runs for workflow A, one for
  workflow B — workflow A's page/list shows exactly its two; `/runs`
  (unfiltered) still shows all three, unchanged from today.
- **Manual (Browser tool):** run a fixture pipeline with a `render_capture` →
  `gallery` gate from `/workflows/{id}`, confirm live graph/status/tokens
  update, answer the gate question inline, confirm the candidate gallery and
  decision history render on the same page; then restart `smasher serve` and
  reopen the same URL, confirming the completed run and its candidates still
  show, and a *deliberately killed mid-run* process shows that run as
  `Aborted` after restart, not stuck `Running` forever.
- **Regression:** `cargo test --workspace` and `cargo clippy --workspace`
  stay clean; every existing `/runs`, `/runs/{id}/*`, and `workflow_catalog`
  route test passes unchanged.

## Boundaries

- **Always do:** keep `POST /runs`'s existing paste-based behavior
  byte-for-byte (same success/error responses, same `RunRecord` shape modulo
  the new optional field); keep every `RunManifest` change additive and
  `#[serde(default)]`; make rehydration failure-tolerant per-manifest (one
  bad directory never fails startup or drops the rest); reuse
  `run_detail.html`'s existing sections rather than duplicating their
  markup/polling logic; run `cargo test -p smasher-web` and
  `cargo clippy --workspace` before considering a task done.
- **Ask first:** adding a new `RunStatus` variant instead of reusing
  `Aborted` for a stale-`"Running"` rehydrated run; changing
  `candidates::scan_candidates`, `manifest::artifact_dir()`, or any file
  owned by an earlier `Done` module; changing the existing questions API
  routes; removing or restructuring `/runs`.
- **Never do:** implement DOT-source editing or a save-back-to-file action
  (that's `workflow-editor`); implement `workflow-editor` itself; block
  `smasher serve` startup on a single corrupt or missing manifest; persist
  intermediate (non-terminal) token counts to disk on every tick; auto-resume
  a rehydrated run's engine execution (that's `smasher resume`'s scope).

## Success Criteria

- `cargo test -p smasher-attractor -p smasher-web` passes with zero warnings;
  `cargo clippy --workspace` stays clean.
- `GET /workflows/{id}` for a real `.dot` file shows: workflow name/source,
  read-only DOT source, a Run button when idle, and — once a run has been
  submitted — the same live graph/status/token/question/candidate sections
  `/runs/{id}` already provides, plus a run-history table scoped to that
  workflow.
- Submitting the Run form launches a pipeline using the file's current
  on-disk content (not a stale page-load copy) and lands the human on that
  run's live view without leaving the workflow's URL.
- A run launched from a workflow page carries `workflow_id` through
  `RunRecord`/`RunManifest`/`RunSummary`; the workflow's run-history list
  shows exactly its own runs; the global `/runs` page is unaffected.
- Killing `smasher serve` mid-run and restarting it: the run reappears in its
  workflow's history as `Aborted` (not lost, not stuck `Running`), with its
  graph, event history, and any candidates it produced still browsable.
- The existing paste-based `POST /runs` path and every pre-existing
  `/runs/{id}/*` route/test are unaffected.
- No DOT-editing UI or save-back-to-file action exists anywhere in this
  module's output.

## Open Questions

- Whether the candidate-gallery and decision-history partials render
  correctly for a rehydrated (non-live) run with no real emitter behind
  them — they read from disk via `scan_candidates`/`gallery_decisions`
  already, so this should just work, but needs a live check rather than an
  assumption, per this module's own testing strategy.
- Run-history pagination/ordering once a single workflow accumulates many
  runs — deferred until a real workflow has enough runs for it to matter;
  today's plain `run_list.html` table with no paging is acceptable at
  current scale, same as `/runs` today.
- Whether `workflow_run`'s redirect target should be a distinct
  `/workflows/{id}/runs/{run_id}` URL (bookmarkable, workflow-scoped) or
  simply `/workflows/{id}` re-rendered with the new run as `active_run` —
  left to implementation; either satisfies this spec's success criteria, but
  worth picking deliberately at Plan time rather than by accident.
