// ABOUTME: Tests for errorFromResponse, the shared error builder for all API modules
// ABOUTME: Uses real Response objects to cover JSON, non-JSON and empty error bodies

import { describe, it, expect } from 'vitest';
import { errorFromResponse } from '../../../src/lib/api/errors';

describe('errorFromResponse', () => {
  it('uses the JSON body error string and the HTTP status', async () => {
    const response = new Response(JSON.stringify({ error: 'not found: run x' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });

    const error = await errorFromResponse(response);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('not found: run x');
    expect(error.status).toBe(404);
  });

  it('falls back to HTTP <status> when the JSON body has no error', async () => {
    const response = new Response(JSON.stringify({ detail: 'nope' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });

    const error = await errorFromResponse(response);

    expect(error.message).toBe('HTTP 500');
    expect(error.status).toBe(500);
  });

  it('falls back to HTTP <status> for a non-JSON body', async () => {
    const response = new Response('<html>Bad Gateway</html>', { status: 502 });

    const error = await errorFromResponse(response);

    expect(error.message).toBe('HTTP 502');
    expect(error.status).toBe(502);
  });

  it('falls back to HTTP <status> for an empty body', async () => {
    const response = new Response(null, { status: 503 });

    const error = await errorFromResponse(response);

    expect(error.message).toBe('HTTP 503');
    expect(error.status).toBe(503);
  });

  it('ignores a non-string error field', async () => {
    const response = new Response(JSON.stringify({ error: { code: 1 } }), { status: 400 });

    const error = await errorFromResponse(response);

    expect(error.message).toBe('HTTP 400');
  });
});
