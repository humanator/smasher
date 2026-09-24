# Task List: `artifact-store`

Full context and rationale in `tasks/archive/plan-artifact-store.md`. Spec:
`design-factory/SPEC-artifact-store.md`.

---

## Task 1: `ArtifactRef`/`ArtifactKind` + `Manifest.artifacts` field, backward-compat

**Description:** Add `ArtifactRef { kind, path }` and `ArtifactKind` (`Screenshot`,
`LiveBundle`, `Recording`) to `manifest.rs`, and give `Manifest` a
`#[serde(default)] artifacts: Vec<ArtifactRef>` field per spec assumption 4/Code Style.
Fix every existing `Manifest { .. }` literal across the workspace so the workspace still
compiles — grepped and found 7 sites beyond `manifest.rs`'s own tests.

**Acceptance criteria:**
- [x] `ArtifactRef`/`ArtifactKind` added to `manifest.rs` exactly per the spec's Code
      Style block (`#[serde(rename_all = "snake_case")]` on the enum)
- [x] `Manifest.artifacts: Vec<ArtifactRef>` added with `#[serde(default)]`
- [x] All 7 pre-existing `Manifest { .. }` literals updated to add
      `artifacts: Vec::new()`:
      `smasher-web/src/candidates.rs:160`,
      `smasher-web/src/routes/pages.rs:861,909,920,1042`,
      `smasher-web/src/routes/gallery.rs:225,323`
- [x] `smasher-render-capture/src/lib.rs:46`'s `Manifest { .. }` literal (the production
      capture-writing site) also updated — for this task, just `artifacts: Vec::new()`;
      Task 2 populates it for real

**Verification:**
- [x] Unit test: `Manifest` serde roundtrip with a non-empty `artifacts` vec
      (`ArtifactKind::Screenshot` and `::LiveBundle` both represented)
- [x] Unit test: a hand-written JSON literal with no `"artifacts"` key still
      deserializes via `serde_json::from_str::<Manifest>`, with `artifacts` defaulting
      to `vec![]` — proves real backward compatibility, not just the derive macro
      compiling
- [x] `cargo test -p smasher-render-capture -p smasher-web` exits 0
- [x] `cargo test --workspace` exits 0 (confirms the 7-site ripple is actually fixed) — commit `dd24123`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-render-capture/src/manifest.rs`
- `crates/smasher-render-capture/src/lib.rs`
- `crates/smasher-web/src/candidates.rs`
- `crates/smasher-web/src/routes/pages.rs`
- `crates/smasher-web/src/routes/gallery.rs`

**Estimated scope:** Medium (1 real logic file, 4 mechanical fix-up files)

---

## Task 2: Recursive bundle copy wired into `capture()`

**Description:** Add a bundle-persistence step to `smasher-render-capture`: after the
existing screenshot capture, recursively copy `candidate_dir`'s full tree into
`output_dir/bundle/` using `std::fs` (`read_dir` + `create_dir_all` + `copy`) — no new
dependency, per spec assumption/Tech Stack. Wire this into `lib.rs`'s `capture()`,
populating `Manifest.artifacts` with both a `Screenshot` and a `LiveBundle`
`ArtifactRef` (paths `"screenshot.png"` and `"bundle/index.html"`).

**Acceptance criteria:**
- [x] A recursive-copy function in `capture.rs` copies files and nested subdirectories
      from a source directory into a destination directory
- [x] `lib.rs`'s `capture()` calls it after the screenshot is captured, targeting
      `output_dir/bundle/`, before writing `manifest.json`
- [x] `capture()`'s returned `Manifest.artifacts` contains exactly two entries: `{kind:
      screenshot, path: "screenshot.png"}` and `{kind: live_bundle, path:
      "bundle/index.html"}`
- [x] New fixture `fixtures/candidate-with-assets/` added: an `index.html` plus a nested
      `assets/` subfolder with at least one file, used only by this task's copy test —
      the shared `fixtures/candidate/` is left untouched

**Verification:**
- [x] Integration test (extends `capture_test.rs` or a new test in the same file):
      `capture()` against `fixtures/candidate-with-assets/` produces a
      `bundle/assets/<file>` whose content matches the fixture's source file
      byte-for-byte, alongside the existing `screenshot.png`/`manifest.json` assertions
- [x] Existing test `capture_writes_screenshot_and_manifest_to_output_dir` updated to
      also assert `bundle/index.html` exists and its content matches the source
      fixture's `index.html`
- [x] `cargo test -p smasher-render-capture` exits 0 — commit `3f8d3d3`

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-render-capture/src/capture.rs`
- `crates/smasher-render-capture/src/lib.rs`
- `crates/smasher-render-capture/fixtures/candidate-with-assets/index.html` (new)
- `crates/smasher-render-capture/fixtures/candidate-with-assets/assets/...` (new)

