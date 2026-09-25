# Todo: agent replies under the answered question

Plan: [`plan.md`](plan.md). Spec: [`SPEC-question-replies.md`](SPEC-question-replies.md).
TDD for every task: write the failing test first. No test may reach an LLM, and the fake claude
stays failing.

## Phase 1: Server emits the exchange

## Task 1: `HttpInterviewer` emits prompt and response events

**Description:** Add `with_emitter(Arc<PipelineEventEmitter>)` to `HttpInterviewer`, mirroring
`with_cancellation`. When `enqueue` pushes a question that has a `node_id`, it emits
`HumanPromptIssued { node_id, question }`. When `answer_question` takes a pending question with
a `node_id` and a live receiver (`!tx.is_closed()`), it emits `HumanResponseReceived
{ node_id, response }` **before** `tx.send`, so the event can't trail the gate's
`node_completed`. Not-found, consumed-channel and dropped-receiver paths emit nothing. Without an
emitter, behaviour is unchanged.

**Acceptance criteria:**
- [x] With an emitter, `ask`, `ask_with_options` and `approve` each emit one `HumanPromptIssued`
      with the context's node id and the question text; no node id → no event
- [x] A successful `answer_question` emits one `HumanResponseReceived` with the node id and the
      answer; unknown id and dropped receiver emit nothing
- [x] Without an emitter nothing is emitted, and every existing test passes unchanged

**Verification:**
- [x] `cargo test -p smasher-attractor http_interviewer`
- [x] `cargo clippy -p smasher-attractor -- -D warnings`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-attractor/src/http_interviewer.rs` (impl + `mod tests`)

**Estimated scope:** S

## Task 2: Web runs pass their emitter, and `events.jsonl` records the exchange

**Description:** In `run_launch.rs`, build the interviewer with
`.with_emitter(Arc::clone(&emitter))`. Add an integration test that drives a real gated run
through the router (the pattern in `events_test.rs`): answer the gate over HTTP, wait for
completion, then read the run's `events.jsonl`.

**Acceptance criteria:**
- [x] `events.jsonl` contains `human_prompt_issued` (node id, question) and
      `human_response_received` (node id, answer) for the gate
- [x] Their order is prompt → response → the gate's `node_completed`
- [x] The SSE stream carries both events, and the existing SSE shape tests pass

**Verification:**
- [x] `cargo test -p smasher-web`
- [x] Manual (Checkpoint A): after answering a run in `smasher serve`, `grep human_ ~/.smasher/artifacts/<run>/…/events.jsonl`

**Dependencies:** Task 1

**Files likely touched:**
- `crates/smasher-web/src/run_launch.rs`
- `crates/smasher-web/tests/events_test.rs`

**Estimated scope:** S

## Task 3: Run summary lists the run's gallery gates

**Description:** Add `gallery_gates: Vec<String>` to smasher-web's `RunSummary`, filled in
`RunRecord::to_summary` from `graph.nodes` where `is_gallery_gate()`, sorted for determinism.
Add `gallery_gates: string[]` to the SPA's `RunSummary` type. This lets QuestionCard hide gallery
exchanges without parsing DOT.

**Acceptance criteria:**
- [x] `GET /api/runs/{id}` for a graph with a `gallery="true"` gate returns that node id in
      `gallery_gates`, and returns `[]` for a graph without one
- [x] Rehydrated (finished, reloaded-from-disk) runs report the same list
- [x] The TS type matches, and `check` passes

**Verification:**
- [x] `cargo test -p smasher-web`
- [x] `cd frontend && npm run check`

**Dependencies:** None

**Files likely touched:**
- `crates/smasher-web/src/state.rs`
- `crates/smasher-web/src/routes/api.rs` (test)
- `frontend/src/lib/api/runs.ts`

**Estimated scope:** S

## Checkpoint A: server

- [x] `cargo test --workspace` and `make ci` green
- [x] A `QUESTION_KINDS` run's `events.jsonl` shows prompt → response → `node_completed` per gate
- [ ] (Skipped in the /build auto run; review at the end) Commit, then review with Jobsworth before starting the client

## Phase 2: Client builds exchanges

## Task 4: `buildExchanges` pure function

**Description:** `frontend/src/lib/exchanges.ts` exports `Exchange` and
`buildExchanges(events: PipelineEvent[]): Exchange[]`, following the spec's rules:
`human_prompt_issued` opens an exchange; `human_response_received` answers the newest unanswered
exchange for that node; `agent_message` goes to the most recently answered exchange unless a
prompt has been issued since then; a re-asked gate opens a new exchange. Output is oldest first.

**Acceptance criteria:**
- [x] The showcase shape (5 gates, one reply each) maps each reply to its own answer
- [x] A loop re-asking one gate produces separate exchanges, each with its own answer and replies
- [x] A message before any answer, and a message after a new prompt (before its answer), attach
      to nothing

**Verification:**
- [x] `cd frontend && npx vitest run tests/lib/exchanges.test.ts`

**Dependencies:** None (event types already exist in `lib/api/events.ts`)

**Files likely touched:**
- `frontend/src/lib/exchanges.ts`
- `frontend/tests/lib/exchanges.test.ts`

**Estimated scope:** S

## Task 5: `renderMarkdown` and `.markdown` styles

**Description:** Add `marked` and `dompurify` as dependencies. `frontend/src/lib/markdown.ts`
exports a synchronous `renderMarkdown(text): string`, which is
`DOMPurify.sanitize(marked.parse(text, { gfm: true, async: false }))`. A DOMPurify
`afterSanitizeAttributes` hook sets `target="_blank"` and `rel="noopener noreferrer"` on links.
Add a `.markdown` class to `app.css` for headings, paragraphs, lists and code, in the SPA's type
scale. No typography plugin.

**Acceptance criteria:**
- [x] Headings, bold, lists and GFM tables render
- [x] `<script>`, `on*` attributes and `javascript:` hrefs are stripped
- [x] Links get `target="_blank"` and `rel="noopener noreferrer"`

**Verification:**
- [x] `cd frontend && npx vitest run tests/lib/markdown.test.ts`
- [x] `npm run check && npm run lint && npm run build`

**Dependencies:** None

**Files likely touched:**
- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/src/lib/markdown.ts`
- `frontend/tests/lib/markdown.test.ts`
- `frontend/src/app.css`

