# Implementation Plan: Editor batch (BACKLOG #3, #4, #5)

Tasks: [`todo-editor-batch.md`](todo-editor-batch.md). Source: [`BACKLOG.md`](BACKLOG.md) P1 #3, P2 #4 and #5.
These files sit next to the claude-cli provider's `plan.md`/`todo.md`, which still have open
manual checkpoints. Leave those files alone.

## Overview

Three fixes to the workflow editor's canvas and save path, done on one branch because they share
the save path:

- **#3** A node dropped from the palette lands where the pointer is, even after pan or zoom.
- **#5** Hand-written `node [...]` / `edge [...]` default blocks survive a save from the editor.
- **#4** Saving over a file that changed on disk since the editor loaded it is refused with 409.
  It no longer silently wins.

**Branch:** `feat/editor-save-batch`, cut from `main` (`1ff6f28`), **not** from
`feat/claude-cli-provider`. Move these two plan files onto that branch when work starts. They're
untracked, so a checkout carries them over.

## What the code does today (checked 2026-09-24)

- **Drop position.** `WorkflowCanvas.svelte:336-342` (`handleDrop`) uses `clientX - rect.left` in
  screen space. `<SvelteFlow fitView>` means the viewport is almost never the identity transform,
  even on a freshly opened canvas. So the bug hits nearly every drop onto an existing workflow, not
  only after pan or zoom. The comment at `:139-150` explains why `screenToFlowPosition` wasn't used:
  the component's own `<script>` sits outside the `<SvelteFlow>` context.
- **Default blocks.** `graph::resolve` (`smasher-attractor/src/graph/mod.rs:296-306`) stores
  `node [...]`/`edge [...]` in `Graph::default_node_attrs`/`default_edge_attrs`. The engine
  only uses the node default's `shape` (`resolve_shape`). `EditorGraph::into_graph`
  (`editor_api.rs:192`) sets both maps to empty, and `render_graph_preamble`
  (`rendering.rs:256`) always writes its own hardcoded
  `node [fontname="Helvetica" fontsize=12]` / `edge [fontname="Helvetica" fontsize=10]`.
  **What actually gets lost:** node types survive, because `render_node` writes an explicit `shape`
  for every node. What's lost is every other default (colours, fonts, and any `model`/`prompt`-style
  defaults a human put there). It's a file-fidelity bug, not an execution-semantics bug.
- **Save.** `put_graph` (`editor_api.rs:281`) resolves the path and overwrites it without checking
  anything. `updateWorkflowGraph` (`frontend/src/lib/api/workflows.ts:87`) throws `HTTP <status>`
  and drops the body. `WorkflowEditorPage.svelte:28-35` catches save errors into the page-level
  `error`, and `{:else if error}` then **unmounts the canvas**. Any failed save today throws away
  the user's unsaved edits. With #4 adding a new, expected failure, this has to be fixed in the
  same slice.

## Architecture Decisions

1. **#3: a child "bridge" component inside `<SvelteFlow>`, not a restructure.** Add a tiny
   `FlowPositionBridge.svelte`, rendered as a child of `<SvelteFlow>`. It calls `useSvelteFlow()`
   and hands `screenToFlowPosition` back through a callback prop. `handleDrop` then passes
   `{x: clientX, y: clientY}` straight to it. The backlog suggests wrapping in
   `<SvelteFlowProvider>`, but that would mean splitting `WorkflowCanvas` in two (the outer
   provider plus an inner component). Its exported `currentGraph()`/`addNodeAtPosition()` and the
   whole Vitest suite depend on it being one component. The bridge gives the same result in about
   15 lines. `addNodeAtPosition` keeps taking flow coordinates, so the existing tests stay valid.
2. **#5: preserve the defaults on the server, from the file being overwritten.** `put_graph`
   already has to read the existing file for #4. It resolves that file and copies its
   `default_node_attrs`/`default_edge_attrs` onto the graph before rendering. `EditorGraph` and
   the SPA don't change. The editor can't edit defaults today and isn't asked to. `render_graph_preamble`
   merges them: the hardcoded font keys come first, then the file's own defaults override them,
   with keys sorted (`write_extra_attrs` already sorts). Merging is idempotent, so a second save
   produces a byte-identical preamble. Create and import don't need this: a new graph has no
   defaults, and import writes the bytes as given.
