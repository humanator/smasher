// ABOUTME: Workflow-detail E2E: the steps, the active-run banner, run history with failure reasons, and phone width
// ABOUTME: Imports throwaway copies of the gate_only and fail_tool fixtures, so nothing reaches an LLM

import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';

const fixture = (file: string) => readFileSync(join(process.cwd(), 'e2e', 'fixtures', file), 'utf-8');
const gateOnlyDot = fixture('gate_only.dot');
const failToolDot = fixture('fail_tool.dot');

// The library polls every 5s, so allow one full poll plus slack.
const POLL = { timeout: 9000 };
const LAZY = { timeout: 15000 };

const BASE = 'http://127.0.0.1:5173';

/** Imports a throwaway workflow and returns its id, file path and the page URL. */
async function importWorkflow(request: APIRequestContext, name: string, dot: string) {
  const { id } = await (await request.post(`${BASE}/api/workflows/import`, { data: { name, dot } })).json();
  const { workflows } = await (await request.get(`${BASE}/api/workflows`)).json();
  const path = workflows.find((w: { id: string }) => w.id === id)?.path as string | undefined;
  return { id: id as string, path, url: `${BASE}/workflows/${encodeURIComponent(id)}` };
}

async function launch(request: APIRequestContext, id: string) {
  const launched = await request.post(`${BASE}/api/workflows/${encodeURIComponent(id)}/run`, { data: {} });
  return (await launched.json()).run_id as string;
}

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
}

