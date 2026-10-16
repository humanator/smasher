---
name: verify-spec
description: Human UAT verification of a spec + implementation plan against the real running app. Runs automated gates fresh, generates a manual-test checklist that deliberately excludes anything already covered by Playwright e2e, then tracks the human's pass/issue/skip results to a report. Use for docs/specs/<slug>/spec.md + implementation-plan.md pairs in this repo. Args: <slug> (e.g. "polygon-yard-editor") or a path to the implementation plan.
---

# Verify Spec — human UAT against automated-gate coverage

Adapted from the GSD `verify-work` workflow
(https://github.com/open-gsd/gsd-core/blob/next/gsd-core/workflows/verify-work.md)
for a repo with no GSD planning infrastructure. This repo's spec/plan pairs
live at `docs/specs/<slug>/{spec.md,implementation-plan.md}`; automated
coverage is Jest (`__tests__/`, `components/__tests__/`, `hooks/__tests__/`)
and Playwright (`e2e/*.spec.ts`) per `CLAUDE.md`.

## Philosophy

**Only ask a human to check what a machine can't.** If a Playwright spec
already drives a flow and asserts its outcome, re-testing it by hand is
theatre — it wastes Jobsworth's time and produces no new information. The
value of a human pass is judgment: does it *feel* right, is it legible, is
the real-world result (typed against Jobsworth's actual property/data, not
synthetic fixtures) actually correct.

**Show expected, ask if reality matches — one at a time.** Present a single
checkpoint, wait for Jobsworth to actually go test it in the running app,
record the result, then move to the next. Don't dump the whole checklist
and ask for a batched report back — that's how items get half-tested or
skimmed from memory instead of actually driven in the browser. Write
everything to a tracking file as you go, so a mid-run `/clear` or session
drop resumes from the last recorded item instead of losing progress.

**Diagnose before filing.** Once every checkpoint has a result, don't just
hand back the raw complaints. For each reported issue, actually look at the
relevant code (the component/hook/util the checkpoint exercises) and form a
real hypothesis about the cause before writing it up — a filed bug with a
guessed file:line pointer and a plausible mechanism is worth far more than
a verbatim transcript of what Jobsworth typed.

**Report, don't auto-fix.** This skill's job ends at a clear list of filed
bugs with diagnoses. Fixing is a separate, explicit follow-up — don't
spawn planning/fix loops or start editing code uninvited.

## Process

### 1. Resolve the target

Given `<slug>` or a path, locate `docs/specs/<slug>/spec.md` and
`docs/specs/<slug>/implementation-plan.md`. If only one exists in
`docs/specs/`, use it; if several, ask which.

### 2. Run the automated gates fresh

Don't trust a plan's self-reported "all green" — re-run it now:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e
```

Report pass/fail per gate before anything else. If any gate is red, that's
already a finding — surface it immediately; a red gate usually makes the
manual pass premature (fix the gate first, or note the human checklist is
being run against known-broken automated coverage).

### 3. Build the exclusion set from existing e2e coverage

List the Playwright spec(s) for this feature (`e2e/*.spec.ts`) and extract
every `test(...)` name/description. This is the set of behaviors already
mechanically asserted end-to-end — do not put these back in front of a human.

### 4. Extract candidate checkpoints

Pull user-observable claims from two places:
- The spec's acceptance-criteria / scenario section (e.g. spec §8).
- Any `implementation-plan.md` per-prompt "Acceptance criteria" checkboxes
  that describe user-observable behavior (skip criteria that are purely
  internal/code-structure — "npm test green", "one commit per drag", etc.;
  those are gate-covered by step 2, not human-observable).

For each candidate, check it against the exclusion set from step 3. Drop it
if a Playwright test already asserts it end-to-end.

What survives is almost always judgment calls a script can't make:
- Visual/qualitative fidelity (does a fill look distinct, is the grid
  genuinely unobtrusive, does the drawing look proportionally faithful when
  real tape measurements are entered against a real property).
- Interaction *feel* (snap granularity, label legibility mid-drag,
  discoverability of a gesture like double-click-to-add-vertex, whether a
  transient hint is on screen long enough to read).
- Scope guards from the spec's non-goals section — confirm the shipped app
  does NOT expose something explicitly deferred (curved edges, angle
  editing, smart snapping, containment warnings, old-data migration).
- Anything the plan flagged as "confirm by hand" that predates the e2e
  suite existing, cross-checked against whether e2e now actually covers it
  (if it does, drop it — the flag is stale).

### 5. Write the tracking file

`docs/specs/<slug>/VERIFICATION.md`:

```markdown
---
status: testing
source: spec.md, implementation-plan.md
e2e_excluded: [list of e2e test names excluded as already-covered]
started: <ISO timestamp>
updated: <ISO timestamp>
---

## Automated gates (this run)
- lint: pass|fail
- tsc: pass|fail
- jest: pass|fail (N/N)
- build: pass|fail
- e2e: pass|fail (N/N)

## Manual checklist

### 1. <name>
expected: <what should happen, specific and observable>
result: pending

...

## Issues
<!-- appended as reported, then updated with diagnosis -->
```

### 6. Make sure the app is reachable

Start the dev server (`npm run dev`, port 3000) if it isn't already running,
and confirm it responds before starting the interactive pass.

### 7. Present checkpoints one at a time

For each pending item, in order:

1. Show the checkpoint: number, name, and the `expected` text — what
   Jobsworth should do and what should happen. Nothing else in that message.
2. Wait for a real response (don't proceed on your own assumption). Use
   `AskUserQuestion` with two concrete options plus room for free text:
   - "Matches expected" → pass
   - "Skip — can't test now" → skipped (capture why if given)
   - Free text (the tool's automatic "Other") → treat as an issue report
3. Process the response immediately and write it to the tracking file
   before presenting the next checkpoint:
   - Pass → `result: pass`.
   - Skip → `result: skipped`, reason if given.
   - Anything else → `result: issue`, capture the verbatim report, and infer
     severity from language (crash/broken → blocker; doesn't work/wrong →
     major; slow/off/minor → minor; color/spacing/visual → cosmetic —
     default major if unclear; never ask Jobsworth to self-rate severity).
   Update the tracking file's frontmatter `updated` timestamp and the
   Summary counts on every write — this is the resumable checkpoint.
4. Move to the next pending item. If resuming an interrupted session, skip
   straight to the first item still `pending`.

### 8. Diagnose reported issues

Once every item has a result, for each `result: issue` entry: read the
component/hook/util the checkpoint exercises, form a concrete hypothesis for
the cause (not just restate the symptom), and note it against the issue —
a file:line pointer where the cause is reasonably clear, or "needs further
investigation" where it isn't. Do this for all issues before reporting back
(a quick parallel look across files is fine; don't fix anything yet).

### 9. File the bugs and report

Write each diagnosed issue into the tracking file's `## Issues` section as
a filed bug:

```
### BUG-<n>: <one-line summary>
severity: blocker|major|minor|cosmetic
checkpoint: <item # and name>
expected: <what should have happened>
reported: "<verbatim Jobsworth report>"
diagnosis: <hypothesis + file:line, or "needs investigation">
status: open
```

Then present the final summary:

```
## Verification: <slug>

Automated gates: <pass/fail summary>

| # | Check | Result |
|---|-------|--------|
...

### Bugs filed
<table or list of BUG-n entries: summary, severity, diagnosis pointer>
```

Do not proceed to fixing or planning fixes unless asked.
