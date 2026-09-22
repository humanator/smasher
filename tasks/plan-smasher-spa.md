# Implementation Plan: smasher-spa

Module id: `smasher-spa` · Spec: [SPEC-smasher-spa.md](../SPEC-smasher-spa.md) · Capability map: [CAPABILITY_MAP.md](../CAPABILITY_MAP.md)
Depends on: `smasher-web-api` (essentially complete — 8/9 tasks done, Task 9 gated on this module; see `tasks/plan.md`/`tasks/todo.md`)

## Context

`smasher-web-api` has reached parity as a JSON+SSE API (docs at
`crates/smasher-web/docs/api-reference.md`); the only thing left in that
module's plan is deleting the old askama/HTMX dashboard, which is explicitly
blocked until this module — `smasher-spa` — exists and covers the same
ground. This plan builds that replacement: a single Svelte 5 SPA at
`frontend/` that talks to `smasher-web-api` over `fetch`/SSE, runs unmodified
in a plain browser today and inside `smasher-desktop`'s webview later, and
carries over the existing standalone node-editor (`crates/smasher-web/editor-ui/`)
rather than rebuilding it from scratch.

Two decisions were confirmed with Jobsworth before finalizing task order:

1. **Node-editor graph library is an open question, not settled.** The
   existing editor is built on `@xyflow/svelte` + `@dagrejs/dagre`, both
   outside the spec's named ecosystem (Svelte/Tailwind/shadcn-svelte/Vitest/
   Playwright), and the spec itself says "ask first" before carrying either
   forward unchanged. Jobsworth asked to explore alternatives rather than
   default to keeping them — so a dedicated spike task sits early in the
   plan (Task 5) and gates the entire node-editor phase.
2. **The workflow catalog has no JSON API today.** Research found
   `pages.rs::workflow_catalog` builds the catalog page server-side from
   `workflows.rs::scan_workflows()` — there's no `GET /api/workflows`. This
   is technically a `smasher-web-api` change, but Jobsworth approved folding
   a small task for it into this plan (Task 6) rather than deferring the
   catalog page to a follow-up.

