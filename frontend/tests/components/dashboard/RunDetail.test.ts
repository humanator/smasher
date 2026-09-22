// ABOUTME: Tests for RunDetail component
// ABOUTME: Renders against a real submitted run, no mocking

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { readFileSync } from 'fs';
import { join } from 'path';
import RunDetail from '../../../src/components/dashboard/RunDetail.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';

const humanGateDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot'),
  'utf-8'
);

describe('RunDetail', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
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
});
