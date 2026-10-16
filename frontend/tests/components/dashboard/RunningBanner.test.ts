// ABOUTME: Tests for RunningBanner: when it shows (something active, nothing waiting on a person) and what it says
// ABOUTME: Stand-in library with the clock and time zone pinned, so the wording is exact

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import RunningBanner from '../../../src/components/dashboard/RunningBanner.svelte';
import type { RunSummary } from '../../../src/lib/api/runs';
import type { WorkflowSummary } from '../../../src/lib/api/workflows';
import { isNeedsYou } from '../../../src/lib/runStatus';

const NOW = new Date('2026-10-16T02:52:30Z');
const TZ = 'Australia/Sydney';

function run(id: string, extra: Partial<RunSummary> = {}): RunSummary {
  return {
    id,
    status: 'Running',
    started_at: '2026-10-16T02:31:00Z',
    completed_at: null,
    graph_name: `Graph ${id}`,
    error: null,
    input_tokens: 0,
    output_tokens: 0,
    run_working_dir: null,
    workflow_id: null,
    gallery_gates: [],
    pending_questions: 0,
    waiting_since: null,
    ...extra,
  };
}

const WORKFLOWS: WorkflowSummary[] = [
  { id: 'factory', name: 'product_design_factory', source_dir: 'examples', path: 'product_design_factory.dot' },
];

function library(runs: RunSummary[]) {
  return { runs, workflows: WORKFLOWS, needsYou: runs.filter(isNeedsYou) };
}

function banner() {
  return screen.queryByRole('region', { name: 'Running now' });
}

describe('RunningBanner', () => {
  it('renders nothing when no run is active', () => {
    render(RunningBanner, {
      props: { library: library([run('done', { status: 'Completed', completed_at: '2026-10-16T02:40:00Z' })]), now: NOW, timeZone: TZ },
    });
    expect(banner()).toBeNull();
  });

  it('stays out of the way while a run needs you, so only the needs-you banner shows', () => {
    render(RunningBanner, {
      props: { library: library([run('busy'), run('waiting', { pending_questions: 1 })]), now: NOW, timeZone: TZ },
    });
    expect(banner()).toBeNull();
  });

  it('names the running workflow, when it started and how long it has run, and links to it', () => {
    render(RunningBanner, {
      props: { library: library([run('r1', { workflow_id: 'factory' })]), now: NOW, timeZone: TZ },
    });

    expect(banner()).not.toBeNull();
    expect(screen.getByText('Product Design Factory is running')).toBeTruthy();
    expect(screen.getByText('Started today, 1:31 pm · 21 min 30 s so far')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open Run' })).toHaveAttribute('href', '/runs/r1');
    expect(screen.queryByRole('link', { name: /more running/ })).toBeNull();
  });

  it('features the newest active run and links to the rest', () => {
    const runs = [
      run('done', { status: 'Completed', completed_at: '2026-10-16T02:50:00Z' }),
      run('newest', { started_at: '2026-10-16T02:50:00Z' }),
      run('older', { started_at: '2026-10-16T02:00:00Z' }),
      run('oldest', { started_at: '2026-10-16T01:00:00Z' }),
    ];
    render(RunningBanner, { props: { library: library(runs), now: NOW, timeZone: TZ } });

    expect(screen.getByText('Graph newest is running')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open Run' })).toHaveAttribute('href', '/runs/newest');
    expect(screen.getByRole('link', { name: '+ 2 more running' })).toHaveAttribute('href', '/?runs=active#runs');
  });

  describe('with its own clock', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('keeps the running time up to date', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      vi.setSystemTime(NOW);
      render(RunningBanner, { props: { library: library([run('r1')]), timeZone: TZ } });
      expect(screen.getByText(/21 min 30 s so far$/)).toBeTruthy();

      await vi.advanceTimersByTimeAsync(60_000);

      expect(screen.getByText(/22 min 30 s so far$/)).toBeTruthy();
    });
  });
});
