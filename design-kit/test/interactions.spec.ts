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

test.describe('Drawer', () => {
  test('opens on trigger click and returns focus to the trigger on close', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open drawer' });
    const drawer = page.getByRole('dialog', { name: 'Example drawer' });

    await expect(drawer).toBeHidden();
    await trigger.click();
    await expect(drawer).toBeVisible();

    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('closes on Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Open drawer' }).click();
    const drawer = page.getByRole('dialog', { name: 'Example drawer' });
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('closes on backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: 'Open drawer' }).click();
    const drawer = page.getByRole('dialog', { name: 'Example drawer' });
    await expect(drawer).toBeVisible();

    await page.locator('[data-drawer-overlay="example-drawer"]').click({ position: { x: 5, y: 5 } });
    await expect(drawer).toBeHidden();
  });

  test('traps Tab focus between the drawer\'s own focusable elements', async ({ page }) => {
    await page.getByRole('button', { name: 'Open drawer' }).click();
    const drawer = page.getByRole('dialog', { name: 'Example drawer' });
    const closeButton = drawer.getByRole('button', { name: 'Close' });
    const field = drawer.getByPlaceholder('Focusable field inside the drawer');

    // Focus starts on the first focusable element inside the drawer.
    await expect(closeButton).toBeFocused();

    // Shift+Tab from the first element wraps to the last.
    await page.keyboard.press('Shift+Tab');
    await expect(field).toBeFocused();

    // Tab from the last element wraps back to the first.
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();
  });
});

test.describe('Table', () => {
  test('renders a caption, header cells, and right-aligns numeric columns', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(page.getByText('Months and rates')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Month you apply' })).toBeVisible();

    const numericCell = page.getByRole('cell', { name: '£85' });
    await expect(numericCell).toHaveCSS('text-align', 'right');

    const textCell = page.getByRole('cell', { name: 'January' });
    await expect(textCell).toHaveCSS('text-align', 'left');
  });
});

test.describe('Modal', () => {
  test('opens on trigger click and returns focus to the trigger on close', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open modal' });
    const modal = page.getByRole('dialog', { name: 'Example modal' });

    await expect(modal).toBeHidden();
    await trigger.click();
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: 'Close' }).click();
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('closes on Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Open modal' }).click();
    const modal = page.getByRole('dialog', { name: 'Example modal' });
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('closes on backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: 'Open modal' }).click();
    const modal = page.getByRole('dialog', { name: 'Example modal' });
    await expect(modal).toBeVisible();

    await page.locator('[data-modal-overlay="example-modal"]').click({ position: { x: 5, y: 5 } });
    await expect(modal).toBeHidden();
  });

  test('traps Tab focus between the modal\'s own focusable elements', async ({ page }) => {
    await page.getByRole('button', { name: 'Open modal' }).click();
    const modal = page.getByRole('dialog', { name: 'Example modal' });
    const closeButton = modal.getByRole('button', { name: 'Close' });
    const confirmButton = modal.getByRole('button', { name: 'Confirm' });

    // Focus starts on the first focusable element inside the modal.
    await expect(closeButton).toBeFocused();

    // Shift+Tab from the first element wraps to the last.
    await page.keyboard.press('Shift+Tab');
    await expect(confirmButton).toBeFocused();

    // Tab from the last element wraps back to the first.
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();
  });
});
