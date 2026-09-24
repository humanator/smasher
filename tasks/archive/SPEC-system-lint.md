# Spec: `system-lint` — Design-System Conformance Check

Module id: `system-lint` (see `capability-map.md`). Depends on: `component-kit` (done —
Checkpoint C). Parallel-eligible with `render-capture` per the capability map's build
order — needs the kit to exist, not `render-capture` to finish first.

## Objective

Provide the `system_lint` pipeline tool: a deterministic, zero-LLM check of an
agent-generated candidate directory against two things — the design kit's code-based
tokens (no raw colors/spacing where a `var(--token)` belongs) and the kit's component
classes (candidate markup uses `.btn`, `.input`, kit dialog conventions, etc. instead of
reinventing equivalent UI). This is the check that lets `synthesis` (a later module)
tell a human "this candidate drifted from the design system" without a human eyeballing
every candidate's markup by hand.

Who uses it:
- **The pipeline engine** (`smasher-attractor`'s `ToolHandler`), invoking it when a DOT
  graph runs a node like `SystemLint [tool="system_lint", args="{...}"]` — see
  `smasher-design-factory.md` §4's example pipeline, where it runs off the same
  `Render2` output `task_critic` also consumes.
- **`task-critic-synthesis`** (later module), which reconciles this tool's structured
  pass/fail output with the usability critic's findings into one recommendation.
- **A human validating this slice directly**, before `synthesis` exists, by reading the
  written `lint-report.json`.

Success looks like: run a Tool node with `tool="system_lint"` pointed at a candidate
directory, and get back a structured report — pass/fail per check, with a violation
list for anything that failed — with zero LLM calls made in the process.

## Assumptions

Four decisions anchor this spec; everything else fills in underneath them.

1. **New crate `smasher-system-lint`** under `crates/`, added as a workspace member —
   same shape as `render-capture`: a library API (`lint(candidate_dir) ->
   Result<LintReport, LintError>`) plus its own `ToolBackend` implementation.
2. **`SystemLintToolBackend` is generic over its fallback**, exactly like
   `render-capture`'s `HybridToolBackend` (`SystemLintToolBackend::new(fallback: Arc<dyn
   ToolBackend>) -> Self`, dispatching `"system_lint"` natively and delegating
   everything else). This means it composes with whatever backend chain already exists
   at the two construction sites (`crates/smasher-cli/src/run.rs`,
   `crates/smasher-web/src/backend.rs`) regardless of whether `render-capture`'s own
   Task 7 wiring has landed yet — it wraps whatever `Arc<dyn ToolBackend>` is passed,
   the same generic-fallback pattern `render-capture`'s spec already established. No
   changes to `render-capture`'s `HybridToolBackend` itself.
3. **Two checks, not one, matching the capability map's own wording** ("kit component
   usage *and* code-based design tokens"):
   - **`token-adherence`**: no raw hex/rgb color or un-tokenized spacing/radius/shadow
     value in any CSS the candidate supplies (inline `<style>` blocks in `index.html`,
     or a linked local `.css` file in the candidate directory) — the same rule
     `design-kit/test/lint-tokens.mjs` already enforces on the kit's own
     `components.css`, generalized to accept an arbitrary CSS source instead of a
     hardcoded path.
   - **`kit-component-usage`**: candidate HTML uses the kit's classes/attributes for
     patterns the kit already provides, rather than reinventing them. Scope matches the
     five shipped components: a `<button>` element must carry `.btn`; a text `<input>`
     must carry `.input`; an interactive list row (`role="button"` on an `<li>`) must
     carry `.list-row-action`; an element with `role="dialog"` must carry
     `aria-modal="true"` and `hidden` (the kit's start-hidden convention). Anything
     outside these five patterns is out of scope, same "grow as demanded" boundary
     `component-kit` set for itself.
4. **`token-adherence` reimplements `lint-tokens.mjs`'s CSS-declaration parsing
   natively in Rust, via the `regex` crate, rather than shelling out to the script.**
   `regex` is already an unused workspace-level dependency, so this avoids introducing a
   Node runtime dependency at pipeline-run time and avoids editing a file that belongs to
   the already-checkpointed `component-kit` module. `kit-component-usage` follows the
   same no-new-dependency philosophy: four regex-based tag/attribute checks rather than a
   real HTML5 parser (`scraper`), keeping the whole crate at **zero new Cargo
   dependencies**. Superseded from this spec's original subprocess proposal; confirmed
   with the user during task planning (see `tasks/archive/plan-system-lint.md`'s Architecture
   Decisions).

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, new workspace crate `smasher-system-lint`.
- `regex` (already an unused workspace-level dependency) for both checks:
  `token-adherence`'s ported CSS-declaration rules and `kit-component-usage`'s
  tag/attribute checks against raw `index.html` text.
- Zero new Cargo dependencies — `regex`, `serde`, `serde_json`, `thiserror`, `tokio`,
  `async-trait`, `uuid` are all already workspace dependencies.

## Commands

```bash
# Build and test this crate in isolation
cargo check -p smasher-system-lint
cargo test -p smasher-system-lint
cargo clippy -p smasher-system-lint

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# Standalone lint, no pipeline involved
cargo run -p smasher-system-lint --example lint -- <candidate_dir>
```

## Project Structure

```
crates/smasher-system-lint/
  Cargo.toml
  src/
    lib.rs          # public lint() API + LintReport re-export
    checks/
      mod.rs
      token_adherence.rs   # ported lint-tokens.mjs rules, native Rust regex
      kit_usage.rs         # regex-based tag/attribute checks: button/input/dialog/list-row
    backend.rs        # SystemLintToolBackend: ToolBackend impl + fallback delegation
    report.rs           # LintReport / CheckResult structs, serde
  examples/
    lint.rs               # standalone CLI: candidate_dir -> LintReport (stdout JSON)
  tests/
    lint_test.rs           # integration test against fixtures/
  fixtures/
    clean-candidate/         # composed entirely from kit snippets — both checks pass
      index.html
    violating-candidate/     # raw hex color + custom button + custom dialog
      index.html

