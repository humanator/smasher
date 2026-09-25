// ABOUTME: Run-launch E2E: fill the catalog's run dialog in a real browser and land on the new run
// ABOUTME: Launches only the gate-only run_launch_check fixture, so it spends no LLM tokens

import { test, expect, type Page } from '@playwright/test';

async function openRunLaunchCheckDialog(page: Page) {
  await page.goto('/');
  const row = page.getByRole('row').filter({ hasText: 'run_launch_check.dot' });
  await row.getByRole('button', { name: 'Run Workflow' }).click();
  await expect(page.getByRole('heading', { name: 'Run Run Launch Check' })).toBeVisible();
}

test('launches the typed brief, model and variable, then shows them on the run page', async ({
  page,
}) => {
  let runId: string | undefined;
  try {
    await openRunLaunchCheckDialog(page);

    await page.getByLabel('Brief').fill('e2e brief');
    await page.getByLabel('Model').fill('m-e2e');
    await page.getByLabel('Variables').fill('colour=blue');
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await page.waitForURL(/\/runs\/[a-zA-Z0-9-]+$/);
    runId = new URL(page.url()).pathname.split('/')[2];

    // The fixture's gate label echoes the launch values; the question card polls every 2s.
    await expect(
      page.locator('.question-card').getByText('Brief: e2e brief | Model: m-e2e | Colour: blue')
    ).toBeVisible({
      timeout: 10000,
    });
  } finally {
    // The run parks at its gate; don't leave it running on the dev server.
    if (runId) await page.request.post(`/api/runs/${runId}/cancel`);
  }
});

test('shows a wrong-shape Node Overrides error inline and stays on the catalog', async ({ page }) => {
  await openRunLaunchCheckDialog(page);

  await page.getByLabel('Node Overrides (JSON)').fill('{"a": "m"}');
  await page.getByRole('button', { name: 'Run', exact: true }).click();

  await expect(
    page.getByText('Expected {"node_id": {"model": "...", "provider": "..."}}')
  ).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
});
