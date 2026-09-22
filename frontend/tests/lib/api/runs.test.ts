// ABOUTME: Tests for the runs REST client
// ABOUTME: Tests run against a real smasher-web-api instance, not mocked fetch

import { describe, it, expect, beforeAll } from 'vitest';
import * as runs from '../../../src/lib/api/runs';

const BASE_URL = 'http://127.0.0.1:21541';

describe('runs API client', () => {
  beforeAll(() => {
    runs.setApiBaseUrl(`${BASE_URL}/api`);
  });

  it('should fetch health status', async () => {
    const result = await runs.getHealth();
    expect(result.status).toBe('ok');
  });

  it('should list runs (may be empty)', async () => {
    const result = await runs.listRuns();
    expect(Array.isArray(result.runs)).toBe(true);
  });

  it('should handle non-existent run with 404', async () => {
    try {
      await runs.getRun('nonexistent-run-id-12345');
      expect.fail('Should have thrown 404 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(404);
    }
  });

  it('should get token counts for non-existent run with 404', async () => {
    try {
      await runs.getTokens('nonexistent-run-id-12345');
      expect.fail('Should have thrown 404 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(404);
    }
  });

  it('should get graph SVG for non-existent run with 404', async () => {
    try {
      await runs.renderGraph('nonexistent-run-id-12345');
      expect.fail('Should have thrown 404 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(404);
    }
  });

  it('should list candidates for non-existent run with 404', async () => {
    try {
      await runs.listCandidates('nonexistent-run-id-12345');
      expect.fail('Should have thrown 404 error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(404);
    }
  });

  it('should parse DOT nodes with valid source', async () => {
    const result = await runs.parseGraphNodes({
      dot_source: 'digraph { start [shape=circle]; a [label="Do something"]; end [shape=doublecircle]; start -> a -> end }',
    });
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(result.nodes.length).toBe(3);
    const nodeA = result.nodes.find((n) => n.id === 'a');
    expect(nodeA?.label).toBe('Do something');
  });

  it('should reject invalid DOT source', async () => {
    try {
      await runs.parseGraphNodes({
        dot_source: 'not a valid dot graph',
      });
      expect.fail('Should have thrown parse error');
    } catch (error) {
      const apiError = error as { status: number };
      expect(apiError.status).toBe(422);
    }
  });
});
