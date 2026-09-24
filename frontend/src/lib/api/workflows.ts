// ABOUTME: REST client for workflow routes
// ABOUTME: Get workflows list, create new, update existing, export/import raw DOT

import { getApiUrl } from './client-config';

export interface EditorNode {
  id: string;
  node_type: string;
  label?: string;
  attrs?: Record<string, unknown>;
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

interface ApiError {
  status: number;
  message: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as unknown as ApiError;
    error.status = response.status;
    throw error;
  }

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

export async function getWorkflowGraph(id: string): Promise<EditorGraph> {
  const response = await fetch(getApiUrl(`/workflows/${id}/graph`));
  return handleResponse<EditorGraph>(response);
}

/** The workflow's DOT source exactly as it is on disk. */
export async function getWorkflowDot(id: string): Promise<string> {
  const response = await fetch(getApiUrl(`/workflows/${id}/dot`));
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as unknown as ApiError;
    error.status = response.status;
    throw error;
  }
  return response.text();
}

export async function updateWorkflowGraph(id: string, graph: EditorGraph): Promise<void> {
  const response = await fetch(getApiUrl(`/workflows/${id}/graph`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graph),
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as unknown as ApiError;
    error.status = response.status;
    throw error;
  }
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
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.error === 'string') {
        message = body.error;
      }
    } catch {
      // Non-JSON error body; keep the status-only message.
    }
    const error = new Error(message) as unknown as ApiError;
    error.status = response.status;
    throw error;
  }
  return handleResponse<CreateGraphResponse>(response);
}
