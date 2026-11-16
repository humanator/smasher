// ABOUTME: Tests for RunList component
// ABOUTME: Renders against the real GET /api/runs endpoint, no mocking

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RunList from '../../../src/components/dashboard/RunList.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import {
  ANONYMOUS_GATE,
  QUESTION_KINDS,
  submitGraph,
  submitAbortedGraph,
  cancelAll,
} from '../../fixtures/graphs';

// Parks on its human gate, so no LLM node ever runs.
const gatedDot = `digraph RunListGated {
  start [shape=circle];
  gate [shape=oval, label="Proceed?"];
  done [shape=doublecircle];
  start -> gate -> done;
}`;

describe('RunList', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await cancelAll();
  });

  it('renders loading state initially', () => {
    render(RunList);
    expect(screen.getByText('Loading runs...')).toBeTruthy();
  });

  it('renders a real submitted run with its status and links to its detail page', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: gatedDot,
      variables: { test: 'run-list-render' },
    });

    render(RunList);

    await waitFor(
      () => {
        const link = screen.getByRole('link', { name: new RegExp(submitResp.run_id) });
        expect(link.getAttribute('href')).toBe(`/runs/${submitResp.run_id}`);
      },
      { timeout: 5000 }
    );
  });

  it('shows "unnamed" for a run whose graph has no name', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);

    render(RunList);

    const row = await waitFor(() => screen.getByRole('link', { name: runId }).closest('tr')!, {
      timeout: 5000,
    });
    // The first cell holds the row's select checkbox.
    const workflowCell = row.querySelectorAll('td')[2];
    expect(workflowCell).toHaveTextContent('unnamed');
    expect(workflowCell.querySelector('.text-muted-foreground')).toHaveTextContent('unnamed');
  });

  it('deletes the selected runs on the server and drops them from the list', async () => {
    const ids = [await submitAbortedGraph(ANONYMOUS_GATE), await submitAbortedGraph(ANONYMOUS_GATE)];
    const keep = await submitGraph(ANONYMOUS_GATE);
    const user = userEvent.setup();

    render(RunList);

    for (const id of ids) {
      await user.click(
        await screen.findByRole('checkbox', { name: `Select run ${id}` }, { timeout: 5000 })
      );
    }
    await user.click(screen.getByRole('button', { name: /delete selected/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete 2 runs?')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      for (const id of ids) expect(screen.queryByRole('link', { name: id })).toBeNull();
    });
    expect(screen.getByRole('link', { name: keep })).toBeTruthy();
    for (const id of ids) {
      await expect(runsApi.getRun(id)).rejects.toMatchObject({ status: 404 });
    }
  });

  it('shows a named run\'s graph name', async () => {
    const runId = await submitGraph(QUESTION_KINDS);

    render(RunList);

    const row = await waitFor(() => screen.getByRole('link', { name: runId }).closest('tr')!, {
      timeout: 5000,
    });
    expect(row.querySelectorAll('td')[2]).toHaveTextContent('QuestionKinds');
  });
});
