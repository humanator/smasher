# Task List: `workflow-run-shell` (Module 2)

Full context in `tasks/plan-workflow-run-shell.md`. Spec:
`design-factory/SPEC-workflow-run-shell.md`. Conventions: `smasher/CLAUDE.md`
— all files start with two `ABOUTME:` comment lines, tests inline
(`#[cfg(test)] mod tests`), TDD (test first), real fixtures over mocking.

---

## Task 1: `RunManifest` gains rehydration fields + `RunDirectory::persist_run_metadata`

**Description:** Add five additive, `#[serde(default)]` fields to
`RunManifest` (`crates/smasher-attractor/src/run_dir.rs:24-31`):
`workflow_id: Option<String>`, `status: Option<String>`,
`input_tokens: u64`, `output_tokens: u64`,
`completed_at: Option<DateTime<Utc>>` — matching the spec's Code Style
sketch exactly (`status` as `Option<String>`, defaulting to `None`, not a
bare `String`, since a freshly-created manifest before Task 2 writes to it
has no status yet). Add `RunDirectory::persist_run_metadata(&mut self,
workflow_id: Option<String>, status: Option<String>, input_tokens: u64,
output_tokens: u64, completed_at: Option<DateTime<Utc>>) ->
Result<(), StateError>` that sets these five fields on `self.manifest` and
re-serializes it to `{root}/manifest.json` (same `serde_json::to_string_pretty`
+ `std::fs::write` pattern `create` already uses at
`run_dir.rs:111-116`), leaving every other field (`run_id`, `graph_name`,
`graph_hash`, `created_at`, `layout_version`, `directories`) untouched.

**Acceptance criteria:**
- [x] `RunManifest` deserializes an old-shape `manifest.json` fixture (none
      of the 5 new fields present — write one by hand in the test, don't
      generate it via `create`) with every new field defaulted
      (`workflow_id: None`, `status: None`, `input_tokens: 0`,
      `output_tokens: 0`, `completed_at: None`)
- [x] A fully-populated `RunManifest` (all 5 new fields set) round-trips
      through `serde_json::to_string_pretty` + `from_str` unchanged
- [x] `persist_run_metadata` mutates the in-memory `manifest()` AND rewrites
      `manifest.json` on disk — read the file back after calling it, assert
      the new fields are present with the given values
- [x] `persist_run_metadata` leaves `run_id`/`graph_name`/`graph_hash`/
      `created_at`/`layout_version`/`directories` unchanged (read them back
      before and after, assert equal)
- [x] Calling `persist_run_metadata` twice (creation-time stamp, then
      terminal-transition stamp) leaves the second call's values as the
      final on-disk state — no stale first-call data survives

**Verification:**
- [x] Tests pass: `cargo test -p smasher-attractor run_dir`
- [x] Build succeeds: `cargo check -p smasher-attractor`
- [x] `cargo clippy -p smasher-attractor`
- [x] Manual check: none needed at this layer — pure struct + fs round-trip,
      covered by unit tests

**Dependencies:** None

**Files likely touched:**
- `smasher/crates/smasher-attractor/src/run_dir.rs`

**Estimated scope:** Small (one struct, one new method, no call-site changes yet)

---

## Task 2: `create_run()` extraction — `workflow_id` threading, `graph.dot` persistence, manifest stamps

