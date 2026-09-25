// ABOUTME: Tests for QuestionCard component
// ABOUTME: Answers real human-gate questions on runs against the real smasher-web API, no mocking

import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { toast } from 'svelte-sonner';
import QuestionCard from '../../../src/components/dashboard/QuestionCard.svelte';
import EventLog from '../../../src/components/dashboard/EventLog.svelte';
import { Toaster } from '../../../src/lib/components/ui/sonner/index.js';
import * as runsApi from '../../../src/lib/api/runs';
import { questionStore } from '../../../src/stores/questions.svelte';
import { eventStore } from '../../../src/stores/events.svelte';
import * as native from '../../../src/lib/native';
import { submitGalleryDecision } from '../../../src/lib/api/gallery';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as questionsApi from '../../../src/lib/api/questions';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ANONYMOUS_GATE, QUESTION_KINDS, submitGraph, cancelAll } from '../../fixtures/graphs';

// One interviewer gate between start and exit, no LLM nodes, so the run
// parks on a real HttpInterviewer question until the component answers it.
function gatedPipeline(name: string, gateAttrs: string): string {
  return `digraph ${name} {
    start [shape=circle];
    gate [shape=oval, ${gateAttrs}];
    done [shape=doublecircle];
    start -> gate -> done;
  }`;
}

async function waitForRunStatus(runId: string, status: string): Promise<void> {
  await waitFor(
    async () => {
      expect((await runsApi.getRun(runId)).status).toBe(status);
    },
    { timeout: 10000, interval: 200 }
  );
}

// Same gate-only shape as GalleryGate.test.ts: Start goes straight to a
// gallery gate, and Proceed/Iterate are conditionals, so nothing reaches an LLM.
const GALLERY_GATE = `digraph QuestionCardGallery {
  Start [shape=Mdiamond];
  Gate1 [shape=hexagon, label="Pick your favorite", gallery="true", candidate_count=1];
  Proceed [shape=diamond]; Iterate [shape=diamond];
  Exit [shape=Msquare];
  Start -> Gate1;
  Gate1 -> Proceed [label="proceed"];
  Gate1 -> Iterate [label="iterate"];
  Proceed -> Exit; Iterate -> Exit;
}`;

// Matches smasher-web's default_data_dir(): $SMASHER_DATA_DIR, else ~/.smasher.
const artifactsRoot = join(process.env.SMASHER_DATA_DIR ?? join(homedir(), '.smasher'), 'artifacts');

async function submitAndWaitForGalleryGate(): Promise<string> {
  const runId = await submitGraph(GALLERY_GATE);
  const dir = join(artifactsRoot, runId, 'artifacts', 'candidate-a');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: new Date().toISOString(),
      viewport: { width: 1280, height: 800 },
      candidate_dir: '/tmp/candidate-a',
      exit_status: { status: 'success' },
      artifacts: [],
      generation_params: {},
    })
  );
  await waitFor(
    async () => expect((await questionsApi.listQuestions(runId)).gallery_gate).toBeTruthy(),
    { timeout: 10000, interval: 250 }
  );
  return runId;
}

// Counts completed question fetches for one run by wrapping fetch in a pass-through.
function countQuestionFetches(runId: string): { done: () => number; restore: () => void } {
  const realFetch = globalThis.fetch;
  let n = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await realFetch(input, init);
    if (String(input).endsWith(`/runs/${runId}/questions`)) n++;
    return response;
  }) as typeof fetch;
  return { done: () => n, restore: () => (globalThis.fetch = realFetch) };
}

// Holds each answer POST for one run until release() is called, then lets it
// through to the real server unchanged.
function holdAnswers(runId: string): { release: () => void; restore: () => void } {
  const realFetch = globalThis.fetch;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes(`/runs/${runId}/questions/`) && String(input).endsWith('/answer')) {
      await gate;
    }
    return realFetch(input, init);
  }) as typeof fetch;
  return { release, restore: () => (globalThis.fetch = realFetch) };
}

// Answered Questions comes from the run's events, which the run page's
// EventLog streams into eventStore, so tests of the answered list mount both.
function renderRun(runId: string) {
  const log = render(EventLog, { props: { runId } });
  const card = render(QuestionCard, { props: { runId } });
  return {
    async rerender(id: string) {
      await log.rerender({ runId: id });
      await card.rerender({ runId: id });
    },
    unmount() {
      card.unmount();
      log.unmount();
    },
  };
}

const answeredCards = () =>
  Array.from(document.querySelectorAll('.answered-card')).map((el) => ({
    question: el.querySelector('.question-text')?.textContent?.trim(),
    answer: el.querySelector('.answer-text')?.textContent?.trim(),
  }));

