# Implementation Plan: `artifact-store` (Semi-Dark Design Factory)

## Overview

`artifact-store` is the last of eight modules in the Semi-Dark Design Factory capability
map (`design-factory/capability-map.md`), depending on `render-capture` (done). Its spec
is `design-factory/SPEC-artifact-store.md`. It extends a candidate's on-disk artifact
beyond a bare `screenshot.png` with a persisted, standalone-servable **live bundle**, and
adds a manual `smasher prune-artifacts` subcommand so richer artifacts don't grow the
data directory unbounded.

This plan breaks the spec into 9 small, vertically-sliced, independently verifiable
tasks across 6 phases. Scope is `artifact-store` only — no template/UI work in
`gallery-view`/`gallery-gate` (spec assumption 9), no interaction-recording capture
(spec assumption 3).

The module actually bundles two independent capabilities with no dependency on each
other: **Path A** (Tasks 1-4) gives a captured candidate a persisted, renderable live
bundle; **Path B** (Tasks 5-8) gives an operator a way to prune old run artifacts. Task 9
closes out both with a whole-workspace regression pass. Path A is sequenced first only
because it's the spec's primary "richer artifact storage" objective; either path could
run first or be parallelized across two sessions once Task 1 lands.

## Architecture Decisions

- **Spec assumption 2 is wrong as written — confirmed by reading the actual code, not
  guessed.** The spec claims a persisted `bundle/` copy of `candidate_dir` "works
  unmodified as a static bundle" with "no server-side change" needed. But
  `smasher-render-capture/src/server.rs` serves every candidate through a **two-mount**
  server (candidate at `/`, `design-kit/` at `/design-kit`), and the existing fixture
  (`fixtures/candidate/index.html`) references `/design-kit/tokens.css` — an absolute
  path that only resolves because of that second mount. `smasher-web/src/server.rs`
  today mounts only `/candidate-artifacts` (a single generic `ServeDir`), with no
  `/design-kit` mount. A `bundle/index.html` copied verbatim and served under
  `/candidate-artifacts/.../bundle/index.html` would 404 on its own stylesheet.
  **Resolved with the user this session:** add a second `/design-kit` static mount to
  `smasher-web/src/server.rs` (Task 3), mirroring the render-capture server's own
  pattern. `bundle/` itself stays a pure copy of `candidate_dir` (assumption 2's
  "persisted static copy, not a new server process" and assumption 8's no-per-candidate
  size cap both survive intact) — only the *serving* side gets the one mount it was
  always implicitly missing. This is a deliberate, approved exception to the spec's
  literal "no server-side change" framing, not a silent scope expansion.
- **Manifest struct-literal ripple, found by grepping the real codebase, not in the
  spec.** Adding `artifacts: Vec<ArtifactRef>` to `Manifest` breaks compilation at every
  site that builds a `Manifest { .. }` literal directly rather than deserializing one,
  since `#[serde(default)]` only helps deserialization. Grepped and found **7** such
  sites beyond `manifest.rs`'s own tests: `smasher-web/src/candidates.rs` (1),
  `smasher-web/src/routes/pages.rs` (3), `smasher-web/src/routes/gallery.rs` (2). All
  seven get `artifacts: Vec::new()` added as part of Task 1's acceptance criteria —
  otherwise `cargo test --workspace` breaks immediately after that task, before Task 2
  even starts populating the field for real. Task 4 has the same ripple for
  `CandidateSummary`'s new `bundle_url` field (4 literal sites, listed there).
- **New dedicated fixture for bundle-copy correctness, not the shared one.** The spec's
  testing strategy wants "a fixture candidate with an `assets/` subfolder" to prove
  nested-directory copying works. The existing `fixtures/candidate/` is reused by
  `capture_test.rs` and `server_test.rs` today; growing it risks changing what those
  tests assert. Task 2 adds a new `fixtures/candidate-with-assets/` directory instead,
  used only by the new bundle-copy test.
- **CLI flags use plain integers, not the spec's illustrative duration strings.** The
  spec's example command (`--max-age 30d --max-total-mb 500`) implies parsing `"30d"`
  into a `chrono::Duration`, but the spec's own Tech Stack section says "no new external
  dependencies," and this workspace has no duration-string parser today (checked: no
  `humantime` or equivalent anywhere in `Cargo.toml`). Task 7 uses `--max-age-days <u32>`
  and `--max-total-mb <u64>` instead — same policy, zero new dependencies, no hand-rolled
  parser to test. Flagged here as a deliberate, low-stakes implementation choice rather
  than a blocking question.
- **`RunDirectory::create()` always stamps `created_at = Utc::now()`** — there's no
  public API to backdate a run for testing. Task 6's integration test works around this
  by creating real run directories then rewriting each `manifest.json`'s `created_at`
  field directly on disk (plain JSON read-modify-write), rather than adding a
  test-only constructor to production code.
- **Deliverables tracked in the `smasher` git repo**, consistent with every prior module
  in this capability map.

## Task List

### Phase 1: Manifest schema (Path A foundation)
- [x] Task 1: `ArtifactRef`/`ArtifactKind` + `Manifest.artifacts` field, backward-compat — commit `dd24123`

### Checkpoint: Schema foundation
- [x] `cargo test -p smasher-render-capture -p smasher-web` green
- [x] `cargo test --workspace` still green (the 7-site literal ripple is fixed, not
      deferred)

### Phase 2: Bundle persistence
- [x] Task 2: Recursive bundle copy wired into `capture()` — commit `3f8d3d3`

