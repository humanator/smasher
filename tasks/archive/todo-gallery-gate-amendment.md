# Task List: `gallery-gate` — Amendment (2026-09-18)

Full context in `tasks/plan.md`. Spec: `SPEC-gallery-gate.md` (assumptions 8–12,
"not yet started"). Conventions: `smasher/CLAUDE.md` — all files start with two
`ABOUTME:` comment lines, tests co-located or in `tests/`, real fixtures/queues,
no mocking the thing under test.

---

## Task 1: `GalleryAnswer.comments` field + 3-key handler JSON

**Description:** In `crates/smasher-attractor/src/interviewer.rs`, add
`#[serde(default)] pub comments: std::collections::HashMap<String, String>` to
`GalleryAnswer` (currently line 742, `selected`/`decision` only). Update
`InterviewerHandler::execute`'s free-form branch (the two `json!({"selected":
gallery.selected, "decision": decision})` call sites, lines 711 and 714) to a
three-key object: `json!({"selected": gallery.selected, "decision": decision,
"comments": gallery.comments})`. `preferred_label` stays `decision` alone —
unaffected by this change.

**Acceptance criteria:**
- [x] `GalleryAnswer` deserializes `{"selected":["a"],"decision":"proceed","comments":{"a":"tweak spacing"}}`
- [x] An answer with `comments` omitted still parses (`#[serde(default)]`) and produces an empty map
- [x] The handler's free-form branch stores and returns the three-key object under the node id
- [x] A legacy plain-string answer (non-gallery-shaped) is unaffected — stores the raw string exactly as before

**Verification:**
- [x] Tests pass: `cargo test -p smasher-attractor interviewer`
- [x] Build succeeds: `cargo check -p smasher-attractor -p smasher-web`
- [ ] Manual check: none needed at this layer — covered by the Phase 1 checkpoint's live `curl` check

**Dependencies:** None

**Files likely touched:**
- `smasher/crates/smasher-attractor/src/interviewer.rs`

**Estimated scope:** Small (1 file)

---

## Task 2: `GateDecision`/`GateDecisionRequest.comments` + `validate_decision` rules

**Description:** In `crates/smasher-web/src/routes/gallery.rs`, add
`comments: std::collections::HashMap<String, String>` to `GateDecision` (line 33)
and `#[serde(default)] pub comments: HashMap<String, String>` to
`GateDecisionRequest` (line 40). Update the `GateDecision { selected: req.selected,
decision: req.decision }` construction inside `submit_gallery_decision` (~line 230)
to include `comments: req.comments`. Extract the existing per-id checkbox validation
in `validate_decision` (line 52) into a small `validate_candidate_id` helper so it
can be reused for comment keys without duplicating the `valid_id` + "unknown or
failed candidate" logic. Then, in `validate_decision`: for every `(id, text)` in
`decision.comments`, validate `id` with the same helper (comments are **not**
restricted to selected candidates — a comment on an unchecked candidate is
explicitly allowed); trim `text`; drop the entry if the trimmed result is empty;
reject with the candidate id named if the trimmed result exceeds 4000 chars. The
happy-path canonical JSON must always include a `comments` key (possibly `{}`),
built from the validated/trimmed map — matching the existing convention that
`selected` is always present even when empty.

**Acceptance criteria:**
- [x] A comment on a candidate that is *not* in `selected` is accepted
- [x] A comment keyed to an unknown, failed, or path-traversal (`../x`) candidate
      id is rejected with that id named in the error
- [x] A comment over 4000 chars (after trim) is rejected, candidate id named
- [x] A whitespace-only comment is silently dropped from the output JSON, not rejected
- [x] The happy-path canonical JSON always contains a `comments` key, even when
      every comment was empty or omitted

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` — extend the existing
      `validate_decision_*` unit tests (lines ~311–360) with the five cases above
- [x] Build succeeds: `cargo clippy -p smasher-attractor -p smasher-web`
- [ ] Manual check: closed by the Phase 1 checkpoint (live `curl` against a
      running `smasher serve`, forged comment id and over-length comment both
      rejected 400-class)

**Dependencies:** Task 1 (shares the three-key JSON shape the endpoint forwards)

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/gallery.rs`

**Estimated scope:** Small (1 file)

---

## Checkpoint: Comments accepted end-to-end (backend only)

