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
    await expect(sheet.getByRole('heading', { name: 'Run “Run Launch Check”' })).toBeVisible();
    await sheet.getByLabel('Brief').fill('dashboard e2e');
    await sheet.getByRole('button', { name: 'Start Run' }).click();

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

test('every dashboard action can be reached with Tab and shows a focus ring', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('table', { name: 'All workflows' }).getByRole('link').first()).toBeVisible();

  const wanted = [
    'Search workflows',
    'Import .dot file',
    'AI model settings',
    'New workflow',
    'Edit',
    'Run…',
    'Human Gate Showcase',
  ];
  const reached = new Set<string>();
  const withoutRing: string[] = [];
  for (let i = 0; i < 160 && reached.size < wanted.length; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
      // A ring is whatever focus changes: an outline or box-shadow on the element, or
      // (for run rows, whose link covers the row) on its row. Compare with it blurred.
      const row = el.closest('[role="row"]');
      const look = () => {
        // Rings fade in; read them at their end state, not mid-transition.
        document.getAnimations().forEach((a) => a.finish());
        const s = getComputedStyle(el);
        return [s.outlineStyle, s.outlineWidth, s.boxShadow, row ? getComputedStyle(row).boxShadow : ''].join('|');
      };
      const focusedLook = look();
      el.blur();
      const blurredLook = look();
      el.focus({ focusVisible: true } as FocusOptions);
      return { name, ring: focusedLook !== blurredLook };
    });
    if (!focused) continue;
    const match = wanted.find((w) => focused.name === w || focused.name.endsWith(w));
    if (match && !reached.has(match)) {
      reached.add(match);
      if (!focused.ring) withoutRing.push(match);
    }
  }

  expect([...reached].sort()).toEqual([...wanted].sort());
  expect(withoutRing).toEqual([]);
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  async function expectNoSidewaysScroll(page: import('@playwright/test').Page, what: string) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${what}: page scrolls sideways`).toBeLessThanOrEqual(0);
  }

  test('stacks the tables and never scrolls sideways, with or without a dialog open', async ({ page }) => {
    await page.goto('/');
    const workflows = page.getByRole('table', { name: 'All workflows' });
    await expect(workflows.getByRole('link', { name: 'Human Gate Showcase' })).toBeVisible();
    await expectNoSidewaysScroll(page, 'dashboard');

    // Stacked rows: no column headers, and each table fits without scrolling inside itself.
    await expect(workflows.getByRole('columnheader', { name: 'Last activity' })).toBeHidden();
    for (const name of ['All workflows', 'Runs']) {
      const table = page.getByRole('table', { name });
      if ((await table.count()) === 0) continue;
      const inner = await table.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(inner, `${name} scrolls inside itself`).toBeLessThanOrEqual(0);
    }

    await page.getByRole('searchbox', { name: 'Search workflows' }).fill('run_launch_check');
    await workflows.getByRole('button', { name: 'Run…' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoSidewaysScroll(page, 'Run sheet open');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('button', { name: 'AI model settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoSidewaysScroll(page, 'Settings open');
  });
});
