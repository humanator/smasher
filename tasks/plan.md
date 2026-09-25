# Implementation Plan: agent replies under the answered question

Spec: [`SPEC-question-replies.md`](SPEC-question-replies.md). Branch: `feat/question-replies`.
Task list: [`todo.md`](todo.md).

## Overview

The web server starts emitting `HumanPromptIssued` / `HumanResponseReceived` from
`HttpInterviewer`, so every web run's `events.jsonl` records each question and its answer. The
SPA rebuilds **Answered Questions** from the run's events, not from browser-only state. Under
each answer it shows the agent's replies (`agent_message`), rendered as sanitised markdown. The
list survives a reload and shows on finished runs. Gallery gates are left out, because Decision
History already covers them.

## Architecture decisions

- **Emit from `HttpInterviewer`, not the Interviewer handler.** It's the one place every web
  question is enqueued and answered, and the CLI already emits these events its own way.
  `with_emitter` is an opt-in builder like `with_cancellation`, so the ~15 other
  `HttpInterviewer::new()` call sites (tests, rehydrate, placeholder records) are untouched.
- **Response event before the answer is delivered.** `answer_question` takes the pending
  question and checks `tx.is_closed()`. If the receiver is still there, it emits
  `HumanResponseReceived` and then calls `tx.send`. Emitting after `send` would race the gate's
  task, which can emit `node_completed` on another worker thread first. A receiver dropped
  between the check and the send leaves a stray response event. That's harmless, and far less
  likely than the reorder.
- **`buildExchanges` stays pure, and gallery filtering happens after it.** A gallery prompt
  still counts as "a question asked since", so replies after a gallery pick attach to the
  gallery exchange. That exchange is then hidden, so they attach to nothing visible. This keeps
  Decision 1's rule unchanged.
- **Gallery gates are identified by graph attributes (Jobsworth, 2026-09-25).** The run summary
  (`GET /api/runs/{id}`) gains `gallery_gates: string[]`, the ids of nodes where
  `is_gallery_gate()` is true, taken from `RunRecord.graph`. QuestionCard fetches it once per run.
  Rehydrated runs also have a graph, so finished runs work too. No client DOT parsing, and no
  flash of raw JSON.
- **Answered list is oldest first (Jobsworth, 2026-09-25)**, like Decision History.
- **`questionStore` drops `answered` / `all` / `AnsweredQuestion`.** Once the list comes from
  events, nothing reads them. `answer()` only removes the question from pending.
- **QuestionCard reads the shared `eventStore`; it doesn't open its own SSE.** On the run page,
  `EventLog` fills that store. Component tests mount `EventLog` alongside `QuestionCard` with the
  real API, so the events are real.

## Dependency graph

```
T1 HttpInterviewer emits events ──► T2 run_launch wires emitter (+ events.jsonl test)
                                                   │
T3 RunSummary.gallery_gates ───────────────────────┤
                                                   ▼
T4 buildExchanges (pure) ──────────────► T6 QuestionCard answered list from events
T5 renderMarkdown + deps + .markdown ──► T7 replies under answers ◄── T6
                                                   │
                                                   ▼
                                  T8 Playwright reload spec ─► T9 docs + backlog
```

T1, T3, T4 and T5 are independent. T4 and T5 can be built in parallel with Phase 1.

## Task list

### Phase 1: Server emits the exchange

- [x] T1: `HttpInterviewer` emits prompt and response events (S)
- [x] T2: Web runs pass their emitter, and `events.jsonl` records the exchange (S)
- [x] T3: Run summary lists the run's gallery gates (S)

### Checkpoint A: server

- [x] `cargo test --workspace`, `make ci` green
- [ ] A `QUESTION_KINDS` run's `events.jsonl` shows prompt → response → `node_completed` per gate

### Phase 2: Client builds exchanges

- [x] T4: `buildExchanges` pure function (S)
- [x] T5: `renderMarkdown` with `marked` + `DOMPurify`, and `.markdown` styles (S)
- [x] T6: Answered Questions comes from events, without gallery gates, and survives a remount (M)
- [x] T7: Agent replies render as markdown under their answer (S)

### Checkpoint B: client

- [ ] Vitest, `check` and `lint` green; the fake claude still fails and no test reaches an LLM
- [ ] Manual: `cargo run -p smasher-cli -- serve`, answer a `QUESTION_KINDS` run, then reload. The list stays.

### Phase 3: End to end and docs

- [ ] T8: Playwright `question-replies.spec.ts` (S)
- [ ] T9: Docs, backlog and spec status (S)

### Checkpoint C: complete

- [ ] Every success criterion in the spec is ticked
- [ ] `cargo test`, `make ci`, the full Vitest suite, `check`, `lint` and the non-LLM Playwright
      specs are green
- [ ] Ready for review

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Response event lands after the gate's `node_completed` | High: replies could attach to the wrong exchange | Emit before `tx.send` (see above). T2's integration test asserts the order in `events.jsonl`. |
| QuestionCard tests only see events if `EventLog` is mounted | Med: false greens or empty lists | Tests mount both on a real run. The remount test unmounts and remounts both. |
| Removing `questionStore.answered` breaks the LLM `critical-path.spec.ts` | Low | It only counts answers via the pending card, and its comment at line 72 is updated. That spec spends tokens, so it isn't run. |
| New npm deps (`marked`, `dompurify`) and sanitiser gaps | Med: XSS in agent text | DOMPurify's defaults, plus a test for `<script>`, `on*` attributes and `javascript:` links. The link hook only adds `target`/`rel`. |
| Large replies (the FinalSummary recap) bloat the card | Low | Collapsing is out of scope. `.markdown` keeps the spacing tight. Revisit if it's a problem. |
| Old runs have no prompt/response events | Low | Expected: their list is empty and the event log still has the replies (spec). |

## Open questions

None. Both spec open questions were settled by Jobsworth on 2026-09-25: gallery gates are hidden
via graph attributes, and the list is oldest first.
