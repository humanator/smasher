// ABOUTME: Critical path integration test - submit → events → answer → complete
// ABOUTME: Runs against real smasher-web-api, verifies Task 6b event replay

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as runsApi from '../src/lib/api/runs';
import * as questionsApi from '../src/lib/api/questions';
import { setApiBaseUrl } from '../src/lib/api/client-config';

const BASE_URL = 'http://127.0.0.1:21541';

describe('Critical Path: Submit → Events → Answer Gate → Complete', () => {
  beforeAll(() => {
    setApiBaseUrl(`${BASE_URL}/api`);
  });

  it('submits pipeline and receives events including early replayed events', async () => {
    // Read workflow
    const workflowPath = join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot');
    const dotSource = readFileSync(workflowPath, 'utf-8');

    // Step 1: Submit pipeline
    const submitResponse = await runsApi.submitRun({
      dot_source: dotSource,
      variables: {},
    });

    expect(submitResponse.run_id).toBeTruthy();
    expect(submitResponse.status).toBe('Running');

    const runId = submitResponse.run_id;

    // Step 2: Connect to events stream and wait for pipeline_started
    const events = await new Promise<any[]>((resolve) => {
      const eventsList: any[] = [];
      const eventSource = new EventSource(`${BASE_URL}/api/runs/${runId}/events`);

      const timeout = setTimeout(() => {
        eventSource.close();
        resolve(eventsList);
      }, 10000);

      // Listen for the actual event names sent by the server (not 'message')
      eventSource.addEventListener('pipeline_started', (e: any) => {
        const event = JSON.parse(e.data);
        event.kind = 'pipeline_started';
        eventsList.push(event);
        eventSource.close();
        clearTimeout(timeout);
        resolve(eventsList);
      });

      eventSource.onerror = () => {
        clearTimeout(timeout);
        resolve(eventsList);
      };
    });

    // CRITICAL: Verify Task 6b fix - pipeline_started must be replayed
    const pipelineStartedEvent = events.find((e) => e.kind === 'pipeline_started');
    expect(pipelineStartedEvent).toBeTruthy();
    expect(pipelineStartedEvent.graph_name).toBe('HumanGateShowcase');

    // Step 3: Poll for human-gate question
    let questions: any[] = [];
    let attempts = 0;
    while (questions.length === 0 && attempts < 20) {
      const response = await questionsApi.listQuestions(runId);
      if (response.questions && response.questions.length > 0) {
        questions = response.questions;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    expect(questions.length).toBeGreaterThan(0);
    const question = questions[0];
    expect(question.kind).toBe('free_form');

    // Step 4: Answer the question
    const answerResponse = await questionsApi.answerQuestion(runId, question.id, 'yes');
    expect(answerResponse.success).toBe(true);

    // Step 5: Wait for pipeline completion
    const completionEvents = await new Promise<any[]>((resolve) => {
      const eventsList: any[] = [];
      const eventSource = new EventSource(`${BASE_URL}/api/runs/${runId}/events`);

      const timeout = setTimeout(() => {
        eventSource.close();
        resolve(eventsList);
      }, 30000);

      // Listen for completion events
      eventSource.addEventListener('pipeline_completed', (e: any) => {
        const event = JSON.parse(e.data);
        event.kind = 'pipeline_completed';
        eventsList.push(event);
        eventSource.close();
        clearTimeout(timeout);
        resolve(eventsList);
      });

      eventSource.addEventListener('pipeline_aborted', (e: any) => {
        const event = JSON.parse(e.data);
        event.kind = 'pipeline_aborted';
        eventsList.push(event);
        eventSource.close();
        clearTimeout(timeout);
        resolve(eventsList);
      });

      eventSource.onerror = () => {
        clearTimeout(timeout);
        resolve(eventsList);
      };
    });

    // Verify completion
    const completionEvent = completionEvents.find(
      (e) => e.kind === 'pipeline_completed' || e.kind === 'pipeline_aborted'
    );
    expect(completionEvent).toBeTruthy();

    if (completionEvent?.kind === 'pipeline_completed') {
      expect(completionEvent.outcome.type).toBe('success');
    }
  }, {timeout: 120000});
});
