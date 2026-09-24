# Capability Map: Semi-Dark Design Factory

Source concept: `Vision.md` and `smasher-design-factory.md`. This map formalizes the build order already sketched in
`smasher-design-factory.md` §5 into stable module ids for spec-driven development.

| Module id | Responsibility | Depends on | Status |
|---|---|---|---|
| `component-kit` | Shared lightweight HTML/CSS/JS components (button, input, drawer, modal, list-row, table) that Discover-phase candidates compose from, plus the design tokens that back them | — | Done |
| `render-capture` | `render_capture` tool node: builds/serves a candidate from the kit, captures it (frame, recording, or embeddable live preview) | `component-kit` | Done |
| `gallery-view` | Read-only dashboard view rendering captured candidates for a completed run (no pause/blocking yet) | `render-capture` | Done |
| `gallery-gate` | Human-gate node variant: pipeline pauses, dashboard shows the gallery, human selects/rejects, pipeline resumes on the chosen branch | `gallery-view` | Done |
| `system-lint` | Deterministic check of generated markup against kit component usage and code-based design tokens | `component-kit` | Done |
| `task-critic-synthesis` | `task_critic` (LLM attempts a task against a live candidate) + `synthesis` (reconciles lint + critic into a proceed/iterate recommendation) | `gallery-gate`, `system-lint` | Done |
| `decision-history` | Dashboard panel logging every gate decision on a run, separate from the technical execution log | `gallery-gate` | Done |
| `artifact-store` | Richer per-run artifact storage (live preview builds, recordings, embeddable bundles) beyond Smasher's existing text/JSON checkpointing | `render-capture` | Done |
| `live-preview` | Swap the candidate card's static `screenshot.png` for an embedded live view (`<iframe>` of the bundle `artifact-store` already persists), screenshot as fallback, in both `gallery-view` and `gallery-gate` templates; plus prompt/generation-parameter traceability captured into the candidate manifest and surfaced on the same card's hover/expand | `artifact-store`, `gallery-view`, `gallery-gate` | Done |
| `candidate-workdir-resolution` | Fix: `candidate_dir` resolves against the run's own working directory instead of the process cwd, so tool nodes can point at real Codergen output instead of test fixtures | `render-capture`, `system-lint` | Done |
| `workflow-catalog` | Module 1 of the design-workflow-dashboard redesign: `/` becomes a landing page listing discovered `.dot`/`.gv` workflow files, replacing the run-centric dashboard; adds an interim create flow and a stub detail page | — | Done |
| `workflow-run-shell` | Module 2 of the design-workflow-dashboard redesign: `/workflows/{id}` becomes the real workflow detail page — run the workflow's `.dot` file, monitor progress, answer human-gate questions, browse artifacts/decision history, see per-workflow run history; also rehydrates `AppState.runs` from on-disk manifests on server startup | `workflow-catalog` | Done |
| `workflow-editor` | Module 3 of the design-workflow-dashboard redesign: visual node/edge editor for `.dot` files — Svelte Flow compiled to a `<workflow-canvas>` Web Component, styled/laid out after AntV X6's "Agent Flow" showcase example — select/add/edit/delete nodes and edges, save back to disk; replaces the raw DOT-paste create form and the read-only DOT preview | `workflow-catalog` | Done |

**Build order:** `component-kit` → `render-capture` → `system-lint` (parallel with render-capture once the kit exists) → `gallery-view` → `gallery-gate` → `task-critic-synthesis` → `decision-history` → `artifact-store` → `live-preview` → `workflow-catalog` → `workflow-run-shell` (parallelizable with `workflow-editor`)

This matches `smasher-design-factory.md` §5's stated order, with `system-lint`
slotted in against its actual dependency (it only needs `component-kit`, not the
gate UI). `artifact-store` was moved from directly after `gallery-gate` to last:
per `tasks/archive/plan-artifact-store.md`'s architecture decisions, it should migrate every
reader (`render-capture`, `gallery-view`, `gallery-gate`, and the critics) onto
one artifact layout at once rather than reconciling paths before those readers
exist and redoing it later. Dependency-wise both orders are valid — `artifact-store`
only depends on `render-capture` — this is a sequencing choice, not a dependency
correction.

