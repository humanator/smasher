# Implementation Plan: smasher-web-api

Module id: `smasher-web-api` · Spec: [SPEC-smasher-web-api.md](../SPEC-smasher-web-api.md) · Capability map: [CAPABILITY_MAP.md](../CAPABILITY_MAP.md)

## Overview

Rework `crates/smasher-web` so it exposes a documented JSON + SSE API (submit
pipeline, live events, list/status, human-gate answer, gallery-gate decision
and candidate listing) instead of server-rendered askama/HTMX HTML, and adds
static-file serving for the future `smasher-spa` build. `api.rs`,
`editor_api.rs`, `gallery.rs` are already JSON and mostly reusable as-is;
`pages.rs` (3,379 lines, 17 askama templates, HTMX JS) is the dashboard being
replaced. `editor-ui/` (the existing Svelte DOT-graph custom element) and its
JSON backend `editor_api.rs` are orthogonal to this rework and are left
untouched — they get re-hosted by `smasher-spa` in a later module, per
SPEC-smasher-spa.md ("Node-editor implementation carried over from the
current standalone project").

## Architecture Decisions

- **Route prefix:** keep the existing `/api/*` convention (already used by
  `api.rs`, `editor_api.rs`, `questions.rs`, `gallery.rs`) — resolves the
  spec's "Open Question" about prefix naming; no renaming needed.
- **SSE path:** keep `GET /api/runs/{id}/events` as the single event-stream
  endpoint; change its payload from hand-built HTML fragments to
  `serde_json`-serialized `PipelineEvent` data. One contract, one path — no
  content-negotiation dual-mode, per the capability map's explicit "full
  cutover... not kept behind a flag" decision.
- **Human-gate answers:** `POST /api/runs/{id}/questions/{qid}/answer` moves
  from `Form<AnswerQuestionRequest>` to `Json<AnswerQuestionRequest>`. Same
  reasoning — one wire format, hard cutover, not a dual extractor.
- **Static SPA serving:** disk-based (`ServeDir` over a configurable dist
  path, default `../../frontend/dist` relative to the crate, matching
  SPEC-smasher-web-api.md's `static_files.rs` sketch), not `rust-embed`. This
  resolves the spec's second Open Question in favor of its own
  recommendation ("disk-based now, revisit at `smasher-desktop` ship time").
  Built as an independently mountable router so it can be implemented and
  tested before anything is wired to `/`.
- **Dedup pipeline-launch logic first:** `api.rs::submit_pipeline`,
  `api.rs::resume_run`, and `pages.rs::create_run` currently duplicate
  ~300 lines of engine/registry/backend wiring each. Extracting this to one
  shared function is done *before* touching SSE/answer contracts so the
  riskiest, most-reused code path is de-risked early (fail fast) and both
  the JSON and (still-present) HTML callers keep working identically.
- **`pages.rs` deletion is a separate, gated final task**, not bundled into
  the JSON/SSE work. See Risks below — this is the one place this plan
  cannot fully close out the spec's own success criteria unilaterally.

## Known accepted regression (read before starting)

The spec's Boundaries say "Never... delete the askama templates before
`smasher-spa` has confirmed functional parity" and the capability map says
migration is "full cutover... not kept behind a flag." Those two things are
in tension for exactly two routes:

- The dashboard's live "watch it run" event feed (`run_detail.html` /
  `run_detail_body.html`, driven by `static/htmx-ext-sse.js` against
  `/api/runs/{id}/events`) is rendered from `sse.rs`'s HTML fragments today.
- The human-gate answer form (`question_card.html`, plain `hx-post`) posts
  form-urlencoded today.

Converting both endpoints to JSON-only (as this plan does, per the "no flag"
decision) means **these two dashboard interactions stop working the moment
this module ships**, before `smasher-spa` exists to replace them. Every
other dashboard page (workflow catalog, run list, polled status/graph/token
widgets, candidate gallery, decision history — all HTMX polling, not SSE)
keeps working unaffected. Simon is the sole local user, so the blast radius
is "no live event feed or human-gate response in the dashboard for the
window between this module shipping and `smasher-spa` shipping." Flagging
this explicitly rather than letting it happen silently — call it out if that
gap is unacceptable and a temporary bridge is wanted instead (see Open
Questions).

## Task List

### Phase 1: Foundation

- [x] Task 1: Deduplicate pipeline-launch logic

### Checkpoint: Foundation
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean
- [ ] Dashboard's submit-pipeline and resume flows still work identically (manual check via `cargo run --bin smasher -- serve`)

### Phase 2: JSON/SSE Contract Completion

- [x] Task 2: SSE events as JSON
- [ ] Task 3: Human-gate answer as JSON
- [ ] Task 4: Gallery candidate listing endpoint
- [ ] Task 5: API reference documentation

### Checkpoint: JSON/SSE Contract Complete
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean
- [ ] `curl`-drivable end-to-end: submit a pipeline from one of `examples/*.dot`, observe JSON SSE events, answer a human-gate question via JSON, see completion — all via `curl`/`httpie`, no browser
- [ ] Known regression from "Known accepted regression" section confirmed and acknowledged, not accidental

### Phase 3: Static SPA Serving

- [ ] Task 6: `routes/static_files.rs` — disk-based SPA static serving + fallback

### Checkpoint: Static Serving Ready
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean
- [ ] Serving module works against a temp-dir fixture in tests; not yet wired to `/` (dashboard still owns `/`)

### Phase 4: Integration Test Coverage

- [ ] Task 7: `tests/api_test.rs` — real-server happy path (submit → status → completion)
- [ ] Task 8: `tests/events_test.rs` — SSE ordering/payload assertions + human-gate round trip over real HTTP

### Checkpoint: Integration Coverage Complete
- [ ] `cargo test -p smasher-web` (including new `tests/` integration binaries) clean
- [ ] All three Testing Strategy bullets from the spec covered: happy path, human-gate round trip, static-serving fallback

### Phase 5: Final Cutover — BLOCKED on `smasher-spa`

- [ ] Task 9: Delete `pages.rs`, templates, HTMX static assets, `askama` dependency; wire static SPA serving onto `/`

### Checkpoint: Complete
- [ ] All SPEC-smasher-web-api.md Success Criteria checkboxes satisfied
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean
- [ ] Zero server-rendered HTML remains in the crate
- [ ] `smasher serve` still binds `127.0.0.1:21541`
- [ ] Human review before merge

---

## Task 1: Deduplicate pipeline-launch logic

**Description:** `api.rs::submit_pipeline`, `api.rs::resume_run`, and
`pages.rs::create_run` each independently build the engine, node registry,
and `AgentCodergenBackend`/`LlmManagerBackend`/`LlmToolBackend` wiring, then
spawn the run and register a `RunRecord`. Extract this into one shared
function (new `src/run_launch.rs`) taking the parsed graph, variables, and
resume-vs-fresh flag, returning the `RunRecord`/run id. Both `api.rs`'s JSON
handlers and `pages.rs`'s HTML handler call it. No behavior change for
either caller.

**Acceptance criteria:**
- [ ] `submit_pipeline`, `resume_run` (api.rs), and `create_run` (pages.rs) all delegate to the new shared function; no duplicated engine/backend-construction code remains across the three
- [ ] Existing inline unit tests for all three handlers still pass unmodified in behavior (assertions may move but expected responses are identical)

**Verification:**
- [ ] `cargo test -p smasher-web` passes
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual check: `cargo run --bin smasher -- serve`, submit a pipeline via the dashboard UI and via `POST /api/runs`, confirm both still launch correctly

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/run_launch.rs` (new)
- `crates/smasher-web/src/lib.rs` (register module)
- `crates/smasher-web/src/routes/api.rs`
- `crates/smasher-web/src/routes/pages.rs`

**Estimated scope:** Medium (4 files)

---

## Task 2: SSE events as JSON

**Description:** Replace `sse.rs`'s `render_event_html`/HTML-fragment path
with plain `serde_json::to_string(&event)`-style JSON payloads for
`GET /api/runs/{id}/events`. Keep `event_name()` (the SSE `event:` field
mapping) and the terminal-event/keep-alive logic unchanged — only the `data:`
payload's shape changes. Document the resulting event names + JSON shape for
all 17 `PipelineEvent` variants as part of Task 5.

**Acceptance criteria:**
- [ ] `/api/runs/{id}/events` emits `data:` payloads as JSON matching each `PipelineEvent` variant's fields (no HTML in the payload)
- [ ] SSE `event:` name per event type is unchanged (`node_started`, `pipeline_completed`, etc.)
- [ ] Stream still terminates correctly on `PipelineCompleted`/`PipelineAborted`/channel close; keep-alive behavior unchanged
- [ ] `render_event_html` and any now-unused HTML-building helpers in `sse.rs` are deleted, not left as dead code

**Verification:**
- [ ] `cargo test -p smasher-web` passes (existing `sse.rs` unit tests updated to assert JSON shape instead of HTML)
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual check: `curl -N http://127.0.0.1:21541/api/runs/{id}/events` against a real run from an `examples/*.dot` fixture, confirm JSON `data:` lines

**Dependencies:** Task 1 (uses the same run/emitter wiring; doing this after the dedup avoids touching two versions of the launch path)

**Files likely touched:**
- `crates/smasher-web/src/sse.rs`

**Estimated scope:** Small (1 file)

---

## Task 3: Human-gate answer as JSON

**Description:** Change `questions.rs::answer_question` from
`Form<AnswerQuestionRequest>` to `Json<AnswerQuestionRequest>`. `gallery.rs`'s
decision endpoint is already JSON and needs no change — this is the one
remaining form-encoded JSON-API route.

**Acceptance criteria:**
- [ ] `POST /api/runs/{id}/questions/{qid}/answer` accepts `application/json` body `{"answer": "..."}` and rejects/400s a form-encoded body
- [ ] Existing 404/400/422 error-path tests still pass with the new extractor

**Verification:**
- [ ] `cargo test -p smasher-web` passes (existing form-encoded regression test at `questions.rs` rewritten to post JSON)
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual check: `curl -X POST -H 'Content-Type: application/json' -d '{"answer":"yes"}' http://127.0.0.1:21541/api/runs/{id}/questions/{qid}/answer` against a real run paused on a human-gate node (use `examples/human_gate_showcase.dot`)

**Dependencies:** None (independent of Tasks 1–2)

**Files likely touched:**
- `crates/smasher-web/src/routes/questions.rs`

**Estimated scope:** Small (1 file)

---

## Task 4: Gallery candidate listing endpoint

**Description:** Add `GET /api/runs/{id}/candidates`, returning the same
data `pages.rs::run_candidates` currently assembles via
`candidates::scan_candidates()` + `candidates::read_scorecard()`, as JSON
instead of the `candidate_gallery.html` render. This is the one real gap in
JSON-API parity identified during research — not explicitly named in the
spec's Success Criteria bullet list but required for `smasher-spa` to build
a gallery-gate UI at all (see Open Questions — confirm this is in scope).

**Acceptance criteria:**
- [ ] `GET /api/runs/{id}/candidates` returns JSON array of candidate summaries + scorecards for a run with a gallery-gate node
- [ ] 404 for unknown run id, empty array (not error) for a run with no candidates yet

**Verification:**
- [ ] `cargo test -p smasher-web` passes (new unit tests for the handler, reusing `candidates.rs`'s existing pure functions untouched)
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual check: `curl http://127.0.0.1:21541/api/runs/{id}/candidates` against a run launched from `examples/gallery_gate_showcase.dot`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/routes/gallery.rs` (or `api.rs` — pick whichever module already owns run-scoped GET listing endpoints; `candidates.rs` has no route today)

**Estimated scope:** Small (1–2 files)

---

## Task 5: API reference documentation

**Description:** Update `docs/api-reference.md` to document the complete
JSON+SSE contract as it now stands: every route in `api.rs`, `questions.rs`,
`gallery.rs`, `editor_api.rs`, plus the new candidates endpoint (Task 4) and
the JSON SSE event schema (Task 2) — request/response shapes, status codes,
and the full list of SSE event names with their JSON payload shape. This is
the spec's "Always: keep the event/API schema stable and documented" boundary
and the contract `smasher-spa` will code against.

**Acceptance criteria:**
- [ ] Every route from the Task 1–4 work is documented with method, path, request body shape, response shape, and error cases
- [ ] All 17 `PipelineEvent` SSE variants documented with event name + JSON field shape
- [ ] Doc reflects only the current, final contract — no leftover references to HTML fragments or form-encoding

**Verification:**
- [ ] Manual check: every documented route cross-checked against its handler signature in source
- [ ] No `cargo` verification applicable (docs-only change); reviewed by human before merge

**Dependencies:** Tasks 2, 3, 4 (documents their output)

**Files likely touched:**
- `crates/smasher-web/docs/api-reference.md` (or repo-root `docs/api-reference.md` — confirm actual location before editing)

**Estimated scope:** Small (1 file)

---

## Task 6: `routes/static_files.rs` — disk-based SPA static serving + fallback

**Description:** New module serving a configurable SPA dist directory
(default `../../frontend/dist` relative to the crate, i.e. `smasher/frontend/dist`,
overridable via an env var e.g. `SMASHER_SPA_DIST`) with SPA-style fallback:
unmatched non-`/api/*` `GET` requests serve `index.html` instead of 404.
Built as a standalone `Router` returned by a constructor function so it can
be unit-tested against a temp-dir fixture without a real `smasher-spa` build
existing yet, and merged into `build_router()` at a non-conflicting mount
point for now (not yet `/` — that swap is Task 9's job, once `pages.rs` is
gone).

**Acceptance criteria:**
- [ ] Serving a request for `/some/unknown/path` returns the fixture's `index.html` content, not 404
- [ ] Serving a request for a real static asset in the fixture dir returns that file with correct content-type
- [ ] `/api/*` paths are never captured by the fallback (still routed to the real API routers)
- [ ] Missing dist directory (dev machine with no `smasher-spa` build yet) does not crash the server at startup — logs a warning and the mount simply 404s until the directory exists

**Verification:**
- [ ] `cargo test -p smasher-web` passes (new tests using `tower::ServiceExt::oneshot`, matching the existing static-mount test pattern in `server.rs`)
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual check: point `SMASHER_SPA_DIST` at a scratch directory with a hand-written `index.html`, confirm fallback behavior via `curl`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/routes/static_files.rs` (new)
- `crates/smasher-web/src/routes/mod.rs` (register module)
- `crates/smasher-web/src/server.rs` (mount at a non-`/` path for now)

**Estimated scope:** Medium (3 files)

---

## Task 7: `tests/api_test.rs` — real-server happy path

**Description:** New integration test file starting the real axum server
(via `build_router()`/`run_with_config`-equivalent test helper) on an
ephemeral port, driven by `reqwest` — no mocked HTTP layer. Cover: submit a
pipeline from `examples/consensus_task.dot` (or another simple, fast
fixture), poll `/api/runs/{id}` until completion, assert final status and
basic response shape.

**Acceptance criteria:**
- [ ] Test binds a real `TcpListener` on port 0, spawns the router, drives it with `reqwest`
- [ ] Full happy path asserted: submit → poll status → `Completed`
- [ ] Test is deterministic and doesn't depend on wall-clock timing beyond a bounded poll loop with timeout

**Verification:**
- [ ] `cargo test -p smasher-web --test api_test` passes
- [ ] `cargo clippy -p smasher-web` clean

**Dependencies:** Tasks 1, 2 (exercises the deduped launch path and the JSON SSE-adjacent status contract)

**Files likely touched:**
- `crates/smasher-web/tests/api_test.rs` (new)

**Estimated scope:** Small (1 file)

---

## Task 8: `tests/events_test.rs` — SSE ordering + human-gate round trip

**Description:** New integration test file, same real-server pattern as
Task 7. Assert SSE event ordering and JSON payload shape across a full run
using `examples/human_gate_showcase.dot`: connect to `/api/runs/{id}/events`,
collect events until the run pauses on a human-gate node, `POST` a JSON
answer to `/api/runs/{id}/questions/{qid}/answer`, confirm the run resumes
and completes, with the expected event sequence observed end-to-end.

**Acceptance criteria:**
- [ ] SSE client in the test asserts event name + JSON shape for at least `pipeline_started`, `node_started`/`node_completed` around the gate, `human_prompt_issued`, `human_response_received`, `pipeline_completed`
- [ ] Human-gate answer round trip (JSON POST) drives the paused run to completion within the test
- [ ] This is the human-gate + static-serving-fallback integration coverage the spec's Testing Strategy calls for (static-serving fallback covered by Task 6's own tests instead of duplicated here)

**Verification:**
- [ ] `cargo test -p smasher-web --test events_test` passes
- [ ] `cargo clippy -p smasher-web` clean

**Dependencies:** Tasks 2, 3 (JSON SSE contract, JSON answer endpoint)

**Files likely touched:**
- `crates/smasher-web/tests/events_test.rs` (new)

**Estimated scope:** Medium (1 file, non-trivial async orchestration)

---

## Task 9: Final cutover — BLOCKED on `smasher-spa` reaching parity

**Description:** Delete `pages.rs`, all 17 `templates/*.html`, `templates/`
itself, `static/htmx.min.js`, `static/htmx-ext-sse.js`, the `askama`
dependency from `Cargo.toml`, and the now-dead `poll_response`/`HtmlTemplate`
helpers. Remove the `page_routes` mount from `build_router()` and wire Task
6's static-SPA router onto `/` in its place. **Do not start this task until
`smasher-spa` has shipped and confirmed it covers dashboard-parity
end-to-end** — this is the spec's explicit Boundary and this plan cannot
close it out unilaterally; it's a cross-module gate, not a technical
blocker within this crate.

**Acceptance criteria:**
- [ ] `pages.rs`, `templates/`, HTMX static JS, and the `askama` crate dependency are gone
- [ ] `build_router()` serves the real `smasher-spa` build at `/` with SPA fallback
- [ ] `cargo tree -p smasher-web` shows no `askama` dependency

**Verification:**
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean
- [ ] `cargo run --bin smasher -- serve` on `127.0.0.1:21541` serves the real SPA at `/`
- [ ] All SPEC-smasher-web-api.md Success Criteria checkboxes now satisfied
- [ ] Human review + explicit go-ahead before starting (per the gate above)

**Dependencies:** Tasks 1–8, plus the external `smasher-spa` module confirming parity

**Files likely touched:**
- `crates/smasher-web/src/routes/pages.rs` (deleted)
- `crates/smasher-web/templates/` (deleted, 17 files)
- `crates/smasher-web/static/htmx.min.js`, `static/htmx-ext-sse.js` (deleted)
- `crates/smasher-web/Cargo.toml`
- `crates/smasher-web/src/server.rs`
- `crates/smasher-web/src/routes/mod.rs`

**Estimated scope:** Large (6+ files, but pure deletion + one mount swap — low logical complexity despite file count)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| SSE JSON cutover breaks the dashboard's live event feed before `smasher-spa` exists | Medium — Simon loses "watch it run live" in the browser during the gap | Explicitly called out in "Known accepted regression"; not silently absorbed. Confirm acceptable before Task 2. |
| Human-gate JSON cutover breaks the dashboard's answer form the same way | Medium — same gap, affects "answer human-gate prompts" | Same as above; confirm before Task 3. |
| `pages.rs`/`create_run` behavior drifts from `api.rs` during the (potentially long) gap before Task 9 | Low-Medium — duplicated logic could diverge if either is bugfixed alone | Task 1 removes the duplication up front, before any divergence risk accumulates |
| Task 9's timeline is unknown (depends on a separate module shipping) | Low for this crate, but leaves dead/broken dashboard code sitting in the tree indefinitely | Explicitly scoped as its own gated task rather than silently deferred; revisit if `smasher-spa` stalls |
| Candidate-listing endpoint (Task 4) is inferred scope, not in the spec's literal Success Criteria list | Low | Flagged in Open Questions; cheap to build now regardless since `candidates.rs`'s logic is already pure/reusable |

## Open Questions

- Is the "known accepted regression" (dashboard's live event feed + human-gate form breaking before `smasher-spa` ships) actually acceptable, or is a temporary bridge (e.g. keeping the HTML SSE path alive a little longer) wanted instead? This plan assumes the capability map's "full cutover, not behind a flag" language settles this in favor of accepting the gap — confirm before Task 2/3.
- Is `GET /api/runs/{id}/candidates` (Task 4) actually in scope for this module, or should candidate-listing wait for `smasher-spa` to define exactly what shape it needs?
- Confirm exact current location/existence of `docs/api-reference.md` content before Task 5 (file exists in the repo already — need to check whether it already documents the HTMX routes and needs rewriting vs. extending).
