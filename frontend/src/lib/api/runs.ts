// ABOUTME: REST client for run management routes
// ABOUTME: Submit, list, get, cancel, resume, token counts, graph rendering, candidates

import { getApiUrl } from './client-config';

export interface HealthResponse {
  status: string;
}

export interface RunSummary {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  graph_name: string;
  error: string | null;
  input_tokens: number;
  output_tokens: number;
  run_working_dir: string | null;
  workflow_id: string | null;
}

export interface ListRunsResponse {
  runs: RunSummary[];
}

export interface SubmitRunRequest {
  dot_source: string;
  variables: Record<string, string>;
  model?: string;
  node_overrides?: Record<string, unknown>;
}

export interface SubmitRunResponse {
  run_id: string;
  status: string;
  run_working_dir?: string;
}

export interface CancelResponse {
  success: boolean;
  status: string;
}

export interface ResumeResponse {
  run_id: string;
  status: string;
  resumed_from_node: string;
}

export interface TokenResponse {
  input_tokens: number;
  output_tokens: number;
}

export interface CandidateResponse {
  candidate_id: string;
  screenshot_url: string;
  bundle_url?: string;
  manifest: Record<string, unknown>;
  scorecard: Record<string, unknown>;
}

export interface ListCandidatesResponse {
  candidates: CandidateResponse[];
}

export interface GraphNodeSummary {
  id: string;
  node_type: string;
  label?: string;
}

export interface GraphNodesResponse {
  nodes: GraphNodeSummary[];
}

export interface GraphNodesRequest {
  dot_source: string;
}

interface ApiError extends Error {
  status: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`) as ApiError;
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T;
  }

  // For non-JSON responses (like SVG), return the text
  const text = await response.text();
  return text as unknown as T;
}


export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(getApiUrl('/health'));
  return handleResponse<HealthResponse>(response);
}

export async function submitRun(req: SubmitRunRequest): Promise<SubmitRunResponse> {
  const response = await fetch(getApiUrl('/runs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return handleResponse<SubmitRunResponse>(response);
}

export async function listRuns(): Promise<ListRunsResponse> {
  const response = await fetch(getApiUrl('/runs'));
  return handleResponse<ListRunsResponse>(response);
}

export async function getRun(id: string): Promise<RunSummary> {
  const response = await fetch(getApiUrl(`/runs/${id}`));
  return handleResponse<RunSummary>(response);
}

export async function cancelRun(id: string): Promise<CancelResponse> {
  const response = await fetch(getApiUrl(`/runs/${id}/cancel`), {
    method: 'POST',
  });
  return handleResponse<CancelResponse>(response);
}

export async function resumeRun(id: string): Promise<ResumeResponse> {
  const response = await fetch(getApiUrl(`/runs/${id}/resume`), {
    method: 'POST',
  });
  return handleResponse<ResumeResponse>(response);
}

export async function getTokens(id: string): Promise<TokenResponse> {
  const response = await fetch(getApiUrl(`/runs/${id}/tokens`));
  return handleResponse<TokenResponse>(response);
}

export async function renderGraph(id: string): Promise<string> {
  const response = await fetch(getApiUrl(`/runs/${id}/graph`));
  return handleResponse<string>(response);
}

export async function listCandidates(id: string): Promise<ListCandidatesResponse> {
  const response = await fetch(getApiUrl(`/runs/${id}/candidates`));
  return handleResponse<ListCandidatesResponse>(response);
}

export async function parseGraphNodes(req: GraphNodesRequest): Promise<GraphNodesResponse> {
  const response = await fetch(getApiUrl('/graph/nodes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return handleResponse<GraphNodesResponse>(response);
}
