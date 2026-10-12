// ABOUTME: REST client for the model catalog route
// ABOUTME: Lists the configured LLM providers and the models each one offers

import { getApiUrl } from './client-config';
import { errorFromResponse } from './errors';

export interface ModelOption {
  id: string;
  label: string;
  aliases: string[];
}

export interface ProviderModels {
  provider: string;
  label: string;
  /** Null when the provider has no fixed default (Ollama): the user must pick one. */
  default_model: string | null;
  models: ModelOption[];
  /** Where the list came from: the provider's own API, OpenRouter, or the built-in catalog. */
  source: 'provider' | 'openrouter' | 'static';
  /** Why a fallback list was served, if one was. */
  error?: string;
}

export async function listModels(): Promise<ProviderModels[]> {
  const response = await fetch(getApiUrl('/models'));
  if (!response.ok) throw await errorFromResponse(response);
  const body = (await response.json()) as { providers: ProviderModels[] };
  return body.providers;
}
