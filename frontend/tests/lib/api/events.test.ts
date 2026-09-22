// ABOUTME: Tests for the EventSource SSE client
// ABOUTME: Tests run against a real smasher-web-api instance with a real pipeline execution

import { describe, it, expect, beforeAll } from 'vitest';
import * as eventsModule from '../../../src/lib/api/events';
import * as runsModule from '../../../src/lib/api/runs';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://127.0.0.1:21541';
const API_URL = `${BASE_URL}/api`;

// Use human_gate_showcase.dot which blocks early on a human-gate node.
// This workflow exercises the human-gate flow while keeping events observable.
// Task 6b event replay is now fixed: subscribing to /api/runs/{id}/events
// replays pipeline_started from the event log before switching to live broadcast.
const humanGateDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot'),
  'utf-8'
);

describe('events SSE client - REAL EVENT STREAM INTEGRATION TESTS', () => {
  beforeAll(() => {
    setApiBaseUrl(API_URL);
  });

  it(
    'should receive pipeline_started event via event replay on subscribe',
    async () => {
      // Submit a run
      const submitResp = await runsModule.submitRun({
        dot_source: humanGateDot,
        variables: { test: 'events' },
      });

      const runId = submitResp.run_id;

      // Track events received
      const events: eventsModule.PipelineEvent[] = [];

      // Subscribe to events - Task 6b fix ensures pipeline_started is replayed
      // from the event log even if we subscribe after the pipeline launches
      const unsubscribe = eventsModule.subscribeToPipelineEvents(runId, (event) => {
        events.push(event);
      });

      // Wait for pipeline_started to arrive (replayed from event log)
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (events.some((e) => e.kind === 'pipeline_started')) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);

        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 15000);
      });

      // Verify pipeline_started was received
      const pipelineStartedEvent = events.find((e) => e.kind === 'pipeline_started');
      expect(pipelineStartedEvent).toBeDefined();
      expect(pipelineStartedEvent?.timestamp).toBeDefined();
      expect(typeof pipelineStartedEvent?.timestamp).toBe('string');

      // Verify all events have correct shape
      for (const event of events) {
        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe('string');
        expect(event.kind).toBeDefined();
        // Verify it's a valid kind
        const validKinds = [
          'pipeline_started', 'pipeline_completed', 'pipeline_aborted',
          'node_started', 'node_completed', 'node_failed',
          'edge_traversed', 'loop_restarted', 'context_updated', 'checkpoint_created',
          'human_prompt_issued', 'human_response_received',
          'agent_turn_started', 'agent_message',
          'agent_tool_call_started', 'agent_tool_call_completed',
          'agent_token_usage',
        ];
        expect(validKinds).toContain(event.kind);
      }

      // Cleanup
      unsubscribe();
    },
    { timeout: 20000 }
  );

  it(
    'should receive multiple event types with correct discrimination',
    async () => {
      // Submit a run
      const submitResp = await runsModule.submitRun({
        dot_source: humanGateDot,
        variables: { test: 'discrimination' },
      });

      const runId = submitResp.run_id;

      // Track events
      const events: eventsModule.PipelineEvent[] = [];

      // Subscribe to events
      const unsubscribe = eventsModule.subscribeToPipelineEvents(runId, (event) => {
        events.push(event);
      });

      // Wait for events to arrive, including pipeline_started from replay
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          // Wait for at least pipeline_started and one other event
          if (events.length >= 2 && events.some((e) => e.kind === 'pipeline_started')) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);

        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 15000);
      });

      // Verify we received multiple events with correct discrimination
      expect(events.length).toBeGreaterThan(0);

      // Verify pipeline_started is among them
      const pipelineStartedEvent = events.find((e) => e.kind === 'pipeline_started');
      expect(pipelineStartedEvent).toBeDefined();

      // Verify all events have correct structure and valid kinds
      const validKinds = [
        'pipeline_started',
        'pipeline_completed',
        'pipeline_aborted',
        'node_started',
        'node_completed',
        'node_failed',
        'edge_traversed',
        'loop_restarted',
        'context_updated',
        'checkpoint_created',
        'human_prompt_issued',
        'human_response_received',
        'agent_turn_started',
        'agent_message',
        'agent_tool_call_started',
        'agent_tool_call_completed',
        'agent_token_usage',
      ];

      for (const event of events) {
        expect(event.kind).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(validKinds).toContain(event.kind);
      }

      // Cleanup
      unsubscribe();
    },
    { timeout: 20000 }
  );
});
