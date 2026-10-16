---
status: complete
source: SPEC-dashboard.md, tasks/archive/plan-dashboard.md, tasks/archive/todo-dashboard.md
e2e_excluded:
  - "dashboard: search filters the workflows table by title and file name"
  - "dashboard: Run… opens the run sheet, launches, and lands on the new run"
  - "dashboard: the Recent runs filter and ?runs= follow each other, including the sidebar links"
  - "dashboard: a run waiting on a person raises the banner and shows as Needs you until it is answered"
  - "dashboard: every dashboard action can be reached with Tab and shows a focus ring"
  - "dashboard: at phone width › stacks the tables and never scrolls sideways, with or without a dialog open"
  - "run-launch: launches the typed brief, model and variable, then shows them on the run page"
  - "run-launch: shows a wrong-shape Step overrides error inline and stays on the dashboard"
  - "settings: a default saved in the Settings dialog applies to the next run"
  - "run-summary: the run list shows \"Unnamed workflow\" for a run with no graph name"
gate_covered:
  - "SC8 waiting_since: cargo test -p smasher-web, tests/lib/api/runs.test.ts"
  - "SC10 gates: see VERIFICATION-shell-theme.md"
started: 2026-10-16T09:28:23Z
updated: 2026-10-16T10:50:58Z
---

## Automated gates

These are shared with [VERIFICATION-shell-theme.md](VERIFICATION-shell-theme.md). All pass.
`candidate-preview.spec.ts:81` fails only in the container, because of its Chromium build, and
passes on Simon's Mac. `dashboard.spec.ts:34` flakes under 2 workers and passed when re-run
alone. Desktop clippy passes on Simon's Mac.

## Manual checklist

### 1. `/` matches the Home artboard, light
expected: At 1440×900 in the browser (light), `/` matches `Home.dc.html` in layout, hierarchy, copy and tokens: toolbar, banner, All workflows and Recent runs. The only allowed differences are D2–D5 and "Waiting since {time}" in Last activity.
result: pass

### 2. `/` matches the Home artboard, dark
expected: Same check with the OS in dark mode. Surfaces, zebra rows, badges and accent text all stay legible and in the macOS dark style.
result: pass

### 3. `/` in the desktop app
expected: In `make desktop-dev`, `/` looks the same as in the browser, with the traffic lights in the sidebar inset, in light and dark.
result: pass

### 4. Banner for a real gallery gate
expected: With a run waiting at a gallery gate, the banner reads "{Workflow} is waiting for your decision" and "Pick a favourite · {c} candidates ready · waiting {m} minutes". The wait wording moves on after a minute or so without a reload. **Review Candidates** opens that run. With two or more waiting runs, "+ N more waiting" appears and lands on the Needs you filter.
result: pass

### 5. Workflow status and last activity
expected: Against your real run history, each workflow row shows the status from R3. Needs you shows "Waiting since {time}", Running shows "Since {time}", and Completed, Failed or Aborted show the latest run's finish time. A workflow with no runs shows "No runs yet" and "—". Times read en-AU: "Today, 10:42 am", "Yesterday, 4:20 pm", "Fri 9 Oct, 3:48 pm".
result: pass

### 6. Run filter counts
expected: The counts on All, Active, Completed and Failed or stopped match the rows each filter shows, and Failed or stopped includes aborted runs. An empty filter says "No runs in this view."
result: pass

### 7. Durations
expected: A finished run shows a fixed duration ("48 s", "7 min 48 s", "1 h 12 min") that doesn't change. An active run shows "… so far" and updates within about 30 s without a reload.
result: pass

### 8. Run sheet matches the artboard
expected: **Run…** opens a 520px sheet titled `Run "{Workflow}"` with the "Everything here is optional…" description. Brief, Model ("Default (from Settings)"), Extra values and the Advanced disclosure match the artboard's labels, hints and placeholders in light and dark. A bad Extra values line shows "Line {n}: write it as name=value". Non-JSON step overrides show "That is not valid JSON yet (…)". **Start Run** briefly reads **Starting…**.
result: pass

### 9. Settings in the browser
expected: In the browser, Settings is a 620px window with a labelled × close, no traffic lights, no tab strip and no Keychain line, showing Defaults only. Saving shows "Saved. Changes apply to the next run." and nothing mentions restarting. The provider list is the same as before (no "Infer from model name" or "Claude CLI").
result: pass

### 10. Settings in the desktop app
expected: In `make desktop-dev`, Settings shows the Defaults, Services and Claude CLI tabs, and arrow keys move between them. In Services, each provider shows Key saved or No key. Saving a key, replacing it and removing it all work, and Base URL keeps its Ollama hint. In Claude CLI, **Detect** and **Reset to Default** work. Hello-world then runs with the saved key, exactly as before.
result: pass

### 11. Empty and error states
expected: Importing a malformed `.dot` shows an inline error above the table. A search with no matches says "No workflows match that search." With the backend stopped, the table shows an inline alert with **Try Again**, which recovers once the backend is back.
result: pass

### 12. Phone width reads well
expected: At 375px, both tables become readable stacked rows (workflow: title and badge, meta, actions; run: badge and workflow, then started · duration). Search sits full width under the toolbar, the filter scrolls inside itself, and the Run sheet and Settings keep 16px gutters.
result: pass

## Issues
None reported in the manual pass.

## Summary
total: 12 · pass: 12 · issue: 0 · skipped: 0 · pending: 0
