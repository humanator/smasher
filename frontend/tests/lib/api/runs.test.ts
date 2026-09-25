// ABOUTME: Tests for the runs REST client
// ABOUTME: Tests call the REAL smasher-web-api instance, not mocked fetch

import { describe, it, expect, beforeAll } from 'vitest';
import * as runs from '../../../src/lib/api/runs';
import * as workflows from '../../../src/lib/api/workflows';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://127.0.0.1:21541';
const API_URL = `${BASE_URL}/api`;

// Read real workflow from examples
const consensusTaskDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'consensus_task.dot'),
  'utf-8'
);

// Submitted runs park on this human gate, so no LLM node ever runs.
const gatedDot = `digraph RunsApiGated {
  start [shape=circle];
  gate [shape=oval, label="Proceed?"];
  done [shape=doublecircle];
  start -> gate -> done;
}`;

describe('runs API client - REAL API INTEGRATION TESTS', () => {
  beforeAll(() => {
    setApiBaseUrl(API_URL);
  });

  it('should fetch health status from real server', async () => {
    const result = await runs.getHealth();
    expect(result.status).toBe('ok');
  });

  it('should submit a real run and get back a run_id', async () => {
    const response = await runs.submitRun({
      dot_source: gatedDot,
      variables: { test: 'integration' },
    });

    expect(response.run_id).toBeDefined();
    expect(typeof response.run_id).toBe('string');
    expect(response.run_id.length).toBeGreaterThan(0);
    expect(response.status).toBe('Running');
  });

  it('should list runs and get array of run summaries', async () => {
    // Submit a run first
    const submitResp = await runs.submitRun({
      dot_source: gatedDot,
      variables: { test: 'list' },
    });

    // Now list runs
    const listResp = await runs.listRuns();
    expect(Array.isArray(listResp.runs)).toBe(true);
    expect(listResp.runs.length).toBeGreaterThan(0);

    // The run we just submitted should be in the list
    const foundRun = listResp.runs.find((r) => r.id === submitResp.run_id);
    expect(foundRun).toBeDefined();
    expect(foundRun?.status).toBe('Running');
  });

  it('should get a specific run by id', async () => {
    // Submit a run
    const submitResp = await runs.submitRun({
      dot_source: gatedDot,
      variables: { test: 'get' },
    });

    // Get that specific run
    const getRun = await runs.getRun(submitResp.run_id);
    expect(getRun.id).toBe(submitResp.run_id);
    expect(getRun.status).toBe('Running');
    expect(getRun.started_at).toBeDefined();
    expect(getRun.graph_name).toBeDefined();
  });

  it('should parse graph nodes from DOT source', async () => {
    const result = await runs.parseGraphNodes({
      dot_source: consensusTaskDot,
    });

    expect(Array.isArray(result.nodes)).toBe(true);
    expect(result.nodes.length).toBeGreaterThan(0);

    // Should have Start, Exit, and other nodes (node_type is lowercase, id preserves case)
    const startNode = result.nodes.find((n) => n.id === 'Start');
    const exitNode = result.nodes.find((n) => n.id === 'Exit');
    expect(startNode).toBeDefined();
    expect(exitNode).toBeDefined();
    expect(startNode?.node_type).toBe('start');
    expect(exitNode?.node_type).toBe('exit');
  });

  it('should return 404 for non-existent run', async () => {
    try {
      await runs.getRun('nonexistent-run-id-xyz-12345');
      expect.fail('Should have thrown 404 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(404);
    }
  });

  it('should return 422 for invalid DOT source', async () => {
    try {
      await runs.parseGraphNodes({
        dot_source: 'this is not valid dot syntax at all',
      });
      expect.fail('Should have thrown 422 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(422);
    }
  });

  it('should get token counts for a real run', async () => {
    // Submit a run
    const submitResp = await runs.submitRun({
      dot_source: gatedDot,
      variables: { test: 'tokens' },
    });

    // Get token counts
    const tokens = await runs.getTokens(submitResp.run_id);
    expect(typeof tokens.input_tokens).toBe('number');
    expect(typeof tokens.output_tokens).toBe('number');
    expect(tokens.input_tokens).toBeGreaterThanOrEqual(0);
    expect(tokens.output_tokens).toBeGreaterThanOrEqual(0);
  });

  it('should launch a real run from an on-disk workflow via runWorkflow, associated with that workflow', async () => {
    const { workflows: available } = await workflows.listWorkflows();
    // Starts at a human gate, so the run parks there and never reaches an LLM node.
    const workflow = available.find((w) => w.name === 'human_gate_showcase.dot');
    expect(workflow).toBeTruthy();

    const response = await runs.runWorkflow(workflow!.id, { variables: { test: 'run-workflow' } });
    expect(response.run_id).toBeTruthy();
    expect(response.status).toBe('Running');

    const run = await runs.getRun(response.run_id);
    expect(run.workflow_id).toBe(workflow!.id);
  });

  it('should return 404 from runWorkflow for an unknown workflow id', async () => {
    try {
      await runs.runWorkflow('no-such-workflow-id');
      expect.fail('Should have thrown a 404 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(404);
    }
  });
});
