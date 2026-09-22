// ABOUTME: Tests for RunList component
// ABOUTME: Renders against the real GET /api/runs endpoint, no mocking

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import { readFileSync } from 'fs';
import { join } from 'path';
import RunList from '../../../src/components/dashboard/RunList.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';

const consensusTaskDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'consensus_task.dot'),
  'utf-8'
);

describe('RunList', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('renders loading state initially', () => {
    render(RunList);
    expect(screen.getByText('Loading runs...')).toBeTruthy();
  });

  it('renders a real submitted run with its status and links to its detail page', async () => {
    const submitResp = await runsApi.submitRun({
      dot_source: consensusTaskDot,
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
});
