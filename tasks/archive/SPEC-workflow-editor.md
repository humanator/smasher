# Spec: `workflow-editor` — Visual Node Editor for DOT Pipeline Files

Module id: `workflow-editor` (see `capability-map.md` and
`tasks/workflow-dashboard-design.md` Module 3). Depends on: `workflow-catalog`
(Done). Third module of the design-workflow-dashboard redesign, parallelizable
with the already-`Done` `workflow-run-shell`.

## Objective

Replace the two remaining "paste raw DOT text" surfaces —
`workflow_new.html`'s textarea/upload create form and `workflow_detail.html`'s
read-only `<pre>` DOT preview — with a real visual editor: a human selects,
adds, edits, and deletes nodes and edges on an interactive canvas, and saves
the result back to the workflow's `.dot` file. Covers both creating a new
workflow from scratch and editing an existing one.

Who uses it: the same design-focused human who already uses `workflow-catalog`
and `workflow-run-shell` — now authoring or adjusting a pipeline's structure
directly, instead of hand-writing DOT syntax or asking an agent to do it.

Success looks like: open the editor for a new workflow, drag out a Codergen
node and an Interviewer gallery-gate node, connect them, fill in each node's
kind-specific fields (prompt/model on the Codergen, question/candidate-count
on the gate), save — the file lands on disk as valid DOT, re-parses and
resolves cleanly, and runs correctly from `workflow-run-shell`'s Run button.
Reopening an existing hand-written `.dot` file in edit mode shows every node's
real attributes populated in its form (nothing silently dropped), and saving
a one-field change leaves everything else unchanged.

## Assumptions

Four decisions were confirmed with Jobsworth before drafting (canvas
framework and embedding strategy, visual/UX template, save strategy, and
v1 node-kind scope); the rest fill in underneath them, grounded in a full
read of `crates/smasher-attractor/src/`
(`dot/ast.rs`, `graph/mod.rs`, `rendering.rs`, `handler.rs`, `interviewer.rs`,
`tool_handler.rs`, `manager_handler.rs`, `composition.rs`) and
`crates/smasher-web/src/` (`routes/pages.rs`, `routes/gallery.rs`,
`workflows.rs`, `templates/workflow_new.html`, `templates/workflow_detail.html`)
— not guessed.

