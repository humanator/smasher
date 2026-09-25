// ABOUTME: Critical path integration test - submit → events → answer → complete
// ABOUTME: Runs against real smasher-web-api, verifies Task 6b event replay

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as runsApi from '../src/lib/api/runs';
import * as questionsApi from '../src/lib/api/questions';
import { setApiBaseUrl } from '../src/lib/api/client-config';
import type { PipelineEvent } from '../src/lib/api/events';
import type { Question } from '../src/lib/api/questions';

const BASE_URL = 'http://127.0.0.1:21541';

// Answers every gate in human_gate_showcase.dot, so all of its Codergen nodes
// run and spend real LLM tokens. Opt in with SMASHER_LLM_TESTS=1.
describe.skipIf(!process.env.SMASHER_LLM_TESTS)('Critical Path: Submit → Events → Answer Gate → Complete', () => {
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
    const events = await new Promise<PipelineEvent[]>((resolve) => {
      const eventsList: PipelineEvent[] = [];
      const eventSource = new EventSource(`${BASE_URL}/api/runs/${runId}/events`);

      const timeout = setTimeout(() => {
        eventSource.close();
        resolve(eventsList);
      }, 10000);

      // Listen for the actual event names sent by the server (not 'message')
      eventSource.addEventListener('pipeline_started', (e: Event) => {
        const messageEvent = e as MessageEvent;
        const event: PipelineEvent = JSON.parse(messageEvent.data);
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
    expect(pipelineStartedEvent?.graph_name).toBe('HumanGateShowcase');

    // Step 3: Poll for human-gate question
    let questions: Question[] = [];
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

    // Step 4: Loop through all gates in the workflow, answering each one
    // The workflow has 5 gates: FreeformGate → BinaryGate → MultiChoiceGate → DefaultGate → FinalFreeform
    const gateAnswers: Record<string, string> = {
      FreeformGate: 'This is an interesting response!',
      BinaryGate: 'yes',
      MultiChoiceGate: 'red',
      DefaultGate: 'medium',
      FinalFreeform: 'Thanks for the adventure!',
    };

    let gatesAnswered = 0;
    let completedSuccessfully = false;
    const answeredIds = new Set<string>();

    // Keep polling until the run completes. The outer `it(...)` timeout below
    // is the single source of truth for the deadline -- an extra internal
    // setTimeout racing against it just produces a generic, less useful
    // "test timed out" error instead of a real failure reason.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Poll run status
      const runResponse = await runsApi.getRun(runId);
      if (runResponse.status === 'Completed' || runResponse.status === 'Failed' || runResponse.status === 'Aborted') {
        completedSuccessfully = runResponse.status === 'Completed';
        break;
      }

      // Poll for pending questions
      const questionsResponse = await questionsApi.listQuestions(runId);
      for (const q of questionsResponse.questions) {
        if (answeredIds.has(q.id)) continue;

        // Extract gate name from node_id (e.g., FreeformGate, BinaryGate, etc.)
        let answer = gateAnswers[q.node_id];
        if (!answer) {
          // Fallback: answer based on kind
          if (q.kind === 'approval') answer = 'yes';
          else if (q.kind === 'multiple_choice') answer = q.choices[0] || 'yes';
          else answer = 'ok';
        }

        const answerResp = await questionsApi.answerQuestion(runId, q.id, answer);
        expect(answerResp.success).toBe(true);
        answeredIds.add(q.id);
        gatesAnswered++;
      }

      // Small delay before next poll to avoid hammering the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Verify we answered at least one gate and run completed successfully
    expect(gatesAnswered).toBeGreaterThanOrEqual(1);
    expect(completedSuccessfully).toBe(true);
  }, { timeout: 300000 }); // 5 min: each box node between gates is a real Codergen
  // agentic tool-calling loop (read_file/write_file etc, not a single LLM completion),
  // so per-node latency is genuinely variable -- confirmed by observing one node take
  // ~2 minutes across multiple tool calls in a real run during debugging.
});
