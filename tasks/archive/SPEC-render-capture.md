# Spec: `render-capture` — Candidate Screenshot Capture Tool

Module id: `render-capture` (see `capability-map.md`). Depends on: `component-kit`
(done — Checkpoint C). Second build slice per the capability map's build order.

## Objective

Provide the `render_capture` pipeline tool: given a directory containing a candidate
screen composed from the shared component kit, serve it locally and capture a static
screenshot, writing the result as a run artifact. This is the mechanical step that
turns an agent-authored candidate into something reviewable — the first slice proves
build → serve → capture works end-to-end; embedding candidates into the dashboard is
`gallery-view`'s job, not this one.

Who uses it:
- **The pipeline engine** (`smasher-attractor`'s `ToolHandler`), which invokes it when
  a DOT graph runs a node like `Render1 [shape=hexagon, tool="render_capture",
  args="{...}"]`.
- **`gallery-view`** (next module, depends on this one), which will read the artifacts
  this module writes.
- **A human validating this slice directly**, before `gallery-view` exists, by opening
  the captured PNG.

Success looks like: run a Tool node with `tool="render_capture"` pointed at a
design-kit-composed candidate directory, and find a correct PNG screenshot plus a
`manifest.json` in the expected run-artifact directory — with zero LLM calls made in
the process.

## Assumptions

Three decisions were already confirmed before drafting this spec: a new dispatching
`ToolBackend` (not the existing LLM-mediated one) handles `render_capture` natively;
the implementation is a new Rust crate; and this slice produces a static screenshot
only (no recording, no long-lived live-preview server). Everything below fills in the
detail underneath those three decisions.

1. **New crate `smasher-render-capture`** under `crates/`, added as a workspace
   member. It exposes a library API (`capture(candidate_dir, output_dir, viewport) ->
   Result<Manifest, CaptureError>`) plus a small `examples/capture.rs` binary for
   standalone testing outside a full pipeline run.
2. **A new `HybridToolBackend`** (in this new crate) implements the existing
   `ToolBackend` trait from `smasher-attractor`. It checks a small native-tool map
   first (initially just `render_capture`) and falls back to the existing
   `LlmToolBackend` for every other tool name — so no other tool's behavior changes.
   No changes to `ToolHandler`, the DOT parser, or the `Handler`/`ToolBackend` traits
   themselves; this is purely a new backend implementation, wired in at the two
   existing construction sites: `crates/smasher-cli/src/run.rs` and
   `crates/smasher-web/src/backend.rs`.
3. **Serving is ephemeral, not long-lived.** A minimal `axum` + `tower-http::ServeDir`
   static server binds to an OS-assigned port (`:0`), serves just long enough for the
   screenshot to be taken, then shuts down. Long-lived serving for an embeddable live
   preview is explicitly deferred to `gallery-view`/`gallery-gate`, which may or may
   not reuse this crate's server code.
4. **Two mounts, not one**, on that ephemeral server: the candidate directory at `/`,
   and this repo's `design-kit/` directory at `/design-kit`. Candidates reference kit
   assets by the fixed absolute path `/design-kit/tokens.css` etc., rather than a
   relative path that would break once the candidate is served from its own directory
   root. `component-kit`'s `README.md` (from the prior module) will need a short
   addendum documenting this convention for whatever agent composes candidates next —
   noted here, not in scope to write as part of *this* module.
5. **Screenshot capture via `chromiumoxide`** (async, CDP-based, tokio-native — fits
   this workspace's existing async/tokio conventions better than a blocking
   alternative like `headless_chrome`). Requires a local Chrome/Chromium binary
   (auto-discovered or via `CHROME` env var) — this repo does not vendor one, the same
   external-prerequisite shape as Playwright's browser install already used by
   `design-kit`'s own tests.
6. **Candidate contract:** a candidate is a plain directory with an `index.html` entry
   point. `render_capture` doesn't inspect or validate its contents beyond confirming
   that file exists — consistent with the kit being framework-free markup that any
   agent can compose freely.
7. **Tool args shape:** `{"candidate_dir": "<path>", "run_id": "<id>", "candidate_id":
   "<id>"}`. `run_id`/`candidate_id` determine the output path; `candidate_dir` is the
   input to serve.
8. **Artifact output convention (interim):** `runs/<run_id>/artifacts/<candidate_id>/
   screenshot.png` plus a sibling `manifest.json` (capture timestamp, viewport size,
   source `candidate_dir`, exit status). This layout is provisional — the later
   `artifact-store` module owns the real design for richer artifacts (recordings,
   embeddable bundles) and may revise it. `render-capture` only needs *a* stable
   convention now so `gallery-view` has something to read.
9. **Fixed viewport** (1280×800) for this slice — no per-candidate size configuration
   yet, since nothing downstream asks for one.
10. **Out of scope for this module:** anything in `design-kit/` itself, the DOT parser
    or `Handler`/`ToolBackend` trait definitions in `smasher-attractor`, and any
    dashboard route/template in `smasher-web` beyond the backend-construction change
    in #2.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, new workspace crate `smasher-render-capture`.
- `axum` (already a `smasher-web` dependency) + `tower-http` (new dependency, `fs`
  feature for `ServeDir`).
- `chromiumoxide` (new dependency) for headless-Chromium screenshot capture over CDP.
- `tokio` (already a workspace dependency) for the async server and browser driving.
- Requires a local Chrome/Chromium install at build-and-test time (not vendored).

## Commands

```bash
# Build and test this crate in isolation
cargo check -p smasher-render-capture
cargo test -p smasher-render-capture
cargo clippy -p smasher-render-capture

# Whole-workspace regression check (existing LlmToolBackend-dependent tests
# must still pass unchanged)
cargo test --workspace
cargo clippy --workspace

# Standalone capture, no pipeline involved
cargo run -p smasher-render-capture --example capture -- \
  <candidate_dir> <output_dir>
```

## Project Structure

```
crates/smasher-render-capture/
  Cargo.toml
  src/
    lib.rs           # public capture() API + Manifest re-export
    server.rs         # ephemeral two-mount static server (axum + tower-http)
    capture.rs         # chromiumoxide-driven screenshot capture
    backend.rs          # HybridToolBackend: ToolBackend impl + LlmToolBackend fallback
    manifest.rs          # Manifest struct, serde, artifact path helpers
  examples/
    capture.rs            # standalone CLI: candidate_dir output_dir -> PNG + manifest.json
  tests/
    capture_test.rs        # integration test against fixtures/candidate/
  fixtures/
    candidate/
      index.html            # minimal fixture candidate, references /design-kit/*

# Existing files touched, not created:
crates/smasher-cli/src/run.rs        # construct HybridToolBackend instead of LlmToolBackend
crates/smasher-web/src/backend.rs    # same
Cargo.toml                            # add crate member + tower-http + chromiumoxide deps
docs/design-factory/SPEC-render-capture.md  # this file
```

## Code Style

Matching this workspace's established patterns — flat `thiserror` enum, two-line
`ABOUTME` header, `async-trait` for the backend impl:

```rust
// ABOUTME: Headless-Chromium screenshot capture for design-factory candidates.
// ABOUTME: Serves a candidate directory locally and captures a PNG via CDP.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CaptureError {
    #[error("candidate directory has no index.html: {0}")]
    MissingEntryPoint(String),
    #[error("failed to launch headless browser: {0}")]
    BrowserLaunch(String),
    #[error("screenshot capture failed: {0}")]
    Capture(String),
}
```

```rust
// crates/smasher-render-capture/src/backend.rs
#[async_trait::async_trait]
impl ToolBackend for HybridToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        match tool_name {
            "render_capture" => self.run_render_capture(args).await,
            _ => self.fallback.execute_tool(tool_name, args, context).await,
        }
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["render_capture".to_string()]
    }
}
```

## Testing Strategy

Per this repo's testing standard: real APIs, no mocking of the thing under test.

- **Unit:** `Manifest` serde roundtrip; entry-point detection returns
  `MissingEntryPoint` when `index.html` is absent; artifact path construction from
  `run_id`/`candidate_id`.
- **Integration** (`tests/capture_test.rs`): start the real two-mount server against
  `fixtures/candidate/`, drive a real headless Chromium via `chromiumoxide`, assert a
  non-trivial PNG is written (non-zero byte size, valid PNG header) and `manifest.json`
  fields are correct. No mocked browser or mocked HTTP server — this is the one thing
  in this module worth proving for real.
- **End-to-end:** a small fixture `.dot` pipeline with a `tool="render_capture"` node,
  run through `smasher run`, asserting (a) the artifact lands at
  `runs/<run_id>/artifacts/<candidate_id>/`, and (b) zero LLM calls were made — proven
  by wiring a `Client` that panics on any request into the test harness, showing the
  native dispatch path never reached `LlmToolBackend`.
- **Manual:** this session opens the captured `screenshot.png` (via the Read tool) to
  confirm it's a real render of the fixture candidate — not blank, not an error page —
  before the module is called done.
- **Regression:** `cargo test --workspace` must stay green; existing
  `LlmToolBackend`-only tests must be unaffected by `HybridToolBackend`'s introduction.

## Boundaries

- **Always do:** run `cargo test -p smasher-render-capture` and
  `cargo clippy --workspace` before considering a task done; confirm the e2e test
  proves zero LLM turns; keep the capture server ephemeral — bind port 0, shut it down
  once the screenshot is written, never leave it running.
- **Ask first:** adding `chromiumoxide` and `tower-http` as new Cargo dependencies;
  choosing how CI discovers/installs a Chromium binary for the integration test (this
  repo's `.github/` workflows have no browser today); editing
  `crates/smasher-cli/src/run.rs` or `crates/smasher-web/src/backend.rs` — shared,
  load-bearing wiring, unlike `component-kit`'s purely-additive change.
- **Never do:** make `render_capture` itself call an LLM (defeats the module's whole
  point); touch `design-kit/` component markup, CSS, or tokens; change the
  `ToolBackend`/`Handler` trait definitions in `smasher-attractor`.

## Success Criteria

- `smasher-render-capture` builds; `cargo test -p smasher-render-capture` passes with
  zero warnings.
- Given a candidate directory with an `index.html` that references `/design-kit/*`
  assets, `capture()` produces a PNG that visually matches the candidate (confirmed by
  this session opening the file) and a correct `manifest.json`.
- A fixture DOT pipeline containing a `tool="render_capture"` node, run through
  `smasher run`, produces the artifact at `runs/<run_id>/artifacts/<candidate_id>/` and
  demonstrably makes zero LLM client calls.
- `cargo test --workspace` and `cargo clippy --workspace` stay clean — no regression to
  existing `LlmToolBackend` behavior or tests.

## Open Questions

- ~~Exact artifact directory layout (assumption 8) is provisional pending the
  `artifact-store` module's own spec.~~ **Resolved** — `artifact-store` shipped and
  defines the layout (`manifest.rs`'s `artifact_dir()`). Confirmed 2026-09-17.
- Whether CI gets a Chromium install step added for the integration test, or that test
  stays local-only for now — still genuinely undecided: `.github/workflows/ci.yml` has
  no Chromium/Playwright step as of 2026-09-17, so the de facto answer is
  "local-only," but that was never a deliberate decision — see `DEFERRED.md`.
- ~~Whether `gallery-view`'s eventual long-lived live-preview server reuses this
  crate's `server.rs` as-is, extends it, or is built separately.~~ **Resolved,
  differently than framed:** no dedicated live server was needed. This crate's
  `server.rs` is an ephemeral axum server used only transiently during the capture
  step; `gallery-view`/`gallery-gate` instead serve the persisted static bundle
  directly via `smasher-web`'s own static routes (`/candidate-artifacts/...`,
  confirmed in `pages.rs`'s tests). Confirmed 2026-09-17.
- Where `candidate_id` actually comes from at pipeline-authoring time (a fixed name
  the implementer agent chooses vs. one derived from a `Parallel` fan-out branch id)
  — answered in practice, not formalized: the shipped `product_design_factory.dot`
  hardcodes `discover-a`..`discover-d`. See `DEFERRED.md`.
