// ABOUTME: Tests for the workflows REST client's raw-DOT export
// ABOUTME: Calls the REAL smasher-web-api instance and compares against files on disk

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as workflows from '../../../src/lib/api/workflows';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

describe('workflows API client - raw DOT export', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('returns the exact on-disk DOT source for a workflow', async () => {
    const onDisk = readFileSync(
      join(process.cwd(), '..', 'examples', 'human_gate_showcase.dot'),
      'utf-8'
    );

    const dot = await workflows.getWorkflowDot('examples__human_gate_showcase');

    expect(dot).toBe(onDisk);
  });

  it('rejects with a 404 status for an unknown workflow id', async () => {
    await expect(workflows.getWorkflowDot('nonexistent__workflow__id')).rejects.toMatchObject({
      status: 404,
    });
  });
});
