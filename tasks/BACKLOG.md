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
    - Manager (`house`) nodes fail under claude-cli: `LlmManagerBackend` runs
      an agent session with tools, which `claude -p` single calls can't do.
      They stay LLM nodes (decided 2026-10-13, closing #35), so route them
      through `ClaudeCliBackend`. Workaround:
      `provider="<other>"` on the node.
    - Checkpoints skipped before merge, waiting on Jobsworth's call: the
      `#[ignore]` real-CLI tests (including the `curl` denial), `smasher run` on
      hello-world and a codergen example, and hello-world in the desktop app.
    - Codergen agents are denied the shell, so they can't run the design-kit
      linter or open their pages. Decide whether to allow the linter command,
      or leave checking to the pipeline's `system_lint`/`render` nodes.
    - Show `permission_denials` from the CLI's result event in the run view.
    - Make the claude-cli codergen timeout configurable (fixed at 600s in
      `smasher-web/src/run_launch.rs`).
    - Let `smasher run` use `SMASHER_CLAUDE_CLI`'s path instead of `claude`
      from `PATH`.
## P2: Robustness

40. **Delete runs from the UI, several at once.** *Decided 2026-10-13*, closing
    #6: there's no automatic retention policy. Every run's artifacts are kept
    until you delete the run yourself, and `smasher prune-artifacts` stays a
    manual tool. So the run list (`RunList.svelte`/`RunTable.svelte`) needs a
    way to delete runs: a delete action on one run, plus checkboxes to select
    several and delete them in one action, with a confirmation that says how
    many runs will go. The server has no delete endpoint yet, so add one (for
    example `DELETE /api/runs/{id}`, or a batch form taking a list of ids). It
    removes the whole `{data_dir}/artifacts/<run_id>/` tree, as
    `prune_artifacts` does, and the in-memory record. Refuse runs that are
    still running. Deleting is permanent, since the desktop app keeps runs in
    `~/Documents/smasher`.

## P3: Design-factory features (wait until a real pipeline needs them)

Batch #7, #8 and #11 together: several-candidate critique decides the
`candidate_id` convention, and the lint override lives in the same `synthesis`
code.

7. **Critique several candidates from one node**, instead of writing one
   `task_critic`/`synthesis` node per candidate. Most likely to be needed first.
8. **Let a failing lint force `synthesis` to recommend `iterate`**, whatever
   the model says.
10. **Support two gallery gates pending on one run at once.** Needs a mapping
    from node id to question in the engine first.
11. **Document where `candidate_id` values come from** for pipeline authors
    (today they're hardcoded as `discover-a`..`d`).
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
