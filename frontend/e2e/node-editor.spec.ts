// ABOUTME: Node-editor E2E: real drag-and-drop node creation, save, reload, edit, re-save
// ABOUTME: The only place in this project's test suite that exercises the real HTML5 drag
// ABOUTME: gesture -- jsdom can't simulate it (documented in WorkflowCanvas.test.ts), so every
// ABOUTME: other test drives addNodeAtPosition() directly instead. This is the real thing.

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

async function dragPaletteEntryOntoCanvas(page: import('@playwright/test').Page, nodeType: string) {
  // Playwright's documented technique for native HTML5 drag-and-drop:
  // https://playwright.dev/docs/input#dragging-manually -- a real
  // DataTransfer only exists in a real browser context (unlike jsdom),
  // shared by reference across the dispatched dragstart/dragover/drop.
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const source = page.getByTestId(`palette-entry-${nodeType}`);
  const target = page.getByRole('region', { name: 'Workflow canvas drop zone' });

  await source.dispatchEvent('dragstart', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer, clientX: 400, clientY: 300 });
  await target.dispatchEvent('drop', { dataTransfer, clientX: 400, clientY: 300 });
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
