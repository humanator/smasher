// ABOUTME: Tests for stepProgress and its helpers, which fold pipeline events into the Progress tab
// ABOUTME: Event sequences are shaped like the engine's real events; covers loops, failure, waiting, abort and replay

import { describe, it, expect } from 'vitest';
import { stepProgress, currentStep, doneCount, elapsedMs, stepMeta } from '../../src/lib/runProgress';
import { STEPS, SINGLE_PASS, LOOPED, FAILED, WAITING, ABORTED } from '../fixtures/runEvents';

function byId(progress: ReturnType<typeof stepProgress>) {
  return Object.fromEntries(progress.map((p) => [p.id, p]));
}

describe('stepProgress', () => {
  it('lists every step as pending before any event', () => {
    const progress = stepProgress(STEPS, []);
    expect(progress.map((p) => p.id)).toEqual(['start', 'draft', 'lint', 'pick', 'exit']);
    expect(progress.every((p) => p.state === 'pending' && p.runs === 0 && p.durationMs === 0)).toBe(true);
  });

  it('marks a single pass done with one run and its duration', () => {
    const steps = byId(stepProgress(STEPS, SINGLE_PASS));
    expect(steps.draft).toMatchObject({ state: 'done', runs: 1, durationMs: 10_000, wentBack: 0 });
    expect(steps.pick).toMatchObject({ state: 'done', runs: 1, durationMs: 25_000, answered: true });
    expect(doneCount(stepProgress(STEPS, SINGLE_PASS))).toBe(5);
  });

  it('counts runs, summed time and going back across a loop', () => {
    const steps = byId(stepProgress(STEPS, LOOPED));
    expect(steps.draft).toMatchObject({ state: 'done', runs: 2, durationMs: 20_000, wentBack: 1 });
    expect(steps.lint).toMatchObject({ runs: 2, durationMs: 4_000, wentBack: 0 });
    expect(steps.pick).toMatchObject({ runs: 2, durationMs: 29_000 });
    expect(steps.start.runs).toBe(1);
  });

  it('shows a step running again after a loop restart', () => {
    // Up to and including the second node_started for draft.
    const midLoop = LOOPED.slice(0, 13);
    const steps = byId(stepProgress(STEPS, midLoop));
    expect(steps.draft).toMatchObject({ state: 'running', runs: 2, wentBack: 1 });
    expect(currentStep(stepProgress(STEPS, midLoop))).toBe('draft');
  });

  it('marks the failing step failed and leaves later steps pending', () => {
    const steps = byId(stepProgress(STEPS, FAILED));
    expect(steps.lint).toMatchObject({ state: 'failed', runs: 1, durationMs: 900 });
    expect(steps.pick.state).toBe('pending');
    expect(steps.draft.state).toBe('done');
  });

  it('marks a gate waiting until it is answered', () => {
    const steps = byId(stepProgress(STEPS, WAITING));
    expect(steps.pick).toMatchObject({ state: 'waiting', answered: false });
    expect(currentStep(stepProgress(STEPS, WAITING))).toBe('pick');
    expect(doneCount(stepProgress(STEPS, WAITING))).toBe(3);
  });

  it('returns a just-answered gate to running', () => {
    const answered = [...WAITING, SINGLE_PASS.find((e) => e.kind === 'human_response_received')!];
    expect(byId(stepProgress(STEPS, answered)).pick).toMatchObject({ state: 'running', answered: true });
  });

  it('leaves a step that was active when the run was stopped as not finished', () => {
    const steps = byId(stepProgress(STEPS, ABORTED));
    expect(steps.draft).toMatchObject({ state: 'pending', runs: 1 });
    expect(currentStep(stepProgress(STEPS, ABORTED))).toBeNull();
  });

  it('has no current step once the run completes', () => {
    expect(currentStep(stepProgress(STEPS, SINGLE_PASS))).toBeNull();
  });

  it('gives the same result when the same events are replayed', () => {
    const once = stepProgress(STEPS, LOOPED);
    expect(stepProgress(STEPS, LOOPED)).toEqual(once);
    expect(stepProgress(STEPS, [...LOOPED, ...LOOPED])).toEqual(once);
    expect(stepProgress(STEPS, [...WAITING, ...WAITING])).toEqual(stepProgress(STEPS, WAITING));
  });

  it('appends steps seen only in events when there are no steps', () => {
    const progress = stepProgress([], FAILED);
    expect(progress.map((p) => p.id)).toEqual(['start', 'draft', 'lint']);
    expect(byId(progress).lint.state).toBe('failed');
  });

  it('ignores steps outside the list when a list is given', () => {
    expect(stepProgress([{ id: 'draft' }], FAILED).map((p) => p.id)).toEqual(['draft']);
  });
});

describe('elapsedMs', () => {
  const now = new Date('2026-11-02T10:05:00Z');

  it('is null with no events', () => {
    expect(elapsedMs([], now)).toBeNull();
  });

  it('runs to now while active', () => {
    expect(elapsedMs(WAITING, now)).toBe(300_000);
  });

  it('stops at the final event once the run has ended', () => {
    expect(elapsedMs(SINGLE_PASS, now)).toBe(41_000);
    expect(elapsedMs(FAILED, now)).toBe(13_000);
  });
});

describe('stepMeta', () => {
  const meta = (events: Parameters<typeof stepProgress>[1], id: string) =>
    stepMeta(byId(stepProgress(STEPS, events))[id]);

  it('describes a step that has not started', () => {
    expect(meta([], 'draft')).toBe('Not started');
  });

  it('gives a single run its duration', () => {
    expect(meta(SINGLE_PASS, 'draft')).toBe('10.0s');
  });

  it('says a step ran twice with its total time', () => {
    expect(meta(LOOPED, 'lint')).toBe('Ran twice · 4.0s');
  });

  it('says a step ran twice and went back once', () => {
    expect(meta(LOOPED, 'draft')).toBe('Ran twice · went back once');
  });

  it('says an answered gate was answered, with its time', () => {
    expect(meta(SINGLE_PASS, 'pick')).toBe('Answered · 25.0s');
  });

  it('says a gate is waiting for you', () => {
    expect(meta(WAITING, 'pick')).toBe('Waiting for you');
  });

  it('says a failed step stopped with an error', () => {
    expect(meta(FAILED, 'lint')).toBe('Stopped with an error');
  });

  it('says a step running its second time', () => {
    const second = LOOPED.slice(0, 13);
    expect(meta(second, 'draft')).toBe('Second run in progress');
  });

  it('says a first run is running', () => {
    expect(meta(FAILED.slice(0, 4), 'draft')).toBe('Running');
  });

  it('says a stopped step did not finish', () => {
    expect(meta(ABORTED, 'draft')).toBe('Stopped before it finished');
  });
});
