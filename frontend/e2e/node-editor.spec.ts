// ABOUTME: Node-editor E2E: real drag-and-drop node creation, save, reload, edit, re-save
// ABOUTME: The only place in this project's test suite that exercises the real HTML5 drag
// ABOUTME: gesture -- jsdom can't simulate it (documented in WorkflowCanvas.test.ts), so every
// ABOUTME: other test drives addNodeAtPosition() directly instead. This is the real thing.

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

async function dragPaletteEntryOntoCanvas(
  page: import('@playwright/test').Page,
  nodeType: string,
  at: { x: number; y: number } = { x: 400, y: 300 }
) {
  // Playwright's documented technique for native HTML5 drag-and-drop:
  // https://playwright.dev/docs/input#dragging-manually -- a real
  // DataTransfer only exists in a real browser context (unlike jsdom),
  // shared by reference across the dispatched dragstart/dragover/drop.
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const source = page.getByTestId(`palette-entry-${nodeType}`);
  const target = page.getByRole('region', { name: 'Workflow canvas drop zone' });

  await source.dispatchEvent('dragstart', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer, clientX: at.x, clientY: at.y });
  await target.dispatchEvent('drop', { dataTransfer, clientX: at.x, clientY: at.y });
}

test('create a workflow via real drag-and-drop, save, reload, edit, and re-save', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);

  // Date.now() alone collided between two parallel workers in the same
  // millisecond during --repeat-each testing -- add a random suffix so
  // concurrent runs of this spec never race on the same .dot filename.
  const testName = `_test_node_editor_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let targetDir: string | undefined;
  let workflowId: string | undefined;

  try {
    await page.goto(`${baseURL || 'http://127.0.0.1:5173'}/workflows/new`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Create New Workflow')).toBeVisible();

    // The create-mode name/target-dir fields only exist once the canvas has
    // mounted, and the <select>'s options only populate once
    // NewWorkflowPage's onMount fetch (GET /api/workflows) resolves.
    const nameInput = page.getByTestId('create-name-input');
    const dirSelect = page.getByTestId('create-target-dir-select');
    await expect(nameInput).toBeVisible();
    await expect(dirSelect.locator('option')).not.toHaveCount(0);
    targetDir = await dirSelect.inputValue();
    expect(targetDir).toBeTruthy();

    // Real drag-and-drop: drop a Codergen node onto the canvas.
    await dragPaletteEntryOntoCanvas(page, 'Codergen');
    await expect(page.locator('.svelte-flow__node')).toHaveCount(1);

    // Select the new node, edit its label and prompt via the real inspector form.
    await page.locator('.svelte-flow__node').click();
    const labelInput = page.getByTestId('node-inspector-label');
    await labelInput.fill('E2E Codergen Node');
    await page.getByTestId('codergen-prompt').fill('Playwright E2E: exercise the real save round trip.');

    await nameInput.fill(testName);
    await page.getByTestId('save-button').click();

    // handleSave redirects to /workflows/{id}/edit on success.
    await page.waitForURL(/\/workflows\/[a-z0-9_-]+\/edit/, { timeout: 15000 });
    workflowId = page.url().split('/workflows/')[1].replace('/edit', '');
    expect(workflowId).toBeTruthy();

    // Confirm a real .dot file landed on disk, rendered server-side (not
    // trusted client-side) -- editor_api.rs's create_graph validates by
    // parsing+resolving the rendered DOT before writing it.
    const repoRoot = join(process.cwd(), '..');
    const dotPath = join(repoRoot, targetDir, `${testName}.dot`);
    expect(existsSync(dotPath)).toBe(true);
    const dotContent = readFileSync(dotPath, 'utf-8');
    expect(dotContent).toContain('digraph');
    expect(dotContent).toContain('E2E Codergen Node');

    // Reload the page (full navigation, not client-side state) and confirm
    // the real GET /api/workflows/{id}/graph round trip loads the same node.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.svelte-flow__node')).toHaveCount(1, { timeout: 10000 });
    await page.locator('.svelte-flow__node').click();
    await expect(page.getByTestId('node-inspector-label')).toHaveValue('E2E Codergen Node');
    await expect(page.getByTestId('codergen-prompt')).toHaveValue(
      'Playwright E2E: exercise the real save round trip.'
    );

    // Edit again and re-save -- proves the edit flow round-trips too, not
    // just the initial create.
    await page.getByTestId('node-inspector-label').fill('E2E Codergen Node (edited)');
    await page.getByTestId('save-button').click();
    await page.waitForTimeout(1000);

    const reloadedContent = readFileSync(dotPath, 'utf-8');
    expect(reloadedContent).toContain('E2E Codergen Node (edited)');

    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  } finally {
    if (targetDir) {
      const repoRoot = join(process.cwd(), '..');
      rmSync(join(repoRoot, targetDir, `${testName}.dot`), { force: true });
    }
  }
});

test('a dropped node lands under the pointer after zooming and panning', async ({ page, baseURL }) => {
  await page.goto(`${baseURL || 'http://127.0.0.1:5173'}/workflows/new`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('create-name-input')).toBeVisible();

  // An empty canvas holds its initial fitView until the first node exists,
  // then refits around it. Drop one node first so that fit is spent
  // before the drop being measured.
  await dragPaletteEntryOntoCanvas(page, 'Start');
  await expect(page.locator('.svelte-flow__node')).toHaveCount(1);

  // That fit zooms to the maximum around one node, so zoom out once with
  // the Controls' - button, then pan by dragging the empty pane. The
  // viewport is then neither at zoom 1 nor at the origin.
  await page.locator('.svelte-flow__controls-zoomout').click();
  const pane = await page.locator('.svelte-flow__pane').boundingBox();
  expect(pane).not.toBeNull();
  const start = { x: pane!.x + pane!.width / 2, y: pane!.y + pane!.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - 120, start.y - 80, { steps: 8 });
  await page.mouse.up();

  const drop = { x: Math.round(pane!.x + 200), y: Math.round(pane!.y + 150) };
  await dragPaletteEntryOntoCanvas(page, 'Codergen', drop);

  await expect(page.locator('.svelte-flow__node')).toHaveCount(2);
  const node = page.locator('.svelte-flow__node[data-id^="codergen-"]');
  // The node stays hidden until it has been measured and centred.
  await expect(node).toBeVisible();
  const box = await node.boundingBox();
  expect(box).not.toBeNull();
  // The node is centred under the drop point, the same way it sat under
  // the pointer while being dragged.
  expect(Math.abs(box!.x + box!.width / 2 - drop.x)).toBeLessThan(4);
  expect(Math.abs(box!.y + box!.height / 2 - drop.y)).toBeLessThan(4);
});

test('saving over a file changed on disk toasts the conflict, and Save anyway writes the editor version', async ({
  page,
  baseURL,
}) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  const name = `_test_node_editor_conflict_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dot = 'digraph { start [shape=Mdiamond, label="Start"]; done [shape=doublecircle, label="Done"]; start -> done; }';
  const imported = await page.request.post(`${base}/api/workflows/import`, { data: { name, dot } });
  expect(imported.ok()).toBe(true);
  const { id } = await imported.json();
  const listed = await (await page.request.get(`${base}/api/workflows`)).json();
  const path: string = listed.workflows.find((w: { id: string }) => w.id === id).path;

  try {
    await page.goto(`${base}/workflows/${id}/edit`);
    await expect(page.locator('.svelte-flow__node')).toHaveCount(2, { timeout: 10000 });

    // Edit in the browser...
    await page.locator('.svelte-flow__node[data-id="done"]').click();
    await page.getByTestId('node-inspector-label').fill('Done in editor');

    // ...while someone else rewrites the file.
    writeFileSync(path, dot.replace('label="Done"', 'label="Done elsewhere"'));

    await page.getByTestId('save-button').click();
    const toast = page.locator('[data-sonner-toast]', { hasText: 'changed on disk' });
    await expect(toast).toBeVisible();
    await expect(page.locator('.svelte-flow__node[data-id="done"]')).toContainText('Done in editor');
    expect(readFileSync(path, 'utf-8')).toContain('Done elsewhere');

    await toast.getByRole('button', { name: 'Save anyway' }).click();
    await expect(toast).toHaveCount(0);
    const saved = readFileSync(path, 'utf-8');
    expect(saved).toContain('Done in editor');
    expect(saved).not.toContain('Done elsewhere');
  } finally {
    rmSync(path, { force: true });
  }
});

