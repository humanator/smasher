// ABOUTME: Run-summary E2E: a failed run's error and Details tab, and "Unnamed workflow" in the run list
// ABOUTME: Uses the shared inline test graphs, which never reach an LLM

import { test, expect } from '@playwright/test';
import { ANONYMOUS_GATE, RUN_FAIL_CHECK } from '../tests/fixtures/graphs';

test('a failed run shows its error in the hero and its start, duration and working folder on Details', async ({ page, baseURL }) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: RUN_FAIL_CHECK, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);

    await expect(page.getByTestId('run-hero')).toContainText(/invalid JSON in args attribute/i, {
      timeout: 10000,
    });
    await page.getByRole('tab', { name: 'Details' }).click();
    const started = page.locator('dt:text-is("Started") + dd');
    await expect(started).toBeVisible();
    // An ended run gives its whole duration, not "so far".
    await expect(started).not.toContainText('so far');
    await expect(page.locator('dt:text-is("Working folder") + dd')).not.toBeEmpty();
  } finally {
    // The run has already failed; cancelling is a harmless no-op kept for symmetry.
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});

test('the run list shows "Unnamed workflow" for a run with no graph name', async ({ page, baseURL }) => {
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
    // The Workflow cell holds the title, then the run id.
    await expect(row.getByRole('cell').nth(1)).toContainText('Unnamed workflow', { timeout: 10000 });
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});
