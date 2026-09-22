// ABOUTME: REST client for workflow routes
// ABOUTME: Get workflows list, create new, update existing

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

export interface CreateGraphResponse {
  workflow_id: string;
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

export async function getWorkflowGraph(id: string): Promise<EditorGraph> {
  const response = await fetch(getApiUrl(`/workflows/${id}/graph`));
  return handleResponse<EditorGraph>(response);
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

export async function createWorkflowGraph(graph: EditorGraph): Promise<CreateGraphResponse> {
  const response = await fetch(getApiUrl('/workflows/new'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graph),
  });
  return handleResponse<CreateGraphResponse>(response);
}
