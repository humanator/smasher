# Todo: smasher-spa

See `tasks/plan-smasher-spa.md` for full task descriptions, acceptance criteria, and rationale.
(`smasher-web-api`'s own tracking lives separately in `tasks/plan.md` / `tasks/todo.md` — do not conflate the two.)

## Phase 1: Foundation

- [ ] Task 1: Scaffold `frontend/` project (Vite+Svelte5+TS strict+Tailwind+shadcn-svelte+Vitest+Playwright, `npm run dev:backend` helper)
- [ ] Task 2: `lib/api/` REST client (runs/questions/gallery/workflows, runtime-configurable base URL)
- [ ] Task 3: `lib/api/` SSE client (typed 17-event wrapper for `/api/runs/{id}/events`)
- [ ] Task 4: `lib/native/` shim stub (`window.__TAURI__` check, browser fallbacks)

### Checkpoint: Foundation
- [ ] `npm run build` / `npm run lint` / `npm run test` clean
- [ ] `npm run dev` proxy to `smasher-web-api` verified
- [ ] `lib/api/` tests pass against real `npm run dev:backend`, not mocked fetch

## Phase 2: Derisking

- [ ] Task 5: Spike — node-editor graph library decision (compare keeping `@xyflow/svelte`+dagre vs. at least one alternative; written decision required before Phase 5)
- [ ] Task 6: `GET /api/workflows` endpoint (smasher-web-api, reuse `scan_workflows()`; drive-by fix `docs/api-reference.md` gaps)

### Checkpoint: Derisking Complete
- [ ] Graph-library decision recorded in writing
- [ ] `cargo test -p smasher-web` / `cargo clippy -p smasher-web` clean
- [ ] `curl http://127.0.0.1:21541/api/workflows` returns real data

## Phase 3: Dashboard core (spec Success Criterion #1: submit → events → human-gate)

- [ ] Task 7: `stores/` — run state, event log, questions
- [ ] Task 8: Workflow catalog page
- [ ] Task 9: Run submission form + run list page
- [ ] Task 10: Run detail page (status, tokens, abort, graph SVG)
- [ ] Task 11: Live event stream view (SSE)
- [ ] Task 12: Human-gate Q&A form

### Checkpoint: Dashboard Core Complete
- [ ] Vitest clean
- [ ] Playwright critical path green: submit `examples/human_gate_showcase.dot` → events stream in → answer human gate → completion, against real `smasher-web-api`

## Phase 4: Gallery-gate + decision history

- [ ] Task 13: Candidate gallery view
- [ ] Task 14: Gallery-gate decision UI
- [ ] Task 15: Decision history view

### Checkpoint: Gallery/Decision Complete
- [ ] Vitest clean
- [ ] Manual/E2E check against real run from `examples/gallery_gate_showcase.dot`

## Phase 5: Node editor port — BLOCKED on Task 5's decision

- [ ] Task 16: Port node-editor data layer (types, nodeConfig, convert)
- [ ] Task 17: Port node-editor presentational components (Palette, WorkflowNode, WorkflowEdge, EdgeForm)
- [ ] Task 18: Port node-editor canvas orchestrator (`WorkflowCanvasInner` → normal component)
- [ ] Task 19: Node-editor page routing (new/edit workflow)

### Checkpoint: Node Editor Complete
- [ ] Vitest clean (ported 783-line test suite coverage intact)
- [ ] Manual: create/save/reload/edit round-trips through `/api/workflows/*`, no client-side DOT parsing as source of truth

## Phase 6: Native shim + final E2E

- [ ] Task 20: Wire `lib/native/` shim to real `window.__TAURI__` checks + browser fallbacks
- [ ] Task 21: Full Playwright E2E suite (all spec Success Criteria)

### Checkpoint: Complete
- [ ] All SPEC-smasher-spa.md Success Criteria boxes satisfied
- [ ] Vitest and Playwright suites green
- [ ] Zero Tauri-only code paths break in a plain browser
- [ ] Human review before this unblocks `smasher-web-api` Task 9 and `smasher-desktop` starts