**Estimated scope:** S

## Task 6: Answered Questions comes from events, without gallery gates

**Description:** `QuestionCard` derives the answered list from
`buildExchanges(eventStore.events)`, keeping answered exchanges whose node isn't in the run's
`gallery_gates`, which it fetches once per run via `runsApi.getRun`. Each card shows the question
and `Answer: …`, oldest first. The panel's show condition uses this list in place of
`questionStore.answered`. `questionStore` drops `answered`, `all` and `AnsweredQuestion`, and
`answer()` only removes the question from pending. Tests mount `EventLog` alongside
`QuestionCard` on a real run, so the events come over real SSE.

**Acceptance criteria:**
- [x] On a real `QUESTION_KINDS` run, each answer appears under Answered Questions once its
      `human_response_received` arrives, oldest first
- [x] After unmounting and remounting both components, the same answered list appears (standing
      in for a reload)
- [x] On the gallery-gate run (`GALLERY_GATE` in `QuestionCard.test.ts`), the gallery answer does
      **not** appear under Answered Questions; existing same-run and run-change tests still pass

**Verification:**
- [x] `cd frontend && npx vitest run tests/components/dashboard/QuestionCard.test.ts tests/stores/questions.test.ts`
- [x] `npm run check && npm run lint`

**Dependencies:** Tasks 2, 3, 4

**Files likely touched:**
- `frontend/src/components/dashboard/QuestionCard.svelte`
- `frontend/src/stores/questions.svelte.ts`
- `frontend/tests/components/dashboard/QuestionCard.test.ts`
- `frontend/tests/stores/questions.test.ts`
- `frontend/e2e/critical-path.spec.ts` (comment at line 72 only, not run: it spends tokens)

**Estimated scope:** M

## Task 7: Agent replies render as markdown under their answer

**Description:** Under each answered card, render the exchange's replies. Each reply is
labelled with its node id, and its body is `{@html renderMarkdown(reply.text)}` inside a
`.markdown` element. Test on a real gated run, with constructed `agent_message` events added to
`eventStore` after the real `human_response_received`. No LLM.

**Acceptance criteria:**
- [x] A constructed reply (`# Heading`, `**bold**`, a list) renders as `h1`/`strong`/`li` under
      the right answer, labelled with its node id
- [x] A reply after a later prompt doesn't show under the earlier answer
- [x] `EventLog` still shows the one-line `Agent · node · text` entry for the same message

**Verification:**
- [x] `cd frontend && npx vitest run tests/components/dashboard/QuestionCard.test.ts tests/components/dashboard/EventLog.test.ts`
- [x] `npm run check && npm run lint`

**Dependencies:** Tasks 5, 6

**Files likely touched:**
- `frontend/src/components/dashboard/QuestionCard.svelte`
- `frontend/tests/components/dashboard/QuestionCard.test.ts`

**Estimated scope:** S

## Checkpoint B: client

- [x] Full Vitest suite, `check` and `lint` green; the fake claude still fails and no test
      reaches an LLM
- [x] Manual: `cargo run -p smasher-cli -- serve`, answer a `QUESTION_KINDS` run, reload; the
      answered list stays, and the log shows `Awaiting input` / `Input received`
- [ ] (Skipped in the /build auto run; review at the end) Commit, then review with Jobsworth

## Phase 3: End to end and docs

## Task 8: Playwright `question-replies.spec.ts`

**Description:** Submit a `QUESTION_KINDS` run, answer all three gates through the card, check
the three answers under Answered Questions, reload the page, and check they're still there,
oldest first. Cancel the run in `finally`, as `question-card.spec.ts` does.

**Acceptance criteria:**
- [x] After a reload, Answered Questions lists the three answers in answer order
- [x] The spec never reaches an LLM

**Verification:**
- [x] `cd frontend && npx playwright test e2e/question-replies.spec.ts`

**Dependencies:** Task 6

**Files likely touched:**
- `frontend/e2e/question-replies.spec.ts`

**Estimated scope:** S

## Task 9: Docs, backlog and spec status

**Description:** Document that web runs now emit `human_prompt_issued` /
`human_response_received`, and the new `gallery_gates` field on the run summary. Mark the spec
done, and update the backlog entry.

**Acceptance criteria:**
- [x] `docs/api-reference.md` covers `gallery_gates` and the two events on web runs
- [x] `SPEC-question-replies.md` status and success criteria are updated
- [x] `tasks/BACKLOG.md` reflects the finished work

**Verification:**
- [x] Read-through; links resolve

**Dependencies:** Tasks 1–8

**Files likely touched:**
- `docs/api-reference.md`
- `tasks/SPEC-question-replies.md`
- `tasks/BACKLOG.md`

**Estimated scope:** S

## Checkpoint C: complete

- [x] Every spec success criterion is ticked
- [x] `cargo test --workspace`, `make ci`, the full Vitest suite, `check`, `lint` and the non-LLM
      Playwright specs are green; no test spent tokens
- [x] Ready for review
