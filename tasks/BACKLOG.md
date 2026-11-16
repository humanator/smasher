# Backlog

Open work on smasher, prioritised. Finished specs, plans and todos are in
[`archive/`](archive/), and [`Vision.md`](Vision.md) is the product north star.
Item numbers stay stable so cross-references keep working; gaps are finished
items. For running the frontend tests, see "Frontend Tests and CI" in
[`docs/quickstart.md`](../docs/quickstart.md).

## P1: Do next

1. **Run one real pipeline on Sonnet 5.** `DEFAULT_MODEL` is `claude-sonnet-5`,
   but tests only use mocks. Spends tokens, so only on request. (Test fixtures
   use `claude-sonnet-4-20250514` on purpose as sample data; leave them.)
23. **Claude CLI provider follow-ups.** Setup is in `docs/config-reference.md`.
    - Checkpoints skipped before merge, waiting on Jobsworth's call: the
      `#[ignore]` real-CLI tests (including the `curl` denial), `smasher run` on
      hello-world and a codergen example, and hello-world in the desktop app.
    - Codergen agents are denied the shell, so they can't run the design-kit
      linter or open their pages. Decide whether to allow the linter command,
      or leave checking to the pipeline's `system_lint`/`render` nodes.

## P2: Robustness

43. **Fix the link button's dark-mode contrast at the source.** The Button
    `link` variant (`frontend/src/lib/components/ui/button/button.svelte`) uses
    `text-primary`, which is about 3:1 on dark surfaces. Screens have fixed it one
    link at a time with `dark:text-primary-subtle-foreground` (7.89:1), but the
    editor status bar's **Review** link (`node-editor/StatusBar.svelte`) still
    misses it. Add that class to the variant itself so every link, including new
    ones, passes 4.5:1, then drop the per-link copies. Cover it in
    `tests/lib/tokens.test.ts`.

## P3: Design-factory features (wait until a real pipeline needs them)

10. **Support two gallery gates pending on one run at once.** Needs a mapping
    from node id to question in the engine first.
12. **Settle the shape of `generation_params`** (a free-form string map today).
13. **Grow the design-kit components** (`select`, `checkbox`, `tabs`) **and the
    `system-lint` usage rules** to match.
14. **Artifact extras:** a producer for the reserved `Recording` artifact kind,
    and a per-candidate option to skip saving the bundle.
15. **Reuse the editor's saved layout in the run-view SVG** instead of laying
    the graph out again with Graphviz.
38. **Get the upstream-ported examples' scripts working.** `semport`,
    `megaplan`, `sprint_exec` and `vulnerability_analyzer` assume Attractor's
    `.ai/attractor-runs/...` layout and shell variables. Rewrite their tool
    commands against smasher's (`SMASHER_RUN_DIR`, `nodes/<id>/`,
    `SMASHER_CTX_<KEY>`).
41. **Let the editor fill in paths for the user.** A Tool node's `args` and
    `tool_command` are free text, so a user building a workflow in the app has to
    know that relative paths resolve against the run's own folder and write
    absolute paths for anything else (found in the run UAT: BUG-2, where
    `gallery_gate_showcase.dot` hard-codes a repo-relative `candidate_dir` that
    can't resolve from a run). Add a placeholder, for example a "candidate
    directory" token the node forms offer wherever a directory path is wanted,
    that the engine resolves at run time. Spec it first: which nodes and fields
    take it, what it resolves to, and how it's shown in the DOT.
42. **Decide whether Settings offers "Infer from model name" and "Claude CLI"
    as default providers.** The Home design shows both in the Default provider
    list, but `PUT /api/settings` needs an explicit provider and the Claude CLI
    is set up separately, so the dashboard kept today's list (open question 1
    in [`archive/SPEC-dashboard.md`](archive/SPEC-dashboard.md)). Inferring needs
    backend work, so decide first, then spec it.

## P4: Distribution and remote access

Batch #17 and #18 if either comes up; both change the Tauri app's setup.

16. **Serve the app remotely over HTTP.** Needs an auth layer first (the API has
    none and listens on `127.0.0.1` only), and must deal with tool nodes running
    DOT-authored shell commands on the server. Spec it before building.
17. **Ship a `.dmg` or portable desktop bundle.** The `.app` loads the SPA,
    examples and design kit from the source checkout, so those need bundling
    as resources first.
18. **Desktop tray icon.**
19. **Desktop end-to-end tests.** Blocked: `tauri-driver` doesn't support macOS.
    Manual QA and the SPA's Playwright suite cover it for now.
