// ABOUTME: Tests for RunDetail component
// ABOUTME: Renders against a real submitted run, no mocking

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { readFileSync } from 'fs';
import { join } from 'path';
import RunDetail from '../../../src/components/dashboard/RunDetail.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { RUN_FAIL_CHECK, submitGraph, cancelAll } from '../../fixtures/graphs';

const humanGateDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot'),
  'utf-8'
);

describe('RunDetail', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  it('shows status, token counts, and the rendered graph SVG for a real running run', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: humanGateDot,
      variables: {},
    });

    const { container } = render(RunDetail, { props: { runId: submitResp.run_id } });

    await waitFor(
      () => {
        expect(screen.getByText('Running')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Input tokens/i)).toBeTruthy();
        expect(screen.getByText(/Output tokens/i)).toBeTruthy();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(container.querySelector('svg')).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('aborting a real run cancels it and the status badge reflects the new state', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: humanGateDot,
      variables: {},
    });

    render(RunDetail, { props: { runId: submitResp.run_id } });

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeTruthy();
    });

    const abortButton = screen.getByRole('button', { name: /abort/i });
    abortButton.click();

    await waitFor(
      () => {
        expect(screen.getByText('Aborted')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    const realStatus = await runsApi.getRun(submitResp.run_id);
    expect(realStatus.status).toBe('Aborted');
  });

  it('shows a failed run\'s error in its details list, apart from the page-level alert', async () => {
    const runId = await submitGraph(RUN_FAIL_CHECK);
    await waitFor(async () => expect((await runsApi.getRun(runId)).status).toBe('Failed'), {
      timeout: 3000,
      interval: 100,
    });

    render(RunDetail, { props: { runId } });

    await waitFor(() => {
      expect(screen.getByText(/invalid JSON in args attribute/)).toBeTruthy();
    });
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows a load failure as a page-level alert with no details list', async () => {
    const { container } = render(RunDetail, { props: { runId: 'no-such-run' } });

    await waitFor(
      () => {
        expect(screen.getByRole('alert')).toBeTruthy();
      },
      { timeout: 5000 }
    );
    expect(container.querySelector('dl')).toBeNull();
  });
});
