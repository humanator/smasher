# Task List: `system-lint`

Full context and rationale in `tasks/archive/plan-system-lint.md`. Spec:
`docs/design-factory/SPEC-system-lint.md`.

---

## Task 0: Amend spec for the native-Rust decision

**Description:** `SPEC-system-lint.md`'s assumption 4 currently describes shelling out
to a generalized `design-kit/test/lint-tokens.mjs`. Update it (and the Tech Stack
section's `scraper`/Node lines) to reflect the native-Rust `regex` decision reached
during planning — the spec should match what's actually about to be built before any
code lands.

**Acceptance criteria:**
- [x] Assumption 4 describes the Rust `regex`-based reimplementation, not a subprocess
- [x] Tech Stack section drops the Node/`lint-tokens.mjs` subprocess line and the
      `scraper` dependency line, notes zero new Cargo dependencies
- [x] Boundaries section's "ask first: editing `lint-tokens.mjs`" line is removed
      (no longer applicable — that file isn't touched by this module)

**Verification:**
- [x] Read-through: spec text matches `tasks/archive/plan-system-lint.md`'s Architecture
      Decisions

**Dependencies:** None

**Files likely touched:**
- `docs/design-factory/SPEC-system-lint.md`

**Estimated scope:** XS (doc edit only)

---

## Task 1: Crate scaffold + Cargo dependencies

**Description:** Create the `crates/smasher-system-lint` workspace member. Unlike
`render-capture`, this crate needs **zero new Cargo dependencies** — `regex`, `serde`,
`serde_json`, `thiserror`, `tokio`, `async-trait`, `uuid` are already workspace
dependencies, plus `smasher-attractor` (for `ToolBackend`/`Handler`/`Outcome`) and
dev-dep `tempfile`. Stub `src/lib.rs`, `src/report.rs`, `src/backend.rs`,
`src/checks/mod.rs`, `src/checks/token_adherence.rs`, `src/checks/kit_usage.rs` with
the repo's two-line `ABOUTME:` header convention, empty enough to compile.

**Acceptance criteria:**
- [x] `crates/smasher-system-lint` added to root `Cargo.toml`'s `[workspace] members`
      and `[workspace.dependencies]` (path entry, matching `smasher-render-capture`'s)
- [x] `crates/smasher-system-lint/Cargo.toml` declares only already-present workspace
      deps — no new external dependency introduced
- [x] `src/lib.rs`, `src/report.rs`, `src/backend.rs`, `src/checks/mod.rs`,
      `src/checks/token_adherence.rs`, `src/checks/kit_usage.rs` exist with
      `ABOUTME:` headers, compiling as empty/stub modules

**Verification:**
- [x] `cargo check -p smasher-system-lint` exits 0
- [x] `cargo check --workspace` exits 0 (no regression to existing crates)
- [x] `git diff Cargo.lock` shows no new external crate, only the new workspace member

**Dependencies:** None

**Files likely touched:**
- Root `Cargo.toml`
- `crates/smasher-system-lint/Cargo.toml`
- `crates/smasher-system-lint/src/{lib,report,backend}.rs`
- `crates/smasher-system-lint/src/checks/{mod,token_adherence,kit_usage}.rs`

**Estimated scope:** Small (7-8 files, all boilerplate/stubs)

---

## Task 2: `LintReport`/`CheckResult` + artifact path helper

**Description:** Add `CheckResult { name, passed, violations }` and
`LintReport { checks }` with a `passed() -> bool` convenience method (true iff every
check is clean), plus the duplicated `artifact_dir(run_id, candidate_id) ->
runs/<run_id>/artifacts/<candidate_id>/` helper — pure data and path logic, no
regex/parsing yet, verified in isolation first (same ordering `render-capture` used
for its `Manifest` struct).

**Acceptance criteria:**
- [x] `CheckResult` and `LintReport` in `report.rs` derive `Serialize`/`Deserialize`
- [x] `LintReport::passed()` returns `true` only if every `CheckResult.passed` is `true`
- [x] `artifact_dir()` helper takes `run_id`/`candidate_id`, returns
      `runs/<run_id>/artifacts/<candidate_id>/` (matching
      `smasher-render-capture::manifest::artifact_dir`'s existing behavior)

**Verification:**
- [x] Unit test: `passed()` is `true` when all checks pass, `false` when any fails
- [x] Unit test: `LintReport`/`CheckResult` serde roundtrip
- [x] Unit test: `artifact_dir` produces the expected path for representative
      `run_id`/`candidate_id` values
- [x] `cargo test -p smasher-system-lint` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-system-lint/src/report.rs`

**Estimated scope:** Small (1 file, plus tests in the same file)

---

## Task 3: `token-adherence` check

**Description:** Port `design-kit/test/lint-tokens.mjs`'s declaration parser and
raw-value rules into Rust `regex`: flag raw hex colors (`#...`), raw color functions
(`rgb(`/`rgba(`/`hsl(`/`hsla(`), and un-tokenized values on the same spacing-property
allowlist the JS script uses (`color`, `background*`, `border*`, `outline*`,
`box-shadow`, `border-radius`, `padding*`, `margin*`, `gap`/`row-gap`/`column-gap`),
with the same `1px`/`0`/`0px` exceptions. Public function takes a CSS string, returns
`Vec<String>` violations in the same message shape as the JS script's
(`"{property}: {value} — ..."`) for continuity. A second function extracts what CSS to
check from a candidate directory: `<style>...</style>` block contents from
`index.html` (simple regex extraction, not full HTML parsing) plus the contents of any
top-level `*.css` file in the directory.

**Acceptance criteria:**
- [x] `lint_css(css: &str) -> Vec<String>` in `token_adherence.rs`, rule-for-rule
      matching `lint-tokens.mjs`'s `lint()` function
- [x] `extract_css(candidate_dir: &Path) -> String` pulls `<style>` block(s) from
      `index.html` plus any top-level `*.css` file contents, concatenated

**Verification:**
- [x] Unit tests mirroring `lint-tokens.mjs`'s own behavior: raw hex flagged, raw
      `rgb(...)` flagged, un-tokenized `padding: 12px` flagged, allowed `1px` border
      not flagged, `var(--token)` values never flagged, `font-size` (excluded property)
      never flagged — one test per rule, table-driven
- [x] Unit test: `extract_css` pulls `<style>` block content correctly and ignores
      unrelated HTML
- [x] `cargo test -p smasher-system-lint` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-system-lint/src/checks/token_adherence.rs`

**Estimated scope:** Medium (regex rule porting + table-driven tests)

---

## Task 4: `kit-component-usage` check

**Description:** Four independent regex-based tag/attribute checks against raw
`index.html` text, one per kit component pattern from `design-kit/README.md`:
a `<button>` tag must carry `.btn` in its `class` attribute; an `<input>` tag with no
`type` or `type="text"` must carry `.input`; an element with `role="button"` must
carry `.list-row-action`; an element with `role="dialog"` must carry both
`aria-modal="true"` and the `hidden` attribute. Each rule returns violations naming the
offending tag snippet.

**Acceptance criteria:**
- [x] `check_kit_usage(html: &str) -> Vec<String>` in `kit_usage.rs`, running all four
      rules and aggregating violations
- [x] Each rule flags a missing/mismatched class or attribute and names the offending
      tag in the violation message

**Verification:**
- [x] Unit tests: one passing + one failing fixture snippet per rule (8+ tests) — e.g.
      `<button class="btn btn-primary">` passes, `<button style="...">` fails;
      `<input class="input">` passes, bare `<input>` fails; `role="button"
      class="list-row-action"` passes, bare `role="button"` fails; `role="dialog"
      aria-modal="true" hidden` passes, `role="dialog"` alone fails
- [x] `cargo test -p smasher-system-lint` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-system-lint/src/checks/kit_usage.rs`

**Estimated scope:** Medium (four rules + 8+ focused tests)

---

## Checkpoint: Core mechanics

- [x] `cargo test -p smasher-system-lint` exits 0, covering report, token-adherence,
      and kit-usage — no server/browser/subprocess involved yet — reverified
      2026-09-17: 41 passed, 0 failed across unit + `lint_test.rs`

---

## Task 5: `lint()` library API + fixtures + standalone example

**Description:** Expose the public library entry point composing Tasks 2-4:
`lint(candidate_dir: &Path) -> Result<LintReport, LintError>`, returning a
`LintReport` with two named `CheckResult`s (`"token-adherence"`,
`"kit-component-usage"`). `LintError::MissingEntryPoint` if `index.html` is absent,
matching `render-capture`'s existing error shape. Add
`fixtures/clean-candidate/index.html` (composed entirely from
`design-kit/components/*.html` snippets, referencing `/design-kit/tokens.css`
correctly — should pass both checks) and `fixtures/violating-candidate/index.html`
(inline raw hex color in a `<style>` block, a bare `<button>`, a bare `<input>`, a
custom `role="dialog"` element missing `aria-modal` — should fail both checks). Add
`examples/lint.rs`: CLI taking `candidate_dir`, printing the `LintReport` as pretty
JSON.

**Acceptance criteria:**
- [x] `lib.rs` exposes `lint()` per the signature above, re-exporting `LintReport` and
      `LintError`
- [x] `fixtures/clean-candidate/` passes both checks; `fixtures/violating-candidate/`
      fails both, with violations naming the specific offending elements/declarations
- [x] `examples/lint.rs` takes `candidate_dir` as a CLI arg and prints `LintReport` JSON

**Verification:**
- [x] Integration test (`tests/lint_test.rs`): `lint()` against `clean-candidate`
      returns `passed() == true`; against `violating-candidate` returns
      `passed() == false` with the expected violation content
- [x] `cargo run -p smasher-system-lint --example lint -- fixtures/clean-candidate` and
      `-- fixtures/violating-candidate` both produce sensible JSON output
- [x] Manual: this session reads both fixtures' example output to confirm the
      violation text is legible and correctly targeted, before this task is called done
- [x] `cargo test -p smasher-system-lint` exits 0

**Dependencies:** Tasks 2, 3, 4

**Files likely touched:**
- `crates/smasher-system-lint/src/lib.rs`
- `crates/smasher-system-lint/examples/lint.rs`
- `crates/smasher-system-lint/fixtures/{clean-candidate,violating-candidate}/index.html`
- `crates/smasher-system-lint/tests/lint_test.rs`

**Estimated scope:** Medium (composition + two fixture files + integration test)

---

## Checkpoint A: Crate complete, standalone

- [x] `cargo test -p smasher-system-lint` and `cargo clippy -p smasher-system-lint`
      both clean
- [x] Standalone example run manually against both fixtures; output read and confirmed
- [x] `git diff Cargo.lock` confirms zero new external Cargo dependencies
- [x] **Human review before starting Phase 4 (shared pipeline-wiring code)** —
      everything through Task 5 is new-crate-only, zero risk to existing behavior.
      Covered by the user's `/build auto` plan approval, which explicitly authorized
      running Tasks 1-6 (through `SystemLintToolBackend`, still unwired) before the
      separate, still-required ask-first gate ahead of Task 7's actual file edits.

---

## Task 6: `SystemLintToolBackend`

**Description:** Implement the `ToolBackend` trait as `SystemLintToolBackend`:
dispatches `"system_lint"` to the native `lint()` call from Task 5, falls back to a
wrapped `Arc<dyn ToolBackend>` for every other tool name — generic over the fallback so
it composes on top of whatever chain already exists at each construction site (e.g.
`render-capture`'s `HybridToolBackend` wrapping `LlmToolBackend`). Test pattern:
literally the same `RecordingFallback` double already written in
`smasher-render-capture/src/backend.rs`'s test module.

**Acceptance criteria:**
- [x] `SystemLintToolBackend::new(fallback: Arc<dyn ToolBackend>) -> Self`
- [x] `execute_tool("system_lint", args, _)` parses `{candidate_dir, run_id,
      candidate_id}`, calls `lint()`, writes `lint-report.json` to
      `artifact_dir(run_id, candidate_id)`, returns `Outcome::success_with` referencing
      the artifact path and report
- [x] `execute_tool(other, args, context)` delegates to the wrapped fallback unchanged
- [x] `available_tools()` returns `["system_lint"]`

**Verification:**
- [x] Unit test: `available_tools()` returns exactly `["system_lint"]`
- [x] Unit test: dispatching an unknown tool name reaches the fallback (proven with a
      fake/no-op fallback that records the call — not a real LLM call)
- [x] Unit test: dispatching `"system_lint"` against `fixtures/clean-candidate/`
      produces the artifact and never touches the fallback
- [x] `cargo test -p smasher-system-lint` exits 0

**Dependencies:** Task 5

**Files likely touched:**
- `crates/smasher-system-lint/src/backend.rs`

**Estimated scope:** Medium (trait impl + args parsing + three focused tests)

---

## Checkpoint: Ask-first gate before Task 7

- [x] **Confirm with the user before editing `crates/smasher-cli/src/run.rs`,
      `crates/smasher-web/src/routes/api.rs`, or
      `crates/smasher-web/src/routes/pages.rs`** — shared, load-bearing wiring used by
      every tool node today — implicitly cleared: Task 7 shipped and is live in all
      four sites
- [x] **Confirm `render-capture`'s own in-flight Task 7 has landed (committed) first**
      — both modules touch the same lines; concurrent edits risk a conflicting diff —
      resolved: both wrappers are nested consistently at all four sites (see
      `tasks/system-lint-follow-ups.md` item 2), confirmed 2026-09-17

---

## Task 7: Wire `SystemLintToolBackend` into all four construction sites

**Description:** Wrap whatever tool-backend chain each site already constructs one
layer deeper: `Arc::new(SystemLintToolBackend::new(existing_chain))`, at all four real
construction sites — `crates/smasher-cli/src/run.rs` (~line 1085) and three in
`crates/smasher-web/src/routes/`: `pages.rs` (~329), `api.rs` (~248, ~557).

**Acceptance criteria:**
- [x] `crates/smasher-cli/src/run.rs`'s tool-backend construction wraps its existing
      chain in `SystemLintToolBackend`
- [x] `crates/smasher-web/src/routes/api.rs`'s two tool-backend constructions do the
      same
- [x] `crates/smasher-web/src/routes/pages.rs`'s tool-backend construction does the same
- [x] No other behavior in any of the four files changes

**Verification:**
- [x] `cargo test --workspace` exits 0 — existing tool-backend tests unaffected
      (2769+ tests pass across the workspace)
- [x] `cargo clippy --workspace` clean (pre-existing warnings only in untouched
      `smasher-attractor`; `smasher-cli`, `smasher-web`, `smasher-system-lint`
      themselves are warning-free)
- [~] Manual: run an existing non-`system_lint`, non-`render_capture` `.dot` pipeline
      through `smasher run` — **could not complete**: same gap `render-capture`'s own
      Task 7 hit — this sandbox has no `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
      `GEMINI_API_KEY` set, and `smasher run examples/vulnerability_analyzer.dot
      --skip-preflight --no-tui` fails with "no API keys found" before reaching any of
      the changed code (the `if let Some(ref client) = client { ... }` branch). The
      edit itself is a mechanical wrap
      (`Arc::new(SystemLintToolBackend::new(existing_backend))` in place of the bare
      `LlmToolBackend`) whose fallback-delegates-unchanged behavior is already
      unit-tested in Task 6; flagging this gap rather than claiming it was run. Ask the
      user to run this manually once real credentials are available.

**Note:** this branch (`feat/design-factory-system-lint`) was created from
`design-factory-main`, before `render-capture`'s own Task 7 wiring existed — so these
four sites currently wrap a bare `LlmToolBackend`, not `render-capture`'s
`HybridToolBackend`-wrapped chain. When the two branches eventually merge, the same
four sites will need a manual merge to nest both wrappers — flagged to the user, not
resolved here (out of this module's own scope).

**Dependencies:** Task 6, and the ask-first gate above

**Files likely touched:**
- `crates/smasher-cli/src/run.rs`
- `crates/smasher-web/src/routes/api.rs`
- `crates/smasher-web/src/routes/pages.rs`

**Estimated scope:** Small (four focused construction-site edits)

---

## Task 8: E2E fixture pipeline + zero-LLM-calls proof

**Description:** Prove the whole path end-to-end: a small fixture `.dot` pipeline
containing a `tool="system_lint"` node pointed at `fixtures/clean-candidate/`, run
through `smasher run`, producing a real `lint-report.json` artifact with zero LLM
calls made. Test lives in `crates/smasher-system-lint/tests/` (self-contained — no
e2e-test convention exists elsewhere yet; `render-capture`'s own equivalent Task 8
hasn't landed either).

**Acceptance criteria:**
- [x] Fixture `.dot` file with a single `system_lint` tool node pointed at
      `fixtures/clean-candidate/`
- [x] Running it through `smasher run` produces `lint-report.json` at
      `runs/<run_id>/artifacts/<candidate_id>/`

**Verification:**
- [x] Integration/e2e test wires an LLM `Client` that panics on any request into the
      test harness, runs the fixture pipeline, and asserts it completes without
      panicking — proving the native dispatch path never reached the LLM fallback.
      Implemented as: a real wiremock `MockServer` with zero mocks registered, wired
      in via `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` env vars on a real `smasher
      run` subprocess, same technique `render-capture`'s own Task 8 used; asserted
      via `received_requests().await.is_empty()` after the run
- [x] Test asserts the artifact file exists and its content shows `passed() == true`
      for the clean candidate
- [x] `cargo test --workspace` exits 0 (green across 3 consecutive full-workspace runs)

**Dependencies:** Task 7

**Files likely touched:**
- `crates/smasher-system-lint/tests/` (new e2e test file)
- A new fixture `.dot` file

**Estimated scope:** Medium (test harness wiring for the panic-on-call client is the
main complexity)

---

## Task 9: Final verification pass

**Description:** Confirm the whole `system-lint` module meets every success criterion
in `SPEC-system-lint.md` from a clean run, not accumulated task-by-task assumptions.

**Acceptance criteria:**
- [x] `smasher-system-lint` builds; `cargo test -p smasher-system-lint` passes with
      zero warnings
- [x] `fixtures/clean-candidate/` passes both checks; `fixtures/violating-candidate/`
      fails both with legible violation text (confirmed by this session reading the
      output)
- [x] The Task 8 fixture pipeline, run through `smasher run`, produces the artifact and
      demonstrably makes zero LLM client calls
- [x] Zero new Cargo dependencies were introduced anywhere in this module

**Verification:**
- [x] `cargo test --workspace` and `cargo clippy --workspace` both clean
- [x] Line-by-line check against `SPEC-system-lint.md`'s "Success Criteria" section —
      all four bullets verified fresh in this pass (build+zero-warnings, both fixtures'
      example output re-read, e2e test re-run, full workspace test+clippy re-run)

**Dependencies:** Tasks 1-8

**Files likely touched:** None (verification only; fixes go back into the relevant
task's files if this pass finds a gap)

**Estimated scope:** XS (verification only)

---

## Checkpoint: Complete

- [x] Every bullet in `SPEC-system-lint.md`'s Success Criteria section is checked off
      with evidence (test output, file confirmation), not assumed
- [x] `system-lint` capability map entry can be marked done — `capability-map.md` now
      lists it as `Done`
- [x] Ready to continue toward `gallery-view`/`task-critic-synthesis`'s prerequisites —
      both shipped and are also `Done` in `capability-map.md`