### Checkpoint: Bundle persisted (file-level)
- [x] `cargo test -p smasher-render-capture` green (unit + integration, including the
      new nested-directory copy test)
- [x] Manual: bundle's copied files (via Read) match the fixture candidate's on-disk
      content byte-for-byte — asserted in `capture_copies_nested_assets_into_the_bundle`

### Phase 3: Bundle is actually servable — touches shared smasher-web code
- [x] Task 3: `/design-kit` mount added to `smasher-web/src/server.rs` — commit `5d5e4fb`
- [x] Task 4: `CandidateSummary.bundle_url` read from the manifest's artifact list — commit `d496cbd`

### Checkpoint A: Bundle renders correctly — human review before Path B
- [x] `cargo test -p smasher-web` green, including a real HTTP round-trip test that a
      persisted bundle's `/design-kit/...` asset resolves through the new mount
- [x] Manual: a persisted `bundle/index.html`, served through `smasher-web`'s real
      router (not just opened as a file), renders identically to the screenshot that
      was captured alongside it — verified live via `smasher serve` (see Task 9 close-out)
- [x] **Human review before starting Path B** — covered by the single autonomous-mode
      approval that authorized running all 9 tasks (including Task 3's `server.rs`
      change) without stopping between them; not a separate in-flight pause

### Phase 4: Retention core (Path B — independent of Path A)
- [x] Task 5: `ArtifactRetentionPolicy` + `PruneReport` + `prune_artifacts()` — commit `46f0280`
- [x] Task 6: Integration test against real `RunDirectory` trees — commit `5e5700a`

### Checkpoint: Retention core
- [x] `cargo test -p smasher-attractor` green (unit + integration)
- [x] `dry_run: true` proven to touch zero bytes on disk in at least one test —
      `prune_artifacts_dry_run_reports_without_touching_disk` +
      `prune_artifacts_dry_run_leaves_real_run_directories_untouched`

### Phase 5: CLI subcommand
- [x] Task 7: `smasher-cli/src/prune.rs` + `main.rs` wiring — commit `9205aa8`
- [x] Task 8: End-to-end test of the real compiled binary — commit `553dc04`

### Checkpoint: CLI complete
- [x] `smasher --help` lists `prune-artifacts`
- [x] `cargo test -p smasher-cli` green, including both the dry-run and real-deletion
      e2e assertions

### Phase 6: Close-out
- [x] Task 9: Whole-workspace regression + `capability-map.md` update

### Checkpoint: Complete
- [x] `cargo test --workspace` and `cargo clippy --workspace` both clean
- [x] Every bullet in `SPEC-artifact-store.md`'s Success Criteria verified with evidence
- [x] `capability-map.md`'s `artifact-store` row marked Done
- [x] No modules remain "In Progress" in the capability map (this is the last one)

See `tasks/archive/todo-artifact-store.md` for the full per-task breakdown (acceptance criteria,
verification steps, dependencies, files touched, size estimate).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| The 7+4 struct-literal call sites found by grep are missed in review, breaking `cargo test --workspace` | Medium — a compile failure is loud, but wastes a cycle if not caught before Task 1/4 are called done | Both tasks' acceptance criteria explicitly list every call site by file; Checkpoint after each requires `cargo test --workspace`, not just the touched crate |
| `/design-kit` mount on `smasher-web/src/server.rs` regresses the existing `/candidate-artifacts` or `/static` mounts (shared, load-bearing file) | Medium-High — every gallery-view/gallery-gate screenshot goes through this router | Task 3's acceptance criteria require the two existing mount tests (`candidate_artifacts_mount_does_not_escape_its_root`, `static_mount_is_unaffected...`) to keep passing unmodified, plus Checkpoint A gates human review before Path B starts |
| Bundle persistence adds real disk cost per capture (a full copy of `candidate_dir`) with no per-slice pruning | Low-Medium, by design (spec assumption 8) | Path B's retention policy (Tasks 5-8) is the explicit, documented mitigation — an operator-run subcommand, not automatic, per spec assumption 6 |
| Backdating `RunManifest.created_at` for Task 6's integration test by rewriting JSON on disk could silently drift from the real struct shape if `RunManifest` changes later | Low | Test reads the real struct via `serde_json::Value`, mutates only the `created_at` key, re-serializes — not a hand-typed JSON literal |
| Choosing plain-integer CLI flags instead of the spec's illustrative duration-string example could surprise an operator expecting `30d` syntax | Low | Documented here and in `smasher prune-artifacts --help`; no external interface currently depends on the spec's exact illustrative flag names |

## Open Questions

(Carried forward from `SPEC-artifact-store.md`, not blocking this task breakdown — the
`/design-kit` mount question that *was* blocking is resolved above, not carried forward)

- Whether/when auto-pruning gets wired into `smasher run` or `smasher serve` startup,
  and what default policy it should ship with — deferred per spec assumption 6.
- Whether gallery-view/gallery-gate's templates should default to showing the live
  bundle (`<iframe>`) or keep the screenshot primary with the bundle as a "view live"
  link — a UX call for those modules' own follow-up, not decided here.
- Interaction-recording capture (video/gif) — no module currently owns building this;
  the `Recording` `ArtifactKind` variant is reserved but unimplemented until one does.
- Whether bundle persistence should be skippable per-candidate (e.g. an opt-out arg)
  for pipelines that don't want the extra disk cost — no current caller needs this,
  left until one does.
