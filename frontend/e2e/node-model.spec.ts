// ABOUTME: Node-editor E2E: pick a provider and model on a Codergen node, save, reload, check the DOT
// ABOUTME: Uses the test server's claude-cli provider (always present); no LLM call is made

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

test('a Codergen node keeps its provider and model across save and reload', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);

  const testName = `_test_node_model_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let targetDir: string | undefined;

  try {
    await page.goto(`${baseURL || 'http://127.0.0.1:5173'}/workflows/new`);
    await page.waitForLoadState('networkidle');
    const dirSelect = page.getByTestId('create-target-dir-select');
    await expect(dirSelect.locator('option')).not.toHaveCount(0);
    targetDir = await dirSelect.inputValue();

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    const target = page.getByRole('region', { name: 'Workflow canvas drop zone' });
    await page.getByTestId('palette-entry-Codergen').dispatchEvent('dragstart', { dataTransfer });
    await target.dispatchEvent('dragover', { dataTransfer, clientX: 400, clientY: 300 });
    await target.dispatchEvent('drop', { dataTransfer, clientX: 400, clientY: 300 });
    await page.locator('.svelte-flow__node').click();

    // Choosing a provider fills in its default model.
    const provider = page.getByTestId('codergen-provider');
    await expect(provider.locator('option[value="claude-cli"]')).toHaveCount(1);
    await provider.selectOption('claude-cli');
    await expect(page.getByTestId('codergen-model')).toHaveValue('claude-sonnet');
    await page.getByTestId('codergen-model').selectOption('claude-opus');

    await page.getByTestId('create-name-input').fill(testName);
    await page.getByTestId('save-button').click();
    await page.waitForURL(/\/workflows\/[a-z0-9_-]+\/edit/, { timeout: 15000 });

    const dotPath = join(process.cwd(), '..', targetDir, `${testName}.dot`);
    expect(existsSync(dotPath)).toBe(true);
    const dot = readFileSync(dotPath, 'utf-8');
    expect(dot).toContain('provider="claude-cli"');
    expect(dot).toContain('model="claude-opus"');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.svelte-flow__node').click();
    await expect(page.getByTestId('codergen-provider')).toHaveValue('claude-cli');
    await expect(page.getByTestId('codergen-model')).toHaveValue('claude-opus');
  } finally {
    if (targetDir) {
      rmSync(join(process.cwd(), '..', targetDir, `${testName}.dot`), { force: true });
    }
  }
});
