# Todo: smasher-spa

See `tasks/plan-smasher-spa.md` for full task descriptions, acceptance criteria, and rationale.
(`smasher-web-api`'s own tracking lives separately in `tasks/plan.md` / `tasks/todo.md` — do not conflate the two.)

## Phase 1: Foundation

- [x] Task 1: Scaffold `frontend/` project (Vite+Svelte5+TS strict+Tailwind+shadcn-svelte+Vitest+Playwright, `npm run dev:backend` helper)
- [x] Task 2: `lib/api/` REST client (runs/questions/gallery/workflows, runtime-configurable base URL)
- [x] Task 3: `lib/api/` SSE client (typed 17-event wrapper for `/api/runs/{id}/events`) — unblocked and verified after Task 6b's backend fix
- [x] Task 4: `lib/native/` shim stub (`window.__TAURI__` check, browser fallbacks)

### Checkpoint: Foundation
- [x] `npm run build` / `npm run lint` / `npm run test` clean (18/18 real tests, independently re-verified)
- [x] `npm run dev` proxy to `smasher-web-api` verified (manual check — independently re-verified)
- [x] `lib/api/` tests pass against real `npm run dev:backend`, not mocked fetch (independently re-verified, including SSE)

## Phase 2: Derisking

- [x] Task 5: Spike — node-editor graph library decision (kept `@xyflow/svelte`+dagre; decision recorded in `tasks/plan-smasher-spa.md` lines 806-843; spot-checked svelvet's npm version independently, matched)
- [x] Task 6: `GET /api/workflows` endpoint (smasher-web-api, reuse `scan_workflows()`; drive-by fix `docs/api-reference.md` gaps — independently re-verified, 34 real workflows returned)
- [x] Task 6b: Fix SSE early-event loss in `events_stream` (replay `event_log` before live-subscribing — independently confirmed fixed with a standalone repro script, not just the implementing agent's own claim)

### Checkpoint: Derisking Complete
- [x] Graph-library decision recorded in writing
- [x] `cargo test -p smasher-web` / `cargo clippy -p smasher-web` clean (re-run independently)
- [x] `curl http://127.0.0.1:21541/api/workflows` returns real data (independently re-verified: 34 workflows)
- [x] Task 3's SSE tests pass against the real server (unblocked by Task 6b, independently re-verified)

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
