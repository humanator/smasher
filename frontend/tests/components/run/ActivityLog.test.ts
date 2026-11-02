// ABOUTME: Tests for ActivityLog, the run panel's Activity tab: Key moments / Everything, indent, tint, scroll anchoring
// ABOUTME: Streams real runs' SSE events (incl. replay) from the real smasher-web API through a host that fills the event store

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import ActivityLog from '../../../src/components/run/ActivityLog.svelte';
import ActivityLogHost from './ActivityLogHost.svelte';
import { eventStore } from '../../../src/stores/events.svelte';
import * as runsApi from '../../../src/lib/api/runs';
import * as questionsApi from '../../../src/lib/api/questions';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import { LOOP_CHECK, submitGraph, cancelAll } from '../../fixtures/graphs';

// One interviewer gate and no LLM nodes: the run parks on a real question
// until a test answers (-> pipeline_completed) or cancels (-> pipeline_aborted).
const GATED_DOT = `digraph ActivityLogGated {
  start [shape=circle];
  gate [shape=oval, label="Proceed?"];
  done [shape=doublecircle];
  start -> gate -> done;
}`;

let runIds: string[] = [];

async function startGatedRun(): Promise<string> {
  const { run_id } = await runsApi.submitRun({ dot_source: GATED_DOT, variables: {} });
  runIds.push(run_id);
  return run_id;
}

async function answerGate(runId: string, answer = 'go', notId?: string): Promise<string> {
  let questionId: string | undefined;
  await waitFor(
    async () => {
      questionId = (await questionsApi.listQuestions(runId)).questions.find((q) => q.id !== notId)?.id;
      expect(questionId).toBeTruthy();
    },
    { timeout: 5000, interval: 100 }
  );
  await questionsApi.answerQuestion(runId, questionId!, answer);
  return questionId!;
}

// jsdom has no layout, so give the log box simple geometry: 40px per rendered
// line, and a plain settable scrollTop. DOM geometry only; no server is mocked.
function stubGeometry(box: HTMLElement): void {
  let scrollTop = 0;
  Object.defineProperty(box, 'scrollHeight', {
    configurable: true,
    get: () => 40 * box.querySelectorAll('.event-item').length,
  });
  Object.defineProperty(box, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => (scrollTop = value),
  });
}

function checkpoint(node: string) {
  return { kind: 'checkpoint_created' as const, timestamp: '2026-09-25T10:00:00Z', node_id: node };
}

// A Key moments line, so the scrolling tests need not switch to Everything.
function stepStarted(node: string) {
  return { kind: 'node_started' as const, timestamp: '2026-09-25T10:00:00Z', node_id: node, node_type: 'Codergen' };
}

async function showEverything() {
  await userEvent.setup().click(screen.getByRole('radio', { name: 'Everything' }));
}

// The rendered lines, newest first, as their text content.
function lines(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('.event-item')];
}

function lineWith(container: HTMLElement, text: string): HTMLElement | undefined {
  return lines(container).find((line) => line.textContent?.includes(text));
}

