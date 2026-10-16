// ABOUTME: Tests for the run-status helpers: activity, filter groups, badges, needs-you and workflow status
// ABOUTME: Pure function tests with `now` and the time zone pinned

import { describe, it, expect } from 'vitest';
import {
  TERMINAL_STATUSES,
  isActive,
  isNeedsYou,
  longestWaiting,
  pickFeaturedRun,
  runGroup,
  runTitle,
  statusBadge,
  workflowStatus,
} from '../../src/lib/runStatus';
import type { RunSummary } from '../../src/lib/api/runs';

function run(id: string, status: string): RunSummary {
  return {
    id,
    status,
    started_at: '2026-09-25T00:00:00Z',
    completed_at: status === 'Running' ? null : '2026-09-25T00:01:00Z',
    graph_name: 'G',
    error: null,
    input_tokens: 0,
    output_tokens: 0,
    run_working_dir: null,
    workflow_id: 'wf',
    gallery_gates: [],
    pending_questions: 0,
    waiting_since: null,
  };
}

describe('isActive', () => {
  it('is true for Running', () => {
    expect(isActive('Running')).toBe(true);
  });

  it.each(['Completed', 'Failed', 'Aborted'])('is false for %s', (status) => {
    expect(isActive(status)).toBe(false);
    expect(TERMINAL_STATUSES.has(status)).toBe(true);
  });
});

describe('pickFeaturedRun', () => {
  it('returns null for no runs', () => {
    expect(pickFeaturedRun([])).toBeNull();
  });

  it('picks the newest Running run even when newer terminal runs exist', () => {
    const runs = [run('c', 'Completed'), run('b', 'Running'), run('a', 'Running')];

    expect(pickFeaturedRun(runs)).toEqual({ run: runs[1], heading: 'Active run', moreRunning: 1 });
  });

  it('picks the newest run as the latest run when none is running', () => {
    const runs = [run('b', 'Failed'), run('a', 'Completed')];

    expect(pickFeaturedRun(runs)).toEqual({ run: runs[0], heading: 'Latest run', moreRunning: 0 });
  });

  it('counts the other Running runs', () => {
    const runs = [run('d', 'Running'), run('c', 'Aborted'), run('b', 'Running'), run('a', 'Running')];

    expect(pickFeaturedRun(runs)?.moreRunning).toBe(2);
  });
});

describe('runGroup', () => {
  it.each([
    ['Running', 'active'],
    ['Completed', 'completed'],
    ['Failed', 'failed'],
    ['Aborted', 'failed'],
    ['SomethingNew', 'active'],
  ])('puts %s in %s', (status, group) => {
    expect(runGroup(status)).toBe(group);
  });
});

describe('statusBadge', () => {
  it.each([
    ['Running', 'secondary', 'var(--info)'],
    ['Completed', 'secondary', 'var(--success)'],
    ['Failed', 'destructive', undefined], // Home.dc.html STATUS_BADGE: the red capsule carries it, no dot
    ['Aborted', 'secondary', 'var(--foreground-tertiary)'], // #8E8E93 on the board
  ])('badges %s as %s with a %s dot', (status, variant, dot) => {
    expect(statusBadge(status)).toEqual({ label: status, variant, dot });
  });

  it('badges Needs you in the accent with no dot', () => {
    expect(statusBadge('Needs you')).toEqual({ label: 'Needs you', variant: 'default', dot: undefined });
  });

  it('badges No runs yet as an outline with no dot', () => {
    expect(statusBadge('No runs yet')).toEqual({ label: 'No runs yet', variant: 'outline', dot: undefined });
  });

  it('badges an unknown status like an active one, keeping its label', () => {
    expect(statusBadge('Paused')).toEqual({ label: 'Paused', variant: 'secondary', dot: 'var(--info)' });
  });
});

describe('isNeedsYou', () => {
  it('is true only for a Running run with pending questions', () => {
    expect(isNeedsYou({ ...run('a', 'Running'), pending_questions: 1 })).toBe(true);
    expect(isNeedsYou(run('a', 'Running'))).toBe(false);
    expect(isNeedsYou({ ...run('a', 'Failed'), pending_questions: 1 })).toBe(false);
  });
});

