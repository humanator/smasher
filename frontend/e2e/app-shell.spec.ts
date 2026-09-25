// ABOUTME: App-shell checks in a real browser: tab titles, the ⚡ favicon, and poll-failure toasts
// ABOUTME: Needs no pipeline run, so it spends no LLM tokens

import { test, expect } from '@playwright/test';

test('titles each page, page name first', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Smasher');

  await page.goto('/runs/no-such-run');
  await expect(page).toHaveTitle('Run no-such-run — Smasher');
});

test('shows the ⚡ favicon and never asks for /vite.svg', async ({ page }) => {
  const viteSvgRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/vite.svg') viteSvgRequests.push(request.url());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toMatch(/^data:image\/svg\+xml/);
  // index.html writes it as &#x26A1;, which the parser decodes.
  expect(href).toContain('⚡');
  expect(viteSvgRequests).toEqual([]);
});

test('toasts each failing poll on a missing run once, not on every tick', async ({ page }) => {
  test.setTimeout(30000);
  // Live toasts only; a closing toast stays in the DOM, marked data-removed, while it fades.
  const toasts = page.locator('[data-sonner-toast][data-removed="false"]', {
    hasText: 'not found: run no-such-run',
  });

  await page.goto('/runs/no-such-run');

  // The questions poll and the gallery-gate poll each toast once.
  await expect(toasts).toHaveCount(2, { timeout: 5000 });
  // Over the next 5s (more failing 2s ticks) the toasts close after sonner's
  // 4s default, and no tick adds another.
  let most = 0;
  for (let waited = 0; waited < 5000; waited += 250) {
    most = Math.max(most, await toasts.count());
    await page.waitForTimeout(250);
  }
  expect(most).toBe(2);
  await expect(toasts).toHaveCount(0);
});
