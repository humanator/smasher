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

// Read a simple workflow for event testing
const consensusTaskDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'consensus_task.dot'),
  'utf-8'
);

describe('events SSE client - REAL EVENT STREAM INTEGRATION TESTS', () => {
  // Skip EventSource tests in jsdom/nodejs test environment - EventSource is browser-only
  // In a real browser environment (or Node.js with EventSource polyfill), these tests would run
  const skipIfNoEventSource = typeof EventSource === 'undefined' ? it.skip : it;

  beforeAll(() => {
    setApiBaseUrl(API_URL);
  });

  skipIfNoEventSource('should subscribe to pipeline events and receive pipeline_started', async () => {
    // Submit a run
    const submitResp = await runsModule.submitRun({
      dot_source: consensusTaskDot,
      variables: { test: 'events' },
    });

    const runId = submitResp.run_id;

    // Track events received
    const events: eventsModule.PipelineEvent[] = [];
    let unsubscribe: (() => void) | null = null;

    // Wait a bit for the event stream to start
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Subscribe to events
    unsubscribe = eventsModule.subscribeToPipelineEvents(runId, (event) => {
      events.push(event);
    });

    // Wait for pipeline_started event to arrive
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (events.some((e) => e.kind === 'pipeline_started')) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });

    // Should have received at least pipeline_started
    expect(events.length).toBeGreaterThan(0);
    const startedEvent = events.find((e) => e.kind === 'pipeline_started');
    expect(startedEvent).toBeDefined();
    expect(startedEvent?.kind).toBe('pipeline_started');

    // Verify event has correct shape
    if (startedEvent?.kind === 'pipeline_started') {
      expect(startedEvent.timestamp).toBeDefined();
      expect(typeof startedEvent.timestamp).toBe('string');
      expect(startedEvent.graph_name).toBeDefined();
    }

    // Cleanup
    if (unsubscribe) {
      unsubscribe();
    }
  });

  skipIfNoEventSource('should discriminate event types via kind property', async () => {
    // Submit a run
    const submitResp = await runsModule.submitRun({
      dot_source: consensusTaskDot,
      variables: { test: 'discrimination' },
    });

    const runId = submitResp.run_id;

    // Track events
    const events: eventsModule.PipelineEvent[] = [];
    let unsubscribe: (() => void) | null = null;

    // Wait a bit for the event stream to start
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Subscribe
    unsubscribe = eventsModule.subscribeToPipelineEvents(runId, (event) => {
      events.push(event);
    });

    // Wait for any event
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (events.length > 0) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });

    // Verify events have discriminated types
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.kind).toBeDefined();
      expect(event.timestamp).toBeDefined();
      // Each event should have a valid kind
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
      expect(validKinds).toContain(event.kind);
    }

    // Cleanup
    if (unsubscribe) {
      unsubscribe();
    }
  });
});
