// ABOUTME: Playwright interaction tests for design-kit components.
// ABOUTME: Loads catalog.html directly via a file:// URL — no dev server needed.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogUrl = 'file://' + path.resolve(__dirname, '../catalog.html');

test.beforeEach(async ({ page }) => {
  await page.goto(catalogUrl);
});

test('catalog page loads with a title', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Component Kit');
});

test.describe('Button', () => {
  test('renders default, primary, small, and disabled variants', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Default action' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Primary action' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Small action' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disabled action' })).toBeDisabled();
  });
});
