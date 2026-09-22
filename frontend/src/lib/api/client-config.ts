// ABOUTME: Runtime configuration for API client
// ABOUTME: Single source of truth for base URL, never hardcoded in individual calls

let baseUrl = '/api';

export function setApiBaseUrl(url: string): void {
  baseUrl = url;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}

export function getApiUrl(path: string): string {
  return `${baseUrl}${path}`;
}
