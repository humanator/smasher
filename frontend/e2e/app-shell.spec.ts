// ABOUTME: App-shell checks in a real browser: tab titles, favicon, poll-failure toasts, sidebar and phone width
// ABOUTME: Runs only the gate-only fixture, so it spends no LLM tokens

import { test, expect } from '@playwright/test';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';

const gateOnlyDot = readFileSync(join(process.cwd(), 'e2e', 'fixtures', 'gate_only.dot'), 'utf-8');

test('titles each page, page name first', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Smasher');

  await page.goto('/runs/no-such-run');
  await expect(page).toHaveTitle('Run no-such-run — Smasher');
});

test('shows the ⚡ favicon and never asks for /vite.svg', async ({ page }) => {
  const viteSvgRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/vite.svg') viteSvgRequests.push(request.url());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toMatch(/^data:image\/svg\+xml/);
  // index.html writes it as &#x26A1;, which the parser decodes.
  expect(href).toContain('⚡');
  expect(viteSvgRequests).toEqual([]);
});

test('toasts each failing poll on a missing run once, not on every tick', async ({ page }) => {
  test.setTimeout(30000);
  // Live toasts only; a closing toast stays in the DOM, marked data-removed, while it fades.
  const toasts = page.locator('[data-sonner-toast][data-removed="false"]', {
    hasText: 'not found: run no-such-run',
  });

  await page.goto('/runs/no-such-run');

  // The questions poll and the gallery-gate poll each toast once.
  await expect(toasts).toHaveCount(2, { timeout: 5000 });
  // Over the next 5s (more failing 2s ticks) the toasts close after sonner's
  // 4s default, and no tick adds another.
  let most = 0;
  for (let waited = 0; waited < 5000; waited += 250) {
    most = Math.max(most, await toasts.count());
    await page.waitForTimeout(250);
  }
  expect(most).toBe(2);
  await expect(toasts).toHaveCount(0);
});

test('sidebar links reach Workflows, Recent runs and a workflow page', async ({ page }) => {
  await page.goto('/runs/no-such-run');
  const library = page.getByRole('navigation', { name: 'Library' });

  await library.getByRole('link', { name: /^Workflows/ }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Smasher Pipelines' })).toBeVisible();

  await library.getByRole('link', { name: /^Recent runs/ }).click();
  await expect(page).toHaveURL('/#runs');

  const workflows = page.getByRole('navigation', { name: 'Workflows' });
  await workflows.getByRole('link', { name: /Human Gate Showcase/ }).click();
  await expect(page).toHaveURL(/\/workflows\/.*human_gate_showcase/);
  await expect(page.getByRole('banner').getByRole('heading', { level: 1, name: 'Human Gate Showcase' })).toBeVisible();
  await expect(workflows.getByRole('link', { name: /Human Gate Showcase/ })).toHaveAttribute(
    'aria-current',
    'page'
  );
});

test('a run waiting on a person shows in Needs you and the workflow dot, and clears within a poll once answered', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(45000);
  const base = baseURL || 'http://127.0.0.1:5173';
  // The library polls every 5s, so allow one full poll plus slack.
  const POLL = { timeout: 9000 };
  // Other specs park gates on the same server, so the totals can't be pinned to exact numbers.
  // A throwaway workflow of our own is the one thing only this run can change.
  const name = `e2e_NeedsYou_${Date.now()}`;
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const { id } = await (
      await page.request.post(`${base}/api/workflows/import`, { data: { name, dot: gateOnlyDot } })
    ).json();
    const { workflows } = await (await page.request.get(`${base}/api/workflows`)).json();
    workflowPath = workflows.find((w: { id: string }) => w.id === id)?.path;

    await page.goto('/');
    const row = page.getByRole('navigation', { name: 'Workflows' }).getByRole('link', { name: /E2e NeedsYou/ });
    await expect(row).toBeVisible();
    await expect(row.getByText('needs you')).toHaveCount(0);

    const launched = await page.request.post(`${base}/api/workflows/${encodeURIComponent(id)}/run`, {
      data: {},
    });
    runId = (await launched.json()).run_id as string;

    await expect(row.getByText('needs you')).toBeVisible(POLL);
    await expect(page.getByTestId('needs-you-count')).toBeVisible();
    await expect(page.getByTestId('sidebar-footer')).toContainText(/Smasher · \d+ runs? needs? your decision/);

    const { questions } = await (await page.request.get(`${base}/api/runs/${runId}/questions`)).json();
    await page.request.post(`${base}/api/runs/${runId}/questions/${questions[0].id}/answer`, {
      data: { answer: 'yes' },
    });

    await expect(row.getByText('needs you')).toHaveCount(0, POLL);
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the sidebar opens as a sheet and the page does not scroll sideways', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Closed by default: the library nav is not on screen.
    await expect(page.getByRole('navigation', { name: 'Library' })).toBeHidden();

    await page.getByRole('button', { name: 'Open sidebar' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('navigation', { name: 'Library' })).toBeVisible();
    await expect(sheet.getByRole('navigation', { name: 'Workflows' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});
