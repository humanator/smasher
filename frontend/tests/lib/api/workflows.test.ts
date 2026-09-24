// ABOUTME: Tests for the workflows REST client's raw-DOT export/import and ETag-checked graph saves
// ABOUTME: Calls the REAL smasher-web-api instance and compares against files on disk

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { appendFileSync, readFileSync, rmSync } from 'fs';
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

describe('workflows API client - graph load and save with ETag', () => {
  const helloWorld = readFileSync(
    join(process.cwd(), '..', 'examples', 'old-examples', 'hello-world.dot'),
    'utf-8'
  );
  let path: string;
  let id: string;

  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  beforeEach(async () => {
    const name = `_test_etag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    ({ id } = await workflows.importWorkflowDot(name, helloWorld));
    const { workflows: all } = await workflows.listWorkflows();
    path = all.find((w) => w.id === id)!.path;
  });

  afterEach(() => {
    rmSync(path, { force: true });
  });

  it('returns the graph together with a quoted ETag', async () => {
    const { graph, etag } = await workflows.getWorkflowGraph(id);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(etag).toMatch(/^"[0-9a-f]{64}"$/);
  });

  it('saves with a matching If-Match and hands back a new ETag good for the next save', async () => {
    const { graph, etag } = await workflows.getWorkflowGraph(id);
    const next = await workflows.updateWorkflowGraph(id, graph, etag ?? undefined);
    expect(next).toMatch(/^"[0-9a-f]{64}"$/);
    expect(next).not.toBe(etag);

    await expect(workflows.updateWorkflowGraph(id, graph, next ?? undefined)).resolves.toBeTruthy();
  });

  it('rejects a stale save with status 409 and the server message, leaving the file alone', async () => {
    const { graph, etag } = await workflows.getWorkflowGraph(id);
    appendFileSync(path, '// edited elsewhere\n');
    const changed = readFileSync(path, 'utf-8');

    await expect(workflows.updateWorkflowGraph(id, graph, etag ?? undefined)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('changed on disk'),
    });
    expect(readFileSync(path, 'utf-8')).toBe(changed);
  });

  it('overwrites a changed file when no ETag is sent', async () => {
    const { graph } = await workflows.getWorkflowGraph(id);
    appendFileSync(path, '// edited elsewhere\n');

    await workflows.updateWorkflowGraph(id, graph);
    expect(readFileSync(path, 'utf-8')).not.toContain('edited elsewhere');
  });
});
