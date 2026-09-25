// ABOUTME: Run-summary E2E: a failed run's details and graph, and "unnamed" in the run list
// ABOUTME: Uses the shared inline test graphs, which never reach an LLM

import { test, expect } from '@playwright/test';
import { ANONYMOUS_GATE, RUN_FAIL_CHECK } from '../tests/fixtures/graphs';

test('a failed run shows its error, completion time and graph', async ({ page, baseURL }) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: RUN_FAIL_CHECK, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);

    await expect(page.locator('dt:text-is("Error") + dd')).toContainText(
      'invalid JSON in args attribute',
      { timeout: 10000 }
    );
    await expect(page.locator('dt:text-is("Completed") + dd')).not.toBeEmpty();
    await expect(page.getByRole('heading', { name: 'Pipeline Graph' })).toBeVisible();
    await expect(page.locator('.graph svg')).toBeVisible();
  } finally {
    // The run has already failed; cancelling is a harmless no-op kept for symmetry.
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});

test('the run list shows "unnamed" for a run with no graph name', async ({ page, baseURL }) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: ANONYMOUS_GATE, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/`);

    const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: runId! }) });
    await expect(row.getByRole('cell').nth(1)).toHaveText('unnamed', { timeout: 10000 });
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});
