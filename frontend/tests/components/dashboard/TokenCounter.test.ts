// ABOUTME: Tests for TokenCounter: input, output and total, and polling that stops with the run
// ABOUTME: Reads a real gated run's tokens from the smasher-web API, counting real requests

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import TokenCounter from '../../../src/components/dashboard/TokenCounter.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { ANONYMOUS_GATE, submitGraph, cancelAll } from '../../fixtures/graphs';

// Counts real token requests for one run by wrapping fetch in a pass-through.
function countTokenRequests(runId: string): { count: () => number; restore: () => void } {
  const realFetch = globalThis.fetch;
  let n = 0;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith(`/runs/${runId}/tokens`)) n++;
    return realFetch(input, init);
  }) as typeof fetch;
  return { count: () => n, restore: () => (globalThis.fetch = realFetch) };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TokenCounter', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  it('shows input, output and their total', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);

    render(TokenCounter, { props: { runId } });

    const tokens = await runsApi.getTokens(runId);
    const total = (tokens.input_tokens + tokens.output_tokens).toLocaleString();
    await waitFor(() => {
      expect(screen.getByText(`Input tokens: ${tokens.input_tokens.toLocaleString()}`)).toBeTruthy();
      expect(screen.getByText(`Output tokens: ${tokens.output_tokens.toLocaleString()}`)).toBeTruthy();
      expect(screen.getByText(`Total tokens: ${total}`)).toBeTruthy();
    });
  });

  it('polls every 3s while active', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);
    const requests = countTokenRequests(runId);

    try {
      render(TokenCounter, { props: { runId, active: true } });

      await waitFor(() => expect(requests.count()).toBeGreaterThanOrEqual(2), {
        timeout: 4000,
        interval: 100,
      });
    } finally {
      requests.restore();
    }
  });

  it('fetches once more when it turns inactive, then stops', async () => {
    const runId = await submitGraph(ANONYMOUS_GATE);
    const requests = countTokenRequests(runId);

    try {
      const { rerender } = render(TokenCounter, { props: { runId, active: true } });
      await waitFor(() => expect(requests.count()).toBe(1));

      const beforeInactive = requests.count();
      await rerender({ runId, active: false });
      await sleep(500);
      expect(requests.count()).toBe(beforeInactive + 1);

      await sleep(4000);
      expect(requests.count()).toBe(beforeInactive + 1);
    } finally {
      requests.restore();
    }
  }, 10000);
});