- [x] `cargo test -p smasher-attractor interviewer` and `cargo test -p smasher-web` green
- [x] `cargo clippy -p smasher-attractor -p smasher-web` clean, no new warnings
- [ ] Manual: `smasher serve` + a fixture gallery pipeline, `curl -X POST
      /api/runs/{id}/gallery/{qid}/decision` with a body containing `comments`
      on an unselected candidate → accepted, canonical JSON in context has it;
      same request with a comment on a forged id → 400-class, question stays pending
      **(not run — no live `smasher serve` in this autonomous session; needs a
      manual pass from Jobsworth)**
- [x] Human review before touching templates **(superseded: Jobsworth approved
      running Tasks 2–6 autonomously in one `/build auto` pass, so this
      per-phase pause was waived up front)**

---

## Task 3: Per-candidate comment textarea + submit script wiring

**Description:** In `crates/smasher-web/templates/gallery_gate.html`, add a
`<textarea class="candidate-comment" data-candidate="{{ gc.summary.candidate_id }}"
placeholder="Notes to drive the next iteration (optional)">` inside each
non-failed candidate's `<label class="candidate-card">` block (after the existing
checkbox/embed/lint-badge markup, lines 14–50) — visible regardless of the
checkbox's checked state, no `maxlength` attribute (server enforces the 4000-char
cap per Task 2, so paste-and-edit isn't silently truncated mid-keystroke). Update
the card's inline `<script>` (lines 61–88): before building the `fetch` body,
collect `card.querySelectorAll(".candidate-comment")` into a `comments` object
keyed by each textarea's `data-candidate`, skipping trimmed-empty values, and
include it in the POSTed JSON alongside `selected`/`decision`.

**Acceptance criteria:**
- [x] Every non-failed candidate card shows an optional textarea, always visible
- [x] Typing into an *unchecked* candidate's textarea and submitting a decision
      includes that comment in the POST body under the right candidate id
- [x] An empty or whitespace-only textarea contributes nothing to the POST body
      (client-side drop, matching the server-side drop from Task 2)
- [x] Failed candidates (the `candidate_card::failed_card` branch) get no textarea —
      unchanged from today

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (template compiles, existing gate-card
      render tests still pass)
- [x] Build succeeds: `cargo check -p smasher-web`
- [ ] Manual check (Browser tool): open a paused gallery-gate run, type a comment
      into an unchecked candidate, open devtools network tab, submit an edge
      decision, confirm the request body's `comments` object has the right key/value
      **(not run — no live browser session in this autonomous pass; needs a
      manual check from Jobsworth)**

**Dependencies:** Task 2 (the endpoint must accept `comments` before the UI can rely on it)

**Files likely touched:**
- `smasher/crates/smasher-web/templates/gallery_gate.html`
- `smasher/crates/smasher-web/static/style.css` (`.candidate-comment` textarea styling — optional, cosmetic only)

**Estimated scope:** Small (1-2 files)

---

## Task 4: Decision-history comments display

**Description:** In `crates/smasher-web/src/decision_history.rs`, add
`pub comments: std::collections::HashMap<String, String>` to `GalleryDecision`
(line 12) and populate it in `gallery_decisions()` (line 22) from
`data.get("comments")`, defaulted to empty when the key is absent — this is the
regression case proving pre-amendment event-log entries (only `selected`/`decision`)
still parse without a panic or `None`-propagation failure. In
`crates/smasher-web/src/routes/pages.rs`, add a template-friendly
`comments: Vec<(String, String)>` to `TemplateDecision` (line 113), built in the
`From<GalleryDecision>` impl (line 120) sorted by candidate id for stable
re-renders. In `crates/smasher-web/templates/decision_history.html`, render
`d.comments` as a nested list under the existing `.decision-candidates` span
(line 10), only when non-empty — a decision with no comments must render
byte-for-byte as it does today.

**Acceptance criteria:**
- [x] `gallery_decisions()` on a fixture event whose `data` includes `comments`
      returns it populated on `GalleryDecision`
- [x] A fixture event predating this change (`data` has only `selected`/`decision`,
      no `comments` key) still parses successfully with `comments` defaulted empty
- [x] `decision_history.html` renders each decision's comments (candidate id + text)
      when present, sorted by candidate id, and is visually unchanged for decisions
      with none
