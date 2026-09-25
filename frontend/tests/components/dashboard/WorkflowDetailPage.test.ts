// ABOUTME: Tests for WorkflowDetailPage, the /workflows/{id} page
// ABOUTME: Imports throwaway copies of the gate-only run_launch_check.dot through the real API

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent, within } from '@testing-library/svelte/svelte5';
import WorkflowDetailPage from '../../../src/components/dashboard/WorkflowDetailPage.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';
import * as runsApi from '../../../src/lib/api/runs';
import { ANONYMOUS_GATE, submitGraph, cancelAll } from '../../fixtures/graphs';

const runLaunchCheck = readFileSync(
  join(process.cwd(), '..', 'examples', 'run_launch_check.dot'),
  'utf-8'
);

// An uppercase letter and a dot, which the edit route's id pattern misses.
async function importThrowaway(): Promise<{ id: string; name: string }> {
  const name = `_test_Detail.v1_${Date.now()}`;
  const { id } = await workflowsApi.importWorkflowDot(name, runLaunchCheck);
  return { id, name };
}

let launched: string[] = [];

describe('WorkflowDetailPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await Promise.all(launched.map((id) => runsApi.cancelRun(id).catch(() => undefined)));
    launched = [];
    await cancelAll();
    const { workflows } = await workflowsApi.listWorkflows();
    for (const w of workflows) {
      if (w.name.startsWith('_test_Detail.')) rmSync(w.path, { force: true });
    }
  });

  it('shows the name, source, an Edit link and a Run Workflow button', async () => {
    const { id, name } = await importThrowaway();

    render(WorkflowDetailPage, { props: { workflowId: id } });

    expect(await screen.findByText(`${name}.dot`, {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText(/^Source: \//)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      `/workflows/${encodeURIComponent(id)}/edit`
    );
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeTruthy();
  });

  it('opens the run dialog from Run Workflow, and Cancel launches nothing', async () => {
    const { id } = await importThrowaway();
    render(WorkflowDetailPage, { props: { workflowId: id } });

    await fireEvent.click(await screen.findByRole('button', { name: 'Run Workflow' }, { timeout: 5000 }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /^Run / })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const { runs } = await runsApi.listRuns();
    expect(runs.filter((r) => r.workflow_id === id)).toEqual([]);
  });

  it('says so when no workflow has the id', async () => {
    render(WorkflowDetailPage, { props: { workflowId: 'no-such-workflow' } });

    expect(await screen.findByText('Workflow not found.', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByRole('link', { name: /all workflows/i })).toHaveAttribute('href', '/');
  });

  describe('runs', () => {
    it('shows no card and "No runs yet." for a fresh workflow', async () => {
      const { id } = await importThrowaway();

      render(WorkflowDetailPage, { props: { workflowId: id } });

      expect(await screen.findByText('No runs yet.', {}, { timeout: 5000 })).toBeTruthy();
      expect(screen.queryByText('Active run')).toBeNull();
      expect(screen.queryByText('Latest run')).toBeNull();
    });

    it('features the newest running run, lists only its own runs, then shows the latest once done', async () => {
      const { id } = await importThrowaway();
      const older = (await runsApi.runWorkflow(id)).run_id;
      launched.push(older);
      const newer = (await runsApi.runWorkflow(id)).run_id;
      launched.push(newer);
      // Another graph's run, which must never appear on this page.
      const other = await submitGraph(ANONYMOUS_GATE);

      render(WorkflowDetailPage, { props: { workflowId: id } });

      const card = await screen.findByRole('region', { name: 'Active run' }, { timeout: 5000 });
      expect(within(card).getByRole('link', { name: newer })).toHaveAttribute('href', `/runs/${newer}`);
      expect(within(card).getByText('+1 more running')).toBeTruthy();

      const history = screen.getByRole('region', { name: 'Run History' });
      const rows = within(history).getAllByRole('row').slice(1);
      expect(rows).toHaveLength(2);
      expect(within(history).getByRole('link', { name: newer })).toBeTruthy();
      expect(within(history).getByRole('link', { name: older })).toBeTruthy();
      expect(screen.queryByRole('link', { name: other })).toBeNull();

      await runsApi.cancelRun(older);
      await runsApi.cancelRun(newer);

      const latest = await screen.findByRole('region', { name: 'Latest run' }, { timeout: 8000 });
      expect(within(latest).getByText('Completed')).toBeTruthy();
      expect(within(latest).queryByText(/more running/)).toBeNull();
    }, 20000);
  });
});

