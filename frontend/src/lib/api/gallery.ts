// ABOUTME: REST client for gallery-gate routes
// ABOUTME: Get candidates and submit decisions

import { getApiUrl } from './client-config';
import { errorFromResponse } from './errors';

export interface GalleryDecisionRequest {
  selected: string[];
  decision: string;
  comments: Record<string, string>;
}

export interface GalleryDecisionResponse {
  success: boolean;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await errorFromResponse(response);

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T;
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
