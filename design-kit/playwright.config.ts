// ABOUTME: Playwright config for the design-kit component catalog.
// ABOUTME: Tests load catalog.html directly via file:// URLs — no dev server needed.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
});
