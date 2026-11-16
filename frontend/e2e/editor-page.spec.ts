// ABOUTME: Editor page E2E against the real backend: library search, Add to Canvas, a Tool command, problems,
// ABOUTME: connection label and loop, save/reload, delete, the unsaved guard, Run's dialog and phone width

import { test, expect, type Page } from '@playwright/test';
import { readFileSync, rmSync } from 'fs';

// Every workflow here is Start, Finish and (once added) a shell Tool step:
// nothing in it calls an LLM, and the Run test never submits the dialog.
async function importWorkflow(page: Page, base: string) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const name = `_test_editor_page_${suffix}`;
  const graphName = `EditorPageE2E_${suffix}`;
  const dot = `digraph ${graphName} { start [shape=Mdiamond, label="Start"]; done [shape=doublecircle, label="Finish"]; start -> done; }`;
  const imported = await page.request.post(`${base}/api/workflows/import`, { data: { name, dot } });
  expect(imported.ok()).toBe(true);
  const { id } = await imported.json();
  const listed = await (await page.request.get(`${base}/api/workflows`)).json();
  const path: string = listed.workflows.find((w: { id: string }) => w.id === id).path;
  return { id, path, graphName };
}

let workflow: { id: string; path: string; graphName: string };

test.beforeEach(async ({ page, baseURL }) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  workflow = await importWorkflow(page, base);
  await page.goto(`${base}/workflows/${workflow.id}/edit`);
  await expect(page.locator('.svelte-flow__node')).toHaveCount(2, { timeout: 10000 });
});

test.afterEach(() => {
  rmSync(workflow.path, { force: true });
});

const inspector = (page: Page) => page.getByRole('complementary', { name: 'Inspector' });
const statusBar = (page: Page) => page.locator('footer', { hasText: /steps · \d+ connections/ });

// Opens the Tool step's guide from the library and adds it with Add to Canvas.
async function addToolStep(page: Page) {
  await page.getByTestId('palette-entry-Tool').click();
  await inspector(page).getByRole('button', { name: 'Add to Canvas' }).click();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(3);
  return page.locator('.svelte-flow__node[data-id^="tool"]');
}

// The edge's own element has no box to click (a straight smoothstep is zero
// wide), so click the middle of its path, where the line always runs.
async function clickConnection(page: Page) {
  const box = (await page.locator('.svelte-flow__edge-path').first().boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('edge-form')).toBeVisible();
}

test('the step library search narrows the list and says when nothing matches', async ({ page }) => {
  const library = page.getByRole('complementary', { name: 'Step library' });
  const search = library.getByRole('searchbox', { name: 'Search steps' });

  await search.fill('command');
  await expect(page.getByTestId('palette-entry-Tool')).toBeVisible();
  await expect(page.getByTestId('palette-entry-Codergen')).toHaveCount(0);
  await expect(library.getByRole('heading', { name: 'People' })).toHaveCount(0);

  await search.fill('zzzz no such step');
  await expect(library.getByText('No steps match that search.')).toBeVisible();
  await expect(library.locator('[data-testid^="palette-entry-"]')).toHaveCount(0);

  await search.fill('');
  await expect(page.getByTestId('palette-entry-Codergen')).toBeVisible();
});

test('Add to Canvas places the step and selects it', async ({ page }) => {
  await page.getByTestId('palette-entry-Tool').click();
  await expect(page.getByTestId('palette-entry-Tool')).toHaveAttribute('aria-pressed', 'true');
  await expect(inspector(page).getByText('Step guide')).toBeVisible();

  await inspector(page).getByRole('button', { name: 'Add to Canvas' }).click();
  const node = page.locator('.svelte-flow__node[data-id^="tool"]');
  await expect(page.locator('.svelte-flow__node')).toHaveCount(3);
  await expect(node).toBeVisible();
  await expect(node).toHaveClass(/selected/);
  await expect(page.getByTestId('node-inspector-label')).toBeFocused();
  await expect(page.getByTestId('tool-form')).toBeVisible();
  await expect(page.getByTestId('palette-entry-Tool')).toHaveAttribute('aria-pressed', 'false');
});

test('a Tool step with a shell command shows it on the card, and the problems clear', async ({ page }) => {
  await expect(statusBar(page)).toContainText('No problems found');

  const node = await addToolStep(page);
  // A new Tool step has no tool chosen yet.
  await expect(node).toContainText('Needs attention');
  await expect(statusBar(page)).toContainText('needs a tool chosen.');

  await inspector(page).getByRole('radio', { name: /Shell command/ }).check();
  await expect(statusBar(page)).toContainText('needs a command.');
  await page.getByTestId('tool-command').fill('echo editor e2e');

  await expect(node).toContainText('$ echo editor e2e');
  await expect(node).not.toContainText('Needs attention');
  await expect(statusBar(page)).toContainText('3 steps · 1 connections');
  await expect(statusBar(page)).toContainText('No problems found');
});

