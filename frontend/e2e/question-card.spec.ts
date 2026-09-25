// ABOUTME: Question-card E2E: answers a multiple-choice, an approval and a free-text gate in the UI
// ABOUTME: Uses the shared QUESTION_KINDS graph, which parks on gates and never reaches an LLM

import { test, expect } from '@playwright/test';
import { QUESTION_KINDS } from '../tests/fixtures/graphs';

test('answers each kind of question through the card until the run completes', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(30000);
  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: QUESTION_KINDS, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);
    const card = page.locator('.question-card');

    // Multiple choice: a radio, then Submit.
    await expect(card.getByText('Multiple Choice')).toBeVisible({ timeout: 5000 });
    const group = page.getByRole('group', { name: 'Pick a colour' });
    await group.getByRole('radio', { name: 'Blue' }).check();
    await card.getByRole('button', { name: 'Submit' }).click();

    // Approval: Yes.
    await expect(card.getByText('Approval')).toBeVisible({ timeout: 5000 });
    await card.getByRole('button', { name: 'Yes' }).click();

    // Free text: type, then Submit.
    await expect(card.getByText('Free Form')).toBeVisible({ timeout: 5000 });
    await card.getByPlaceholder('Enter your answer').fill('all done');
    await card.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('No pending questions.')).toBeVisible({ timeout: 5000 });
    await expect
      .poll(async () => (await (await page.request.get(`${base}/api/runs/${runId}`)).json()).status)
      .toBe('Completed');
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});
