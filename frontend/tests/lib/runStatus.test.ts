// ABOUTME: Tests for the run-status helpers, isActive and pickFeaturedRun
// ABOUTME: Pure function tests: which statuses count as active, and which run a workflow card features

import { describe, it, expect } from 'vitest';
import { TERMINAL_STATUSES, isActive, pickFeaturedRun } from '../../src/lib/runStatus';
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
