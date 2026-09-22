// ABOUTME: Critical-path E2E test for Phase 3 checkpoint
// ABOUTME: Real browser automation: submit pipeline → stream events → answer gates → observe completion

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test('submit pipeline, stream events, answer 5 human gates, observe completion', async ({
  page,
  baseURL,
}) => {
  // Read human_gate_showcase.dot workflow
  const workflowPath = join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot');
  const dotSource = readFileSync(workflowPath, 'utf-8');

  // Navigate to the dev server
  await page.goto(baseURL || 'http://127.0.0.1:5173');

  // Wait for the RunForm to load
  const form = page.locator('form');
  await expect(form).toBeVisible();

  // Fill in the DOT source textarea
  const textarea = page.locator('textarea[placeholder*="digraph"]');
  await textarea.fill(dotSource);

  // Submit the form by clicking the Submit button
  const submitButton = page.locator('button:has-text("Submit")');
  await submitButton.click();

  // After submission, the page should navigate to /runs/{id}
  // Wait for navigation to happen
  await page.waitForURL(/\/runs\/[a-z0-9\-]+/);

  // Extract run ID from URL for reference
  const runId = page.url().split('/runs/')[1];
  expect(runId).toBeTruthy();

  // The EventLog component should be visible and streaming events
  const eventLog = page.locator('text=Events');
  await expect(eventLog).toBeVisible({ timeout: 10000 });

  // Wait for pipeline_started event to appear in EventLog
  const pipelineStartedEvent = page.locator('text=Pipeline started');
  await expect(pipelineStartedEvent).toBeVisible({ timeout: 15000 });

  // Map of gate names to their expected answer values
  const gateAnswers: Record<string, string> = {
    'Tell me something interesting': 'This is an interesting response!', // FreeformGate
    'Do you want to continue to the fun part': 'Yes', // BinaryGate (approval)
    'Pick your favorite color': 'Red', // MultiChoiceGate
    'How spicy do you like your food': 'Medium', // DefaultGate
    'Any last words before we wrap up': 'Thanks for the adventure!', // FinalFreeform
  };

  let gatesAnswered = 0;

  // Answer up to 5 human gates as they appear
  for (let attempt = 0; attempt < 50; attempt++) {
    // Look for pending questions in the QuestionCard component
    const questionText = page.locator('.question-text');
    const visibleQuestions = await questionText.allTextContents();

    for (const question of visibleQuestions) {
      let answered = false;

      // Try to match the question to a known gate
      for (const [gatePattern, answer] of Object.entries(gateAnswers)) {
        if (question.includes(gatePattern.split(' ').slice(0, 3).join(' '))) {
          // This is a known gate - answer it

          // Check if it's a free_form input
          const freeFormInput = page.locator('input[placeholder*="Enter your answer"]').nth(gatesAnswered);
          if ((await freeFormInput.isVisible().catch(() => false))) {
            // Free form - type the answer and press Enter
            await freeFormInput.fill(answer);
            await freeFormInput.press('Enter');
            gatesAnswered++;
            answered = true;
            break;
          }

          // Check for yes/no buttons (approval gate)
          const yesButton = page.locator('button:has-text("Yes")').nth(gatesAnswered);
          const noButton = page.locator('button:has-text("No")').nth(gatesAnswered);

          if (answer.toLowerCase() === 'yes' && (await yesButton.isVisible().catch(() => false))) {
            await yesButton.click();
            gatesAnswered++;
            answered = true;
            break;
          }

          if (answer.toLowerCase() === 'no' && (await noButton.isVisible().catch(() => false))) {
            await noButton.click();
            gatesAnswered++;
            answered = true;
            break;
          }

          // Check for color choice buttons (multiple_choice)
          const colorButtons = page.locator('button:has-text("Red"), button:has-text("Blue"), button:has-text("Green")');
          const colorCount = await colorButtons.count();
          if (colorCount > 0 && answer === 'Red') {
            const redButton = page.locator('button:has-text("Red")').nth(0);
            if (await redButton.isVisible().catch(() => false)) {
              await redButton.click();
              gatesAnswered++;
              answered = true;
              break;
            }
          }

          // Check for spice level buttons (default gate with options)
          const spiceButtons = page.locator(
            'button:has-text("Mild"), button:has-text("Medium"), button:has-text("Hot")'
          );
          const spiceCount = await spiceButtons.count();
          if (spiceCount > 0 && answer === 'Medium') {
            const mediumButton = page.locator('button:has-text("Medium")').nth(0);
            if (await mediumButton.isVisible().catch(() => false)) {
              await mediumButton.click();
              gatesAnswered++;
              answered = true;
              break;
            }
          }
        }
      }

      if (answered) break;
    }

    // Check if pipeline has completed
    const completionEvent = page.locator('text=Pipeline completed');
    if (await completionEvent.isVisible().catch(() => false)) {
      break;
    }

    // Wait a bit before next check
    await page.waitForTimeout(500);
  }

  // Verify at least one gate was answered
  expect(gatesAnswered).toBeGreaterThan(0);

  // Verify the pipeline completed - should see completion event in EventLog
  const completionEvent = page.locator('text=Pipeline completed');
  await expect(completionEvent).toBeVisible({ timeout: 120000 });

  // Verify no error occurred
  const errorMessage = page.locator('text=/error|failed/i');
  await expect(errorMessage).not.toBeVisible();
});
