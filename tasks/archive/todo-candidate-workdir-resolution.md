# Task List: `candidate-workdir-resolution`

Full context and rationale in `tasks/archive/plan-candidate-workdir-resolution.md`. Spec:
`design-factory/SPEC-candidate-workdir-resolution.md`.

---

## Task 1: `HybridToolBackend` resolves `candidate_dir` against `working_dir`

**Description:** Add a `working_dir: PathBuf` field to `HybridToolBackend`
(`crates/smasher-render-capture/src/backend.rs`), a new third constructor parameter
of the same name/type appended after `artifacts_base`, and a private
`resolve_candidate_dir(&self, candidate_dir: &str) -> PathBuf` helper matching the
spec's Code Style section exactly:

```rust
fn resolve_candidate_dir(&self, candidate_dir: &str) -> PathBuf {
    let path = Path::new(candidate_dir);
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        self.working_dir.join(path)
    }
}
```

`run_render_capture` calls this helper on the `candidate_dir` string it already reads
out of `args`, and passes the *resolved* `PathBuf` to `crate::capture(...)` in place
of today's bare `Path::new(candidate_dir)`. Update the constructor's doc comment to
describe the new parameter (mirroring how `artifacts_base` is already documented).

Every existing test in this file that calls `HybridToolBackend::new(fallback, X)`
needs its call site updated for the new arg — six call sites (lines ~144, 152, 171,
200, 238, 264 as of this plan). All of them already pass an **absolute** fixture
`candidate_dir` (`fixture_candidate_dir()` is `CARGO_MANIFEST_DIR`-based), so per spec
assumption 3 they're unaffected by resolution — pass `PathBuf::from("/tmp/unused")`
(matching whatever the test already uses for `artifacts_base`, or a fresh
`tempfile::tempdir()` path where one test needs a real writable dir) as the new third
argument. Do not change any existing assertion.

**Acceptance criteria:**
- [x] `HybridToolBackend` has a `working_dir: PathBuf` field
- [x] `HybridToolBackend::new` takes `(fallback, artifacts_base, working_dir)`, doc
      comment updated
- [x] `resolve_candidate_dir` helper exists, matching the spec's Code Style block
- [x] `run_render_capture` passes the resolved path to `crate::capture(...)`, not the
      raw `Path::new(candidate_dir)`
- [x] All 6 existing test call sites updated to the 3-arg constructor, no existing
      assertion changed
- [x] New unit test: a relative `candidate_dir` resolves to
      `working_dir.join(candidate_dir)` (assert on the resolved path, e.g. by pointing
      `working_dir` at a `tempfile::tempdir()` containing a real fixture-shaped
      candidate and confirming `capture()` succeeds against the joined path)
- [x] New unit test: an absolute `candidate_dir` is used as-is even when `working_dir`
      is also set to something else entirely (e.g. a nonexistent path) — proves
      absolute values never get joined

