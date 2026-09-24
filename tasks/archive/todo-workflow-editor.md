# Task List: `workflow-editor` (Module 3)

Full context in `tasks/plan-workflow-editor.md`. Spec:
`design-factory/SPEC-workflow-editor.md`. Conventions: `smasher/CLAUDE.md` —
all files start with two `ABOUTME:` comment lines, tests inline
(`#[cfg(test)] mod tests`), TDD (test first), real fixtures over mocking —
extended to the new frontend stack (Vitest + Testing Library, test first
there too).

---

## Task 1: Fix Tool/SubPipeline shape-mapping bug

**Description:** `style_for_node_type()` (`rendering.rs:90-159`) currently
renders `NodeType::Tool` as `shape: "hexagon"`, which `node_type_from_shape()`
(`graph/mod.rs:198-211`) parses back as `Interviewer` — a round-trip
corruption. `NodeType::SubPipeline` renders as `shape: "component"`, which
parses back as `Parallel`, and has no shape of its own in the parse table at
all (confirmed by the existing `no_shape_maps_to_sub_pipeline` test,
mod.rs:1030) — no hand-authored `.dot` file can produce a `SubPipeline` node
today. Confirmed via `git diff origin/main` this is unfixed upstream, a
leftover from `ae4f5c2` which corrected the parse direction for
`component`/`parallelogram`/`tripleoctagon` but never updated the render
direction or gave SubPipeline a shape.

Fix: change `style_for_node_type(&NodeType::Tool)`'s `shape` field to
`"parallelogram"` (Tool's existing canonical parse-shape — zero change to
`node_type_from_shape`). Add a new arm to `node_type_from_shape`'s match:
`"folder" => NodeType::SubPipeline` (a Graphviz-valid polygon shape not
claimed by any other kind in this table), and change
`style_for_node_type(&NodeType::SubPipeline)`'s `shape` field to `"folder"`
to match.

**Acceptance criteria:**
- [x] `node_type_from_shape("parallelogram") == NodeType::Tool` (already true,
      regression-guard test if none exists) — covered by pre-existing
      `parallelogram_shape_maps_to_tool`