**Description:** Add `workflow_id: Option<String>` to `RunRecord`
(`state.rs:52-68`) and `RunSummary` (`state.rs:71-82`); `to_summary()`
(`state.rs:85-106`) copies it straight through (no path-relativization like
`run_working_dir` gets — it's just an id, not a filesystem path). Update all
10 `RunRecord { ... }` literal sites to add the field: the 9 sites outside
`submit_run` set `workflow_id: None` (none of those tests care about
workflow scoping) — `state.rs:180` (test helper — add an optional
`workflow_id: Option<String>` parameter, defaulting existing callers to
`None`, OR hardcode `None` and let Task 4's tests construct records directly
if the helper turns out not to need parameterizing; decide based on what
Task 4's tests actually need), `routes/questions.rs:115`,
`routes/pages.rs:1468,1782,2408`, `routes/api.rs:221,566,1064`,
`routes/gallery.rs:553`.

Extract `submit_run`'s body (`pages.rs:389-687`) into a new
`async fn create_run(state: &AppState, dot_source: String, model:
Option<String>, vars: Option<String>, brief: Option<String>,
node_overrides: Option<String>, workflow_id: Option<String>) ->
Result<String, WebError>` returning the new run id. `submit_run` becomes a
thin wrapper: `create_run(&state, form.dot_source, form.model, form.vars,
form.brief, form.node_overrides, None).await` mapped into the existing
`HX-Redirect: /runs/{run_id}` response — same status code, same header, same
body, so every existing `submit_run`/`POST /runs` test keeps passing
unmodified. Inside `create_run`, immediately after `RunDirectory::create`
(current `pages.rs:475-481`): write `graph.dot` into the run root
(`std::fs::write(run_directory.manifest().directories.root.join("graph.dot"),
&dot_source)?`, mirroring `crates/smasher-cli/src/run.rs:929-931` exactly —
this fixes the CLI/web asymmetry the spec calls out as a side effect, not a
separate ticket); call
`run_directory.persist_run_metadata(workflow_id.clone(), Some("Running".into()),
0, 0, None)` before spawning the engine task (`run_directory` must become
`let mut run_directory = ...` for this). Set `workflow_id: workflow_id.clone()`
on the `RunRecord` literal (current `pages.rs:500-516`).

At the spawned task's one terminal-transition point (current
`pages.rs:664-678`, where `record.status`/`record.completed_at` are set in
memory): clone `run_directory` before `tokio::spawn` (it derives `Clone` —
confirmed in Task 1's grounding) and move the clone into the closure; after
the existing in-memory mutation, also call
`run_directory_clone.persist_run_metadata(workflow_id.clone(),
Some(format!("{:?}", record.status)), input_tokens.load(Ordering::Relaxed),
output_tokens.load(Ordering::Relaxed), record.completed_at)` — same
`{:?}`-of-`RunStatus` shape `RunSummary.status` already uses, so a
rehydrated run's `status` string matches the live-run string format exactly.

**Acceptance criteria:**
- [x] Every pre-existing `submit_run`/`POST /runs` test in `pages.rs` passes
      unmodified — same success response (`HX-Redirect` header, empty body,
      200), same error responses (bad DOT, lint errors, malformed node
      overrides)
- [x] A `POST /runs` submission writes `{run_dir}/graph.dot` containing
      exactly the submitted `dot_source` (new test)
- [x] Immediately after a `POST /runs` submission, `manifest.json` on disk
      has `"workflow_id": null` and `"status": "Running"` (new test)
- [x] After a run reaches a terminal state (use a fast trivial single-node
      graph, following whatever async-completion-wait pattern existing
      `submit_run` tests already use, e.g.
      `submit_run_with_brief_field_sets_brief_variable` at `pages.rs:1105`),
      `manifest.json` has `status` matching the final `RunRecord.status`
      (`"Completed"`/`"Failed"`/`"Aborted"`), plus non-stale
      `input_tokens`/`output_tokens`/`completed_at` (new test)
- [x] `RunRecord.workflow_id` and `RunSummary.workflow_id` round-trip
      through `to_summary()` for both `Some` and `None` (extend the existing
      `to_summary_*` test block in `state.rs:199-228`)
- [x] All 10 `RunRecord` literal sites compile with the new field

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web`
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] `cargo clippy -p smasher-web`
- [x] Manual check: none needed beyond the new automated tests — this task
      has no new user-facing surface yet (Task 3 adds the route that uses
      `workflow_id: Some(...)`)

**Dependencies:** Task 1 (`persist_run_metadata` must exist)

**Files likely touched:**
- `smasher/crates/smasher-web/src/state.rs`
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/src/routes/api.rs`
- `smasher/crates/smasher-web/src/routes/questions.rs`
- `smasher/crates/smasher-web/src/routes/gallery.rs`

**Estimated scope:** Large (one real function extraction + behavior
addition, plus 10 mechanical call-site edits across 4 files)

### Checkpoint A

- [x] `cargo test -p smasher-attractor -p smasher-web` green
- [x] `cargo clippy -p smasher-attractor -p smasher-web` clean
- [x] Manually confirm `POST /runs` (the existing paste form at whatever
      page currently exposes it) still works end to end and now produces a
      `graph.dot` alongside `manifest.json` in the run's artifact directory

---

## Task 3: `POST /workflows/{id}/run`

**Description:** Add a `WorkflowRunForm { model: Option<String>, vars:
Option<String>, brief: Option<String>, node_overrides: Option<String> }`
(same shape as `SubmitForm` at `pages.rs:182-191` minus `dot_source`, which
stops being client-supplied for this path per the spec's Assumption 4). Add
`async fn workflow_run(State(state): State<AppState>, Path(id): Path<String>,
Form(form): Form<WorkflowRunForm>) -> Result<Response, WebError>`: resolve
the workflow via `crate::workflows::resolve_workflow(&state.workflow_dirs,
&id)` (404 via `WebError::NotFound` if unresolved, same pattern
`workflow_detail` already uses at `pages.rs:380-381`), read
`&workflow.path` fresh with `std::fs::read_to_string` (not any page-load
snapshot — there is none available here anyway, since this is a bare POST),
call `create_run(&state, dot_source, form.model, form.vars, form.brief,
form.node_overrides, Some(id.clone())).await?`, respond with the same
`HX-Redirect` response shape `submit_run` uses but pointed at
`/workflows/{id}` (the chosen redirect target — see plan's Architecture
Decisions). Register `.route("/workflows/{id}/run", post(workflow_run))` in
`router()` (`pages.rs:289-302`).

**Acceptance criteria:**
- [x] `POST /workflows/{id}/run` for a known workflow id launches a run
      whose `RunRecord.workflow_id == Some(id)`
- [x] The dot source that actually ran matches the file's *current* on-disk
      content, not a stale snapshot: write a fixture file, submit, change
      the file's contents, submit again, assert the second run's graph
      reflects the *new* content (proves the "reads fresh" requirement —
      mirrors the spec's own Testing Strategy wording)
- [x] `POST /workflows/{unknown-id}/run` returns 404
- [x] Response carries `HX-Redirect: /workflows/{id}` on success (matching
      the chosen redirect-target decision)
- [x] The existing `POST /runs` paste path (Task 2) is unaffected — still
      produces `workflow_id: None` records

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web`
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] `cargo clippy -p smasher-web`
- [x] Manual check: `curl -X POST http://127.0.0.1:21541/workflows/{id}/run`
      against a `smasher serve --workflows-dir examples` instance, confirm a
      new run directory with `workflow_id` set appears under
      `{data_dir}/artifacts/`

**Dependencies:** Task 2 (`create_run()` must exist)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`

**Estimated scope:** Medium (one new handler + form struct + route registration)

---

## Task 4: Real `workflow_detail` page — composition, Run form, history filter

**Description:** Two structural pieces, both needed before the page itself
can be written:

1. **Extract `run_detail.html`'s body into `run_detail_body.html`.** Move
   lines 6-125 of the current `run_detail.html` (the `run-detail` div's
   contents plus the telemetry drawer and its `<script>`) into a new
   `templates/run_detail_body.html`, parameterized the same way
   `RunDetailTemplate` already is (`run`, `historical_events`,
   `initial_input_tokens`, `initial_output_tokens` — same fields, no new
   ones). `run_detail.html` becomes `{% extends "base.html" %}` +
   `{% block content %}{% include "run_detail_body.html" %}{% endblock %}`.
   `RunDetailTemplate` (`pages.rs:54-61`) and `run_detail` (`pages.rs:689-713`)
   are otherwise unchanged — this is a pure markup move, not a behavior
   change, and every existing `/runs/{id}` test must keep passing unmodified.
2. **Rewrite `workflow_detail`.** New `WorkflowDetailTemplate` holding
   `workflow: WorkflowSummary`, `dot_source: String`,
   `active_run: Option<RunSummary>`, and — duplicated from
   `RunDetailTemplate` only because Askama template structs are flat data,
   not composable — `historical_events: String`,
   `initial_input_tokens: u64`, `initial_output_tokens: u64` (empty/zero
   when `active_run` is `None`). Handler: resolve the workflow (existing
   404 behavior unchanged), read `dot_source` fresh, look up `state.runs`
   for the entry with matching `workflow_id` and the latest `started_at`
   (the "active run" — plan's Architecture Decisions), build
   `historical_events`/token snapshots for it exactly as `run_detail` does
   when one exists. New `templates/workflow_detail.html`: header (name,
   `source_dir`, back-to-catalog link — kept from the stub), the read-only
   `<pre>` DOT block (kept from the stub, still no textarea/save action —
   per spec Boundaries, "Never do" DOT editing), then `{% match active_run
   %}` — `None` renders the Run form (`hx-post="/workflows/{{ workflow.id
   }}/run" hx-swap="none"`, fields for model/vars/brief/node_overrides
   matching `WorkflowRunForm`), `Some(run)` renders
   `{% include "run_detail_body.html" %}`. Below that, a "Run History"
   section `{% include "run_list.html" %}` fed the workflow-filtered list
   (below). Delete `workflow_detail_stub.html` and its
   `WorkflowDetailStubTemplate` struct.
3. **Filter `run_list.html`'s row source by `workflow_id`.** Wherever
   `Vec<RunSummary>` is currently collected for `run_list.html` (the
   `runs_page` handler today, `pages.rs` — check its current signature
   before changing it), factor a shared helper taking
   `workflow_id: Option<&str>`: `None` returns every run sorted
   `started_at` descending (today's unfiltered behavior, used by `/runs`),
   `Some(id)` returns only runs whose `RunRecord.workflow_id.as_deref() ==
   Some(id)`, same sort. `workflow_detail`'s handler calls it with
   `Some(&id)`. `run_list.html` itself needs no markup change — it already
   just iterates `runs`.

**Acceptance criteria:**
- [x] `run_detail_body.html` extraction: every existing `/runs/{id}`-related
      test (`run_detail_*`, polling endpoint tests) passes unmodified —
      confirms the move introduced no behavior change
- [x] `GET /workflows/{id}` with no runs for that workflow shows the Run
      form, not any live section (no status/token/question/candidate/graph
      containers in the response body)
- [x] `GET /workflows/{id}` once a run exists for it shows the same live
      sections `/runs/{run_id}` shows, addressed by that run's id (the
      `hx-get` targets in the response point at `/runs/{run_id}/status` etc.
      — same endpoints, unchanged, per the spec's "no new SSE/polling
      wiring")
- [x] The workflow's DOT source appears in a read-only `<pre>` block; no
      `<textarea>` or save-to-file form exists anywhere in the response
      — interpreted as: the DOT source itself is never editable (no
      `name="dot_source"` field, no form that writes it back to disk). The
      Run form does use textareas for `vars`/`brief`/`node_overrides`
      (run parameters, not DOT source) — flagging this reading in case it
      wasn't the intended scope.
- [x] `GET /workflows/{unknown-id}` still returns 404 (pre-existing
      `workflow_detail_unknown_id_returns_404` test, `pages.rs:1431`, stays
      green)
- [x] Run-history filter: two runs created for workflow A, one for workflow
      B — `GET /workflows/{A}`'s history table lists exactly the two A runs;
      `GET /runs` (unfiltered) still lists all three, unchanged from today
- [x] When a workflow has multiple runs, the one shown live (`active_run`)
      is the most-recently-started one, and the history table still lists
      all of them including that one

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web`
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] `cargo clippy -p smasher-web`
- [x] Manual: exercised via curl against a real `smasher serve` instance
      (not the Browser tool) — confirmed `/workflows/{id}` shows the Run
      form pre-run, and shows the same `hx-get` live-polling endpoints
      `/runs/{id}` uses once a run exists, on the unchanged `/workflows/{id}`
      URL.

**Dependencies:** Task 3 (the Run form posts to `/workflows/{id}/run`)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/run_detail.html`
- `smasher/crates/smasher-web/templates/run_detail_body.html` (new)
- `smasher/crates/smasher-web/templates/workflow_detail.html` (new)
- `smasher/crates/smasher-web/templates/workflow_detail_stub.html` (deleted)
- `smasher/crates/smasher-web/templates/run_list.html` (row-source only, template markup likely untouched)

**Estimated scope:** Large (template refactor + new composed page + shared
filter helper)

### Checkpoint B

- [ ] Manual browser pass: run a fixture pipeline with a `render_capture` →
      `gallery` gate from `/workflows/{id}`; confirm live graph/status/
      tokens update, the gate question answers inline, the candidate
      gallery and decision history render on the same page (spec's Open
      Question 1 — verify, don't assume, that these partials render
      correctly here)
      — **not done as a live browser pass.** Reasoned instead from code:
      `workflow_detail`'s live section is a byte-for-byte
      `{% include "run_detail_body.html" %}`, addressed at the exact same
      `/runs/{run_id}/questions|candidates|decisions|graph` endpoints
      `/runs/{id}` already uses, untouched by this task. Existing tests
      (`run_questions_shows_gate_card_for_paused_gallery_run`,
      `run_candidates_returns_candidate_cards_for_real_fixture_artifacts`,
      etc.) already prove those endpoints render gallery-gate partials
      correctly; since the markup and routes are identical, the same output
      renders whether reached via `/runs/{id}` or `/workflows/{id}`. This is
      inference, not direct observation — a real browser pass would need a
      genuine `render_capture` run (real LLM + screenshot capture), which
      needs live API credentials this environment doesn't exercise. Flagging
      for a human to do the literal browser pass if that gap matters.
- [x] Confirm the workflow catalog (`/`) still links correctly into this
      now-real detail page, and the back-to-catalog link still works
      — confirmed live via curl: catalog page links to `/workflows/{id}`,
      that page 200s and renders `All workflows` back-link
      (`workflow_detail_known_id_shows_name_source_dir_and_dot_source` also
      asserts this).

---

## Task 5: Startup rehydration

**Description:** New `rehydrate_runs(data_dir: &str) -> HashMap<String, RunRecord>`
(async, since it constructs `RunRecord`s that hold async-flavored types like
`Arc<RwLock<...>>`-compatible fields — but the scan/parse/replay logic itself
is synchronous file I/O; place it in `smasher-web` since `RunRecord` is a
`smasher-web` type, e.g. a new `crates/smasher-web/src/rehydrate.rs`). For
each `{data_dir}/artifacts/*/` entry: `RunDirectory::open(&root)` (skip on
error — a directory whose `manifest.json` doesn't parse); read
`root.join("graph.dot")` (skip with a `tracing::warn!` if missing — a
pre-existing run from before this module, or a manifest this module's own
bug wrote without one); `smasher_attractor::dot::parser::parse` +
`smasher_attractor::graph::resolve` the dot source into a `Graph` (skip +
warn on parse/resolve failure — same tolerance); read
`root.join("events/events.jsonl")` line by line, deserializing each line as
the `LogEntry { sequence, event }` wrapper (per plan grounding — NOT bare
`PipelineEvent`) and pushing `.event` into a fresh `PipelineEventLog` (a
missing or empty file is fine — zero events, not an error); read the
manifest's persisted `status: Option<String>` — if it's exactly
`Some("Running")`, normalize to `"Aborted"` for the constructed
`RunRecord.status` (a `"Running"` status found at server startup is
definitionally stale — no live engine task exists for it in this fresh
process); construct fresh, inert `Arc<PipelineEventEmitter>` (nothing ever
publishes to it), `CancellationToken::new()`, `HttpInterviewer::new()`
(nothing ever answers it) to satisfy `RunRecord`'s shape; set
`input_tokens`/`output_tokens` from the manifest's persisted values (loaded
once into fresh `AtomicU64`s — a rehydrated run only ever shows a final
count, never live-updating, per the spec); push into the result map keyed by
`manifest.run_id`. A manifest that fails to parse, or a directory that's
otherwise malformed, is skipped with a `tracing::warn!` — one bad directory
must not sink the whole scan or fail server startup.

Wire it in: `run_with_config` (`server.rs:146-176`), after
`AppState::new(...)` and before `build_router(state)`, calls
`let rehydrated = rehydrate_runs(&state.data_dir).await;` then merges it
into `state.runs` under a write-lock (`state.runs.write().await.extend(rehydrated);`).

**Acceptance criteria:**
- [x] A fixture run dir with `manifest.json` (`status: "Running"`),
      `graph.dot`, and a small `events.jsonl` rehydrates into a `RunRecord`
      with `status` normalized to `Aborted` (not left as `Running`)
- [x] A fixture missing `graph.dot` is skipped — the function returns
      without that run, doesn't panic, doesn't error the whole call
- [x] An empty (or missing) `{data_dir}/artifacts/` directory rehydrates to
      an empty map, not an error
- [x] A fixture with a corrupt/unparseable `manifest.json` is skipped, while
      other valid run directories in the same `artifacts/` tree still
      rehydrate correctly (multi-fixture test — one bad entry doesn't sink
      the scan)
- [x] `events.jsonl` replay correctly reconstructs the event log for a run
      whose `manifest.json` never had a `graph.dot`-adjacent issue —
      `events()` on the rebuilt `PipelineEventLog` returns the same events
      in the same order they were appended
- [x] `run_with_config` calls this once before `build_router`/`serve` (not
      per-request, not lazily)

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web rehydrate`
- [x] Build succeeds: `cargo check --workspace`
- [x] `cargo clippy --workspace`
- [x] Manual: start `smasher serve`, launch a run from `/workflows/{id}`,
      let it complete, kill `-9` the server, restart it, reopen
      `/workflows/{id}` — the completed run reappeared with its live
      sections addressed at the same run id, and `GET /runs/{id}` also
      200'd directly. (Did not additionally re-verify candidates render,
      since no candidates were produced by the trivial no-codergen fixture
      graph used here — that path is exercised by Task 6's fuller check.)

**Dependencies:** Task 4 (needs the full page + route surface in place to
manually verify a rehydrated run renders correctly, though the rehydration
function itself only depends on Tasks 1-2's manifest fields)

**Files likely touched:**
- `smasher/crates/smasher-web/src/rehydrate.rs` (new) or `state.rs`
- `smasher/crates/smasher-web/src/server.rs`
- `smasher/crates/smasher-web/src/lib.rs` (module registration)

**Estimated scope:** Large (new subsystem: file scanning, DOT
parsing/resolution, event replay, status normalization, all
failure-tolerant)

---

## Task 6 (Checkpoint C, final): Full regression + restart-survival sign-off

**Description:** No new code — verify the whole module against the spec's
Success Criteria as a single pass, including the one manual scenario none of
the prior tasks individually exercise: a process kill mid-run followed by a
restart.

**Acceptance criteria (mirrors `SPEC-workflow-run-shell.md`'s Success Criteria):**
- [x] `cargo test -p smasher-attractor -p smasher-web` passes with zero
      warnings; `cargo clippy --workspace` stays clean
      — zero warnings from the test run itself; `clippy --workspace` has
      pre-existing warnings in `smasher-attractor`/`smasher-agent`/`smasher-llm`
      (unrelated `sort_by`/`map_or`/`collapsible_match` lints, confirmed
      present before this module's first commit) but zero in any file this
      module touched (`smasher-web`, `run_dir.rs`).
- [x] `cargo test --workspace` passes — every pre-existing `/runs`,
      `/runs/{id}/*`, and `workflow_catalog` route test still passes
      unchanged
- [x] `GET /workflows/{id}` for a real `.dot` file shows: workflow
      name/source, read-only DOT source, a Run button when idle, and — once
      a run has been submitted — the same live sections `/runs/{id}`
      provides, plus a run-history table scoped to that workflow
- [x] Submitting the Run form launches a pipeline using the file's current
      on-disk content and lands the human on that run's live view without
      leaving the workflow's URL
- [x] A run launched from a workflow page carries `workflow_id` through
      `RunRecord`/`RunManifest`/`RunSummary`; the workflow's run-history
      list shows exactly its own runs; the global `/runs` page is unaffected
- [x] **Manual, not yet exercised by any prior task:** start a run from
      `/workflows/{id}`, kill `smasher serve` (`SIGKILL` or `Ctrl-C` mid-run,
      not after completion) while it's mid-execution, restart the server,
      reopen the same workflow URL — the run reappears in its workflow's
      history as `Aborted` (not lost, not stuck `Running` forever), with its
      graph, event history, and any candidates it produced still browsable
      — verified against the real `smasher serve` binary using a hand-built
      fixture run directory with `status: "Running"` on disk (simulating a
      SIGKILL mid-execution, since a real `render_capture`/codergen node
      needs live LLM credentials this environment doesn't exercise
      reliably): after restart, `/runs/{id}/status` showed `Aborted`,
      `/runs/{id}/graph` 200'd, tokens (42/17) and both `events.jsonl` lines
      (`pipeline_started`, `node_started`) replayed correctly, and the run
      appeared in its workflow's history table. No candidates were produced
      by this fixture (no real candidate artifacts to browse) — that
      specific sub-claim ("any candidates it produced still browsable")
      is unverified by this pass; candidate serving itself is unchanged
      by this module.
- [x] The existing paste-based `POST /runs` path and every pre-existing
      `/runs/{id}/*` route/test are unaffected
- [x] No DOT-editing UI or save-back-to-file action exists anywhere in this
      module's output
- [x] `capability-map.md`: flip `workflow-run-shell`'s status from "Spec
      drafted" to "Done"; move this plan/todo pair into `tasks/archive/`
      alongside the pattern every prior Done module follows

**Verification:**
- [x] All boxes above checked with direct evidence (test output, a browser
      screenshot/observation), not "looks right"

**Dependencies:** Tasks 1-5 all complete

**Files likely touched:**
- `design-factory/capability-map.md` (status flip)
- `design-factory/tasks/` → `design-factory/tasks/archive/` (this plan/todo
  pair, once Done)

**Estimated scope:** Small (no new code — verification and bookkeeping only)

---

## Post-sign-off follow-up: Run form never reappeared once any run existed

Found by Jobsworth during the real restart-survival manual check above
(`smasher/examples/manual-workflow-run-shell-check.dot`): after the
in-flight run rehydrated as `Aborted` on restart, `/workflows/{id}` kept
showing that run's view but the Run form never came back — a workflow that
had ever been run became permanently un-runnable from its own page.

Root cause: `workflow_detail.html`'s `{% match active_run %}` only rendered
the Run form on the `None` arm (zero runs ever for this workflow). None of
Task 4's automated tests caught this because `insert_test_record_for_workflow`
hardcoded every fixture run's status to `Running`, so no test ever exercised
"active run exists but has finished."

Fix (commit `d00fdae`): extracted the form into `workflow_run_form.html`;
`workflow_detail.html` now renders it whenever `active_run` is `None` OR its
`status != "Running"`, keeping it hidden only while a run is genuinely still
in flight (including paused at a human gate, which stays `"Running"` until
answered). Added two tests — `workflow_detail_shows_run_form_again_once_active_run_is_terminal`
and `workflow_detail_hides_run_form_while_active_run_is_running` — plus a
new `insert_test_record_for_workflow_with_status` helper. `cargo test -p
smasher-web` (180 passed) and `cargo clippy -p smasher-web` both clean.
Verified live: killed `smasher serve` mid-run, restarted, confirmed the
rehydrated `Aborted` run's view AND the Run form both render, and that a
second run can actually be launched from the same page afterward.

## Post-sign-off follow-up: silent form errors, and Abort didn't actually cancel

Two more findings from the same manual QA pass, both fixed:

**Silent errors on the Run form** (commit `6051d2f`). `workflow_run_form.html`
uses `hx-swap="none"`, and htmx doesn't swap 4xx/5xx responses into a target
by default — so a rejected submission (e.g. malformed `node_overrides` JSON)
failed with zero visible feedback. Added a global `htmx:responseError`
listener in `base.html` that surfaces the JSON error body in a dismissible
toast, app-wide (not just this form).

**Abort appeared to work but didn't** (commit `e51841c`). Two stacked bugs:
1. Display bug: the Abort button's `hx-target="#run-status"` swapped
   `/api/runs/{id}/cancel`'s raw JSON response directly into the status
   badge. Predates this module (same bug on `/runs/{id}` today); fixed by
   having the button discard the response and fire a custom event the
   existing polling div already listens for.
2. Underneath it, a real bug the display bug had been masking: **cancelling
   a run paused at a human gate never actually cancelled it.**
   `Engine::run` only checks its cancellation token between node steps
   (`engine.rs:80`), so a node currently blocked — like `InterviewerHandler`
   awaiting a gate answer — is never interrupted. `InterviewerHandler`
   already had a dead-code match arm for `InterviewerError::Cancelled`, but
   nothing in `HttpInterviewer` ever produced it. `HttpInterviewer` now
   takes an optional `CancellationToken` (wired from the same token
   `EngineConfig` gets in `create_run`/`submit_pipeline`/`resume_run`) and
   races it against the pending answer via `tokio::select!`, also removing
   the now-orphaned question from the queue so a dashboard doesn't keep
   showing a gate card for a run that's no longer running.

Added 5 new `smasher-attractor` tests covering cancellation for
`ask`/`ask_with_options`/`approve`, queue cleanup, and the no-token
regression path. `cargo test --workspace` (1194 in `smasher-attractor`, up
from 1189) and `cargo clippy --workspace` both clean in every touched file.
Verified live end-to-end: launched a run, watched it pause at a real gallery
gate with 3 real candidates, hit `/api/runs/{id}/cancel`, and confirmed the
status genuinely flipped `Running` → `Aborted` (not just the endpoint's
optimistic JSON claim), a `pipeline_aborted` event was recorded, and the
orphaned question disappeared from `/runs/{id}/questions`.