Each module gets its own spec named `SPEC-<module-id>.md` in this directory (specs are
never archived — they stay in this directory as the module's living reference even
once the module is `Done`). Specs exist for `component-kit`, `render-capture`,
`system-lint`, `gallery-view`, `gallery-gate`, `task-critic-synthesis`,
`artifact-store`, `live-preview`, `candidate-workdir-resolution`,
`workflow-run-shell`, and `workflow-editor` (`decision-history` ships as Task 7 of `gallery-gate`'s own plan
and has no separate spec). For build history, open items, and exactly what a module's status means, see
that module's own `plan-<module-id>.md` (task list, checkpoints, Open Questions) and
`todo-<module-id>.md` (task-by-task detail) — there is no single combined
`plan.md`/`todo.md`.

Once a module is `Done` with no outstanding follow-ups, its `plan-` and `todo-` files
move from `tasks/` to `tasks/archive/` to keep the active task list to modules still
being worked. As of 2026-09-17, archived: `gallery-gate`, `gallery-view`,
`task-critic-synthesis`, `artifact-store`, `live-preview`, `candidate-workdir-resolution`,
`render-capture`, `system-lint` (the latter two moved once their one remaining
follow-up — a manual `smasher run` check needing real credentials — was
substantially verified against a live run; see `tasks/render-capture-follow-ups.md`
and `tasks/system-lint-follow-ups.md` for the evidence). As of 2026-09-18, also
archived: `workflow-catalog` and `workflow-run-shell` (Modules 1 and 2 of the
design-workflow-dashboard redesign — see `tasks/workflow-dashboard-design.md`).
`workflow-run-shell`'s one
manual verification item not exercised as a live browser pass (a real
`render_capture` → `gallery` gate run from `/workflows/{id}`) was instead
reasoned from code plus existing test coverage of the identical, unchanged
`/runs/{id}/*` endpoints — see Checkpoint B in `tasks/archive/todo-workflow-run-shell.md`
for the reasoning, if a literal browser pass turns out to matter later.
As of 2026-09-20, also archived: `workflow-editor` (Module 3, `SPEC-workflow-editor.md`
stays as its living reference per the policy below). Full regression + sign-off
(Task 10) re-verified `cargo test --workspace`/`cargo clippy --workspace`/`npm test`
all green with zero new warnings in any file this module touched, and re-ran
both Checkpoint D manual walkthroughs end-to-end against a real server and a
real Chromium instance — including a from-scratch build (palette drag-to-create,
real handle-to-handle connect-drags, filling in real node forms, saving via the
approved create flow) and a single-field edit against the real 30-node
`examples/ask_and_execute.dot` fixture, semantically diffed node-by-node/
edge-by-edge before vs. after (excluding position data) and confirmed exactly
one attribute changed. One item is unverifiable in this environment rather than
skipped silently: actually running a saved workflow to completion from
`workflow-run-shell`'s Run button needs a real LLM API key, which isn't
configured in this sandbox — the saved file's correctness up to that point
(parses, resolves, every existing node/edge attribute round-trips) is fully
verified instead; see Task 8's and Task 10's write-ups in
`tasks/archive/todo-workflow-editor.md` for the reasoning, if a literal
live-run pass turns out to matter later.
`component-kit` has no
plan/todo file in this workspace (overwritten at some point — its own task-by-task
history is lost) and nothing to archive; see "`component-kit`: closed 2026-09-17"
below for how it was verified and closed out without one.

## Follow-ups (not urgent, tracked for later)

Every module is `Done` with no outstanding oversight — what remains is deliberately
deferred design debt, consolidated in one place: **[`DEFERRED.md`](DEFERRED.md)**.
That file also documents several stale "Open Questions" this consolidation pass found
already resolved in the shipped code but never marked as such in their source specs
(cross-referenced there, corrected in place in each `SPEC-<module-id>.md`).

