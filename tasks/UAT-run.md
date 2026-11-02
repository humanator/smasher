---
status: testing
source: tasks/archive/SPEC-run.md
e2e_excluded: [run-page.spec.ts (all 6), gallery-gate.spec.ts, question-card.spec.ts, run-summary.spec.ts]
started: 2026-11-02
updated: 2026-11-02
---

## Automated gates (this run)
- cargo fmt, clippy -D warnings: pass
- cargo test --workspace: pass (3361/3361)
- svelte-check, build:check: pass
- vitest: 1378/1379 on the first run; the one failure (RunPage "Activity", `Take a nap`) is flaky, passes alone and on re-run (seen twice).
- playwright (non-LLM, critical-path excluded): 41/43 on the first run. gallery-gate was a real stale test (button is now "Approve Selected", fixed in 2eeb9500); dashboard search was flaky. Both pass on re-run.
- fake claude log: 0 bytes (no LLM spend)

## Manual checklist

### 1. Waiting hero (free-text gate)
expected: accent eyebrow, question as heading, panel on Progress.
result: issue (BUG-1)

### 2. Waiting run with candidates, Decision bar, Select/Approve (seeded gallery run)
result: issue (BUG-3). Behaviour all present; styling doesn't match the design.

### 3. Iterate from the Decision bar ("Try Again with My Notes")
result: pending

### 4. Activity: Everything adds tool calls, agent text, token lines
result: pending

### 5. Show Results in Finder (desktop app only)
result: pending

## Issues

### BUG-1: Waiting hero repeats the question in the eyebrow
severity: cosmetic
checkpoint: 1
reported: "The question is repeated in the eyebrow."
diagnosis: `frontend/src/lib/runHero.ts:81` builds the eyebrow as `{gate} · {kind}` where `gate` is the node label, and the heading as `question ?? gate`. In `examples/product_design_factory.dot` the gate's label and question are both "Human: pick direction(s)", so the same text shows twice. Not specific to the data: any gate whose label equals its question does this.
status: open

### BUG-2: gallery_gate_showcase.dot can't produce candidates when run from the app
severity: minor
checkpoint: 2 (found while setting up; not a run-page bug)
expected: running the example makes three candidates.
reported: "I still don't see candidates" (run 01m6dfyqm1w6558n1010vnnk57)
diagnosis: `Render1` fails with "candidate directory has no index.html: <run dir>/crates/smasher-render-capture/fixtures/candidate". The DOT's `candidate_dir` is relative to the repo root, but the tool resolves it against the run's own folder. The gate is then reached with no candidates, so the page shows only the question (correct for that data). Fix is in the example DOT (absolute path) or the tool's path resolution.
status: open

### BUG-3: Candidates/Decision bar styling doesn't match the design
severity: cosmetic
checkpoint: 2
reported: "candidate grid is present, decision bar is present, and everything else described is present, but the visual styling doesn't match the design"
diagnosis: needs investigation. No specifics yet, and the artboard (`docs/design/redesign/Run.dc.html`) doesn't render here (missing `support.js`), which is why `tasks/VERIFICATION-run.md` records no pixel comparison. Needs the user to name which parts differ.
status: open
