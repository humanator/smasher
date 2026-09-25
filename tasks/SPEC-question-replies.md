# Spec: agent replies under the answered question

Status: **draft, 2026-09-25**. Branch: `feat/question-replies`, from `feat/spa-port-repairs`.

Raised by Jobsworth on run `01m3c6t5exbbr6b2jps2w3wnj7` (`human_gate_showcase.dot`): the agent's
reply to each gate answer shows only as a cut-off line in the event log. It should read as a reply
under the question that was answered.

## Objective

On the run page, each answered question shows the question, the answer and the agent's replies to
that answer, rendered as markdown. This survives a page reload and shows on finished runs. The
event log keeps one short line per agent message, so it stays a complete timeline.

## What the run shows today

- Each gate answer leads through an edge to a Codergen node, whose `agent_message` answers it:

  | Gate → answer | Next node | Reply opens with |
  |---|---|---|
  | FreeformGate → `asad` | EchoFreeform | "You said: **"asad"**…" |
  | BinaryGate → `yes` | YesPath | "You chose to continue…" |
  | MultiChoiceGate → `blue` | BluePath | "Great pick! 💙…" |
  | DefaultGate → `So spicy` | HotPath | "…respect for your iron stomach…" |
  | FinalFreeform → `adiamo` | FinalSummary | "# 🎢 The Great Gate Journey: A Recap…" |

- The replies are markdown (headings, bold, lists). `EventLog` shows each as one truncated line.
- **Answered Questions** (`QuestionCard`) comes from `questionStore.answered`, which exists only
  in the browser. It holds answers given in this page session and is empty after a reload or on a
  run opened later.
- The event stream has no question text and no answers. `PipelineEvent::HumanPromptIssued
  { node_id, question }` and `HumanResponseReceived { node_id, response }` exist
  (`smasher-attractor/src/events.rs:81-91`) and the SPA already formats them, but nothing in
  production emits them. An Interviewer's `node_completed` carries only the response, not the
  question.
- `HttpInterviewer` (`smasher-attractor/src/http_interviewer.rs`) is where every web-run question
  is enqueued (`enqueue`, called from `ask`, `ask_with_options` and `approve`) and answered
  (`answer_question`). `PendingQuestion` already holds `node_id`. The run's
  `PipelineEventEmitter` is created alongside it in `smasher-web/src/run_launch.rs:132-135`. Every
  emitted event goes to `events.jsonl`, which the SSE endpoint replays.

## Decisions (Jobsworth, 2026-09-25)

1. **Matching:** every `agent_message` after an answer, up to the next question being asked,
   belongs under that answer.
2. **Event log:** keeps a short one-line entry for each agent message. The full reply shows only
   under the answer.
3. **Markdown:** rendered, using `marked` plus `DOMPurify` (two new npm dependencies).
4. **Persistence:** the answered list and its replies are rebuilt from the run's events, so they
   survive a reload. This needs the server to emit the question and answer events.

## Design

### Server: emit the question and answer events

- `HttpInterviewer` gains `with_emitter(Arc<PipelineEventEmitter>)`, like `with_cancellation`.
- When `enqueue` adds a question, it emits `HumanPromptIssued { node_id, question }`.
- When `answer_question` delivers an answer successfully, it emits `HumanResponseReceived
  { node_id, response }`. A failed answer (unknown id, dropped receiver) emits nothing.
- Both are emitted only when the question has a `node_id`. Production web runs always set one,
  through `NODE_ID_CONTEXT_KEY`.
- Without an emitter, `HttpInterviewer` behaves exactly as today.
- `run_launch.rs` passes the run's emitter.
- The response event comes before the gate's `node_completed`, so replies can't arrive before
  their answer.
- The CLI's TUI and headless modes already handle both events and don't use `HttpInterviewer`, so
  they're unchanged.

### Client: build exchanges from events

- A pure `buildExchanges(events: PipelineEvent[]): Exchange[]` in `lib/exchanges.ts`, where
  `Exchange = { nodeId, question, answer: string | null, replies: { nodeId, text }[] }`:
  - `human_prompt_issued` opens a new exchange with no answer;
  - `human_response_received` sets the answer on the newest unanswered exchange for that node;
  - `agent_message` is added to the most recently answered exchange, unless a question has been
    asked since that answer. A message with no answered exchange before it attaches to nothing.
  - A gate asked again, for example by `loop_restart`, opens a new exchange each time.
