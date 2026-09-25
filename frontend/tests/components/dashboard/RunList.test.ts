// ABOUTME: Tests for RunList component
// ABOUTME: Renders against the real GET /api/runs endpoint, no mocking

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import RunList from '../../../src/components/dashboard/RunList.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { ANONYMOUS_GATE, QUESTION_KINDS, submitGraph, cancelAll } from '../../fixtures/graphs';

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
    const workflowCell = row.querySelectorAll('td')[1];
    expect(workflowCell).toHaveTextContent('unnamed');
    expect(workflowCell.querySelector('.text-muted-foreground')).toHaveTextContent('unnamed');
  });

  it('shows a named run\'s graph name', async () => {
    const runId = await submitGraph(QUESTION_KINDS);

    render(RunList);

    const row = await waitFor(() => screen.getByRole('link', { name: runId }).closest('tr')!, {
      timeout: 5000,
    });
    expect(row.querySelectorAll('td')[1]).toHaveTextContent('QuestionKinds');
  });
});
