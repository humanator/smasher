// ABOUTME: Dashboard E2E: search, launching from the workflows table, the Recent runs filter and the needs-you banner
// ABOUTME: Runs only gate-only workflows (run_launch_check and the gate_only fixture), so it spends no LLM tokens

import { test, expect } from '@playwright/test';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';

const gateOnlyDot = readFileSync(join(process.cwd(), 'e2e', 'fixtures', 'gate_only.dot'), 'utf-8');

// The library polls every 5s, so allow one full poll plus slack.
const POLL = { timeout: 9000 };

test('search filters the workflows table by title and file name', async ({ page }) => {
  await page.goto('/');
  const table = page.getByRole('table', { name: 'All workflows' });
  await expect(table.getByRole('link', { name: 'Human Gate Showcase' })).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Search workflows' });
  await search.fill('  HUMAN gate ');
  await expect(table.getByRole('link', { name: 'Human Gate Showcase' })).toBeVisible();
  await expect(table.getByRole('link', { name: 'Megaplan', exact: true })).toHaveCount(0);

  await search.fill('megaplan_quality.dot');
  await expect(table.getByRole('link', { name: 'Megaplan Quality', exact: true })).toBeVisible();
  await expect(table.getByRole('link', { name: 'Human Gate Showcase' })).toHaveCount(0);

  await search.fill('no such workflow anywhere');
  await expect(page.getByText('No workflows match that search.')).toBeVisible();
});

test('Run… opens the run sheet, launches, and lands on the new run', async ({ page }) => {
  let runId: string | undefined;
  try {
    await page.goto('/');
    const row = page.getByRole('table', { name: 'All workflows' }).getByRole('row').filter({ hasText: 'run_launch_check.dot' });
    await row.getByRole('button', { name: 'Run…' }).click();

    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: /Run Launch Check/ })).toBeVisible();
    await sheet.getByLabel('Brief').fill('dashboard e2e');
    await sheet.locator('button[type="submit"]').click();

    await page.waitForURL(/\/runs\/[a-zA-Z0-9-]+$/);
    runId = new URL(page.url()).pathname.split('/')[2];
  } finally {
    // The run parks at its gate; don't leave it running on the dev server.
    if (runId) await page.request.post(`/api/runs/${runId}/cancel`);
  }
});

test('the Recent runs filter and ?runs= follow each other, including the sidebar links', async ({ page }) => {
  await page.goto('/');
  const filters = page.getByRole('group', { name: 'Show runs' });

  await filters.getByRole('radio', { name: /^Completed/ }).click();
  await expect(page).toHaveURL('/?runs=completed');
  await filters.getByRole('radio', { name: /^Failed or stopped/ }).click();
  await expect(page).toHaveURL('/?runs=failed');

  await page.reload();
  await expect(filters.getByRole('radio', { name: /^Failed or stopped/ })).toHaveAttribute('aria-checked', 'true');

  await filters.getByRole('radio', { name: /^All/ }).click();
  await expect(page).toHaveURL('/');

  const library = page.getByRole('navigation', { name: 'Library' });
  await library.getByRole('link', { name: /^Needs you/ }).click();
  await expect(page).toHaveURL('/?runs=needs-you#runs');
  await expect(filters.getByRole('radio', { name: /^Active/ })).toHaveAttribute('aria-checked', 'true');
});

test('a run waiting on a person raises the banner and shows as Needs you until it is answered', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(45000);
  const base = baseURL || 'http://127.0.0.1:5173';
  // Other specs park gates on the same server, so the banner may feature an
  // older run; this run's own row is the one thing only this test changes.
  const name = `e2e_Banner_${Date.now()}`;
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const { id } = await (
      await page.request.post(`${base}/api/workflows/import`, { data: { name, dot: gateOnlyDot } })
    ).json();
    const { workflows } = await (await page.request.get(`${base}/api/workflows`)).json();
    workflowPath = workflows.find((w: { id: string }) => w.id === id)?.path;

    const launched = await page.request.post(`${base}/api/workflows/${encodeURIComponent(id)}/run`, { data: {} });
    runId = (await launched.json()).run_id as string;

    await page.goto('/?runs=needs-you#runs');
    const banner = page.getByRole('region', { name: 'Waiting for you' });
    await expect(banner).toBeVisible(POLL);
    await expect(banner).toContainText('is waiting for your decision');
    await expect(banner).toContainText(/waiting (less than a minute|\d+ minutes?|\d+ hours?)/);

    const runs = page.getByRole('table', { name: 'Runs' });
    const row = runs.getByRole('row').filter({ has: page.getByRole('link', { name: runId }) });
    await expect(row.getByText('Needs you')).toBeVisible(POLL);

    const { questions } = await (await page.request.get(`${base}/api/runs/${runId}/questions`)).json();
    await page.request.post(`${base}/api/runs/${runId}/questions/${questions[0].id}/answer`, {
      data: { answer: 'yes' },
    });

    await expect(row.getByText('Needs you')).toHaveCount(0, POLL);
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});
