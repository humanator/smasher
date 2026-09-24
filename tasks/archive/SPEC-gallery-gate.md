# Spec: `gallery-gate` — Blocking Visual Selection Gate

Module id: `gallery-gate` (see `capability-map.md`). Depends on: `gallery-view`
(done). Fifth build slice per the capability map's build order, after
`component-kit`, `render-capture`, `system-lint`, and `gallery-view`.

## Objective

Turn the read-only candidate gallery into a blocking human gate: the pipeline
pauses at a gate node, the dashboard shows every captured candidate with a
selection UI, the human picks one, several, or none, and the pipeline resumes
on the chosen branch. This is the "semi" in semi-dark — everything between
gates runs unattended; direction is decided by a human reacting to real,
clickable candidates, not by an aesthetic score.

Who uses it:
- **A human deciding direction** — the primary consumer. Opens `/runs/{id}` while
  the run is paused at a gate, compares candidates side by side, checks zero or
  more candidates, picks the outgoing edge (proceed / iterate / re-roll), and
  submits. Downstream nodes read the selected candidate ids from pipeline
  context.
- **`task-critic-synthesis`** (later module), which will attach its
  recommendation to this same gate UI rather than building a second one.
- **`decision-history`** (later module), which will consume the structured
  decision this module stores in context as its log source.

Success looks like: run a pipeline containing `render_capture` nodes followed
by a gallery gate node, watch it pause, open `/runs/{id}` in a browser, check
two candidates, press the "proceed" edge button, and watch the pipeline resume
down the `proceed` edge with both selected ids visible in context — with zero
LLM calls made by the gate itself.

## Assumptions

Five decisions anchor this spec; everything else fills in underneath them.
Decisions 1, 3, 4, 5 were confirmed with the user before drafting.

1. **Reuse `HumanGateHandler` + `HttpInterviewer`, no new handler, no new DOT
   node type, no DOT format change.** The engine already pauses on a question
   and resumes on an answer (`crates/smasher-attractor/src/interviewer.rs`,
   `http_interviewer.rs`); the existing questions API already delivers answers.
   This module adds a visual answer UI plus one validated decision endpoint in
   `smasher-web`, and one minimal additive JSON extraction in
   `HumanGateHandler` (assumption 3). No changes to the DOT parser,
   `Handler`/`ToolBackend` traits, `QuestionQueue`, or the existing
   `/api/runs/{id}/questions` routes.
2. **Authoring convention: a gate is an Interviewer node (shape `hexagon`,
   `oval`, or `ellipse`) carrying a `gallery="true"` attribute** — plus
   `question`/`prompt`/`label` exactly as `HumanGateHandler` reads today, plus
   `candidate_count` per assumption 5. It is explicitly *not*
   `shape=diamond`: `node_type_from_shape` in
   `crates/smasher-attractor/src/graph/mod.rs` maps `diamond` to
   `NodeType::Conditional`, which `HumanGateHandler::handles` never matches —
   so the `shape=diamond` `GalleryGate` nodes in `smasher-design-factory.md`
   §4's example pipeline would not pause as drawn. This spec supersedes that
   example: same node ids and edges, Interviewer shape, `gallery="true"` added.
   ```dot
   GalleryGate1 [shape=hexagon, label="Human: pick direction(s)",
                 gallery="true", candidate_count="phase_default(discover)"];
   ```
3. **The answer is a canonical JSON string delivered through the existing
   answer path.** The dashboard POSTs `{"answer": "<json>"}` to the existing
   per-question answer endpoint (via the new validated wrapper in assumption
   4), so `HttpInterviewer` and `QuestionQueue` are untouched. The one engine
   addition: `HumanGateHandler` detects a structured answer of the form
   `{"selected": [<candidate-id>], "decision": "<edge-label>"}` — stores the
   parsed object (not the raw string) in context under the node id, and uses
   `decision` (not the whole JSON blob) as the outcome's `preferred_label`, so
   existing edge routing (`edge.rs` preferred-label match, case-insensitive)
   follows the human's chosen edge. Anything that does not parse as that shape
   behaves exactly as today (raw string stored, whole string as
   `preferred_label`). Timeout + `human.default_choice` behavior is unchanged
   and bypasses selection validation — documented limitation, see Open
   Questions.
4. **The dashboard finds the gate by graph scan, and validates before
   answering.** `run_questions` locates the first Interviewer node with
   `gallery="true"` in `record.graph`; when that node exists *and* pending
   questions are non-empty *and* `scan_candidates` is non-empty, it renders the
   new `gallery_gate.html` card targeting the oldest pending question,
   alongside (not instead of) the existing plain question cards. A new
   `POST /api/runs/{id}/gallery/{qid}/decision` endpoint accepts
   `{"selected": [...], "decision": "..."}`, validates (run exists, `qid`
   pending, `decision` non-empty, every selected id passes `valid_id` and
   matches a successfully captured candidate — failed captures render without
   a checkbox and are rejected), then forwards the canonical JSON string via
   the existing `record.interviewer.answer_question()`. One gate at a time per
   run; parallel gates are out of scope (matching the single-queue engine
   semantics).
5. **`candidate_count` is display + warning, not enforcement.** The gate node's
   attr accepts an integer literal (`candidate_count="3"`) or
   `candidate_count="phase_default(<phase>)"` with phase defaults
   `discover=4`, `define=2`, `deliver=1` (per `smasher-design-factory.md`
   §3.4: 3–4 at Discover, 1–2 at Define, essentially one at Deliver). A
   `candidates=N` launch variable (via `submit_run`'s existing `vars` parsing,
   which already lands in `record.variables` and pipeline context) overrides
   both. The gate card shows "Expected N, found M" when they differ; it never
   blocks on the mismatch, and it does not dictate how many candidates
   upstream builder nodes produce — upstream authors read the same
   `candidates` variable by pipeline-authoring convention.