**Estimated scope:** Medium (real logic + new fixture + integration test)

---

## Task 3: `/design-kit` mount added to `smasher-web/src/server.rs`

**Description:** Add a second static mount to `smasher-web`'s router — `design-kit/` at
`/design-kit` — mirroring `smasher-render-capture/src/server.rs`'s existing two-mount
pattern and `lib.rs`'s `design_kit_dir()` path-resolution helper
(`concat!(env!("CARGO_MANIFEST_DIR"), "/../../design-kit")`). This is the approved fix
for the gap in spec assumption 2 (see plan's Architecture Decisions): without it, a
persisted `bundle/index.html` referencing `/design-kit/tokens.css` 404s when served
through `smasher-web`.

**Acceptance criteria:**
- [x] `build_router` in `server.rs` gains `.nest_service("/design-kit",
      ServeDir::new(design_kit_dir))` alongside the existing `/static` and
      `/candidate-artifacts` mounts
- [x] `design_kit_dir` resolved relative to `CARGO_MANIFEST_DIR`, not `cwd`, same
      reasoning as the existing `static_dir` resolution two lines above it
- [x] The two existing mount tests (`candidate_artifacts_mount_does_not_escape_its_root`,
      `static_mount_is_unaffected_by_the_new_candidate_artifacts_mount`) still pass
      unmodified — this is an additive router change, not a restructuring

**Verification:**
- [x] New test: a request to `/design-kit/tokens.css` (or another real, currently-
      existing kit file — confirm the exact filename before writing the test) returns
      200 with real file bytes, mirroring
      `candidate_artifacts_mount_serves_a_real_file`'s shape
- [x] New test: a `..`-traversal attempt against `/design-kit/` does not escape its
      root, mirroring the existing `candidate_artifacts_mount_does_not_escape_its_root`
- [x] `cargo test -p smasher-web` exits 0 — commit `5d5e4fb`

**Dependencies:** None (independent of Task 1/2, but sequenced here since Task 4 and
the Checkpoint A manual render check need it)

**Files likely touched:**
- `crates/smasher-web/src/server.rs`

**Estimated scope:** Small (1 file, additive router line + 2 tests)

---

## Task 4: `CandidateSummary.bundle_url` read from the manifest's artifact list

**Description:** Give `CandidateSummary` a `bundle_url: Option<String>` field,
precomputed in `scan_candidates` the same way `screenshot_url` already is: look for a
`LiveBundle` entry in `manifest.artifacts` and format
`/candidate-artifacts/{run_id}/artifacts/{candidate_id}/{artifact.path}`; `None` when no
such entry exists (old-format manifests, or a candidate captured before this module
shipped). This is the "additive read" spec assumption 9 asks for — no template wiring.

**Acceptance criteria:**
- [x] `CandidateSummary` gains `pub bundle_url: Option<String>`
- [x] `scan_candidates` populates it from `manifest.artifacts`, `None` when absent
- [x] All 4 existing `CandidateSummary { .. }` literals updated:
      `smasher-web/src/routes/pages.rs:905,916`,
      `smasher-web/src/routes/gallery.rs:222` (helper `fn summary`), plus
      `candidates.rs`'s own production construction site (already being edited for the
      new field, not a separate fix)

**Verification:**
- [x] Unit test extending `scan_candidates_parses_success_and_failure_manifests`-style
      coverage: a candidate whose manifest has a `LiveBundle` artifact gets the expected
      `bundle_url`; a candidate with an empty `artifacts` list (or no field at all, via
      the old-format JSON path) gets `None`
- [x] `cargo test -p smasher-web` exits 0
- [x] `cargo test --workspace` exits 0 — commit `d496cbd`

**Dependencies:** Task 1 (needs `ArtifactRef`/`ArtifactKind` to exist)

**Files likely touched:**
- `crates/smasher-web/src/candidates.rs`
- `crates/smasher-web/src/routes/pages.rs`
- `crates/smasher-web/src/routes/gallery.rs`

