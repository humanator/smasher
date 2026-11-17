// ABOUTME: Tests for RunsPage, the Recent runs screen: the banners over the filtered runs table, and nothing else
// ABOUTME: Stand-in libraries for exact content, plus one real submitted run listed through the real store

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import RunsPage from '../../../src/components/dashboard/RunsPage.svelte';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import type { RunSummary } from '../../../src/lib/api/runs';
import { isNeedsYou } from '../../../src/lib/runStatus';
import { ANONYMOUS_GATE, submitGraph, cancelAll } from '../../fixtures/graphs';

function run(id: string, status: string, extra: Partial<RunSummary> = {}): RunSummary {
  return {
    id,
    status,
    started_at: '2026-10-16T02:30:00Z',
    completed_at: status === 'Running' ? null : '2026-10-16T02:37:48Z',
    graph_name: `Graph ${id}`,
    error: null,
    input_tokens: 0,
    output_tokens: 0,
    run_working_dir: null,
    workflow_id: null,
    gallery_gates: [],
    pending_questions: 0,
    waiting_since: null,
    resumable: false,
    ...extra,
  };
}

function library(runs: RunSummary[]) {
  return { runs, needsYou: runs.filter(isNeedsYou), workflows: [], loaded: true, error: null };
}

describe('RunsPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    window.history.replaceState(null, '', '/');
    await cancelAll();
  });

  it('shows the runs table with its filter, and no workflows table or search', () => {
    window.history.replaceState(null, '', '/runs');
    render(RunsPage, { props: { library: library([run('done-1', 'Completed'), run('failed-1', 'Failed')]) } });

    expect(screen.getByRole('heading', { level: 2, name: 'Recent runs' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Show runs' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Runs' })).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'All workflows' })).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('restores the filter from ?runs=', () => {
    window.history.replaceState(null, '', '/runs?runs=failed');
    render(RunsPage, { props: { library: library([run('done-1', 'Completed'), run('failed-1', 'Failed')]) } });

    expect(screen.getByRole('radio', { name: /^Failed or stopped/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('link', { name: 'done-1' })).toBeNull();
    expect(screen.getByRole('link', { name: 'failed-1' })).toBeTruthy();
  });

  it('shows the needs-you banner when a run is waiting on a person', () => {
    render(RunsPage, {
      props: { library: library([run('no-such-waiting', 'Running', { pending_questions: 1, waiting_since: '2026-10-16T02:42:00Z' })]) },
    });

    expect(screen.getByRole('region', { name: 'Waiting for you' })).toBeTruthy();
  });

  it('shows the running banner when a run is running and nothing waits', () => {
    render(RunsPage, { props: { library: library([run('running-1', 'Running')]) } });

    expect(screen.getByRole('region', { name: 'Running now' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Waiting for you' })).toBeNull();
  });

  it('lists a real submitted run from the real library', async () => {
    const id = await submitGraph(ANONYMOUS_GATE);
    const store = createLibraryStore();
    store.start();
    try {
      render(RunsPage, { props: { library: store } });
      expect(await screen.findByRole('link', { name: id }, { timeout: 5000 })).toHaveAttribute('href', `/runs/${id}`);
    } finally {
      store.stop();
    }
  });
});
