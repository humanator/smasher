// ABOUTME: Tests for RunTable, the runs table shared by the run list and the workflow page
// ABOUTME: Renders real runs from GET /api/runs, no mocking

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RunTable from '../../../src/components/dashboard/RunTable.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import {
  ANONYMOUS_GATE,
  QUESTION_KINDS,
  submitGraph,
  submitAbortedGraph,
  cancelAll,
} from '../../fixtures/graphs';

async function realRuns(ids: string[]) {
  return (await runsApi.listRuns()).runs.filter((run) => ids.includes(run.id));
}

describe('RunTable', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await cancelAll();
  });

  it('renders one linked row per run', async () => {
    const ids = [await submitGraph(QUESTION_KINDS), await submitGraph(ANONYMOUS_GATE)];
    const runs = await realRuns(ids);

    render(RunTable, { props: { runs } });

    // A header row plus one row per run.
    expect(screen.getAllByRole('row')).toHaveLength(3);
    for (const id of ids) {
      expect(screen.getByRole('link', { name: id })).toHaveAttribute('href', `/runs/${id}`);
    }
    expect(screen.getByText('QuestionKinds')).toBeTruthy();
    expect(screen.getByText('unnamed')).toBeTruthy();
  });

  it('offers no delete controls without an ondelete handler', async () => {
    const runs = await realRuns([await submitAbortedGraph(ANONYMOUS_GATE)]);

    render(RunTable, { props: { runs } });

    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('disables selecting and deleting a run that is still running', async () => {
    const running = await submitGraph(ANONYMOUS_GATE);
    const runs = await realRuns([running]);

    render(RunTable, { props: { runs, ondelete: async () => {} } });

    expect(screen.getByRole('checkbox', { name: `Select run ${running}` })).toBeDisabled();
    expect(screen.getByRole('button', { name: `Delete run ${running}` })).toBeDisabled();
  });

  it('deletes one run from its row after confirming', async () => {
    const id = await submitAbortedGraph(ANONYMOUS_GATE);
    const runs = await realRuns([id]);
    const deleted: string[][] = [];
    const user = userEvent.setup();

    render(RunTable, { props: { runs, ondelete: async (ids: string[]) => void deleted.push(ids) } });

    await user.click(screen.getByRole('button', { name: `Delete run ${id}` }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete 1 run?')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleted).toEqual([[id]]));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('deletes the selected runs in one action, confirming how many', async () => {
    const ids = [await submitAbortedGraph(ANONYMOUS_GATE), await submitAbortedGraph(QUESTION_KINDS)];
    const runs = await realRuns(ids);
    const deleted: string[][] = [];
    const user = userEvent.setup();

    render(RunTable, { props: { runs, ondelete: async (ids: string[]) => void deleted.push(ids) } });

    const deleteSelected = screen.getByRole('button', { name: /delete selected/i });
    expect(deleteSelected).toBeDisabled();
    for (const id of ids) {
      await user.click(screen.getByRole('checkbox', { name: `Select run ${id}` }));
    }
    expect(deleteSelected).toHaveTextContent('Delete selected (2)');

    await user.click(deleteSelected);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete 2 runs?')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleted).toHaveLength(1));
    expect([...deleted[0]].sort()).toEqual([...ids].sort());
  });

  it('selects every finished run from the header checkbox', async () => {
    const ids = [await submitAbortedGraph(ANONYMOUS_GATE), await submitAbortedGraph(ANONYMOUS_GATE)];
    const running = await submitGraph(ANONYMOUS_GATE);
    const runs = await realRuns([...ids, running]);
    const user = userEvent.setup();

    render(RunTable, { props: { runs, ondelete: async () => {} } });

    await user.click(screen.getByRole('checkbox', { name: 'Select all finished runs' }));

    expect(screen.getByRole('button', { name: /delete selected/i })).toHaveTextContent(
      'Delete selected (2)'
    );
  });

  it('closes the dialog with nothing deleted when cancelled', async () => {
    const id = await submitAbortedGraph(ANONYMOUS_GATE);
    const runs = await realRuns([id]);
    const deleted: string[][] = [];
    const user = userEvent.setup();

    render(RunTable, { props: { runs, ondelete: async (ids: string[]) => void deleted.push(ids) } });

    await user.click(screen.getByRole('button', { name: `Delete run ${id}` }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(deleted).toEqual([]);
  });

  it('shows the error in the dialog when deleting fails', async () => {
    const id = await submitAbortedGraph(ANONYMOUS_GATE);
    const runs = await realRuns([id]);
    const user = userEvent.setup();

    render(RunTable, {
      props: {
        runs,
        ondelete: async () => {
          throw new Error('run x is still running; cancel it before deleting');
        },
      },
    });

    await user.click(screen.getByRole('button', { name: `Delete run ${id}` }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('still running');
  });
});
