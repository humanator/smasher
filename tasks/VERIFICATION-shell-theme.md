---
status: complete
source: SPEC-shell-theme.md, tasks/plan.md, tasks/todo.md
e2e_excluded:
  - "app-shell: shows the ⚡ favicon and never asks for /vite.svg"
  - "app-shell: toasts each failing poll on a missing run once, not on every tick"
  - "app-shell: sidebar links reach Workflows, Recent runs and a workflow page"
  - "app-shell: a run waiting on a person shows in Needs you and the workflow dot, and clears within a poll once answered"
  - "app-shell: at phone width › the sidebar opens as a sheet and the page does not scroll sideways"
  - "no-tauri-breakage: runs with zero Tauri-only code paths breaking in a plain browser"
gate_covered:
  - "SC1 contrast pairs: tests/lib/tokens.test.ts, tests/lib/contrast.test.ts"
  - "SC5 pending_questions: cargo test -p smasher-web, tests/lib/api/runs.test.ts"
started: 2026-10-16T09:28:23Z
updated: 2026-10-16T10:14:10Z
---

## Automated gates (this run, shared with VERIFICATION-dashboard.md)

Run in the cloud container at `fb5061e`.

- svelte-check: pass (1380 files, 0 errors, 0 warnings)
- eslint: pass (`npx eslint .`, without `--fix`)
- vitest: pass (1101 passed, 1 skipped)
- build:check: pass (12 chunks, all under 500 kB)
- e2e (non-LLM): 28 passed, 2 failed, 1 skipped (the LLM-spending critical path)
  - `candidate-preview.spec.ts:81`: fails in the container only. The lightbox iframe click
    times out with "`<html>` intercepts pointer events", and it also fails on `bc232c7`. It
    **passes on Simon's Mac** (1 passed, 5.4 s) with Playwright's matching Chromium, which
    confirms the container's Chromium build 1194 (Playwright 1.63 expects 1243) is the cause.
  - `dashboard.spec.ts:34` (Run… opens the run sheet): failed with 2 workers and passed when
    re-run alone. It flakes under parallel load.
- cargo test -p smasher-web: pass (212 tests)
- cargo clippy --workspace --exclude smasher-desktop -D warnings: pass in the container.
- cargo clippy -p smasher-desktop -D warnings: pass on Simon's Mac. The container can't build
  it because the GTK system libraries (`gdk-sys`) are missing.

## Manual checklist

Run these against the app on your Mac: `make desktop-dev` for native items, or
`cargo run -p smasher-cli -- serve` plus `npm run dev` for browser items.

### 1. Primitives match their boards, light
expected: With the OS in light mode, open `/design` next to the 13 component boards (Button, Badge, Input, Textarea, Select, Checkbox, Switch, Tabs, ToggleGroup, Accordion, Tooltip, Popover, Drawer). Each primitive matches its board 1:1 in size, radius, colour, type and states (hover, focus, disabled, invalid).
result: pass

### 2. Primitives match their boards, dark
expected: Switch the OS to dark mode with no reload. `/design` follows it, and every primitive has a sensible dark version with no white flashes, invisible borders or unreadable text.
result: pass

### 3. Touch targets on a coarse pointer
expected: In DevTools mobile emulation (touch), every button, checkbox, switch, tab and toggle is easy to hit, with about a 44px hit area. On a normal mouse pointer the controls stay at their board sizes.
result: pass

### 4. Sidebar matches the Workflow artboard
expected: The sidebar is 220px wide. It has the Library rows (Workflows, Recent runs, Needs you) with accent icons and right-aligned counts, the Needs you pill hidden at 0, and a scrolling Workflows list with the current workflow highlighted. Its footer reads "Smasher" or "Smasher · N run(s) need your decision". In the browser the header shows the "Smasher" wordmark. Toggle sidebar collapses it to an icons-only 76px rail with hover titles, and it can be driven by keyboard with a visible ring.
result: pass

### 5. Every page in the new shell, nothing lost
expected: Workflow detail, a run page, the editor, New workflow and `/design` all render inside the sidebar and 52px toolbar, in light and dark. Each has a back button where it used to have a breadcrumb, and no page is missing a control it had before.
result: pass

### 6. Native title bar in the desktop app
expected: In `make desktop-dev`, the real traffic lights sit inside the sidebar header's inset with no overlap, and no window title text shows. The window drags from the toolbar and from the sidebar header, but buttons there still click instead of dragging.
result: pass

## Issues
None reported in the manual pass.

## Summary
total: 6 · pass: 6 · issue: 0 · skipped: 0 · pending: 0
