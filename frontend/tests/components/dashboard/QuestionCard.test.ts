// ABOUTME: Tests for QuestionCard component
// ABOUTME: Answers real human-gate questions on runs against the real smasher-web API, no mocking

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { toast } from 'svelte-sonner';
import QuestionCard from '../../../src/components/dashboard/QuestionCard.svelte';
import { Toaster } from '../../../src/lib/components/ui/sonner/index.js';
import * as runsApi from '../../../src/lib/api/runs';
import { questionStore } from '../../../src/stores/questions.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

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

describe('QuestionCard', () => {
  beforeEach(() => {
    questionStore.clear();
    setApiBaseUrl('http://127.0.0.1:21541/api');
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

    render(QuestionCard, { props: { runId } });

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

  it('shows answered questions', async () => {
    render(QuestionCard, { props: { runId: 'run-123' } });

    const question = {
      id: 'q1',
      question: 'Complete?',
      choices: [],
      kind: 'free_form' as const,
      node_id: 'gate1',
    };

    questionStore.setPending([question]);
    questionStore.answer('q1', 'done');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Complete?')).toBeTruthy();
    expect(screen.getByText('Answer: done')).toBeTruthy();
  });

  it('answers a real approval question with the Yes button', async () => {
    const user = userEvent.setup();
    const { run_id: runId } = await runsApi.submitRun({
      dot_source: gatedPipeline('QuestionCardApproval', 'label="Continue?", approve=true'),
      variables: {},
    });

    render(QuestionCard, { props: { runId } });

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
      expect(questionStore.answered).toHaveLength(0);
    });

    it('toasts a failing poll once, not on every tick', async () => {
      render(Toaster);
      render(QuestionCard, { props: { runId: 'no-such-run' } });

      expect(
        await screen.findByText('not found: run no-such-run', {}, { timeout: 5000 })
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