**Verification:**
- [x] `cargo test -p smasher-render-capture` exits 0
- [x] `cargo clippy -p smasher-render-capture` clean
- [x] Read-through: `resolve_candidate_dir` is called exactly once, in
      `run_render_capture`, and nowhere else in the crate bypasses it

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-render-capture/src/backend.rs`

**Estimated scope:** Small (1 file: 1 field, 1 helper, 1 call-site swap, 6 test
call-site updates, 2 new tests)

---

## Task 2: `SystemLintToolBackend` resolves `candidate_dir` against `working_dir`

**Description:** Identical treatment to Task 1, applied to
`crates/smasher-system-lint/src/backend.rs`'s `SystemLintToolBackend`. The helper is
duplicated verbatim per spec's Code Style section (no shared crate — see plan's
Architecture Decisions). `run_system_lint` passes the resolved path to `crate::lint(...)`
in place of today's `Path::new(candidate_dir)`.

Three existing test call sites in this file (lines ~141, 149, 165 as of this plan)
need the new third argument, same minimal-diff treatment as Task 1 — all use an
absolute fixture path already, unaffected by resolution.

**Acceptance criteria:**
- [x] `SystemLintToolBackend` has a `working_dir: PathBuf` field
- [x] `SystemLintToolBackend::new` takes `(fallback, artifacts_base, working_dir)`,
      doc comment updated (it already cross-references
      `HybridToolBackend::new` — keep that cross-reference accurate)
- [x] `resolve_candidate_dir` helper exists (duplicated from Task 1, not imported)
- [x] `run_system_lint` passes the resolved path to `crate::lint(...)`
- [x] All 3 existing test call sites updated to the 3-arg constructor, no existing
      assertion changed
- [x] New unit test: relative `candidate_dir` resolves against `working_dir`
      (same shape as Task 1's, using this crate's `clean-candidate` fixture copied
      into a `tempfile::tempdir()` `working_dir`)
- [x] New unit test: absolute `candidate_dir` passes through unchanged regardless of
      `working_dir`

**Verification:**
- [x] `cargo test -p smasher-system-lint` exits 0
- [x] `cargo clippy -p smasher-system-lint` clean
- [x] Read-through: `resolve_candidate_dir` called exactly once, in
      `run_system_lint`

**Dependencies:** None (parallel-eligible with Task 1 — different crates)

**Files likely touched:**
- `crates/smasher-system-lint/src/backend.rs`

**Estimated scope:** Small (1 file, same shape as Task 1)

---

## Checkpoint A: Both crates complete, standalone

- [x] `cargo test -p smasher-render-capture -p smasher-system-lint` green
- [x] `cargo clippy -p smasher-render-capture -p smasher-system-lint` clean
- [x] **Human review before Task 3** — Tasks 1-2 leave `run.rs`/`pages.rs`/`api.rs`
      not compiling (their `::new()` calls are now missing the third argument); confirm
      the two backends' new constructor shape is right before propagating it to all
      four call sites, since fixing a mistake here after Task 3 means touching every
      site twice

---

## Task 3: Wire `working_dir` into the 4 real construction sites

**Description:** Each of the 4 real construction sites already has an in-scope
working-directory value it hands to the sibling Codergen backends for the identical
reason (spec assumption 2). Each one needs `PathBuf::from(&that_value)` added as the
third argument to its `HybridToolBackend::new(...)` and `SystemLintToolBackend::new(...)`
calls. No new value is computed anywhere — this is purely: wrap the existing `String`,
pass it through.

Four sites, three files:

1. **`crates/smasher-cli/src/run.rs`** (~line 1111/1116): value is
   `effective_working_dir` (a `String`; `PathBuf::from(&effective_working_dir)`).
   Covers both the normal run-directory path and the `--worktree` branch — both are
   already absolute strings assigned to the same `effective_working_dir` binding, so
   no branch-specific handling is needed (see plan's Architecture Decisions on
   `--worktree`).
2. **`crates/smasher-web/src/routes/pages.rs`** (~line 407/412): value is
   `run_working_dir` (`PathBuf::from(&run_working_dir)`) — already cloned at this call
   site for the sibling Codergen backends (lines ~386/398/404), so the pattern to
   follow is right there.
3. **`crates/smasher-web/src/routes/api.rs`, `submit_run`** (~line 268/273): value is
   `spawn_working_dir` (`PathBuf::from(&spawn_working_dir)`).
4. **`crates/smasher-web/src/routes/api.rs`, `resume_run`** (~line 598/603): same
   binding name, same treatment, second function in the same file.

**Acceptance criteria:**
- [x] All 4 sites' `HybridToolBackend::new(...)` calls pass a `PathBuf`-wrapped
      working-directory value as the third argument
- [x] All 4 sites' `SystemLintToolBackend::new(...)` calls pass the same value
- [x] No new variable is computed at any site — only an existing `String` binding
      wrapped in `PathBuf::from(&...)`
- [x] `grep -rn "HybridToolBackend::new\|SystemLintToolBackend::new" --include="*.rs" .`
      confirms no 5th real (non-test) site exists beyond these 4 (already checked
      during planning — reconfirm post-edit in case something else changed)

**Verification:**
- [x] `cargo check -p smasher-render-capture -p smasher-system-lint -p smasher-web -p smasher-cli`
      exits 0
- [x] `cargo test --workspace` green
- [x] `cargo clippy --workspace` clean
- [x] Read-through of all 4 diffs: confirm the wrapped value at each site is the same
      binding already passed to that site's Codergen/LLM backends for `working_dir`
      (not `artifacts_base`, not a freshly-introduced value)

**Dependencies:** Checkpoint A (Tasks 1, 2)

**Files likely touched:**
- `crates/smasher-cli/src/run.rs`
- `crates/smasher-web/src/routes/pages.rs`
- `crates/smasher-web/src/routes/api.rs`

**Estimated scope:** Small (3 files, 4 mechanical one-line insertions — but touches
shared, load-bearing wiring, so verification is not skippable)

---

## Checkpoint B: Workspace compiles and passes

- [x] `cargo check -p smasher-render-capture -p smasher-system-lint -p smasher-web -p smasher-cli`
      exits 0
- [x] `cargo test --workspace` green
- [x] `cargo clippy --workspace` clean

---

## Task 4: Fix `examples/product_design_factory.dot` to point at real output

**Description:** Per spec assumption 5, replace every fixture `candidate_dir` with
the real relative path each corresponding Codergen node's `prompt` actually writes
to, and make `IAOptions`'s prompt explicit about the four exact candidate directory
names (resolving spec Open Question 1 — hardcode the names in the prompt rather than
deferring naming to the LLM, since `RenderDiscoverA`-`D`'s `candidate_id` args are
already hardcoded to `discover-a`..`discover-d` and must match).

Specific edits:
- `IAOptions`'s `prompt`: change "build 3-4 distinct, working interaction patterns
  (not visual skins) under `./candidates/<id>/`" to explicitly name the four
  directories the four render nodes below expect, e.g. "...under
  `./candidates/discover-a/`, `./candidates/discover-b/`, `./candidates/discover-c/`,
  and `./candidates/discover-d/` (build up to 4 if the brief supports that many
  distinct directions; fewer is fine, but each one built must use its listed
  directory exactly)."
- `RenderDiscoverA`: `candidate_dir` → `"./candidates/discover-a"`
- `RenderDiscoverB`: `candidate_dir` → `"./candidates/discover-b"`
- `RenderDiscoverC`: `candidate_dir` → `"./candidates/discover-c"`
- `RenderDiscoverD`: `candidate_dir` → `"./candidates/discover-d"`
- `RenderDefine`: `candidate_dir` → `"./build/define"` (matches `Implement`'s prompt,
  which already says "under `./build/define/`")
- `SystemLint`: `candidate_dir` → `"./build/define"` (same directory `RenderDefine`
  just captured — `SystemLint` checks the same build, per the pipeline's existing
  `CritiqueParallel` fan-out)

**Acceptance criteria:**
- [x] No `candidate_dir` value in the file references
      `crates/smasher-render-capture/fixtures/` or `crates/smasher-system-lint/fixtures/`
- [x] `RenderDiscoverA`-`D`'s `candidate_dir` values match their `candidate_id`
      values one-to-one (`discover-a`/`./candidates/discover-a`, etc.)
- [x] `RenderDefine` and `SystemLint` both point at `./build/define`
- [x] `IAOptions`'s prompt explicitly names all four candidate directories the render
      nodes below it expect

**Verification:**
- [x] Read-through: every `candidate_dir` in the file is a relative path a Codergen
      `prompt` in this same file actually instructs the agent to write to — no
      orphaned reference
- [x] `smasher lint examples/product_design_factory.dot` (or workspace-equivalent
      static validation, if one exists) still parses the file cleanly — a pure
      string-literal edit, so no structural DOT change

**Dependencies:** None (independent of Tasks 1-3's Rust changes; can happen in
parallel, though listed after Checkpoint B for reading order)

**Files likely touched:**
- `examples/product_design_factory.dot`

**Estimated scope:** XS (string-literal edits only, one file)

---

## Task 5: End-to-end proof against a real provider (manual, human-run)

**Description:** This is **not** part of `cargo test --workspace` or any CI gate —
per spec's Testing Strategy, it needs a running provider and produces
non-deterministic LLM output. Run `examples/product_design_factory.dot` for real,
through to `GalleryGate1`, with a configured provider — local Ollama
(`smasher-llm`'s `ollama` provider) is sufficient, no paid API key required.

This is the acceptance test the spec's own history flags as previously skipped: live
run `e77dc49`'s commit message admits this was never performed, and that's exactly
why the pipeline was still pointing at fixtures. Don't mark this module done without
actually doing it.

**Acceptance criteria:**
- [x] `smasher run examples/product_design_factory.dot --var brief="<a real brief>"`
      (or the web dashboard equivalent) runs through to `GalleryGate1` without error
- [x] The gallery gate shows actual generated onboarding-flow markup for each
      rendered candidate — not `<h1>Fixture candidate</h1>`
- [x] Each candidate's captured output differs from the others (distinct interaction
      patterns, per `IAOptions`'s prompt) — confirms real per-candidate generation,
      not four copies of one render

**Verification:**
- [x] Screenshot or terminal transcript of the gallery gate showing real markup,
      kept as evidence for the Success Criteria checkpoint below
- [x] Note any `--worktree`-mode-specific behavior observed, confirming or correcting
      the plan's Architecture Decision that no code change was needed there (spec
      Open Question 2)

**Dependencies:** Checkpoint B, Task 4

**Files likely touched:** None (verification only)

**Estimated scope:** Manual — not sized in engineering effort; requires a configured
LLM provider and human judgment of the rendered output

---

## Task 6: Final verification pass

**Description:** Walk every bullet in `SPEC-candidate-workdir-resolution.md`'s
Success Criteria section and confirm each has concrete evidence (a test, a diff, or
Task 5's transcript/screenshot) — not just "looks done."

**Acceptance criteria:**
- [x] `HybridToolBackend::new` and `SystemLintToolBackend::new` both take
      `working_dir: PathBuf`; relative `candidate_dir` resolves against it, absolute
      doesn't — evidence: Tasks 1-2's new unit tests (commits `da668c1`, `3f35595`)
- [x] All 4 real construction sites pass their in-scope working-directory value
      through — evidence: Task 3's diff (commit `bd7b850`)
- [x] `product_design_factory.dot`'s render/lint nodes point at `./candidates/<id>`
      and `./build/define` — evidence: Task 4's diff (commit `635ce49`)
- [x] A real run shows actual generated candidates, not `Fixture candidate` —
      evidence: real run through `smasher serve` (Ollama `gemma4:31b-cloud`) reached
      `GalleryGate1` with 3 distinct real interaction patterns rendered (not the
      fixture placeholder), confirmed by the human running it. (The first attempt
      failed with the old fixture path — traced to stale `dot_source` cached in the
      browser's file-upload textarea, not a code bug. En route, also fixed an
      unrelated `gallery-gate` bug — its 2s poll was wiping candidate selection —
      commit `464c87a`.)
- [x] `cargo test --workspace` and `cargo clippy --workspace` both clean — evidence:
      Checkpoint B's final run, re-confirmed after Task 4 (docs-only, but re-run
      cheaply insures against drift)

**Verification:**
- [x] Every Success Criteria bullet has a checked box and a one-line evidence pointer
      in this task's acceptance criteria above

**Dependencies:** Task 5

**Files likely touched:** None — this task updates
`design-factory/capability-map.md`'s `candidate-workdir-resolution` row from
`Not started` to `Done` once everything above is checked (per the project's status
column convention: terse, 1-2 words)

**Estimated scope:** XS (checklist pass + one capability-map status edit)
