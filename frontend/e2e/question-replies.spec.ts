// ABOUTME: Answered Questions E2E: answers survive a page reload because they're rebuilt from run events
// ABOUTME: Uses the shared QUESTION_KINDS graph, which parks on gates and never reaches an LLM

import { test, expect } from '@playwright/test';
import { QUESTION_KINDS } from '../tests/fixtures/graphs';

test('keeps the answered questions, oldest first, after a reload', async ({ page, baseURL }) => {
  test.setTimeout(30000);
  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;
  const expected = [
    ['Pick a colour', 'Answer: Blue'],
    ['Continue?', 'Answer: yes'],
    ['Say something', 'Answer: all done'],
  ];
  const answeredCards = () =>
    page
      .locator('.answered-card')
      .evaluateAll((cards) =>
        cards.map((card) => [
          card.querySelector('.question-text')?.textContent?.trim(),
          card.querySelector('.answer-text')?.textContent?.trim(),
        ])
      );

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: QUESTION_KINDS, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);
    const card = page.locator('.question-card');

    await page.getByRole('group', { name: 'Pick a colour' }).getByRole('radio', { name: 'Blue' }).check();
    await card.getByRole('button', { name: 'Submit' }).click();
    await expect(card.getByText('Approval')).toBeVisible({ timeout: 5000 });
    await card.getByRole('button', { name: 'Yes' }).click();
    await expect(card.getByText('Free Form')).toBeVisible({ timeout: 5000 });
    await card.getByPlaceholder('Enter your answer').fill('all done');
    await card.getByRole('button', { name: 'Submit' }).click();

    await expect.poll(answeredCards, { timeout: 5000 }).toEqual(expected);

    await page.reload();

    await expect.poll(answeredCards, { timeout: 5000 }).toEqual(expected);
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});