describe('ActivityLog', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  beforeEach(() => {
    eventStore.clear();
  });

  afterEach(async () => {
    cleanup();
    // Don't leave runs parked on the gate in the shared dev server.
    await Promise.all(runIds.map((id) => runsApi.cancelRun(id).catch(() => undefined)));
    runIds = [];
    await cancelAll();
  });

  it('renders empty state initially', async () => {
    const runId = await startGatedRun();
    render(ActivityLogHost, { props: { runId } });
    expect(screen.getByText('Waiting for events...')).toBeTruthy();
  });

  it('displays the real run events replayed from the start, formatted', async () => {
    const runId = await startGatedRun();
    const { container } = render(ActivityLogHost, { props: { runId } });
    await showEverything();

    // The run parks on the gate right after this event.
    await waitFor(() => expect(lineWith(container, 'gate · Ask a person')).toBeTruthy(), {
      timeout: 5000,
    });
    expect(lineWith(container, 'Step started')).toHaveTextContent('gate · Ask a person');
    expect(lineWith(container, 'Run started')).toHaveTextContent('ActivityLogGated');
    expect(lineWith(container, 'start → gate')).toHaveTextContent('Moved on');
    expect(lines(container).length).toBe(eventStore.events.length);
  });

  it('shows the Run completed line when the pipeline completes', async () => {
    const runId = await startGatedRun();
    render(ActivityLogHost, { props: { runId } });

    await answerGate(runId);

    await screen.findByText('Run completed', {}, { timeout: 5000 });
  });

  it('shows a looping run newest first, with bookkeeping lines faded', async () => {
    const runId = await submitGraph(LOOP_CHECK);
    const { container } = render(ActivityLogHost, { props: { runId } });
    await showEverything();

    const first = await answerGate(runId, 'again');
    await answerGate(runId, 'done', first);

    await waitFor(() => expect(lines(container)[0]).toHaveTextContent('Run completed'), {
      timeout: 5000,
    });
    expect(lineWith(container, 'Went back (loop 1)')).toHaveAttribute('data-tone', 'amber');
    const edge = lines(container).find((l) => l.textContent?.includes('→') && l.textContent.includes('Moved on'));
    expect(edge).toHaveAttribute('data-faded', 'true');
    expect(lineWith(container, 'Progress saved')).toHaveAttribute('data-faded', 'true');
    expect(lineWith(container, 'Run started')).toHaveAttribute('data-faded', 'false');
  });

  it('shows step names from the labels map instead of node ids', async () => {
    const { container } = render(ActivityLogHost, {
      props: { runId: 'no-such-run', labels: new Map([['code', 'Write the page']]) },
    });

    await showEverything();
    eventStore.add(checkpoint('code'));

    await waitFor(() => expect(lineWith(container, 'Progress saved')).toHaveTextContent('Write the page'));
  });

  it('indents agent events', async () => {
    const runId = await startGatedRun();
    const { container } = render(ActivityLogHost, { props: { runId } });
    await showEverything();

    eventStore.add({
      kind: 'agent_message',
      timestamp: '2026-09-25T10:00:00Z',
      node_id: 'code',
      text: 'Reading the brief',
    });

    await waitFor(() => expect(lineWith(container, 'Reading the brief')).toHaveAttribute('data-agent', 'true'));
    expect(lineWith(container, 'Reading the brief')).toHaveClass('ml-5');
  });

  it('empties the log when the run changes', async () => {
    const runId = await startGatedRun();
    const { container, rerender } = render(ActivityLogHost, { props: { runId } });
    await waitFor(() => expect(lineWith(container, 'Run started')).toBeTruthy(), {
      timeout: 5000,
    });

    await rerender({ runId: 'no-such-run' });

    await waitFor(() => expect(lines(container)).toHaveLength(0));
    expect(screen.getByText('Waiting for events...')).toBeTruthy();
  });

  describe('following new events', () => {
    it('stays at the top, showing the new line first', async () => {
      const { container } = render(ActivityLogHost, { props: { runId: 'no-such-run' } });
      const box = container.querySelector<HTMLElement>('.event-log')!;
      stubGeometry(box);
      eventStore.add(stepStarted('first'));
      await waitFor(() => expect(lines(container)).toHaveLength(1));

      eventStore.add(stepStarted('second'));

      await waitFor(() => expect(lines(container)[0]).toHaveTextContent('second'));
      expect(box.scrollTop).toBe(0);
    });

    it("keeps what I'm reading in place when I've scrolled down", async () => {
      const { container } = render(ActivityLogHost, { props: { runId: 'no-such-run' } });
      const box = container.querySelector<HTMLElement>('.event-log')!;
      stubGeometry(box);
      for (const node of ['a', 'b', 'c']) eventStore.add(stepStarted(node));
      await waitFor(() => expect(lines(container)).toHaveLength(3));
      box.scrollTop = 200;
      box.dispatchEvent(new Event('scroll'));

      eventStore.add(stepStarted('d'));

      await waitFor(() => expect(lines(container)).toHaveLength(4));
      expect(box.scrollTop).toBe(240);
    });

    it("turns off the browser's own scroll anchoring, so the shift isn't applied twice", () => {
      const { container } = render(ActivityLogHost, { props: { runId: 'no-such-run' } });

      expect(container.querySelector('.event-log')).toHaveClass('[overflow-anchor:none]');
    });
  });

  describe('Key moments and Everything', () => {
    // Fixed events, given straight to the component: no server involved.
    const EVENTS = [
      { kind: 'pipeline_started' as const, timestamp: '2026-09-25T10:00:00Z', graph_name: 'Concepts' },
      stepStarted('draft'),
      {
        kind: 'agent_tool_call_started' as const,
        timestamp: '2026-09-25T10:00:01Z',
        node_id: 'draft',
        tool_name: 'write_file',
        tool_call_id: 'c1',
      },
      {
        kind: 'human_prompt_issued' as const,
        timestamp: '2026-09-25T10:00:02Z',
        node_id: 'pick',
        question: 'Which one?',
      },
    ];

    it('starts on Key moments, with its help sentence', () => {
      const { container } = render(ActivityLog, { props: { events: EVENTS as never } });

      expect(screen.getByRole('radio', { name: 'Key moments' })).toHaveAttribute('data-state', 'on');
      expect(screen.getByRole('radio', { name: 'Everything' })).toHaveAttribute('data-state', 'off');
      expect(screen.getByText(/questions for you and loops/i)).toBeInTheDocument();
      expect(lines(container)).toHaveLength(3);
      expect(lineWith(container, 'write_file')).toBeUndefined();
    });

    it('adds tool calls, agent messages and token lines under Everything, and changes the help sentence', async () => {
      const user = userEvent.setup();
      const { container } = render(ActivityLog, { props: { events: EVENTS as never } });

      await user.click(screen.getByRole('radio', { name: 'Everything' }));

      expect(lines(container)).toHaveLength(4);
      expect(lineWith(container, 'write_file')).toHaveTextContent('Tool call');
      expect(screen.queryByText(/questions for you and loops/i)).not.toBeInTheDocument();
      expect(screen.getByText(/every tool call/i)).toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: 'Key moments' }));
      expect(lines(container)).toHaveLength(3);
    });

    it('lists newest first with a tinted background on lines that need attention', () => {
      const { container } = render(ActivityLog, { props: { events: EVENTS as never } });

      expect(lines(container)[0]).toHaveTextContent('Waiting for you');
      expect(lines(container)[0]).toHaveClass('bg-primary-subtle');
      expect(lineWith(container, 'Run started')).not.toHaveClass('bg-primary-subtle');
    });

    it('shows the time and a tone dot on each line, hiding the dot from screen readers', () => {
      const { container } = render(ActivityLog, { props: { events: EVENTS as never } });

      const line = lineWith(container, 'Run started')!;
      expect(line.querySelector('time')).toHaveTextContent(/\d/);
      expect(line.querySelector('[data-dot]')).toHaveAttribute('aria-hidden', 'true');
    });

    it('says what is empty rather than showing a blank list', () => {
      render(ActivityLog, { props: { events: [] } });

      expect(screen.getByText('Waiting for events...')).toBeInTheDocument();
    });
  });
});
