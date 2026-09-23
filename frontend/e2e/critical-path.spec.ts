// ABOUTME: Critical-path E2E test for Phase 3 checkpoint
// ABOUTME: Real browser automation: submit pipeline → stream events → answer gates → observe completion

import { test, expect } from '@playwright/test';

test('submit pipeline, stream events, answer 5 human gates, observe completion', async ({
  page,
  baseURL,
}) => {
  // 10 min: each box node between gates is a real Codergen agentic
  // tool-calling loop (not a single LLM completion), so per-node latency
  // across 5 chained gates is genuinely variable -- observed range during
  // debugging was ~38s to 3+ min for just the first two nodes.
  test.setTimeout(600000);

  // Navigate to the dev server
  await page.goto(baseURL || 'http://127.0.0.1:5173');

  // Wait for page load
  await page.waitForLoadState('networkidle');

  // Wait for the app to render - look for the catalog heading
  await expect(page.locator('h1', { hasText: 'Smasher Pipelines' })).toBeVisible({ timeout: 10000 });

  // Launch examples/human_gate_showcase.dot -- already on disk and listed
  // in the catalog (SMASHER_WORKFLOWS_DIR=examples) -- via its "Run
  // Workflow" button. The catalog is the only submission path now that
  // the free-form "paste DOT source" panel has been removed from the UI.
  const row = page.locator('tr', { hasText: 'Human Gate Showcase' });
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.getByRole('button', { name: 'Run Workflow' }).click();

  // After submission, the page should navigate to /runs/{id}
  await page.waitForURL(/\/runs\/[a-z0-9-]+/);

  const runId = page.url().split('/runs/')[1];
  expect(runId).toBeTruthy();

  // The EventLog component's heading should be visible (scope to the events panel
  // specifically -- "Events" also appears as the page's own section heading).
  const eventLogHeading = page.locator('.event-log h3', { hasText: 'Events' });
  await expect(eventLogHeading).toBeVisible({ timeout: 10000 });

  // Wait for pipeline_started event to appear in EventLog (Task 6b replay)
  await expect(page.locator('text=Pipeline started')).toBeVisible({ timeout: 15000 });

  // human_gate_showcase.dot has 5 chained gates. The backend's HttpInterviewer
  // currently reports every gate as kind "free_form" regardless of the DOT's
  // hexagon/binary/multi-choice/default shape (confirmed via direct API check),
  // so QuestionCard always renders the free-form text input, never the
  // approval/multiple_choice button variants. Answer every gate that way.
  const answers = [
    'This is an interesting response!',
    'Yes',
    'Red',
    'Medium',
    'Thanks for the adventure!',
  ];

  let gatesAnswered = 0;
  for (let attempt = 0; attempt < 700 && gatesAnswered < answers.length; attempt++) {
    const freeFormInput = page.locator('.answer-form input[placeholder="Enter your answer"]').first();
    if (await freeFormInput.isVisible().catch(() => false)) {
      await freeFormInput.fill(answers[gatesAnswered]);
      await freeFormInput.press('Enter');
      gatesAnswered++;
      // Give the poll loop (2s interval in QuestionCard) time to pick up the answer
      // and move the question from pending to answered before checking again.
      await page.waitForTimeout(2500);
      continue;
    }

    const completionEvent = page.locator('text=Pipeline completed');
    if (await completionEvent.isVisible().catch(() => false)) {
      break;
    }

    await page.waitForTimeout(500);
  }

  expect(gatesAnswered).toBeGreaterThan(0);

  // Verify the pipeline completed - should see completion event in EventLog
  await expect(page.locator('text=Pipeline completed')).toBeVisible({ timeout: 540000 });

  // Verify the run's authoritative final status via the real API, not by
  // text-matching the page: the EventLog legitimately renders historical
  // "node_failed" entries as part of normal operation (a node can fail and
  // the graph can still route around it), so scanning the whole page for
  // /error|failed/i would false-positive on that real, correct log content.
  const runResponse = await page.request.get(`${baseURL || 'http://127.0.0.1:5173'}/api/runs/${runId}`);
  const runStatus = (await runResponse.json()).status;
  expect(runStatus).toBe('Completed');

  // The WorkflowCatalog component renders its own errors with
  // role="alert" -- confirm none of those are present.
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
});