**Estimated scope:** Small (1 real logic file, 2 mechanical fix-up files)

---

## Task 5: `ArtifactRetentionPolicy` + `PruneReport` + `prune_artifacts()`

**Description:** Add retention to `smasher-attractor/src/run_dir.rs`, next to
`RunDirectory` — not a new crate, per spec assumption 5. Shape mirrors
`log_sink::RetentionPolicy`: `max_age: Option<chrono::Duration>`, `max_total_bytes:
Option<u64>`. `prune_artifacts(data_dir, policy, dry_run)` reads each
`{data_dir}/artifacts/<run_id>/manifest.json` for `created_at`, sorts oldest-first,
removes whole run directories (never partial contents) until within policy, returning a
`PruneReport { removed_run_ids, bytes_reclaimed }`.

**Acceptance criteria:**
- [x] `ArtifactRetentionPolicy` and `PruneReport` added per the spec's Code Style block
- [x] `prune_artifacts` reads `RunManifest.created_at` from each run's `manifest.json`
      (skip unreadable/malformed entries rather than erroring the whole scan, matching
      `scan_candidates`'s existing skip-don't-fail convention)
- [x] Directory size computed by walking each run dir's files (needed for
      `max_total_bytes`) — a small recursive-sum helper, no new dependency
- [x] `dry_run: true` never calls `std::fs::remove_dir_all` — computes and returns the
      same `PruneReport` without touching disk
- [x] Removal is always a whole `{data_dir}/artifacts/<run_id>/` tree, never a partial
      delete inside one (spec Boundaries: "always do")

**Verification:**
- [x] Unit test: `max_age` removes only run dirs older than the cutoff
- [x] Unit test: `max_total_bytes` removes oldest-first until under the cap
- [x] Unit test: nothing removed when already within both limits
- [x] Unit test: `dry_run: true` reports the same removals a real run would, but
      `std::fs::metadata` on every path still succeeds afterward (nothing was deleted)
- [x] `cargo test -p smasher-attractor` exits 0 — commit `46f0280`

**Dependencies:** None (independent of Tasks 1-4)

**Files likely touched:**
- `crates/smasher-attractor/src/run_dir.rs`

**Estimated scope:** Medium (real algorithmic logic + 4+ unit tests, one file)

---

## Task 6: Integration test against real `RunDirectory` trees

**Description:** Prove Task 5's `prune_artifacts` against real directories on disk, not
just in-memory fixtures — matching this repo's real-filesystem testing standard. Since
`RunDirectory::create()` always stamps `created_at = Utc::now()` with no way to backdate
through its public API, the test creates real run directories then rewrites each
`manifest.json`'s `created_at` field directly (parse as `serde_json::Value`, mutate the
one key, re-serialize) rather than adding a test-only constructor to production code.

**Acceptance criteria:**
- [x] New integration test file creates several real `RunDirectory` trees under a
      `tempfile::tempdir()`, backdating some via the JSON-rewrite technique above
- [x] Runs `prune_artifacts` against the real `tempdir` path and asserts the correct
      run directories are actually gone from disk afterward (non-dry-run case)
- [x] A parallel dry-run assertion in the same file confirms zero directories are
      removed when `dry_run: true`

**Verification:**
- [x] `cargo test -p smasher-attractor` exits 0, including the new integration test
- [x] Test file follows this crate's existing `tests/` convention (see
      `tests/engine_integration.rs` for the established style) — commit `5e5700a`

**Dependencies:** Task 5

**Files likely touched:**
- `crates/smasher-attractor/tests/artifact_retention_integration.rs` (new)

**Estimated scope:** Small-Medium (1 new file, real-filesystem setup + assertions)

---

## Task 7: `smasher-cli/src/prune.rs` + `main.rs` wiring