test('Review selects the step that needs attention', async ({ page }) => {
  await addToolStep(page);
  await page.locator('.svelte-flow__pane').click({ position: { x: 20, y: 20 } });
  await expect(page.getByTestId('tool-form')).toHaveCount(0);

  await statusBar(page).getByRole('button', { name: 'Review' }).click();
  await expect(page.getByTestId('tool-form')).toBeVisible();
  await expect(page.locator('.svelte-flow__node[data-id^="tool"]')).toHaveClass(/selected/);
});

test('labelling a connection shows the label pill and names the connection', async ({ page }) => {
  await clickConnection(page);
  await expect(page.getByTestId('edge-form')).toBeVisible();
  await expect(inspector(page)).toContainText('Start → Finish');

  await page.getByTestId('edge-label').fill('all good');
  const pill = page.getByRole('button', { name: 'Connection from Start to Finish, labelled all good' });
  await expect(pill).toBeVisible();
  await expect(pill).toHaveText('all good');
});

test('Go back and redo draws the connection as a loop', async ({ page }) => {
  await clickConnection(page);
  const loop = page.getByTestId('edge-loop-restart');
  await expect(loop).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.svelte-flow__edge-path.wf-edge-loop')).toHaveCount(0);

  await loop.click();
  await expect(loop).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.svelte-flow__edge-path.wf-edge-loop')).toHaveCount(1);

  await loop.click();
  await expect(page.locator('.svelte-flow__edge-path.wf-edge-loop')).toHaveCount(0);
});

test('edits survive save and reload', async ({ page }) => {
  // The connection first: Add to Canvas drops the new step in the middle, over it.
  await clickConnection(page);
  await page.getByTestId('edge-label').fill('next');
  await page.getByTestId('edge-loop-restart').click();

  await addToolStep(page);
  await page.getByTestId('node-inspector-label').fill('Say hello');
  await inspector(page).getByRole('radio', { name: /Shell command/ }).check();
  await page.getByTestId('tool-command').fill('echo hello');
  await page.getByTestId('tool-timeout').fill('30s');

  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByTestId('save-button').click();
  await expect(page.getByText(/^Saved /)).toBeVisible();
  await expect(page.getByTestId('save-button')).toBeDisabled();

  const dot = readFileSync(workflow.path, 'utf-8');
  expect(dot).toContain('Say hello');
  expect(dot).toContain('tool_command="echo hello"');
  expect(dot).toContain('timeout="30s"');
  expect(dot).toContain('label="next"');
  expect(dot).toContain('loop_restart=true');

  await page.reload();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(3, { timeout: 10000 });
  const node = page.getByRole('group', { name: 'Tool: Say hello' });
  await expect(node).toContainText('$ echo hello');
  await node.click();
  await expect(page.getByTestId('tool-command')).toHaveValue('echo hello');
  await expect(page.getByTestId('tool-timeout')).toHaveValue('30s');

  // The new step sits over the label, so select it from the keyboard.
  await page.getByRole('button', { name: 'Connection from Start to Finish, labelled next' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('edge-label')).toHaveValue('next');
  await expect(page.getByTestId('edge-loop-restart')).toHaveAttribute('aria-checked', 'true');
});

test('a step can be deleted from the inspector and with the keyboard', async ({ page }) => {
  await addToolStep(page);
  await inspector(page).getByRole('button', { name: 'Delete Step' }).click();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(2);
  await expect(page.getByTestId('tool-form')).toHaveCount(0);

  await page.locator('.svelte-flow__node[data-id="done"]').click();
  await page.keyboard.press('Delete');
  await expect(page.locator('.svelte-flow__node')).toHaveCount(1);
  // Its connection goes with it.
  await expect(page.locator('.svelte-flow__edge')).toHaveCount(0);
  await expect(statusBar(page)).toContainText('1 steps · 0 connections');
  await expect(page.getByText('Unsaved changes')).toBeVisible();
});

test('leaving with unsaved changes asks first, and leaving a clean editor does not', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.type());
    void dialog.dismiss();
  });
  const back = page.getByRole('link', { name: /^Back to / });

  await page.locator('.svelte-flow__node[data-id="done"]').click();
  await page.getByTestId('node-inspector-label').fill('Finish (edited)');
  await back.click();
  await expect.poll(() => dialogs).toEqual(['beforeunload']);
  // Dismissed: still in the editor with the edit in place.
  await expect(page).toHaveURL(new RegExp(`/workflows/${workflow.id}/edit$`));
  await expect(page.locator('.svelte-flow__node[data-id="done"]')).toContainText('Finish (edited)');

  await page.getByTestId('save-button').click();
  await expect(page.getByText(/^Saved /)).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(new RegExp(`/workflows/${workflow.id}$`));
  expect(dialogs).toEqual(['beforeunload']);
});

