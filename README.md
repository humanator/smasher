<!-- ABOUTME: Project README covering what this fork is for, what it adds, setup, and usage. -->
<!-- ABOUTME: Entry point for anyone cloning the repo for the first time. -->

# smasher

A semi-dark design factory, built on a Rust AI workflow engine.

Write a pipeline as a DOT directed graph, point it at an LLM, and run it. Most of the pipeline runs
unattended: generating candidates, building them as real screens, rendering, checking and critiquing
them. It then pauses at gates to show you the candidates and lets you pick the direction.

## About this fork

This is a fork of [smasher](https://github.com/2389-ai/smasher), a Rust implementation of
[attractor](https://github.com/strongdm/attractor) by [strongDM](https://www.strongdm.com/). Attractor
defined DOT-graph-driven AI pipelines. Smasher rebuilt that idea in Rust with a layered crate
architecture, multi-provider LLM support and a web dashboard.

Upstream is aimed at "dark factory" coding workflows, where nobody reviews the output because code has a
checkable notion of correct (it compiles, the tests pass). Product design doesn't, and a fully
unattended design pipeline tends to reproduce the flat, committee-style choices it's meant to escape.
This fork takes the engine in a different direction: **product design exploration where a human still
makes the taste and direction calls.** [`tasks/Vision.md`](tasks/Vision.md) has the full reasoning.

The key ideas:

- **Real screens, not mockups.** Candidates are small, live, clickable builds composed from a shared
  [component kit](design-kit/README.md), so you judge interaction patterns by using them.
- **Two critics, not one score.** A deterministic design-system check (`smasher-system-lint`) and a
  vision-model usability critique (`task_critic`) are synthesised into a single recommendation.
- **Human gallery gates.** The pipeline pauses on a gate that shows candidate thumbnails, lint badges and
  scorecards, and you choose what happens next.
- **A dashboard you'd actually use.** A Svelte SPA (and macOS desktop app) for building workflows,
  launching runs, watching them live and answering gates.

### What the fork adds

| Area | What's there |
|------|--------------|
| Design-factory toolchain | `smasher-system-lint` (token and component conformance), `smasher-render-capture` (headless Chromium screenshots of a locally served candidate) and `smasher-task-critic-synthesis` (usability critique and recommendation). |
| Component kit | [`design-kit/`](design-kit/): plain HTML/CSS/JS components and tokens that candidates are composed from. No build step. |
| Example pipeline | [`examples/product_design_factory.dot`](examples/product_design_factory.dot): intake questions, Discover, Define and Deliver phases with gallery gates between them. |
| Gallery gates | Interviewer nodes with `gallery="true"` show candidates with thumbnails, a full-size lightbox, params, lint badges and scorecards. Decisions are recorded per run. |
| Web SPA | `frontend/`: workflow catalog and detail pages, a node editor for DOT graphs (import and export `.dot`), a run dialog, run pages with a live event log, question cards that render agent replies as markdown, and candidate previews. |
| Desktop app | `smasher-desktop`: a macOS Tauri app that runs the server in-process on loopback only. Settings are stored in the macOS Keychain. |
| More providers | A `claude-cli` provider that runs codergen through `claude -p` (no API key needed), plus Ollama, alongside OpenAI, Anthropic and Gemini. |
| Artifact handling | An artifact store for candidate bundles, plus `smasher archive` and `smasher prune-artifacts`. |
| CI | Rust checks, plus a Frontend job that runs the SPA's check, lint, build, Vitest and Playwright suites against a fake `claude` so no tokens are spent. |
| Conformance | `smasher-conformance` bridges the crates to the AttractorBench contract (see [`docs/parity-matrix.md`](docs/parity-matrix.md)). |

The [backlog](tasks/BACKLOG.md) lists open work. Finished specs and plans are in
[`tasks/archive/`](tasks/archive/).

## Crates

Ten crates. The first six form the core stack, bottom to top. The last four are the design-factory
evaluation toolchain, consumed as pipeline tools and handlers rather than as dependencies of the core.

| Crate | What it does |
|-------|-------------|
| `smasher-llm` | Talks to OpenAI, Anthropic and Gemini through one client. Handles streaming, retries, the usual. |
| `smasher-agent` | Agent loop with tools (read, write, edit, shell, grep, glob, apply_patch). Steering rules, subagents, sandboxed execution. |
| `smasher-attractor` | The graph engine. Parses DOT, resolves node types from shapes, dispatches handlers, runs the pipeline. |
| `smasher-cli` | `smasher complete`, `chat`, `run`, `resume`, `render`, `serve`, `ingest`, `archive`, `lint`, `prune-artifacts`. |
| `smasher-web` | JSON+SSE API on port 21541 (submit, live event stream, human-gate Q&A, candidate tracking). Serves the SPA build at `/`. |
| `smasher-desktop` | macOS Tauri app: runs `smasher-web` in-process on loopback and opens the dashboard in a native window. See [Desktop App](docs/quickstart.md#desktop-app-macos). |
| `smasher-system-lint` | Deterministic design-system conformance checks for candidates. |
| `smasher-render-capture` | Headless Chromium screenshot capture (via CDP) of a candidate served locally. |
| `smasher-task-critic-synthesis` | Vision-model usability critique (`task_critic`) and recommendation synthesis (`synthesis`). One real LLM call each, no agent loop. |
| `smasher-conformance` | Adapter CLI bridging the crates to the AttractorBench test contract. |

## Setup

You need Rust 1.85+ and at least one API key. Node is also needed if you want to build the SPA.

```bash
git clone https://github.com/humanator/smasher.git
cd smasher
cargo build --release
```

Set a provider key (any one works, or set all three):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=...
```

Or drop them in a `.env` file at the repo root.

No API key? If Claude Code is installed and logged in, run everything through `claude -p`:

```bash
export SMASHER_CLAUDE_CLI=1 SMASHER_PROVIDER=claude-cli
```

See the [config reference](docs/config-reference.md#claude-cli-provider) for details.

## Usage

### Run the design factory

```bash
smasher run examples/product_design_factory.dot \
  --var brief="A dashboard for tracking home energy usage, aimed at non-technical homeowners"
```

The pipeline asks clarifying questions, builds candidates from the kit, runs the critics, and pauses at
gallery gates for your pick. It's easiest to drive from the dashboard (below), where the gates render
as a gallery.

### Web dashboard

```bash
smasher serve
# opens on http://127.0.0.1:21541
```

Browse and edit workflows, launch runs, watch events arrive over SSE, preview candidates, and answer
human gates and gallery gates in the browser. On macOS, `make desktop-dev` and `make desktop-build`
wrap the same dashboard in a native app.

### One-shot completion and chat

```bash
smasher complete "explain quicksort in three sentences"
smasher complete "explain quicksort" --json  # full response object
smasher chat                                 # REPL with the agent's file and shell tools
```

### Run any pipeline

```bash
smasher run examples/old-examples/hello-world.dot
smasher run examples/old-examples/conditional.dot --var route=yes
smasher run examples/old-examples/multi-step.dot --var model=claude-sonnet-5
```

Pipelines are standard DOT digraphs. Node shapes tell the engine what each node does:

- `circle` / `point` / `Mdiamond` = start
- `doublecircle` / `Msquare` = exit
- `box` / `rectangle` = codergen (runs an LLM agent, and the default when `shape` is omitted)
- `diamond` = conditional (branches on variables)
- `hexagon` / `oval` / `ellipse` = interviewer (asks a human, captures the response; a hexagon with
  `gallery="true"` is a gallery gate)
- `parallelogram` = tool
- `component` = parallel fan-out
- `tripleoctagon` = fan-in (joins parallel branches)
- `house` = manager (coordinator that delegates to a manager backend)
- `folder` = sub-pipeline (nested DOT file)

See [`examples/`](examples/) for working pipelines and [`docs/dot-reference.md`](docs/dot-reference.md)
for the full spec.

## Development

```bash
cargo check --workspace
cargo test --workspace       # ~2,700 tests
cargo clippy --workspace -- -D warnings
cargo fmt --all
```

There's a `Makefile` with shortcuts (`make ci` runs what CI runs). The SPA lives in `frontend/`; see its
[README](frontend/README.md) and "Frontend Tests and CI" in [the quickstart](docs/quickstart.md). Its
Vitest suite expects a server on `127.0.0.1:21541`, and the backlog explains how to start one without
spending tokens.

## Project structure

```
crates/                 # The ten crates above
frontend/               # Svelte 5 SPA served by smasher-web
design-kit/             # Component kit that design-factory candidates are composed from
docs/                   # Reference docs, quickstart guide
examples/               # Sample DOT pipelines, including product_design_factory.dot
skills/                 # Agent skills (e.g. english-to-dotfile)
tasks/                  # Vision, backlog, and archived specs and plans
scripts/                # CI helpers
```

## Docs

- [Quickstart](docs/quickstart.md)
- [API reference](docs/api-reference.md)
- [DOT reference](docs/dot-reference.md)
- [Handler reference](docs/handler-reference.md)
- [CLI reference](docs/cli-reference.md)
- [Config reference](docs/config-reference.md)
- [Vision](tasks/Vision.md)
- [Backlog](tasks/BACKLOG.md)

## License

See [LICENSE](LICENSE) for details.
