// ABOUTME: Tests for RunTable, the runs table shared by the dashboard's Recent runs and the workflow page
// ABOUTME: Fixture runs with `now` and the time zone pinned, plus one pass over real runs from GET /api/runs

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import RunTable from '../../../src/components/dashboard/RunTable.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import type { RunSummary } from '../../../src/lib/api/runs';
import type { WorkflowSummary } from '../../../src/lib/api/workflows';
import { ANONYMOUS_GATE, QUESTION_KINDS, submitGraph, cancelAll } from '../../fixtures/graphs';

const NOW = new Date('2026-10-16T03:00:00Z'); // 2 pm in Sydney

function run(id: string, status: string, extra: Partial<RunSummary> = {}): RunSummary {
  return {
    id,
    status,
    started_at: '2026-10-16T02:30:00Z',
    completed_at: status === 'Running' ? null : '2026-10-16T02:37:48Z',
    graph_name: 'GraphName',
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
  { id: 'wf-1', name: 'design_concepts_review.dot', source_dir: 'examples', path: 'examples/design_concepts_review.dot' },
];

function rowOf(id: string): HTMLElement {
  return screen.getByRole('link', { name: id }).closest('[role="row"]') as HTMLElement;
}

describe('RunTable', () => {
  it('has Status, Workflow, Started and Duration columns', () => {
    render(RunTable, { props: { runs: [run('r1', 'Completed')], now: NOW } });

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Status', 'Workflow', 'Started', 'Duration']);
  });

  it('names each row after its workflow, then its graph, then "Unnamed workflow"', () => {
    render(RunTable, {
      props: {
        runs: [
          run('r-wf', 'Completed', { workflow_id: 'wf-1' }),
          run('r-graph', 'Completed'),
          run('r-none', 'Completed', { graph_name: '  ' }),
        ],
        workflows: WORKFLOWS,
        now: NOW,
      },
    });

    expect(within(rowOf('r-wf')).getByText('Design Concepts Review')).toBeTruthy();
    expect(within(rowOf('r-graph')).getByText('GraphName')).toBeTruthy();
    expect(within(rowOf('r-none')).getByText('Unnamed workflow')).toBeTruthy();
  });

  it('makes the whole row one link to the run, named by its id', () => {
    render(RunTable, { props: { runs: [run('abc-123', 'Completed')], now: NOW } });

    const links = within(rowOf('abc-123')).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/runs/abc-123');
    // The link's hit area stretches over the row.
    expect(links[0].className).toContain('after:absolute');
    expect(rowOf('abc-123').className).toContain('relative');
  });

  it('shows status, start time and a fixed duration for a finished run', () => {
    render(RunTable, {
      props: { runs: [run('done', 'Completed')], now: NOW, timeZone: 'Australia/Sydney' },
    });

    const row = rowOf('done');
    expect(within(row).getByText('Completed')).toBeTruthy();
    expect(within(row).getByText('Today, 1:30 pm')).toBeTruthy();
    expect(within(row).getByText('7 min 48 s')).toBeTruthy();
  });

  it('shows a dash for a stopped run with no end time', () => {
    render(RunTable, { props: { runs: [run('stopped', 'Aborted', { completed_at: null })], now: NOW } });

    expect(within(rowOf('stopped')).getByText('—')).toBeTruthy();
  });

  it('shows Needs you for a running run waiting on a person', () => {
    render(RunTable, { props: { runs: [run('gate', 'Running', { pending_questions: 1 })], now: NOW } });

    expect(within(rowOf('gate')).getByText('Needs you')).toBeTruthy();
  });

  it('measures an active run "so far" from the now it is given', () => {
    render(RunTable, { props: { runs: [run('live', 'Running')], now: NOW } });

    expect(within(rowOf('live')).getByText('30 min so far')).toBeTruthy();
  });

  describe('with its own clock', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('ticks an active run every 30 s and leaves a finished one alone', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-16T02:31:00Z'), shouldAdvanceTime: false });
      render(RunTable, { props: { runs: [run('live', 'Running'), run('done', 'Completed')] } });

      expect(within(rowOf('live')).getByText('1 min so far')).toBeTruthy();
      await vi.advanceTimersByTimeAsync(30_000);
      expect(within(rowOf('live')).getByText('1 min 30 s so far')).toBeTruthy();
      expect(within(rowOf('done')).getByText('7 min 48 s')).toBeTruthy();
    });
  });

  describe('real runs', () => {
    beforeAll(() => {
      setApiBaseUrl('http://127.0.0.1:21541/api');
    });

    afterEach(async () => {
      await cancelAll();
    });

    it('renders one linked row per run', async () => {
      const ids = [await submitGraph(QUESTION_KINDS), await submitGraph(ANONYMOUS_GATE)];
      const runs = (await runsApi.listRuns()).runs.filter((r) => ids.includes(r.id));

      render(RunTable, { props: { runs } });

      // A header row plus one row per run.
      expect(screen.getAllByRole('row')).toHaveLength(3);
      for (const id of ids) {
        expect(screen.getByRole('link', { name: id })).toHaveAttribute('href', `/runs/${id}`);
      }
      expect(screen.getByText('QuestionKinds')).toBeTruthy();
      expect(screen.getByText('Unnamed workflow')).toBeTruthy();
    });
  });
});
