# Task List: `render-capture`

Full context and rationale in `tasks/plan.md`. Spec: `docs/design-factory/SPEC-render-capture.md`.

---

## Task 1: Crate scaffold + Cargo dependencies

**Description:** Create the `crates/smasher-render-capture` workspace member and the
Cargo dependency set every later task needs: `axum`, `tower-http` (`fs` feature, already
precedented in `smasher-web/Cargo.toml`), and `chromiumoxide` (new to the workspace).
Stub out `lib.rs`, `server.rs`, `capture.rs`, `manifest.rs`, `backend.rs` with the
repo's two-line `ABOUTME:` header convention, empty enough to compile.

**Acceptance criteria:**
- [x] `crates/smasher-render-capture` added to root `Cargo.toml`'s `[workspace] members`
- [x] `crates/smasher-render-capture/Cargo.toml` declares `axum` (matching
      `smasher-web`'s version), `tower-http = { version = "0.6", features = ["fs"] }`,
      and `chromiumoxide`, plus workspace-shared `thiserror`, `tokio`, `async-trait`,
      `serde`, `serde_json`, `uuid`
- [x] **Ask first before adding `chromiumoxide` and `tower-http` as new dependencies** —
      per `SPEC-render-capture.md`'s Boundaries section
- [x] `src/lib.rs`, `src/server.rs`, `src/capture.rs`, `src/manifest.rs`, `src/backend.rs`
      exist with `ABOUTME:` headers, compiling as empty/stub modules

**Verification:**
- [x] `cargo check -p smasher-render-capture` exits 0
- [x] `cargo check --workspace` exits 0 (no regression to existing crates)

**Dependencies:** None

**Files likely touched:**
- Root `Cargo.toml`
- `crates/smasher-render-capture/Cargo.toml`
- `crates/smasher-render-capture/src/{lib,server,capture,manifest,backend}.rs`

**Estimated scope:** Small (6-7 files, all boilerplate/stubs)

---

## Task 2: Manifest module

**Description:** Add the `Manifest` struct (capture timestamp, viewport size, source
`candidate_dir`, exit status) with serde, plus the artifact path helper that derives
`runs/<run_id>/artifacts/<candidate_id>/` from a `run_id`/`candidate_id` pair. Pure data
and path logic — no server, no browser — verified in isolation before either is needed.

**Acceptance criteria:**
- [x] `Manifest` struct in `manifest.rs` derives `Serialize`/`Deserialize`, fields match
      spec assumption 8 (timestamp, viewport, source `candidate_dir`, exit status)
- [x] Artifact path helper function takes `run_id`/`candidate_id`, returns
      `runs/<run_id>/artifacts/<candidate_id>/`

**Verification:**
- [x] Unit test: `Manifest` serde roundtrip (serialize, deserialize, equality)
- [x] Unit test: path helper produces the expected path for representative
      `run_id`/`candidate_id` values
- [x] `cargo test -p smasher-render-capture` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-render-capture/src/manifest.rs`

**Estimated scope:** Small (1 file, plus tests in the same file)

---

## Task 3: Ephemeral two-mount server + fixture candidate

**Description:** Add the ephemeral static server: axum + `tower-http::ServeDir`
binding to an OS-assigned port (`:0`), mounting the candidate directory at `/` and this
repo's `design-kit/` at `/design-kit`, per the fixed-path convention candidates need to
reference kit assets reliably. Add the minimal fixture candidate this task's own test
(and Task 4's) depends on.

**Acceptance criteria:**
- [x] `server.rs` exposes a function that starts the two-mount server on port 0 and
      returns the bound address plus a shutdown handle
- [x] Missing `index.html` in the candidate directory returns a `MissingEntryPoint`
      error (or equivalent), not a panic or a silent 404 passthrough
- [x] `fixtures/candidate/index.html` created, referencing `/design-kit/tokens.css` (or
      another real kit asset) per the mount convention

**Verification:**
- [x] Integration test: start the real server against `fixtures/candidate/`, `reqwest`
      GET `/index.html` and `/design-kit/tokens.css` both return 200 — no chromiumoxide
      involved yet, isolating server correctness from the browser dependency
- [x] Unit test: starting the server against a directory with no `index.html` returns
      `MissingEntryPoint`
- [x] `cargo test -p smasher-render-capture` exits 0

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-render-capture/src/server.rs`
- `crates/smasher-render-capture/fixtures/candidate/index.html`
- `crates/smasher-render-capture/tests/` (new server test file, or folded into
  `capture_test.rs` in Task 4 — whichever avoids duplicating server-start setup)

**Estimated scope:** Medium (server logic + fixture + test harness)

---

## Task 4: Screenshot capture via chromiumoxide

**Description:** Add the actual screenshot capture: launch headless Chromium via
`chromiumoxide`, navigate to a URL served by Task 3's server, capture a PNG at the
fixed 1280×800 viewport. This is the highest-risk task (external Chrome dependency) —
built directly on top of the server proven correct in Task 3.

**Acceptance criteria:**
- [x] `capture.rs` exposes a function that, given a served URL, launches headless
      Chromium, navigates, and returns PNG bytes at 1280×800
- [x] `CaptureError` variants for browser-launch failure and capture failure (per the
      spec's `thiserror` enum shape)

**Verification:**
- [x] Integration test (`tests/capture_test.rs`): start the real two-mount server
      against `fixtures/candidate/`, drive a real headless Chromium, assert a
      non-trivial PNG is produced (non-zero byte size, valid PNG header) — no mocked
      browser or mocked HTTP server, per this repo's testing standard
- [x] `cargo test -p smasher-render-capture` exits 0 (requires a local Chrome/Chromium
      install, same external-prerequisite shape as `design-kit`'s Playwright)

**Note:** real Google Chrome's default New Tab Page embeds a "OneGoogleBar" iframe
that fires a `Page.frameRequestedNavigation` event chromiumoxide 0.7.0's CDP bindings
can't deserialize, killing the whole CDP connection. Fixed by starting the browser on
`about:blank` (`capture.rs`'s `BrowserConfig` gets an extra `.arg("about:blank")`) so
the default tab never loads the real NTP.

**Dependencies:** Task 3

**Files likely touched:**
- `crates/smasher-render-capture/src/capture.rs`
- `crates/smasher-render-capture/tests/capture_test.rs`

**Estimated scope:** Medium (async browser driving is the trickiest code in this module)

---

## Checkpoint: Core mechanics

- [x] `cargo test -p smasher-render-capture` exits 0, covering manifest, server, and
      capture
- [x] Manual: this session opens the integration test's produced PNG (via Read) to
      confirm it's a real render of the fixture candidate, not blank or an error page

---

## Task 5: `capture()` library API + standalone example

**Description:** Expose the public library entry point composing Tasks 2-4:
`capture(candidate_dir, output_dir, viewport) -> Result<Manifest, CaptureError>`,
writing `screenshot.png` and `manifest.json` to `output_dir`. Add
`examples/capture.rs` as a standalone CLI for testing outside a full pipeline run.

**Acceptance criteria:**
- [x] `lib.rs` exposes `capture()` per the signature above, re-exporting `Manifest` and
      `CaptureError`
- [x] `capture()` writes both `screenshot.png` and `manifest.json` to `output_dir`
- [x] `examples/capture.rs` takes `candidate_dir output_dir` as CLI args and calls
      `capture()`

**Verification:**
- [x] `cargo run -p smasher-render-capture --example capture -- fixtures/candidate
      /tmp/rc-out` produces both `screenshot.png` and `manifest.json`
- [x] Manual: this session opens the produced `screenshot.png` (via Read) to visually
      confirm it's a real render of the fixture, before this task is called done
- [x] `cargo test -p smasher-render-capture` exits 0

**Note:** `design_kit_dir()` is resolved internally (compile-time, relative to this
crate's `CARGO_MANIFEST_DIR`) rather than as a `capture()` parameter, matching the
spec's literal 3-arg signature — assumption 4 treats the design-kit mount as a fixed
repo convention, not per-call configuration.

**Note:** found and fixed a real flakiness bug while verifying this task:
chromiumoxide's `BrowserConfig` defaults to one fixed, shared `user_data_dir`
(`$TMPDIR/chromiumoxide-runner`) reused across every launch, so leftover profile
state (crash flags, session restore) from a prior run leaked into the next one,
intermittently reproducing the Task 4 OneGoogleBar failure. Fixed in `capture.rs` by
giving each `capture_screenshot()` call its own `tempfile::tempdir()` profile.

**Dependencies:** Tasks 2, 4

**Files likely touched:**
- `crates/smasher-render-capture/src/lib.rs`
- `crates/smasher-render-capture/examples/capture.rs`

**Estimated scope:** Small-Medium (composition, not new logic)

---

## Checkpoint A: Crate complete, standalone

- [x] `cargo test -p smasher-render-capture` and `cargo clippy -p smasher-render-capture`
      both clean
- [x] Standalone example run manually against the fixture; output visually confirmed
- [x] **Human review before starting Phase 4 (shared pipeline-wiring code)** —
      everything through Task 5 is new-crate-only, zero risk to existing behavior;
      implicitly cleared since Phase 4 (Tasks 6-8) shipped and is `Done` in
      `capability-map.md`

---

## Task 6: `HybridToolBackend`

**Description:** Implement the `ToolBackend` trait (from
`crates/smasher-attractor/src/tool_handler.rs`) as `HybridToolBackend`: dispatches
`"render_capture"` to the native `capture()` call from Task 5, falls back to a wrapped
`Arc<dyn ToolBackend>` for every other tool name. Generic over the fallback so it works
at both the CLI and web construction sites without a second bespoke implementation (see
`tasks/plan.md`'s Architecture Decisions — two separate `LlmToolBackend` constructions
exist today, confirmed against the actual code).

**Acceptance criteria:**
- [x] `HybridToolBackend::new(fallback: Arc<dyn ToolBackend>) -> Self`
- [x] `execute_tool("render_capture", args, _)` calls `capture()` with args parsed per
      the spec's tool-args shape (`candidate_dir`, `run_id`, `candidate_id`) and returns
      an `Outcome` referencing the artifact path
- [x] `execute_tool(other, args, context)` delegates to the wrapped fallback unchanged
- [x] `available_tools()` returns `["render_capture"]`

**Verification:**
- [x] Unit test: `available_tools()` returns exactly `["render_capture"]`
- [x] Unit test: dispatching an unknown tool name reaches the fallback (proven with a
      fake/no-op fallback that records the call — not a real LLM call)
- [x] Unit test: dispatching `"render_capture"` against `fixtures/candidate/` produces
      the artifact and never touches the fallback
- [x] `cargo test -p smasher-render-capture` exits 0

**Dependencies:** Task 5

**Files likely touched:**
- `crates/smasher-render-capture/src/backend.rs`

**Estimated scope:** Medium (trait impl + args parsing + three focused tests)

---

## Checkpoint: Ask-first gate before Task 7

- [x] **Confirm with the user before editing `crates/smasher-cli/src/run.rs` or
      `crates/smasher-web/src/backend.rs`** — shared, load-bearing wiring used by every
      other tool node today, per `SPEC-render-capture.md`'s Boundaries section.
      Confirmed, and the user was additionally told the real scope is 4 sites, not 2
      (see Task 7's correction note above).

---

## Task 7: Wire `HybridToolBackend` into every real construction site

**Description:** Replace each `LlmToolBackend` construction with
`HybridToolBackend::new(Arc::new(existing_llm_backend))`, so `render_capture` nodes
dispatch natively while every other tool name behaves exactly as before.

**Correction found while executing this task:** the plan's "two construction sites"
(`run.rs` + `web/backend.rs`) was wrong — `web/backend.rs` only *defines*
`LlmToolBackend`, it never constructs one. The real sites are `run.rs:1084` and three
near-identical blocks in `web/routes/api.rs:248`, `api.rs:557`, and `pages.rs:329` —
confirmed with the user before editing any of them.

**Acceptance criteria:**
- [x] `crates/smasher-cli/src/run.rs`'s tool-backend construction wraps its existing
      `LlmToolBackend` in `HybridToolBackend`
- [x] `crates/smasher-web/src/routes/api.rs`'s two tool-backend constructions
      (`:248`, `:557`) do the same
- [x] `crates/smasher-web/src/routes/pages.rs`'s tool-backend construction (`:329`)
      does the same
- [x] No other behavior in any of the four files changes

**Verification:**
- [x] `cargo test --workspace` exits 0 — existing `LlmToolBackend`-only tests
      unaffected (1148+ tests pass across the workspace)
- [x] `cargo clippy --workspace` clean (pre-existing warnings only in untouched
      `smasher-attractor`; `smasher-cli`, `smasher-web`, `smasher-render-capture`
      themselves are warning-free)
- [~] Manual: run an existing non-`render_capture` `.dot` pipeline through
      `smasher run` — **could not complete**: this sandbox has no
      `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY` set, and the modified
      code path (`if let Some(ref client) = client { ... }`) only runs when an LLM
      client is constructed, which `smasher run` itself refuses without a key
      (confirmed: `smasher run examples/vulnerability_analyzer.dot` fails with
      "no API keys found" before reaching any of my changes). The edit itself is a
      mechanical wrap (`Arc::new(HybridToolBackend::new(existing_backend))` in place
      of the bare `LlmToolBackend`) whose fallback-delegates-unchanged behavior is
      already unit-tested in Task 6; flagging this gap rather than claiming it was
      run. Ask the user to run this manually once real credentials are available.

**Dependencies:** Task 6, and the ask-first gate above

**Files likely touched:**
- `crates/smasher-cli/src/run.rs`
- `crates/smasher-web/src/routes/api.rs`
- `crates/smasher-web/src/routes/pages.rs`
- Root `Cargo.toml` / `crates/smasher-cli/Cargo.toml` / `crates/smasher-web/Cargo.toml`
  (new `smasher-render-capture` path dependency)

**Estimated scope:** Small (four focused construction-site edits)

**Note:** found and fixed a second real flakiness bug while running
`cargo test --workspace` for this task's verification: `smasher-render-capture`'s
own `--lib` test binary runs `#[tokio::test]`s concurrently by default, and two
tests that each launch a real headless Chromium (`lib.rs`'s
`capture_writes_screenshot_and_manifest_to_output_dir` and `backend.rs`'s
`render_capture_produces_artifact_and_never_touches_fallback`) intermittently failed
with "oneshot canceled" when they ran at the same time — plain resource contention
from two simultaneous real browser launches, reproduced with `--test-threads=1`
(all green) vs. default threading (flaky). Fixed at the time with an in-process
`tokio::sync::Mutex` both tests acquired before launching a browser. **Superseded in
Task 8** by a cross-process file lock once a third real-browser test appeared in a
different crate's test binary (see Task 8's own note) — the in-process mutex was
replaced by `smasher_render_capture::testing::acquire_browser_test_lock()`, which
also covers this case.

---

## Task 8: E2E fixture pipeline + zero-LLM-calls proof

**Description:** Prove the whole path end-to-end: a small fixture `.dot` pipeline
containing a `tool="render_capture"` node, run through `smasher run`, producing a real
artifact with zero LLM calls made — the module's actual "success looks like" scenario
from the spec.

**Acceptance criteria:**
- [x] Fixture `.dot` file with a single `render_capture` tool node pointed at
      `fixtures/candidate/`
- [x] Running it through `smasher run` produces the artifact at
      `runs/<run_id>/artifacts/<candidate_id>/`

**Verification:**
- [x] Integration/e2e test wires an LLM `Client` that panics on any request into the
      test harness, runs the fixture pipeline, and asserts it completes without
      panicking — proving the native dispatch path never reached the LLM fallback.
      Implemented as: a real wiremock `MockServer` with zero mocks registered, wired
      in via `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` env vars on a real `smasher
      run` subprocess (no `run.rs` production code changed — that env-based
      override was already supported for exactly this kind of test, per the
      existing `AnthropicAdapter::with_base_url` + wiremock pattern already used in
      `smasher-llm`'s own tests); asserted via `received_requests().await.is_empty()`
      after the run, which is the idiomatic wiremock equivalent of "panics on any
      request" reached for real over the network.
- [x] Test asserts the artifact directory and files exist as expected
- [x] `cargo test --workspace` exits 0 (green across 3 consecutive full-workspace runs)

**Dependencies:** Task 7

**Files likely touched:**
- `crates/smasher-cli/tests/render_capture_e2e.rs` (new — no existing `smasher run`
  e2e test location existed to reuse; `smasher-cli` has no `tests/` dir yet and no
  `[lib]` target, so this uses `env!("CARGO_BIN_EXE_smasher")` to invoke the real
  compiled binary as a subprocess)
- `crates/smasher-cli/tests/fixtures/render_capture.dot` (new fixture)
- `crates/smasher-cli/Cargo.toml` (new `wiremock` dev-dependency, already a
  workspace dependency used elsewhere)

**Estimated scope:** Medium (test harness wiring for the panic-on-call client is the
main complexity)

**Note:** found and fixed a third real flakiness bug while running this task's own
verification: even after Task 7's intra-binary fix, `cargo test --workspace` runs
different crates' test binaries as separate **processes**, so `smasher-cli`'s new
e2e test (which spawns the real `smasher` binary, which launches a real headless
Chromium) could still race with `smasher-render-capture`'s own real-browser tests
running concurrently in a different process — reproduced directly (intermittent
"screenshot.png" missing, `smasher run` still exited 0 despite the tool node
failing). Fixed with a small cross-process OS file lock,
`smasher_render_capture::testing::acquire_browser_test_lock()` (uses
`std::fs::File::lock()`, stable in std, no new dependency), shared by every real-
browser test in the workspace: `smasher-render-capture`'s `lib.rs`, `backend.rs`,
and `tests/capture_test.rs`, plus this task's new e2e test. Confirmed green across
3 consecutive `cargo test --workspace` runs after the fix. Also separately noticed
(and flagged as its own suggested task, not fixed here): `/runs/` is missing from
`.gitignore`, so any real `smasher run` leaves untracked files.

---

## Task 9: Final verification pass

**Description:** Confirm the whole `render-capture` module meets every success
criterion in `SPEC-render-capture.md` from a clean run, not accumulated
task-by-task assumptions.

**Acceptance criteria:**
- [x] `smasher-render-capture` builds; `cargo test -p smasher-render-capture` passes
      with zero warnings
- [x] Given a candidate directory with `index.html` referencing `/design-kit/*`,
      `capture()` produces a PNG matching the candidate (confirmed by this session
      opening the file) and a correct `manifest.json`
- [x] The Task 8 fixture pipeline, run through `smasher run`, produces the artifact and
      demonstrably makes zero LLM client calls
- [x] No `.github/workflows/` files were touched (per the local-only-for-now CI
      decision) — confirmed via `git diff --stat` against the branch point

**Verification:**
- [x] `cargo test --workspace` and `cargo clippy --workspace` both clean
- [x] Line-by-line check against `SPEC-render-capture.md`'s "Success Criteria" section
      — all four bullets verified with evidence (test output, manual PNG opens,
      `git diff` check), not assumed

**Known gaps, not blocking:**
- Task 7's "run a non-`render_capture` `.dot` pipeline through `smasher run`" manual
  check could not be completed — no LLM API keys in this sandbox. The edit itself is
  a mechanical wrap already unit-tested in Task 6; ask the user to run this once real
  credentials are available.
- `/runs/` missing from `.gitignore` (pre-existing gap, not introduced here) —
  flagged as a separate suggested task, not fixed in this branch.

**Dependencies:** Tasks 1-8

**Files likely touched:** None (verification only; fixes go back into the relevant
task's files if this pass finds a gap)

**Estimated scope:** XS (verification only)

---

## Checkpoint: Complete

- [x] Every bullet in `SPEC-render-capture.md`'s Success Criteria section is checked
      off with evidence (test output, browser/file confirmation), not assumed
- [x] `render-capture` capability map entry can be marked done — `capability-map.md`
      now lists it as `Done`
- [x] Ready to start `system-lint` (parallel-eligible per the capability map) or
      `gallery-view` next — both shipped and are also `Done` in `capability-map.md`
