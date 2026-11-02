// ABOUTME: Tests for heroModel, which words the run page's hero for each run state
// ABOUTME: Uses hand-written runs, steps and the recorded event sequences from the fixtures

import { describe, it, expect } from 'vitest';
import { heroModel, resumeStepLabel, type HeroInputs } from '../../src/lib/runHero';
import type { RunSummary, DecisionResponse } from '../../src/lib/api/runs';
import { ABORTED, FAILED, SINGLE_PASS } from '../fixtures/runEvents';

const STEPS = [
  { id: 'start', node_type: 'Start' },
  { id: 'draft', node_type: 'Codergen', label: 'Draft three concepts' },
  { id: 'lint', node_type: 'Tool', label: 'Check against design system' },
  { id: 'pick', node_type: 'Interviewer', label: 'Pick a favourite' },
  { id: 'exit', node_type: 'Exit' },
];

const RUN: RunSummary = {
  id: 'r1',
  status: 'Running',
  started_at: '2026-11-02T10:00:00Z',
  completed_at: null,
  graph_name: null,
  error: null,
  input_tokens: 0,
  output_tokens: 0,
  run_working_dir: null,
  workflow_id: null,
  gallery_gates: [],
  pending_questions: 0,
  waiting_since: null,
  resumable: false,
};

function inputs(over: Partial<Omit<HeroInputs, 'run'>> & { run?: Partial<RunSummary> } = {}): HeroInputs {
  const { run, ...rest } = over;
  return {
    run: { ...RUN, ...run },
    steps: STEPS,
    events: [],
    decisions: [],
    question: null,
    now: new Date('2026-11-02T10:05:00Z'),
    ...rest,
  };
}

const decision = (d: Partial<DecisionResponse>): DecisionResponse => ({
  node_id: 'pick',
  selected: [],
  decision: 'approve',
  comments: {},
  timestamp: '2026-11-02T10:03:00Z',
  ...d,
});

describe('heroModel', () => {
  it('names the running step and what its kind does', () => {
    const events = SINGLE_PASS.slice(0, 5); // draft has started
    const hero = heroModel(inputs({ events }));
    expect(hero).toMatchObject({ state: 'running', heading: 'Draft three concepts', iterating: false });
    expect(hero.state === 'running' && hero.text).toContain('AI');
  });

  it('says it is getting started before any step has begun', () => {
    expect(heroModel(inputs())).toMatchObject({ state: 'running', heading: 'Getting started' });
  });

  it('says it is making new candidates after an iterate decision', () => {
    const events = [
      ...SINGLE_PASS.slice(0, 5),
      { kind: 'loop_restarted', timestamp: '2026-11-02T10:04:00Z', from: 'pick', to: 'draft', restart_count: 1 },
    ] as HeroInputs['events'];
    const hero = heroModel(inputs({ events, decisions: [decision({ decision: 'iterate' })] }));
    expect(hero).toMatchObject({
      state: 'running',
      heading: 'Making new candidates from your notes',
      text: 'Your decision was recorded. The workflow has gone back to Draft three concepts for another round.',
      iterating: true,
    });
  });

  it('asks a waiting run\'s question under the gate title', () => {
    const hero = heroModel(
      inputs({ run: { pending_questions: 1 }, events: SINGLE_PASS.slice(0, 12), question: 'Which concept?' })
    );
    expect(hero).toEqual({ state: 'waiting', eyebrow: 'Pick a favourite · Ask a person', heading: 'Which concept?' });
  });

  it('does not repeat the question in the eyebrow when the gate is titled with it', () => {
    const hero = heroModel(
      inputs({ run: { pending_questions: 1 }, events: SINGLE_PASS.slice(0, 12), question: 'Pick a favourite' })
    );
    expect(hero).toEqual({ state: 'waiting', eyebrow: 'Ask a person', heading: 'Pick a favourite' });
  });

  it('says how long a completed run took and that every step ran', () => {
    const hero = heroModel(inputs({ run: { status: 'Completed', completed_at: '2026-11-02T10:10:35Z' } }));
    expect(hero).toEqual({ state: 'completed', heading: 'Finished in 10 min 35 s', text: 'All 5 steps ran to the end.' });
  });

  it('names what the person approved when a decision exists', () => {
    const hero = heroModel(
      inputs({
        run: { status: 'Completed', completed_at: '2026-11-02T10:10:35Z' },
        decisions: [decision({ selected: ['concept-a'] })],
      })
    );
    expect(hero).toMatchObject({ text: 'You approved concept-a. The workflow then ran to the end.' });
  });

  it('names what the person approved when the gate spelled the approval proceed', () => {
    const hero = heroModel(
      inputs({
        run: { status: 'Completed', completed_at: '2026-11-02T10:10:35Z' },
        decisions: [decision({ decision: 'proceed', selected: ['concept-b'] })],
      })
    );
    expect(hero).toMatchObject({ text: 'You approved concept-b. The workflow then ran to the end.' });
  });

  it('names the failed step, drops its label from the message and gives advice', () => {
    const events = [
      ...SINGLE_PASS.slice(0, 8),
      {
        kind: 'node_failed',
        timestamp: '2026-11-02T10:00:14Z',
        node_id: 'lint',
        error: 'x',
        will_retry: false,
        duration_ms: 10,
      },
    ] as HeroInputs['events'];
    const hero = heroModel(
      inputs({
        run: { status: 'Failed', error: "node 'lint' failed with no available route: missing candidate_dir" },
        events,
      })
    );
    expect(hero.state).toBe('failed');
    if (hero.state !== 'failed') return;
    expect(hero.heading).toBe("Check against design system couldn't finish");
    expect(hero.message).toBe('Missing candidate_dir.');
    expect(hero.advice[0]).toContain('candidate_dir');
  });

  it('names the step from the error when no events arrived', () => {
    const hero = heroModel(
      inputs({ run: { status: 'Failed', error: "node 'draft' failed with no available route: boom" } })
    );
    expect(hero).toMatchObject({ state: 'failed', heading: "Draft three concepts couldn't finish" });
  });

  it('falls back to a generic heading and advice with no error', () => {
    const hero = heroModel(inputs({ run: { status: 'Failed' } }));
    expect(hero).toMatchObject({ state: 'failed', heading: "This run couldn't finish", message: null });
    expect(hero.state === 'failed' && hero.advice).toHaveLength(1);
  });

  it('calls an aborted run Stopped by you', () => {
    expect(heroModel(inputs({ run: { status: 'Aborted' } }))).toMatchObject({
      state: 'aborted',
      heading: 'Stopped by you',
    });
  });
});

describe('resumeStepLabel', () => {
  it('names the step that failed', () => {
    const events = [...FAILED] as HeroInputs['events'];
    const label = resumeStepLabel(inputs({ run: { status: 'Failed', error: "node 'lint' failed" }, events }));
    expect(label).toBe('Check against design system');
  });

  it('names the step from the error when no events arrived', () => {
    expect(resumeStepLabel(inputs({ run: { status: 'Failed', error: "node 'draft' failed with no available route: boom" } }))).toBe(
      'Draft three concepts'
    );
  });

  it('names the step that was running when the run was stopped', () => {
    const label = resumeStepLabel(inputs({ run: { status: 'Aborted' }, events: ABORTED as HeroInputs['events'] }));
    expect(label).toBe('Draft three concepts');
  });

  it('is null when nothing says which step', () => {
    expect(resumeStepLabel(inputs({ run: { status: 'Failed' } }))).toBeNull();
  });
});
