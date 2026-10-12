// ABOUTME: Settings E2E: change the default provider and model in the dialog, then check a new run uses them
// ABOUTME: Launches only the gate-only run_launch_check fixture, so it spends no LLM tokens

import { test, expect } from '@playwright/test';

test('a default saved in the Settings dialog applies to the next run', async ({ page }) => {
  let runId: string | undefined;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();

    // The test server always has the claude-cli provider.
    const provider = page.getByTestId('settings-provider');
    await expect(provider.locator('option[value="claude-cli"]')).toHaveCount(1);
    await provider.selectOption('claude-cli');
    await page.getByTestId('settings-model').selectOption('claude-fable');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status')).toContainText('Saved');

    const saved = await (await page.request.get('/api/settings')).json();
    expect(saved).toMatchObject({ provider: 'claude-cli', model: 'claude-fable', source: 'settings' });

    // A run launched with no model of its own gets the saved one.
    const launch = await page.request.post('/api/workflows/examples__run_launch_check/run', { data: {} });
    runId = (await launch.json()).run_id;
    await expect
      .poll(async () => {
        const body = await (await page.request.get(`/api/runs/${runId}/questions`)).json();
        return body.questions?.[0]?.question ?? '';
      })
      .toContain('Model: claude-fable');
  } finally {
    if (runId) await page.request.post(`/api/runs/${runId}/cancel`);
    // Leave the server on a pair that is valid for the fake CLI.
    await page.request.put('/api/settings', {
      data: { provider: 'claude-cli', model: 'claude-sonnet' },
    });
  }
});