describe('workflowStatus', () => {
  // 1:00 pm on Friday 16 October 2026 in Sydney.
  const NOW = new Date('2026-10-16T02:00:00Z');
  const TZ = 'Australia/Sydney';

  function wfRun(overrides: Partial<RunSummary>): RunSummary {
    return { ...run('r', 'Completed'), workflow_id: 'wf', ...overrides };
  }

  it('says No runs yet with a dash when the workflow has never run', () => {
    const others = [wfRun({ workflow_id: 'other' })];
    expect(workflowStatus('wf', others, NOW, TZ)).toEqual({ status: 'No runs yet', lastActivity: '—' });
  });

  it('says Needs you, waiting since the oldest question, when a run is waiting', () => {
    const runs = [
      wfRun({ id: 'b', status: 'Running', completed_at: null, pending_questions: 1, waiting_since: '2026-10-15T23:42:00Z' }),
      wfRun({ id: 'a', status: 'Running', completed_at: null, pending_questions: 2, waiting_since: '2026-10-15T05:20:00Z' }),
    ];
    expect(workflowStatus('wf', runs, NOW, TZ)).toEqual({
      status: 'Needs you',
      lastActivity: 'Waiting since yesterday, 4:20 pm',
    });
  });

  it('puts Needs you ahead of a newer active run', () => {
    const runs = [
      wfRun({ id: 'b', status: 'Running', completed_at: null, started_at: '2026-10-16T01:00:00Z' }),
      wfRun({ id: 'a', status: 'Running', completed_at: null, pending_questions: 1, waiting_since: '2026-10-15T23:42:00Z' }),
    ];
    expect(workflowStatus('wf', runs, NOW, TZ).status).toBe('Needs you');
  });

  it('says Running since the newest active run started', () => {
    const runs = [
      wfRun({ id: 'c', status: 'Completed', completed_at: '2026-10-16T01:30:00Z' }),
      wfRun({ id: 'b', status: 'Running', completed_at: null, started_at: '2026-10-15T23:42:00Z' }),
    ];
    expect(workflowStatus('wf', runs, NOW, TZ)).toEqual({ status: 'Running', lastActivity: 'Since today, 10:42 am' });
  });

  it.each(['Completed', 'Failed', 'Aborted'])('shows the latest %s run with when it finished', (status) => {
    const runs = [
      wfRun({ id: 'b', status, started_at: '2026-10-09T04:40:00Z', completed_at: '2026-10-09T04:48:00Z' }),
      wfRun({ id: 'a', status: 'Completed', completed_at: '2026-10-01T00:00:00Z' }),
    ];
    expect(workflowStatus('wf', runs, NOW, TZ)).toEqual({ status, lastActivity: 'Fri 9 Oct, 3:48 pm' });
  });

  it('falls back to the start time when a finished run has no completed_at', () => {
    const runs = [wfRun({ status: 'Aborted', started_at: '2026-10-09T04:48:00Z', completed_at: null })];
    expect(workflowStatus('wf', runs, NOW, TZ).lastActivity).toBe('Fri 9 Oct, 3:48 pm');
  });
});

describe('runTitle', () => {
  const workflows = [{ id: 'w1', name: 'design_concepts_review', source_dir: 'examples', path: 'x.dot' }];

  it("uses the run's workflow title when the workflow is known", () => {
    expect(runTitle({ ...run('r', 'Running'), workflow_id: 'w1', graph_name: 'G' }, workflows)).toBe('Design Concepts Review');
  });

  it('falls back to the graph name, then "Unnamed workflow"', () => {
    expect(runTitle({ ...run('r', 'Running'), workflow_id: 'gone', graph_name: 'Graph' }, workflows)).toBe('Graph');
    expect(runTitle({ ...run('r', 'Running'), graph_name: '  ' }, workflows)).toBe('Unnamed workflow');
    expect(runTitle({ ...run('r', 'Running'), graph_name: null }, [])).toBe('Unnamed workflow');
  });
});

describe('longestWaiting', () => {
  const waiting = (id: string, since: string | null) => ({ ...run(id, 'Running'), pending_questions: 1, waiting_since: since });

  it('is null when nothing is waiting', () => {
    expect(longestWaiting([])).toBeNull();
  });

  it('picks the earliest waiting_since', () => {
    const runs = [waiting('a', '2026-10-16T02:00:00Z'), waiting('b', '2026-10-16T01:00:00Z'), waiting('c', '2026-10-16T03:00:00Z')];
    expect(longestWaiting(runs)?.id).toBe('b');
  });

  it('puts runs without a waiting_since last, keeping list order between them', () => {
    expect(longestWaiting([waiting('a', null), waiting('b', '2026-10-16T02:00:00Z')])?.id).toBe('b');
    expect(longestWaiting([waiting('a', null), waiting('b', null)])?.id).toBe('a');
  });
});