# Existing files touched, not created:
Cargo.toml                            # add crate member (zero new external deps)
crates/smasher-cli/src/run.rs        # wrap tool backend in SystemLintToolBackend
crates/smasher-web/src/backend.rs    # same
docs/design-factory/SPEC-system-lint.md  # this file
```

## Code Style

Matching `render-capture`'s established shape — flat `thiserror` enum, two-line
`ABOUTME` header, generic-over-fallback `ToolBackend` impl:

```rust
// ABOUTME: Design-system conformance checks for design-factory candidates.
// ABOUTME: Token adherence (no raw values) and kit-component-usage checks.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum LintError {
    #[error("candidate directory has no index.html: {0}")]
    MissingEntryPoint(String),
    #[error("failed to parse candidate HTML: {0}")]
    Parse(String),
}
```

```rust
// crates/smasher-system-lint/src/report.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    pub name: String,          // "token-adherence" | "kit-component-usage"
    pub passed: bool,
    pub violations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LintReport {
    pub checks: Vec<CheckResult>,
}

impl LintReport {
    pub fn passed(&self) -> bool {
        self.checks.iter().all(|c| c.passed)
    }
}
```

```rust
// crates/smasher-system-lint/src/backend.rs
#[async_trait::async_trait]
impl ToolBackend for SystemLintToolBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        match tool_name {
            "system_lint" => self.run_system_lint(args).await,
            _ => self.fallback.execute_tool(tool_name, args, context).await,
        }
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["system_lint".to_string()]
    }
}
```

## Testing Strategy

Per this repo's testing standard: real APIs, no mocking of the thing under test.

- **Unit (`kit_usage.rs`):** regex-based tag/attribute checks against small HTML
  fixtures — a `<button>` with `.btn` passes, one without fails with a violation naming
  the element; same shape for input/dialog/list-row. Each rule gets a passing and a
  failing case.
- **Unit (`token_adherence.rs`):** table-driven tests mirroring `lint-tokens.mjs`'s own
  behavior — raw hex flagged, raw `rgb(...)` flagged, un-tokenized `padding: 12px`
  flagged, allowed `1px` border not flagged, `var(--token)` values never flagged,
  excluded properties (e.g. `font-size`) never flagged.
- **Unit (`report.rs`):** `LintReport::passed()` is `false` if any check has
  violations, `true` if all are clean; serde roundtrip.
- **Integration (`tests/lint_test.rs`):** run `lint()` against
  `fixtures/clean-candidate/` (composed entirely from kit snippets) and assert both
  checks pass; run it against `fixtures/violating-candidate/` (raw hex color in an
  inline `<style>`, a bare `<button>`, a custom `role="dialog"` missing `aria-modal`)
  and assert both checks report the expected violations.
- **Regression:** `cargo test --workspace` stays green — no change to
  `design-kit/` itself, so `component-kit`'s own tests are unaffected.
- **End-to-end:** a small fixture `.dot` pipeline with a `tool="system_lint"` node, run
  through `smasher run`, asserting (a) `lint-report.json` lands at the expected artifact
  path, and (b) zero LLM calls were made — same panic-on-any-request `Client` technique
  `render-capture`'s Task 8 used to prove native dispatch never reached the LLM
  fallback.
- **Manual:** this session reads the written `lint-report.json` for both fixtures (via
  the Read tool) to confirm the violation text is actually legible/useful to a human or
  to `synthesis`, not just structurally present.

## Boundaries

- **Always do:** run `cargo test -p smasher-system-lint` and `cargo clippy --workspace`
  before considering a task done; confirm the e2e test proves zero LLM calls; keep the
  crate at zero new Cargo dependencies.
- **Ask first:** editing `crates/smasher-cli/src/run.rs` or
  `crates/smasher-web/src/backend.rs` — shared, load-bearing wiring, same gate
  `render-capture` used.
- **Never do:** make `system_lint` call an LLM (defeats the module's whole point — that
  job belongs to `task_critic`); touch `design-kit/` component markup, CSS, tokens, or
  scripts themselves; change the `ToolBackend`/`Handler` trait definitions in
  `smasher-attractor`.

## Success Criteria

- `smasher-system-lint` builds; `cargo test -p smasher-system-lint` passes with zero
  warnings.
- `fixtures/clean-candidate/` (kit-composed) passes both checks; `fixtures/
  violating-candidate/` fails both, with violation text identifying the offending
  element/declaration.
- A fixture DOT pipeline containing a `tool="system_lint"` node, run through `smasher
  run`, produces `lint-report.json` at the artifact path and demonstrably makes zero
  LLM client calls.
- `cargo test --workspace` stays green — no regression to `component-kit` or existing
  pipeline behavior.

## Open Questions

- Whether `kit-component-usage` rules need to grow beyond the four patterns here
  (button/input/dialog/list-row) as more kit components are added later — deferred,
  same "grow as demanded" principle `component-kit` used.
- ~~Whether `task-critic-synthesis` wants raw violation strings (this spec's choice,
  matching `lint-tokens.mjs`'s existing style) or a more structured/coded violation
  format — revisit once that module's spec is written, not before.~~ **Resolved by
  default:** `task-critic-synthesis` consumes `lint-report.json`'s raw strings as-is;
  no reformatting was needed. Confirmed 2026-09-17.
- ~~Exact artifact filename/location for `lint-report.json` ... is provisional
  pending `artifact-store`'s own spec.~~ **Resolved** — `artifact-store` shipped and
  defines this, same as `render-capture`'s equivalent item. Confirmed 2026-09-17.
