// ABOUTME: REST client for workflow routes
// ABOUTME: Get workflows list, create new, update existing (ETag-checked), export/import raw DOT

import { getApiUrl } from './client-config';
import { errorFromResponse } from './errors';

// AttrValue mirrors smasher-attractor's scalar attribute values -- what
// editor_api.rs's attr_value_to_json emits for every node attr.
export type AttrValue = string | number | boolean;

export interface EditorNode {
  id: string;
  node_type: string;
  label?: string;
  attrs?: Record<string, AttrValue>;
}

export interface EditorEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string;
  priority?: number;
  loop_restart?: boolean;
  attrs?: Record<string, unknown>;
}

export interface EditorGraph {
  name?: string;
  nodes: EditorNode[];
  edges: EditorEdge[];
  graph_attrs?: Record<string, unknown>;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  source_dir: string;
  path: string;
}

export interface WorkflowsListResponse {
  workflows: WorkflowSummary[];
  available_target_dirs: string[];
}

export interface CreateGraphResponse {
  id: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await errorFromResponse(response);

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T;
  }

  throw new Error('Unexpected response format');
}

export async function listWorkflows(): Promise<WorkflowsListResponse> {
  const response = await fetch(getApiUrl('/workflows'));
  return handleResponse<WorkflowsListResponse>(response);
}

/**
 * A workflow's graph plus the ETag of the file it came from. Pass the etag
 * to `updateWorkflowGraph` so a save over a file changed since is refused.
 */
export async function getWorkflowGraph(
  id: string
): Promise<{ graph: EditorGraph; etag: string | null }> {
  const response = await fetch(getApiUrl(`/workflows/${id}/graph`));
  const graph = await handleResponse<EditorGraph>(response);
  return { graph, etag: response.headers.get('ETag') };
}

/** The workflow's DOT source exactly as it is on disk. */
export async function getWorkflowDot(id: string): Promise<string> {
  const response = await fetch(getApiUrl(`/workflows/${id}/dot`));
  if (!response.ok) throw await errorFromResponse(response);
  return response.text();
}

/**
 * Save a workflow's graph and return the saved file's new ETag. With `etag`,
 * the server refuses the save (status 409) if the file changed on disk since
 * that etag was read; without it, the save overwrites whatever is there.
 * Rejects with the server's message and HTTP status on failure.
 */
export async function updateWorkflowGraph(
  id: string,
  graph: EditorGraph,
  etag?: string
): Promise<string | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (etag) headers['If-Match'] = etag;
  const response = await fetch(getApiUrl(`/workflows/${id}/graph`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(graph),
  });
  if (!response.ok) throw await errorFromResponse(response);
  return response.headers.get('ETag');
}

export async function createWorkflowGraph(
  graph: EditorGraph,
  targetDir: string,
  name: string
): Promise<CreateGraphResponse> {
  const request = {
    name,
    target_dir: targetDir,
    graph,
  };
  const response = await fetch(getApiUrl('/workflows/new'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<CreateGraphResponse>(response);
}

/**
 * Import raw DOT as a new workflow named `name`. Rejects with the server's
 * message (e.g. the DOT parse error) and HTTP status on failure.
 */
export async function importWorkflowDot(name: string, dot: string): Promise<CreateGraphResponse> {
  const response = await fetch(getApiUrl('/workflows/import'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dot }),
  });
  if (!response.ok) throw await errorFromResponse(response);
  return handleResponse<CreateGraphResponse>(response);
}
