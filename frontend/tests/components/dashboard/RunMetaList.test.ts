// ABOUTME: Tests for RunMetaList, the run's Completed / Working Directory / Error rows
// ABOUTME: Renders summaries fetched from real runs on the smasher-web API

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import RunMetaList from '../../../src/components/dashboard/RunMetaList.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { ANONYMOUS_GATE, RUN_FAIL_CHECK, submitGraph, cancelAll } from '../../fixtures/graphs';

async function runWithStatus(runId: string, status: string): Promise<runsApi.RunSummary> {
  let run: runsApi.RunSummary | undefined;
  await waitFor(
    async () => {
      run = await runsApi.getRun(runId);
      expect(run.status).toBe(status);
    },
    { timeout: 5000, interval: 100 }
  );
  return run!;
}

describe('RunMetaList', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  it('shows no Completed or Error row for a run that is still running', async () => {
    const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');

    render(RunMetaList, { props: { run } });

    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText('Error')).toBeNull();
    // The working directory is set from launch, so its row already shows.
    expect(screen.getByText('Working Directory')).toBeTruthy();
  });

  it('shows Completed, the working directory, and the error for a failed run', async () => {
    const run = await runWithStatus(await submitGraph(RUN_FAIL_CHECK), 'Failed');

    render(RunMetaList, { props: { run } });

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText(new Date(run.completed_at!).toLocaleString())).toBeTruthy();
    expect(screen.getByText('Working Directory')).toBeTruthy();
    expect(screen.getByText(/^artifacts\//)).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText(/invalid JSON in args attribute/)).toHaveClass('text-destructive');
  });

  it('shows Completed and no Error for a cancelled run', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);
    await runWithStatus(runId, 'Running');
    await runsApi.cancelRun(runId);
    const run = await runWithStatus(runId, 'Aborted');

    render(RunMetaList, { props: { run } });

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText('Error')).toBeNull();
  });

  it('renders nothing when all three fields are null', async () => {
    const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');

    const { container } = render(RunMetaList, {
      props: { run: { ...run, completed_at: null, run_working_dir: null, error: null } },
    });

    expect(container.querySelector('dl')).toBeNull();
  });
});