describe('QuestionCard', () => {
  let notifySpy: MockInstance<
    Parameters<typeof native.showNotification>,
    ReturnType<typeof native.showNotification>
  >;

  beforeEach(() => {
    questionStore.clear();
    eventStore.clear();
    setApiBaseUrl('http://127.0.0.1:21541/api');
    // EventLog notifies when a run finishes; keep that out of the test output.
    notifySpy = vi.spyOn(native, 'showNotification').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Unmount first, so a run finishing below can't notify after the spy is restored.
    cleanup();
    await cancelAll();
    notifySpy.mockRestore();
  });

  it('shows the kind badge and question id straight away', async () => {
    const runId = await submitGraph(QUESTION_KINDS);
    let questionId = '';
    await waitFor(async () => {
      questionId = (await questionsApi.listQuestions(runId)).questions[0]?.id;
      expect(questionId).toBeTruthy();
    });

    render(QuestionCard, { props: { runId } });

    expect(await screen.findByText('Multiple Choice', {}, { timeout: 1000 })).toBeTruthy();
    expect(screen.getByText(questionId)).toHaveClass('font-mono', 'break-all');
  });

  it('shows nothing until a fetch succeeds', async () => {
    const { container } = render(QuestionCard, { props: { runId: 'no-such-run' } });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(container.querySelector('.questions')).toBeNull();
  });

  it('says so when nothing is pending', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);
    await runsApi.cancelRun(runId);
    await waitForRunStatus(runId, 'Aborted');

    render(QuestionCard, { props: { runId } });

    expect(await screen.findByText('No pending questions.', {}, { timeout: 1000 })).toBeTruthy();
  });

  it('shows no empty state while a gallery gate is showing', async () => {
    const runId = await submitAndWaitForGalleryGate();
    const fetches = countQuestionFetches(runId);

    try {
      render(QuestionCard, { props: { runId } });
      await waitFor(() => expect(fetches.done()).toBeGreaterThanOrEqual(1));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(screen.queryByText('No pending questions.')).toBeNull();
    } finally {
      fetches.restore();
    }
  }, 15000);

  it('disables Submit while the free-text answer is blank', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(ANONYMOUS_GATE);

    render(QuestionCard, { props: { runId } });
    const input = await screen.findByPlaceholderText('Enter your answer');
    const submit = screen.getByRole('button', { name: 'Submit' });

    expect(submit).toBeDisabled();
    await user.type(input, '   ');
    expect(submit).toBeDisabled();
    await user.type(input, 'x');
    expect(submit).toBeEnabled();
  });

  it('answers a real free-text question with the Submit button', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(ANONYMOUS_GATE);

    renderRun(runId);
    await user.type(await screen.findByPlaceholderText('Enter your answer'), 'by button');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(screen.getByText('Answer: by button')).toBeTruthy());
    expect(screen.queryByPlaceholderText('Enter your answer')).toBeNull();
    await waitForRunStatus(runId, 'Completed');
  });

  it('disables the input and Submit while the answer is in flight', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(ANONYMOUS_GATE);
    const answers = holdAnswers(runId);

    try {
      renderRun(runId);
      const input = await screen.findByPlaceholderText('Enter your answer');
      await user.type(input, 'held');
      const submit = screen.getByRole('button', { name: 'Submit' });
      await user.click(submit);

      await waitFor(() => expect(submit).toBeDisabled());
      expect(input).toBeDisabled();

      answers.release();
      await waitFor(() => expect(screen.getByText('Answer: held')).toBeTruthy());
    } finally {
      answers.release();
      answers.restore();
    }
  });

  it('answers multiple choice with radios and Submit, then approval with Yes', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(QUESTION_KINDS);

    renderRun(runId);

    const group = await screen.findByRole('group', { name: 'Pick a colour' }, { timeout: 2000 });
    const radios = ['Red', 'Blue', 'Green'].map((name) => screen.getByRole('radio', { name }));
    expect(group).toContainElement(radios[0]);
    for (const radio of radios) expect(radio).not.toBeChecked();
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();

    // Picking a choice doesn't submit it.
    await user.click(radios[1]);
    expect(radios[1]).toBeChecked();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByText('Answer: Blue')).toBeNull();
    expect((await questionsApi.listQuestions(runId)).questions[0]?.kind).toBe('multiple_choice');

    await user.click(submit);
    await waitFor(() => expect(screen.getByText('Answer: Blue')).toBeTruthy());

    await user.click(await screen.findByRole('button', { name: 'Yes' }, { timeout: 4000 }));
    await waitFor(() => expect(screen.getByText('Answer: yes')).toBeTruthy());

    expect(await screen.findByText('Say something', {}, { timeout: 4000 })).toBeTruthy();
  }, 15000);

  it('disables Yes and No while an approval answer is in flight', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(gatedPipeline('QuestionCardHeldApproval', 'label="Go?", approve=true'));
    const answers = holdAnswers(runId);

    try {
      renderRun(runId);
      const yes = await screen.findByRole('button', { name: 'Yes' });
      const no = screen.getByRole('button', { name: 'No' });
      await user.click(yes);

      await waitFor(() => expect(yes).toBeDisabled());
      expect(no).toBeDisabled();

      answers.release();
      await waitFor(() => expect(screen.getByText('Answer: yes')).toBeTruthy());
    } finally {
      answers.release();
      answers.restore();
    }
  });

  it('keeps the answered questions when given the same run again', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(ANONYMOUS_GATE);

    const { rerender } = renderRun(runId);
    await user.type(await screen.findByPlaceholderText('Enter your answer'), 'kept{Enter}');
    await waitFor(() => expect(screen.getByText('Answer: kept')).toBeTruthy());

    await rerender(runId);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('Answer: kept')).toBeTruthy();
  });

  it("drops the first run's answered questions when the run changes", async () => {
    const user = userEvent.setup();
    const firstRun = await submitGraph(ANONYMOUS_GATE);
    const secondRun = await submitGraph(ANONYMOUS_GATE);

    const { rerender } = renderRun(firstRun);
    await user.type(await screen.findByPlaceholderText('Enter your answer'), 'first{Enter}');
    await waitFor(() => expect(screen.getByText('Answer: first')).toBeTruthy());

    await rerender(secondRun);

    await waitFor(() => expect(screen.queryByText('Answer: first')).toBeNull());
  });

  it('renders empty state when no questions', () => {
    render(QuestionCard, { props: { runId: 'run-123' } });
    // Component doesn't render anything when empty (OK behavior)
  });

  it('displays pending questions from store', async () => {
    render(QuestionCard, { props: { runId: 'run-123' } });

    questionStore.setPending([
      {
        id: 'q1',
        question: 'Is this acceptable?',
        choices: [],
        kind: 'free_form',
        node_id: 'gate1',
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Is this acceptable?')).toBeTruthy();
  });

  it('polls a real free_form question and submits the typed answer', async () => {
    const user = userEvent.setup();
    const { run_id: runId } = await runsApi.submitRun({
      dot_source: gatedPipeline('QuestionCardFreeForm', 'label="Your answer?"'),
      variables: {},
    });

    renderRun(runId);

    // The component's own 2s poll of GET /api/runs/{id}/questions finds it.
    const input = (await screen.findByPlaceholderText(
      'Enter your answer',
      {},
      { timeout: 5000 }
    )) as HTMLInputElement;
    expect(screen.getByText('Your answer?')).toBeTruthy();

    await user.type(input, 'yes');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByText('Answer: yes')).toBeTruthy());
    // The gate only releases the run if the server received the answer.
    await waitForRunStatus(runId, 'Completed');
  });

  it('shows answered questions from the run events', async () => {
    render(QuestionCard, { props: { runId: 'run-123' } });
    const timestamp = new Date().toISOString();

    eventStore.add({ kind: 'human_prompt_issued', node_id: 'gate1', question: 'Complete?', timestamp });
    eventStore.add({ kind: 'human_response_received', node_id: 'gate1', response: 'done', timestamp });

    expect(await screen.findByText('Answer: done')).toBeTruthy();
    expect(screen.getByText('Complete?')).toBeTruthy();
  });

  it('shows no answer for a question that is only pending in the events', async () => {
    render(QuestionCard, { props: { runId: 'run-123' } });
    const timestamp = new Date().toISOString();

    eventStore.add({ kind: 'human_prompt_issued', node_id: 'gate1', question: 'Waiting?', timestamp });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(document.querySelector('.answered-card')).toBeNull();
  });

  it('lists answers from the run events, oldest first, and keeps them after a remount', async () => {
    const user = userEvent.setup();
    const runId = await submitGraph(QUESTION_KINDS);
    const expected = [
      { question: 'Pick a colour', answer: 'Answer: Blue' },
      { question: 'Continue?', answer: 'Answer: yes' },
      { question: 'Say something', answer: 'Answer: hello' },
    ];

    const first = renderRun(runId);
    await user.click(await screen.findByRole('radio', { name: 'Blue' }, { timeout: 2000 }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(await screen.findByRole('button', { name: 'Yes' }, { timeout: 4000 }));
    await user.type(
      await screen.findByPlaceholderText('Enter your answer', {}, { timeout: 4000 }),
      'hello{Enter}'
    );
    await waitFor(() => expect(answeredCards()).toEqual(expected), { timeout: 4000 });
    await waitForRunStatus(runId, 'Completed');

    // Standing in for a page reload: nothing survives in the browser stores.
    first.unmount();
    questionStore.clear();
    expect(eventStore.events).toEqual([]);

    renderRun(runId);

    await waitFor(() => expect(answeredCards()).toEqual(expected), { timeout: 4000 });
  }, 20000);

  it('leaves gallery picks out of Answered Questions', async () => {
    const runId = await submitAndWaitForGalleryGate();
    const { gallery_gate } = await questionsApi.listQuestions(runId);

    renderRun(runId);
    await submitGalleryDecision(runId, gallery_gate!.question_id, {
      selected: ['candidate-a'],
      decision: 'proceed',
      comments: {},
    });

    await waitFor(
      () =>
        expect(
          eventStore.events.some(
            (e) => e.kind === 'human_response_received' && e.node_id === 'Gate1'
          )
        ).toBe(true),
      { timeout: 5000 }
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(answeredCards()).toEqual([]);
  }, 15000);

  it('answers a real approval question with the Yes button', async () => {
    const user = userEvent.setup();
    const { run_id: runId } = await runsApi.submitRun({
      dot_source: gatedPipeline('QuestionCardApproval', 'label="Continue?", approve=true'),
      variables: {},
    });

    renderRun(runId);

    const yesBtn = await screen.findByText('Yes', {}, { timeout: 5000 });
    expect(screen.getByText('Continue?')).toBeTruthy();

    await user.click(yesBtn);

    await waitFor(() => expect(screen.getByText('Answer: yes')).toBeTruthy());
    await waitForRunStatus(runId, 'Completed');
  });

  describe('error toasts', () => {
    // Live toasts only: a toast dismissed earlier can briefly re-render,
    // marked data-removed, because sonner's store is global.
    const toasts = () =>
      document.querySelectorAll('[data-sonner-toast][data-removed="false"]');

    // Close every toast while this test's <Toaster> is still mounted so
    // none carries over into the next test.
    afterEach(async () => {
      toast.dismiss();
      await waitFor(() => expect(toasts().length).toBe(0));
    });

    it("toasts the server's message when an answer is rejected, and keeps the question", async () => {
      const user = userEvent.setup();
      const { run_id: runId } = await runsApi.submitRun({
        dot_source: gatedPipeline('QuestionCardRejected', 'label="Real gate?"'),
        variables: {},
      });
      await waitForRunStatus(runId, 'Running');
      render(Toaster);
      render(QuestionCard, { props: { runId } });
      // Let the first fetch land, so it can't replace the stale question below.
      // The next poll is 2s away.
      await screen.findByText('Real gate?');
      // A question the real run doesn't have, so the server rejects the answer.
      questionStore.setPending([
        {
          id: 'no-such-q',
          question: 'Stale question?',
          choices: [],
          kind: 'approval',
          node_id: 'gate',
        },
      ]);

      await user.click(await screen.findByText('Yes'));

      expect(await screen.findByText('question not found: no-such-q')).toBeTruthy();
      expect(screen.getByText('Stale question?')).toBeTruthy();
      expect(screen.queryByText('Answer: yes')).toBeNull();
    });

    it('keeps the typed text and re-enables Submit when a free-text answer is rejected', async () => {
      const user = userEvent.setup();
      const runId = await submitGraph(ANONYMOUS_GATE);
      await waitForRunStatus(runId, 'Running');
      render(Toaster);
      render(QuestionCard, { props: { runId } });
      // Let the first fetch land, so it can't replace the stale question below.
      await screen.findByText('x');
      // A question the real run doesn't have, so the server rejects the answer.
      questionStore.setPending([
        { id: 'no-such-q', question: 'Stale text?', choices: [], kind: 'free_form' },
      ]);

      await screen.findByText('Stale text?');
      const input = screen.getByPlaceholderText('Enter your answer');
      await user.type(input, 'keep me');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(await screen.findByText('question not found: no-such-q')).toBeTruthy();
      await waitFor(() => expect(toasts()).toHaveLength(1));
      expect(input).toHaveValue('keep me');
      await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
    });

    it('toasts a failing poll once, not on every tick', async () => {
      render(Toaster);
      render(QuestionCard, { props: { runId: 'no-such-run' } });

      // The first fetch runs on mount, so the toast comes straight away.
      expect(
        await screen.findByText('not found: run no-such-run', {}, { timeout: 1500 })
      ).toBeTruthy();
      // Watch three more failing 2s ticks. The toast closes itself after
      // sonner's 4s default, and none of the later failures brings it back.
      let most = 0;
      for (let waited = 0; waited < 6500; waited += 100) {
        most = Math.max(most, toasts().length);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(most).toBe(1);
      expect(toasts().length).toBe(0);
    }, 15000);
  });
});