**Amendment (2026-09-14):** two more decisions, both confirmed self-contained to
this module's own files (grounded by reading the current
`crates/smasher-attractor/src/interviewer.rs` and
`crates/smasher-web/templates/gallery_gate.html`, not guessed). The other three
2026-09-13 decisions this module originally tracked (live embeddable preview,
prompt/parameter traceability, phase-based prompt split) turned out to belong
elsewhere — see `capability-map.md`'s `live-preview` module and
`smasher-design-factory.md` §3.6.

6. **Remove `human.timeout_secs`/`human.default_choice` entirely from
   `InterviewerHandler`**, rather than validate the bypass. Concretely: delete
   the `timeout`/`default_choice` fields from `InterviewerHandler` and
   `InterviewerHandlerBuilder`, the `.timeout()`/`.default_choice()` builder
   methods, `resolve_timeout()`/`resolve_default_choice()`, the
   `human.timeout_secs`/`human.default_choice` node-attr reads, and the
   `tokio::time::timeout(...)` wrapping around `self.interviewer.ask(...)` in
   the free-form branch of `execute()` — that branch always awaits the
   interviewer directly now, the same as the `approve`/`options` branches
   already do. The `Err(InterviewerError::Timeout) => { ...default_choice... }`
   match arm is deleted too, not replaced — a bare `InterviewerError::Timeout`
   surfacing from `execute()` (only possible if the configured `Interviewer`
   impl is itself a `TimeoutInterviewer`, an unrelated generic decorator not in
   scope here) now falls through to the ordinary `Err(e) => Ok(Outcome::failure(...))`
   arm like any other interviewer error, with no default-choice substitution.
   `InterviewerError::Timeout` the enum variant is **not** removed —
   `TimeoutInterviewer` and other call sites still produce it; only
   `InterviewerHandler`'s own special-cased handling of it goes away. No
   production call site (`smasher-cli`, `smasher-web`) constructs
   `InterviewerHandler` via `.timeout(...)`/`.default_choice(...)` today — those
   builder methods are only exercised by this module's own now-deleted unit
   tests — so this is a pure removal with zero production behavior change
   beyond the node-attr path. A `.dot` pipeline that still sets
   `human.timeout_secs`/`human.default_choice` on a node simply gets those
   attrs ignored (unknown node attrs are not rejected by the parser), same as
   any other unrecognized attribute.
7. **Lint badge becomes a dot by default, expandable on click to the full
   violation breakdown** — scoped to the `lint_passed()`/`lint_violations()`
   block in `gallery_gate.html` only; the adjacent critic/synthesis scorecard
   blocks (`critic_success()`, `synthesis_recommendation_label()`) are a
   different, already-shipped recommendation shape and are out of scope for
   this decision. Implementation is template/CSS only, no Rust change — the
   data (`lint_passed`, `lint_violations`) is already there. Wrap the existing
   badge + violation list in a native `<details>`/`<summary>` element: the dot
   (colored via `.lint-dot-pass`/`.lint-dot-fail`) lives in `<summary>` and is
   always visible; the violation list is `<details>`'s collapsible content,
   shown on click — native disclosure behavior, no new JS or dependency. A
   CSS-only hover reveal (showing the content on `:hover`/`:focus-within`
   without toggling the `open` attribute) is worth attempting for the "hover"
   half of `Vision.md`'s "click/hover" wording, but isn't load-bearing for this
   decision — click-to-expand alone satisfies "dot by default, expandable to
   the full violation breakdown"; verify the hover CSS actually reveals content
   in a real browser before relying on it (`<details>` content visibility rules
   vary enough across engines that this needs a live check, not an assumption).

→ Correct any of these now or I'll proceed with them.

**Amendment (2026-09-18):** four more decisions, confirmed with Jobsworth
before drafting. Grounded by reading the current
`crates/smasher-attractor/src/interviewer.rs` (`GalleryAnswer`,
`parse_gallery_answer`, the `HumanGateHandler::execute` free-form branch),
`crates/smasher-web/src/routes/pages.rs` (`run_questions`,
`QuestionCardTemplate`, `GalleryGateTemplate`), `crates/smasher-web/src/routes/gallery.rs`
(`GateDecision`, `validate_decision`), `crates/smasher-web/src/decision_history.rs`
(`GalleryDecision`, `gallery_decisions`), and `crates/smasher-web/templates/`
(`gallery_gate.html`, `question_card.html`, `_candidate_card.html`,
`decision_history.html`) — not guessed. Trigger: today the gate card only lets
the human check candidates and pick an edge; there is no way to attach
instructions to a candidate to drive the next iteration, the same underlying
question also renders a redundant free-text box beneath the gate card, and a
live-preview candidate's embedded flow has no way back to its start once
stepped through to the end.

