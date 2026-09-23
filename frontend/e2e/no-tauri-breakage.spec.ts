// ABOUTME: Confirms zero Tauri-only code paths break when window.__TAURI__ is absent
// ABOUTME: (spec Success Criterion #3) -- walks the app's main routes in a plain browser,
// ABOUTME: asserting no console/page errors and that isTauri()'s browser-fallback path
// ABOUTME: is what's actually exercised, not a real Tauri command call.

import { test, expect } from '@playwright/test';

test('runs with zero Tauri-only code paths breaking in a plain browser', async ({ page, baseURL }) => {
  test.setTimeout(30000);

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
    }
  });

  const base = baseURL || 'http://127.0.0.1:5173';

  // window.__TAURI__ genuinely absent in a plain browser -- smasher-desktop
  // doesn't exist yet, and this confirms the SPA never assumes otherwise.
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => (window as unknown as { __TAURI__?: unknown }).__TAURI__)).toBeUndefined();
  await expect(page.locator('h1', { hasText: 'Smasher Pipelines' })).toBeVisible({ timeout: 10000 });

  // Catalog -> new-workflow page (mounts WorkflowCanvas, Palette, node-editor
  // forms -- the biggest surface Task 20's shim call-sites touch).
  await page.getByText('+ New Workflow').click();
  await page.waitForURL(/\/workflows\/new/);
  await expect(page.getByText('Create New Workflow')).toBeVisible();
  // Give the create-mode fields (populated from a real API fetch) time to
  // settle so any async Tauri-detection code in that path has run.
  await expect(page.getByTestId('create-name-input')).toBeVisible();

  // Back to the catalog, then submit a trivial run so EventLog.svelte's
  // completion-notification shim call-site (Task 20) actually executes --
  // a real browser has a real Notification global, so showNotification's
  // browser-fallback branch runs for real here, not the jsdom
  // "Notifications not supported" warning path.
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  const textarea = page.locator('textarea[placeholder*="digraph"]');
  await textarea.fill(`
digraph NoTauriBreakageE2E {
  Start [shape=Mdiamond, label="Start"];
  Exit [shape=Msquare, label="Exit"];
  Start -> Exit;
}
`);
  await page.locator('button:has-text("Submit")').click();
  await page.waitForURL(/\/runs\/[a-z0-9-]+/);
  await expect(page.locator('text=Pipeline completed')).toBeVisible({ timeout: 15000 });

  await page.goto(base);
  await page.waitForLoadState('networkidle');

  expect(errors, `unexpected console/page errors:\n${errors.join('\n')}`).toEqual([]);
});
