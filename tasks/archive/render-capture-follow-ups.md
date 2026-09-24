# Follow-ups from `render-capture` (branch `feat/design-factory-render-capture`)

Left for Jobsworth after the `/build auto` run that implemented `SPEC-render-capture.md`.
Full detail and reasoning for each item is in `tasks/todo.md`'s per-task notes.

**Status as of 2026-09-17:** items 2, 3, and 5 confirmed resolved. Item 1 is now
substantially verified via a live run (see below) — one narrow scenario remains if
you want full closure. Item 4 was FYI-only and needs no action.

## 1. Run a non-`render_capture` pipeline through `smasher run` — SUBSTANTIALLY VERIFIED

**Live evidence (2026-09-17):** observed live run `3669e513-f175-46d3-824d-3a08318dea7f`
(`ProductDesignFactory` pipeline, started 2026-09-16T11:05:48 UTC, dashboard at
`http://127.0.0.1:21541/runs/3669e513-f175-46d3-824d-3a08318dea7f`) running under real
credentials against the full nested chain (`HybridToolBackend` →
`SystemLintToolBackend` → `TaskCriticSynthesisToolBackend` → `LlmToolBackend`). Its
`Implement` (CODERGEN) node made generic tool calls — `read_file`, `write_file`,
`edit_file`, `shell` — that are unrelated to `render_capture`'s own tool and pass
straight through every wrapper to the underlying `LlmToolBackend`. All behaved
correctly: successful reads/writes/edits, a `shell` listing, a correctly-enforced
path-traversal denial, and a correctly-rejected `write_file` call missing its `path`
param. This is exactly the fallback-delegates-unchanged property Task 7's own unit
tests asserted, now confirmed live rather than just unit-tested — the core risk this
item was guarding against (wrapping breaks unrelated tool calls) is directly observed
to be unfounded.

**Remaining gap:** this run is itself a design-factory pipeline (it also exercises
`render_capture`'s, `system-lint`'s, and `task-critic-synthesis`'s own tool nodes
throughout — `RenderDiscoverA/B/C`, `RenderDefine`, `SystemLint`, `TaskCritic`,
`Synthesis`, all completing successfully), not an unrelated non-design-factory `.dot`
pipeline like `examples/vulnerability_analyzer.dot`. If you want that exact scenario
confirmed too, the original action below still applies, but it's now a nice-to-have
rather than a blocker.

**Original action, still available if wanted:**

```bash
smasher run examples/vulnerability_analyzer.dot --skip-preflight --no-tui
```

and confirm it behaves exactly as it did before this branch.

## 2. `/runs/` missing from `.gitignore` — RESOLVED

`smasher/.gitignore` now has a `/runs/` line alongside `/artifacts/`. Confirmed
2026-09-17.

## 3. `docs/design-factory/capability-map.md` not updated — RESOLVED

`capability-map.md` now lists `render-capture` as `Done`.

## 4. Environment: Rust toolchain installed

This machine had no `cargo`/`rustc` at the start of this session — rustup was installed
(with your approval) to build and test this branch. Nothing to action, just noting the
environment changed.

## 5. FYI: concurrent `system-lint` work — RESOLVED

That concurrent session became the `system-lint` module. It has its own spec, plan,
and todo files, all complete, and `capability-map.md` lists it as `Done`. See
`tasks/system-lint-follow-ups.md` for that module's own follow-ups.
