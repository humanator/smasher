// ABOUTME: Tests for WorkflowDetailPage, the /workflows/{id} page
// ABOUTME: Imports throwaway copies of the gate-only run_launch_check.dot through the real API

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent } from '@testing-library/svelte/svelte5';
import WorkflowDetailPage from '../../../src/components/dashboard/WorkflowDetailPage.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as workflowsApi from '../../../src/lib/api/workflows';
import * as runsApi from '../../../src/lib/api/runs';

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

describe('WorkflowDetailPage', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
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
    expect(await screen.findByRole('heading', { name: /^Run / })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const { runs } = await runsApi.listRuns();
    expect(runs.filter((r) => r.workflow_id === id)).toEqual([]);
  });

  it('says so when no workflow has the id', async () => {
    render(WorkflowDetailPage, { props: { workflowId: 'no-such-workflow' } });

    expect(await screen.findByText('Workflow not found.', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByRole('link', { name: /all workflows/i })).toHaveAttribute('href', '/');
  });
});
