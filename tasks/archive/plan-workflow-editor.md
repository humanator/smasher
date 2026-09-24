# Implementation Plan: `workflow-editor` (Module 3)

## Overview

`workflow-editor` is Module 3 of the design-workflow-dashboard redesign
(`design-factory/SPEC-workflow-editor.md`, status "Spec draft" per
`capability-map.md`). It replaces the two remaining raw-DOT-paste/preview
surfaces — `workflow_new.html`'s textarea/upload create form and
`workflow_detail.html`'s read-only `<pre>` DOT block — with a real visual
node/edge editor: a Svelte Flow canvas compiled to a single `<workflow-canvas>`
Web Component, styled after AntV X6's "Agent Flow" showcase example, talking
to a new small JSON graph API. Depends on `workflow-catalog` (Done, archived);
parallelizable with the already-`Done` `workflow-run-shell`.

Grounded by reading the actual current code immediately before writing this
plan (not the spec's illustrative snippets alone, two of which don't match
reality — see Architecture Decisions):

- `crates/smasher-attractor/src/dot/ast.rs:50-55` — `DotValue` is a 4-variant
  enum (`String`, `Number(f64)`, `Duration(std::time::Duration)`, `Bool`), not
  a bare string. `crates/smasher-attractor/src/graph/mod.rs:39-45`'s
  `NodeAttrValue` mirrors it 1:1 (`convert_value()`, mod.rs:180-187).
- `graph/mod.rs:49-54` `GraphNode { id, node_type, label: Option<String>,
  attrs: HashMap<String, NodeAttrValue> }`; `:78-88` `GraphEdge { from, to,
  label, condition: Option<String>, priority: Option<i32>, loop_restart: bool,
  attrs }`; `:92-99` `Graph { name, nodes, edges, default_node_attrs,
  default_edge_attrs, graph_attrs }`. None of `Graph`/`GraphNode`/`GraphEdge`
  derive `PartialEq` today (only `#[derive(Debug, Clone)]`) — needed for the
  spec's planned round-trip equality test; safe additive derive since every
  field type already supports it (`String`, `Option<String>`, `NodeType`
  (`PartialEq, Eq`), `HashMap<String, NodeAttrValue>` (`NodeAttrValue` is
  `PartialEq`), `Vec<...>`, `bool`, `Option<i32>`).
- `graph/mod.rs:198-211` `node_type_from_shape()` — the DOT `shape`→`NodeType`
  parse-direction mapping: `circle|point|Mdiamond`→Start,
  `doublecircle|Msquare`→Exit, `box|rectangle`→Codergen, `diamond`→Conditional,
  `hexagon|oval|ellipse`→Interviewer, `parallelogram`→Tool, `component`→Parallel,
  `tripleoctagon`→FanIn, `house`→Manager, unrecognized→Generic. **No shape maps
  to SubPipeline** (confirmed by an existing test,
  `no_shape_maps_to_sub_pipeline`, mod.rs:1030). A node with no `shape` attr at
  all defaults to `Codergen` (mod.rs:317-320), not `Generic`.
- `graph/mod.rs:316-329` (node) and `:352-357` (edge) — the generic `attrs`
  map is populated by excluding only `shape`/`label` (nodes) or
  `label`/`condition`/`priority`/`loop_restart` (edges) from the parsed
  attribute set — `style`/`fillcolor`/`fontcolor` are **not** filtered here,
  so if a hand-written file ever set them explicitly they'd land in `attrs`
  too. This confirms the spec's Code Style `DERIVED` constant
  (`["shape", "style", "fillcolor", "fontcolor"]`) is the correct skip-list
  for the writer side, even though only `shape` is actually stripped on parse.
- `graph/mod.rs:371-391` — edges referencing undeclared node ids don't error;
  `resolve()` silently auto-creates a stub node. No special handling needed
  in this module, just worth knowing (a dangling edge in the editor's exported
  graph won't be rejected by validation, it'll just materialize a Generic node
  server-side on next load).
