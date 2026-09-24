# Spec: `artifact-store` — Richer Candidate Artifact Storage

Module id: `artifact-store` (see `capability-map.md`). Depends on: `render-capture`
(done). Last module in the capability map's build order — every other module's spec
explicitly deferred a decision to this one.

## Objective

Extend a candidate's on-disk artifact beyond a bare `screenshot.png`, so it can also
hold a persisted, standalone-servable **live bundle** — and give the run-artifact tree
an explicit retention policy so richer artifacts don't grow the data directory
unbounded across runs. This is the module `smasher-design-factory.md` §3.5 describes
("richer candidate artifacts... beyond just a screenshot.png + manifest.json... that
retention-format decision remains open") and that `SPEC-render-capture.md`,
`SPEC-gallery-view.md`, and `SPEC-gallery-gate.md` each explicitly punted to.

Who uses it:
- **`render_capture`** (`smasher-render-capture`), which gains a second output — the
  persisted bundle — alongside the screenshot it already writes.
- **`smasher-web`'s `candidates.rs`** (backing `gallery-view`/`gallery-gate`), which
  today hardcodes `screenshot.png` and needs to read an artifact list from the manifest
  instead, so a future template can offer an embedded live view, not just a static
  image.
- **Whoever operates a long-running dashboard instance**, via a new
  `smasher prune-artifacts` CLI subcommand that caps disk growth across runs.

Success looks like: a candidate captured by `render_capture` has both `screenshot.png`
and a `bundle/` directory in its artifact dir; the candidate's `manifest.json` lists
both under a new `artifacts` field; `smasher-web`'s existing generic
`/candidate-artifacts` static mount can serve `bundle/index.html` with zero server
changes; and `smasher prune-artifacts` can be pointed at a data dir to enforce an
age/size cap across runs.

## Assumptions

1. **Directory layout is not this module's problem — it's already solved.** Task 9
   (2026-09-11, per `smasher-design-factory.md` §3.5) already unified every reader onto
   `{data_dir}/artifacts/<run_id>/artifacts/<candidate_id>/` — confirmed by reading
   `smasher-web/src/candidates.rs`, which scans exactly that path today.
   `SPEC-gallery-view.md`/`SPEC-gallery-gate.md` still describe a two-tree
   reconciliation as `artifact-store`'s job; that's stale relative to Task 9. This
   module owns extending what each candidate directory *holds*, not where it lives.
2. **"Embeddable live preview" for this slice means a persisted static copy**, not a
   new long-lived server process. `render_capture` already builds/serves the candidate
   directory ephemerally to take the screenshot (`SPEC-render-capture.md` assumption
   3); this module adds one step — copying that same directory tree into the
   candidate's artifact dir as `bundle/` — so it becomes independently servable later.
   `smasher-web/src/server.rs` already mounts `/candidate-artifacts` as a generic
   `tower_http::ServeDir` over the whole run artifact tree, not just `screenshot.png`,
   so `bundle/index.html` is servable with **no server-side change**. A candidate built
   from the kit's framework-free markup (render-capture assumption 6) works unmodified
   as a static bundle — it never depended on the ephemeral server for anything beyond
   serving files.
3. **Interaction recordings (video/gif click-throughs) are out of scope for this
   slice.** They need capture machinery (e.g. CDP screen recording) that no existing
   module owns; folding that into a storage-focused module would blur its scope. The
   schema below reserves a `Recording` `ArtifactKind` variant so a future module can add
   a producer without another manifest migration — nothing in this spec produces one.
4. **This is a manifest schema change, not a new sidecar file.** Add
   `artifacts: Vec<ArtifactRef>` to the existing
   `smasher_render_capture::manifest::Manifest` — the struct every reader already
   deserializes — rather than a second metadata file to keep in sync.
   `#[serde(default)]` keeps it backward-compatible: manifests already on disk (no
   `artifacts` key) still parse, with an empty vec. Callers fall back to the legacy
   hardcoded `screenshot.png` path when the list is empty — no migration of existing
   on-disk manifests needed.
5. **Retention lives in `smasher-attractor`, next to `RunDirectory`** — not a new
   crate. It operates over the `{data_dir}/artifacts/` tree that crate already owns
   (`run_dir.rs`), and its policy shape mirrors the existing
   `log_sink::RetentionPolicy` (`max_entries`/`max_age`/`max_file_size_bytes`) rather
   than inventing new vocabulary. Pruning removes whole
   `{data_dir}/artifacts/<run_id>/` trees oldest-first (by `RunManifest.created_at`),
   never individual files within a run — a run's artifacts are kept or discarded as a
   unit.
6. **No automatic pruning wired into `smasher run` or `smasher serve` in this slice.**
   Retention is exposed as an explicit new `smasher prune-artifacts` subcommand
   (modeled on the existing `archive` subcommand's shape: a target data dir, policy
   flags, and `--dry-run`) that an operator runs by hand or crons themselves.
   Auto-pruning on every run start could delete a run mid-review — left as an Open
   Question, not decided here.
7. **`render_capture`'s public API changes minimally.** `capture()` gains no new
   required parameters — bundle persistence happens automatically as part of the
   existing capture step, from the same `candidate_dir`/output paths already passed in.
   This spec is the pre-authorized exception to `SPEC-render-capture.md`'s "ask first"
   boundary on `manifest::artifact_dir()` — but only for the manifest's *contents*
   (the new `artifacts` field), not that function's path shape, which is unchanged.
8. **Bundle size is not capped per-candidate in this slice** — only the aggregate,
   cross-run policy in #5/#6 bounds total disk use. A candidate whose markup embeds
   something unexpectedly large is a `component-kit`/authoring concern, not this
   module's.
9. **`smasher-web` changes are additive reads, not a new UI.** `CandidateSummary`
   gains the manifest's artifact list alongside the existing `screenshot_url`; actually
   changing gallery-view/gallery-gate templates to embed the bundle (an `<iframe>`, a
   screenshot/live toggle) is left to those modules' own follow-up — listed as an Open
   Question. This mirrors how `render-capture` produced artifacts before `gallery-view`
   existed to display them.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, two existing crates touched: `smasher-render-capture` (manifest schema +
  bundle persistence) and `smasher-attractor` (retention policy + prune function,
  alongside `run_dir.rs`/`log_sink.rs`).
- `smasher-cli` gains one new subcommand module, `prune.rs`, following `archive.rs`'s
  `clap::Args` pattern.
- `smasher-web`'s `candidates.rs` gets an additive read of the new manifest field.
- **No new external dependencies.** Bundle persistence is a recursive directory copy
  implemented directly over `std::fs` (`read_dir` + `create_dir_all` + `copy`),
  consistent with this workspace's habit of only adding a dependency when the task
  genuinely needs one (contrast `render-capture` pulling in `chromiumoxide` for actual
  browser automation).

## Commands

```bash
# Build and test the touched crates in isolation
cargo check -p smasher-render-capture -p smasher-attractor -p smasher-cli -p smasher-web
cargo test -p smasher-render-capture -p smasher-attractor -p smasher-cli -p smasher-web
cargo clippy -p smasher-render-capture -p smasher-attractor -p smasher-cli -p smasher-web

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# New subcommand, once implemented
smasher prune-artifacts --data-dir ./data --max-age 30d --max-total-mb 500 --dry-run
```

## Project Structure

```
crates/smasher-render-capture/src/
  manifest.rs   # + ArtifactRef, ArtifactKind; Manifest gains `artifacts: Vec<ArtifactRef>`
  capture.rs    # + bundle persistence step, run after the existing screenshot capture
  lib.rs        # capture() signature unchanged; now also writes bundle/

crates/smasher-attractor/src/
  run_dir.rs    # + ArtifactRetentionPolicy, prune_artifacts(data_dir, policy) -> PruneReport

crates/smasher-cli/src/
  main.rs       # + PruneArtifacts(prune::PruneArgs) Command variant
  prune.rs      # new: PruneArgs (clap::Args) + run(), wiring flags to prune_artifacts

crates/smasher-web/src/
  candidates.rs # CandidateSummary reads the manifest's `artifacts` list

# Existing files touched, not created:
design-factory/capability-map.md          # mark artifact-store Done once merged
design-factory/SPEC-artifact-store.md     # this file
```

## Code Style

Matching this workspace's established patterns — flat `thiserror` enum, two-line
`ABOUTME` header, an additive `#[serde(default)]` field for backward compatibility:

```rust
// crates/smasher-render-capture/src/manifest.rs

/// A single stored artifact for a candidate, beyond the historical bare
/// `screenshot.png`. `path` is relative to the candidate's own artifact directory.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ArtifactRef {
    pub kind: ArtifactKind,
    pub path: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ArtifactKind {
    Screenshot,
    /// A persisted, standalone-servable copy of the candidate directory.
    LiveBundle,
    /// Reserved for a future interaction-recording producer; unused today.
    Recording,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Manifest {
    pub captured_at: DateTime<Utc>,
    pub viewport: Viewport,
    pub candidate_dir: PathBuf,
    pub exit_status: ExitStatus,
    #[serde(default)]
    pub artifacts: Vec<ArtifactRef>,
}
```

Retention mirrors `log_sink::RetentionPolicy`'s existing shape and prune-oldest-first
behavior:

```rust
// crates/smasher-attractor/src/run_dir.rs

#[derive(Debug, Clone, Default)]
pub struct ArtifactRetentionPolicy {
    pub max_age: Option<chrono::Duration>,
    pub max_total_bytes: Option<u64>,
}

pub struct PruneReport {
    pub removed_run_ids: Vec<String>,
    pub bytes_reclaimed: u64,
}

pub fn prune_artifacts(
    data_dir: &Path,
    policy: &ArtifactRetentionPolicy,
    dry_run: bool,
) -> Result<PruneReport, StateError> {
    // Read each {data_dir}/artifacts/<run_id>/manifest.json for created_at,
    // sort oldest-first, remove whole run dirs until within policy limits.
}
```

## Testing Strategy

Per this repo's testing standard: real APIs/filesystem, no mocking of the thing under
test.

- **Unit:**
  - `Manifest` serde roundtrip including the new `artifacts` field.
  - Backward-compat: a fixture `manifest.json` with no `artifacts` key still
    deserializes, with `artifacts` defaulting to `vec![]`.
  - Bundle persistence copies nested files and subdirectories correctly (a fixture
    candidate with an `assets/` subfolder).
  - `prune_artifacts` unit tests mirroring `log_sink`'s existing suite:
    `max_age` removes only older run dirs; `max_total_bytes` removes oldest-first
    until under the cap; nothing is removed when within limits; `dry_run: true` reports
    what *would* be removed without touching disk.
- **Integration:** extend `smasher-render-capture/tests/capture_test.rs` to assert
  `bundle/index.html` exists after `capture()` and that its content matches the
  original candidate fixture, alongside the existing `screenshot.png` assertions. A
  new `smasher-attractor` integration test creates several real `RunDirectory` trees
  with backdated manifests, runs `prune_artifacts`, and asserts the correct
  directories were removed from disk.
- **End-to-end:** a `smasher-cli` test invokes
  `smasher prune-artifacts --data-dir <fixture> --dry-run` and asserts zero filesystem
  changes plus a correct stdout report; a second (non-dry-run) invocation asserts the
  expected run directories are actually gone afterward.
- **Manual:** this session opens the persisted `bundle/index.html` (via the Read tool
  or by serving it locally) to confirm it renders identically to the candidate that
  produced the paired `screenshot.png`, before the module is called done.
- **Regression:** `cargo test --workspace` stays green; existing
  `scan_candidates`/`read_scorecard` tests in `candidates.rs` are unaffected by the
  purely additive `Manifest` field.

## Boundaries

- **Always do:** keep `Manifest.artifacts` `#[serde(default)]` so every manifest
  already on disk keeps parsing; run
  `cargo test -p smasher-render-capture -p smasher-attractor -p smasher-cli -p smasher-web`
  and `cargo clippy --workspace` before considering a task done; treat
  `prune_artifacts` as a whole-run-directory operation — never a partial delete inside
  a run someone might be actively reviewing.
- **Ask first:** wiring `prune_artifacts` to run automatically from `smasher run` or
  `smasher serve` (this spec only adds the manual subcommand); changing
  `manifest::artifact_dir()`'s path shape (owned by `render-capture`, unchanged here);
  adding any new Cargo dependency if the manual recursive-copy approach turns out to
  need one; changing gallery-view/gallery-gate templates to actually render the bundle
  inline (out of this module's scope per assumption 9).
- **Never do:** implement interaction-recording capture (assumption 3); delete or
  modify a run directory outside the explicit `prune-artifacts` command path; touch
  `design-kit/` markup, CSS, or tokens.

## Success Criteria

- [x] `render_capture`'s `capture()` writes `bundle/` (a full copy of the served candidate
  directory) alongside `screenshot.png` in the candidate's artifact dir, referenced
  from a new `artifacts` list in `manifest.json`. — Task 2, `capture_writes_screenshot_and_manifest_to_output_dir` +
  `capture_copies_nested_assets_into_the_bundle` (`smasher-render-capture/src/lib.rs`), commit `3f8d3d3`.
- [x] An old-format `manifest.json` (no `artifacts` key) still deserializes via
  `smasher_render_capture::manifest::Manifest`, with an empty `artifacts` vec —
  proven by a fixture-based regression test. — Task 1, `manifest_deserializes_without_artifacts_key_for_backward_compat`
  (`smasher-render-capture/src/manifest.rs`), commit `dd24123`.
- [x] `prune_artifacts` in `smasher-attractor` removes whole
  `{data_dir}/artifacts/<run_id>/` trees oldest-first once a configured max age or max
  total size is exceeded, and changes nothing on disk when invoked as a dry run. — Task 5 unit tests +
  Task 6 real-`RunDirectory` integration test (`smasher-attractor/src/run_dir.rs`,
  `tests/artifact_retention_integration.rs`), commits `46f0280`, `5e5700a`.
- [x] `smasher prune-artifacts` exists as a documented subcommand (`smasher --help` shows
  it) and is exercised against a real fixture data dir in an integration test. — Task 7 (`smasher-cli/src/prune.rs`,
  `main.rs`) + Task 8 e2e test against the real compiled binary (`tests/prune_e2e.rs`), commits `9205aa8`, `553dc04`.
  Manually confirmed `smasher --help` and `smasher prune-artifacts --help` both render.
- [x] `cargo test --workspace` and `cargo clippy --workspace` stay clean. — Task 9: `cargo test --workspace` 0 failures
  (2857+ tests across all crates); `cargo clippy --workspace --all-targets` shows only the pre-existing
  `smasher-attractor` style warnings noted in `gallery-gate`'s Task 9 (none new). Additionally manually
  verified end-to-end: a real `smasher serve` instance (data dir seeded with a persisted `bundle/index.html` +
  nested `assets/style.css`) served both through `/candidate-artifacts/.../bundle/...` and the new
  `/design-kit/tokens.css` mount the bundle's own stylesheet reference depends on — all three 200 with correct bytes.

## Open Questions

- Whether/when auto-pruning gets wired into `smasher run` or `smasher serve` startup,
  and what default policy it should ship with — deferred per assumption 6.
- ~~Whether gallery-view/gallery-gate's templates should default to showing the live
  bundle (`<iframe>`) or keep the screenshot primary with the bundle as a "view live"
  link — a UX call for those modules' own follow-up, not decided here.~~ **Resolved**
  by `live-preview`: `_candidate_card.html` defaults to `<iframe src="{{ bundle }}">`
  when a bundle exists, falling back to the `<img>` screenshot only when it doesn't.
  Confirmed 2026-09-17.
- Interaction-recording capture (video/gif) — no module currently owns building this;
  the `Recording` `ArtifactKind` variant is reserved but unimplemented until one does.
- Whether bundle persistence should be skippable per-candidate (e.g. an opt-out arg)
  for pipelines that don't want the extra disk cost — no current caller needs this,
  left until one does.