- [x] `TemplateDecision`'s `From` impl doesn't panic or silently drop data on a
      `GalleryDecision` with an empty `comments` map

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` — extend `decision_history.rs`'s
      existing test module (lines 56–178) with a with-comments case and confirm
      the existing no-`comments`-key fixtures (e.g. `extracts_a_single_gate_decision`)
      still pass unchanged
- [x] Build succeeds: `cargo check -p smasher-web`
- [ ] Manual check (Browser tool): after Task 3's live comment submission, reload
      the decision-history panel and confirm the comment appears against the
      right candidate id
      **(not run — no live browser session in this autonomous pass; needs a
      manual check from Jobsworth)**

**Dependencies:** Task 1 (needs the three-key JSON shape to exist in event data);
Task 3 recommended first for a real live comment to display, though the unit
tests here can use a hand-built fixture independently

**Files likely touched:**
- `smasher/crates/smasher-web/src/decision_history.rs`
- `smasher/crates/smasher-web/src/routes/pages.rs`
- `smasher/crates/smasher-web/templates/decision_history.html`

**Estimated scope:** Medium (3 files)

---

## Checkpoint: Comments visible in the dashboard

- [x] `cargo test -p smasher-web` green
- [ ] Manual (Browser tool): type a comment into an *unchecked* candidate, submit
      an edge decision, confirm (a) the payload/context contains that comment
      under the right candidate id, (b) `decision_history.html` then shows it
      **(not run — no live browser session in this autonomous pass; needs a
      manual check from Jobsworth)**
- [x] A pre-amendment decision-history fixture (no `comments` key) still renders
      unchanged — explicit regression check, not just new-path testing
- [x] Human review before the independent UI fixes **(superseded: Jobsworth
      approved running Tasks 2–6 autonomously up front)**

---

## Task 5: Suppress duplicate plain question card for the gate's own question

**Description:** In `crates/smasher-web/src/routes/pages.rs`'s `run_questions`
(line 697), after computing `gallery_gate_html`, if it resolved to `Some(_)`,
remove the entry whose id equals the gate's own pending question id from
`questions` before constructing `QuestionCardTemplate`. **Implementation note
from planning:** `gallery_question_id` (line 722) is currently moved into the
`gate.and_then(|gate| { let question_id = gallery_question_id?; ... })` closure
(lines 733–781) that builds `gallery_gate_html` — it is consumed there and isn't
available afterward as-is. Clone it before that closure runs (e.g.
`let gallery_question_id = pending_gallery.as_ref().map(|(qid, _)| qid.clone());`
already exists at line 722; keep a second clone, or clone inside the closure and
retain the original) so the filter below can still compare against it once
`gallery_gate_html` is computed. Key the filter off the *rendered* `Option`
(`gallery_gate_html.is_some()`), not off "is this node gallery-shaped" — if the
gate card fails to render for any reason (template error, no candidates found —
already-covered `None` paths), the plain card must still show.

**Acceptance criteria:**
- [x] A paused run with a rendering gate card no longer contains
      `answer-input-{{ gallery_question_id }}` in the `run_questions` response body
- [x] A second, genuinely non-gallery pending question on the same run still
      renders its plain card, untouched
- [x] A run where the gate card fails to render (reuse the existing "no candidates"
      fixture / `run_questions_no_gate_card_without_candidates` test) still shows
      the plain question card for that question, unchanged

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` — extend the existing
      `run_questions_*` test module (there are already tests at lines 1073,
      1521–1924 covering gate-card rendering) with the dedupe case and the
      render-failure-fallback regression case
- [x] Build succeeds: `cargo check -p smasher-web`
- [ ] Manual check (Browser tool): open a paused gallery-gate run, confirm exactly
      one input surface renders for the gate's own question — not verified by
      reading the template alone
      **(not run — no live browser session in this autonomous pass; needs a
      manual check from Jobsworth)**

**Dependencies:** None (only needs the existing `gallery_gate_html: Option<String>`
pattern already in `pages.rs`) — safe to do in parallel with Tasks 1–4

**Files likely touched:**
- `smasher/crates/smasher-web/src/routes/pages.rs`

**Estimated scope:** Small (1 file)

---

## Task 6: Live-preview reload button on embedded candidate cards

**Description:** In `crates/smasher-web/templates/_candidate_card.html`'s
`live_card` macro (line 1), for the iframe branch only (currently line 4:
`<iframe src="{{ bundle }}" ...>`), add `data-src="{{ bundle }}"` to the iframe
and a sibling `<button type="button" class="candidate-reload-btn" aria-label="Reset
preview to start">⟲</button>`. Do **not** touch the `<img>` fallback branch (line 6)
— there is nothing to reset there. Add one page-level delegated click listener in
`crates/smasher-web/templates/base.html`'s existing `<script>` block (lines 22–48,
currently the `data-poll`/`hx-reswap` version-echo logic) that matches clicks on
`.candidate-reload-btn`, finds the adjacent iframe, and does
`iframe.removeAttribute('src'); iframe.src = iframe.dataset.src;` — a parent-frame
DOM mutation, not a `contentWindow` call, so it works regardless of the `sandbox`
attribute lacking `allow-same-origin`. Delegation from `base.html` (rather than a
per-card listener) matters because `live_card` renders inside HTMX-polled
fragments (`gallery_gate.html`'s gate card, `candidate_gallery.html`'s read-only
gallery) that get swapped out and back in; a listener attached to the document
survives those swaps without re-attachment.

