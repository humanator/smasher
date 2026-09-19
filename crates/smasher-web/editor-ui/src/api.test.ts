import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGraph, getGraph, saveGraph } from './api';
import type { EditorGraph } from './types';

const sampleGraph: EditorGraph = {
  name: null,
  graph_attrs: {},
  nodes: [],
  edges: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getGraph', () => {
  it('fetches the workflow graph JSON endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleGraph), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getGraph('my-id');

    expect(fetchMock).toHaveBeenCalledWith('/api/workflows/my-id/graph');
    expect(result).toEqual(sampleGraph);
  });

  it('rejects with the server-provided error message on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'workflow not found' }), {
          status: 404,
          statusText: 'Not Found',
        }),
      ),
    );

    await expect(getGraph('missing')).rejects.toThrow('workflow not found');
  });
});

describe('saveGraph', () => {
  it('PUTs the current graph shape to the workflow endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleGraph), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await saveGraph('my-id', sampleGraph);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/workflows/my-id/graph',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(sampleGraph),
      }),
    );
  });
});

describe('createGraph', () => {
  it('POSTs name, target_dir, and graph to the new-workflow endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'examples__brand-new' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createGraph(sampleGraph, 'examples', 'brand-new');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/workflows/new',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'brand-new', target_dir: 'examples', graph: sampleGraph }),
      }),
    );
    expect(result).toEqual({ id: 'examples__brand-new' });
  });
});
