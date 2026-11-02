---
status: complete
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
result: pass

### 4. Activity: Everything adds tool calls, agent text, token lines
result: not tested (needs a run that calls an LLM; Jobsworth chose the desktop app instead)

### 5. Show Results in Finder (desktop app only)
result: issue (BUG-4, BUG-5)

## Issues

### BUG-1: Waiting hero repeats the question in the eyebrow
severity: cosmetic
checkpoint: 1
reported: "The question is repeated in the eyebrow."
diagnosis: `frontend/src/lib/runHero.ts:81` builds the eyebrow as `{gate} · {kind}` where `gate` is the node label, and the heading as `question ?? gate`. In `examples/product_design_factory.dot` the gate's label and question are both "Human: pick direction(s)", so the same text shows twice. Not specific to the data: any gate whose label equals its question does this.
status: fixed

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

### BUG-4: Show Results in Finder always fails for a run started in the desktop app
severity: major
checkpoint: 5
reported: "Couldn't show the results in Finder. Something went wrong." (run 01m6dzp1xf8fjatqw9m9wbj8dj, Completed, HumanGateShowcase)
diagnosis: `GET /api/runs` returns `run_working_dir` as a path relative to the data dir (`artifacts/01m6dzp1…`, which lives at `~/Documents/smasher/artifacts/…`). `RunPage.svelte:296` passes it straight to `reveal_run_folder`, and `validate_reveal_run_dir` (`crates/smasher-desktop/src/reveal.rs`) calls `canonicalize` on it, which resolves against the desktop process's working directory (`crates/smasher-desktop`), so the folder isn't found and it refuses with "That folder isn't one of this app's runs." The unit tests and the stand-in invoke used absolute paths, so none of them caught it. Likely fix: resolve a relative path against the data dir (`RunsDir`'s parent) before validating, or have the server return an absolute `run_working_dir`. `rehydrate.rs:126` shows the run root can already be absolute, so check why launched runs aren't.
status: fixed

### BUG-5: The real refusal reason is swallowed
severity: minor
checkpoint: 5
reported: same message, with "Something went wrong." instead of a reason
diagnosis: Tauri `invoke` rejects with a plain string, and `errorMessage` (`frontend/src/lib/notify.ts:6-8`) only reads `Error` instances, so `RunHero.svelte:47-50` falls back to "Something went wrong." and drops the "That folder isn't one of this app's runs." text the Rust side sent. Affects every native-command error that goes through `errorMessage`.
status: fixed

## Summary
- pass: 1 (checkpoint 3). issue: 3 (checkpoints 1, 2, 5). not tested: 1 (checkpoint 4).
- 5 bugs filed: 1 major (BUG-4), 2 minor (BUG-2, BUG-5), 2 cosmetic (BUG-1, BUG-3).
- Fixed: BUG-1, BUG-4, BUG-5. Open: BUG-2 (needs a call on absolute path vs. resolution), BUG-3 (needs the user to name the differences).