**Acceptance criteria:**
- [x] A live-bundle candidate card shows a reload button; a static-`<img>`-fallback
      candidate card shows none
- [x] Clicking reload resets the iframe to the bundle's start screen after the
      embedded flow was stepped through to its end. Confirmed live by Jobsworth
      2026-09-18 — initial implementation was broken (click bubbled to the
      `<a target="_blank">` wrapper in `gallery_gate.html` and opened the
      candidate in a new tab instead of reloading); fixed in `b422f51` with
      `evt.preventDefault()`/`stopPropagation()` on the reload click.
- [x] The reload button appears and works identically in both `gallery_gate.html`
      and `candidate_gallery.html` (shared macro — same fix serves both)
- [x] Reload never touches the iframe's `contentWindow` (must stay a parent-side
      `src` reassignment, since the `sandbox` attribute lacks `allow-same-origin`)

**Verification:**
- [x] Tests pass: `cargo test -p smasher-web` (template compiles, existing
      candidate-card render tests still pass)
- [x] Build succeeds: `cargo check -p smasher-web`
- [x] Manual check (Browser tool): open a run with a live-bundle candidate, step
      the embedded flow forward, click reload, confirm the iframe returns to its
      start screen. Confirmed live by Jobsworth 2026-09-18 in `gallery_gate.html`
      after the new-tab bug fix in `b422f51`; `candidate_gallery.html` shares the
      same macro/script and was never affected by that bug (no wrapping `<a>`
      there) but hasn't had an independent screenshot check.

**Dependencies:** None — safe to do in parallel with Tasks 1–5. Shared file:
`_candidate_card.html` is also used by `gallery-view`'s `candidate_gallery.html`
per `SPEC-live-preview.md`; this only adds markup inside the macro's existing
public contract (parameters, `bundle_url`/`screenshot_url` conditional stay
unchanged), so no cross-module coordination needed beyond noting it.

**Files likely touched:**
- `smasher/crates/smasher-web/templates/_candidate_card.html`
- `smasher/crates/smasher-web/templates/base.html`
- `smasher/crates/smasher-web/static/style.css` (`.candidate-reload-btn` overlay position — optional, cosmetic only)

**Estimated scope:** Small (2 files, 1 optional)

---

## Checkpoint: Amendment complete

- [x] `cargo test -p smasher-attractor -p smasher-web` and `cargo test --workspace`
      pass with zero warnings; `cargo clippy --workspace` stays clean (same 5
      pre-existing `smasher-attractor` warnings as before this change, none new)
- [x] Every pre-amendment test (assumptions 1–7's shipped behavior) still passes unchanged
- [ ] Manual (Browser tool): paused run shows exactly one input surface for the
      gate's own question; a second, genuinely non-gallery pending question on
      the same run still renders its plain card
      **(not run — no live browser session in this autonomous pass; needs a
      manual check from Jobsworth)**
- [x] Manual (Browser tool): reload control returns a stepped-through iframe to
      its start. Confirmed live by Jobsworth 2026-09-18 in `gallery_gate.html`
      (after fixing the new-tab bug in `b422f51`); `candidate_gallery.html`
      shares the same macro/script and was unaffected by that bug but hasn't
      had its own screenshot check
      **(not run — no live browser session in this autonomous pass; needs a
      manual check from Jobsworth)**
- [x] Update `SPEC-gallery-gate.md`'s amendment Success Criteria checkboxes
      (currently "not yet started") to checked, with the same evidence-per-item
      style as the assumptions 6–7 "done 2026-09-17" section — done honestly:
      the two items that specifically require live-browser confirmation are
      left unchecked with an "implemented and unit-tested, not yet confirmed
      live" note rather than marked done
- [x] Confirm `capability-map.md`'s `gallery-gate` row correctly stays `Done` —
      this was a follow-up amendment to an already-shipped module (confirmed,
      no change made)
- [ ] Human review — once approved, move `tasks/plan.md`/`tasks/todo.md` to
      `tasks/archive/` per this repo's convention (rename to
      `plan-gallery-gate-amendment.md` / `todo-gallery-gate-amendment.md` or fold
      into the existing archived pair — ask Jobsworth which, don't guess)
