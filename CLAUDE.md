# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Smasher - AI Workflow Orchestration in Rust

## What is this?

A Rust implementation of [strongdm/attractor](https://github.com/strongdm/attractor) — layered AI
workflow orchestration. Write a pipeline as a DOT directed graph, point it at an LLM, and run it.

Cargo workspace, 10 crates under `crates/`. The first six form the core stack, bottom to top; the
last four are a "design-factory" evaluation toolchain that judges generated UI candidates.

| Crate | What it does |
|-------|-------------|
| `smasher-llm` | Unified LLM client across OpenAI (Responses API), Anthropic (Messages API), and Gemini. Streaming, retries, provider adapters, middleware. |
| `smasher-agent` | Programmable coding agent loop: tools (read, write, edit, shell, grep, glob, apply_patch), steering, subagents, loop detection. Builds on `smasher-llm`. |
| `smasher-attractor` | The graph engine. Parses DOT, resolves node types from shapes, dispatches handlers, runs the pipeline. |
| `smasher-cli` | `smasher` binary: `complete`, `chat`, `run`, `resume`, `render`, `serve`, `ingest`, `archive`, `lint`, `prune-artifacts`. |
| `smasher-web` | JSON+SSE API (axum, port 21541): submit pipelines, live event stream, human-gate Q&A, candidate tracking. Serves the `smasher-spa` static build at `/`. |
| `smasher-desktop` | macOS Tauri 2 app: boots `smasher-web` in-process on `127.0.0.1` only, then opens a webview on it. Native dialogs + notifications via Tauri plugins. `make desktop-dev` / `make desktop-build`. |
| `smasher-conformance` | Adapter CLI bridging smasher crates to the AttractorBench test contract. 15 subcommands across 3 tiers (LLM SDK, Agent Loop, Attractor Pipeline). |
| `smasher-system-lint` | Deterministic design-system conformance checks for design-factory candidates. |
| `smasher-render-capture` | Headless-Chromium screenshot capture (via CDP) of a candidate served locally. |
| `smasher-task-critic-synthesis` | Vision-model usability critique (`task_critic`) and recommendation synthesis (`synthesis`) — one real LLM call each, no agent loop. |

Each layer depends only on the ones below it. The core stack (`llm` → `agent` → `attractor` →
`cli`/`web` → `desktop`) is standalone; the evaluation crates (`system-lint`, `render-capture`,
`task-critic-synthesis`, `conformance`) are consumed as pipeline tools/handlers, not dependencies
of the core layers.

## Build & Test

```bash
cargo check --workspace
cargo test --workspace        # ~2,700 tests
cargo clippy --workspace -- -D warnings
cargo fmt --all
```

A `Makefile` wraps these plus extras:

```bash
make test-single CRATE=smasher-agent   # cargo test -p <crate>
make test-llm / test-agent / test-attractor
make lint                              # clippy -D warnings
make fmt-check                         # fmt --check, used in CI
make pre-commit                        # fmt-check + lint + test
make ci                                # fmt-check + clippy + test
make coverage                          # cargo-llvm-cov, needs cargo-llvm-cov installed
make stats                             # LOC, test count, crate count
```

Run one test by name: `cargo test -p <crate> <test_name>`.

## Running the CLI

Requires at least one provider key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`),
set in the environment or a repo-root `.env`.

```bash
cargo run -p smasher-cli -- complete "explain quicksort in three sentences"
cargo run -p smasher-cli -- chat
cargo run -p smasher-cli -- run examples/old-examples/hello-world.dot
cargo run -p smasher-cli -- serve   # web dashboard on http://127.0.0.1:21541
```

## DOT pipeline node shapes

`smasher-attractor` resolves node behavior from the DOT node's shape attribute:

- `circle` / `point` / `Mdiamond` — start
- `doublecircle` / `Msquare` — exit
- `box` / `rectangle` — codergen (runs an LLM agent); also the type when `shape` is omitted
- `diamond` — conditional (branches on variables)
- `hexagon` / `oval` / `ellipse` — interviewer (asks a human, captures response)
- `parallelogram` — tool
- `component` — parallel fan-out
- `tripleoctagon` — fan-in (joins parallel branches)
- `house` — manager (coordinator, delegates to a manager backend)
- `folder` — sub-pipeline (nested DOT file)
- any other shape — generic

The mapping lives in `node_type_from_shape` (`smasher-attractor/src/graph/mod.rs`).

Handler dispatch is a registry (`smasher-attractor::handler::HandlerRegistry`): the engine visits
each node and delegates to the first `Handler` whose `handles()` matches the node type.
`default_registry()` preloads Start/Exit/Conditional; Codergen and the design-factory tool
handlers are registered by the CLI/web binaries on top of that. See `docs/dot-reference.md` and
`docs/handler-reference.md` for the full spec, `examples/` for working pipelines.

## Key Rust Patterns

- `ContentPart` as tagged enum with `#[serde(tag = "kind")]`
- Streaming via `Pin<Box<dyn Stream<Item = Result<StreamEvent, Error>> + Send>>`
- Flat `thiserror` enum with `retryable()` method
- `async-trait` for provider/handler/executor traits
- `tokio::broadcast` for event delivery
- `CancellationToken` for abort
- `winnow` for DOT parsing

## File Conventions

- All files start with two `ABOUTME:` comment lines
- Tests go in same file (`#[cfg(test)] mod tests`) or in `tests/` dir for integration tests
- TDD: write test first, then implementation

## Docs

- [Quickstart](docs/quickstart.md)
- [API reference](docs/api-reference.md)
- [DOT reference](docs/dot-reference.md)
- [Handler reference](docs/handler-reference.md)
- [CLI reference](docs/cli-reference.md)
- [Config reference](docs/config-reference.md)
- [Backlog](tasks/BACKLOG.md) (open work; finished specs and plans are in `tasks/archive/`)
