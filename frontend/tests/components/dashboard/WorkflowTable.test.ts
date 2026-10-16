// ABOUTME: Tests for WorkflowTable, the dashboard's "All workflows" table
// ABOUTME: Pure props in, so every state renders without the server; `now` and the time zone are pinned

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import WorkflowTable from '../../../src/components/dashboard/WorkflowTable.svelte';
import type { RunSummary } from '../../../src/lib/api/runs';
import type { WorkflowSummary } from '../../../src/lib/api/workflows';

const NOW = new Date('2026-10-16T03:00:00Z'); // 2 pm in Sydney

function workflow(id: string, name: string, source_dir = 'examples'): WorkflowSummary {
  return { id, name, source_dir, path: `${source_dir}/${name}` };
}

function run(workflowId: string, status: string, extra: Partial<RunSummary> = {}): RunSummary {
  return {
    id: `${workflowId}-${status}`,
    status,
    started_at: '2026-10-15T23:30:00Z',
    completed_at: status === 'Running' ? null : '2026-10-15T23:42:00Z',
    graph_name: 'G',
    error: null,
    input_tokens: 0,
    output_tokens: 0,
    run_working_dir: null,
    workflow_id: workflowId,
    gallery_gates: [],
    pending_questions: 0,
    waiting_since: null,
    ...extra,
  };
}

const WORKFLOWS = [
  workflow('wf-gate', 'design_concepts_review.dot'),
  workflow('wf-run', 'nightly_build.dot', 'pipelines'),
  workflow('wf-done', 'hello_world.dot'),
  workflow('wf-fail', 'broken_thing.dot'),
  workflow('wf-stop', 'stopped_early.dot'),
  workflow('wf-new', 'brand_new.dot'),
];

const RUNS = [
  run('wf-gate', 'Running', { pending_questions: 1, waiting_since: '2026-10-16T02:54:00Z' }),
  run('wf-run', 'Running'),
  run('wf-done', 'Completed'),
  run('wf-fail', 'Failed'),
  run('wf-stop', 'Aborted', { completed_at: null }),
];

function renderTable(props: Record<string, unknown> = {}) {
  const handlers = { onRun: vi.fn(), onRetry: vi.fn(), onImport: vi.fn() };
  render(WorkflowTable, {
    props: {
      workflows: WORKFLOWS,
      runs: RUNS,
      now: NOW,
      timeZone: 'Australia/Sydney',
      query: '',
      loading: false,
      error: null,
      ...handlers,
      ...props,
    },
  });
  return handlers;
}

function rowFor(title: string): HTMLElement {
  return screen.getByRole('link', { name: title }).closest('[role="row"]') as HTMLElement;
}

describe('WorkflowTable', () => {
  it('has the heading, intro copy and column headers', () => {
    renderTable();

    expect(screen.getByRole('heading', { level: 2, name: 'All workflows' })).toBeTruthy();
    expect(
      screen.getByText('A workflow is a saved set of steps. Open one to see its runs, edit it, or start a new run.')
    ).toBeTruthy();
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Name', 'Status', 'Last activity', 'Location', 'Actions']);
  });

  it('shows one row per workflow with its title link, file name and location', () => {
    renderTable();

    // A header row plus one per workflow.
    expect(screen.getAllByRole('row')).toHaveLength(WORKFLOWS.length + 1);
    const link = screen.getByRole('link', { name: 'Nightly Build' });
    expect(link).toHaveAttribute('href', '/workflows/wf-run');
    const row = rowFor('Nightly Build');
    expect(within(row).getByText('nightly_build.dot')).toBeTruthy();
    expect(within(row).getByText('pipelines')).toBeTruthy();
  });

  it.each([
    ['Design Concepts Review', 'Needs you', 'Waiting since today, 1:54 pm'],
    ['Nightly Build', 'Running', 'Since today, 10:30 am'],
    ['Hello World', 'Completed', 'Today, 10:42 am'],
    ['Broken Thing', 'Failed', 'Today, 10:42 am'],
    ['Stopped Early', 'Aborted', 'Today, 10:30 am'],
    ['Brand New', 'No runs yet', '—'],
  ])('shows %s as %s with "%s"', (title, status, lastActivity) => {
    renderTable();

    const row = rowFor(title);
    expect(within(row).getByText(status)).toBeTruthy();
    expect(within(row).getByText(lastActivity)).toBeTruthy();
  });

  it('links Edit to the editor and calls onRun with the workflow from Run…', async () => {
    const { onRun } = renderTable();

    const row = rowFor('Hello World');
    expect(within(row).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/workflows/wf-done/edit');
    await userEvent.click(within(row).getByRole('button', { name: 'Run…' }));
    expect(onRun).toHaveBeenCalledWith(WORKFLOWS[2]);
  });

  it('encodes workflow ids in both links', () => {
    renderTable({ workflows: [workflow('a b/c', 'odd.dot')], runs: [] });

    expect(screen.getByRole('link', { name: 'Odd' })).toHaveAttribute('href', '/workflows/a%20b%2Fc');
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/workflows/a%20b%2Fc/edit');
  });

  it('zebra-stripes rows with a token, not hex', () => {
    renderTable();

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[1].className).toContain('bg-muted');
    expect(rows[0].className).not.toContain('bg-muted');
    expect(rows.map((r) => r.getAttribute('style') ?? '').join('')).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  describe('search', () => {
    it.each([
      ['title, any case', 'NIGHTLY', ['Nightly Build']],
      ['file name', 'broken_thing.dot', ['Broken Thing']],
      ['surrounding spaces', '  hello  ', ['Hello World']],
      ['part of a word in two titles', 'ken', ['Broken Thing']],
      ['a fragment two names share', '_', WORKFLOWS.map((w) => w.name).filter((n) => n.includes('_')).length],
    ])('matches on %s', (_label, query, expected) => {
      renderTable({ query });

      const rows = screen.getAllByRole('row').slice(1);
      if (typeof expected === 'number') {
        expect(rows).toHaveLength(expected);
      } else {
        expect(rows.map((r) => within(r).getAllByRole('link')[0].textContent?.trim())).toEqual(expected);
      }
    });

    it('treats a blank query as no search', () => {
      renderTable({ query: '   ' });

      expect(screen.getAllByRole('row')).toHaveLength(WORKFLOWS.length + 1);
    });

    it('says so when nothing matches', () => {
      renderTable({ query: 'zzz' });

      expect(screen.getByText('No workflows match that search.')).toBeTruthy();
      expect(screen.getAllByRole('row')).toHaveLength(1);
    });
  });

  it('shows a 3-row skeleton while loading', () => {
    renderTable({ loading: true, workflows: [] });

    const table = screen.getByRole('table', { name: 'All workflows' });
    expect(table.getAttribute('aria-busy')).toBe('true');
    expect(table.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText(/No workflows yet/)).toBeNull();
  });

  it('shows an inline error with Try Again', async () => {
    const { onRetry } = renderTable({ error: 'connection refused', workflows: [] });

    expect(screen.getByRole('alert').textContent).toContain('connection refused');
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('offers New Workflow and Import .dot File when there are no workflows', async () => {
    const { onImport } = renderTable({ workflows: [], runs: [] });

    expect(screen.getByText('No workflows yet. Create one or import a .dot file.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'New Workflow' })).toHaveAttribute('href', '/workflows/new');
    await userEvent.click(screen.getByRole('button', { name: 'Import .dot File' }));
    expect(onImport).toHaveBeenCalled();
  });
});