test('Run saves unsaved changes and opens the Run dialog without starting a run', async ({ page, baseURL }) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  const runRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\/(runs|workflows\/[^/]+\/run)\b/.test(request.url())) {
      runRequests.push(request.url());
    }
  });

  await page.locator('.svelte-flow__node[data-id="done"]').click();
  await page.getByTestId('node-inspector-label').fill('Finish before run');
  await page.getByRole('button', { name: 'Run', exact: true }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: /^Run “/ })).toBeVisible();
  expect(readFileSync(workflow.path, 'utf-8')).toContain('Finish before run');

  // Close it without submitting.
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);

  expect(runRequests).toEqual([]);
  const { runs } = await (await page.request.get(`${base}/api/runs`)).json();
  expect(runs.filter((r: { graph_name: string }) => r.graph_name === workflow.graphName)).toEqual([]);
});

// Presses Tab (or Shift+Tab) until the locator has focus, so the test moves
// the way a keyboard user does rather than jumping straight to the control.
async function tabTo(page: Page, target: ReturnType<Page['locator']>, back = false) {
  for (let i = 0; i < 60; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
  }
  throw new Error('never reached the target with the keyboard');
}

test('keyboard only: add a step, edit its fields, select it, delete it and save', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search steps' }).focus();
  await tabTo(page, page.getByTestId('palette-entry-Tool'));
  await page.keyboard.press('Enter');
  await tabTo(page, inspector(page).getByRole('button', { name: 'Add to Canvas' }));
  await page.keyboard.press('Enter');
  await expect(page.locator('.svelte-flow__node')).toHaveCount(3);

  const name = page.getByTestId('node-inspector-label');
  await expect(name).toBeFocused();
  await name.press('ControlOrMeta+a');
  await page.keyboard.type('Keyboard tool');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');
  await expect(inspector(page).getByRole('radio', { name: /Shell command/ })).toBeChecked();
  await tabTo(page, page.getByTestId('tool-command'));
  await page.keyboard.type('echo keys');
  await tabTo(page, page.getByTestId('tool-timeout'));
  await page.keyboard.type('20s');
  await tabTo(page, inspector(page).getByRole('button', { name: /^More settings/ }));
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByTestId('more-max_retries'));
  await page.keyboard.type('3');
  await tabTo(page, page.getByTestId('more-retry_jitter'));
  const jitter = await page.getByTestId('more-retry_jitter').getAttribute('aria-checked');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('more-retry_jitter')).not.toHaveAttribute('aria-checked', jitter!);

  // Select Finish, then the new step again, from the keyboard.
  await tabTo(page, page.getByRole('group', { name: 'Finish: Finish' }), true);
  await page.keyboard.press('Enter');
  await expect(name).toHaveValue('Finish');
  await tabTo(page, page.getByRole('group', { name: 'Tool: Keyboard tool' }));
  await page.keyboard.press('Enter');
  await expect(name).toHaveValue('Keyboard tool');
  await expect(page.getByTestId('tool-command')).toHaveValue('echo keys');

  await tabTo(page, page.getByTestId('save-button'), true);
  await page.keyboard.press('Enter');
  await expect(page.getByText(/^Saved /)).toBeVisible();
  const saved = readFileSync(workflow.path, 'utf-8');
  expect(saved).toContain('tool_command="echo keys"');
  expect(saved).toContain('timeout="20s"');
  expect(saved).toContain('max_retries=3');

  await page.getByRole('searchbox', { name: 'Search steps' }).focus();
  await tabTo(page, page.getByRole('group', { name: 'Tool: Keyboard tool' }));
  await page.keyboard.press('Enter');
  await page.keyboard.press('Delete');
  await expect(page.locator('.svelte-flow__node')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Search steps' }).focus();
  await tabTo(page, page.getByTestId('save-button'), true);
  await page.keyboard.press('Enter');
  await expect(page.getByText(/^Saved /)).toBeVisible();
  expect(readFileSync(workflow.path, 'utf-8')).not.toContain('Keyboard tool');
});

test('at phone width the page does not scroll sideways and the sheets open', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(2, { timeout: 10000 });

  const sideways = () =>
    page.evaluate(() => document.scrollingElement!.scrollWidth > window.innerWidth);
  expect(await sideways()).toBe(false);
  await expect(page.getByRole('group', { name: 'Zoom' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Steps' }).click();
  const library = page.getByRole('dialog', { name: 'Step library' });
  await expect(library).toBeVisible();
  await library.getByTestId('palette-entry-Tool').click();
  const sheet = page.getByRole('dialog', { name: 'Inspector' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Add to Canvas' }).click();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(3);
  await expect(sheet.getByTestId('tool-form')).toBeVisible();
  expect(await sideways()).toBe(false);
});
