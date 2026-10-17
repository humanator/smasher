# Spec: multi-candidate critique and the lint override

Backlog batch #7, #8 and #11 (P3, design-factory features). Built 2026-10-13.

## Problem

- #7: `task_critic` and `synthesis` take one `candidate_id`, so critiquing the
  four Discover candidates means eight tool nodes.
- #8: `synthesis` always trusts the model. A candidate with failing
  `system_lint` checks can still come back `proceed`.
- #11: nothing tells a pipeline author where `candidate_id` values come from.
  `examples/product_design_factory.dot` hardcodes `discover-a`..`d`.

## Decisions

**`candidate_id` convention.** A candidate id is a name the pipeline author
picks. `render_capture` writes the candidate's artifacts to
`<run artifacts>/<candidate_id>/`, and every later tool (`system_lint`,
`task_critic`, `synthesis`) and the gallery read from that same directory.
Ids must be non-empty and contain no `/`, `\` or `..` (the gallery's existing
`valid_id` rule). No auto-discovery: the author lists ids explicitly, which
keeps a node's behaviour visible in the DOT file.

**#7: `candidate_ids`.** `task_critic` and `synthesis` accept
`candidate_ids: [string, ...]` as an alternative to `candidate_id`.

- Setting both, an empty list, a non-string entry, a duplicate, or an invalid
  id fails the node before any LLM call.
- Each candidate gets its own LLM call (run concurrently) and its own report
  file in its own directory, exactly as the single-candidate form writes it.
  `persona`, `task`, `model` and `provider` apply to every candidate.
- Success data: `{"candidates": [{"candidate_id", "artifact_dir", "report"}]}`.
  `synthesis` also lists `"proceed": [ids]` and `"iterate": [ids]`.
- If any candidate fails, the node fails with one message naming each failed
  candidate. Reports for the candidates that succeeded are still written.
- The single `candidate_id` form is unchanged.

**#8: `lint_must_pass`.** `synthesis` accepts `lint_must_pass: true`
(default `false`, so existing pipelines behave the same). When set and
`lint-report.json` has any check with `"passed": false`, or can't be read as
a lint report, the recommendation becomes `iterate` whatever the model said.
When that changes the model's answer, a first reason is added naming the
failed checks. The report file keeps its existing shape.

**#11: docs.** A "Candidate ids" section in `docs/handler-reference.md`
covering the convention above, plus the new arguments.

## Out of scope

- Teaching conditions to read nested `_tool_<id>` values (backlog #36 area).
- Auto-discovering candidates from the artifacts directory.
- Changing `examples/product_design_factory.dot`, which only critiques one
  candidate.
