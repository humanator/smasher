// ABOUTME: Tests for the settings API client against the REAL server's GET/PUT /api/settings
// ABOUTME: Each test that saves puts the server's default back to a valid pair afterwards

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import { getSettings, putSettings } from '../../../src/lib/api/settings';

describe('settings API', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  // The test server runs the fake claude CLI, so claude-cli is always configured.
  afterEach(async () => {
    await putSettings({ provider: 'claude-cli', model: 'claude-sonnet' });
  });

  it('reads the current default with where it came from', async () => {
    const settings = await getSettings();

    expect(typeof settings.model).toBe('string');
    expect(['settings', 'env', 'default']).toContain(settings.source);
    expect('api_key' in settings).toBe(false);
  });

  it('saves a valid pair and reads it back as coming from settings', async () => {
    const saved = await putSettings({ provider: 'claude-cli', model: 'claude-opus' });

    expect(saved).toEqual({ provider: 'claude-cli', model: 'claude-opus', source: 'settings' });
    expect(await getSettings()).toEqual(saved);
  });

  it('rejects a mismatched pair with the server message and saves nothing', async () => {
    await putSettings({ provider: 'claude-cli', model: 'claude-opus' });

    await expect(
      putSettings({ provider: 'claude-cli', model: 'gemma4:31b-cloud' })
    ).rejects.toThrow(/gemma4:31b-cloud/);

    expect((await getSettings()).model).toBe('claude-opus');
  });
});