test('goes from the dashboard to a workflow, lists its steps, launches it, and finds the run in its history', async ({
  page,
}) => {
  test.setTimeout(60000);
  // An uppercase letter and a dot, which the id has to survive in the URL.
  const name = `e2e_Detail.v1_${Date.now()}`;
  const title = name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const imported = await importWorkflow(page.request, name, gateOnlyDot);
    workflowPath = imported.path;

    await page.goto(`${BASE}/`);
    // The sidebar lists the same workflow, so click the dashboard's own link.
    await page.getByRole('main').getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(imported.url);
    const header = page.getByRole('banner');
    await expect(header.getByRole('heading', { level: 1, name: title })).toBeVisible();

    // The steps, in running order, under their plain kind names.
    const steps = page.getByRole('region', { name: 'What it does' }).getByRole('listitem');
    await expect(steps).toHaveCount(3, LAZY);
    await expect(steps.nth(0)).toContainText('Start');
    await expect(steps.nth(1)).toContainText('Proceed with the gate-only fixture?');
    await expect(steps.nth(1)).toContainText('Ask a person');
    await expect(steps.nth(2)).toContainText('Finish');
    await expect(page.getByRole('region', { name: 'What it does' })).not.toContainText(/codergen|wait\.human/i);

    await expect(page.getByText("This workflow hasn't run yet.")).toBeVisible();
    await expect(page.getByRole('region', { name: 'Active run' })).toHaveCount(0);

    // Run it from the toolbar, and land on the run page.
    await header.getByRole('button', { name: 'Run' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Start Run' }).click();
    await expect(page).toHaveURL(/\/runs\/[a-z0-9-]+$/, { timeout: 10000 });
    runId = page.url().split('/runs/')[1];

    // Back on the workflow page, the run is the top history row.
    await page.goBack();
    await expect(page).toHaveURL(imported.url);
    const history = page.getByRole('table', { name: 'Runs' });
    await expect(history.getByRole('link', { name: new RegExp(runId) })).toHaveAttribute('href', `/runs/${runId}`, POLL);
  } finally {
    if (runId) await page.request.post(`${BASE}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});

test('a run waiting on a person raises the banner, naming where it paused, until it is answered', async ({ page }) => {
  test.setTimeout(60000);
  const name = `e2e_DetailBanner_${Date.now()}`;
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const imported = await importWorkflow(page.request, name, gateOnlyDot);
    workflowPath = imported.path;
    runId = await launch(page.request, imported.id);

    await page.goto(imported.url);
    const banner = page.getByRole('region', { name: 'Active run' });
    await expect(banner).toBeVisible(POLL);
    await expect(banner.getByRole('link', { name: runId })).toHaveAttribute('href', `/runs/${runId}`);
    await expect(banner).toContainText('Needs you');
    await expect(banner).toContainText('Paused at Proceed with the gate-only fixture?');
    await expect(banner).toContainText('waiting for you to answer a question');

    const { questions } = await (await page.request.get(`${BASE}/api/runs/${runId}/questions`)).json();
    await page.request.post(`${BASE}/api/runs/${runId}/questions/${questions[0].id}/answer`, {
      data: { answer: 'yes' },
    });

    await expect(banner).toHaveCount(0, POLL);
  } finally {
    if (runId) await page.request.post(`${BASE}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});

test('a failed run shows a one-line reason naming the step, without opening the run', async ({ page }) => {
  test.setTimeout(60000);
  const name = `e2e_DetailFail_${Date.now()}`;
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const imported = await importWorkflow(page.request, name, failToolDot);
    workflowPath = imported.path;
    runId = await launch(page.request, imported.id);

    await page.goto(imported.url);
    const row = page
      .getByRole('table', { name: 'Runs' })
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: new RegExp(runId) }) });
    await expect(row.getByText('Failed')).toBeVisible(POLL);
    await expect(row).toContainText('Check the build: Exit code 1.');
  } finally {
    if (runId) await page.request.post(`${BASE}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});

test('every action on the page can be reached with Tab and shows a focus ring', async ({ page }) => {
  test.setTimeout(60000);
  const name = `e2e_DetailKeys_${Date.now()}`;
  let workflowPath: string | undefined;
  let runId: string | undefined;

  try {
    const imported = await importWorkflow(page.request, name, gateOnlyDot);
    workflowPath = imported.path;
    runId = await launch(page.request, imported.id);

    await page.goto(imported.url);
    await expect(page.getByRole('region', { name: 'Active run' })).toBeVisible(POLL);
    await expect(page.getByRole('table', { name: 'Runs' }).getByRole('link')).toBeVisible(POLL);

    const wanted = ['Back to Workflows', 'Edit Workflow', 'Run', runId, 'Answer'];
    const reached = new Set<string>();
    const withoutRing: string[] = [];
    for (let i = 0; i < 80 && reached.size < wanted.length; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
        // A ring is whatever focus changes: an outline or box-shadow on the element, or
        // (for history rows, whose link covers the row) on its row. Compare with it blurred.
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
  } finally {
    if (runId) await page.request.post(`${BASE}/api/runs/${runId}/cancel`);
    if (workflowPath) rmSync(workflowPath, { force: true });
  }
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('never scrolls sideways, with a banner and a failed run showing', async ({ page }) => {
    test.setTimeout(60000);
    const stamp = Date.now();
    const files: (string | undefined)[] = [];
    const runIds: string[] = [];

    try {
      const gate = await importWorkflow(page.request, `e2e_DetailPhoneGate_${stamp}`, gateOnlyDot);
      const fail = await importWorkflow(page.request, `e2e_DetailPhoneFail_${stamp}`, failToolDot);
      files.push(gate.path, fail.path);
      runIds.push(await launch(page.request, gate.id), await launch(page.request, fail.id));

      await page.goto(gate.url);
      await expect(page.getByRole('region', { name: 'Active run' })).toBeVisible(POLL);
      await expect(page.getByRole('region', { name: 'What it does' }).getByRole('listitem')).toHaveCount(3, LAZY);
      await expectNoSidewaysScroll(page);

      await page.goto(fail.url);
      await expect(page.getByText('Check the build: Exit code 1.')).toBeVisible(POLL);
      await expectNoSidewaysScroll(page);
    } finally {
      for (const runId of runIds) await page.request.post(`${BASE}/api/runs/${runId}/cancel`);
      for (const file of files) if (file) rmSync(file, { force: true });
    }
  });
});
