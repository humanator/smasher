// ABOUTME: Shared error type and builder for failed API responses
// ABOUTME: Every API module throws errorFromResponse so errors carry the server's message

export interface ApiError extends Error {
  status: number;
}

/** An error carrying the response's status and its JSON `error` message, if any. */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (typeof body?.error === 'string') {
      message = body.error;
    }
  } catch {
    // Non-JSON error body; keep the status-only message.
  }
  const error = new Error(message) as ApiError;
  error.status = response.status;
  return error;
}
