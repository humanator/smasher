# Todo: editor batch (BACKLOG #3, #4, #5)

Plan: [`plan-editor-batch.md`](plan-editor-batch.md). Branch: `feat/editor-save-batch` off `main`.
TDD throughout: failing test first. Commit at the end of each task.

Frontend commands run in `frontend/`. Vitest's real-API tests need
`cargo run -p smasher-cli -- serve` from this branch on :21541, with the desktop app quit (see
BACKLOG's "Frontend test gotcha"). `npm run check` already has 6 errors on `main`. "No new
svelte-check errors" means still 6.

---

## Phase 1: Independent fixes

### T1: Dropped node lands under the pointer at any pan or zoom (#3)

**Description:** Add `FlowPositionBridge.svelte`, rendered inside `<SvelteFlow>`. It calls
`useSvelteFlow()` and passes `screenToFlowPosition` up through a callback prop. `handleDrop`
converts `{clientX, clientY}` through it, so there's no more `getBoundingClientRect` maths.
Update the stale comment at `WorkflowCanvas.svelte:139-150`, and the matching one in
`WorkflowCanvas.test.ts:273-278`. `addNodeAtPosition` still takes flow coordinates.

**Acceptance criteria:**
- [x] On a zoomed and panned canvas, a dropped node's top-left is within a few px of the drop point
      on screen
- [x] At the default viewport, dropping behaves the same as before, and the existing
      `node-editor.spec.ts` flow still passes
- [x] If the bridge hasn't mounted yet, the drop is ignored rather than throwing

**Verification:**
- [x] Playwright (new case in `e2e/node-editor.spec.ts`): open a workflow, zoom in with the
      Controls `+` button, pan by dragging the pane, drop Codergen at (x, y), then assert the new
      node's bounding box is near (x, y). Fails on `main`, passes after.
- [x] Vitest: `npx vitest run tests/components/node-editor`
- [x] `npx eslint .`, and `npm run check` has no new errors

**Dependencies:** None

**Files likely touched:**
- `frontend/src/components/node-editor/FlowPositionBridge.svelte` (new)
- `frontend/src/components/node-editor/WorkflowCanvas.svelte`
- `frontend/e2e/node-editor.spec.ts`
- `frontend/tests/components/node-editor/WorkflowCanvas.test.ts` (comment only, unless a
  wiring test fits)

**Estimated scope:** S

---

### T2: `node [...]`/`edge [...]` defaults survive an editor save (#5)

**Description:** `render_graph_preamble` merges `graph.default_node_attrs`/`default_edge_attrs`
over its hardcoded font defaults, with keys sorted. `put_graph` reads the file it's about to
overwrite, resolves it, and copies both default maps onto the graph before rendering. If the old
file doesn't parse, it copies nothing. Update the doc comments that call this an "out-of-scope
gap": `editor_api.rs:43-46,188-191` and `rendering.rs:2065-2069`.

**Acceptance criteria:**
- [x] A file with `node [color="red" model="x"]; edge [style=dashed];` still has those keys in
      its `node [...]`/`edge [...]` lines after a `PUT /api/workflows/{id}/graph`
- [x] Saving twice gives byte-identical output (the merge is idempotent)
- [x] A graph with no defaults renders exactly as it does today, so existing rendering tests are
      unchanged

**Verification:**
- [x] `cargo test -p smasher-attractor rendering`: new test that a graph with defaults renders a
      merged preamble which re-parses into the same default maps (plus the font keys)
- [x] `cargo test -p smasher-web editor_api`: new test covering fixture with default blocks →
      PUT → file contains them, then PUT again → identical bytes
- [x] `cargo clippy --workspace -- -D warnings`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/rendering.rs`
- `crates/smasher-web/src/routes/editor_api.rs`

**Estimated scope:** S

---

## Checkpoint A: after T1-T2
- [ ] `make ci` clean
- [ ] Full Vitest suite green against a server from this branch
- [ ] Manual: in `make desktop-dev` or `serve`, zoom and pan, then drop a node. It lands under the
      cursor.
- [ ] Manual: save a workflow that has a `node [...]` block, then `git diff` the file. The block
      is kept.
- [ ] Review with Jobsworth before Phase 2

---

## Phase 2: Conflicting-save detection

### T3: The API refuses a stale save with 409 (#4 backend)

**Description:** Add `sha2` to `smasher-web`. `get_graph` returns `ETag: "<sha256-hex of file
bytes>"`. `put_graph` takes an optional `If-Match`. It holds a `tokio::sync::Mutex` stored in
`AppState` across read, hash-compare and write. A mismatch returns `WebError::Conflict`
("workflow changed on disk since it was loaded") and doesn't write. On success it returns the new
file's `ETag`. With no `If-Match`, the save goes ahead unchecked, same as today. Document the
header contract in `docs/api-reference.md`, and fix that doc's stale `/editor/workflows/{id}/graph`
path (line 399).

**Acceptance criteria:**
- [ ] `GET` returns an `ETag`. A `PUT` with that `If-Match` succeeds and returns a new `ETag`
      matching the new file bytes.
- [ ] Change the file on disk after the `GET`, then `PUT` with the old `If-Match`: 409 with a JSON
      error body, and the file stays byte-for-byte as it was
- [ ] A `PUT` with no `If-Match` still succeeds against a changed file, and existing `put_graph`
      tests pass unchanged

**Verification:**
- [ ] `cargo test -p smasher-web editor_api`: new tests for the ETag on GET, a matching If-Match
      saves, a stale one gives 409 with the file untouched, a missing one still saves, and the
      PUT response ETag equals the hash of the file on disk
- [ ] Manual with `curl -i` against `serve`: GET, `touch`+edit the file, PUT with the old
      ETag → 409
- [ ] `cargo clippy --workspace -- -D warnings`

**Dependencies:** T2 (same function; T2 already reads the existing file)

**Files likely touched:**
- `crates/smasher-web/Cargo.toml`
- `crates/smasher-web/src/routes/editor_api.rs`
- `crates/smasher-web/src/state.rs`
- `docs/api-reference.md`

**Estimated scope:** M

---

### T4: The SPA shows the conflict and keeps the user's edits (#4 frontend)

**Description:** `getWorkflowGraph` returns `{ graph, etag }`, and `updateWorkflowGraph(id, graph,
etag?)` sends `If-Match` when it has an etag and returns the new etag. On failure it throws an
`ApiError` with `status`, carrying the server's message. `WorkflowEditorPage` keeps the current
etag and rethrows save errors instead of setting the page-level `error`, so the canvas's own
`save-error` slot shows them and the canvas stays mounted. On a 409, the canvas shows the conflict
text with **Reload** and **Save anyway** buttons. Reload re-fetches the graph and discards edits.
Save anyway re-sends without `If-Match`. Update any other `getWorkflowGraph` callers to the new
return shape.

**Acceptance criteria:**
- [ ] Load the editor, change the file on disk, click Save. You see the conflict message and both
      buttons, the canvas still shows your unsaved edits, and the file on disk is unchanged.
- [ ] Save anyway writes your version. Reload shows the on-disk version.
- [ ] Two saves in a row with no outside change both succeed, because the etag updates after each
      save
- [ ] Any other save failure (e.g. 400) shows inline and leaves the canvas mounted

**Verification:**
- [ ] Vitest (real API, `tests/lib/api/workflows.test.ts`): GET gives an etag, a matching PUT
      succeeds, and a stale PUT rejects with `status === 409`
- [ ] Vitest (`tests/components/dashboard/WorkflowEditorPage.test.ts`): real server, fixture file
      changed between load and save → conflict UI shown, canvas still mounted, Save anyway
      succeeds
- [ ] Playwright (new case in `e2e/node-editor.spec.ts`): edit, rewrite the file from the test,
      save → conflict, Save anyway → the file holds the editor's version
- [ ] `npx eslint .`, and `npm run check` has no new errors

**Dependencies:** T3

**Files likely touched:**
- `frontend/src/lib/api/workflows.ts`
- `frontend/src/components/dashboard/WorkflowEditorPage.svelte`
- `frontend/src/components/node-editor/WorkflowCanvas.svelte`
- `frontend/tests/lib/api/workflows.test.ts`
- `frontend/tests/components/dashboard/WorkflowEditorPage.test.ts`

**Estimated scope:** M (5 files, at the limit; the e2e case can move to its own commit)

---

## Checkpoint B: complete
- [ ] `make ci` clean
- [ ] Full Vitest suite green against a server from this branch
- [ ] `npx playwright test e2e/node-editor.spec.ts` green (by hand, since CI doesn't run it, see #2)
- [ ] Manual in the desktop app: the T4 conflict flow end to end
- [ ] `tasks/BACKLOG.md`: #3, #4, #5 marked done with the date. Remove the DEFERRED
      `workflow-editor` source notes that now no longer apply.
- [ ] Review with Jobsworth before merge