3. **#4: a strong `ETag` (SHA-256 of the file bytes), sent back as `If-Match`, 409 on mismatch.**
   - `GET /api/workflows/{id}/graph` and a successful `PUT` both return `ETag: "<sha256-hex>"`.
     `sha2` is already a workspace dependency, and `smasher-web` adds it.
   - `PUT` with `If-Match` that doesn't match the current file bytes returns **409** with a JSON
     error, and the file is untouched. The backlog asks for 409. RFC 9110 would say 412, but 409
     matches the existing `import_dot` conflict and the `WebError::Conflict` variant. Flagged
     below as an open question.
   - A `PUT` **without** `If-Match` stays last-write-wins, so the CLI, `curl` and the existing tests
     keep working. This is how the SPA's "Save anyway" works.
   - Why a content hash and not mtime: mtime has 1s granularity on some filesystems, and editors
     that save atomically can keep it the same. A hash is also stable across a server restart, and
     the desktop app restarts often.
   - The check-then-write isn't atomic. A per-server `tokio::Mutex` held across hash-check and write
     in `put_graph` closes that race inside this process. Another process writing in the same
     millisecond is accepted as a risk.
4. **#4 SPA behaviour.** `getWorkflowGraph` returns the ETag along with the graph, and
   `updateWorkflowGraph` sends `If-Match` and returns the new ETag. A 409 surfaces as an inline
   conflict message in the canvas's existing `save-error` slot, with two buttons: **Reload**
   (re-fetch and discard local edits) and **Save anyway** (PUT without `If-Match`). Save errors
   stop going through the page-level `error`, so the canvas stays mounted and edits survive.

## Dependency graph

```
#3 drop position ─────────────── (independent, frontend only)

rendering.rs preamble merge ──► put_graph copies defaults (#5)
                                      │  (both read the existing file in put_graph)
                                      ▼
                       put_graph ETag / If-Match / 409 (#4 API)
                                      │
                                      ▼
            workflows.ts + WorkflowEditorPage + canvas conflict UI (#4 SPA)
```

## Task List

### Phase 1: Independent fixes
- [ ] T1: Dropped node lands under the pointer at any pan or zoom (#3)
- [ ] T2: `node [...]`/`edge [...]` defaults survive an editor save (#5)

### Checkpoint A
- [ ] `make ci` clean. Frontend (in `frontend/`): `npx vitest run`, `npx eslint .`, and
      `npm run check` shows no errors beyond the 6 already on `main` (BACKLOG #2).
- [ ] Manual: drag a node onto a zoomed and panned canvas. Save `examples/` DOT that has a
      `node [color=...]` block and diff the file.

### Phase 2: Conflicting-save detection
- [ ] T3: The API refuses a stale save with 409 (#4 backend + API docs)
- [ ] T4: The SPA shows the conflict and keeps the user's edits (#4 frontend)

### Checkpoint B: Complete
- [ ] `make ci` clean, and the full Vitest suite passes against a server from this branch
- [ ] Playwright `node-editor.spec.ts` passes (run by hand, since CI doesn't run it yet, see #2)
- [ ] BACKLOG.md: #3/#4/#5 marked done
- [ ] Review with Jobsworth before merge

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `useSvelteFlow()` in a child of `<SvelteFlow>` behaves differently in @xyflow/svelte 1.6 than documented | Med | Check it first in T1 against the installed version's types. The fallback is the `SvelteFlowProvider` split, which needs your approval as a rewrite. |
| jsdom can't do real viewport maths, so Vitest can't prove the drop lands correctly | Med | The Playwright spec is the real proof: zoom, pan, drop, then compare the node's box to the drop point. Vitest only covers the wiring. |
| Merging file defaults into the preamble changes how every `render_to_dot` caller renders (run-view SVG, `smasher render`) | Low | This is the intended behaviour, since it matches the authored file. Existing rendering tests pin today's output for graphs with no defaults. Add one test with defaults. |
| The existing file on disk doesn't parse when `put_graph` runs | Low | Skip copying defaults and still save. The ETag is computed on raw bytes, so #4 doesn't care whether it parses. |
| Vitest "real API" tests hit whatever is on :21541 | Med | Per BACKLOG's gotcha: quit the desktop app and `cargo run -p smasher-cli -- serve` from this branch first. |

## Open Questions

1. **409 or 412** for an `If-Match` mismatch? Plan: 409, as in the backlog. It matches `import_dot`
   and `WebError::Conflict`, and 412 would need a new error variant.
2. **Conflict UI:** is "Reload / Save anyway" enough, or do you also want a diff view? Plan: the
   two buttons only.
3. **The `docs/api-reference.md:399` path is stale.** It says `/editor/workflows/{id}/graph`, but
   the route is `/api/workflows/{id}/graph`. Plan: fix it in T3 alongside the ETag docs.
