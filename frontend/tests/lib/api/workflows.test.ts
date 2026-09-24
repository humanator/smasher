// ABOUTME: Tests for the workflows REST client's raw-DOT export and import
// ABOUTME: Calls the REAL smasher-web-api instance and compares against files on disk

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import * as workflows from '../../../src/lib/api/workflows';
import * as runs from '../../../src/lib/api/runs';
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

describe('workflows API client - raw DOT import', () => {
  const helloWorld = readFileSync(
    join(process.cwd(), '..', 'examples', 'old-examples', 'hello-world.dot'),
    'utf-8'
  );
  const importedIds: string[] = [];

  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  // Imports land in the real server's {data_dir}/workflows; find each file
  // through the API so the test never assumes where that is.
  afterEach(async () => {
    const { workflows: all } = await workflows.listWorkflows();
    for (const id of importedIds.splice(0)) {
      const found = all.find((w) => w.id === id);
      if (found) rmSync(found.path, { force: true });
    }
  });

  const uniqueName = () => `_test_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  it('imports valid DOT byte-for-byte as a listed, runnable workflow (export round trip)', async () => {
    const { id } = await workflows.importWorkflowDot(uniqueName(), helloWorld);
    importedIds.push(id);

    const { workflows: all } = await workflows.listWorkflows();
    expect(all.some((w) => w.id === id)).toBe(true);
    expect(await workflows.getWorkflowDot(id)).toBe(helloWorld);
    const run = await runs.runWorkflow(id);
    expect(run.run_id).toBeTruthy();
  });

  it('rejects invalid DOT with a 400 carrying the parse message', async () => {
    await expect(workflows.importWorkflowDot(uniqueName(), 'digraph { a -> ')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('invalid DOT'),
    });
  });

  it('rejects importing over an existing workflow name with a 409', async () => {
    const name = uniqueName();
    const { id } = await workflows.importWorkflowDot(name, helloWorld);
    importedIds.push(id);

    await expect(workflows.importWorkflowDot(name, helloWorld)).rejects.toMatchObject({
      status: 409,
    });
  });
});
