// ABOUTME: Run-page E2E: running, needs you, select/note/approve and completed; a failed run with advice and Resume; keyboard and phone width
// ABOUTME: Uses the gate_only and fail_tool fixtures plus a tool-then-gallery-gate graph, so nothing reaches an LLM

import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const fixture = (file: string) => readFileSync(join(process.cwd(), 'e2e', 'fixtures', file), 'utf-8');
const gateOnlyDot = fixture('gate_only.dot');
const failToolDot = fixture('fail_tool.dot');

const BASE = 'http://127.0.0.1:5173';

// Matches smasher-web's data dir: $SMASHER_DATA_DIR, else ~/Documents/smasher.
const dataDir = process.env.SMASHER_DATA_DIR ?? join(homedir(), 'Documents', 'smasher');
const artifactsRoot = join(dataDir, 'artifacts');

// A tool step that takes a few seconds, then a gallery gate whose decisions are conditionals
// straight to Exit. The run is visibly Running, then Needs you, and never reaches an LLM.
const slowGalleryDot = `
digraph RunPageGallery {
  Start [shape=Mdiamond, label="Start"];
  Prepare [shape=parallelogram, label="Prepare the concepts", tool_command="sleep 4"];
  Gate [shape=hexagon, label="Pick a favourite", gallery="true", candidate_count=2];
  Approved [shape=diamond, label="Approved"];
  Iterated [shape=diamond, label="Iterated"];
  Exit [shape=Msquare, label="Exit"];
  Start -> Prepare;
  Prepare -> Gate;
  Gate -> Approved [label="approve"];
  Gate -> Iterated [label="iterate"];
  Approved -> Exit;
  Iterated -> Exit;
}
`;

async function submit(request: APIRequestContext, dot: string) {
  const response = await request.post(`${BASE}/api/runs`, { data: { dot_source: dot, variables: {} } });
  return (await response.json()).run_id as string;
}

function writeCandidate(runId: string, candidateId: string) {
  const dir = join(artifactsRoot, runId, 'artifacts', candidateId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      captured_at: new Date().toISOString(),
      viewport: { width: 1280, height: 800 },
      candidate_dir: `/tmp/${candidateId}`,
      exit_status: { status: 'success' },
      artifacts: [],
      generation_params: {},
    })
  );
}

async function cancel(request: APIRequestContext, runIds: (string | undefined)[]) {
  for (const id of runIds) {
    if (!id) continue;
    await request.post(`${BASE}/api/runs/${id}/cancel`);
    rmSync(join(artifactsRoot, id), { recursive: true, force: true });
  }
}

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
}

/**
 * Presses Tab from the page's Back button until the target has focus. Starting there, not at
 * the top of the document, keeps the count independent of how many workflows the sidebar lists.
 */
async function tabTo(page: Page, target: Locator) {
  await page.getByRole('link', { name: /^Back to / }).focus();
  for (let i = 0; i < 20; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
}

/** Whether the focused element looks different from its blurred self: an outline or a box-shadow. */
async function focusHasRing(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return false;
    const look = () => {
      // Rings fade in; read them at their end state, not mid-transition.
      document.getAnimations().forEach((a) => a.finish());
      const s = getComputedStyle(el);
      return [s.outlineStyle, s.outlineWidth, s.boxShadow].join('|');
    };
    const focused = look();
    el.blur();
    const blurred = look();
    el.focus({ focusVisible: true } as FocusOptions);
    return focused !== blurred;
  });
}

