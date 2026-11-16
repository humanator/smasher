// ABOUTME: Tests for RunDetails, the run panel's Details tab: Started with elapsed time, token counts and the working folder
// ABOUTME: Reads real runs and their tokens from the smasher-web API, counting real requests to check the polling

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte/svelte5';
import RunDetails from '../../../src/components/run/RunDetails.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import { formatDuration, formatWhen } from '../../../src/lib/timeFormat';
import { ANONYMOUS_GATE, RUN_FAIL_CHECK, submitGraph, cancelAll } from '../../fixtures/graphs';

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

// The text of the dd that follows a given dt.
function valueOf(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.parentElement!.querySelector('dd')!;
}

describe('RunDetails', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    await cancelAll();
  });

  describe('Started and the working folder', () => {
    it('gives when the run started and how long it has been going, so far', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');
      const now = new Date();

      render(RunDetails, { props: { run, active: true, now } });

      expect(valueOf('Started')).toHaveTextContent(
        `${formatWhen(run.started_at, now)} · ${formatDuration(run.started_at, null, now)}`
      );
    });

    it('gives the whole duration for a run that has ended', async () => {
      const run = await runWithStatus(await submitGraph(RUN_FAIL_CHECK), 'Failed');
      const now = new Date();

      render(RunDetails, { props: { run, active: false, now } });

      expect(valueOf('Started')).toHaveTextContent(formatDuration(run.started_at, run.completed_at, now));
      expect(valueOf('Started')).not.toHaveTextContent('so far');
    });

    it('shows the working folder with what it is for', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');

      render(RunDetails, { props: { run, active: true, now: new Date() } });

      expect(valueOf('Working folder')).toHaveTextContent(run.run_working_dir!);
      expect(valueOf('Working folder').querySelector('.font-mono')).toBeTruthy();
      expect(screen.getByText('Where this run saves its files')).toBeInTheDocument();
    });

    it('leaves out the working folder when the run has none', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');

      render(RunDetails, { props: { run: { ...run, run_working_dir: null }, active: true, now: new Date() } });

      expect(screen.queryByText('Working folder')).toBeNull();
      expect(screen.getByText('Started')).toBeInTheDocument();
    });
  });

  describe('tokens', () => {
    it('shows input, output and their total, each with what it means', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');

      render(RunDetails, { props: { run, active: true, now: new Date() } });

      const tokens = await runsApi.getTokens(run.id);
      const total = (tokens.input_tokens + tokens.output_tokens).toLocaleString();
      await waitFor(() => {
        expect(valueOf('Input tokens')).toHaveTextContent(tokens.input_tokens.toLocaleString());
        expect(valueOf('Output tokens')).toHaveTextContent(tokens.output_tokens.toLocaleString());
        expect(valueOf('Total tokens')).toHaveTextContent(total);
      });
      expect(screen.getByText('Text sent to the AI')).toBeInTheDocument();
      expect(screen.getByText('Text the AI wrote back')).toBeInTheDocument();
    });

    it('polls every 3s while active', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');
      const requests = countTokenRequests(run.id);

      try {
        render(RunDetails, { props: { run, active: true, now: new Date() } });

        await waitFor(() => expect(requests.count()).toBeGreaterThanOrEqual(2), {
          timeout: 4000,
          interval: 100,
        });
      } finally {
        requests.restore();
      }
    });

    it('fetches once more when it turns inactive, then stops', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');
      const requests = countTokenRequests(run.id);
      const now = new Date();

      try {
        const { rerender } = render(RunDetails, { props: { run, active: true, now } });
        await waitFor(() => expect(requests.count()).toBe(1));

        const beforeInactive = requests.count();
        await rerender({ run, active: false, now });
        await sleep(500);
        expect(requests.count()).toBe(beforeInactive + 1);

        await sleep(4000);
        expect(requests.count()).toBe(beforeInactive + 1);
      } finally {
        requests.restore();
      }
    }, 10000);

    it('says so inside the list when the counts cannot be loaded', async () => {
      const run = await runWithStatus(await submitGraph(ANONYMOUS_GATE), 'Running');

      const { container } = render(RunDetails, {
        props: { run: { ...run, id: 'no-such-run' }, active: false, now: new Date() },
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/token counts/i);
      expect(within(container).getByText('Started', { selector: 'dt' })).toBeInTheDocument();
    });
  });
});
