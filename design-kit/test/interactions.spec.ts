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

test.describe('Input', () => {
  test('shows a visible focus state distinct from its resting state', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'Example input' });
    await expect(input).toBeVisible();

    const resting = await input.evaluate((el) => getComputedStyle(el).boxShadow);
    await input.focus();
    const focused = await input.evaluate((el) => getComputedStyle(el).boxShadow);

    expect(focused).not.toBe(resting);
    expect(focused).not.toBe('none');
  });
});

test.describe('List-row', () => {
  test('actionable row is keyboard-focusable and activates on Enter and Space', async ({ page }) => {
    const row = page.getByRole('button', { name: /Actionable row/ });
    await expect(row).toHaveAttribute('aria-pressed', 'false');

    await row.focus();
    await page.keyboard.press('Enter');
    await expect(row).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Space');
    await expect(row).toHaveAttribute('aria-pressed', 'false');
  });

  test('plain row carries no button role or tabindex', async ({ page }) => {
    const plain = page.locator('.list-row', { hasText: 'Plain row' });
    await expect(plain).not.toHaveAttribute('role', 'button');
    await expect(plain).not.toHaveAttribute('tabindex', '0');
  });
});
