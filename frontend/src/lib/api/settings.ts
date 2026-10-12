// ABOUTME: REST client for the default provider and model that new runs use
// ABOUTME: GET reads it, PUT validates and saves it; the server never returns API keys

import { getApiUrl } from './client-config';
import { errorFromResponse } from './errors';

export interface LlmDefaults {
  /** Null when only a model is set (the provider is inferred from its name). */
  provider: string | null;
  model: string;
  /** Where the value came from: the settings file, the environment, or the built-in default. */
  source: 'settings' | 'env' | 'default';
}

export async function getSettings(): Promise<LlmDefaults> {
  const response = await fetch(getApiUrl('/settings'));
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as LlmDefaults;
}

/** Save the default pair. Rejects with the server's message when the pair is invalid. */
export async function putSettings(pair: { provider: string; model: string }): Promise<LlmDefaults> {
  const response = await fetch(getApiUrl('/settings'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pair),
  });
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as LlmDefaults;
}