1. **This module reverses the "stays HTMX/askama, no frontend framework"
   decision** recorded in `Vision.md` and `tasks/workflow-dashboard-design.md`'s
   Non-Goals — but in a deliberately contained way. Confirmed with Jobsworth,
   after evaluating candidates against a React-Flow-grade polish bar (see
   `workflow-editor-library-comparison.html` in this directory for the full
   research): the canvas is built with **[Svelte Flow](https://svelteflow.dev/)**
   (`@xyflow/svelte`), compiled via Svelte's own compiler — no third-party
   wrapper — to a single custom element, `<workflow-canvas>`
   (`<svelte:options customElement={{ tag: "workflow-canvas", shadow: "none" }} />`).
   `shadow: "none"` renders it in light DOM rather than a Shadow Root, so
   Svelte Flow's own namespaced CSS (`.svelte-flow` classes, `--xy-*`
   variables) applies normally without the usual "inject the library's CSS
   into the shadow root" step a Shadow-DOM custom element would need. The
   rest of the app (`workflow_catalog`, `workflow_detail`'s live-run
   sections, `/runs/*`) stays exactly as it is — server-rendered
   HTMX/askama, untouched. `/workflows/new` and `/workflows/{id}/edit`
   (Assumption 8) each render an otherwise-plain askama template whose body
   is just the `<workflow-canvas>` tag plus whatever data attributes/JS
   bootstrapping it needs — not a separate mounted SPA shell. Complex data
   (the graph itself) crosses the custom-element boundary as a JS property
   set imperatively from a small inline script, not an HTML attribute
   string — normal for any Web Component carrying non-trivial data, not
   Svelte-specific. Two known risks, not blockers: Svelte 5's custom-element
   support still has [an open enhancement issue](https://github.com/sveltejs/svelte/issues/12114)
   on rough edges; and events crossing back out to the host page (e.g. a
   "saved" notification) need `new CustomEvent(name, { detail, bubbles: true, composed: true })`
   — `composed: true` specifically, or the event won't escape the element at all.
2. **Visual/UX template: AntV X6's "Agent Flow" showcase example**
    (`site/examples/showcase/practices/demo/agentFlow.ts` in
    [antvis/X6](https://github.com/antvis/X6); live at
    https://x6.antv.antgroup.com/en/examples/showcase/practices/#agentFlow).
    Confirmed with Jobsworth as the reference for how the builder should look
    and behave, reimplemented in Svelte Flow rather than ported as X6/React
    code. Concretely, carry over: a left-hand palette (Svelte Flow calls this
    a node "panel"/sidebar, not a built-in `Stencil` the way X6 has — this
    module builds its own) with collapsible groups of draggable node-kind
    entries; dedicated Start/Exit cards distinct from the working node kinds;
    each node rendered as a themed card — icon, title, a small delete
    affordance, and either a one-line description or an inline input
    depending on kind, color-coded per kind; connection ports/handles hidden
    until the node is hovered, turning an accent color once connected; a
    hover-revealed delete affordance on edges. Node-kind visual metadata
    (icon, title, description, theme color, palette grouping) is data-driven
    from a small config/registry keyed by `NodeType` (mirroring the source
    example's JSON-driven `AGENT_CONFIGS`), not hardcoded per component, so
    adding a node kind's *visuals* later doesn't mean touching every place
    that lists kinds. Suggested palette grouping, adapted from the source
    example's "Business Logic" / "Knowledge Base & Data" split onto this
    project's actual kinds: a "Pipeline Steps" group (Codergen, Tool,
    Manager) and a "Control Flow" group (Interviewer incl. gallery-gate,
    Conditional, SubPipeline) — left as a Plan-time detail to confirm, not
    pinned pixel-for-pixel by this spec.
3. **Save strategy is full regeneration from the `Graph` model**, confirmed
   with Jobsworth over a smaller text-preserving-patch alternative.
   `render_to_dot()` (`crates/smasher-attractor/src/rendering.rs:210-239`) is
   lossy today — it emits only `id`, `label`, and a *derived* visual style
   (`shape`/`style`/`fillcolor`/`fontcolor`, computed from `NodeType`), and
   silently drops every other authored attribute (`prompt`, `model`,
   `gallery`, `candidate_count`, `condition`, `priority`, `loop_restart`,
   `tool`/`args`, `task`/`config`, `pipeline`, ...). This module must extend
   it to iterate each node/edge's generic `attrs: HashMap<String,
   NodeAttrValue>` and emit every entry, not just the handful it knows about
   by name — see Code Style below. This fix is a prerequisite the rest of the
   module depends on and should be its own early task.
4. **All node kinds get real forms in v1** (Codergen, Interviewer incl.
   gallery-gate mode, Tool, Manager, Conditional, SubPipeline), confirmed with
   Jobsworth over a smaller first slice. `Start`/`Exit`/`Parallel`/`FanIn` are
   structural-only (`NodeType` is derived purely from the DOT `shape`
   attribute — `graph/mod.rs:198-211` — and these four kinds carry no
   attributes beyond `label` in any existing handler), so they get a
   minimal label-only form rather than a kind-specific one.
5. **Node canvas position has nowhere to live today** — DOT/Graphviz auto-lays
   out everything server-side (`rendering.rs`'s `run_graphviz()`); no code
   path reads or writes a stored x/y. Svelte Flow needs one per node to
   persist layout across reloads. Resolution: treat `pos="x,y"` as an
   ordinary generic node attribute — no new `Graph`/`GraphNode` field. It
   rides through on the same generic-attrs round-trip fix from Assumption 3,
   is ignored by the engine and every existing handler (none of them read
   `pos`), and a node with no `pos` (any pre-existing hand-written file) gets
   a default grid position assigned client-side on first load rather than
   failing.
6. **The editor talks to the backend via a small JSON graph API, not HTML
   fragments** — Svelte Flow needs a structured graph to render, diff, and
   patch; server-rendered markup doesn't fit. New routes are additive
   alongside the existing HTML-fragment routes, not a replacement of them.
7. **Frontend build lives in a new `crates/smasher-web/editor-ui/` directory**
   (Vite + Svelte + TypeScript + `@xyflow/svelte`, compiled with
   `compilerOptions: { customElement: true }` per Assumption 1), built via
   `npm run build` to static assets that `smasher-web` serves. Whether those
   built assets are checked into the repo or embedded/generated at Rust
   build time is an Open Question below, not decided here — either way
   `smasher serve` stays a single binary at runtime with no Node process
   required.
8. **Create and edit are the same screen.** `/workflows/new` (currently
   `workflow_new.html`'s textarea form) and a new `/workflows/{id}/edit`
   both mount the same `<workflow-canvas>` custom element — the first with
   an empty graph, the second pre-loaded from the existing file's parsed
   `Graph`. This resolves the forward reference in
   `tasks/workflow-dashboard-design.md`'s "Resolved tension" section:
   `workflow-catalog`'s "Add Workflow" button gets re-pointed at
   `/workflows/new`'s new editor mount, a one-line change on that module's
   side.
9. **Concurrent/stale-file edit conflicts are out of scope for v1** —
   last-write-wins, consistent with `create_workflow`'s existing behavior
   (no locking exists anywhere else in this codebase). Flagged as an Open
   Question rather than building optimistic concurrency control now.
10. **A saved file is validated before it's written**, same discipline
   `create_workflow` already applies to pasted DOT
   (`routes/pages.rs:376`): parse via `dot::parser::parse` and resolve via
   `graph::resolve`, reject the save with an error surfaced in the UI if
   either step fails, never write a graph that doesn't round-trip.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

Existing: Rust workspace (`smasher-attractor`, `smasher-web`; `axum` 0.8,
`askama`/`askama_axum` for the untouched HTMX pages). New: Svelte 5 +
TypeScript + `@xyflow/svelte` (Svelte Flow) + Vite, compiled to a single
`<workflow-canvas>` custom element per Assumption 1, confined to
`crates/smasher-web/editor-ui/`. No new Rust crate dependencies are expected
(`axum::Json` already covers the new API routes); flag any that turn out to
be needed per Boundaries below. No change to `smasher-attractor`'s execution
engine (`engine.rs`, the four node handlers) — this module only touches DOT
parsing/rendering and adds web surface.

## Commands

```bash
# Backend
cargo check -p smasher-attractor -p smasher-web
cargo test -p smasher-attractor graph
cargo test -p smasher-attractor rendering
cargo test -p smasher-web
cargo clippy --workspace

# Frontend (new)
cd crates/smasher-web/editor-ui
npm install
npm run dev      # local dev server, proxied to smasher-web's JSON API
npm test         # Vitest + @testing-library/svelte
npm run build    # compiles the <workflow-canvas> custom element to static assets smasher-web serves

# Whole-workspace regression
cargo test --workspace
cargo clippy --workspace

# Manual verification
smasher serve --workflows-dir examples
# open http://127.0.0.1:21541/workflows/new, add a Codergen node and an
# Interviewer gallery-gate node, connect them, fill in each form, save;
# confirm the written .dot file re-parses; open /workflows/{id}/edit on an
# existing hand-written fixture, confirm every node's real attrs populate
# its form; edit one field, save, confirm every other node/edge is
# unchanged; run the saved workflow from workflow-run-shell's Run button.
```

## Project Structure

```
crates/smasher-attractor/src/
  rendering.rs              # touched: render_to_dot iterates each node/edge's
                             #   generic attrs map and emits every entry
                             #   (skipping the handful of keys that are
                             #   re-derived, e.g. `shape` from NodeType, to
                             #   avoid emitting it twice), not just id/label

crates/smasher-web/src/
  routes/editor_api.rs       # new: GET  /api/workflows/{id}/graph  (existing file -> JSON)
                             #      PUT  /api/workflows/{id}/graph  (JSON -> validate -> write)
                             #      POST /api/workflows/new         (JSON -> validate -> write new file)
  routes/pages.rs             # touched: /workflows/new and new /workflows/{id}/edit
                             #   render a thin askama template whose body is
                             #   just the <workflow-canvas> tag (+ bootstrap
                             #   script), instead of workflow_new.html's
                             #   textarea form
  routes/mod.rs                # touched: register new routes
  static/ (or editor-ui/dist/) # new: built <workflow-canvas> custom-element
                             #   assets, served via tower_http::services::ServeDir

crates/smasher-web/editor-ui/  # new: Vite + Svelte 5 + TypeScript + @xyflow/svelte,
                             #   compiled to a single <workflow-canvas> custom
                             #   element (compilerOptions.customElement: true)
  package.json
  src/
    WorkflowCanvas.svelte       # the custom-element root: <svelte:options
                             #   customElement={{ tag: "workflow-canvas",
                             #   shadow: "none" }} /> wrapping <SvelteFlow>;
                             #   canvas, node/edge selection, palette, save
    api.ts                      # fetch wrappers for the JSON graph API
    nodeConfig.ts                # NodeType -> { icon, title, themeColor,
                             #   paletteGroup } registry per Assumption 2
                             #   (mirrors agentFlow.ts's AGENT_CONFIGS)
    nodeForms/                  # one form component per NodeType
      CodergenForm.svelte
      InterviewerForm.svelte     # includes gallery-gate mode toggle
      ToolForm.svelte
      ManagerForm.svelte
      SubPipelineForm.svelte
      StructuralForm.svelte      # Start/Exit/Parallel/FanIn: label only
  vite.config.ts                # svelte() plugin with customElement: true

crates/smasher-web/templates/
  workflow_new.html            # replaced: now just embeds <workflow-canvas>
  workflow_detail.html          # touched: DOT-source block gains an "Edit"
                             #   link to /workflows/{id}/edit

design-factory/
  SPEC-workflow-editor.md      # this file
  capability-map.md             # touched: workflow-editor row + status -> Done when complete
```

## Code Style

Full-attribute round-trip in the writer — the core fix Assumption 2 and 4
both depend on:

```rust
// crates/smasher-attractor/src/rendering.rs
fn write_node_attrs(out: &mut String, node: &GraphNode) {
    // Derived-from-shape keys are re-synthesized by style_for_node_type()
    // below and must not also be emitted from the generic map, or the
    // written file would carry two `shape=` attrs.
    const DERIVED: &[&str] = &["shape", "style", "fillcolor", "fontcolor"];
    for (key, value) in &node.attrs {
        if DERIVED.contains(&key.as_str()) {
            continue;
        }
        write!(out, ", {key}={}", dot_literal(value)).unwrap();
    }
}
```

JSON graph shape the editor API returns/accepts (mirrors `Graph` closely —
no separate DTO layer needed beyond `serde`):

```rust
// crates/smasher-web/src/routes/editor_api.rs
#[derive(Serialize, Deserialize)]
struct EditorGraph {
    name: String,
    nodes: Vec<EditorNode>,
    edges: Vec<EditorEdge>,
}

#[derive(Serialize, Deserialize)]
struct EditorNode {
    id: String,
    node_type: String,           // "Codergen", "Interviewer", ...
    label: String,
    attrs: HashMap<String, serde_json::Value>,  // pos, prompt, model, ... as-is
}

async fn get_graph(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<EditorGraph>, WebError> {
    let workflow = crate::workflows::resolve_workflow(&state.workflow_dirs, &id)
        .ok_or_else(|| WebError::NotFound(format!("workflow {id}")))?;
    let dot_source = std::fs::read_to_string(&workflow.path)?;
    let ast = smasher_attractor::dot::parser::parse(&dot_source)?;
    let graph = smasher_attractor::graph::resolve(&ast)?;
    Ok(Json(EditorGraph::from(&graph)))
}
```

Node data shape (kind-specific fields live in `attrs`, the form component
per `NodeType` reads/writes them), as consumed by Svelte Flow's node `data`
prop:

```ts
// crates/smasher-web/editor-ui/src/nodeConfig.ts
export type EditorNodeData = {
  nodeType: "Codergen" | "Interviewer" | "Tool" | "Manager"
    | "Conditional" | "SubPipeline" | "Start" | "Exit" | "Parallel" | "FanIn";
  label: string;
  attrs: Record<string, string | number | boolean>;
};

// icon/title/theme-color/palette-group per kind, mirroring agentFlow.ts's
// JSON-driven AGENT_CONFIGS rather than hardcoding visuals per component
export const NODE_KIND_CONFIG: Record<EditorNodeData["nodeType"], {
  icon: string; title: string; theme: "blue" | "green" | "orange" | "red";
  paletteGroup: "pipeline-steps" | "control-flow" | "structural";
}> = {
  Codergen: { icon: "LLM", title: "Codergen", theme: "blue", paletteGroup: "pipeline-steps" },
  Interviewer: { icon: "?", title: "Human Gate", theme: "orange", paletteGroup: "control-flow" },
  // ...one entry per NodeType
};
```

The custom-element root — Svelte's native compiler output, no third-party
wrapper (Assumption 1):

```svelte
<!-- crates/smasher-web/editor-ui/src/WorkflowCanvas.svelte -->
<svelte:options customElement={{ tag: "workflow-canvas", shadow: "none" }} />

<script lang="ts">
  import { SvelteFlow, Background, Controls, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  // set imperatively from host-page JS as a DOM property, not an attribute:
  // document.querySelector('workflow-canvas').graph = { nodes, edges };
  let { graph = $bindable() } = $props();

  function dispatchSaved(detail: unknown) {
    $host().dispatchEvent(
      new CustomEvent('workflow-saved', { detail, bubbles: true, composed: true }),
    );
  }
</script>

<SvelteFlow nodes={graph.nodes} edges={graph.edges}>
  <Background />
  <Controls />
  <MiniMap />
</SvelteFlow>
```

## Testing Strategy

Per this repo's testing standard: real filesystem fixtures, real axum test
requests, no mocking of the thing under test — extended to the new frontend
stack with real component rendering (Testing Library), not shallow mocks.

- **Unit (`smasher-attractor`, `rendering.rs`):** structural round-trip test
  — for a fixture `.dot` covering every `NodeType` with a representative
  attr set (`prompt`+`model` on Codergen, `gallery`+`candidate_count` on an
  Interviewer, `tool`+`args` on Tool, `task`+`config` on Manager, `condition`+
  `priority`+`loop_restart` on an edge), parse → resolve → `render_to_dot` →
  re-parse → re-resolve, assert the two `Graph`s are equal. This is the test
  that actually proves Assumption 2's "nothing silently dropped" requirement,
  not a spot-check of one field.
- **Unit:** a `.dot` with `pos="120,80"` on a node round-trips that value
  unchanged; a `.dot` with no `pos` on any node parses and renders without
  error (no position is not an error condition).
- **Integration (`smasher-web`, real axum test requests):** `GET
  /api/workflows/{id}/graph` for a known fixture returns JSON whose node/edge
  count and a representative attr per kind match the file; `PUT` with a
  modified graph (one node added, one edge removed) writes a new `.dot` file
  that a subsequent `GET` reflects, and that still parses/resolves cleanly;
  `PUT` with a graph that fails to resolve (e.g. an edge to a nonexistent
  node id) is rejected with an error response and the on-disk file is
  unchanged; `POST /api/workflows/new` writes a new file and returns its id;
  unknown workflow id → 404 on `GET`/`PUT`.
- **Frontend (Vitest + `@testing-library/svelte`):** each node-kind form
  renders its kind-specific fields and calls `onChange` with the right attrs
  shape; adding/deleting a node or edge on the canvas updates local graph
  state correctly; the save action calls the API client with the current
  graph; loading a graph with an unknown/future `NodeType` string doesn't
  crash the canvas (falls back to the structural/label-only form); the
  compiled `<workflow-canvas>` custom element accepts a `graph` property set
  imperatively and re-renders, and a `workflow-saved` `CustomEvent` fired
  from inside it is observable on the host element (`composed: true`
  reaching outside the element, per Assumption 1).
- **Manual (Browser tool):** build a small graph from scratch in
  `/workflows/new` (Codergen → Interviewer gallery-gate → Exit), save, run it
  end-to-end from `workflow-run-shell`; open `/workflows/{id}/edit` on an
  existing hand-written fixture with several node kinds, confirm every
  field populates correctly, change one field, save, confirm the diff on
  disk touches only the intended node.
- **Regression:** `cargo test --workspace` and `cargo clippy --workspace`
  stay clean; every existing `workflow_catalog` and `workflow_run_shell`
  route test passes unchanged; `run_detail.html`'s Graphviz-SVG live-run
  view (a separate rendering path — execution-status overlay via
  `render_to_dot_with_status`) still renders correctly, proving the writer
  fix didn't regress that path.

## Boundaries

- **Always do:** keep the execution engine (`engine.rs` and all four node
  handlers) completely untouched — this module only touches DOT
  parsing/rendering and adds web surface, never pipeline execution
  semantics; validate every save (parse + resolve) before writing to disk,
  never write a graph that doesn't round-trip; follow the two-line
  `ABOUTME:` header convention and TDD (test first) per this repo's
  `CLAUDE.md`, extended to the new frontend (test first there too); run
  `cargo test --workspace`, `cargo clippy --workspace`, and `npm test`
  before considering a task done.
- **Ask first:** any new Rust crate dependency beyond `axum::Json` (none
  expected); checked-in built frontend assets vs. a build-time step to
  produce them (Open Question below); removing `workflow_new.html`'s raw
  DOT-paste/upload code path outright rather than keeping it reachable as a
  fallback — per the global instruction to request permission before
  rewriting existing implementations, the recommendation is to keep it at a
  secondary URL for power users/debugging rather than delete it; changing
  `dot::ast.rs`, `dot::parser.rs`, `handler.rs`, `interviewer.rs`,
  `tool_handler.rs`, `manager_handler.rs`, or `composition.rs`.
- **Never do:** add, remove, or redefine a `NodeType` variant or change how
  one is derived from `shape`; change engine dispatch or any handler's
  `execute()` semantics; touch `/runs` or `workflow-run-shell`'s live-run
  sections; silently drop an attribute on save; introduce a second DOT
  writer that disagrees with the one `workflow-run-shell`'s status-overlay
  path (`render_to_dot_with_status`) uses — both must share the same
  attribute round-trip fix.

## Success Criteria

- `cargo test --workspace` and `cargo clippy --workspace` pass with zero
  warnings; `npm test` (new frontend suite) passes.
- `/workflows/new` renders the `<workflow-canvas>` Svelte Flow custom
  element with a palette matching the Agent Flow-derived layout (Assumption
  2); a human can add nodes of every `NodeType`, configure kind-specific
  attributes, connect edges, and save; the written `.dot` file parses and
  resolves without error and runs correctly from `workflow-run-shell`.
- `/workflows/{id}/edit` opens an existing `.dot` file's graph pre-populated
  — every node's real attributes (prompt, model, gallery config, tool/args,
  task/config, edge condition/priority/loop_restart) appear correctly in its
  form — and saving after a single-field change leaves every other
  node/edge equal (parses to the same `Graph`, modulo the one intended
  change and position data).
- `render_to_dot`'s full-attribute round-trip is covered by a structural
  equality test (parse → resolve → render → re-parse → resolve → assert
  `Graph` equality) with at least one fixture per `NodeType`.
- `workflow-catalog`'s "Add Workflow" button and `workflow-detail.html`'s DOT
  preview both link into the new editor routes — the forward reference in
  `tasks/workflow-dashboard-design.md` is resolved.
- No change to execution behavior for any existing pipeline: every
  pre-existing module's own success criteria and test suite stays green.

## Open Questions

- Exact palette grouping and node-card visual details (icon glyphs, theme
  colors per kind, whether to reproduce the Agent Flow example's card layout
  faithfully or use it only as a structural reference) — Assumption 2
  suggests a starting grouping but leaves the pixel-level design to Plan
  time/implementation, not this spec.
- Whether built frontend assets are checked into the repo (simplest, but
  adds generated JS to git history) or produced by a build step (CI or a
  Cargo `build.rs` invoking `npm run build`) — a real tradeoff, left for
  Plan phase.
- Concurrent/stale-file edit conflicts (two browser tabs, or a human
  hand-editing the file while a browser tab has it open) — deferred to
  last-write-wins for v1, not solved here.
- Whether the raw-DOT-paste fallback form stays permanently as a power-user
  escape hatch or is retired once the editor is proven — left for a later
  cleanup pass, not blocking v1.
- Whether Graphviz's native support for a `pos` attribute on pre-laid-out
  input could let the run-view's static SVG (`render_to_dot_with_status`)
  reuse the editor's saved layout instead of re-auto-laying-out every time —
  a possible nice-to-have, not required for this module's success criteria.