test('a run goes from running to needs you to completed: select, note, approve', async ({ page }) => {
  test.setTimeout(60000);
  let runId: string | undefined;

  try {
    runId = await submit(page.request, slowGalleryDot);
    writeCandidate(runId, 'concept-a');
    writeCandidate(runId, 'concept-b');

    await page.goto(`${BASE}/runs/${runId}`);
    const hero = page.getByTestId('run-hero');

    // Running: the current step, named in the hero.
    await expect(hero).toHaveAttribute('data-state', 'running');
    await expect(hero).toContainText('Now running');
    await expect(hero).toContainText('Prepare the concepts');
    await expect(page.getByRole('region', { name: 'Decision', exact: true })).toHaveCount(0);

    // Needs you: the gate's question, its candidates and the Decision bar.
    await expect(hero).toHaveAttribute('data-state', 'waiting', { timeout: 15000 });
    await expect(hero).toContainText('Pick a favourite');
    await expect(hero).toContainText('Ask a person');
    await expect(page.getByText('Expected 2, found 2')).toBeVisible({ timeout: 10000 });
    const bar = page.getByRole('region', { name: 'Decision', exact: true });
    await expect(bar).toContainText('Nothing selected yet');
    const approve = bar.getByRole('button', { name: 'Approve Selected' });
    await expect(approve).toBeDisabled();

    const select = page.getByRole('button', { name: 'Select concept-b', exact: true });
    await select.click();
    await expect(page.getByRole('button', { name: 'Selected concept-b', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(bar).toContainText('1 selected: concept-b');
    await expect(approve).toBeEnabled();

    const card = page.locator('.candidate-card', { hasText: 'concept-b' });
    await card.getByRole('button', { name: 'Add a Note…' }).click();
    await page.getByLabel('Note for concept-b').fill('Playwright E2E: the calmer one.');
    await card.getByRole('button', { name: 'Done' }).click();
    await expect(card).toContainText('Your note: Playwright E2E: the calmer one.');

    await approve.click();

    // Completed: the hero says so, the decision is recorded and the candidate is Chosen.
    await expect(hero).toHaveAttribute('data-state', 'completed', { timeout: 15000 });
    await expect(hero).toContainText(/Finished in/);
    await expect(hero).toContainText('You approved concept-b');
    await expect(page.getByRole('heading', { name: 'Your decisions' })).toBeVisible();
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
    await expect(card).toContainText('Chosen');
    await expect(bar).toHaveCount(0);

    // The panel's Progress tab agrees: every step on the route taken is done; the Iterated branch never ran.
    await expect(page.getByText('5 of 6 steps done')).toBeVisible();
    const decisions = (await (await page.request.get(`${BASE}/api/runs/${runId}/decisions`)).json()).decisions;
    expect(decisions).toHaveLength(1);
    expect(decisions[0].decision).toBe('approve');
    expect(decisions[0].selected).toEqual(['concept-b']);
  } finally {
    await cancel(page.request, [runId]);
  }
});

test('a run waiting on a free-text gate shows Needs you with the question, and finishes once answered', async ({
  page,
}) => {
  test.setTimeout(60000);
  let runId: string | undefined;

  try {
    runId = await submit(page.request, gateOnlyDot);
    await page.goto(`${BASE}/runs/${runId}`);

    const hero = page.getByTestId('run-hero');
    await expect(hero).toHaveAttribute('data-state', 'waiting', { timeout: 10000 });
    await expect(hero).toContainText('Proceed with the gate-only fixture?');
    await expect(page.getByRole('banner')).toContainText('Needs you');
    await expect(page.getByRole('region', { name: 'Decision', exact: true })).toHaveCount(0);

    await page.getByRole('textbox', { name: 'Proceed with the gate-only fixture?' }).fill('yes');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(hero).toHaveAttribute('data-state', 'completed', { timeout: 15000 });
    await expect(hero).toContainText('All 3 steps ran to the end.');
  } finally {
    await cancel(page.request, [runId]);
  }
});

test('a failed run names the step, shows the engine message and advice, and Resume starts a new run', async ({
  page,
}) => {
  test.setTimeout(60000);
  let runId: string | undefined;
  let resumedId: string | undefined;

  try {
    runId = await submit(page.request, failToolDot);
    await page.goto(`${BASE}/runs/${runId}`);

    const hero = page.getByTestId('run-hero');
    await expect(hero).toHaveAttribute('data-state', 'failed', { timeout: 10000 });
    await expect(hero).toHaveAttribute('role', 'alert');
    await expect(hero.getByRole('heading', { level: 2 })).toHaveText("Check the build couldn't finish");
    await expect(hero).toContainText(/exit code 1/i);
    await expect(hero.getByRole('heading', { name: 'What you can try' })).toBeVisible();
    await expect(hero.getByRole('listitem').first()).toBeVisible();
    await expect(hero.getByRole('button', { name: 'Run Again' })).toHaveCount(0); // no workflow file: ad-hoc run
    await expect(page.getByRole('banner')).toContainText('Failed');
    await expect(page.getByRole('button', { name: 'Abort Run' })).toHaveCount(0);

    // Progress marks the failing step.
    await expect(page.getByRole('complementary', { name: 'Run information' })).toContainText('Stopped with an error');

    // Resume goes to a new run.
    await expect(hero).toContainText("Steps that already finished aren't repeated.");
    await hero.getByRole('button', { name: 'Resume from Check the build' }).click();
    await expect(page).not.toHaveURL(new RegExp(`/runs/${runId}$`), { timeout: 10000 });
    await expect(page).toHaveURL(/\/runs\/[a-z0-9]+$/);
    resumedId = page.url().split('/runs/')[1];
    expect(resumedId).not.toBe(runId);
    await expect(page.getByTestId('run-hero')).toBeVisible();
  } finally {
    await cancel(page.request, [runId, resumedId]);
  }
});

test('the panel and its tabs work from the keyboard, each with a visible focus ring', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  let runId: string | undefined;

  try {
    runId = await submit(page.request, failToolDot);
    await page.goto(`${BASE}/runs/${runId}`);
    await expect(page.getByTestId('run-hero')).toHaveAttribute('data-state', 'failed', { timeout: 10000 });

    const panel = page.getByRole('complementary', { name: 'Run information' });
    const toggle = page.getByRole('button', { name: 'Run information' });
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Reach the toggle with Tab, check its ring, then close and reopen the panel with Enter.
    await tabTo(page, toggle);
    await expect(toggle).toBeFocused();
    expect(await focusHasRing(page), 'Run information has no focus ring').toBe(true);
    await page.keyboard.press('Enter');
    await expect(panel).toHaveCount(0);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();

    // Tab on into the panel: the selected tab takes focus first, and arrows move between tabs.
    const progress = panel.getByRole('tab', { name: 'Progress' });
    await tabTo(page, progress);
    await expect(progress).toBeFocused();
    expect(await focusHasRing(page), 'the Progress tab has no focus ring').toBe(true);

    await page.keyboard.press('ArrowRight');
    const activity = panel.getByRole('tab', { name: 'Activity' });
    await expect(activity).toBeFocused();
    await expect(activity).toHaveAttribute('aria-selected', 'true');
    expect(await focusHasRing(page), 'the Activity tab has no focus ring').toBe(true);
    await expect(panel.getByText('Key moments', { exact: true })).toBeVisible();

    await page.keyboard.press('ArrowRight');
    const details = panel.getByRole('tab', { name: 'Details' });
    await expect(details).toBeFocused();
    await expect(details).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByText('Working folder')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(progress).toBeFocused();
    await expect(progress).toHaveAttribute('aria-selected', 'true');
  } finally {
    await cancel(page.request, [runId]);
  }
});

test('the hero buttons of a failed run can be reached by Tab and show a focus ring', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  let runId: string | undefined;

  try {
    runId = await submit(page.request, failToolDot);
    await page.goto(`${BASE}/runs/${runId}`);
    const resume = page.getByTestId('run-hero').getByRole('button', { name: /^Resume from/ });
    await expect(resume).toBeVisible({ timeout: 10000 });

    await tabTo(page, resume);
    await expect(resume).toBeFocused();
    expect(await focusHasRing(page), 'Resume has no focus ring').toBe(true);
  } finally {
    await cancel(page.request, [runId]);
  }
});

test.describe('at phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('never scrolls sideways, with a candidate grid, the Decision bar and the sheet open', async ({ page }) => {
    test.setTimeout(60000);
    const runIds: string[] = [];

    try {
      const gallery = await submit(page.request, slowGalleryDot);
      runIds.push(gallery);
      writeCandidate(gallery, 'concept-a');
      writeCandidate(gallery, 'concept-b');
      const failed = await submit(page.request, failToolDot);
      runIds.push(failed);

      await page.goto(`${BASE}/runs/${gallery}`);
      await expect(page.getByRole('region', { name: 'Decision', exact: true })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: 'Select concept-a', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Select concept-a', exact: true }).click();
      await expectNoSidewaysScroll(page);

      // The buttons stack to full width.
      const approve = page.getByRole('button', { name: 'Approve Selected' });
      const { width } = (await approve.boundingBox())!;
      expect(width).toBeGreaterThan(300);

      // The panel opens as a sheet over the page.
      await page.getByRole('button', { name: 'Run information' }).click();
      const sheet = page.getByRole('dialog', { name: 'Run information' });
      await expect(sheet).toBeVisible();
      await expectNoSidewaysScroll(page);
      await sheet.getByRole('tab', { name: 'Activity' }).click();
      await expectNoSidewaysScroll(page);
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);

      // A failed run, with its message and advice.
      await page.goto(`${BASE}/runs/${failed}`);
      await expect(page.getByTestId('run-hero')).toHaveAttribute('data-state', 'failed', { timeout: 10000 });
      await expectNoSidewaysScroll(page);
    } finally {
      await cancel(page.request, runIds);
    }
  });
});
