// ABOUTME: Tests for RunTable, the runs table shared by the run list and the workflow page
// ABOUTME: Renders real runs from GET /api/runs, no mocking

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import RunTable from '../../../src/components/dashboard/RunTable.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { ANONYMOUS_GATE, QUESTION_KINDS, submitGraph, cancelAll } from '../../fixtures/graphs';

describe('RunTable', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  it('renders one linked row per run', async () => {
    const ids = [await submitGraph(QUESTION_KINDS), await submitGraph(ANONYMOUS_GATE)];
    const runs = (await runsApi.listRuns()).runs.filter((run) => ids.includes(run.id));

    render(RunTable, { props: { runs } });

    // A header row plus one row per run.
    expect(screen.getAllByRole('row')).toHaveLength(3);
    for (const id of ids) {
      expect(screen.getByRole('link', { name: id })).toHaveAttribute('href', `/runs/${id}`);
    }
    expect(screen.getByText('QuestionKinds')).toBeTruthy();
    expect(screen.getByText('unnamed')).toBeTruthy();
  });
});
