---
status: complete
source: tasks/SPEC-workflow-detail.md, tasks/plan.md, tasks/todo.md
e2e_excluded:
  - "workflow-detail: goes from the dashboard to a workflow, lists its steps, launches it, and finds the run in its history"
  - "workflow-detail: a run waiting on a person raises the banner, naming where it paused, until it is answered"
  - "workflow-detail: a failed run shows a one-line reason naming the step, without opening the run"
  - "workflow-detail: every action on the page can be reached with Tab and shows a focus ring"
  - "workflow-detail: at phone width › never scrolls sideways, with a banner and a failed run showing"
gate_covered:
  - "SC5 path refusal: cargo test -p smasher-desktop (validate_reveal_path)"
  - "SC6 Run request body and history links: WorkflowDetailPage.test.ts, RunDialog tests"
  - "SC7 keyboard and focus rings, no sideways scroll at 375: workflow-detail e2e"
  - "Banner text contrast: ActiveRunBanner.test.ts"
started: 2026-11-02T00:00:00Z
updated: 2026-11-01T23:24:00Z
---

## Automated gates (this run)
- check: pass (0 errors, 0 warnings)
- lint: pass
- build:check: pass (12 chunks, all under 500 kB)
- vitest: pass (1191 passed, 1 skipped). `tests/stores/library.test.ts` "reports needs-you over
  running over null" flaked in 2 of 4 earlier runs: other test files launch `run_launch_check`
  on the same server. It passed on this run and alone.
- e2e: pass (19/19: workflow-detail, dashboard, app-shell, no-tauri-breakage, settings). Other
  specs not run: `critical-path` spends LLM tokens and I couldn't confirm the rest don't.
- cargo test -p smasher-desktop: pass (48 + 4 + 7). clippy and fmt clean.

Test server: `smasher-web` with `SMASHER_CLAUDE_CLI=frontend/tests/fixtures/fake-claude.sh`.

## Manual checklist

### 1. Workflow page matches the artboard, light
expected: At 1440×900 in the browser (light), a workflow page matches `docs/design/redesign/Workflow.dc.html` in layout, hierarchy, copy and tokens: toolbar, What it does, Run history. The only allowed deviations are D4 (no Latest run card) and Show in Finder being hidden in the browser.
result: pass

### 2. Workflow page matches the artboard, dark
expected: Same check with the OS in dark mode. Surfaces, zebra rows, badges, step chips and banner text all stay legible.
result: pass

### 3. A real loop reads in plain language
expected: Open Megaplan Quality (or another example with a loop). What it does lists every step once, in running order, with plain kind names, and the intro explains each loop-back in one plain sentence. Nothing reads like DOT.
result: pass

### 4. The banner for a real gallery gate
expected: Run Gallery Gate Showcase and open its page. The banner reads "Started {when}. Paused at {step}, waiting for you to choose from {n} candidates." with a Review Candidates button that opens the run.
result: pass

### 5. A failed run's reason reads well
expected: On a workflow that has a failed run in your history, the row shows one line under the start time naming the step by its label. The wording is understandable without opening the run, and no non-failed row shows a reason.
result: issue
severity: major
reported: "It matches the design, but at narrower widths the reason wraps have breaks the layout"

### 6. Phone width looks right
expected: At 375px wide with a banner showing, the title and subtitle truncate with an ellipsis, Edit Workflow and Run stay visible, the banner's button spans full width under its text, and history rows stack badge and time, then the reason, then id and duration.
result: pass

### 7. Desktop app: Show in Finder
expected: In `make desktop-dev`, the workflow page shows a Show in Finder button before Edit Workflow. Clicking it reveals that workflow's `.dot` file in Finder. In the browser the button is absent.
result: pass

### 8. Desktop app matches the artboard
expected: In `make desktop-dev`, the page looks the same as in the browser, with the traffic lights in the sidebar inset, in light and dark.
result: pass

## Issues
### BUG-1: A failed run's reason wraps into a tall, narrow column at medium widths
severity: major
checkpoint: 5. A failed run's reason reads well
expected: The reason stays a readable one-liner under the start time, at any width.
reported: "It matches the design, but at narrower widths the reason wraps have breaks the layout"
diagnosis: RunTable's workflow mode switches to its one-line grid at the viewport's `md` breakpoint (`frontend/src/components/dashboard/RunTable.svelte:46`, `110px / minmax(0,1fr) / 180px / 110px`), but the page's history sits beside the 340px step list from `lg` (`WorkflowDetailPage.svelte:121`) and beside the sidebar. The `1fr` Started column, which holds the reason (`RunTable.svelte:79-87`), therefore gets only a few tens of pixels between `md` and roughly `xl`. The fixed columns plus gaps take about 460px, so the reason wraps word by word and the row grows tall. Likely fix: have RunTable stack by container width (a container query) instead of the viewport breakpoint, or let the reason span the full row width under the grid. Not confirmed in a browser. Repro: open a workflow with a failed run at about 800 to 1200px wide with the sidebar open.
status: open
