// ABOUTME: Tests for the models API client against the REAL server's GET /api/models
// ABOUTME: Checks only what holds for any provider set; the test server's fake claude CLI is always there

import { beforeAll, describe, expect, it } from 'vitest';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import { listModels } from '../../../src/lib/api/models';

describe('listModels', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('returns the configured providers with their models', async () => {
    const providers = await listModels();

    const cli = providers.find((p) => p.provider === 'claude-cli');
    expect(cli).toBeDefined();
    expect(cli!.label).toBe('Claude CLI');
    expect(cli!.default_model).toBe('claude-sonnet');
    expect(cli!.models.map((m) => m.id)).toEqual(['claude-sonnet', 'claude-opus', 'claude-fable']);
  });

  it('gives every provider a model list source, and never a key', async () => {
    const providers = await listModels();

    for (const p of providers) {
      expect(['provider', 'openrouter', 'static']).toContain(p.source);
      expect(JSON.stringify(p)).not.toMatch(/api[_-]?key/i);
    }
  });
});