**Description:** Add the `prune-artifacts` subcommand, modeled on `archive.rs`'s shape
(`clap::Args` struct + `run()` function). Flags: `--data-dir <PathBuf>` (required),
`--max-age-days <u32>` and `--max-total-mb <u64>` (both optional — see plan's
Architecture Decisions for why these are plain integers, not the spec's illustrative
duration-string example), `--dry-run` (bool flag). Wires the flags into Task 5's
`ArtifactRetentionPolicy`, calls `prune_artifacts`, and reports removed run ids plus
bytes reclaimed to stderr (mirroring `archive.rs`'s `eprintln!` pattern).

**Acceptance criteria:**
- [x] `PruneArgs` struct with the 4 flags above, following `ArchiveArgs`'s `clap::Args`
      pattern
- [x] `run(args)` builds an `ArtifactRetentionPolicy` from the flags (both policy fields
      `None` if their flag is omitted — no pruning happens with zero flags set, matching
      `RetentionPolicy::default()`'s "no limits" semantics), converts `--max-age-days`
      to `chrono::Duration::days(..)`, `--max-total-mb` to bytes
      (`* 1024 * 1024`)
- [x] `Command::PruneArtifacts(prune::PruneArgs)` variant added to `main.rs`'s
      `Command` enum, with a doc comment and a match arm calling `prune::run`
- [x] `smasher --help` and `smasher prune-artifacts --help` both render without error

**Verification:**
- [x] Unit tests (in `prune.rs`, mirroring `archive_args_parse_with_defaults`/
      `archive_args_parse_with_output`): flags parse correctly with and without the
      optional ones
- [x] `cargo test -p smasher-cli` exits 0
- [x] `cargo check --workspace` exits 0 (confirms `main.rs`'s `Command` enum match is
      exhaustive) — commit `9205aa8`

**Dependencies:** Task 5

**Files likely touched:**
- `crates/smasher-cli/src/prune.rs` (new)
- `crates/smasher-cli/src/main.rs`

**Estimated scope:** Medium (new module + enum/match wiring in a shared file)

---

## Task 8: End-to-end test of the real compiled binary

**Description:** Prove the subcommand works end-to-end against the real
`smasher` binary, per the spec's End-to-end testing bullet. Unlike
`render_capture_e2e.rs`/`system_lint_e2e.rs` (which drive a full `.dot` pipeline through
`smasher run`), this invokes `prune-artifacts` directly against a fixture data
directory — no pipeline, no LLM mock server needed.

**Acceptance criteria:**
- [x] A dry-run invocation (`smasher prune-artifacts --data-dir <fixture>
      --max-age-days <n> --dry-run`) exits 0, prints a report naming what *would* be
      removed, and leaves every fixture file/directory present afterward
- [x] A second, non-dry-run invocation against a fresh copy of the same fixture exits 0
      and the expected run directories are actually gone from disk afterward

**Verification:**
- [x] `cargo test -p smasher-cli` exits 0, including this new e2e test
- [x] Test builds its own fixture data dir under a `tempfile::tempdir()` (real
      `RunDirectory` trees with backdated manifests, same JSON-rewrite technique as
      Task 6) rather than checking in a static fixture that would go stale — commit
      `553dc04`

**Dependencies:** Task 7

**Files likely touched:**
- `crates/smasher-cli/tests/prune_e2e.rs` (new)

**Estimated scope:** Small-Medium (1 new file, subprocess + real-filesystem assertions)

---

## Task 9: Whole-workspace regression + `capability-map.md` update

**Description:** Final close-out per spec Success Criteria and Project Structure (which
explicitly lists `capability-map.md` as a file this module touches, unlike prior
modules' plans that left this to the user).

**Acceptance criteria:**
- [x] `capability-map.md`'s `artifact-store` row changed from "In Progress" to "Done"
- [x] Every bullet in `SPEC-artifact-store.md`'s Success Criteria checked off with a
      pointer to the specific test/manual-check that proves it

**Verification:**
- [x] `cargo test --workspace` exits 0
- [x] `cargo clippy --workspace` exits 0 with no new warnings (only pre-existing
      `smasher-attractor` warnings, same baseline as `gallery-gate`'s Task 9)
- [x] `cargo clippy -p smasher-render-capture -p smasher-attractor -p smasher-cli -p
      smasher-web` exits 0 (the spec's own per-crate command, run explicitly once more)

**Closed out:** all 9 tasks complete. Manual end-to-end check performed: real
`smasher serve` instance, seeded data dir with a persisted `bundle/index.html` +
nested `assets/style.css`, both served correctly through `/candidate-artifacts/...`
and the new `/design-kit/tokens.css` mount the bundle depends on.

**Dependencies:** Tasks 1-8

**Files likely touched:**
- `design-factory/capability-map.md`

**Estimated scope:** Small (1 doc file + verification commands, no new code)
