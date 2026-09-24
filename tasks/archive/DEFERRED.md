# Deferred Decisions and Open Questions

Single consolidated list of everything genuinely still open across the design-factory
modules, as of 2026-09-17. All nine modules in `capability-map.md` are `Done` — every
item below is deliberately parked design debt ("grow as demanded," "decide when a
pipeline needs it"), not oversight or unfinished work. Each module's own
`SPEC-<module-id>.md` still carries its full "Open Questions" section with reasoning
and context; this file exists so there's one place to scan instead of nine.

A number of items that used to live in these per-spec sections have since been
resolved by later modules but never marked as such in the original doc — those were
found and struck through in place (with evidence) during this consolidation pass
rather than copied here. See each spec's own Open Questions section if you want the
resolution evidence for a specific past question.

## Cross-cutting

- **Hardcoded dated model strings should move to alias-based resolution.**
  `TASK_CRITIC_MODEL`/`SYNTHESIS_MODEL` (`claude-sonnet-4-20250514`,
  `claude-3-5-haiku-20241022`) are hardcoded in `smasher-cli/src/run.rs` and
  `smasher-web/src/routes/{api.rs,pages.rs}` (duplicated 3x), and
  `smasher-web/src/server.rs`'s `ServerConfig::default()` hardcodes the same dated
  Sonnet string as the pipeline-wide default. These go stale as Anthropic ships new
  snapshots. Blocked on confirming whether the raw Anthropic Messages API accepts
  bare aliases (`sonnet`/`opus`/`haiku`/`fable`) before treating this as a drop-in
  swap — that alias-resolution mechanism is documented for the `claude` CLI/Agent SDK
  layer, not confirmed for a raw API call. Not urgent, no pipeline currently blocked
  on it. (Source: `capability-map.md`, `tasks/archive/plan-gallery-gate.md`.)

## `component-kit`

- Whether the kit eventually needs a `select`/`checkbox`/`tabs` component — deferred
  until a pipeline run actually asks for one, per "grow as demanded."
  (Source: `SPEC-component-kit.md`.)

## `render-capture`

- Whether CI gets a Chromium install step for the integration test, or it stays
  local-only — genuinely undecided. `.github/workflows/ci.yml` has no
  Chromium/Playwright step today, so the de facto answer is "local-only," but that
  was never a deliberate decision. (Source: `SPEC-render-capture.md`.)
- Where `candidate_id` comes from at pipeline-authoring time — answered in practice
  (the shipped `product_design_factory.dot` hardcodes `discover-a`..`discover-d`) but
  never formalized as a documented convention for future pipeline authors.
  (Source: `SPEC-render-capture.md`.)

## `system-lint`

- Whether `kit-component-usage` rules need to grow beyond the four current patterns
  (button/input/dialog/list-row) as more kit components are added — deferred, same
  "grow as demanded" principle. (Source: `SPEC-system-lint.md`.)

## `gallery-view`

- Click-to-expand / full-size view for a candidate card — not implemented. Cards show
  a fixed-size embed only (`.candidate-thumbnail`, 100% × 667px); even after
  `live-preview` upgraded the card to a live `<iframe>`, no lightbox/expand
  interaction was added. Deferred to whoever wants a full-size inspection view.
  (Source: `SPEC-gallery-view.md`.)

## `gallery-gate`

- **Parallel gates undefined.** Two gallery questions pending on one run at once has
  no defined behavior beyond "oldest first" — the single-queue engine would need a
  node-id→question mapping first. Deferred until a pipeline actually needs it.
  (Source: `SPEC-gallery-gate.md`, `capability-map.md`.)

## `task-critic-synthesis`

- Multi-candidate fan-out (N Discover candidates each getting their own
  `task_critic`/`synthesis` call from one DOT authoring) — no mechanism exists yet;
  deferred until a real multi-candidate pipeline is authored.
  (Source: `SPEC-task-critic-synthesis.md`.)
- Whether `synthesis`'s reconciliation logic needs a deterministic override (e.g. a
  failing `lint-report.json` always forcing `iterate` regardless of what the model's
  own JSON says) — left to observed behavior once more real runs exist.
  (Source: `SPEC-task-critic-synthesis.md`.)

## `artifact-store`

- Whether/when auto-pruning gets wired into `smasher run`/`smasher serve` startup,
  and what default policy it should ship with — deferred.
  (Source: `SPEC-artifact-store.md`.)
- Interaction-recording capture (video/gif) — the `Recording` `ArtifactKind` variant
  is reserved but nothing produces one; no module currently owns building this.
  (Source: `SPEC-artifact-store.md`.)
- Whether bundle persistence should be skippable per-candidate (an opt-out arg for
  pipelines that don't want the extra disk cost) — no current caller needs this.
  (Source: `SPEC-artifact-store.md`.)

## `live-preview`

- `generation_params`'s shape beyond free-text key/value pairs (currently a
  free-form string map, e.g. `{"prompt": "...", "persona": "..."}`) — e.g. whether it
  should eventually mirror `task_critic`'s own `persona`/`task` argument shape for
  consistency — left to whoever authors the first pipeline that populates it in
  earnest. (Source: `SPEC-live-preview.md`.)

## `workflow-editor`

- Whether the raw-DOT-paste fallback form (`/workflows/new/raw`) stays
  permanently as a power-user escape hatch or is retired once the visual
  editor is proven out — left for a later cleanup pass, not decided.
  (Source: `SPEC-workflow-editor.md` Open Questions.)
- Whether the run-view's static SVG (`render_to_dot_with_status`) could reuse
  the editor's saved `pos` layout instead of re-auto-laying-out via Graphviz
  every time — a possible nice-to-have, not required for this module's
  success criteria, not attempted. (Source: `SPEC-workflow-editor.md` Open
  Questions.)