- [x] `style_for_node_type(&NodeType::Tool).shape == "parallelogram"` (update
      the existing `style_for_tool_node` test's expected value)
- [x] `node_type_from_shape("folder") == NodeType::SubPipeline` (new test:
      `folder_shape_maps_to_sub_pipeline`)
- [x] `style_for_node_type(&NodeType::SubPipeline).shape == "folder"` (update
      the existing `style_for_sub_pipeline_node` test's expected value)
- [x] New round-trip-style test: for every `NodeType` variant, calling
      `node_type_from_shape(style_for_node_type(nt).shape) == nt` holds —
      added `every_node_type_shape_round_trips` in `rendering.rs`.
      `Generic` is excluded with an inline comment: it's the parse-side
      catch-all for unrecognized shapes (nothing maps to it) and
      deliberately shares Codergen's `"box"` render shape — a pre-existing
      collision outside Task 1's scope, not a round-trip bug introduced
      here.
- [x] No other shape's mapping changes (`circle`/`point`/`Mdiamond`/
      `doublecircle`/`Msquare`/`box`/`rectangle`/`diamond`/`hexagon`/`oval`/
      `ellipse`/`tripleoctagon`/`house` all unchanged)

**Verification:**
- [x] Tests pass: `cargo test -p smasher-attractor graph`, `cargo test -p
      smasher-attractor rendering` — also ran full `cargo test --workspace`
      (1196+ tests, 0 failed)
- [x] Build succeeds: `cargo check -p smasher-attractor`
- [x] `cargo clippy -p smasher-attractor` — 0 new warnings (5 pre-existing
      `sort_by` warnings in unrelated files, untouched)
- [x] Manual check: none needed — pure lookup-table fix, covered by unit
      tests

**Done.** Commit: `3921100` on `feat/workflow-catalog`.

**Dependencies:** None

**Files likely touched:**
- `smasher/crates/smasher-attractor/src/graph/mod.rs`
- `smasher/crates/smasher-attractor/src/rendering.rs`

**Estimated scope:** Small (two lookup-table entries + test updates)

---

## Task 2: Full-attribute round-trip fix

**Description:** `render_to_dot()` (rendering.rs:210-239) and
`render_node()` (rendering.rs:170-182) currently emit only `id`, `label`, and
the 4 derived-from-`NodeType` style values — every other entry in
`node.attrs` (`prompt`, `model`, `tool`, `args`, `task`, `config`, `question`,
`pipeline`, `pos`, ...) is silently dropped. `render_edge()`
(rendering.rs:185-204) drops `condition`/`priority`/`loop_restart`/
`edge.attrs` entirely. Fix both, in a way that also feeds
`render_to_dot_with_status()` (rendering.rs:401-437) — a fully separate
writer sharing only `render_edge()` today — so the two don't diverge the way
the shape tables already did (Task 1).

Add `fn format_attr_value(v: &NodeAttrValue) -> String` (String → quoted +
escaped, reusing/extending `dot_escape`'s escaping logic; `Number(f64)` →
bare numeric literal; `Duration` → `"{secs}s"` matching `DotValue`'s existing
`Display` impl; `Bool` → bare `true`/`false`). Add `fn write_extra_attrs(out:
&mut String, attrs: &HashMap<String, NodeAttrValue>, skip: &[&str])` that
iterates `attrs`, skips any key in `skip`, and appends `, {key}={value}` for
the rest (stable iteration order isn't required for correctness, but sort
keys for deterministic/diffable output). Call it from both `render_node` and
`render_node_with_status` with `skip = ["shape", "style", "fillcolor",
"fontcolor"]` (the 4 keys `style_for_node_type`/`style_for_execution_status`
already re-derive and emit — must not double-emit). Call it from
`render_edge` (shared by both writers already) with `skip = ["label"]`, and
have `render_edge` additionally emit `condition`/`priority`/`loop_restart`
themselves when present (today it emits neither), each via
`write_extra_attrs`'s same formatter for consistency, then the remaining
generic `edge.attrs` with `skip = ["label", "condition", "priority",
"loop_restart"]`.

Add `#[derive(PartialEq)]` to `Graph`, `GraphNode`, `GraphEdge` (currently
`#[derive(Debug, Clone)]` only) — every field type already supports it.

**Acceptance criteria:**
- [x] Structural round-trip test: build (or extend) a fixture `.dot` file
      covering every `NodeType` with a representative attr set per the
      contracts in `plan-workflow-editor.md`'s grounding section
      (`prompt`+`model` on Codergen, `question`+`gallery` on an Interviewer,
      `tool`+`args` on Tool, `task`+`config` on Manager, `pipeline` on
      SubPipeline, `condition`+`priority`+`loop_restart` on an edge) — parse
      → resolve → `render_to_dot` → re-parse → resolve → `assert_eq!` the two
      `Graph`s. **Deviation:** the equality check (`assert_round_trips`
      helper) excludes `default_node_attrs`/`default_edge_attrs` and treats
      `graph_attrs` as "original entries survive" rather than exact-map
      equality — see the two follow-on discoveries below.
- [x] A `.dot` with `pos="120,80"` on a node round-trips that exact value
      unchanged through the same parse/render/re-parse/resolve cycle
- [x] A `.dot` with no `pos` on any node parses and renders without error (no
      position present is not an error condition)
- [x] An edge's `condition`/`priority`/`loop_restart` all round-trip through
      `render_to_dot` (new coverage — today none of the three survive a
      render)
- [x] A node's generic `attrs` entry that happens to be a `Number` or `Bool`
      (not just `String`) round-trips correctly (proves `format_attr_value`
      handles all 4 `NodeAttrValue` variants, not just strings)
- [x] `render_to_dot`'s output never contains a derived key
      (`shape`/`style`/`fillcolor`/`fontcolor`) twice for the same node
- [x] `render_to_dot_with_status` also round-trips a node's generic attrs
      correctly (proves the shared-helper refactor actually reached both
      writers, not just `render_to_dot`)
- [x] `Graph`/`GraphNode`/`GraphEdge` support `assert_eq!` directly (the
      `PartialEq` derive compiles and is exercised by the round-trip test
      above)

**Two discoveries made building the round-trip test, both fixed as part of
this task (confirmed with Jobsworth before the first):**
1. **`render_to_dot` was silently discarding `graph.graph_attrs`,
   `default_node_attrs`, `default_edge_attrs` on every render** — always
   overwriting them with its own hardcoded `rankdir`/`bgcolor`/`node
   [...]`/`edge [...]` preamble regardless of the source graph. Real
   fixtures (`examples/ask_and_execute.dot`) set graph-level `goal=`/
   `default_max_retry=`, read by the pipeline engine — meaning every save
   through the new editor would have silently deleted them. **Fixed**:
   added `render_graph_preamble()`, shared by both writers, that defers to
   `graph.graph_attrs`'s own `rankdir`/`bgcolor` when present and re-emits
   every other `graph_attrs` entry verbatim. **Left out of scope**, per
   explicit confirmation: `default_node_attrs`/`default_edge_attrs`
   round-tripping — no cited fixture relies on them and there's no evidence
   of the same data-loss risk; `render_to_dot` still always emits its own
   `node [fontname=... fontsize=...]`/`edge [...]` defaults.
2. **`resolve()`'s node-attr filter only excluded `shape`/`label` from a
   node's generic `attrs` map, not `style`/`fillcolor`/`fontcolor`** — so
   once `render_node` started emitting those three explicitly (unchanged
   behavior, just newly visible once nodes round-tripped), they leaked into
   `attrs` on re-parse, permanently polluting every node with its own
   type-derived styling as fake "data". Fixed by extending the exclusion
   list to the same 4-key `DERIVED` set the spec's writer-side skip-list
   already names (`SPEC-workflow-editor.md`'s `DERIVED` constant) —
   `graph/mod.rs`'s new `NODE_DERIVED_ATTRS` const, shared by both the
   filter and (indirectly, by construction) the writer's skip-list.

**Verification:**
- [x] Tests pass: `cargo test -p smasher-attractor graph`, `cargo test -p
      smasher-attractor rendering` — also ran full `cargo test --workspace`
      (1204+ / 2500+ tests across the workspace, 0 failed)
- [x] Build succeeds: `cargo check -p smasher-attractor` (and
      `--workspace`)
- [x] `cargo clippy -p smasher-attractor` — 0 new warnings in touched files
- [x] Manual check: confirmed via a hand-cross-checked DOT sample matching
      `render_node_with_status`'s exact output shape (field order, sorted
      extra attrs) rendered successfully through real Graphviz 16.1.0
      (`dot -Tsvg`, available in this environment) — see Checkpoint A

**Dependencies:** Task 1 (round-trip test needs correct Tool/SubPipeline
shapes to pass for those two kinds)

**Files likely touched:**
- `smasher/crates/smasher-attractor/src/rendering.rs`
- `smasher/crates/smasher-attractor/src/graph/mod.rs`

**Estimated scope:** Medium/Large (new formatter + shared helper touching two
writers, plus the fixture-driven round-trip test suite that is this task's
actual proof of correctness)

### Checkpoint A

- [x] `cargo test -p smasher-attractor` green
- [x] `cargo clippy -p smasher-attractor` clean
- [x] Manually confirm (or reason from code, if no live-run credentials are
      available in this environment) that `run_detail.html`'s existing
      Graphviz-SVG live-run view still renders correctly for a real pipeline
      run — this is the regression check that the shared-writer refactor
      didn't break the status-overlay path. No live-run credentials in this
      environment; confirmed instead by feeding `render_node_with_status`'s
      exact output shape (cross-checked field-for-field against the
      function, including the new extra-attrs tail and a `goal=` graph
      attr) through real Graphviz 16.1.0 (`dot -Tsvg`) — rendered a valid
      SVG with no errors.

**Done.** Commit: `d09a3e5` on `feat/workflow-catalog`.

---

## Task 3: JSON graph API

**Description:** New `crates/smasher-web/src/routes/editor_api.rs` with
three handlers, mirroring `routes/api.rs`'s `list_graph_nodes`
(`api.rs:141-158`) pattern exactly — **not** `create_workflow`'s
parse-only pattern:

- `GET /api/workflows/{id}/graph`: resolve via
  `crate::workflows::resolve_workflow(&state.workflow_dirs, &id)` (404 via
  `WebError::NotFound` if unresolved), read the file fresh with
  `std::fs::read_to_string`, `parser::parse` + `graph::resolve`
  (`?`-propagated via `WebError`'s existing `Parse`/`Graph` `#[from]`
  variants — no new error handling needed), return `Json<EditorGraph>`.
- `PUT /api/workflows/{id}/graph`: same resolve-workflow-or-404, accept
  `Json<EditorGraph>`, convert to a DOT source string via `render_to_dot`
  (Task 2's fixed writer), **validate by parsing + resolving that generated
  source before writing** — if either step fails, return the error, leave
  the on-disk file untouched — then `std::fs::write` and return the same
  `Json<EditorGraph>` (or a minimal success marker) back.
- `POST /api/workflows/new`: accept `Json<EditorGraph>` plus a target
  filename/directory (small local request struct, following
  `create_workflow`'s validation: blank-name check, `candidates::valid_id`
  traversal check, `target_dir` must be in `state.workflow_dirs`), render to
  DOT, validate parse+resolve before writing (same as PUT), write the new
  `.dot` file, compute its id via `workflows::root_name_for`/`slug_for`
  (`pub(crate)`, same access `create_workflow` already has), return the new
  id.

`EditorGraph`/`EditorNode`/`EditorEdge` are thin `serde` wrappers around
`Graph`/`GraphNode`/`GraphEdge` (per spec's Code Style) — `attrs` as
`HashMap<String, serde_json::Value>`, converting `NodeAttrValue` at the
boundary (String→String, Number→Number, Bool→Bool, Duration→formatted
string, mirroring `format_attr_value` from Task 2 for the Duration case so
there's exactly one place that knows how to stringify a Duration).

Register `editor_api::router()` in `server.rs:build_router`'s `.merge()`
chain (`server.rs:41-44`), following the same `pub fn router() ->
Router<AppState>` shape every other route module already uses.

**Acceptance criteria:**
- [x] `GET /api/workflows/{id}/graph` for a known fixture returns JSON whose
      node/edge count and a representative attr per `NodeType` match the file
      (use `examples/ask_and_execute.dot` or a dedicated smaller fixture) —
      `get_graph_returns_node_and_edge_counts_and_representative_attrs`, plus
      verified live against the real `examples/ask_and_execute.dot`
- [x] `PUT /api/workflows/{id}/graph` with a modified graph (one node added,
      one edge removed) writes a new `.dot` file that a subsequent `GET`
      reflects, and that still parses/resolves cleanly —
      `put_graph_with_added_node_and_removed_edge_persists_and_reparses`
- [x] `PUT` with a graph that fails to resolve (e.g. an edge to a node id not
      present among the submitted nodes, if the JSON layer allows
      constructing that — otherwise a graph with a `priority` attr that isn't
      numeric, which `graph::resolve` rejects) is rejected with a non-2xx
      JSON error response, and the on-disk file is byte-for-byte unchanged
      from before the request. **Deviation:** `priority` is a typed
      `Option<i32>` field on `EditorEdge`, not a raw attr, so a non-numeric
      value never reaches `graph::resolve` — it fails JSON deserialization
      instead (axum's own rejection, before my handler runs). Used two node
      submitted with the same `id` instead — renders fine, then hits
      `ResolutionError::DuplicateNode` on the validate-before-write
      re-resolve, exercising the same code path (`WebError::Graph` → 422)
      via a real reachable failure —
      `put_graph_that_fails_to_resolve_is_rejected_and_file_is_unchanged`
- [x] `POST /api/workflows/new` writes a new file in the requested (allowed)
      target dir and returns its id; rejecting a `target_dir` not in
      `state.workflow_dirs` the same way `create_workflow` already does —
      `create_graph_writes_new_file_and_returns_id`,
      `create_graph_rejects_target_dir_not_in_workflow_dirs`
- [x] Unknown workflow id → 404 on both `GET` and `PUT` —
      `get_graph_unknown_id_returns_404`, `put_graph_unknown_id_returns_404`
- [x] Every pre-existing route test (`create_workflow`, `workflow_detail`,
      `/runs/*`) is unaffected — this module is purely additive. Confirmed:
      `cargo test -p smasher-web` went from 180 to 188 passing (exactly the 8
      new tests), 0 failed

**One discovery made during manual verification, fixed as part of this task
(unambiguous bug, not a scope judgment call — fixed directly, logged here for
visibility):** `render_to_dot` has always quoted the digraph's name
(`dot_escape`d, pre-dating every change in this module), but
`dot/parser.rs`'s graph-header grammar only ever accepted a bare `Ident` as
the name, never a `StringLit` — confirmed live against
`examples/ask_and_execute.dot` (`digraph AskAndExecute { ... }`): `PUT`
rendered `digraph "AskAndExecute" {`, then my own validate-before-write
re-parse of that same output failed with `Expected LBrace, found
StringLit("AskAndExecute")`, a guaranteed 422 on **every** save of **every**
named workflow. Real Graphviz syntax allows a quoted graph name. **Fixed**:
extended the name-parsing arm in `parse_graph()` to accept `Token::StringLit`
alongside `Token::Ident` — strictly additive, can't break any file that
already parsed. New test: `parse_digraph_with_quoted_name`.

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (188 passed, 0 failed); also
      `cargo test -p smasher-attractor` (1205 passed) and
      `cargo test --workspace` (0 failed) for the parser fix
- [x] Build succeeds: `cargo check -p smasher-web` (and `--workspace`)
- [x] `cargo clippy -p smasher-web` — 0 new warnings in touched files
- [x] Manual check: `curl` against a real running server (built via a
      throwaway example binary bypassing `smasher serve`'s CLI-level
      API-key gate — no LLM API keys are configured in this sandboxed
      environment, so the normal `smasher serve` startup path refuses to
      run; this only bypasses that unrelated CLI check, not any of the code
      under test) with `--workflows-dir` pointed at a real copy of
      `examples/ask_and_execute.dot`: `GET` returned real attrs
      (`tool_command`, `prompt`, `llm_model`, `reasoning_effort`) and
      `graph_attrs` (`goal`, `default_max_retry`, `rankdir`); edited a
      label via `PUT` (200, this is what caught the digraph-name bug
      above), re-`GET` reflected it, on-disk file re-parses; `POST
      /api/workflows/new` created a file and returned its id; bad
      `target_dir` → 400; unknown id → 404. Throwaway binary and fixture
      copy deleted afterward, not part of the commit.

**Dependencies:** Task 2 (the API's round-trip validation depends on
`render_to_dot` actually preserving all attributes — without Task 2, a `PUT`
would silently drop everything not already in the old writer's fixed set)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/editor_api.rs` (new)
- `smasher/crates/smasher-web/src/routes/mod.rs` (module registration, if
  routes are declared there)
- `smasher/crates/smasher-web/src/server.rs` (router merge)

**Estimated scope:** Medium (three handlers following an established
in-codebase pattern, no new error types, no new Cargo deps)

### Checkpoint B

- [x] `cargo test -p smasher-web` green
- [x] `cargo clippy -p smasher-web` clean
- [x] New `editor_api` integration tests (real axum test requests, real
      tempfile fixtures — no mocking) cover every acceptance criterion above

**Done.** Commit: `32cc802` on `feat/workflow-catalog`.

---

## Task 4: Svelte Flow custom-element scaffold

**Description:** New `crates/smasher-web/editor-ui/` package: Vite + Svelte 5
+ TypeScript + `@xyflow/svelte`, `vite.config.ts` with the `svelte()` plugin
configured `compilerOptions: { customElement: true }` per spec Assumption 1.
`src/WorkflowCanvas.svelte` — the custom-element root
(`<svelte:options customElement={{ tag: "workflow-canvas", shadow: "none" }}
/>`), wrapping `<SvelteFlow>` with `Background`/`Controls`/`MiniMap`, a
`graph = $bindable()` prop set imperatively from host-page JS (`document
.querySelector('workflow-canvas').graph = {...}`, not an HTML attribute
string), and a `dispatchSaved()` helper firing `new CustomEvent
('workflow-saved', { detail, bubbles: true, composed: true })` — `composed:
true` is required or the event won't cross the custom-element boundary
(spec's flagged risk).

`src/api.ts`: fetch wrappers for the Task 3 JSON API (`getGraph(id)`,
`saveGraph(id, graph)`, `createGraph(graph, targetDir, name)`).

This task delivers **generic rendering only** — nodes/edges use Svelte Flow's
default node/edge components with just a label, no palette, no per-kind
forms, no themed cards (those are Tasks 6-8). The goal is a working,
testable custom element: given a `graph` property, it renders nodes/edges,
lets you drag/connect/delete them via Svelte Flow's built-in interactions,
and a Save action calls `api.ts` and dispatches `workflow-saved`.

Add `node_modules/` to a new `editor-ui/.gitignore` (mirroring
`design-kit/.gitignore`); the built `dist/` output **is** checked in (per
plan's Architecture Decisions — no CI Node setup exists to build it
otherwise).

**Acceptance criteria:**
- [x] `npm install && npm run build` succeeds and produces a
      `<workflow-canvas>` custom element bundle — `dist/workflow-canvas.js`
      (357.86 kB, 94.09 kB gzipped) + `dist/editor-ui.css` (15.68 kB)
- [x] Vitest + `@testing-library/svelte`: setting the `graph` property on a
      mounted `<workflow-canvas>` element renders the expected number of
      nodes/edges — see **Deviation** below re: what jsdom can and can't
      verify for the actual custom element vs. the plain inner component
- [x] Adding/deleting a node or edge via Svelte Flow's built-in interactions
      updates the component's internal graph state correctly (observable via
      a test that reads the state back out) — delete via a real Backspace
      keypress on a selected node
      (`WorkflowCanvasInner.test.ts`'s `built-in delete interaction`); "add"
      has no built-in gesture yet (no palette until Task 6), tested instead
      by re-assigning the `graph` prop, the same reactive path a future
      palette-drag will use
- [x] Calling the save action invokes `api.ts`'s client with the current
      graph shape (mock only the network boundary — `fetch` — not the
      component logic itself, consistent with this repo's "real APIs over
      mocking" standard applied as closely as a frontend unit test allows) —
      `api.test.ts` mocks only `fetch`;
      `WorkflowCanvasInner.test.ts`'s `save action` tests the button
      through to a real `onSave` callback
- [x] A `workflow-saved` `CustomEvent` fired from inside the component is
      observable on the **host** element from outside the custom element
      (proves `composed: true` actually escapes the boundary — test by
      attaching a listener to the host DOM node, not the Svelte component
      internals) — verified live in a real browser (see Deviation); jsdom
      itself can't reach this assertion at all, for the same reason below
- [x] Loading a graph containing an unknown/future `NodeType` string doesn't
      crash the canvas (renders with a generic fallback label) —
      `convert.test.ts` + `WorkflowCanvasInner.test.ts`'s `unknown node_type`

**Deviation — jsdom/happy-dom cannot mount a Svelte-5 custom element whose
template renders `@xyflow/svelte`'s `<SvelteFlow>`, confirmed as a genuine
DOM-simulation gap, not a defect here:**
- jsdom throws `getContext(...) can only be used during component
  initialisation`, thrown from inside `SvelteFlow.svelte` itself, during the
  custom element's (spec-documented, standard) async `connectedCallback`
  mount.
- happy-dom (tried as an alternative): no error, but no content ever mounts
  either — `<workflow-canvas></workflow-canvas>` stays empty indefinitely.
- Confirmed via a real Chromium instance (Playwright + the machine's local
  Chrome install, no `playwright install` download needed) that this is
  real-browser-correct: `npm run dev`, the element registers, `.graph`
  renders the right node/edge counts, deleting a node via a real click +
  Backspace keypress works, `getGraph()` reflects it, save button present,
  zero console/page errors (one unrelated 404, not from this component).
  Re-ran this same check after the refactor below to confirm it still
  holds.
- **Fix**: split into `WorkflowCanvasInner.svelte` (all actual logic — canvas,
  node/edge state, save button/error state; a *plain* component, not a
  custom element) and `WorkflowCanvas.svelte` (thin `<svelte:options
  customElement>` shell doing only host-page property/event plumbing).
  `WorkflowCanvasInner.test.ts` gets full, reliable jsdom coverage via
  `@testing-library/svelte`'s standard `render()` (sidesteps the gap
  entirely — a plain component was never affected by it).
  `WorkflowCanvas.test.ts` covers only what jsdom *can* reliably verify for
  the actual custom element (registration, property assignment not
  throwing); the rest is covered by the real-browser Playwright
  verification above, which the acceptance criteria's own "Manual check"
  already anticipated needing for full end-to-end interaction confirmation.

**Two more incidental jsdom/Vitest fixes, neither specific to this
component (both well-known, both needed for `WorkflowCanvasInner.test.ts`
to mount at all):**
- `resolve.conditions: ['browser']` in `vitest.config.ts` — without it,
  Vite/Node's default export-condition resolution picks svelte's *server*
  build even under jsdom, breaking `mount()`.
- `ResizeObserver` and `window.matchMedia` stubs in `testSetup.ts` — jsdom
  implements neither; Svelte Flow uses both internally (layout measurement,
  a prefers-color-scheme query).

**Verification:**
- [x] Tests pass: `npm test` (Vitest) in `crates/smasher-web/editor-ui/` —
      17 passed, 0 failed, across 4 files
      (`convert.test.ts`/`api.test.ts`/`WorkflowCanvasInner.test.ts`/`WorkflowCanvas.test.ts`)
- [x] Build succeeds: `npm run build`. Also ran `npm run check`
      (svelte-check + tsc): 266 files, 0 errors, 0 warnings
- [x] Manual check: `npm run dev` locally — confirmed via real Chromium
      (Playwright-driven, not just eyeballed) rather than just visually;
      see Deviation above for the full interaction list exercised

**Done.** Commit: `e72baa4` on `feat/workflow-catalog`.

---

## Task 5: Backend wiring — routes, templates, static serving

**Description:** Two askama templates: `workflow_editor.html` (thin — just
the `<workflow-canvas>` tag plus a small inline `<script>` bootstrapping the
`graph` property from server-rendered JSON, per spec Assumption 1) reused for
both create and edit. New/changed routes in `routes/pages.rs`:
- `GET /workflows/new`: renders `workflow_editor.html` with an empty graph
  bootstrap (**replaces** the current `workflow_new` handler's route
  binding — the handler itself moves).
- `GET /workflows/new/raw`: the **relocated** existing raw-paste form
  (current `workflow_new` handler and `workflow_new.html` template,
  unchanged in behavior, just re-routed) — kept reachable as a fallback per
  spec's Boundaries recommendation (ask-first before deleting; keeping it
  satisfies that without needing to ask again).
- `GET /workflows/{id}/edit`: renders `workflow_editor.html` with the graph
  bootstrap populated from `Task 3`'s `GET /api/workflows/{id}/graph`
  response (call the same resolve+parse+resolve logic server-side, or have
  the template's inline script fetch it client-side on mount — prefer
  server-side pre-population so the initial paint isn't empty, matching how
  `workflow_detail` already reads the file server-side rather than via a
  client fetch).
- `POST /workflows` (`create_workflow`) is **unchanged** — still backs the
  relocated raw-paste form at `/workflows/new/raw`.

Static serving: a 4th `ServeDir` mount in `server.rs:build_router` (alongside
`/static`, `/candidate-artifacts`, `/design-kit`) pointing at wherever Task
4's built `<workflow-canvas>` bundle lands (`editor-ui/dist/`, or copied into
`crates/smasher-web/static/` — decide based on which keeps the mount
simplest, per plan's Open Questions).

**Acceptance criteria:**
- [x] `GET /workflows/new` renders the `<workflow-canvas>` element with an
      empty graph, loads the compiled JS bundle successfully (200, correct
      content-type) — `new_workflow_editor_renders_canvas_with_empty_graph_and_no_workflow_id`;
      real-Chromium check confirms Svelte Flow actually mounts (`.svelte-flow`
      present), not just a 200
- [x] `GET /workflows/new/raw` renders the original paste/upload form
      unchanged — every existing `workflow_new`-path test updated to this
      new path still passes with identical assertions —
      `new_workflow_raw_form_renders` (moved from `new_workflow_form_renders`,
      same assertions, only the URL changed)
- [x] `GET /workflows/{id}/edit` for a known workflow renders
      `<workflow-canvas>` with the graph bootstrap populated from that
      file's real parsed content (assert the response body contains the
      expected node ids/attrs in the bootstrap script, not just a 200) —
      `edit_workflow_renders_canvas_with_populated_graph_bootstrap`
- [x] `GET /workflows/{unknown-id}/edit` returns 404 —
      `edit_workflow_unknown_id_returns_404`
- [x] `POST /workflows` (existing `create_workflow`) is completely unaffected
      — same tests, same assertions, unmodified — all 5
      `create_workflow_*` tests untouched and still passing
- [x] The compiled bundle is reachable at whatever URL the new `ServeDir`
      mount exposes (200, non-empty body) —
      `editor_ui_mount_serves_the_compiled_workflow_canvas_bundle`,
      `editor_ui_mount_serves_the_compiled_css`,
      `editor_ui_mount_does_not_escape_its_root` (server.rs)

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (195 passed, 0 failed)
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] `cargo clippy -p smasher-web` (zero new warnings; the 5 pre-existing
      warnings are all in `smasher-attractor`'s `state.rs`/`stats.rs`, untouched)
- [x] Manual: real server (`build_router` wired to a throwaway example
      binary, per this repo's no-API-key sandbox workaround — deleted after
      use) + a real-Chromium Playwright check, not just `curl`. Confirmed the
      canvas actually renders (not just a 200 on the raw HTML): `/workflows/new`
      mounts an empty Svelte Flow canvas; `/workflows/{id}/edit` renders the
      real 3-node/2-edge fixture with every node's real `prompt`/`model`
      attrs present; clicking Save on the edit page PUTs to
      `/api/workflows/{id}/graph`, fires `workflow-saved`, and the on-disk
      `.dot` file re-parses/resolves cleanly with all attrs intact. See
      **Discoveries** below — getting to that green state surfaced two real
      bugs in Task 4's checked-in bundle/pattern, both fixed here.

**Discoveries / deviations (found via the real-browser manual check above,
none visible from `cargo test`/`npm test` alone since neither exercises the
actual static `dist/` bundle loaded as a plain `<script type="module">` in a
real browser):**

1. **Task 4's checked-in `dist/workflow-canvas.js` threw `ReferenceError:
   process is not defined` the instant a real browser loaded it.**
   `@xyflow/svelte` (bundled in) branches internally on
   `process.env.NODE_ENV` for dev-only warnings/attribution logic. Vite's
   `build.lib` mode — unlike its regular app-build mode — does not
   automatically strip/replace that reference, so it survives into the
   compiled bundle as a literal global lookup, which throws in any real
   browser (no Node global). Task 4's own real-Chromium verification never
   caught this because it exercised `npm run dev` (Vite's dev server, which
   serves unbundled ESM with its own runtime and never hits this code path),
   not the actual checked-in `dist/` artifact — the exact thing Task 5 is
   the first to actually serve and load statically. **Fixed** by adding
   `define: { 'process.env.NODE_ENV': JSON.stringify('production') }` to
   `editor-ui/vite.config.ts` (the standard fix for this well-known
   Vite-lib-mode gap) and re-running `npm run build`; confirmed zero
   `process.` references remain in the rebuilt bundle.
2. **The bootstrap `<script>`'s own source comment accidentally contained
   the literal sequence "close-angle-bracket-less-than, slash, script,
   close-angle-bracket" while documenting the unrelated JSON-escaping fix
   below (discovery 4) — and HTML's `<script>` raw-text parsing rule matches
   that byte sequence regardless of JS syntax context (comment, string,
   whatever), so the browser silently ended the script element mid-comment,
   before the real `canvas.graph =`/`canvas.workflowId =` assignments ever
   ran.** Confirmed via `node --check` on the actually-parsed script text
   (not the full file) reproducing "Unexpected end of input" from an
   unbalanced backtick left dangling by the truncation, and via a Chrome
   DevTools Protocol `Runtime.exceptionThrown` trace pointing at the exact
   comment line. **Fixed** by rewording the comment to describe the
   escaping without spelling out the literal sequence, with a note in the
   template itself warning future editors not to reintroduce it.
3. **Property-timing hazard, uncovered while chasing (2):** a classic
   (non-`type="module"`) inline `<script>` placed after `<script
   type="module" src="...">` executes *before* the module (modules are
   deferred), so setting `canvas.graph`/`canvas.workflowId` synchronously at
   that point runs before `customElements.define('workflow-canvas', ...)`
   has necessarily happened. This normally still works via the Custom
   Elements spec's pre-upgrade property replay, but to avoid depending on
   that subtlety at all, the bootstrap script now waits on
   `customElements.whenDefined('workflow-canvas').then(...)` before setting
   either property — the standard-safe pattern. (In the end this component's
   own generated accessors did handle pre-upgrade assignment correctly per
   spec, once discovery 2's real truncation bug was fixed — but the
   `whenDefined` guard is correct practice regardless and costs nothing.)
4. **Introduced (and fixed) a stored-XSS-shaped risk in this task's own new
   code, not a pre-existing bug:** the graph bootstrap is embedded via
   askama's `|safe` filter (required so the JSON's own quotes aren't
   HTML-escaped into `&quot;`), which means any user-authored `.dot` file
   attribute containing a literal script-closing-tag sequence would, without
   mitigation, break out of the bootstrap `<script>` block and inject
   arbitrary markup into every future viewer of that workflow's edit page —
   a real stored-XSS path via a maliciously crafted `.dot` file. **Fixed**
   directly (unambiguous, no product-decision content, same bar as Task 3's
   "genuinely broken, just fix it" precedent) with a small
   `to_inline_script_json` helper in `routes/pages.rs` that neutralizes
   `<`, `>`, and `&` as `\uXXXX` escapes before embedding (same technique as
   Django's `json_script`/Rails' `json_escape`) — covered by
   `edit_workflow_bootstrap_escapes_script_closing_tag_in_attrs`.

**Dependencies:** Task 4 (needs a built bundle to serve), Task 3 (edit
route's server-side graph bootstrap needs the API's resolve+JSON logic,
though it can call the same underlying Rust functions directly rather than
looping back through HTTP)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/workflow_editor.html` (new)
- `smasher/crates/smasher-web/templates/workflow_new.html` (unchanged,
  now served at the `/raw` path)
- `smasher/crates/smasher-web/src/server.rs`

**Estimated scope:** Medium (route/template additions following established
patterns, one new static mount)

### Checkpoint C

- [~] Manual browser pass: create a 2-node generic graph from
      `/workflows/new` (default Svelte Flow node rendering is fine — no
      palette/forms yet), save, confirm the written `.dot` file parses via
      `smasher run` or a quick `cargo run` against it — **blocked, flagged
      below, not silently worked around.** `/workflows/new` itself renders
      and mounts a working empty canvas correctly (confirmed live). But
      clicking Save there surfaces a real, visible error — "no workflowId
      set; cannot save" — because Task 4's `WorkflowCanvas.svelte` only ever
      wires its Save button to `saveGraph` (`PUT
      /api/workflows/{workflowId}/graph`), which requires an id that only
      exists for a file that's already on disk. `api.ts`'s `createGraph()`
      (`POST /api/workflows/new`, the actual create endpoint, built and
      tested in Task 3) is never called from anywhere in the compiled
      component — there's no name/target-directory input anywhere in the
      canvas UI, and nothing in Tasks 4 through 9's own acceptance criteria
      assigns building one. This is a real plan gap, not a "some later task
      covers it" case (checked: grepped the whole todo file for
      `createGraph`/`target_dir`/"new workflow" outside Task 3/4's own
      descriptions — nothing). **Not fixed here** — which concrete UX
      (inline name/dir fields on the canvas before Save; a bare `prompt()`
      for speed; a separate small "create" step before mounting the canvas
      at all; something else) is a product decision, not an obvious bug fix
      with one correct answer, so it's flagged for Jobsworth rather than
      guessed at. The rest of the create-path's plumbing (`POST
      /api/workflows/new`, `create_graph`'s validation, `createGraph()` in
      `api.ts`) already exists and is tested — only the UI wiring to reach
      it is missing.
- [x] Reopen the same workflow at `/workflows/{id}/edit`, confirm the two
      nodes and their connecting edge appear on the canvas — verified with a
      3-node/2-edge fixture (richer than the minimal 2-node case) via a real
      Chromium session: all 3 nodes and both edges render
      (`.svelte-flow__node`/`__edge` counts match), every node's real
      `prompt`/`model` attrs are present in the bootstrap JSON, clicking Save
      round-trips correctly to disk (re-parses/resolves with all attrs
      intact, confirmed via a throwaway `cargo run` check, since only the
      *edit* path's Save (an existing file, real `workflowId`) is affected
      by the gap above — new-workflow creation is the only blocked case)
- [x] `cargo test --workspace` and `npm test` both green (766 passed workspace-
      wide incl. 195 in smasher-web, 0 failed; 17 passed in editor-ui, 0 failed)

**Done.** Commit: `b7c258a` on `feat/workflow-catalog`.

**Open item carried forward for Jobsworth (not a Task 5 deliverable gap —
flagged, not silently worked around):** wiring `/workflows/new`'s Save
button to actually create a new file (calling the already-built/tested
`createGraph`/`POST /api/workflows/new`, which nothing in Tasks 4-9 assigns
a UI for) needs a product decision on the create-flow UX before it can be
built. Until it lands, `/workflows/new` is view/build-only in a real
browser — every other piece of Task 5 (routes, static serving, the edit
bootstrap, and the edit page's full save round-trip) is verified working.

---

## Task 5b (addendum, not originally scoped): Wire the create flow — `/workflows/new`'s Save actually creates a file

**Not part of the original plan.** This task exists only because Task 5's
own manual verification surfaced a real gap in the plan itself: nothing in
Tasks 4 through 9's acceptance criteria ever assigns building a UI for
`createGraph`/`POST /api/workflows/new` (built and tested back in Task 3).
Task 5 flagged it explicitly rather than silently working around it or
guessing at a UX (see the "Open item carried forward for Jobsworth" note
directly above) and left `/workflows/new` genuinely broken for its own
stated purpose: clicking Save there threw "no workflowId set; cannot save"
instead of ever writing a file, which blocks the module's own success
criteria ("open the editor for a new workflow, build a graph, save, the
file lands on disk").

**What was approved, and by whom:** Jobsworth was asked how to close this
gap and chose the smallest of the options put to him: **inline name/
target-dir fields on the canvas page itself**, shown only when there's no
`workflowId` yet, Save calling `createGraph` instead of `saveGraph` and then
redirecting client-side to `/workflows/{id}/edit`. This keeps spec
Assumption 8 ("create and edit are the same screen") mostly intact — it
adds only the two fields create genuinely needs, not a separate
create-workflow wizard/step.

**Description:**
- Backend (`routes/pages.rs`, `templates/workflow_editor.html`):
  `WorkflowEditorTemplate` gains a `target_dirs_json` field (JSON-serialized
  `state.workflow_dirs`, escaped via the same `to_inline_script_json` helper
  `graph_json`/`workflow_id_js` already use) — mirrors how the old
  `WorkflowNewTemplate::target_dirs` already fed the raw-paste form's
  `<select>`. Both `workflow_editor_new` and `workflow_editor_edit` populate
  it from `state.workflow_dirs.clone()`; the bootstrap script sets
  `canvas.availableTargetDirs = [...]` unconditionally (harmless when unused
  in edit mode) right after `canvas.graph = ...`.
- Frontend (`editor-ui/src/`): `WorkflowCanvasInner.svelte` gains two new
  optional props, `workflowId` and `availableTargetDirs`, and shows a small
  inline name-input + target-dir-`<select>` above the canvas only when
  `!workflowId` (`isCreateMode`). The target-dir select defaults to the
  first entry in `availableTargetDirs`. `onSave`'s signature grows an
  optional second `meta: { name, targetDir }` argument, populated only in
  create mode; the Save button is `disabled` until the trimmed name is
  non-blank (client-side nicety only — `create_graph`'s own server-side
  blank-name rejection, mirroring `create_workflow`'s existing discipline,
  is the real enforcement). `WorkflowCanvas.svelte` (the custom-element
  shell) bridges the new `availableTargetDirs` prop straight through
  (plain prop, not `$bindable`, matching how `workflowId` was already
  wired) and its `handleSave` branches on whether `meta` is present: if so,
  it calls `createGraph(graph, meta.targetDir, meta.name)` (already built
  and tested in Task 3/4), dispatches `workflow-saved` the same way
  `saveGraph`'s path already does, then navigates via
  `window.location.href = `/workflows/${id}/edit`` — matching
  `create_workflow`'s own existing "write, then redirect to the new page"
  pattern (`routes/pages.rs`'s `create_workflow` handler), client-side since
  this is a custom element with no server round-trip for the page itself.
  The pre-existing `if (!workflowId) throw ...` guard in `handleSave` is
  kept as a defensive fallback (in practice unreachable now, since Save is
  disabled until `meta` can be supplied whenever `workflowId` is absent).

**Acceptance criteria:**
- [x] `/workflows/new`'s bootstrap script sets
      `canvas.availableTargetDirs = [...]` with the real configured
      directories — `new_workflow_editor_bootstraps_available_target_dirs`
      (`routes/pages.rs`)
- [x] In create mode (`!workflowId`), `WorkflowCanvasInner` renders a name
      input and target-dir select, defaulting the dir to the first
      available one — `WorkflowCanvasInner.test.ts`'s `create mode` block
- [x] Save is disabled until the name is non-blank (whitespace-only counts
      as blank); typing a name enables it —
      `disables Save until a non-blank name is entered`
- [x] Clicking Save in create mode calls `onSave` with the current graph and
      `{ name, targetDir }` meta, not `saveGraph`'s no-meta shape —
      `calls onSave with the graph and {name, targetDir} meta when Save is
      clicked`
- [x] In edit mode (`workflowId` set), the create-mode fields don't render,
      and `onSave` is called with no meta (existing `saveGraph` path
      unaffected) — `does not render the create-mode name/target-dir
      fields`, `invokes onSave with the current graph shape and no meta
      when clicked` (both updated from Task 4's original tests to pass
      `workflowId` explicitly, now that its absence has real create-mode
      behavior attached to it)
- [x] `WorkflowCanvas.svelte` accepts `availableTargetDirs` property
      assignment without throwing (jsdom-reliable subset, same limitation
      Task 4 documented for this file) —
      `accepts availableTargetDirs property assignment without throwing`
- [x] Real-browser (Playwright + real Chrome) end-to-end: `/workflows/new`
      mounts with the name/dir fields, Save is disabled until a name is
      typed, clicking Save after filling both fields writes a real `.dot`
      file to the chosen directory and navigates the browser to
      `/workflows/{new-id}/edit`, which itself mounts correctly — see
      Verification below
- [x] Edit-mode regression: opening `/workflows/{id}/edit` for an existing
      fixture shows no create-mode fields, and Save still PUTs successfully
      — verified live against `examples/ask_and_execute.dot` (30 nodes)

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (196 passed, up from 195 — the
      1 new backend test; 0 failed); `cargo test --workspace` (0 failed,
      same totals as Task 5 plus the 1 new test); `npm test` in
      `editor-ui/` (23 passed, up from 17 — 6 new/updated create-mode
      tests; 0 failed)
- [x] Build succeeds: `cargo check --workspace`; `npm run build` (bundle
      rebuilt, `dist/workflow-canvas.js` checked in, confirmed
      `process.env` still fully stripped per Task 5's fix); `npm run check`
      (svelte-check + tsc): 266 files, 0 errors, 0 warnings
- [x] `cargo clippy -p smasher-web` — 0 new warnings (the same 5
      pre-existing `sort_by`/`collapsible_match` warnings, all in
      `smasher-attractor`'s `state.rs`/`stats.rs`, untouched by this task)
- [x] Manual: real server (`build_router` wired to a throwaway example
      binary, per this repo's no-API-key sandbox workaround — deleted after
      use) + a real-Chromium Playwright check (`playwright-core` installed
      with `npm install --no-save`, driving the machine's local Chrome
      install, no `playwright install` download, uninstalled again
      afterward — `package.json`/`package-lock.json` untouched throughout).
      Confirmed: `/workflows/new` mounts the canvas with the name/dir
      fields; Save starts disabled and enables once a name is typed;
      clicking Save wrote `manual-create-flow-check.dot` to the configured
      directory (confirmed on disk, re-parsed and resolved cleanly via a
      second throwaway check binary) and navigated the real browser to
      `/workflows/smasher-manual-verify-workflows__manual-create-flow-check/edit`,
      which itself mounted correctly (`canvas.workflowId` present in the
      bootstrap). Separately reopened `/workflows/{id}/edit` for the real
      `examples/ask_and_execute.dot` fixture (copied into the throwaway
      server's workflow dir): no create-mode fields rendered, all 30 nodes
      present, Save still round-trips via `PUT` as before Task 5b. Zero
      `pageerror`s in either run; the only console noise was two unrelated
      Google Fonts 404s (no network egress to `fonts.gstatic.com` in this
      sandbox), matching Task 5's own "one unrelated 404, not from this
      component" note. Throwaway example binaries, temp workflow/data
      dirs, and `playwright-core` all removed afterward — confirmed via
      `git status` showing only the intended source/template/dist files
      changed.

**Dependencies:** Task 5 (this fixes a gap Task 5's own manual verification
found; also depends on Task 3's `createGraph`/`POST /api/workflows/new` and
Task 4's `api.ts` client, both already built and tested)

**Files touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/workflow_editor.html`
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvas.svelte`
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvasInner.svelte`
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvas.test.ts`
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvasInner.test.ts`
- `smasher/crates/smasher-web/editor-ui/dist/workflow-canvas.js` (rebuilt)

**Estimated scope:** Small (two backend fields threaded through an existing
bootstrap pattern; one small inline form component with validation, already
proven by the tests above)

**Done.** Commit: `57ce794` on `feat/workflow-catalog`.

---

## Task 6: Node-kind visual registry + palette sidebar

**Description:** `src/nodeConfig.ts` — `NODE_KIND_CONFIG: Record<NodeType,
{icon, title, theme, paletteGroup}>`, one entry per `NodeType`
(`Codergen`/`Interviewer`/`Tool`/`Manager`/`Conditional`/`SubPipeline`/
`Start`/`Exit`/`Parallel`/`FanIn`), mirroring AntV X6's Agent Flow example's
JSON-driven `AGENT_CONFIGS` (per spec Assumption 2) — data-driven, not
hardcoded per component, so adding a kind's visuals later doesn't require
touching every place that lists kinds. Palette grouping per spec's
suggestion: "Pipeline Steps" (Codergen, Tool, Manager), "Control Flow"
(Interviewer, Conditional, SubPipeline), a separate non-collapsible
Start/Exit/Parallel/FanIn structural section (Agent Flow's "dedicated
Start/Exit cards distinct from working node kinds"). Collapsible groups,
draggable entries that create a new node of that kind on drop, matching
Agent Flow's left-hand panel behavior (Svelte Flow doesn't have a built-in
Stencil the way X6 does — this is custom-built).

**Acceptance criteria:**
- [x] Every `NodeType` has an entry in `NODE_KIND_CONFIG` (compile-time
      exhaustiveness — TypeScript's `Record<NodeType, ...>` enforces this) —
      a `NodeType` string-literal union was added to `types.ts` for this;
      `nodeConfig.test.ts` also asserts it at runtime independently of the
      type system (`ALL_NODE_TYPES` kept as a separate hard-coded list so
      the test still catches drift if the union itself is ever edited wrong)
- [x] Palette renders 3 groups (Pipeline Steps, Control Flow, Structural)
      with the right entries in each per the grouping above
- [x] Dragging a palette entry onto the canvas creates a new node of that
      `NodeType` at the drop position, with the config's default label/theme
      applied — `WorkflowCanvasInner`'s new `addNodeAtPosition()`, called by
      a real `dragover`/`drop` handler on the canvas area
- [x] Groups are independently collapsible/expandable — Structural is
      always visible (no toggle), per Agent Flow's "dedicated Start/Exit
      cards distinct from working node kinds"

**Discoveries / deviations:**
- The real HTML5 drag *gesture* isn't reliably simulatable in jsdom (same
  limitation Task 4 already documented for Svelte Flow's own node
  drag/connect interactions — no real pointer capture/coordinates in
  jsdom). Per that established precedent: the drop *logic*
  (`addNodeAtPosition`) is unit-tested directly by calling it with an
  explicit position, not by firing a synthetic jsdom `drop` `DragEvent`;
  the actual gesture is verified against a real Chromium instance instead
  (see Verification below), using Playwright's `locator.dragTo()`, which
  does drive genuine native drag-and-drop.
- Position is computed by hand from the drop event's screen coordinates
  (relative to the canvas container) rather than via `@xyflow/svelte`'s
  `useSvelteFlow()`/`screenToFlowPosition()`. That hook only works inside a
  component already rendered as a descendant of `<SvelteFlow>` (or wrapped
  in an explicit `<SvelteFlowProvider>`); `WorkflowCanvasInner`'s own
  `<script>` runs before its `<SvelteFlow>` child mounts, so the context
  isn't available at the point the drop handler is defined. Screen-space
  (not pan/zoom-adjusted flow-space) is an accepted simplification for this
  task's "generic rendering only" scope — correct at the default zoom/pan a
  freshly opened canvas starts at; revisit if a later task needs
  drop-accuracy after panning/zooming.
- **False alarm, investigated and ruled out, logged for whoever next reads
  a `dist/` diff:** after this task's build, `Palette.svelte`'s `<style>`
  rules (`.palette-entry`, `.workflow-palette`, etc.) don't appear anywhere
  in `dist/editor-ui.css` — looked like a real bug (styles silently dropped
  from the shipped bundle) at first. Root cause, confirmed by checking the
  actual runtime behavior of the built bundle (not just grepping the
  output files): with `compilerOptions.customElement: true` set globally
  on the `svelte()` plugin (needed for `WorkflowCanvas.svelte`'s actual
  custom element), Svelte's compiler switches **every** component compiled
  through that pipeline to `css: 'injected'` mode — styles ship as a
  runtime `append_styles`-style call that inserts a real `<style>` tag into
  the document, not as literal `.class{...}` text sitting in the
  externally-extracted CSS file. Verified directly: loaded the real built
  `dist/workflow-canvas.js` in a real Chromium instance, confirmed a
  `<style>` tag containing the `palette-entry` rules gets injected at
  runtime, and confirmed `getComputedStyle()` on a rendered palette entry
  returns the exact theme border color (`rgb(59, 130, 246)` = `#3b82f6`,
  `THEME_COLORS.blue.border`). No code change needed — this is legitimate,
  standard Svelte custom-element behavior, not specific to this task.

**Verification:**
- [x] Tests pass: `npm test` — 37 passed, 0 failed (was 23 before this
      task); `npm run check` (svelte-check + tsc) — 269 files, 0 errors, 0
      warnings; `npm run build` succeeds
- [x] Manual: visually compare against the Agent Flow reference layout (not
      pixel-identical — spec leaves exact visual details to this task) —
      confirmed via a real Chromium instance (Playwright): palette visible,
      3 groups present, Pipeline Steps collapse/expand independently of
      Control Flow (Structural has no toggle), and a genuine native
      HTML5 drag of the Codergen palette entry onto the canvas creates a
      real node (node count 3→4, with the "Codergen" label) — not just a
      jsdom-simulated event

**Done.** Commit: `09f06a0` on `feat/workflow-catalog`.

---

## Task 7: Node-kind form components

**Description:** One Svelte component per `NodeType`, rendering into a
selected-node side panel, reading/writing that node's `attrs`:
- `CodergenForm.svelte`: `prompt`, `model`
- `InterviewerForm.svelte`: `question`, `gallery` mode toggle (per grounding,
  confirm the real attr name for anything beyond `gallery`/`options`/
  `approve` before wiring a `candidate_count`-shaped field — flagged as an
  open question in the plan)
- `ToolForm.svelte`: `tool`, `args` (JSON textarea with basic validity
  feedback, since invalid JSON fails the run per `tool_handler.rs`)
- `ManagerForm.svelte`: `task`, `config` (same JSON-validity treatment as
  Tool's `args`)
- `SubPipelineForm.svelte`: `pipeline` (file path)
- `StructuralForm.svelte`: label-only, used for `Start`/`Exit`/`Parallel`/
  `FanIn`/`Conditional` (none of these carry kind-specific attrs per
  `graph/mod.rs`/handler grounding)

Each form calls an `onChange` callback with the updated `attrs` shape;
selecting a node in the canvas swaps which form renders in the side panel
based on `NODE_KIND_CONFIG`/the node's `nodeType`.

**Acceptance criteria:**
- [x] Each form renders its kind-specific fields and calls `onChange` with
      the correct `attrs` shape for that kind
- [x] Selecting a node of each `NodeType` shows the matching form (or
      `StructuralForm` for the 5 label-only kinds)
- [x] `ToolForm`/`ManagerForm` surface a visible error state for invalid JSON
      in `args`/`config` without crashing the panel
- [x] Editing a field updates the node's `attrs` in the canvas's graph state
      immediately (observable via the same state-read pattern Task 4's tests
      use)

**`candidate_count` finding (the open question this task was explicitly told
to resolve by re-grepping real code, not guess at):** confirmed absent from
`crates/smasher-attractor/src/interviewer.rs` — grepped the whole file,
nothing. But it is **not** an editor-only convenience with no engine effect:
it's read by `crates/smasher-web/src/routes/gallery.rs`'s
`resolve_candidate_count()` (lines ~144-166), which drives the gallery
dashboard card's expected-candidate-count display (a warning/display hint,
"never enforcement" per that function's own doc comment — a `candidates=N`
launch variable overrides it, and a missing/unparseable value just means
"unknown", not an error). It accepts either a bare integer (as
`NodeAttrValue::Number` or a numeric `String`) or `phase_default(<phase>)`
(`discover`/`define`/`deliver` map to 4/2/1). Confirmed it's exercised by a
real fixture: `examples/gallery_gate_showcase.dot`'s `Gate1` node already
carries `candidate_count=3`. Since this is genuinely read (by the web layer,
not the engine handler — which is exactly why grepping only
`interviewer.rs` didn't find it, and exactly why the plan's own grounding
flagged it rather than asserting either way), `InterviewerForm.svelte` wires
a `candidate_count` text field, shown only when the gallery-gate toggle is
on, with inline help text clarifying it's read by the dashboard card, not
the interviewer step itself. This is the "verify against real code and act
on what's found" case the task brief called out explicitly (not a product
decision) — resolved by reading `gallery.rs`, not by guessing from the
spec's illustrative example.

**Other real discoveries, both grounded in re-reading the actual handler
code rather than assumed from the plan's summary:**
- `interviewer.rs`'s branch order (`approve` checked first, then `options`,
  then free-form/gallery) means gallery-gate reinterpretation is *only*
  reachable when neither `approve` nor `options` is set. Enabling the
  gallery toggle while Answer mode is Yes/No or Options would write a
  `gallery=true` attr the handler's own code would silently never look at —
  worse than not offering the combination, since it would look functional
  and do nothing. `InterviewerForm.svelte` enforces this directly: the
  gallery toggle is disabled unless Answer mode is Free-form, and switching
  Answer mode away from Free-form while gallery is on turns it back off
  (both attrs cleared in the same `onChange` call, not left dangling).
- `handler.rs`/`tool_handler.rs`/`manager_handler.rs` all apply their
  attr-fallback-to-`label` logic only when the attr key is **absent**, not
  when it's present-but-empty (`Some(NodeAttrValue::String(s)) => s.clone()`
  applies even for `s == ""`). So every text field here writes `undefined`
  (deletes the attr) rather than `""` when cleared to blank — keeping the
  label fallback live instead of silently overriding it with an empty
  value. Documented inline in each form (`CodergenForm`/`ToolForm`/
  `ManagerForm`/`SubPipelineForm`).

**Design decisions made and documented, per the task brief's "your call,
document it" on the `onChange` shape and label ownership:**
- `onChange` is called as `(patch: { label?: string; attrs?: Record<string,
  AttrValue | undefined> })` — a key mapped to `undefined` in `attrs` means
  "delete this attr" (plain object-spread can't express deletion, needed for
  e.g. unchecking Interviewer's gallery toggle). The side panel
  (`WorkflowCanvasInner.svelte`'s `applyNodeFormChange`) applies each key
  individually rather than spreading, so attrs the current form doesn't own
  (e.g. `pos`) are left untouched. Type lives in `types.ts` as
  `NodeFormChange`/`NodeAttrsPatch`.
- `label` is **not** duplicated across the six per-kind forms. It's common
  to every node kind (and is itself every handler's own fallback value —
  Codergen's `prompt`, Tool's `tool`, Manager's `task`, Interviewer's
  `question` all fall back to it) so it's edited once via a shared "Label"
  field in the side panel itself (`WorkflowCanvasInner.svelte`, above the
  per-kind form), calling the same `applyNodeFormChange` with `{ label:
  ... }`. This is why `StructuralForm.svelte` renders no inputs at all —
  the shared Label field is the only thing a Start/Exit/Parallel/FanIn/
  Conditional node needs, and it lives one level up, not inside
  `StructuralForm` itself.
- Node selection uses Svelte Flow's `onnodeclick`/`onpaneclick` events
  (`@xyflow/svelte`'s `events.d.ts`), not a `nodes.find(n => n.selected)`
  scan, per the task brief's own suggestion after checking
  `node_modules/@xyflow/svelte/dist/lib/types/events.d.ts`. `selectedNode`
  itself is a `$derived` lookup into the live `nodes` array (not captured
  once at click time), so the panel keeps reflecting current attrs/label as
  they're edited and gracefully disappears (no dangling stale-id panel) if
  the selected node is deleted via Task 4's existing Backspace interaction.
- Any unrecognized/future `node_type` string falls back to `StructuralForm`
  in `formComponentFor()`'s `default` arm — the same "don't crash on an
  unknown kind" convention Task 4 (canvas rendering) and Task 6 (palette)
  already established, extended to forms.
- Each `nodeForms/*.svelte` component seeds its local field state from
  `attrs` exactly once per mount (wrapped in `untrack()` so Svelte's
  `state_referenced_locally` compiler warning doesn't fire for genuinely
  intended one-time-read behavior); `WorkflowCanvasInner.svelte` wraps the
  form region in `{#key node.id}` so selecting a different node forces a
  remount instead of leaving stale field values from the previous
  selection visible.

**Verification:**
- [x] Tests pass: `npm test` — 85 passed, 0 failed (was 37 before this
      task: +33 across 6 new `nodeForms/*.test.ts` files, +15 new
      `WorkflowCanvasInner.test.ts` cases covering the side panel itself);
      `npm run check` (svelte-check + tsc) — 281 files, 0 errors, 0 warnings
- [x] Build succeeds: `npm run build` — `dist/workflow-canvas.js` (380.62 kB,
      99.46 kB gzipped) + `dist/editor-ui.css` (16.32 kB); confirmed zero
      `process.env` references survive in the rebuilt bundle (Task 5's
      known Vite-lib-mode gap, re-checked since every task that rebuilds
      `dist/` inherits the risk of reintroducing it)
- [x] `cargo test --workspace` (766+ across the workspace incl. 196 in
      smasher-web, 0 failed) and `cargo clippy --workspace` (same 5
      pre-existing `sort_by` warnings in `smasher-attractor`'s
      `state.rs`/`stats.rs`, untouched by this task) both still green —
      this task touched only `editor-ui/`, no Rust files
- [x] Manual: real server (`build_router` wired to a throwaway example
      binary at `crates/smasher-web/examples/manual_verify_task7.rs`, per
      this repo's no-API-key sandbox workaround — deleted after use) +
      real-Chromium Playwright check (`playwright-core` via `npm install
      --no-save`, uninstalled afterward, `package.json`/`package-lock.json`
      untouched). Built a fixture (`manual-verify-task7.dot`) covering one
      node of every kind (Start/Codergen/Interviewer-gallery-gate/Tool/
      Manager/SubPipeline/Conditional/Exit) plus a real gallery-gate node
      copied in spirit from `examples/gallery_gate_showcase.dot`'s
      `candidate_count=3` convention. Opened `/workflows/{id}/edit`,
      clicked through every node: each form appeared with real attrs
      pre-populated (prompt/model, question/gallery-checked/candidate_count
      "3", tool/args, task/config, pipeline path); typed invalid JSON into
      Tool's args field and confirmed a visible error appeared without
      crashing the panel, then fixed it and confirmed the error cleared;
      edited one field per kind (Codergen prompt+model, Interviewer
      candidate_count 3→5, Tool args to valid JSON, Manager task); clicked
      Save. Re-fetched `GET /api/workflows/{id}/graph` afterward and
      confirmed every edit persisted and every untouched attr on the same
      node survived (e.g. Tool's edited `args` alongside its unedited
      `tool` name, Manager's edited `task` alongside its unedited
      `config`); read the raw `.dot` file off disk directly and confirmed
      it re-parses cleanly with `candidate_count="5"` (quoted string),
      `gallery=true` (bare boolean), `shape="folder"` still resolving to
      SubPipeline and `shape="parallelogram"` still resolving to Tool
      (Task 1's fix holding through a real save). Zero `pageerror`s; the
      only console noise was two Google Fonts 404s, matching Tasks 5/5b's
      already-documented "no network egress to fonts.gstatic.com in this
      sandbox" note. Throwaway example binary, `playwright-core`, and all
      temp workflow/data directories removed afterward — confirmed via
      `git status` showing only the intended source/template/dist files
      changed.

**Dependencies:** Task 6 (needs `NODE_KIND_CONFIG` to know which form maps to
which kind)

**Files touched:**
- `smasher/crates/smasher-web/editor-ui/src/types.ts` (added
  `NodeFormChange`/`NodeAttrsPatch`/`NodeFormProps`)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/nodeForms.css` (new,
  shared field styling)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/CodergenForm.svelte`
  (new) + `CodergenForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/InterviewerForm.svelte`
  (new) + `InterviewerForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/ToolForm.svelte` (new)
  + `ToolForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/ManagerForm.svelte`
  (new) + `ManagerForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/SubPipelineForm.svelte`
  (new) + `SubPipelineForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/nodeForms/StructuralForm.svelte`
  (new) + `StructuralForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvasInner.svelte`
  (touched: selected-node side panel, `formComponentFor`,
  `applyNodeFormChange`, `onnodeclick`/`onpaneclick` wiring)
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvasInner.test.ts`
  (touched: +15 side-panel integration tests)
- `smasher/crates/smasher-web/editor-ui/dist/workflow-canvas.js`,
  `dist/editor-ui.css` (rebuilt)

**Estimated scope:** Large (6 new components, but each individually small
and following the same `onChange` contract) — held.

**Done.** Commit: `f419d84` on `feat/workflow-catalog`.

---

## Task 8: Edge polish + edge attrs form + default position assignment

**Description:** Three related pieces of canvas-interaction polish:
1. Connection handles hidden until a node is hovered, turning an accent
   color once connected (spec Assumption 2, Agent Flow behavior);
   hover-revealed delete affordance on edges.
2. An edge-selection side panel (or inline on hover) editing `condition`/
   `priority`/`loop_restart` — the 3 edge attrs Task 2's round-trip fix now
   actually preserves.
3. Default grid position assignment: any node loaded with no `pos` attr
   (e.g. reopening a hand-written pre-existing `.dot` file for the first
   time) gets a deterministic client-side default position instead of
   overlapping at `(0,0)` — assign on load, persisted back through the
   normal `pos` attr round-trip (Task 2) on next save.

**Acceptance criteria:**
- [x] Connection handles are visually hidden by default, appear on node
      hover, and change color once an edge is connected
- [x] Hovering an edge reveals a delete control; clicking it removes the edge
      from graph state
- [x] Selecting an edge shows a form for `condition`/`priority`/
      `loop_restart`; editing updates the edge's attrs
- [x] Loading a graph where no node has `pos` assigns each a distinct
      default position (no overlapping nodes)
- [x] Loading a graph where some nodes have `pos` and others don't leaves the
      positioned ones alone and only assigns defaults to the rest
- [x] Saving after a default-position assignment persists that `pos` value —
      reopening the same file shows nodes in the same (now-explicit)
      positions, not re-randomized

**Design decisions made and documented (your-call items per the task
brief):**
- Connected-handle accent color is a single fixed blue (`#3b82f6`), the same
  color regardless of node theme, and a connected node's handles stay
  visibly accent-colored **even without hovering** (not just momentarily
  revealed on hover like an unconnected node's) — a deliberate simplification
  over per-node-theme accent colors (would require per-kind handle CSS, not
  data-driven from `NODE_KIND_CONFIG` the way node-card visuals are meant to
  be, and this task doesn't build the themed-card custom node renderer that
  would carry theme context down to a handle) and a readability choice (a
  "wired up" node should read as such at a glance, not only while hovered).
  Both are visual/UX judgment calls within this task's own explicitly-granted
  discretion, not product-behavior decisions.
- `WorkflowEdge.svelte` (new custom `edgeTypes` entry, registered as
  `"workflow"` and set via both `toFlowEdges` in convert.ts and
  `<SvelteFlow>`'s `defaultEdgeOptions`, so both loaded and freshly
  hand-drawn edges get the same delete affordance) needs the hover-id and
  delete callback WorkflowCanvasInner.svelte owns, but a custom `edgeTypes`
  component's props are fixed to `EdgeProps` (only `data` is a generic
  passthrough) — unlike nodeForms/*.svelte, which receive `onChange` as an
  ordinary prop because they're rendered directly in WorkflowCanvasInner's
  own template, not instantiated by @xyflow/svelte's internals. Resolved via
  a small Svelte context bridge (`edgeContext.ts`): a single reactive
  (`$state`) object (`hoveredEdgeId`, `onDeleteEdge`) set once via
  `setContext` in WorkflowCanvasInner and read via `getContext` in
  WorkflowEdge — the standard Svelte-Flow-recommended escape hatch for
  exactly this (a delete/hover affordance rendered inside a custom edge),
  not a bespoke pattern.
- The delete button (`EdgeLabel` positioned at the edge's bezier midpoint,
  same point `getBezierPath` gives the built-in "default" edge's own label)
  sits exactly where a click at the visual midpoint of the edge lands —
  confirmed via real-browser manual testing (see below) that clicking that
  exact point hits the button (deletes), not the underlying path (selects);
  clicking anywhere else along the path selects. This matches how most
  flow-chart tools handle the same overlap and wasn't treated as a bug.
- `EdgeFormChange`'s `condition`/`priority` are `| null` (not
  `| undefined`-to-delete like `NodeAttrsPatch`) because `EditorEdge`
  already models them as always-present, nullable fields
  (`Option<String>`/`Option<i32>` in `graph/mod.rs`), not entries in a
  generic attrs bag — the patch shape mirrors the real wire shape instead of
  reusing `NodeAttrsPatch`'s "undefined deletes" convention, which doesn't
  apply here. `loop_restart` defaults to `false` server-side
  (`extract_loop_restart`) and is never absent, so it's a plain boolean.
- `EdgeForm.svelte`'s priority field validates it's a parseable integer
  client-side (whole numbers only, matching `extract_priority`'s own
  resolve-time rejection of a non-integer value) and surfaces a visible
  error without calling `onChange` for an invalid value, the same
  "surface the problem instead of writing something guaranteed to fail on
  save" discipline `ToolForm`/`ManagerForm` already apply to invalid JSON.
- Selecting a node closes an open edge inspector and vice versa (one shared
  side-panel slot, not two independent panels) — `{:else if selectedEdge}`
  after the existing `{#if selectedNode}` block, not a second always-mounted
  `{#if}`, so the two states are structurally exclusive rather than merely
  usually-exclusive by convention.
- `selectEdge(edgeId)` and `edgeActions` (the same object WorkflowEdge.svelte
  reads via context) are exported from WorkflowCanvasInner.svelte for tests
  to call directly. This mirrors Task 4's own established precedent
  (`addNodeAtPosition` exported because the real HTML5 drag-and-drop
  *gesture* isn't reliably simulatable in jsdom) — confirmed empirically
  while writing this task's tests that jsdom renders **zero**
  `.svelte-flow__edge` DOM elements at all for any graph with edges (not
  just malformed/NaN path geometry the way node-count checks already
  documented for edge *paths* — `store.visible.edges` is empty outright in
  jsdom), so no synthetic DOM click/hover event can reach an edge there.
  Real-browser Playwright testing (below) confirms edges render and are
  fully interactive outside jsdom — this is a test-environment gap, not an
  app bug, and not a hypothesis: confirmed both ways.

**Real discovery (empirical, while building the real-browser manual check):**
jsdom's inability to render `.svelte-flow__edge` at all (not merely with bad
geometry) wasn't previously documented anywhere in this codebase — Task 4's
own comment about edge rendering in jsdom only covers edge *path* geometry
for the node-count test, not DOM presence. Confirmed via a probe test during
this task (see `WorkflowCanvasInner.svelte`'s `selectEdge`/`edgeActions`
export comments) and cross-confirmed against a real Chromium session where
the same graph renders 3 real `.svelte-flow__edge` elements with correct
`data-id`s and full interactivity — i.e. this is specifically a jsdom
limitation, not a bug in the edge-rendering code itself.

**Verification:**
- [x] Tests pass: `npm test` — 106 passed, 0 failed (was 85 before this
      task: +8 `EdgeForm.test.ts`, +1 `convert.test.ts` mixed-pos-fixture
      case, +12 new `WorkflowCanvasInner.test.ts` cases covering connection-
      handle classing, the edge inspector panel, and `edgeActions` hover/
      delete); `npm run check` (svelte-check + tsc) — 285 files, 0 errors,
      0 warnings
- [x] Build succeeds: `npm run build` — `dist/workflow-canvas.js` (390.50 kB,
      101.74 kB gzipped) + `dist/editor-ui.css` (16.32 kB, byte-identical —
      this task's new CSS lives entirely in per-component `<style>` blocks,
      which `customElement: true` compilation bundles as constructable
      stylesheets into the JS output, not the separate CSS file); confirmed
      zero `process.env` references survive in the rebuilt bundle (Task 5's
      known Vite-lib-mode gap, re-checked per this repo's own convention for
      every task that rebuilds `dist/`)
- [x] `cargo test --workspace` (unaffected — this task touched only
      `editor-ui/`, no Rust files) and `cargo clippy --workspace` both still
      green, same 5 pre-existing `sort_by` warnings in `smasher-attractor`'s
      `state.rs`/`stats.rs`, untouched by this task
- [x] Manual: real server (`build_router` wired to a throwaway example
      binary, per this repo's no-API-key sandbox workaround — deleted after
      use) + real-Chromium Playwright (`playwright-core` via `npm install
      --no-save`, uninstalled afterward, `package.json`/`package-lock.json`
      untouched). Built a fixture (`task8-fixture.dot`) with 4 nodes (1 with
      an explicit `pos`, 3 without) and 3 edges (one with real `condition`/
      `priority`/`loop_restart`). Confirmed: nodes render at 4 distinct
      non-overlapping positions (explicit `pos="0,0"` honored, the other 3
      get the grid defaults `220,0`/`440,0`/`660,0`, matching each node's own
      array index); every connected node's handles are accent blue
      (`rgb(59, 130, 246)`) and opacity 1 even without hovering (this task's
      own "stays visible once connected" design choice, above); the
      handle-hidden/hover-reveal/connected-accent CSS rules are present in
      the compiled stylesheet; clicking an edge (at a point along its real
      path geometry, not its visual midpoint — see the delete-button-overlap
      design note above) opens the edge inspector pre-populated with its
      real `condition`/`priority`/`loop_restart` (`approved`/`2`/checked for
      the `Ask->Exit` edge); hovering an edge's midpoint reveals its delete
      button, and clicking it removes the edge (3 edges → 2, confirmed via
      DOM count); clicking Save with an unchanged graph writes explicit
      `pos` for every node, and reopening the file shows the exact same
      positions (not re-randomized); re-parsed/resolved the saved file with
      the real Rust `dot::parser::parse`/`graph::resolve` functions directly
      — clean. Separately verified a **single-field edit** end-to-end:
      selected the `Ask->Exit` edge, changed `priority` 2 → 9 via the real
      form, saved, then parsed+resolved both the before/after files with
      real Rust code and asserted node-by-node/edge-by-edge equality
      (excluding `pos`, per the spec's own success criterion) — confirmed
      only the intended edge's `priority` differs, everything else
      (including `node_type` still deriving correctly through the
      re-synthesized `shape` — e.g. `Mdiamond`→`circle` for Start, both
      `NodeType::Start`) is unchanged. Also exercised an equivalent of
      Checkpoint D's walkthrough #1 "build from scratch" step: `/workflows/
      new` renders the palette (3 groups) and create-mode name/dir fields
      correctly; built a Codergen→Interviewer(gallery-gate)→Exit graph via
      the real `POST /api/workflows/new` (a legitimate substitute for a
      simulated HTML5 palette drag — Task 4 already documented that gesture
      isn't reliably simulatable even in a real browser via Playwright's
      low-level input, since it requires native OS drag semantics), reopened
      it in `/workflows/{id}/edit`, confirmed the Codergen and gallery-gate
      Interviewer forms populate every real attr correctly (prompt, model,
      question, gallery checked, candidate_count "3"), saved, and
      re-parsed/resolved the result — clean, 4 nodes/3 edges. Zero
      `pageerror`s across every session. Throwaway example binaries,
      `playwright-core`, and all temp workflow/data directories removed
      afterward — confirmed via `git status` showing only the intended
      source/dist files changed.

**Dependencies:** Task 7 (shares the same selected-element side-panel
mechanism the node forms use, just for edges instead of nodes)

**Files touched:**
- `smasher/crates/smasher-web/editor-ui/src/types.ts` (added
  `EdgeFormChange`/`EdgeFormProps`)
- `smasher/crates/smasher-web/editor-ui/src/edgeContext.ts` (new — Svelte
  context key/type bridging WorkflowCanvasInner and WorkflowEdge)
- `smasher/crates/smasher-web/editor-ui/src/WorkflowEdge.svelte` (new —
  custom `edgeTypes` entry: bezier path + hover/selection-revealed delete
  button)
- `smasher/crates/smasher-web/editor-ui/src/EdgeForm.svelte` (new) +
  `EdgeForm.test.ts` (new)
- `smasher/crates/smasher-web/editor-ui/src/convert.ts` (touched:
  `toFlowEdges` sets `type: 'workflow'`)
- `smasher/crates/smasher-web/editor-ui/src/convert.test.ts` (touched:
  +1 mixed pos/no-pos test verifying Task 4's existing logic already
  satisfies this task's acceptance criteria)
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvasInner.svelte`
  (touched: edge selection state, edge inspector panel, `edgeTypes`/
  `defaultEdgeOptions`/`onedgeclick`/`onedgepointerenter`/`onedgepointerleave`
  wiring, `edgeActions` context object, `connectedNodeIds` effect,
  handle-hover/connected-accent CSS)
- `smasher/crates/smasher-web/editor-ui/src/WorkflowCanvasInner.test.ts`
  (touched: +12 Task 8 integration tests)
- `smasher/crates/smasher-web/editor-ui/dist/workflow-canvas.js` (rebuilt;
  `dist/editor-ui.css` unchanged — see build note above)

**Estimated scope:** Medium — held.

**Done.** Commit: `c54cfcb` on `feat/workflow-catalog`.

---

### Checkpoint D

- [x] `npm test` (full frontend suite) green — 106 passed, 0 failed
- [x] Manual walkthrough #1 (build from scratch): equivalent exercised and
      verified up through "confirm the written `.dot` file re-parses and
      resolves cleanly" (fully verifiable, done via the real Rust parser/
      resolver — see Task 8's own verification write-up above for the exact
      graph and result). Node/edge *creation* itself was exercised via the
      real `POST /api/workflows/new` API rather than a simulated palette
      drag-and-drop gesture, because Task 4 already established (and this
      task's own attempts reconfirmed) that a simulated HTML5 drag gesture
      isn't reliably producible even in a real browser via Playwright's
      low-level input APIs (no native OS-level drag semantics) — the
      resulting graph, forms, and save/parse/resolve path are identical
      regardless of how the graph was assembled, so this substitution proves
      the same thing the spec's walkthrough is checking for. **The final
      step — "run it end-to-end from workflow-run-shell's Run button" — is
      genuinely unverifiable in this sandboxed environment**, same
      limitation Task 7 already hit and documented: actually running the
      pipeline engine requires a real LLM API key (`ANTHROPIC_API_KEY`
      etc.), which isn't configured here. Marked `[~]` below rather than
      skipped silently or falsely claimed as tested.
- [x] Manual walkthrough #2 (edit existing): fully exercised and verified —
      opened an existing hand-written fixture in `/workflows/{id}/edit`,
      confirmed every field populated from real attrs, changed exactly one
      field (an edge's `priority`) via the real form, saved, and proved via
      real Rust parse+resolve (not a text diff, which the full-regeneration
      save strategy makes noisy at the byte level by design — see Assumption
      3) that only the intended field differs at the `Graph` model level,
      modulo position data per the spec's own success criterion

**Run-button walkthrough step:** `[~]` — unverifiable in this sandboxed
environment (no `ANTHROPIC_API_KEY`/LLM credentials configured), same
documented limitation as Task 7's own Checkpoint C write-up. Everything
verifiable without a real LLM call (build/load, form population and edits,
save, parse, resolve) was actually exercised against real server code and a
real browser, not skipped or assumed.

---

## Task 9: Cutover — Edit link, test path updates

**Description:** `workflow_detail.html`'s DOT preview block (currently a
bare `<pre class="dot-source-preview">{{ dot_source }}</pre>` right after the
`<h2>`) gains an "Edit" link to `/workflows/{id}/edit`. Update every existing
test in `routes/pages.rs` that asserts against the literal `/workflows/new`
path for the raw-paste form to instead target `/workflows/new/raw` (the
handler and its behavior are unchanged — only the route string in the test's
request/assertions moves).

**Acceptance criteria:**
- [x] `GET /workflows/{id}` (workflow_detail) response body contains a link
      to `/workflows/{id}/edit` — new `workflow_detail_links_to_the_edit_route`
      test (written first, confirmed RED before the template change, then
      GREEN); doesn't conflict with the pre-existing
      `workflow_detail_shows_dot_source_read_only_with_no_edit_form` test,
      which specifically guards against a raw-DOT-*editing* form
      (`name="dot_source"`/`action="/workflows..."`), not a link to the
      real visual editor
- [x] Every pre-existing `workflow_new`-path test passes unmodified except
      for the literal path string, now `/workflows/new/raw` — **already
      done**, discovered rather than redone: Task 5's own route-relocation
      work already moved these when it built `/workflows/new/raw`. Verified
      by grep: the only tests still asserting the literal `/workflows/new`
      path are `new_workflow_editor_renders_canvas_with_empty_graph_and_no_workflow_id`
      and `new_workflow_editor_bootstraps_available_target_dirs`, both of
      which are correctly testing the *new* editor route Task 5 built at
      that path, not the relocated raw-paste form — left untouched, moving
      them would have been wrong
- [x] No other existing `workflow_catalog`/`workflow_run_shell`/`/runs/*`
      test needed any change (confirms this module's cutover is additive at
      the template/test-path level only) — confirmed: `cargo test -p
      smasher-web` went from 196 to 197 passing (exactly the one new test),
      0 failed

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (197 passed); also
      `cargo test --workspace` (0 failed)
- [x] Build succeeds: `cargo check -p smasher-web` (and `--workspace`)
- [x] `cargo clippy -p smasher-web` — 0 new warnings in touched files
- [x] Manual: click through from `/workflows/{id}` to the new Edit link in a
      browser, confirm it lands on a populated editor — verified via a real
      Chromium instance (Playwright) against a real server (throwaway
      example binary, deleted after use, per the established workaround for
      this sandbox's missing LLM API keys): navigated to a workflow's
      detail page, clicked the real "Edit" link (`href` confirmed to be
      `/workflows/{id}/edit`), landed on the edit route, canvas rendered
      all 3 real nodes from the fixture, zero page errors

**Done.** Commit: `8fa0b6d` on `feat/workflow-catalog`.

---

## Task 10 (Checkpoint E, final): Full regression + sign-off

**Description:** No new code — verify the whole module against
`SPEC-workflow-editor.md`'s Success Criteria as a single pass, then close out
the module's bookkeeping.

**Acceptance criteria (mirrors the spec's Success Criteria):**
- [x] `cargo test --workspace` and `cargo clippy --workspace` pass with zero
      new warnings in any file this module touched; `npm test` (frontend
      suite) passes — re-ran all three fresh at the end of Task 9: workspace
      2500+ tests, 0 failed; workspace clippy shows exactly 7 warnings, all
      in files this module never touched (`smasher-llm/src/util/sse.rs`,
      `smasher-attractor/src/dot/lexer.rs`, `parallel.rs`, `state.rs` ×2,
      `stats.rs` — confirmed by grepping every warning's file path); `npm
      test` 106 passed, 0 failed
- [x] `/workflows/new` renders `<workflow-canvas>` with a palette matching
      the Agent Flow-derived layout; a human can add nodes of every
      `NodeType`, configure kind-specific attributes, connect edges, and
      save; the written `.dot` file parses/resolves and runs correctly from
      `workflow-run-shell`. **Verified end-to-end against a real server and
      real Chromium (Playwright), with one sub-item unverifiable in this
      sandbox — see below, not skipped silently:**
      - Built a workflow entirely from scratch: filled the create-mode
        name/target-dir fields (Task 5b); real palette drag-to-create
        (Task 6) for Start/Codergen/Interviewer/Exit nodes; real
        handle-to-handle connect-drag gestures (genuine mouse down/move/up,
        not simulated events) for Start→Codergen and Codergen→Interviewer
        (a third connect attempt was lost to viewport-geometry flakiness in
        the *verification script itself*, not the app — documented, not
        hidden); filled in Codergen's real form (prompt/model) and
        Interviewer's real form (question, gallery toggle, candidate_count);
        saved via the real Save button (→ `createGraph`, Task 5b's approved
        flow), which redirected to `/workflows/{new-id}/edit` as expected.
      - The written `.dot` file was parsed and resolved with the real
        `dot::parser::parse`/`graph::resolve` functions: 4 nodes, 2 edges,
        every node type correctly inferred from its shape (confirming
        Task 1's fix still holds), every form-entered attr present and
        correctly typed (`gallery=Bool(true)`, `candidate_count` as
        entered, etc).
      - **Genuinely unverifiable here, not skipped**: actually running the
        saved workflow to completion via `workflow-run-shell`'s Run button
        needs a real LLM API key (`ANTHROPIC_API_KEY` etc.), which this
        sandboxed environment doesn't have — same limitation already
        documented in Task 8's write-up. Verified everything up to that
        point instead (file lands on disk, parses, resolves, every attr
        correct) — that's the part actually owned by this module; execution
        behavior itself is `workflow-run-shell`'s own, already-`Done` and
        unmodified by this module.
      - Along the way, cross-checked a real discrepancy that looked like it
        might be a bug: `examples/ask_and_execute.dot`'s `InterpretRequest`
        node uses `llm_model`/`llm_provider` attrs, but `CodergenForm`
        (Task 7) reads/writes `model`/`provider`. Re-grepped
        `handler.rs` directly to settle it: `CodergenHandler::execute` only
        ever reads `node.attrs.get("model")`/`get("provider")` — never
        `llm_model`/`llm_provider`. So `CodergenForm` is correctly wired to
        the attrs the real engine actually reads; the *fixture* has
        pre-existing dead attrs the engine silently ignores, unrelated to
        and pre-dating this module. Not a bug to fix here — logged for
        visibility since it looked alarming at first glance.
- [x] `/workflows/{id}/edit` opens an existing `.dot` file's graph
      pre-populated — every node's real attributes appear correctly in its
      form — and saving after a single-field change leaves every other
      node/edge equal (parses to the same `Graph`, modulo the one intended
      change and position data). Verified against the real, full 30-node
      `examples/ask_and_execute.dot` fixture: opened `/workflows/{id}/edit`,
      confirmed 30 nodes rendered, selected `InterpretRequest` and confirmed
      its real `prompt` populated the form correctly; changed only the
      `model` field, saved, then semantically diffed the on-disk file
      before vs. after with real Rust code (`graph::resolve` both, compare
      node-by-node/edge-by-edge excluding `pos`) — **exactly one diff found,
      in exactly the intended node**, and it was additive (`model` attr
      added; the fixture's own unrelated `llm_model`/`llm_provider` attrs on
      the same node were left untouched)
- [x] `render_to_dot`'s full-attribute round-trip is covered by a structural
      equality test with at least one fixture per `NodeType` (Task 2) —
      re-confirmed still passing:
      `rendering::tests::structural_round_trip_every_node_kind`
- [x] `workflow_detail.html`'s DOT preview links into the new editor route
      (Task 9); the raw-paste form remains reachable at `/workflows/new/raw`
      — re-confirmed live: `GET /workflows/new/raw` → 200, contains the
      real `dot_source` textarea form
- [x] No change to execution behavior for any existing pipeline — every
      pre-existing module's own test suite stays green — confirmed via the
      full `cargo test --workspace` run above (0 failed across every crate)
- [x] `capability-map.md`: flip `workflow-editor`'s status from "Spec draft"
      to "Done" — done, plus the archival narrative paragraph updated to
      match every prior `Done` module's pattern (including the Run-button
      limitation, same convention as `workflow-run-shell`'s own
      not-live-verified item)
- [x] Move `plan-workflow-editor.md`/`todo-workflow-editor.md` into
      `tasks/archive/`, matching every prior `Done` module's pattern — done
      immediately after this entry was written

**Verification:**
- [x] All boxes above checked with direct evidence (test output, a browser
      screenshot/observation), not "looks right" — every item above has
      concrete evidence (exact test counts, exact diff counts, exact
      grepped source lines) rather than a bare "confirmed" or "looks right"

**Dependencies:** Tasks 1-9 all complete — all nine (plus the Jobsworth-approved
Task 5b addendum) are `[x]`/"**Done.**" above with their own commit hashes
on `feat/workflow-catalog`; nothing outstanding.

**Sign-off:** `workflow-editor` (Module 3 of the design-workflow-dashboard
redesign) is **Done**. Ten commits across Tasks 1-9 (+ addendum 5b) on
`feat/workflow-catalog`, all independently re-verified (not just trusted from
each task's own report) before this sign-off: `3921100`, `d09a3e5`,
`32cc802`, `e72baa4`, `b7c258a`, `57ce794`, `09f06a0`, `f419d84`, `c54cfcb`,
`8fa0b6d`. No code change accompanies this task — verification and
bookkeeping only, per its own scope.

**Files likely touched:**
- `design-factory/capability-map.md` (status flip)
- `design-factory/tasks/` → `design-factory/tasks/archive/` (this plan/todo
  pair, once Done)

**Estimated scope:** Small (no new code — verification and bookkeeping only)
