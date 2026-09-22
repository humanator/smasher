// ABOUTME: REST client for gallery-gate routes
// ABOUTME: Get candidates and submit decisions

import { getApiUrl } from './client-config';

export interface GalleryDecisionRequest {
  selected: string[];
  decision: string;
  comments: Record<string, string>;
}

export interface GalleryDecisionResponse {
  success: boolean;
  error?: string;
}

interface ApiError extends Error {
  status: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  throw new Error('Unexpected response format');
}

export async function submitGalleryDecision(
  runId: string,
  questionId: string,
  decision: GalleryDecisionRequest,
): Promise<GalleryDecisionResponse> {
  const response = await fetch(getApiUrl(`/runs/${runId}/gallery/${questionId}/decision`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  });
  return handleResponse<GalleryDecisionResponse>(response);
}