- `graph/mod.rs:278` `pub fn resolve(dot_graph: &DotGraph) -> Result<Graph,
  ResolutionError>`; `ResolutionError` has exactly 2 variants:
  `DuplicateNode { id }` and `InvalidAttribute { key, message }` (only raised
  by `extract_priority` when `priority` isn't numeric).
- **`rendering.rs:210-239` `render_to_dot()`** — confirmed it emits only
  `id`, `label`, and 4 derived-from-`NodeType` values (`shape`/`style`/
  `fillcolor`/`fontcolor`, via `style_for_node_type()`, rendering.rs:90-159);
  `node.attrs` is never read. `render_edge()` (rendering.rs:185-204) emits
  only `from -> to` + optional `label`; `condition`/`priority`/`loop_restart`/
  `edge.attrs` are all dropped. `dot_escape()` (rendering.rs:164-167) is the
  only escaper today and is `&str`-only — insufficient for `Number`/`Duration`/
  `Bool` attrs, so the fix needs a new `NodeAttrValue`-aware formatter, not
  reuse of `dot_escape` alone.
- **`render_to_dot_with_status()` (rendering.rs:401-437) is a fully separate
  writer**, sharing only `render_edge()` with `render_to_dot()` (plus a
  verbatim-duplicated graph-preamble block). This is the mechanism behind a
  bug found during grounding (below): any attribute round-trip fix must land
  in a helper both writers call, or the two will silently re-diverge exactly
  as the shape tables already have.
- **Pre-existing bug, confirmed not fixed upstream** (`git diff origin/main`
  shows `origin/main`'s `rendering.rs` has the identical stale tables, with
  tests asserting the broken values as correct): `style_for_node_type()`
  (rendering.rs:90-159) renders `Tool` as `shape: "hexagon"` — which
  re-parses as **Interviewer**, not Tool — and `SubPipeline` as
  `shape: "component"` — which re-parses as **Parallel**, and has no shape
  of its own in `node_type_from_shape` at all, so no hand-authored `.dot`
  file can parse into a `SubPipeline` node today; `SubPipelineTransform`
  (`composition.rs`) is only ever exercised by unit tests constructing the
  struct directly. `git log` shows this is a leftover from `ae4f5c2`
  ("correct shape-to-NodeType mappings per spec"), which fixed the *parse*
  direction for `component`/`parallelogram`/`tripleoctagon` but never updated
  the matching *render* direction or gave SubPipeline a shape. **Confirmed
  with Jobsworth: fix both as a prerequisite task (Task 1)** — without it,
  saving/reloading a Tool or SubPipeline node in the new editor silently
  corrupts it into a different kind, breaking the spec's own round-trip
  success criteria. This crosses the spec's Boundaries "never change how
  NodeType is derived from shape" line, which is exactly why it was raised
  and confirmed explicitly rather than assumed.
- `handler.rs`, `interviewer.rs`, `tool_handler.rs`, `manager_handler.rs`,
  `composition.rs` — exact node-kind attribute contracts the editor's forms
  must match (key names, types):
  - Codergen (`handler.rs:227-269`): `prompt` (falls back to `label`),
    `model`, `provider`, `backend` (`"agent"` vs default) — all `String`.
  - Interviewer (`interviewer.rs:690-784`): `question`→`prompt`→`label`
    fallback chain; `question_source` (node-id string, resolved via
    `ArtifactStore`); `approve` (`Bool(true)` exactly, not the string
    `"true"`) for yes/no mode; `options` (comma-separated string); `gallery`
    (`Bool(true)` or `String("true")`, via the canonical
    `GraphNode::is_gallery_gate()`, mod.rs:63-73) for gallery-gate mode
    (structured `{selected, decision, comments}` JSON answer). Note: the
    spec's `candidate_count` attr wasn't found in `interviewer.rs` — flag as
    an editor-only convenience field or confirm its real source before
    building `InterviewerForm` (Task 7).
  - Tool (`tool_handler.rs:53-92`): `tool`→`label` fallback; `args` (JSON
    string, parsed via `serde_json::from_str::<Value>`, invalid JSON fails
    the run); `model`/`provider` folded into `args` JSON only if absent
    there.
  - Manager (`manager_handler.rs:49-90`): `task`→`label` fallback; `config`
    (JSON string, same parse-and-fail pattern as Tool's `args`); `model`/
    `provider` same fold-in behavior.
  - SubPipeline (`composition.rs:199-206`): `pipeline` (string path to a
    `.dot` file; missing → `CompositionError::MissingPipelineAttr`).
  - Edges (`graph/mod.rs:237-272`): `condition` (falls back to `label`),
    `priority` (must be numeric, cast `i32`), `loop_restart` (`Bool` as-is,
    or case-insensitive string `"true"`).
  - `ConditionalHandler` (handler.rs:161-184) itself reads nothing — the
    `condition` attribute lives on the **edge**, not the node.
- `.dot` fixtures usable for round-trip test coverage:
  `examples/ask_and_execute.dot` (richest — every structural shape, Tool with
  `tool_command`, Interviewer with `prompt`/`default_choice`, Codergen with
  `llm_provider`/`llm_model`/`goal_gate`/`retry_target`, edges with
  `condition`+`label`, graph-level `goal`/`default_max_retry` attrs),
  `examples/gallery_gate_showcase.dot` (gallery-gate path),
  `examples/old-examples/*.dot` (small per-feature minimal fixtures). Do
  **not** use `artifacts/*/graph.dot` (run-output, not authored fixtures).
- `crates/smasher-web/src/routes/pages.rs:337-341` `workflow_new` (GET) is
  trivial (renders `WorkflowNewTemplate` with `target_dirs`); `:348-387`
  `create_workflow` (POST) is the paste/upload handler — validates
  name/target_dir, calls `parser::parse` only (**not** `graph::resolve** —
  this handler is not the "parse+resolve" precedent), writes the file,
  redirects. `:408-449` `workflow_detail` (GET) resolves the workflow via
  `crate::workflows::resolve_workflow`, reads the file raw, renders
  `dot_source` as a plain string — no parse/resolve call, genuinely
  read-only. `WebError` (`error.rs:7-30`) already has `NotFound`/`BadRequest`/
  `Parse` (`#[from] ParseError` → 422)/`Graph` (`#[from] ResolutionError` →
  422)/`Io`/`Json` variants, already rendering as `{"error": ...}` JSON — this
  is a ready-made JSON error contract for `editor_api.rs`, no new error type
  needed.
- **The actual "parse via parser::parse, resolve via graph::resolve" JSON-API
  precedent is `routes/api.rs`'s `list_graph_nodes` (`api.rs:141-158`)**, not
  `create_workflow`. `editor_api.rs`'s handlers should mirror its shape:
  local request/response structs colocated with the handler, `Json<T>`
  extractor/return, `?` on `parser::parse`/`graph::resolve` relying on
  `WebError`'s `#[from]` conversions.
- `workflows.rs:8-21` `WorkflowSummary { id, name, source_dir, path }`;
  `:35-47` `scan_workflows`; `:52-54` `resolve_workflow(dirs, id) ->
  Option<WorkflowSummary>` (re-scans on every call, no persisted index);
  `:104-118` `root_name_for`/`slug_for` are `pub(crate)` — `editor_api.rs`
  needs the same crate-visibility access to compute a new file's id after
  writing it, same as `create_workflow` already does.
- `server.rs:22-52` `build_router` is the single composition point: each
  route module exposes `pub fn router() -> Router<AppState>`, `.merge()`d
  together, plus three existing `.nest_service(..., ServeDir::new(...))`
  mounts (`/static`, `/candidate-artifacts`, `/design-kit`). A 4th mount for
  the compiled `<workflow-canvas>` bundle follows the identical pattern.
  `tower-http = { version = "0.6", features = ["fs", "cors"] }` is already a
  `smasher-web` dependency (Cargo.toml:14) — the `fs` feature (→ `ServeDir`)
  is already enabled, no Cargo.toml change needed.
- `templates/workflow_new.html` (54 lines) already has a hint at line 8:
  *"Interim form — this gets replaced by a visual editor once workflow-editor
  ships."* — the template itself documents its own placeholder status.
  Upload is client-side `FileReader` into the same textarea, not a separate
  multipart path.
- `templates/workflow_detail.html` (30 lines) — DOT preview is exactly
  `<pre class="dot-source-preview">{{ dot_source }}</pre>` right after the
  `<h2>`. No existing "Edit" link/stub anywhere in the file.
- **`workflow_catalog.html` has no actual "Add Workflow" button/link to
  repoint** — checked in full; the empty-state text ("No workflows found. Add
  one to get started.") is plain text, not a link. The only route to
  `/workflows/new` is its direct `GET` registration
  (`routes/pages.rs:308`/router). So the spec's Assumption 8 "one-line
  repoint" is really: **the existing raw-paste page moves to a new path**
  (`/workflows/new/raw`), and `/workflows/new` itself becomes the new editor
  mount — not a link-target swap, since no such link exists yet.
- `design-kit/` (`smasher/design-kit/`) is the only prior Node-tooled package
  in this repo, and it has **zero build step** — plain `components.js`/
  `components.css`, `package.json` only wires `test:lint`/`test:e2e`
  (Playwright), no bundler, no `dist/`. `.github/workflows/ci.yml` is pure
  `cargo` (fmt/check/test/clippy jobs), no Node setup anywhere in CI. This
  settles the spec's Open Question: **checked-in built assets**, not a
  build-time step — matches "no Node process required at runtime," requires
  zero CI changes, and there's no existing precedent for a `build.rs`-invoked
  npm step to imitate instead. `node_modules/` gets its own `.gitignore`
  entry inside `editor-ui/`, mirroring `design-kit/.gitignore`.

## Architecture Decisions

- **Task 1 (shape-mapping fix) is a genuine prerequisite, not part of Task
  2's "attribute round-trip" work** — it's a different bug (wrong shape
  chosen, not "attrs dropped") in a different function
  (`style_for_node_type`, not `render_node`'s attrs handling), and Task 2's
  round-trip test can't pass for Tool/SubPipeline until it's fixed first.
  Fix: `style_for_node_type(Tool)` renders `shape: "parallelogram"` (already
  Tool's canonical parse-shape — zero parse-table change). `SubPipeline`
  gets a new, previously-unclaimed shape (`"folder"` — a valid Graphviz
  polygon shape not used elsewhere in this table) added to
  `node_type_from_shape`'s match arms, and `style_for_node_type(SubPipeline)`
  renders that same shape. Both of `origin/main`'s existing tests
  (`style_for_tool_node`, `style_for_sub_pipeline_node`) assert the old
  (wrong) shapes and must be updated to the new expected values as part of
  this task, not left red.
- **The attribute round-trip fix (Task 2) introduces one shared helper each
  for nodes and edges, called from both writers.** Concretely:
  `fn format_attr_value(v: &NodeAttrValue) -> String` (String → quoted+escaped
  via a value-aware extension of today's `dot_escape` logic; Number → bare
  `{v}`; Duration → `"{secs}s"` matching `DotValue`'s existing `Display`;
  Bool → bare `true`/`false`) plus `fn write_extra_attrs(out: &mut String,
  attrs: &HashMap<String, NodeAttrValue>, skip: &[&str])` used identically by
  `render_node`/`render_node_with_status` (skip list:
  `["shape","style","fillcolor","fontcolor"]`) and by `render_edge` (skip
  list: `["label","condition","priority","loop_restart"]`, plus emitting
  `condition`/`priority`/`loop_restart` themselves when present, which
  today's `render_edge` doesn't do at all). This is the concrete mechanism
  that keeps `render_to_dot` and `render_to_dot_with_status` from
  re-diverging — both call the same helper instead of each re-deriving their
  own attrs-to-DOT logic.
- **`pos="x,y"` needs zero backend-specific handling** — per spec Assumption
  5, it rides through as an ordinary entry in the generic `attrs` map once
  Task 2's round-trip fix exists. No `Graph`/`GraphNode` field, no special
  case in `rendering.rs` or `graph/mod.rs` beyond what the generic fix
  already provides. The "assign a default grid position when absent" logic
  (Assumption 5) is purely a Task 8 (frontend) concern.
- **`editor_api.rs` reuses `Graph`/`GraphNode`/`GraphEdge` directly as the
  JSON DTO shape** (per spec's Code Style — `EditorGraph`/`EditorNode`/
  `EditorEdge` structs are thin `serde` wrappers, not a hand-maintained
  parallel model), converting `NodeAttrValue` to/from `serde_json::Value` at
  the boundary (a `NodeAttrValue` already has an obvious `serde_json::Value`
  mapping: String→String, Number→Number, Bool→Bool, Duration→formatted
  string, since JSON has no native duration type).
- **The existing raw-paste create flow relocates to `GET /workflows/new/raw`,
  `POST /workflows` unchanged.** Only the GET page's route path moves (its
  handler function, `workflow_new`, and its target `POST /workflows` /
  `create_workflow` handler, are untouched) — this keeps every existing
  `create_workflow` test passing unmodified and confines the change to the
  handful of `workflow_new`-specific tests that assert on `/workflows/new`
  literally, which get updated to `/workflows/new/raw`.
- **Compiled `<workflow-canvas>` bundle ships as static files checked into
  git**, most simply inside `crates/smasher-web/editor-ui/dist/` (or copied
  into the existing `crates/smasher-web/static/` directory at build time by
  the developer — decide during Task 5 based on which keeps `ServeDir`
  wiring simplest; either way, `npm run build` is a manual step a developer
  runs after editing `editor-ui/src/`, not part of `cargo build`).

## Dependency Graph

```
Task 1: Tool/SubPipeline shape-mapping fix         (smasher-attractor)
                          │
                          ▼
Task 2: Full-attribute round-trip fix (shared writer helpers,
        PartialEq derives, structural round-trip test per NodeType)
                          │
              ── Checkpoint A: cargo test/clippy -p smasher-attractor
                 green; run_detail.html's status-overlay SVG view
                 (render_to_dot_with_status) unregressed ──
                          │
                          ▼
Task 3: JSON graph API — GET/PUT /api/workflows/{id}/graph,
        POST /api/workflows/new                     (smasher-web)
                          │
              ── Checkpoint B: cargo test -p smasher-web green;
                 new editor_api integration tests pass ──
                          │
                          ▼
Task 4: Svelte Flow custom-element scaffold — generic node/edge
        rendering, api.ts client, save/load wiring   (editor-ui/, new)
                          │
                          ▼
Task 5: Backend wiring — /workflows/new + /workflows/{id}/edit routes
        and templates, raw-paste relocated to /workflows/new/raw,
        static asset serving                         (smasher-web)
                          │
              ── Checkpoint C: manual browser pass — generic 2-node
                 graph created/saved/reloaded end to end ──
                          │
                          ▼
Task 6: Node-kind visual registry + palette sidebar   (editor-ui/)
                          │
                          ▼
Task 7: Node-kind form components (one per NodeType)  (editor-ui/)
                          │
                          ▼
Task 8: Edge polish (hover handles/delete) + edge attrs form +
        default grid position assignment              (editor-ui/)
                          │
              ── Checkpoint D: npm test green; full manual walkthrough
                 (build-from-scratch-and-run, edit-existing-fixture) ──
                          │
                          ▼
Task 9: Cutover — workflow_detail.html Edit link, existing
        /workflows/new tests moved to /workflows/new/raw
                          │
                          ▼
Task 10 (Checkpoint E, final): full workspace regression, sign-off,
        capability-map.md status flip, archive plan/todo pair
```

This is mostly one continuous vertical build — Tasks 1→5 each strictly gate
the next (can't have a JSON API without the round-trip fix; can't wire routes
without a canvas to serve). Tasks 6→8 (visual polish, forms, edge/position
handling) are more independent of each other and could parallelize across
sessions once Task 5's Checkpoint C is green, since they touch disjoint
frontend files (`nodeConfig.ts`+palette vs. `nodeForms/*.svelte` vs.
edge/position logic) sharing only the same `graph` state object — but the
spec's own vertical-slice instinct (build the palette before the forms that
populate from it) argues for sequential Tasks 6→7→8 in a single-session build
same as this plan orders them, with parallelization noted as an option, not
a requirement.

## Task summary

| Task | Files | What |
|------|-------|------|
| 1 | `graph/mod.rs`, `rendering.rs` | Tool/SubPipeline shape-mapping fix |
| 2 | `rendering.rs`, `graph/mod.rs` | Full-attribute round-trip + PartialEq + round-trip test |
| 3 | `routes/editor_api.rs` (new), `routes/mod.rs`, `server.rs` | JSON graph API |
| 4 | `crates/smasher-web/editor-ui/` (new) | Svelte Flow scaffold, generic canvas, save/load |
| 5 | `routes/pages.rs`, `templates/*`, `server.rs` | Route/template wiring, raw-paste relocation, static serving |
| 6 | `editor-ui/src/nodeConfig.ts`, palette component | Node-kind visual registry + palette |
| 7 | `editor-ui/src/nodeForms/*.svelte` | Per-`NodeType` form components |
| 8 | `editor-ui/src/` (edge/position logic) | Edge polish + edge attrs form + default positions |
| 9 | `templates/workflow_detail.html`, `routes/pages.rs` tests | Edit link, test path updates |
| 10 | — | Full regression, sign-off, `capability-map.md`, archive |

See `tasks/todo-workflow-editor.md` for full task-by-task acceptance criteria
and verification steps.

## Open Questions carried forward (not blocking, per spec)

- Exact `InterviewerForm` field for `candidate_count` — not found in
  `interviewer.rs` during grounding; confirm its real source (or drop it as
  an editor-only convenience with no engine effect) before building Task 7.
- Whether `editor-ui`'s built assets land in a new `editor-ui/dist/` mount or
  get copied into the existing `crates/smasher-web/static/` directory —
  deferred to Task 5, either is consistent with "checked in, not built at
  Cargo build time."
- Concurrent/stale-file edit conflicts — out of scope for v1 per spec
  (last-write-wins), unchanged by this plan.
- Whether the raw-DOT-paste fallback (`/workflows/new/raw`) stays permanently
  or is retired later — left for a post-v1 cleanup pass, per spec.