8. **Every candidate gets its own optional comment textarea, always visible
   regardless of checkbox state.** Rationale confirmed with Jobsworth: the
   real use case is critiquing a candidate the human did *not* check ("close,
   but the spacing is off") as much as annotating one they did — gating the
   field behind the checkbox would block exactly the iteration-driving
   feedback this decision exists for. Field is optional; an empty textarea
   contributes nothing to the payload (trimmed-empty comments are dropped
   client-side and rejected server-side the same way, see decision 9). A
   4000-character cap per comment is enforced server-side only (not
   client-`maxlength`-restricted, so paste-and-edit isn't silently truncated
   mid-keystroke) — a sane default to keep pipeline-context JSON bounded;
   `validate_decision` rejects an over-length comment with the candidate id
   named in the error, same shape as an unknown-id rejection. → Correct the
   4000 figure now if a different bound is wanted.
9. **The canonical JSON answer gains a `comments` object, keyed by candidate
   id, additive and backward-compatible.** `GalleryAnswer` (`interviewer.rs`)
   gains `#[serde(default)] pub comments: std::collections::HashMap<String, String>`
   — `#[serde(default)]` so every existing test fixture and any answer already
   in flight without the field keeps parsing identically.
   `HumanGateHandler::execute`'s free-form branch stores and returns
   `json!({"selected": gallery.selected, "decision": decision, "comments": gallery.comments})`
   instead of the current two-key object — `comments` is always present (an
   empty `{}` when nothing was written), matching this module's existing
   convention that `selected` is always present even when empty. `preferred_label`
   is unaffected (still `decision` alone). `GateDecision`/`GateDecisionRequest`
   (`routes/gallery.rs`) gain the matching `#[serde(default)] comments: HashMap<String, String>`
   field. `validate_decision` gains: every key in `comments` must pass
   `valid_id` and match a known, non-failed candidate (same rule already
   applied to `selected` — comments are not restricted to selected candidates
   per decision 8); every value, trimmed, must be ≤4000 chars; a trimmed-empty
   value is dropped from the map before it reaches the canonical JSON (so a
   human who typed and then deleted a comment doesn't persist an empty string
   forever). The output JSON's `comments` values are the trimmed strings, not
   the raw textarea contents.
10. **`decision-history` displays comments alongside the existing candidate
    list.** `GalleryDecision` (`decision_history.rs`) gains
    `pub comments: std::collections::HashMap<String, String>`, populated from
    the same `data.get("comments")` the JSON now carries (defaulted to empty
    when absent, so history entries recorded before this change still parse —
    `gallery_decisions` must not fail on an old event missing the key).
    `TemplateDecision` (`pages.rs`) gains a template-friendly
    `comments: Vec<(String, String)>` (candidate id, comment), built with a
    stable order (sorted by candidate id) so re-renders don't jitter.
    `decision_history.html` renders it as a nested list under the existing
    `.decision-candidates` line, only when non-empty — a decision with no
    comments looks exactly as it does today, byte-for-byte.
11. **A reload button on every live-preview candidate card resets the
    embedded iframe to its start, independent of everything above.** Reported
    problem: `_candidate_card.html`'s `live_card` macro renders
    `<iframe src="{{ bundle }}" sandbox="allow-scripts" ...>` for any
    candidate with a `bundle_url`; a human stepping through a multi-step flow
    inside that iframe has no way back to step one short of reloading the
    whole dashboard page (which would also drop any in-progress gate
    selections/comments on other cards). Fix, scoped to the macro only:
    capture the bundle URL in a `data-src` attribute at render time and add a
    small reload control that does
    `iframe.removeAttribute('src'); iframe.src = iframe.dataset.src;` on
    click — a parent-frame DOM mutation, not a `contentWindow` call, so it
    works regardless of the `sandbox` attribute's lack of `allow-same-origin`
    (reading or calling into a sandboxed cross-origin `contentWindow` would
    throw; reassigning the parent's own `src` attribute never touches the
    child's origin). No button renders for the static-`<img>` fallback branch
    — there is nothing to reset. This is the only decision in this amendment
    that touches a file `gallery-gate` doesn't own outright: `_candidate_card.html`
    is shared with `gallery-view`'s `candidate_gallery.html` per the
    `live-preview` module (`SPEC-live-preview.md`), so both the gate card and
    the read-only gallery view get the reload button — deliberate, since the
    macro's existing public contract (parameters, the `bundle_url`/`screenshot_url`
    conditional) is unchanged, only markup is added inside it. No change to
    `SPEC-live-preview.md` itself; noted here for cross-reference.
12. **Suppress the duplicate plain question card for the gate's own pending
    question, but only when the gate card actually rendered.** Today
    `run_questions` (`pages.rs`) passes every pending question — including the
    gallery gate's own underlying `HumanGateHandler` question — into
    `QuestionCardTemplate.questions`, so `question_card.html` renders both the
    gate card (`gallery_gate_html`) *and* a plain free-text
    `answer-input-{{ q.id }}` box for that same question underneath it. Fix:
    after computing `gallery_gate_html`, if it resolved to `Some(_)`, drop the
    entry whose id equals `gallery_question_id` from `questions` before
    building `QuestionCardTemplate`. If the gate card failed to render for any
    reason (template error, no candidates found — the existing
    `gallery_gate_html: None` paths already covered by this module's tests),
    the plain card must still show — a paused run must never end up with zero
    way to answer, so the filter is keyed off the *rendered* `Option`, not off
    "is this node gallery-shaped." Any other genuinely non-gallery pending
    question (a different node, or a second gate not currently holding a
    pending question) is untouched and still renders as a plain card exactly
    as today — this only removes the one redundant box for the one question
    the visible gate card already answers.

→ Correct any of these now or I'll proceed with them.

## Tech Stack

- Rust, existing crates `smasher-attractor` (one additive fn in
  `interviewer.rs`) and `smasher-web` (one new route file + template + CSS) —
  no new workspace member, following `gallery-view`'s precedent of extending
  the dashboard crate.
- `askama` (already a dependency) for the new gate partial template.
- `serde_json` (already a dependency) for answer parsing/composition on both
  sides.
- Reuses `candidates::scan_candidates` / `valid_id` directly — no new
  discovery or filesystem contract (same provisional `./runs/<run_id>/`
  read path as `gallery-view`; reconciling the two artifact trees stays
  `artifact-store`'s job).

Amendment (2026-09-18): no new dependency. `std::collections::HashMap` and
`serde`'s `#[serde(default)]` (both already used elsewhere in these same
files) cover the `comments` field; the reload button is plain inline JS
matching the existing decision-bar script's style, no new JS dependency.

## Commands

```bash
# Build and test the touched crates in isolation
cargo check -p smasher-attractor -p smasher-web
cargo test -p smasher-attractor interviewer
cargo test -p smasher-web
cargo clippy -p smasher-attractor -p smasher-web

# Whole-workspace regression check
cargo test --workspace
cargo clippy --workspace

# Manual verification
smasher serve
# in another terminal: run a fixture pipeline with render_capture nodes
# followed by a gallery gate node, then open http://127.0.0.1:21541/runs/{id},
# select candidates, pick an edge button, and confirm the run resumes
```

## Project Structure

```
crates/smasher-attractor/src/
  interviewer.rs          # touched: parse_gallery_answer() + HumanGateHandler
                           #      structured-answer branch (legacy path unchanged)
                           # amendment: timeout/default_choice fields, builder
                           #      methods, resolve_*() fns, node-attr reads, and
                           #      the six associated unit tests deleted

crates/smasher-web/src/
  routes/gallery.rs        # new: POST /api/runs/{id}/gallery/{qid}/decision —
                           #      selection validation, canonical JSON compose,
                           #      forward via interviewer.answer_question()
  routes/pages.rs           # touched: run_questions renders gate card (gallery node
                           #          lookup, candidate_count resolve, outgoing edge
                           #          labels as decision buttons)
  routes/mod.rs             # touched: register gallery router (questions.rs pattern)
  candidates.rs             # touched only if a shared selected-id validator is needed;
                           #      otherwise reused unchanged

crates/smasher-web/templates/
  gallery_gate.html         # new: candidate checkboxes + expected/found hint +
                           #      lint badge slot + edge-label decision buttons +
                           #      click-to-expand (anchor to screenshot_url)
                           # amendment: lint badge block wrapped in <details>/
                           #      <summary>, dot-only by default
  question_card.html        # unchanged: plain cards still render underneath

crates/smasher-web/static/
  style.css                 # touched: .gate-card, .gate-candidate-selected,
                           # .gate-decision-bar styles
                           # amendment: .lint-badge, .lint-dot(-pass|-fail),
                           # :hover/:focus-within reveal on .lint-badge

docs/design-factory/
  SPEC-gallery-gate.md      # this file
  capability-map.md         # touched: gallery-gate status Done when complete
```

Amendment (2026-09-18):

```
crates/smasher-attractor/src/
  interviewer.rs            # touched: GalleryAnswer gains `comments` field
                           #      (#[serde(default)]); HumanGateHandler's
                           #      free-form branch stores/returns the 3-key
                           #      object instead of 2

crates/smasher-web/src/
  routes/gallery.rs         # touched: GateDecision/GateDecisionRequest gain
                           #      `comments`; validate_decision validates
                           #      comment candidate ids + length, drops
                           #      trimmed-empty entries
  routes/pages.rs            # touched: run_questions filters the gate's own
                           #      question out of `questions` once
                           #      gallery_gate_html is Some
  decision_history.rs        # touched: GalleryDecision gains `comments`;
                           #      gallery_decisions() defaults it from
                           #      possibly-missing JSON key

crates/smasher-web/templates/
  gallery_gate.html          # touched: per-candidate <textarea name="comment">
  question_card.html         # touched: no longer receives the gate's own
                           #      question in `questions` when the gate
                           #      card rendered (logic lives in pages.rs;
                           #      template itself is unchanged markup)
  _candidate_card.html       # touched: live_card macro gains data-src +
                           #      reload control on the iframe branch only
  decision_history.html      # touched: renders `d.comments` nested list
                           #      when non-empty

crates/smasher-web/static/
  style.css                  # touched: .candidate-comment textarea styling,
                           #      .candidate-reload-btn overlay position
```

## Code Style

Matching the established shapes — additive handler branch with legacy fallback,
thin route handler delegating to a pure validation fn (same split as
`candidates.rs` scan vs. route):

```rust
// ABOUTME: Structured gallery-gate answer parsing for HumanGateHandler.
// ABOUTME: Legacy plain-string answers pass through unchanged.

// crates/smasher-attractor/src/interviewer.rs
#[derive(Debug, serde::Deserialize)]
struct GalleryAnswer {
    selected: Vec<String>,
    decision: String,
}

fn parse_gallery_answer(response: &str) -> Option<GalleryAnswer> {
    let answer: GalleryAnswer = serde_json::from_str(response).ok()?;
    if answer.decision.trim().is_empty() {
        return None;
    }
    Some(answer)
}
```

```rust
// crates/smasher-web/src/routes/gallery.rs
pub struct GateDecision {
    pub selected: Vec<String>,
    pub decision: String,
}

/// Pure validation: no AppState, no queue — unit-testable against fixture dirs.
pub fn validate_decision(
    candidates: &[CandidateSummary],
    decision: &GateDecision,
) -> Result<String, String> {
    if decision.decision.trim().is_empty() {
        return Err("decision must name an outgoing edge".into());
    }
    for id in &decision.selected {
        if !crate::candidates::valid_id(id) {
            return Err(format!("invalid candidate id: {id}"));
        }
        match candidates.iter().find(|c| &c.candidate_id == id) {
            Some(c) if !c.failed() => {}
            _ => return Err(format!("unknown or failed candidate: {id}")),
        }
    }
    serde_json::to_string(&serde_json::json!({
        "selected": decision.selected,
        "decision": decision.decision.trim(),
    }))
    .map_err(|e| e.to_string())
}
```

```html
{# gallery_gate.html — checkbox grid over the gallery-view card shape #}
<div class="gate-card" data-question-id="{{ question_id }}">
  <p class="gate-hint">Expected {{ expected_count }}, found {{ candidates.len() }}</p>
  <div class="candidate-grid">
    {% for c in candidates %}
    <label class="candidate-card{% if c.failed() %} candidate-card-failed{% endif %}">
      {% if !c.failed() %}
      <input type="checkbox" name="selected" value="{{ c.candidate_id }}">
      <a href="{{ c.screenshot_url }}" target="_blank">
        <img src="{{ c.screenshot_url }}" alt="Candidate {{ c.candidate_id }}">
      </a>
      {% else %}
      <div class="candidate-failure">Capture failed: {{ c.failure_reason }}</div>
      {% endif %}
      <span class="candidate-id">{{ c.candidate_id }}</span>
      {% if c.lint_passed %} … lint badge … {% endif %}
    </label>
    {% endfor %}
  </div>
  <div class="gate-decision-bar">
    {% for edge in outgoing_edges %}
    <button hx-post="/api/runs/{{ run_id }}/gallery/{{ question_id }}/decision"
        hx-vals='{"decision": "{{ edge }}"}'>{{ edge }}</button>
    {% endfor %}
  </div>
  <p class="gate-note">No boxes checked + an iterate edge = reject-all and re-roll.</p>
</div>
```

Amendment — lint badge, dot by default, click/hover-expandable (replaces the
always-expanded badge block currently in `gallery_gate.html`; the adjacent
critic/synthesis scorecard blocks are unchanged):

```html
{% if let Some(passed) = gc.scorecard.lint_passed() %}
<details class="lint-badge">
  <summary class="lint-dot{% if passed %} lint-dot-pass{% else %} lint-dot-fail{% endif %}"
           title="{% if passed %}lint: pass{% else %}lint: fail{% endif %}"></summary>
  {% if !passed %}
  {% for v in gc.scorecard.lint_violations() %}
  <span class="scorecard-violation">{{ v }}</span>
  {% endfor %}
  {% endif %}
</details>
{% endif %}
```

```css
/* crates/smasher-web/static/style.css — reuses the existing --green/--red
   tokens .scorecard-badge-pass/-fail already draw from, not new ones.
   Click-to-expand is native <details> behavior, no CSS required for that
   part. The :hover/:focus-within rule is the unverified "also expand on
   hover" enhancement — confirm it actually reveals content live before
   counting on it; if it doesn't, click-only still satisfies assumption 7. */
.lint-dot { display: inline-block; width: 0.6em; height: 0.6em; border-radius: 50%; cursor: pointer; }
.lint-dot-pass { background: var(--green); }
.lint-dot-fail { background: var(--red); }
.lint-badge:hover, .lint-badge:focus-within { display: inline-block; }
```

Amendment (2026-09-18) — comments, dedupe, reload button:

```rust
// crates/smasher-attractor/src/interviewer.rs
#[derive(Debug, Clone, PartialEq, serde::Deserialize)]
pub struct GalleryAnswer {
    pub selected: Vec<String>,
    pub decision: String,
    #[serde(default)]
    pub comments: std::collections::HashMap<String, String>,
}
// HumanGateHandler::execute's free-form branch:
//   json!({"selected": gallery.selected, "decision": decision, "comments": gallery.comments})
// replaces the current two-key object; preferred_label unaffected.
```

```rust
// crates/smasher-web/src/routes/gallery.rs
pub struct GateDecision {
    pub selected: Vec<String>,
    pub decision: String,
    pub comments: std::collections::HashMap<String, String>,
}

pub fn validate_decision(
    candidates: &[CandidateSummary],
    decision: &GateDecision,
) -> Result<String, String> {
    let trimmed = decision.decision.trim();
    if trimmed.is_empty() {
        return Err("decision must name an outgoing edge".into());
    }
    for id in &decision.selected {
        validate_candidate_id(candidates, id)?;
    }
    let mut comments = serde_json::Map::new();
    for (id, text) in &decision.comments {
        validate_candidate_id(candidates, id)?;
        let text = text.trim();
        if text.is_empty() {
            continue; // dropped, not stored
        }
        if text.chars().count() > 4000 {
            return Err(format!("comment too long for candidate: {id}"));
        }
        comments.insert(id.clone(), serde_json::Value::String(text.to_string()));
    }
    serde_json::to_string(&serde_json::json!({
        "selected": decision.selected,
        "decision": trimmed,
        "comments": comments,
    }))
    .map_err(|e| e.to_string())
}

fn validate_candidate_id(candidates: &[CandidateSummary], id: &str) -> Result<(), String> {
    if !crate::candidates::valid_id(id) {
        return Err(format!("invalid candidate id: {id}"));
    }
    match candidates.iter().find(|c| &c.candidate_id == id) {
        Some(c) if !c.failed() => Ok(()),
        _ => Err(format!("unknown or failed candidate: {id}")),
    }
}
```

```html
{# gallery_gate.html — per-candidate comment textarea, always visible #}
<label class="candidate-card">
  <input type="checkbox" name="selected" value="{{ gc.summary.candidate_id }}" ...>
  ... existing preview/embed unchanged ...
  <textarea class="candidate-comment" name="comment"
      data-candidate="{{ gc.summary.candidate_id }}"
      placeholder="Notes to drive the next iteration (optional)"></textarea>
</label>
{# submit script: comments = {}; card.querySelectorAll(".candidate-comment")
   .forEach(t => { const v = t.value.trim(); if (v) comments[t.dataset.candidate] = v; });
   body includes comments alongside selected/decision #}
```

```html
{# _candidate_card.html — live_card macro, iframe branch only #}
{% if let Some(bundle) = c.bundle_url %}
<div class="candidate-embed-wrap">
  <iframe src="{{ bundle }}" data-src="{{ bundle }}" title="Candidate {{ c.candidate_id }}"
      sandbox="allow-scripts" class="candidate-thumbnail"></iframe>
  <button type="button" class="candidate-reload-btn" aria-label="Reset preview to start">⟲</button>
</div>
{# reload click handler (event delegation, one listener for the page):
   const frame = btn.previousElementSibling;
   frame.removeAttribute("src");
   frame.src = frame.dataset.src; #}
{% else %}
<img src="{{ c.screenshot_url }}" alt="Candidate {{ c.candidate_id }}" class="candidate-thumbnail">
{% endif %}
```

```html
{# pages.rs run_questions — dedupe, not a template change:
   if gallery_gate_html.is_some() {
       questions.retain(|q| Some(&q.id) != gallery_question_id.as_ref());
   }
#}
```

## Testing Strategy

Per this repo's testing standard: real filesystem fixtures and real queues,
no mocking of the thing under test.

- **Unit (`smasher-attractor`, `interviewer.rs`):** `parse_gallery_answer`
  accepts `{"selected":["a"],"decision":"proceed"}`; rejects `{}` and
  `{"selected":[],"decision":"  "}`; handler stores the parsed object under
  the node id and sets `preferred_label` to `"proceed"`; a legacy plain answer
  (`"yes"`) stores the string and labels identically to today; timeout +
  default path unchanged.
- **Unit (`smasher-web`, `gallery.rs`):** `validate_decision` against a
  two-candidate fixture vec — happy path returns canonical JSON; unknown id,
  failed candidate, traversal id (`../x`), and empty decision each return the
  expected error string.
- **Integration (`routes/gallery.rs`, existing `#[cfg(test)]` axum pattern):**
  POST decision for a run with real fixture artifacts on disk (reuse
  `smasher-render-capture`'s `fixtures/candidate/` output) and a genuinely
  pending `HttpInterviewer` question returns success and unblocks an awaiting
  `ask()` with the canonical JSON; unknown run → 404; unknown `qid` →
  success:false JSON; forged candidate id → 400-class rejection with the
  question left pending.
- **Engine end-to-end (no browser, no LLM):** a fixture `.dot` pipeline with
  `render_capture` nodes into a `gallery="true"` gate with
  `condition="decision=proceed"` / `condition="decision=iterate"` edges —
  answer the pending question with gallery JSON and assert the engine traverses
  the matching edge and the node-id context key holds the `selected` array.
  Zero-LLM proof via the same panic-on-any-request `Client` technique
  `render-capture`'s spec established.
- **Manual:** this session runs the fixture pipeline via `smasher serve`, opens
  `/runs/{id}` in the Browser tool, checks two candidates, submits an edge
  decision, and confirms the run resumes down that edge with the selection in
  context — the same "open it and look at it" bar `gallery-view` set.
- **Regression:** `cargo test --workspace` and `cargo clippy --workspace` stay
  clean; existing `HumanGateHandler` plain-string tests and all dashboard route
  tests pass unchanged.

Amendment — assumptions 6 and 7:

- **Unit (`smasher-attractor`, `interviewer.rs`):** the six timeout/default_choice
  tests (`human_gate_uses_default_choice_on_timeout`,
  `human_gate_timeout_without_default_choice_returns_failure`,
  `human_gate_reads_timeout_secs_from_node_attrs`,
  `human_gate_node_timeout_secs_overrides_handler_timeout`,
  `human_gate_reads_default_choice_from_node_attrs`,
  `human_gate_node_default_choice_overrides_handler_default`) are deleted, not
  adapted — the behavior they proved no longer exists. A new or adapted test
  confirms a node still carrying `human.timeout_secs`/`human.default_choice`
  attrs behaves identically to one without them (attrs silently ignored).
  `TimeoutInterviewer`'s own existing tests are untouched — out of scope.
- **Manual/visual (`gallery_gate.html` lint badge):** this session opens a run
  with both a passing and a failing lint candidate via the Browser tool,
  confirms only a dot shows by default, clicking it reveals the violation list,
  and the critic/synthesis scorecard blocks render exactly as before —
  screenshot both states before calling this decision done.
- **Regression:** `cargo test --workspace` and `cargo clippy --workspace` stay
  clean after the deletions; no other `InterviewerHandler` behavior (approve,
  options, gallery-answer parsing) changes.

Amendment (2026-09-18) — assumptions 8–12:

- **Unit (`smasher-attractor`, `interviewer.rs`):** `GalleryAnswer` deserializes
  `{"selected":["a"],"decision":"proceed","comments":{"a":"tweak spacing"}}`;
  an answer with `comments` omitted still parses (`#[serde(default)]`) and
  produces an empty map; the handler's free-form branch stores and returns
  the three-key object; a legacy plain-string answer is unaffected.
- **Unit (`smasher-web`, `gallery.rs`):** `validate_decision` — a comment on a
  candidate that isn't in `selected` is accepted (decision 8: comments aren't
  selection-gated); a comment keyed to an unknown/failed/traversal id is
  rejected with that id named; a comment over 4000 chars is rejected; a
  whitespace-only comment is silently dropped from the output JSON rather
  than rejected; the happy-path canonical JSON always contains a `comments`
  key (possibly `{}`).
- **Integration (`routes/pages.rs`, existing `run_questions` axum test
  pattern):** a paused run with a rendering gate card no longer contains
  `answer-input-{{ gallery_question_id }}` in the response body, but a second,
  genuinely non-gallery pending question on the same run still does; a run
  where the gate card fails to render (reuse the existing "no candidates"
  fixture) still shows the plain question card for that question, unchanged.
- **Unit (`smasher-web`, `decision_history.rs`):** `gallery_decisions` on a
  fixture event whose `data` includes a `comments` object returns it
  populated on `GalleryDecision`; a fixture event predating this change
  (`data` has only `selected`/`decision`) still parses successfully with
  `comments` defaulted empty — this is the regression case proving old event
  logs don't break.
- **Manual/visual (`gallery_gate.html` comments + reload):** this session opens
  a run with a live-bundle candidate via the Browser tool, types a comment
  into an unchecked candidate's textarea, submits an edge decision, and
  confirms (a) the submitted payload/context contains that comment under the
  right candidate id, (b) `decision_history.html` then shows it, and (c)
  clicking the reload button on a candidate mid-flow returns its iframe to
  the bundle's start screen — screenshot before/after the reload click.
- **Regression:** `cargo test --workspace` and `cargo clippy --workspace` stay
  clean; every pre-amendment test in this file's list still passes unchanged
  (legacy two-key JSON answers, existing gate-card rendering, existing
  decision-history entries with no `comments` key).

## Boundaries

- **Always do:** run `cargo test -p smasher-web` and `cargo clippy --workspace`
  before considering a task done; validate `run_id`/`qid`/every selected id
  before touching the queue or disk; keep the gate zero-LLM; leave failed
  candidates unselectable; keep legacy plain-string gate answers working
  byte-for-byte as today.
- **Ask first:** touching `HumanGateHandler` beyond the additive JSON branch;
  adding a new dependency; changing `candidates::scan_candidates` or
  `manifest::artifact_dir()` (both owned by earlier modules); changing the
  existing questions API instead of adding the parallel decision endpoint.
- **Never do:** implement the decision-history panel (reads this module's
  context records later, separate module); implement `task_critic`/`synthesis`
  recommendations (only reserve the lint-badge slot); enforce candidate counts
  on upstream generation; reconcile the two artifact-directory trees (still
  `artifact-store`'s scope); allow a decision to resume the pipeline on forged
  or failed candidate ids.

Amendment — assumptions 6 and 7:

- **Always do:** delete the six timeout/default_choice unit tests alongside
  the code they test, rather than leaving dead tests around; keep
  `TimeoutInterviewer` and `InterviewerError::Timeout` (the enum variant)
  untouched.
- **Ask first:** touching `TimeoutInterviewer` or any other `Interviewer` impl
  that produces `InterviewerError::Timeout` — this decision only removes
  `InterviewerHandler`'s own node-attr-driven timeout/default resolution;
  changing the critic/synthesis scorecard blocks in `gallery_gate.html`
  (unrelated to the lint-badge decision).
- **Never do:** remove the `InterviewerError::Timeout` enum variant itself;
  change plain (non-gallery) `human_gate` behavior as a side effect of the
  timeout removal.

Amendment (2026-09-18) — assumptions 8–12:

- **Always do:** keep the canonical JSON backward-compatible (`#[serde(default)]`
  on every new field, old events without `comments` still parse); keep the
  plain-question fallback path working when the gate card can't render;
  validate every comment's candidate id exactly as strictly as `selected` ids
  are validated today; only touch the iframe branch of `_candidate_card.html`,
  not the `<img>` fallback.
- **Ask first:** changing the 4000-character comment cap; extending comments
  to feed `task-critic-synthesis` prompts or any other consumer beyond
  pipeline context + decision-history display (that wiring is a separate,
  larger decision about how iteration feedback actually reaches upstream
  generation, not part of this UI-capture amendment); any change to
  `_candidate_card.html` beyond the additive reload control, since it's
  shared with `gallery-view`.
- **Never do:** gate the comment textarea's visibility behind the checkbox;
  drop or truncate a comment silently server-side without surfacing a
  rejection to the human (an over-length comment must error, not get
  silently clipped); remove the plain question card for a genuinely
  non-gallery pending question; call into a sandboxed iframe's
  `contentWindow` to implement the reload (must stay a parent-side `src`
  reassignment).

## Success Criteria

- `cargo test -p smasher-attractor -p smasher-web` passes with zero warnings;
  `cargo clippy --workspace` stays clean.
- A paused run with captured candidates shows the gate card in the Human Input
  section: checkboxes on live candidates, no checkbox on failed ones,
  expected-vs-found count hint, one button per outgoing edge label.
- Submitting a selection + edge resumes the pipeline down the matching edge;
  the node-id context key holds `{"selected": [...], "decision": "..."}`.
- Empty selection + iterate edge resumes down the iterate path (reject-all and
  re-roll) with `"selected": []`.
- A forged/failed/empty decision is rejected with the question left pending —
  the pipeline does not resume on bad input.
- A legacy non-gallery `human_gate` pipeline behaves exactly as before the
  change (plain question cards, plain-string answers).
- No regression to any existing dashboard route, template, or engine test.

Amendment — assumptions 6 and 7 — **done 2026-09-17:**

- [x] `InterviewerHandler`/`InterviewerHandlerBuilder` no longer have
  `timeout`/`default_choice` fields, builder methods, or resolver functions;
  the free-form branch of `execute()` always awaits the interviewer directly.
  `cargo test -p smasher-attractor` passes with zero warnings and the six
  superseded tests are gone, not skipped (replaced with
  `human_gate_builder_creates_basic_handler` and
  `human_gate_ignores_legacy_timeout_and_default_choice_attrs`).
- [x] A node still carrying `human.timeout_secs`/`human.default_choice` attrs
  behaves identically to one without them — unit-tested
  (`human_gate_ignores_legacy_timeout_and_default_choice_attrs`: both attrs set,
  handler returns the interviewer's real response, not the attr values).
- [x] The lint badge in `gallery_gate.html` shows only a colored dot by default;
  clicking it reveals the full violation list from `lint-report.json` via
  `lint_violations()`; the critic/synthesis scorecard blocks are visually
  unchanged. Confirmed live in a browser (real template render, real
  passing/failing lint fixtures, both dots present, collapsed by default;
  `.click()` on the failing dot opens `<details>` and reveals both violation
  strings) — not just template inspection. The CSS-only hover reveal also
  works, confirmed live: `getComputedStyle` on the violation text reports
  `display: block` while `:hover` matches and `<details>` stays closed
  (`open: false`) — the fix needed was removing a `.lint-badge summary { width:
  fit-content }` rule that was unintentionally collapsing `.lint-dot`'s width
  to 0 via higher selector specificity on the same element.
- [x] `cargo test --workspace` and `cargo clippy --workspace` stay clean — same
  pre-existing warnings as before this change, none in the touched files.

Amendment (2026-09-18) — assumptions 8–12 — **implemented 2026-09-18, live
browser verification still pending:**

- [x] Every candidate card in `gallery_gate.html` shows an optional textarea,
  visible regardless of checkbox state; a submitted decision's canonical JSON
  always contains a `comments` object (possibly empty) keyed by candidate id.
  Unit-tested: `validate_decision_happy_path_returns_canonical_json`,
  `validate_decision_allows_empty_selection_for_reject_all`,
  `run_questions_shows_gate_card_for_paused_gallery_run` (textarea markup).
- [x] `validate_decision` rejects a comment on an unknown/failed/traversal
  candidate id and a comment over 4000 chars; accepts a comment on an
  unselected candidate; drops trimmed-empty comments before they reach the
  stored JSON. Unit-tested:
  `validate_decision_accepts_comment_on_unselected_candidate`,
  `validate_decision_rejects_comment_on_forged_id`,
  `validate_decision_rejects_comment_on_unknown_or_failed_id`,
  `validate_decision_rejects_overlong_comment`,
  `validate_decision_drops_whitespace_only_comment`.
- [x] `decision_history.html` displays each decision's comments (candidate id
  + text) when present, and is visually unchanged for decisions with none —
  including pre-amendment decisions already in an event log. Unit-tested:
  `extracts_comments_when_present`,
  `pre_amendment_event_without_comments_key_still_parses`,
  `run_decisions_shows_comments_sorted_by_candidate_id`,
  `run_decisions_lists_recorded_gate_decisions` (regression: no `comments`
  key still renders with no comments block).
- [ ] A paused run's dashboard shows exactly one input surface for the gate's
  own question (the gate card), not also a plain free-text box for the same
  question — verified in the Browser tool, not just by reading the template.
  A second, genuinely non-gallery pending question on the same run still
  renders its plain card. **Implemented and unit-tested**
  (`run_questions_shows_gate_card_for_paused_gallery_run`,
  `run_questions_dedupe_keeps_a_second_genuinely_plain_question`,
  `run_questions_no_gate_card_without_candidates` regression) but not yet
  confirmed live in a browser.
- [x] A live-bundle candidate card has a reload control that returns its
  iframe to the bundle's start screen after the embedded flow has been
  stepped through to its end. Unit-tested
  (`candidate_gallery_template_renders_live_bundle_as_iframe` asserts the
  `data-src` attribute and reload button; the `<img>` fallback path asserts no
  button). **Confirmed live in a browser by Jobsworth 2026-09-18** in
  `gallery_gate.html` — the first implementation had a bug where the click
  bubbled to the `<a target="_blank">` click-to-expand wrapper and opened the
  candidate in a new tab instead of reloading in place; fixed in `b422f51`
  with `evt.preventDefault()`/`stopPropagation()` on the reload click.
  `candidate_gallery.html` shares the same macro/script and has no wrapping
  `<a>` (so was never exposed to that bug) but hasn't had its own independent
  live check.
- [x] `cargo test -p smasher-attractor -p smasher-web` and
  `cargo test --workspace` pass with zero warnings; `cargo clippy --workspace`
  stays clean — same 5 pre-existing `smasher-attractor` warnings as before
  this change (unrelated `sort_by`/`collapsible_match` lints, none in the
  touched files); every pre-amendment test still passes unchanged.

## Open Questions

- Parallel gates (two gallery questions pending on one run) have no defined
  behavior here beyond "oldest first" — deferred until a pipeline actually
  needs one; the single-queue engine would need a node-id→question mapping
  first.
- ~~`human.timeout_secs` / `human.default_choice` on a gallery node resumes with
  a plain-string default, bypassing selection validation — acceptable for this
  slice, but worth a conscious decision before relying on timeouts at gates.~~
  **Decided 2026-09-13 by Jobsworth:** remove `human.timeout_secs` /
  `human.default_choice` entirely rather than validate the bypass.
  **Specified 2026-09-14** as assumption 6. **Implemented and verified
  2026-09-17** — see amendment Success Criteria above.
- ~~The lint-badge slot assumes `lint-report.json` sits beside `manifest.json`
  (per `SPEC-system-lint.md`'s provisional layout); exact badge content
  (pass/fail dot vs. violation counts) is left to implementation, and
  `task-critic-synthesis` may revise what the card shows.~~
  **Decided 2026-09-13 by Jobsworth:** dot by default, expandable on
  click/hover to the full violation breakdown from `lint-report.json`.
  **Specified 2026-09-14** as assumption 7. **Implemented and verified
  2026-09-17** — see amendment Success Criteria above. The hover half of
  "click/hover" turned out to work too (not just click-to-expand), confirmed
  live rather than left as an unverified nice-to-have.
- ~~Live embeddable preview, prompt/parameter traceability, and phase-based
  prompt split~~ **Moved 2026-09-14** to the new `live-preview` module
  (`SPEC-live-preview.md`) and to `smasher-design-factory.md` §3.6
  respectively — see `capability-map.md`.
- ~~Assumption 2's `shape=diamond` correction should propagate back to
  `smasher-design-factory.md` §4's example once this module ships, so the
  example pauses as drawn.~~ **Resolved** — already done: `smasher-design-factory.md`
  lines 119 and 141 use `shape=hexagon, gallery="true"` for both `GalleryGate1` and
  `GalleryGate2`. Confirmed 2026-09-17; this note was just never crossed out.
- **(2026-09-18)** Per-candidate comments are captured and displayed
  (pipeline context + decision-history) but this amendment does not wire them
  into how upstream generation actually incorporates that feedback on an
  `iterate` edge — a pipeline author could read `comments` from context in a
  later node's prompt today, but no node does so yet. Deliberately deferred:
  Jobsworth confirmed "pipeline context only" scope for this pass; revisit
  once a concrete pipeline wants to consume it, likely as a `task-critic-synthesis`
  or new node concern rather than a `gallery-gate` one.
