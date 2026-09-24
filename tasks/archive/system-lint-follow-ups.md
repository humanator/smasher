# Follow-ups from `system-lint` (branch `feat/design-factory-system-lint`)

Left for Jobsworth after the `/build auto` run that implemented `SPEC-system-lint.md`.
Full detail and reasoning for each item is in `tasks/archive/todo-system-lint.md`'s per-task
notes.

**Status as of 2026-09-17:** items 2, 3, and 4 confirmed resolved. Item 1 is now
substantially verified via a live run (see below) — same evidence and same narrow
remaining gap as `render-capture`'s own item 1.

## 1. Run a non-`system_lint` pipeline through `smasher run` — SUBSTANTIALLY VERIFIED

**Live evidence (2026-09-17):** observed live run `3669e513-f175-46d3-824d-3a08318dea7f`
(`ProductDesignFactory` pipeline, started 2026-09-16T11:05:48 UTC, dashboard at
`http://127.0.0.1:21541/runs/3669e513-f175-46d3-824d-3a08318dea7f`) running under real
credentials against the full nested chain (`HybridToolBackend` →
`SystemLintToolBackend` → `TaskCriticSynthesisToolBackend` → `LlmToolBackend`). Its
`Implement` (CODERGEN) node made generic tool calls — `read_file`, `write_file`,
`edit_file`, `shell` — that are unrelated to `system-lint`'s own tool and pass straight
through every wrapper to the underlying `LlmToolBackend`. All behaved correctly:
successful reads/writes/edits, a `shell` listing, a correctly-enforced path-traversal
denial, and a correctly-rejected `write_file` call missing its `path` param. This is
exactly the fallback-delegates-unchanged property Task 7's own unit tests asserted,
now confirmed live rather than just unit-tested. It also directly confirms this doc's
item 2 in production: the nested `SystemLintToolBackend(HybridToolBackend(...))` chain
ran real `SystemLint` tool-node calls successfully (see event log entries `NODE
COMPLETED SystemLint`, lint result surfaced correctly as `LINT: FAIL — border-radius:
4px, raw size, use a var(--token) instead`).

**Remaining gap:** this run is itself a design-factory pipeline (it also exercises
`render_capture`'s and `task-critic-synthesis`'s own tool nodes throughout —
`RenderDiscoverA/B/C`, `RenderDefine`, `TaskCritic`, `Synthesis`, all completing
successfully), not an unrelated non-design-factory `.dot` pipeline like
`examples/vulnerability_analyzer.dot`. If you want that exact scenario confirmed too,
the original action below still applies, but it's now a nice-to-have rather than a
blocker.

**Original action, still available if wanted:**

```bash
smasher run examples/vulnerability_analyzer.dot --skip-preflight --no-tui
```

and confirm it behaves exactly as it did before this branch.

## 2. This branch will conflict with `feat/design-factory-render-capture` at merge time — RESOLVED

Confirmed 2026-09-17 in the current codebase: all four construction sites
(`crates/smasher-cli/src/run.rs:1103-1123`, `crates/smasher-web/src/routes/api.rs:304-323`
and `:637-656`, `crates/smasher-web/src/routes/pages.rs:474-493`) now nest
`SystemLintToolBackend::new(Arc::new(HybridToolBackend::new(llm_tool_backend)))`
consistently, with `TaskCriticSynthesisToolBackend` wrapped a layer further out on top
of that (added by the later `task-critic-synthesis` module). The manual merge happened.

## 3. `docs/design-factory/capability-map.md` not updated — RESOLVED

`capability-map.md` now lists `system-lint` as `Done`.

## 4. `render-capture`'s own follow-ups are still outstanding — RESOLVED

`tasks/render-capture-follow-ups.md` has been reviewed and updated alongside this
doc. Its only remaining open item is the same real-credentials manual pipeline check
as this doc's item 1.
