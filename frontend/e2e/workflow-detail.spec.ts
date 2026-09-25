// ABOUTME: Workflow-detail E2E: catalog → workflow page → Run Workflow → run page → back to the card
// ABOUTME: Imports a throwaway copy of the gate-only run_launch_check.dot, so nothing reaches an LLM

import { test, expect } from '@playwright/test';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';

const runLaunchCheck = readFileSync(
  join(process.cwd(), '..', 'examples', 'run_launch_check.dot'),
  'utf-8'
);

test('goes from the catalog to a workflow, launches it, and comes back to its card', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);
  const base = baseURL || 'http://127.0.0.1:5173';
  // An uppercase letter and a dot, which the id has to survive in the URL.
  const name = `e2e_Detail.v1_${Date.now()}`;
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const imported = await page.request.post(`${base}/api/workflows/import`, {
      data: { name, dot: runLaunchCheck },
    });
    const { id } = await imported.json();
    const { workflows } = await (await page.request.get(`${base}/api/workflows`)).json();
    workflowPath = workflows.find((w: { id: string }) => w.id === id)?.path;

    // 1. From the catalog to the detail page.
    await page.goto(`${base}/`);
    const title = name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    await page.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(`${base}/workflows/${encodeURIComponent(id)}`);
    const header = page.getByRole('banner');
    await expect(header.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText('No runs yet.')).toBeVisible({ timeout: 5000 });

    // 2–3. Launch it from Run Workflow, and land on the run page.
    await header.getByRole('button', { name: 'Run Workflow' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page).toHaveURL(/\/runs\/[a-z0-9-]+$/, { timeout: 10000 });
    runId = page.url().split('/runs/')[1];

    // 4. Back on the workflow page, the card links to that run.
    await page.goBack();
    await expect(page).toHaveURL(`${base}/workflows/${encodeURIComponent(id)}`);
    const card = page.getByRole('region', { name: 'Active run' });
    await expect(card.getByRole('link', { name: runId })).toHaveAttribute('href', `/runs/${runId}`, {
      timeout: 10000,
    });
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});
