// ABOUTME: REST client for human-gate question routes
// ABOUTME: List and answer questions

import { getApiUrl } from './client-config';
import { errorFromResponse } from './errors';
import type { CandidateResponse } from './runs';

export interface Question {
  id: string;
  question: string;
  choices: string[];
  kind: 'free_form' | 'multiple_choice' | 'approval';
  node_id?: string;
}

export interface GalleryGateInfo {
  question_id: string;
  candidates: CandidateResponse[];
  expected_count: number | null;
  outgoing_edges: string[];
}

export interface ListQuestionsResponse {
  questions: Question[];
  gallery_gate: GalleryGateInfo | null;
}

export interface AnswerQuestionRequest {
  answer: string;
}

export interface AnswerQuestionResponse {
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

export async function listQuestions(runId: string): Promise<ListQuestionsResponse> {
  const response = await fetch(getApiUrl(`/runs/${runId}/questions`));
  return handleResponse<ListQuestionsResponse>(response);
}

export async function answerQuestion(
  runId: string,
  questionId: string,
  answer: string,
): Promise<AnswerQuestionResponse> {
  const response = await fetch(getApiUrl(`/runs/${runId}/questions/${questionId}/answer`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  return handleResponse<AnswerQuestionResponse>(response);
}
