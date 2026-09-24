# Spec: `candidate-workdir-resolution` — Resolve `candidate_dir` Against the Run's Working Directory

Module id: `candidate-workdir-resolution` (see `capability-map.md`). Depends on:
`render-capture` (done), `system-lint` (done). This is a fix to a gap both of those
modules' specs deliberately deferred, not a new independent module.

## Objective

`render_capture` and `system_lint` tool nodes take `candidate_dir` as a path and pass
it straight to `Path::new(candidate_dir)`, which resolves relative paths against the
`smasher` process's own working directory (wherever `smasher run` / `smasher serve`
was launched from) — not the isolated per-run directory a Codergen node's `prompt`
output actually lands in (`effective_working_dir` in `run.rs`, `run_working_dir` in
`pages.rs`/`api.rs`). A pipeline author writing a static `.dot` file has no way to
reference that per-run directory, since it embeds a runtime-generated `run_id` that
doesn't exist until the run starts.

This is why `examples/product_design_factory.dot` currently points every render/lint
node at `smasher-render-capture`/`smasher-system-lint`'s own test fixtures instead of
real Codergen output: there was no other path that could be written into the `.dot`
file ahead of time and still resolve correctly. Confirmed live: running that pipeline
with a "gardening app onboarding flow" brief rendered the fixtures'
`<h1>Fixture candidate</h1>` placeholder in the gallery gate instead of the actual
generated candidates.

Success looks like: a relative `candidate_dir` (e.g. `"./candidates/discover-a"`)
resolves against the run's own working directory, so `product_design_factory.dot` —
and any future real pipeline — can point a render/lint tool node at wherever its own
Codergen nodes actually wrote files, with zero change to absolute-path behavior or any
existing fixture-based test.

## Assumptions

1. **Resolution happens inside `HybridToolBackend` / `SystemLintToolBackend`, not
   `ToolHandler`.** `ToolHandler` (`smasher-attractor/src/tool_handler.rs`) stays a
   thin dispatcher; the `ToolBackend` trait signature
   (`execute_tool(&self, tool_name, args, context)`) does not change. Each backend is
   already constructed fresh per run and can hold its run's working directory the same
   way it already holds `artifacts_base`.
2. **New constructor parameter, not a new trait method.** Both `HybridToolBackend::new`
   (`crates/smasher-render-capture/src/backend.rs`) and `SystemLintToolBackend::new`
   (`crates/smasher-system-lint/src/backend.rs`) gain a third parameter,
   `working_dir: PathBuf`. The value is already computed at all 4 real construction
   sites and passed to the Codergen backends for the identical reason:
   `run.rs`'s `effective_working_dir`, `pages.rs`'s `run_working_dir`, and `api.rs`'s
   `run_working_dir` (both `submit_run` and `resume_run`). No new *computation* is
   needed — but at all 4 sites the in-scope value is a `String`
   (`run_directory.manifest().directories.root.display().to_string()`, or, under
   `run.rs`'s `--worktree` branch, `worktree_dir.display().to_string()`), not a
   `PathBuf`, since it's built for display/serialization and handed to the Codergen
   backends' `String`-typed `working_dir` params. Each of the 4 sites needs a
   `PathBuf::from(&effective_working_dir)` / `PathBuf::from(&run_working_dir)` wrap
   when constructing `HybridToolBackend`/`SystemLintToolBackend` — a one-line
   conversion, not new plumbing, but real enough that a straight copy-paste of the
   existing `String` value into the new `PathBuf` parameter won't compile.
3. **Only relative `candidate_dir` values are affected.** If `candidate_dir` is already
   absolute (`Path::is_absolute()`), it's used as-is. This preserves every existing
   test — `fixture_candidate_dir()` in both crates returns an absolute
   `CARGO_MANIFEST_DIR`-based path — and any future caller who deliberately wants a
   path outside the run directory. Only relative values get joined onto `working_dir`
   before being passed to `crate::capture()` / `crate::lint()`.
4. **`working_dir` is joined, not canonicalized or existence-checked.**
   `working_dir.join(candidate_dir)` is the entire resolution step. A joined path that
   doesn't exist already surfaces through the existing error paths
   (`CaptureError::MissingEntryPoint` / `LintError::MissingEntryPoint`) — no new error
   variant needed.
5. **`product_design_factory.dot` gets fixed alongside the code**, replacing every
   fixture `candidate_dir` with the real relative path the corresponding Codergen
   node's prompt writes to (`./candidates/discover-a` etc. for the four Discover-phase
   render nodes, `./build/define` for `RenderDefine` and `SystemLint`). This is the
   pipeline this fix exists to unblock, and running it for real is the acceptance test
   — not an incidental side effect.