- `QuestionCard`'s **Answered Questions** renders the answered exchanges, oldest first, from the
  shared `eventStore`, which the run page's `EventLog` fills. For each exchange it shows:
  - the question;
  - `Answer: …`;
  - each reply under it, labelled with its node id and rendered as markdown.
- `questionStore.answered` stops driving that list. Answering still removes the question from
  pending straight away (`questionStore.answer`). The answered entry appears when its
  `human_response_received` event arrives over SSE, a moment later.
- A run from before this change has no prompt or response events, so its answered list stays
  empty. Its replies stay in the event log.

### Markdown

- `lib/markdown.ts` exports `renderMarkdown(text): string`, which is
  `DOMPurify.sanitize(marked.parse(text))`. It's synchronous, and GitHub-flavoured markdown is on.
- A `.markdown` class gives headings, lists, code and paragraphs spacing in the SPA's type scale.
  There's no typography plugin.
- Links open in a new tab with `rel="noopener noreferrer"`.

### Event log

- No change to `formatEvent`. Agent messages keep their one-line `Agent · node · text` entry.
- The prompt and response events now appear in the log, as `Awaiting input` and `Input received`.
  Their lines already exist.

## Testing

- **Rust** (`http_interviewer.rs` tests):
  - with an emitter, `ask`, `ask_with_options` and `approve` each emit `HumanPromptIssued` with
    the node id and question text;
  - a successful `answer_question` emits `HumanResponseReceived`;
  - a failed one emits nothing;
  - without an emitter nothing is emitted, and the existing tests are unchanged.
- **Rust** (`smasher-web`): a real gated run through the router writes both events to
  `events.jsonl`, in order, before the gate's `node_completed`.
- **Vitest**:
  - `buildExchanges` on constructed event lists: the showcase shape, a loop re-asking one gate, a
    message before any answer, and a message after a new question has been asked;
  - `renderMarkdown`: headings, bold and lists render, `<script>` and `on*` attributes are
    stripped, and links get `target`/`rel`;
  - `QuestionCard` on a real gated run (`QUESTION_KINDS`): answers appear under Answered
    Questions from the real events, and still do after unmount and remount (standing in for a
    reload);
  - `QuestionCard` with constructed `agent_message` events added to the store: the reply renders
    as markdown under the right answer. No test run reaches an LLM, and the fake claude stays
    failing.
- **Playwright** `e2e/question-replies.spec.ts`: answer a `QUESTION_KINDS` run, reload, and the
  answered list is still there. Replies can't be shown end to end without an LLM, so they're
  covered by the constructed-event tests.

## Out of scope

- Showing replies on the gallery gate card or in Decision History.
- Streaming a reply while the agent is still writing it. Today there's one `agent_message` per
  node.
- Collapsing long replies.
- Recording the question kind or choices in `HumanPromptIssued`.

## Open questions

1. **Gallery gates** answer through the same `answer_question`, so they'd emit a
   `HumanResponseReceived` whose response is the JSON selection. Decision History already shows
   that decision. Recommendation: leave the gallery gate's exchange out of Answered Questions,
   matched by the `node_id` in `GET /runs/{id}/decisions`.
2. **Ordering in the panel:** oldest first, reading like a conversation (recommended), or newest
   first, as the event log is?

## Success criteria

- [ ] A web run's `events.jsonl` has `human_prompt_issued` and `human_response_received` for each
      gate, with the node id, question and answer.
- [ ] On the run page, each answered question shows its answer and the agent's replies, rendered
      as markdown, matched by the rule in Decision 1.
- [ ] Reloading the page, or opening a finished run, shows the same answered list and replies.
- [ ] The event log still has a one-line entry for every agent message.
- [ ] Rendered markdown can't run script. The sanitiser test proves it.
- [ ] `cargo test`, `make ci`, the full Vitest suite, `check`, `lint` and the non-LLM Playwright
      specs are green, and no test spends tokens.