test('the canvas fills the viewport below the header on the edit and new pages', async ({ page, baseURL }) => {
  const base = baseURL || 'http://127.0.0.1:5173';
  const name = `_test_node_editor_fill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dot = 'digraph { start [shape=Mdiamond]; done [shape=doublecircle]; start -> done; }';
  const { id } = await (await page.request.post(`${base}/api/workflows/import`, { data: { name, dot } })).json();
  const listed = await (await page.request.get(`${base}/api/workflows`)).json();
  const path: string = listed.workflows.find((w: { id: string }) => w.id === id).path;
  await page.setViewportSize({ width: 1600, height: 1000 });

  try {
    for (const url of [`${base}/workflows/${id}/edit`, `${base}/workflows/new`]) {
      await page.goto(url);
      const flow = page.locator('.svelte-flow');
      await expect(flow).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('save-button')).toBeVisible();

      const header = (await page.locator('header').first().boundingBox())!;
      const box = (await flow.boundingBox())!;
      const palette = (await page.getByTestId('palette-entry-Codergen').boundingBox())!;
      // Right up to the right and bottom edges of the window, left up to the
      // palette, and no page scroll.
      expect(box.x + box.width, url).toBeGreaterThan(1600 - 2);
      expect(box.y + box.height, url).toBeGreaterThan(1000 - 2);
      expect(box.x - (palette.x + palette.width), url).toBeLessThan(24);
      expect(box.y - (header.y + header.height), url).toBeLessThan(80);
      const scrolls = await page.evaluate(
        () => document.scrollingElement!.scrollHeight > window.innerHeight
      );
      expect(scrolls, url).toBe(false);
    }
  } finally {
    rmSync(path, { force: true });
  }
});
