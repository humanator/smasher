// ABOUTME: Event-log E2E: newest-first lines on a looping run, and scrolling that holds its place
// ABOUTME: Uses the shared LOOP_CHECK graph, answered over the real API; nothing reaches an LLM

import { test, expect, type APIRequestContext } from '@playwright/test';
import { LOOP_CHECK } from '../tests/fixtures/graphs';

// Answers the run's next pending question (one it hasn't answered yet).
async function answerNext(request: APIRequestContext, base: string, runId: string, answer: string, answered: Set<string>) {
  await expect
    .poll(async () => {
      const { questions } = await (await request.get(`${base}/api/runs/${runId}/questions`)).json();
      return questions.find((q: { id: string }) => !answered.has(q.id))?.id ?? null;
    })
    .not.toBeNull();
  const { questions } = await (await request.get(`${base}/api/runs/${runId}/questions`)).json();
  const question = questions.find((q: { id: string }) => !answered.has(q.id));
  answered.add(question.id);
  await request.post(`${base}/api/runs/${runId}/questions/${question.id}/answer`, { data: { answer } });
}

test('shows a looping run newest first, and holds the line in view as events arrive', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60000);
  const base = baseURL || 'http://127.0.0.1:5173';
  let runId: string | undefined;
  const answered = new Set<string>();

  try {
    const submitResponse = await page.request.post(`${base}/api/runs`, {
      data: { dot_source: LOOP_CHECK, variables: {} },
    });
    ({ run_id: runId } = await submitResponse.json());
    expect(runId).toBeTruthy();

    await page.goto(`${base}/runs/${runId}`);
    const log = page.locator('.event-log');
    const lines = log.locator('.event-item');
    await expect(lines.first()).toBeVisible({ timeout: 5000 });

    // Loop a few times so the log overflows its 500px box.
    for (let i = 0; i < 4; i++) {
      await answerNext(page.request, base, runId!, 'again', answered);
    }
    await expect(page.getByText(`Loop #4`)).toBeVisible({ timeout: 5000 });
    await expect
      .poll(() => log.evaluate((el) => el.scrollHeight > el.clientHeight + 150))
      .toBe(true);

    // Scroll down, note where a line in view sits, then add more events.
    await log.evaluate((el) => (el.scrollTop = 120));
    await log.dispatchEvent('scroll');
    const anchor = log.locator('.event-item', { hasText: 'Loop #2' });
    const before = (await anchor.boundingBox())!.y;
    const countBefore = await lines.count();

    await answerNext(page.request, base, runId!, 'again', answered);
    await expect.poll(() => lines.count()).toBeGreaterThan(countBefore);
    await expect(page.getByText('Loop #5')).toBeAttached();
    expect(Math.abs((await anchor.boundingBox())!.y - before)).toBeLessThanOrEqual(2);

    // Finish, and the newest line is the completion.
    await answerNext(page.request, base, runId!, 'done', answered);
    await expect(lines.first()).toContainText('Pipeline completed', { timeout: 5000 });
    await expect(log.locator('.event-item', { hasText: 'Loop #1' })).toBeVisible();
  } finally {
    if (runId) await page.request.post(`${base}/api/runs/${runId}/cancel`);
  }
});
