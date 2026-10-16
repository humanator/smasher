// ABOUTME: Tests for RunList, the dashboard's Recent runs: filter toggle with counts, ?runs= sync and empty states
// ABOUTME: Fixture runs in a stand-in library for exact counts, plus one pass against the real library store

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RunList from '../../../src/components/dashboard/RunList.svelte';
import { createLibraryStore } from '../../../src/stores/library.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import type { RunSummary } from '../../../src/lib/api/runs';
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
    ...extra,
  };
}

// Newest first, as the server lists them.
const RUNS = [
  run('running-1', 'Running'),
  run('waiting-1', 'Running', { pending_questions: 1 }),
  run('done-1', 'Completed'),
  run('done-2', 'Completed'),
  run('failed-1', 'Failed'),
  run('aborted-1', 'Aborted'),
];

function library(runs: RunSummary[] = RUNS, loaded = true) {
  return { runs, workflows: [], loaded, error: null };
}

function visit(url: string) {
  window.history.replaceState(null, '', url);
}

function shownIds(): string[] {
  const table = screen.queryByRole('table', { name: 'Runs' });
  if (!table) return [];
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getByRole('link').textContent!.trim());
}

describe('RunList', () => {
  afterEach(() => {
    visit('/');
  });

  it('has the heading, intro copy and a filter group', () => {
    render(RunList, { props: { library: library() } });

    expect(screen.getByRole('heading', { level: 2, name: 'Recent runs' })).toBeTruthy();
    expect(screen.getByText(/Every time a workflow runs, it shows up here\./)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Show runs' })).toBeTruthy();
    expect(document.getElementById('runs')).toBeTruthy();
  });

  it('labels each filter with its live count', () => {
    render(RunList, { props: { library: library() } });

    const names = screen.getAllByRole('radio').map((r) => r.textContent?.replace(/\s+/g, ' ').trim());
    expect(names).toEqual(['All 6', 'Active 2', 'Completed 2', 'Failed or stopped 2']);
  });

  it('shows every run under All, newest first', () => {
    render(RunList, { props: { library: library() } });

    expect(shownIds()).toEqual(RUNS.map((r) => r.id));
  });

  it.each([
    ['Active', 'active', ['running-1', 'waiting-1']],
    ['Completed', 'completed', ['done-1', 'done-2']],
    ['Failed or stopped', 'failed', ['failed-1', 'aborted-1']],
  ])('shows only %s runs and puts ?runs=%s in the URL', async (label, param, ids) => {
    const user = userEvent.setup();
    render(RunList, { props: { library: library() } });

    await user.click(screen.getByRole('radio', { name: new RegExp(`^${label}`) }));

    expect(shownIds()).toEqual(ids);
    expect(window.location.search).toBe(`?runs=${param}`);
  });

  it('drops ?runs= from the URL when going back to All', async () => {
    visit('/?runs=failed');
    const user = userEvent.setup();
    render(RunList, { props: { library: library() } });

    await user.click(screen.getByRole('radio', { name: /^All/ }));

    expect(window.location.search).toBe('');
    expect(shownIds()).toHaveLength(RUNS.length);
  });

  it('keeps the #runs anchor when the filter changes', async () => {
    visit('/#runs');
    const user = userEvent.setup();
    render(RunList, { props: { library: library() } });

    await user.click(screen.getByRole('radio', { name: /^Completed/ }));

    expect(window.location.hash).toBe('#runs');
  });

  it('restores the filter from ?runs= on load', () => {
    visit('/?runs=failed');
    render(RunList, { props: { library: library() } });

    expect(screen.getByRole('radio', { name: /^Failed or stopped/ })).toHaveAttribute('aria-checked', 'true');
    expect(shownIds()).toEqual(['failed-1', 'aborted-1']);
  });

  it('selects Active with needs-you runs first for ?runs=needs-you', () => {
    visit('/?runs=needs-you#runs');
    render(RunList, { props: { library: library() } });

    expect(screen.getByRole('radio', { name: /^Active/ })).toHaveAttribute('aria-checked', 'true');
    expect(shownIds()).toEqual(['waiting-1', 'running-1']);
  });

  it('falls back to All for an unknown ?runs= value', () => {
    visit('/?runs=garbage');
    render(RunList, { props: { library: library() } });

    expect(screen.getByRole('radio', { name: /^All/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('follows back and forward', async () => {
    render(RunList, { props: { library: library() } });

    window.history.pushState(null, '', '/?runs=completed');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await waitFor(() => expect(shownIds()).toEqual(['done-1', 'done-2']));
  });

  it('keeps one filter selected when the selected one is clicked again', async () => {
    const user = userEvent.setup();
    render(RunList, { props: { library: library() } });

    await user.click(screen.getByRole('radio', { name: /^All/ }));

    expect(screen.getByRole('radio', { name: /^All/ })).toHaveAttribute('aria-checked', 'true');
    expect(shownIds()).toHaveLength(RUNS.length);
  });

  it('says there are no runs yet when there are none at all', () => {
    render(RunList, { props: { library: library([]) } });

    expect(screen.getByText('No runs yet. Run a workflow to see it here.')).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'Runs' })).toBeNull();
  });

  it('says the view is empty when the filter matches nothing', () => {
    visit('/?runs=failed');
    render(RunList, { props: { library: library([run('done-1', 'Completed')]) } });

    expect(screen.getByText('No runs in this view.')).toBeTruthy();
  });

  it('says it is loading before the library has loaded', () => {
    render(RunList, { props: { library: library([], false) } });

    expect(screen.getByText('Loading runs…')).toBeTruthy();
    expect(screen.queryByText(/No runs yet/)).toBeNull();
  });

  describe('real library', () => {
    const stores: ReturnType<typeof createLibraryStore>[] = [];

    beforeAll(() => {
      setApiBaseUrl('http://127.0.0.1:21541/api');
    });

    afterEach(async () => {
      stores.splice(0).forEach((s) => s.stop());
      await cancelAll();
    });

    it('lists a real submitted run, linked to its page', async () => {
      const id = await submitGraph(ANONYMOUS_GATE);
      const store = createLibraryStore();
      stores.push(store);
      store.start();

      render(RunList, { props: { library: store } });

      const link = await screen.findByRole('link', { name: id }, { timeout: 5000 });
      expect(link).toHaveAttribute('href', `/runs/${id}`);
    });
  });
});
