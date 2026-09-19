import type { EditorGraph } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body?.error === 'string') {
        message = body.error;
      }
    } catch {
      // Body wasn't JSON (or was empty) -- fall back to statusText.
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function getGraph(id: string): Promise<EditorGraph> {
  return fetch(`/api/workflows/${encodeURIComponent(id)}/graph`).then((res) =>
    handleResponse<EditorGraph>(res),
  );
}

export function saveGraph(id: string, graph: EditorGraph): Promise<EditorGraph> {
  return fetch(`/api/workflows/${encodeURIComponent(id)}/graph`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graph),
  }).then((res) => handleResponse<EditorGraph>(res));
}

export interface CreateGraphResponse {
  id: string;
}

export function createGraph(
  graph: EditorGraph,
  targetDir: string,
  name: string,
): Promise<CreateGraphResponse> {
  return fetch('/api/workflows/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, target_dir: targetDir, graph }),
  }).then((res) => handleResponse<CreateGraphResponse>(res));
}
