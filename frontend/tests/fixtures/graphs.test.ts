// ABOUTME: Proves each inline test graph behaves as the batch-2 specs assume
// ABOUTME: Submits every graph to the real smasher-web API; nothing reaches an LLM

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { waitFor } from '@testing-library/svelte/svelte5';
import { setApiBaseUrl } from '../../src/lib/api/client-config';
import * as runsApi from '../../src/lib/api/runs';
import * as questionsApi from '../../src/lib/api/questions';
import type { Question } from '../../src/lib/api/questions';
import { subscribeToPipelineEvents, type PipelineEvent } from '../../src/lib/api/events';
import {
  RUN_FAIL_CHECK,
  QUESTION_KINDS,
  LOOP_CHECK,
  ANONYMOUS_GATE,
  submitGraph,
  cancelAll,
} from './graphs';

async function nextQuestion(runId: string, notId?: string): Promise<Question> {
  let question: Question | undefined;
  await waitFor(
    async () => {
      question = (await questionsApi.listQuestions(runId)).questions.find((q) => q.id !== notId);
      expect(question).toBeTruthy();
    },
    { timeout: 5000, interval: 100 }
  );
  return question!;
}

async function waitForStatus(runId: string, status: string): Promise<runsApi.RunSummary> {
  let run: runsApi.RunSummary | undefined;
  await waitFor(
    async () => {
      run = await runsApi.getRun(runId);
      expect(run.status).toBe(status);
    },
    { timeout: 5000, interval: 100 }
  );
  return run!;
}

describe('test graphs', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  it('contain no LLM node, and every tool node has unparseable args', () => {
    for (const dot of [RUN_FAIL_CHECK, QUESTION_KINDS, LOOP_CHECK, ANONYMOUS_GATE]) {
      expect(dot).not.toMatch(/shape\s*=\s*"?(box|rectangle)\b/);
      const toolNodes = dot.split('\n').filter((line) => /shape\s*=\s*"?parallelogram/.test(line));
      for (const line of toolNodes) {
        const args = line.match(/args\s*=\s*"((?:[^"\\]|\\.)*)"/)?.[1];
        expect(args).toBeDefined();
        expect(() => JSON.parse(args!.replace(/\\"/g, '"'))).toThrow();
      }
    }
  });

  it('RUN_FAIL_CHECK fails with the invalid-args error and a completion time', async () => {
    const runId = await submitGraph(RUN_FAIL_CHECK);

    const run = await waitForStatus(runId, 'Failed');

    expect(run.error).toContain('invalid JSON in args attribute');
    expect(run.completed_at).toBeTruthy();
  });

  it('QUESTION_KINDS asks multiple choice, then approval, then free form, then completes', async () => {
    const runId = await submitGraph(QUESTION_KINDS);

    const pick = await nextQuestion(runId);
    expect(pick.kind).toBe('multiple_choice');
    expect(pick.choices).toEqual(['Red', 'Blue', 'Green']);
    await questionsApi.answerQuestion(runId, pick.id, 'Blue');

    const ok = await nextQuestion(runId, pick.id);
    expect(ok.kind).toBe('approval');
    await questionsApi.answerQuestion(runId, ok.id, 'yes');

    const text = await nextQuestion(runId, ok.id);
    expect(text.kind).toBe('free_form');
    await questionsApi.answerQuestion(runId, text.id, 'hello');

    await waitForStatus(runId, 'Completed');
  });

  it('LOOP_CHECK restarts once on "again", asks again, and completes on "done"', async () => {
    const runId = await submitGraph(LOOP_CHECK);
    const events: PipelineEvent[] = [];
    const unsubscribe = subscribeToPipelineEvents(runId, (e) => events.push(e));

    try {
      const first = await nextQuestion(runId);
      await questionsApi.answerQuestion(runId, first.id, 'again');

      await waitFor(
        () => {
          const restart = events.find((e) => e.kind === 'loop_restarted');
          expect(restart).toMatchObject({ restart_count: 1 });
        },
        { timeout: 5000, interval: 100 }
      );

      const second = await nextQuestion(runId, first.id);
      await questionsApi.answerQuestion(runId, second.id, 'done');

      await waitForStatus(runId, 'Completed');
    } finally {
      unsubscribe();
    }
  });

  it('ANONYMOUS_GATE gives a run with no graph name', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);

    const run = await runsApi.getRun(runId);

    expect(run.graph_name).toBeNull();
  });
});