6. **No change to `manifest.rs`'s `artifact_dir()` / output-path handling.** That side
   of run-scoping was already solved correctly (its own comment: "keeps every tool's
   output under the one real run directory instead of a second, CWD-relative tree").
   This spec closes the equivalent gap on the *input* side only.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

No new dependencies. Pure `std::path::Path`/`PathBuf` joining inside two existing
crates.

## Commands

```bash
cargo check -p smasher-render-capture -p smasher-system-lint -p smasher-web -p smasher-cli
cargo test -p smasher-render-capture -p smasher-system-lint -p smasher-web -p smasher-cli
cargo test --workspace
cargo clippy --workspace
```

## Project Structure

```
# Existing files touched, not created (all in the smasher repo):
crates/smasher-render-capture/src/backend.rs   # HybridToolBackend: + working_dir field, resolve helper
crates/smasher-system-lint/src/backend.rs      # SystemLintToolBackend: same
crates/smasher-cli/src/run.rs                  # pass effective_working_dir into both ::new() calls
crates/smasher-web/src/routes/pages.rs         # pass run_working_dir into both ::new() calls
crates/smasher-web/src/routes/api.rs           # same, at both submit_run and resume_run sites
examples/product_design_factory.dot            # candidate_dir args → real output paths, not fixtures

# This file lives in design-factory/, not smasher/ — smasher's own
# .gitignore excludes /docs/design-factory/ deliberately; design-factory
# tracking docs are not committed to the smasher repo.
SPEC-candidate-workdir-resolution.md
```

## Code Style

A private helper on each backend, not inline logic duplicated at every call site:

```rust
// crates/smasher-render-capture/src/backend.rs
fn resolve_candidate_dir(&self, candidate_dir: &str) -> PathBuf {
    let path = Path::new(candidate_dir);
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        self.working_dir.join(path)
    }
}
```

The identical helper is duplicated (not shared via a new common crate) into
`smasher-system-lint`'s backend — two call sites don't justify a new dependency
between these otherwise-independent crates.

## Testing Strategy

Per this repo's testing standard: real filesystem, no mocking of the thing under test.

- **Unit (both crates):** a relative `candidate_dir` resolves against a
  constructor-supplied `working_dir` (assert the resolved path passed to
  `capture()`/`lint()`); an absolute `candidate_dir` passes through unchanged even when
  a `working_dir` is also set.
- **Regression:** every existing call site constructing `HybridToolBackend::new(...)` /
  `SystemLintToolBackend::new(...)` with two arguments needs updating for the new
  parameter — `cargo test --workspace` must stay green throughout, not just at the end.
- **End-to-end (the actual acceptance test):** run `examples/product_design_factory.dot`
  for real, with a real provider configured, through to `GalleryGate1`, and confirm the
  rendered candidates show actual generated onboarding-flow markup — not
  `<h1>Fixture candidate</h1>`. This is the live run `e77dc49`'s own commit message
  admits was never performed. This is a **manual, human-run step**, not part of
  `cargo test --workspace` or any CI gate: it needs a running provider and produces
  non-deterministic LLM output, neither of which belongs in an automated test suite.
  The local Ollama setup (`smasher-llm`'s `ollama` provider) is sufficient for this —
  no paid API key is required to satisfy this criterion.

## Boundaries

- **Always do:** run `cargo test --workspace` and `cargo clippy --workspace` before
  considering this done — this touches 4 shared, load-bearing construction sites plus
  two crates' public constructors.
- **Ask first:** any `HybridToolBackend::new` / `SystemLintToolBackend::new` call site
  found beyond the 4 listed above, in case another has been added since this spec was
  written; introducing a shared crate/helper if the two backends' resolution logic
  drifts later and someone's tempted to deduplicate it — not justified by two call
  sites today.
- **Never do:** touch `manifest.rs`'s output-path handling (already correct); add path
  canonicalization, symlink resolution, or existence validation beyond what
  `capture()`/`lint()` already do — that's scope creep past what's actually broken.

## Success Criteria

- `HybridToolBackend::new` and `SystemLintToolBackend::new` both take a
  `working_dir: PathBuf` parameter; relative `candidate_dir` args resolve against it,
  absolute ones don't.
- All 4 real construction sites (`run.rs`, `pages.rs`, `api.rs` ×2) pass their
  already-in-scope working-directory value through.
- `examples/product_design_factory.dot`'s render/lint nodes point at `./candidates/<id>`
  and `./build/define` instead of crate fixtures.
- A real run of `product_design_factory.dot` against a configured provider (Ollama,
  local, is sufficient) shows actual generated candidates in the gallery gate, not
  `Fixture candidate`. Run manually — not part of `cargo test --workspace`.
- `cargo test --workspace` and `cargo clippy --workspace` stay clean.

## Open Questions

- ~~`IAOptions`'s prompt currently leaves candidate naming to the LLM's discretion,
  while the four `RenderDiscoverA`–`D` nodes hardcode `candidate_id:
  "discover-a"`..`"discover-d"` — worth confirming the prompt should be made
  explicit about the four exact names.~~ **Resolved** — the prompt was made
  explicit; `tasks/archive/todo-candidate-workdir-resolution.md` confirms all four
  candidates render under `./candidates/discover-a`..`discover-d` one-to-one.
- ~~Whether `--worktree` mode changes anything.~~ **Resolved: no code change needed**
  — confirmed during implementation's verification task (same todo file, "Note any
  `--worktree`-mode-specific behavior observed" checkpoint, checked done).
