// ABOUTME: Tests for EventLog component
// ABOUTME: Streams real runs' SSE events (incl. Task 6b replay) from the real smasher-web API

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import EventLog from '../../../src/components/dashboard/EventLog.svelte';
import { eventStore } from '../../../src/stores/events.svelte';
import * as native from '../../../src/lib/native/index';
import * as runsApi from '../../../src/lib/api/runs';
import * as questionsApi from '../../../src/lib/api/questions';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

// One interviewer gate and no LLM nodes: the run parks on a real question
// until a test answers (-> pipeline_completed) or cancels (-> pipeline_aborted).
const GATED_DOT = `digraph EventLogGated {
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

async function answerGate(runId: string): Promise<void> {
  let questionId: string | undefined;
  await waitFor(
    async () => {
      questionId = (await questionsApi.listQuestions(runId)).questions[0]?.id;
      expect(questionId).toBeTruthy();
    },
    { timeout: 5000, interval: 100 }
  );
  await questionsApi.answerQuestion(runId, questionId!, 'go');
}

describe('EventLog', () => {
  // The OS notification is the one boundary jsdom can't provide (no Tauri,
  // no Notification API), so the shim is spied rather than exercised.
  let notifySpy: MockInstance<
    Parameters<typeof native.showNotification>,
    ReturnType<typeof native.showNotification>
  >;

  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  beforeEach(() => {
    eventStore.clear();
    notifySpy = vi.spyOn(native, 'showNotification').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Unmount first, so cancelling a parked run below can't notify after the
    // spy is restored.
    cleanup();
    // Don't leave runs parked on the gate in the shared dev server.
    await Promise.all(runIds.map((id) => runsApi.cancelRun(id).catch(() => undefined)));
    runIds = [];
    notifySpy.mockRestore();
  });

  it('renders empty state initially', async () => {
    const runId = await startGatedRun();
    render(EventLog, { props: { runId } });
    expect(screen.getByText('Waiting for events...')).toBeTruthy();
  });

  it('displays the real run events replayed from the start, formatted', async () => {
    const runId = await startGatedRun();
    const { container } = render(EventLog, { props: { runId } });

    // The run parks on the gate right after this event.
    await screen.findByText('Node started: gate (Interviewer)', {}, { timeout: 5000 });
    expect(screen.getByText('Pipeline started: EventLogGated')).toBeTruthy();
    expect(screen.getByText('Edge: start → gate')).toBeTruthy();
    expect(container.querySelectorAll('.event-item').length).toBe(eventStore.events.length);
  });

  it('shows completion status and a native notification when the pipeline completes', async () => {
    const runId = await startGatedRun();
    render(EventLog, { props: { runId } });

    await answerGate(runId);

    await screen.findByText('Pipeline complete', {}, { timeout: 5000 });
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notifySpy.mock.calls[0][0]).toMatch(/complete/i);
  });

  it('shows a native notification when the pipeline aborts', async () => {
    const runId = await startGatedRun();
    render(EventLog, { props: { runId } });
    await screen.findByText('Node started: gate (Interviewer)', {}, { timeout: 5000 });

    await runsApi.cancelRun(runId);

    await waitFor(() => expect(notifySpy).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(notifySpy.mock.calls[0][0]).toMatch(/abort/i);
  });

  it('does not notify twice if the component re-renders after completion', async () => {
    const runId = await startGatedRun();
    const { rerender } = render(EventLog, { props: { runId } });

    await answerGate(runId);
    await screen.findByText('Pipeline complete', {}, { timeout: 5000 });
    await rerender({ runId });
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(notifySpy).toHaveBeenCalledTimes(1);
  });
});