Per the global testing rule ("use real data and real APIs rather than
mocking"), all API-client and integration-level tests in this plan run
against a real, locally running `smasher-web-api` instance
(`cargo run -p smasher-web -- serve`), not mocked `fetch`/`EventSource`.
Playwright E2E does this by nature (spec requirement); Vitest tests for
`lib/api/` additionally need this real server up — noted per-task below.

## Architecture Decisions

- **Project scaffold first, spike second.** The graph-library spike (Task 5)
  needs a real Vite+Tailwind+shadcn-svelte project to prototype against, so
  it can't run before Task 1.
- **Foundation before the workflows-list endpoint.** Task 6 (backend
  endpoint) has no frontend dependency and could run anytime, but is placed
  right after Foundation so it's out of the way before the dashboard phase
  that needs it (Task 8).
- **Dashboard vertical slices ordered by the spec's own Success Criteria
  priority**: submit pipeline → live events → human-gate Q&A is Success
  Criterion #1, so it's built and E2E-verified (Checkpoint after Phase 3)
  before gallery-gate/decision-history (parity, but not in the critical-path
  criterion) and before the node editor (Success Criterion #2).
- **Node-editor port split into four tasks, not one**, because the source
  file (`WorkflowCanvasInner.svelte`, 617 lines) plus its siblings would
  otherwise be a single 8-file "Large" task. Splitting into data-layer →
  presentational components → orchestrator → routing keeps each task
  independently testable and under 5 files.
- **`lib/native/` shim is built twice**: a stub in Foundation (interface
  only, so nothing later depends on an unbuilt module) and real
  `window.__TAURI__` wiring at the end (Task 20), once every feature that
  might need a native fallback (file save/load, notifications) actually
  exists to wire up.

## Known gaps carried into this plan (read before starting)

- `docs/api-reference.md` doesn't document `editor_api.rs`'s two routes or
  the gallery-decision endpoint — they exist and work, just undocumented.
  Not blocking; worth a one-line fix note during Task 6 but not a separate
  task (small enough to fold into whichever task touches that route first).
- The node-editor's current API client (`editor-ui/src/api.ts`) has no
  runtime-configurable base URL — this is exactly the kind of thing the
  spec's "Never: hardcode the API base URL" boundary exists to catch, and
  Task 16 (data-layer port) must not carry that pattern forward unchanged.

## Task List

### Phase 1: Foundation

- [ ] Task 1: Scaffold `frontend/` project
- [ ] Task 2: `lib/api/` REST client
- [ ] Task 3: `lib/api/` SSE client
- [ ] Task 4: `lib/native/` shim stub

### Checkpoint: Foundation
- [ ] `npm run build`, `npm run lint`, `npm run test` all clean in `frontend/`
- [ ] `npm run dev` proxies `/api` and `/events` correctly to a locally running `smasher-web-api` (manual check)
- [ ] `lib/api/` unit tests pass against a real `cargo run -p smasher-web -- serve` instance, not mocked fetch

### Phase 2: Derisking (parallel-safe, both independent of each other)

- [ ] Task 5: Spike — node-editor graph library decision
- [ ] Task 6: `GET /api/workflows` endpoint (smasher-web-api)

### Checkpoint: Derisking Complete
- [ ] Graph-library decision recorded in writing before Task 17 starts
- [ ] `cargo test -p smasher-web` and `cargo clippy -p smasher-web` clean after Task 6
- [ ] `curl http://127.0.0.1:21541/api/workflows` returns real scanned workflows

### Phase 3: Dashboard core — submit → events → human-gate (spec Success Criterion #1)

- [ ] Task 7: `stores/` — run state, event log store
- [ ] Task 8: Workflow catalog page
- [ ] Task 9: Run submission form + run list page
- [ ] Task 10: Run detail page (status, tokens, abort, graph SVG)
- [ ] Task 11: Live event stream view (SSE)
- [ ] Task 12: Human-gate Q&A form

### Checkpoint: Dashboard Core Complete
- [ ] Vitest clean for all new stores/components
- [ ] Playwright critical path passes against a real local `smasher-web-api`: submit pipeline (`examples/human_gate_showcase.dot`) → see events stream in → answer a human gate → see completion
- [ ] This is literally the spec's stated E2E critical path — must be green before Phase 4

### Phase 4: Gallery-gate + decision history

- [ ] Task 13: Candidate gallery view
- [ ] Task 14: Gallery-gate decision UI
- [ ] Task 15: Decision history view

### Checkpoint: Gallery/Decision Complete
- [ ] Vitest clean
- [ ] Manual/E2E check against a real run from `examples/gallery_gate_showcase.dot`: candidates render, decision submits, history updates

### Phase 5: Node editor port — BLOCKED on Task 5's decision

- [ ] Task 16: Port node-editor data layer (types, nodeConfig, convert)
- [ ] Task 17: Port node-editor presentational components (Palette, WorkflowNode, WorkflowEdge, EdgeForm)
- [ ] Task 17b: Port node-editor per-kind form components (`nodeForms/`: CodergenForm, InterviewerForm, ManagerForm, StructuralForm, SubPipelineForm, ToolForm, `nodeForms.css`) — discovered mid-plan: `WorkflowCanvasInner.svelte` (Task 18) imports all six directly and none were assigned to any task; same "small gap, fold into the plan" precedent as Task 6b. Kept as its own task rather than merged into Task 17 since combined that would be ~21 files, well past the sizing guideline.
- [ ] Task 18: Port node-editor canvas orchestrator
- [ ] Task 19: Node-editor page routing (new/edit workflow)

### Checkpoint: Node Editor Complete
- [ ] Vitest clean, reusing/porting the existing 783-line `WorkflowCanvasInner` test suite's coverage
- [ ] Manual check: create a new pipeline visually, save, reload, edit an existing one — all round-trip through `/api/workflows/*`, no client-side DOT parsing as source of truth

### Phase 6: Native shim + final E2E

- [ ] Task 20: Wire `lib/native/` shim to real `window.__TAURI__` checks + browser fallbacks
- [ ] Task 21: Full Playwright E2E suite covering all spec Success Criteria

### Checkpoint: Complete
- [ ] All SPEC-smasher-spa.md Success Criteria boxes satisfied
- [ ] Vitest and Playwright suites green
- [ ] Runs correctly in a plain browser with zero Tauri-only code paths breaking
- [ ] Human review before this unblocks `smasher-web-api` Task 9 and `smasher-desktop` starts

---

## Task 1: Scaffold `frontend/` project

**Description:** Create `frontend/` at the repo root with Vite + Svelte 5 +
TypeScript (strict mode) + Tailwind CSS + shadcn-svelte initialized (a
handful of base primitives copied in — button, input, dialog — not the full
set; more get added as later tasks need them) + Vitest + Playwright configs.
Wire the `npm run dev` Vite proxy so `/api` and `/events` forward to
`http://127.0.0.1:21541` (matching `smasher-web-api`'s bind address). Set up
the directory structure from the spec's Project Structure section (empty
`lib/api/`, `lib/native/`, `components/ui/`, `components/node-editor/`,
`components/dashboard/`, `stores/`). Also add an `npm run dev:backend`
helper script that starts `cargo run -p smasher-web -- serve` pointed at a
known workflow directory — every later task's "real server" tests and
manual checks depend on one consistent entry point for this (see Risks).

**Acceptance criteria:**
- [ ] `npm install && npm run build` succeeds producing `frontend/dist/`
- [ ] `npm run dev` serves the app and proxies `/api/health` through to a locally running `smasher-web-api`
- [ ] `npm run lint`, `npm run test` (empty suite, but configured and passing), and `svelte-check` all run clean
- [ ] TypeScript strict mode confirmed on (`tsconfig.json` `"strict": true`)

**Verification:**
- [ ] `npm run build`, `npm run lint` succeed
- [ ] Manual: `npm run dev:backend` in one terminal, `npm run dev` in another, confirm the proxied `/api/health` returns the real `{"status":"ok"}`

**Dependencies:** None

**Files likely touched:**
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tailwind.config.ts`, `frontend/svelte.config.js` (new)
- `frontend/src/app.css`, `frontend/src/App.svelte` (new, placeholder)

**Estimated scope:** Medium (scaffold — many small config files, no real logic)

---

## Task 2: `lib/api/` REST client

**Description:** Typed fetch wrapper for every documented `smasher-web-api`
REST route: health, runs (submit/list/get/cancel/resume/tokens/graph SVG/
candidates), questions (list/answer), gallery decision, and `POST
/api/graph/nodes`. Base URL is runtime-configurable (read from an env/config
value, never hardcoded — closes the gap noted in the editor's current
`api.ts`). One module per resource area under `lib/api/` (e.g. `runs.ts`,
`questions.ts`, `gallery.ts`), re-exported from `lib/api/index.ts`.

**Acceptance criteria:**
- [ ] Every REST route from `docs/api-reference.md` (plus the undocumented `editor_api.rs`/gallery-decision routes found in research) has a typed client function
- [ ] Base URL comes from a single configurable source, not hardcoded per-call
- [ ] No component code exists yet to call these — this task is the client only

**Verification:**
- [ ] Vitest tests in `frontend/tests/lib/api/` call these functions against a real `npm run dev:backend` instance (per the "real data and real APIs" rule) — cover at least submit-run, get-run-status, list-runs
- [ ] `npm run lint` clean

**Dependencies:** Task 1

**Files likely touched:**
- `frontend/src/lib/api/runs.ts`, `questions.ts`, `gallery.ts`, `workflows.ts`, `index.ts` (new)
- `frontend/tests/lib/api/*.test.ts` (new)

**Estimated scope:** Medium (5 files)

---

## Task 3: `lib/api/` SSE client

**Description:** Typed `EventSource` wrapper for `GET /api/runs/{id}/events`
covering all 17 `PipelineEvent` variants (`pipeline_started`, `pipeline_completed`,
`pipeline_aborted`, `node_started`, `node_completed`, `node_failed`,
`edge_traversed`, `loop_restarted`, `context_updated`, `checkpoint_created`,
`human_prompt_issued`, `human_response_received`, `agent_turn_started`,
`agent_message`, `agent_tool_call_started`, `agent_tool_call_completed`,
`agent_token_usage`). Exposes a subscribe function returning typed events
plus stream-closed signaling on `pipeline_completed`/`pipeline_aborted`.

**Acceptance criteria:**
- [ ] All 17 event names are mapped to typed payload shapes matching the JSON documented for `smasher-web-api`'s SSE contract
- [ ] Stream cleanup (closing the `EventSource`) happens automatically on terminal events and on caller unsubscribe

**Verification:**
- [ ] Vitest test connects to a real run's event stream (submit `examples/consensus_task.dot` against `npm run dev:backend`) and asserts at least `pipeline_started` and `pipeline_completed` are received with correct shape
- [ ] `npm run lint` clean

**Dependencies:** Task 1 (independent of Task 2's REST client, but shares the base-URL config — small overlap, fine to build in either order; listed after Task 2 for read clarity only)

**Files likely touched:**
- `frontend/src/lib/api/events.ts` (new)
- `frontend/tests/lib/api/events.test.ts` (new)

**Estimated scope:** Small (2 files)

---

## Task 4: `lib/native/` shim stub

**Description:** Define the `lib/native/` interface (file dialog, save/load,
notification functions) with browser-only fallbacks for now (e.g. browser
`<a download>` for file save, `Notification` Web API where available) and a
`window.__TAURI__` presence check that's currently always false (no
`smasher-desktop` exists yet to provide it). This is the contract later
components code against; real Tauri wiring happens in Task 20.

**Acceptance criteria:**
- [ ] `isTauri()` (or equivalent) check exists and returns `false` in every current environment
- [ ] At least a `saveFile`/`loadFile` pair works via browser fallback (download/file-input) so later tasks (node editor) have something real to call, not a TODO stub

**Verification:**
- [ ] Vitest test confirms browser fallback behavior (e.g. triggers a download blob) in jsdom/happy-dom
- [ ] `npm run lint` clean

**Dependencies:** Task 1

**Files likely touched:**
- `frontend/src/lib/native/index.ts`, `files.ts` (new)
- `frontend/tests/lib/native/*.test.ts` (new)

**Estimated scope:** Small (2-3 files)

---

## Task 5: Spike — node-editor graph library decision

**Description:** Jobsworth asked to explore alternatives rather than
default to carrying `@xyflow/svelte` + `@dagrejs/dagre` forward unchanged.
Evaluate at minimum: (a) keep `@xyflow/svelte`+`dagre` as-is, (b) at least
one genuine alternative (candidates to check: `svelvet` for a Svelte-native
node-editor library, or a hand-rolled minimal SVG pan/zoom/connection layer
given the existing editor's actual feature surface is modest — drag nodes,
draw edges, no minimap/subflows/etc.). Score against: Svelte 5 rune
compatibility, bundle size, maintenance activity, feature fit for DOT
node-shape semantics (box/diamond/oval/house/parallelogram/hexagon/
component), and effort to reskin with Tailwind/shadcn-svelte (the current
editor has zero Tailwind, all inline styles). Record the decision and
rationale as a short section appended to this plan document (or a sibling
`docs/adr/node-editor-graph-library.md` if the project already has an ADR
convention — check before starting).

**Acceptance criteria:**
- [ ] At least two real options compared on the criteria above, not just asserted
- [ ] A clear decision is recorded in writing before Task 17 starts
- [ ] If the decision is "replace `@xyflow/svelte`", this task's output includes a rough effort estimate for Tasks 16-19 being revised (the current file/task breakdown assumes a port, not a rewrite)

**Verification:**
- [ ] No code changes in this task — it's a spike/research task; verification is the written decision existing and being reviewed by Jobsworth before Phase 5 starts

**Dependencies:** Task 1 (needs the real Tailwind/shadcn-svelte scaffold to prototype against, if prototyping either option)

**Files likely touched:**
- This plan document, or `frontend/docs/adr/node-editor-graph-library.md` (new)

**Estimated scope:** Small (research + decision, 0-1 files of throwaway prototype code)

---

## Task 6: `GET /api/workflows` endpoint (smasher-web-api)

**Description:** Add `GET /api/workflows` to `crates/smasher-web`, reusing
`workflows.rs::scan_workflows()` (already pure and tested), returning JSON
`{workflows: [{id, name, source_dir, ...}]}` matching whatever shape
`WorkflowSummary` already has. This is a small, self-contained addition to
the (otherwise done) `smasher-web-api` module, approved by Jobsworth to fold
into this plan rather than block the SPA's catalog page on a separate
planning cycle.

**Acceptance criteria:**
- [ ] `GET /api/workflows` returns the same set of workflows `pages.rs::workflow_catalog` currently shows, as JSON
- [ ] Route registered in `crates/smasher-web/src/routes/mod.rs` / `server.rs` alongside the other `/api/*` routes
- [ ] `docs/api-reference.md` updated to document this route (and, while touching that file, the two `editor_api.rs` routes and the gallery-decision route noted as undocumented — small drive-by fix, same file)

**Verification:**
- [ ] `cargo test -p smasher-web` passes (new unit test for the handler)
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Manual: `curl http://127.0.0.1:21541/api/workflows` against a real running server returns real scanned workflow data

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/routes/api.rs` or new `crates/smasher-web/src/routes/workflows_route.rs`
- `crates/smasher-web/src/routes/mod.rs`
- `crates/smasher-web/docs/api-reference.md`

**Estimated scope:** Small (2-3 files)

---

## Task 6b: Fix SSE early-event loss in `events_stream` (smasher-web-api)

**Description:** Discovered while verifying Task 3: `crates/smasher-web/src/routes/api.rs::events_stream`
subscribes directly to the run's live `tokio::broadcast` emitter with no
replay, so any event fired before a client's `GET /api/runs/{id}/events`
request connects is lost forever — confirmed independently with a raw `curl`
and a bare Node `fetch` script (no frontend/Vitest/jsdom involved), losing
`pipeline_started`/`human_prompt_issued` even with a ~22ms submit-to-connect
round trip. This is a real product bug (any dashboard client opening a run's
live view shortly after submission misses early events), not just a test
artifact. Jobsworth approved folding a fix into this plan, same precedent as
Task 6.

Fix: subscribe to the broadcast channel *before* reading the snapshot (the
existing `smasher-attractor` docs already say "subscribe before emitting so
the receiver sees events" — `events_stream` violates its own dependency's
documented pattern), then replay `record.event_log.events()` (already
populated by an existing background drain task — see `run_launch.rs`) to the
client first, then continue streaming the live `rx` on top. This accepts
"at least once" delivery (a rare duplicate of the last 0-1 events at the
snapshot/subscribe boundary is possible) rather than building sequence-number
based exactly-once dedup — duplicates are a minor, easily-absorbed UI
concern; silent loss is not. Do not build a dedup mechanism here; instead
leave a one-line note for Task 7 (event-log store) to dedupe defensively by
`(kind, timestamp)` when appending incoming events, since it's a natural,
cheap place for it.

**Acceptance criteria:**
- [ ] `events_stream` subscribes to the emitter before reading `event_log.events()`, replays the snapshot as SSE events, then continues with the live stream
- [ ] A client connecting shortly after a run starts reliably receives `pipeline_started` (verified by re-running Task 3's SSE tests, not just manually)
- [ ] No new sequence-number/dedup infrastructure added — duplicates at the boundary are an accepted, documented tradeoff

**Verification:**
- [ ] `cargo test -p smasher-web` passes
- [ ] `cargo clippy -p smasher-web` clean
- [ ] Re-run the raw Node `fetch`-based repro (submit `examples/human_gate_showcase.dot`, connect immediately, expect `pipeline_started` within the response) and confirm it now arrives
- [ ] Task 3's Vitest SSE tests (events.test.ts) pass against the real server, not skipped

**Dependencies:** None (independent of Task 6, both touch `smasher-web`'s routes but different handlers)

**Files likely touched:**
- `crates/smasher-web/src/routes/api.rs` (`events_stream`)

**Estimated scope:** Small (1 file)

---

## Task 7: `stores/` — run state, event log store

**Description:** Svelte 5 rune-based stores (`$state` in `.svelte.ts`
modules) for: current run status/metadata, the live event log (fed by
Task 3's SSE client), and pending human-gate questions. These are the
shared state layer every dashboard component in Phase 3-4 reads from —
built once here so components stay thin.

**Acceptance criteria:**
- [ ] A run store exposes status/metadata and updates reactively as the API/SSE report changes
- [ ] An event-log store accumulates SSE events in order, exposes a clear/reset
- [ ] Stores have no direct DOM/component dependencies (pure state + the `lib/api/` calls)

**Verification:**
- [ ] Vitest unit tests for store logic (real `lib/api/` calls against `npm run dev:backend` — no mocked fetch)
- [ ] `npm run lint` clean

**Dependencies:** Tasks 2, 3

**Files likely touched:**
- `frontend/src/stores/run.svelte.ts`, `events.svelte.ts`, `questions.svelte.ts` (new)
- `frontend/tests/stores/*.test.ts` (new)

**Estimated scope:** Medium (3-4 files)

---

## Task 8: Workflow catalog page

**Description:** `components/dashboard/WorkflowCatalog.svelte` — lists
workflows from Task 6's new endpoint, links to run-submission (Task 9) and,
later, the node editor (Task 19). Mirrors `workflow_catalog.html`'s
information (name, source dir) styled with Tailwind/shadcn-svelte instead
of askama's plain table.

**Acceptance criteria:**
- [ ] Renders the real list returned by `GET /api/workflows`
- [ ] Empty-state handled (no workflows configured) without erroring
- [ ] Links to submit-a-run for a given workflow

**Verification:**
- [ ] Vitest + `@testing-library/svelte` test against real API data (`npm run dev:backend` pointed at `examples/` as a workflow dir)
- [ ] `npm run lint` clean

**Dependencies:** Task 6, Task 2

**Files likely touched:**
- `frontend/src/components/dashboard/WorkflowCatalog.svelte` (new)
- `frontend/tests/components/dashboard/WorkflowCatalog.test.ts` (new)

**Estimated scope:** Small (2 files)

---

## Task 9: Run submission form + run list page

**Description:** `components/dashboard/RunForm.svelte` (submits a DOT
source + variables to `POST /api/runs`, mirroring `workflow_run_form.html`)
and `components/dashboard/RunList.svelte` (polls `GET /api/runs`, mirroring
`run_list.html`'s status-badge table). Wired to Task 7's run store.

**Acceptance criteria:**
- [ ] Submitting a real workflow (e.g. `examples/consensus_task.dot`) via the form starts a real run and navigates to its detail page
- [ ] Run list shows real run status, updates on poll interval matching the current dashboard's cadence (5s, per `run_detail_body.html`'s existing polling)

**Verification:**
- [ ] Vitest component tests against real API
- [ ] Manual: submit a run through the UI in a dev-server browser session, confirm it appears in the list with correct status
- [ ] `npm run lint` clean

**Dependencies:** Task 7

**Files likely touched:**
- `frontend/src/components/dashboard/RunForm.svelte`, `RunList.svelte` (new)
- `frontend/tests/components/dashboard/*.test.ts` (new)

**Estimated scope:** Medium (4 files)

---

## Task 10: Run detail page (status, tokens, abort, graph SVG)

**Description:** `components/dashboard/RunDetail.svelte` composing status
badge, token counter (poll `/api/runs/{id}/tokens`), abort button (`POST
/api/runs/{id}/cancel`), and the rendered graph SVG (`GET
/api/runs/{id}/graph`) — the non-SSE, non-question parts of
`run_detail_body.html`.

**Acceptance criteria:**
- [ ] All four widgets show real data for a real in-progress run
- [ ] Abort button actually cancels the run and UI reflects the new status
- [ ] Token counts update on poll

**Verification:**
- [ ] Vitest component tests against real API
- [ ] Manual: watch a real run's detail page update live in a browser (submit `examples/consensus_task.dot`, watch to completion)
- [ ] `npm run lint` clean

**Dependencies:** Task 7, Task 9 (renders inside the run flow Task 9 establishes)

**Files likely touched:**
- `frontend/src/components/dashboard/RunDetail.svelte`, `StatusBadge.svelte`, `TokenCounter.svelte` (new)
- `frontend/tests/components/dashboard/*.test.ts` (new)

**Estimated scope:** Medium (4-5 files)

---

## Task 11: Live event stream view (SSE)

**Description:** `components/dashboard/EventLog.svelte` — the telemetry
drawer equivalent from `run_detail_body.html`'s `hx-ext=sse` section, now
backed by Task 3's SSE client and Task 7's event-log store. Renders all 17
event types readably (not raw JSON dumps — at minimum a human-readable
one-liner per event type, matching the spirit of the old `event_item.html`).

**Acceptance criteria:**
- [ ] Connecting to a real run's event stream renders events live as they arrive, in order
- [ ] Stream visibly stops/shows completion state on `pipeline_completed`/`pipeline_aborted`
- [ ] All 17 event types have a distinct, readable rendering (not just a generic fallback)

**Verification:**
- [ ] Vitest test drives a real run (`examples/consensus_task.dot`) and asserts events appear in the log in order
- [ ] `npm run lint` clean

**Dependencies:** Task 7, Task 10 (mounts inside run detail)

**Files likely touched:**
- `frontend/src/components/dashboard/EventLog.svelte`, `EventItem.svelte` (new)
- `frontend/tests/components/dashboard/EventLog.test.ts` (new)

**Estimated scope:** Medium (3 files)

---

## Task 12: Human-gate Q&A form

**Description:** `components/dashboard/QuestionCard.svelte` — polls `GET
/api/runs/{id}/questions`, renders pending questions, submits answers via
`POST /api/runs/{id}/questions/{qid}/answer` (JSON body, per
`smasher-web-api`'s already-completed cutover). Mirrors
`question_card.html`'s per-question answer forms, minus the gallery-gate
slot (that's Task 14).

**Acceptance criteria:**
- [ ] A real run paused on a human-gate node (`examples/human_gate_showcase.dot`) shows its question in the UI
- [ ] Submitting an answer resumes the real run; UI reflects the resumed state
- [ ] Answered questions no longer show an open answer form (show the recorded response instead)

**Verification:**
- [ ] Vitest test drives a real paused run end-to-end through answer submission
- [ ] Manual: full browser check — submit `examples/human_gate_showcase.dot`, answer the gate in the UI, watch it complete
- [ ] `npm run lint` clean

**Dependencies:** Task 7, Task 10

**Files likely touched:**
- `frontend/src/components/dashboard/QuestionCard.svelte` (new)
- `frontend/tests/components/dashboard/QuestionCard.test.ts` (new)

**Estimated scope:** Small (2 files)

---

## Checkpoint: Dashboard Core Complete

Write and run the first Playwright E2E spec here
(`frontend/e2e/critical-path.spec.ts`): submit `examples/human_gate_showcase.dot`
→ observe events streaming in → answer the human gate → observe completion,
against a real `smasher-web-api` instance. This is the spec's stated
critical path and must be green before Phase 4 starts.

---

## Task 13: Candidate gallery view

**Description:** `components/dashboard/CandidateGallery.svelte` — full run
candidate grid via `GET /api/runs/{id}/candidates`, mirroring
`candidate_gallery.html`/`_candidate_card.html`'s live-embed cards
(screenshot/bundle preview, scorecard badges).

**Acceptance criteria:**
- [ ] Real candidates from a run using `examples/gallery_gate_showcase.dot` render with screenshot/bundle links and scorecard data
- [ ] Empty state (no candidates yet) handled without erroring

**Verification:**
- [ ] Vitest test against real API data from a real run
- [ ] `npm run lint` clean

**Dependencies:** Task 2, Task 7

**Files likely touched:**
- `frontend/src/components/dashboard/CandidateGallery.svelte`, `CandidateCard.svelte` (new)
- `frontend/tests/components/dashboard/CandidateGallery.test.ts` (new)

**Estimated scope:** Medium (3 files)

---

## Task 14: Gallery-gate decision UI

**Description:** `components/dashboard/GalleryGate.svelte` — checkbox
candidate selection, per-candidate comment boxes, decision submission via
`POST /api/runs/{id}/gallery/{qid}/decision`, mirroring `gallery_gate.html`.

**Acceptance criteria:**
- [ ] A real run paused on a gallery-gate node shows the candidate grid with selection UI
- [ ] Submitting a decision (selected candidates + edge + comments) resumes the real run
- [ ] Comment length cap (4000 chars, per the backend's existing validation) is surfaced in the UI, not just a silent 400

**Verification:**
- [ ] Vitest test drives a real gallery-gate run through decision submission
- [ ] Manual: full browser check using `examples/gallery_gate_showcase.dot`
- [ ] `npm run lint` clean

**Dependencies:** Task 13

**Files likely touched:**
- `frontend/src/components/dashboard/GalleryGate.svelte` (new)
- `frontend/tests/components/dashboard/GalleryGate.test.ts` (new)

**Estimated scope:** Medium (2 files, non-trivial form logic)

---

## Task 15: Decision history view

**Description:** `components/dashboard/DecisionHistory.svelte` — polled
list of past gate decisions (node, edge chosen, selected candidates,
comments, timestamp), mirroring `decision_history.html`.

**Acceptance criteria:**
- [ ] Real decision history for a completed gallery-gate run renders correctly
- [ ] Empty state (no decisions yet) handled without erroring

**Verification:**
- [ ] Vitest test against real API data
- [ ] `npm run lint` clean

**Dependencies:** Task 14

**Files likely touched:**
- `frontend/src/components/dashboard/DecisionHistory.svelte` (new)
- `frontend/tests/components/dashboard/DecisionHistory.test.ts` (new)

**Estimated scope:** Small (2 files)

---

## Task 16: Port node-editor data layer

**Description:** Port `editor-ui/src/types.ts`, `nodeConfig.ts`,
`convert.ts` into `frontend/src/components/node-editor/` (or a
`lib/node-editor/` logic module, kept separate from presentational
components), per Task 5's graph-library decision. If the decision was "keep
`@xyflow/svelte`+dagre," this is close to a straight copy with import-path
fixes. If the decision was "replace," this task's scope is redefined by
Task 5's effort estimate instead of the description here.

**Acceptance criteria:**
- [ ] All existing `types.test.ts`/`convert.test.ts`/`nodeConfig.test.ts` coverage (or equivalent, if the library changed) passes in the new location
- [ ] `lib/api/workflows.ts` (Task 2) is what this layer calls for graph load/save — not a re-implementation of `editor-ui/src/api.ts`'s hardcoded-path fetches

**Verification:**
- [ ] `npm run test` (ported test files) passes
- [ ] `npm run lint` clean

**Dependencies:** Task 5, Task 2

**Files likely touched:**
- `frontend/src/components/node-editor/types.ts`, `nodeConfig.ts`, `convert.ts` (ported)
- `frontend/tests/components/node-editor/*.test.ts` (ported)

**Estimated scope:** Medium (6 files including tests)

---

## Task 17: Port node-editor presentational components

**Description:** Port `Palette.svelte`, `WorkflowNode.svelte`,
`WorkflowEdge.svelte`, `EdgeForm.svelte` into `components/node-editor/`,
reskinning inline styles/scoped `<style>` blocks to Tailwind utility classes
and shadcn-svelte primitives where they fit (buttons, inputs, dialogs)
without changing behavior.

**Acceptance criteria:**
- [ ] Each component's existing test coverage passes after the port
- [ ] Visual styling uses Tailwind/shadcn-svelte, not copied inline styles
- [ ] DOT node-shape semantics (box/diamond/oval/house/parallelogram/hexagon/component) are preserved exactly, per the spec's "Always" boundary

**Verification:**
- [ ] `npm run test` passes
- [ ] `npm run lint` clean
- [ ] Manual: render the palette + a few node/edge types in isolation to visually confirm shape/styling

**Dependencies:** Task 16

**Files likely touched:**
- `frontend/src/components/node-editor/Palette.svelte`, `WorkflowNode.svelte`, `WorkflowEdge.svelte`, `EdgeForm.svelte` (ported)
- corresponding test files

**Estimated scope:** Large (8 files — flagged, but each individual component is a small, mechanical, already-tested port; not further splittable without breaking the "one working slice" rule)

---

## Task 17b: Port node-editor per-kind form components

**Description:** Port `editor-ui/src/nodeForms/{CodergenForm,InterviewerForm,ManagerForm,StructuralForm,SubPipelineForm,ToolForm}.svelte` and their tests, plus `nodeForms.css`, into `components/node-editor/nodeForms/`. These are the per-node-kind side-panel editing forms `WorkflowCanvasInner.svelte` (Task 18) selects between via `selectedNode.node_type` — Task 18 cannot compile without them. Same reskin treatment as Task 17 (Tailwind utility classes for static styling; `nodeForms.css`'s shared `.node-form`/`.node-form-field`/`.node-form-error` classes reused as-is by EdgeForm.svelte already ported in Task 17, so keep that contract intact rather than diverging per-component).

**Acceptance criteria:**
- [ ] Each component's existing test coverage passes after the port
- [ ] Visual styling uses Tailwind utility classes for static/structural CSS; `nodeForms.css`'s shared classes stay a shared stylesheet (already load-bearing for EdgeForm.svelte from Task 17) rather than being fragmented per-component
- [ ] Node-kind attr semantics (CodergenForm's `prompt`, ToolForm's `tool`, ManagerForm's `task`, InterviewerForm's `question`/gallery toggle, SubPipelineForm, StructuralForm) preserved exactly — these round-trip through `graph/mod.rs`'s resolver server-side, so a silent field/attr-key rename breaks save

**Verification:**
- [ ] `npm run test` passes
- [ ] `npm run lint` clean
- [ ] `npm run check` (svelte-check) introduces no new errors beyond the 5 pre-existing ones already on this branch (see Task 16's commit)

**Dependencies:** Task 16 (types.ts's `NodeFormProps`/`NodeFormChange`), Task 17 (shares `nodeForms.css` with EdgeForm.svelte)

**Files likely touched:**
- `frontend/src/components/node-editor/nodeForms/*.svelte` (6 ported), `nodeForms.css` (ported)
- corresponding test files

**Estimated scope:** Large (13 files — same "mechanical, already-tested port, not further splittable" reasoning as Task 17)

---

## Task 18: Port node-editor canvas orchestrator

**Description:** Port `WorkflowCanvasInner.svelte` (617 lines, the bulk of
the editor's state/logic) into a normal top-level Svelte component (not a
custom element — drop `<svelte:options customElement>`, `$host()`, and
CustomEvent dispatch plumbing from the old `WorkflowCanvas.svelte` shell;
this component becomes a regular child of the page component built in
Task 19).

**Acceptance criteria:**
- [ ] The 783-line existing test suite's coverage (selection, save/create modes, palette drag, inspectors, delete, connected-state styling) passes against the ported component
- [ ] No custom-element/shadow-DOM-specific code remains
- [ ] Save/create flow calls Task 2's `lib/api/workflows.ts`, not a re-implemented fetch call

**Verification:**
- [ ] `npm run test` passes (ported suite)
- [ ] `npm run lint` clean

**Dependencies:** Task 17, Task 17b

**Files likely touched:**
- `frontend/src/components/node-editor/WorkflowCanvas.svelte` (ported, renamed from `...Inner`)
- `frontend/tests/components/node-editor/WorkflowCanvas.test.ts` (ported)

**Estimated scope:** Medium (2 files, but high logical density — budget real time here)

---

## Task 19: Node-editor page routing

**Description:** `components/dashboard/` (or top-level route) pages for
"new workflow" and "edit workflow" that mount Task 18's canvas component,
wired to `POST /api/workflows/new` and `GET`/`PUT /api/workflows/{id}/graph`
via Task 2's client. Linked from Task 8's catalog page.

**Acceptance criteria:**
- [ ] Creating a new pipeline visually and saving it produces a real `.dot` file via the real API (round-trips through DOT render→parse→resolve server-side, not trusted client-side, per spec boundary)
- [ ] Editing an existing workflow (e.g. one of the `examples/*.dot` files, if configured as a workflow dir) loads its real graph and re-saves correctly

**Verification:**
- [ ] Vitest test against real API
- [ ] Manual: full browser check — create new pipeline, save, reload page, confirm it persisted; edit an existing one
- [ ] `npm run lint` clean

**Dependencies:** Task 18, Task 8

**Files likely touched:**
- `frontend/src/components/dashboard/WorkflowEditorPage.svelte`, `NewWorkflowPage.svelte` (new)
- `frontend/tests/components/dashboard/*.test.ts` (new)

**Estimated scope:** Medium (3 files)

---

## Task 20: Wire `lib/native/` shim to real Tauri checks

**Description:** Extend Task 4's stub with real `window.__TAURI__`
detection and (where `smasher-desktop` doesn't exist yet to test against)
at least a correct interface shape ready for that module to fill in real
Tauri command calls later. Wire it into the node editor's save/load flow
(Task 19) and run-completion notifications (Task 11) as the concrete
call-sites the spec's boundary requires ("implement OS-native features via
the `lib/native/` shim so the same components run in-browser").

**Scope decision (confirmed with Jobsworth before implementing):** "node-editor save/load flow" in this task's description originally suggested routing the editor's save/load through `lib/native/`'s `saveFile`/`loadFile` (local file-dialog download/import of raw `.dot` text) — but the editor's real save/load already goes through the REST API (Task 19), and no backend endpoint exists to export a workflow's raw `.dot` text for a local download; adding one would be new scope beyond this task's "Small (3-4 files)" budget and beyond anything else in this plan. Decided: skip the file-dialog wiring entirely — the REST-API flow already is the correct abstraction (a future `smasher-desktop` would still go through the same HTTP API, not local Tauri fs calls, since server-side DOT validation is a hard boundary). This task is scoped down to just the unambiguous half: wire `showNotification()` to pipeline-completion SSE events.

**Acceptance criteria:**
- [ ] `isTauri()` correctly detects absence of `window.__TAURI__` (still `false` — `smasher-desktop` doesn't exist yet) and the code path is structured so a future `smasher-desktop` only needs to provide the global, not change any SPA code
- [ ] Pipeline-completion (and abort) notifications call through the shim's `showNotification`, not directly through the browser `Notification` API

**Verification:**
- [ ] Vitest tests for shim call-sites
- [ ] `npm run lint` clean
- [ ] Manual: confirm browser fallback behavior unchanged from Task 4/11/19's existing manual checks

**Dependencies:** Task 4, Task 11, Task 19

**Files likely touched:**
- `frontend/src/lib/native/index.ts` (extended)
- call-sites in `EventLog.svelte`/notification logic, `WorkflowEditorPage.svelte`

**Estimated scope:** Small (3-4 files)

---

## Task 21: Full Playwright E2E suite

**Description:** Beyond Phase 3's critical-path spec, add Playwright
coverage for: gallery-gate flow (`examples/gallery_gate_showcase.dot`),
node-editor create/save/edit round trip, and a confirmation pass that
nothing in the app references `window.__TAURI__`-only behavior when it's
absent (Success Criterion #3 — zero Tauri-only code paths breaking in a
plain browser).

**Acceptance criteria:**
- [ ] All 4 spec Success Criteria have direct or indirect Playwright/Vitest coverage
- [ ] Suite runs against a real local `smasher-web-api` instance, no mocking
- [ ] Suite is documented as runnable via `npm run test:e2e` per the spec's Commands section

**Verification:**
- [ ] `npm run test:e2e` green, run twice to confirm no flakiness from polling/SSE timing
- [ ] `npm run test`, `npm run lint`, `npm run build` all clean as a final full-suite pass

**Dependencies:** Tasks 1-20 (final integration task)

**Files likely touched:**
- `frontend/e2e/gallery-gate.spec.ts`, `node-editor.spec.ts`, `no-tauri-breakage.spec.ts` (new)

**Estimated scope:** Medium (3-4 files)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Task 5's spike concludes "replace the graph library" | High — Tasks 16-19's file/effort estimates assume a port, not a rewrite | Task 5 explicitly requires a revised effort estimate as part of its output if this happens; Phase 5 isn't started until that's in hand |
| Vitest tests requiring a real running `smasher-web-api` instance are slow/flaky in CI or add friction locally | Medium | `npm run dev:backend` (Task 1) gives every later task's "real server" tests one consistent entry point |
| `GET /api/workflows` (Task 6) response shape doesn't match what the SPA's catalog page (Task 8) actually needs once built | Low | Task 6 is deliberately sequenced right before the dashboard phase, not far ahead of it, minimizing drift window |
| Polling-heavy pages (run list, tokens, candidates) built to match the old dashboard's exact poll intervals may feel dated compared to what SSE could offer | Low | Out of scope for parity — spec asks for parity with the HTMX dashboard's behavior, not a redesign of its update strategy; flag as a future enhancement, not a blocker |
| Task 17 (8 files) is oversized per the sizing guideline | Low-Medium | Explicitly justified in the task itself — it's a mechanical, already-tested port of four small sibling components that don't have independent value shipped separately; splitting further would create partially-working intermediate states |

## Task 5 Decision: Node-Editor Graph Library

**Decision: Keep @xyflow/svelte + @dagrejs/dagre. No replacement needed.**

**Rationale:**

Evaluated three options against the criteria (Svelte 5 rune compatibility, bundle size, maintenance activity, DOT node-shape fit, Tailwind reskinning effort):

1. **@xyflow/svelte + @dagrejs/dagre (current)** — Keep as-is
   - Bundle impact: 332KB (xyflow) + 40KB (dagre) = 372KB unpacked
   - Svelte 5 compatibility: ✓ Already working (v1.6.6 uses Svelte 5 runes seamlessly)
   - Maintenance: ✓ Actively maintained (xyflow org releases regularly)
   - DOT node-shape fit: ✓ Excellent — handles custom shapes via node styling perfectly
   - Tailwind reskinning: Medium effort — current editor has zero Tailwind (inline `<style>` blocks), porting requires CSS utility conversion, but no breaking API changes
   - Risk: Low — code is already proven, test coverage established (783-line test suite)
   - Porting cost: ~3 tasks (Tasks 16-18) as currently planned, ~2-3 weeks

2. **svelvet (Svelte-native alternative)** — Rejected
   - Bundle impact: 393KB unpacked (actually *larger* than xyflow, defeats the goal)
   - Svelte 5 compatibility: ✓ Claims Svelte 5 support, but ecosystem is newer/smaller
   - Maintenance: ? — Active but semver major version at 11.0.5 suggests frequent breaking changes (risk indicator)
   - DOT node-shape fit: ✗ No clear documentation on arbitrary shape rendering (e.g., diamonds, hexagons for DOT semantics)
   - Tailwind reskinning: Unknown integration story, fewer examples in ecosystem
   - Risk: Medium — would require relearning API, testing shape semantics from scratch
   - Porting cost: Unknown, likely 3-4 weeks if shapes don't map cleanly

3. **Hand-rolled SVG + pan/zoom library** — Rejected
   - Bundle impact: Minimal (~30KB for pan-zoom lib only)
   - Svelte 5 compatibility: ✓ Full control, trivial Svelte 5 integration
   - Maintenance: Self-maintained (high long-term cost)
   - DOT node-shape fit: ✓ Full control, can render any shape
   - Tailwind reskinning: ✓ Pure Tailwind, no library styles to fight
   - Risk: High — must implement: edge path rendering, connection handles, interaction handlers, selection state
   - Porting cost: 4-6 weeks of new implementation (not a port), includes edge drawing algorithms, no existing test suite to reuse

**Verdict:** Keep @xyflow/svelte. It's already working, battle-tested, actively maintained, and the perceived "non-Svelte" origin is a non-issue since it's already Svelte 5-compatible and the porting effort is identical either way (reskinning existing components). Svelvet is interesting but unproven for DOT shape semantics; hand-rolled is overkill for the modest feature surface (drag, draw, select). The "ask first" instruction was satisfied by evaluating alternatives; keeping the existing choice is the right call.

**Impact on Task Breakdown:** No change. Tasks 16-19 proceed as planned (port with Tailwind reskinning, not a full rewrite).

---

## Open Questions

- Should `examples/*.dot` be configured as a live workflow directory for `smasher-web-api` during SPA development/testing, or does a separate fixtures directory need to be set up? Affects Task 1's `dev:backend` helper script and every manual/E2E verification step above.
- Node-editor page routing (Task 19) assumes simple page components, not a full client-side router — confirm no router library (e.g. `svelte-spa-router`) is expected/needed before Task 19 starts, since that would also be a new dependency outside the named ecosystem.
