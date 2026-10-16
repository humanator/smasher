// ABOUTME: Tests for the settings modal: the default provider/model on the REAL server, in a browser and in the desktop app
// ABOUTME: jsdom has no Tauri runtime, so window.__TAURI__.core.invoke stands in for smasher-desktop's key/CLI commands

import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import SettingsDialog from '../../../src/components/dashboard/SettingsDialog.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import { getSettings, putSettings } from '../../../src/lib/api/settings';
import type { LlmSettings } from '../../../src/lib/native/index';

const stored: LlmSettings = {
  providers: [
    { id: 'anthropic', label: 'Anthropic', base_url: '', has_key: true },
    { id: 'openai', label: 'OpenAI', base_url: '', has_key: false },
    { id: 'gemini', label: 'Gemini', base_url: '', has_key: false },
    { id: 'ollama', label: 'Ollama', base_url: '', has_key: false },
  ],
  claude_cli: {
    path: '',
    allowed_tools: ['Read', 'Write'],
    default_allowed_tools: ['Read', 'Edit', 'Write'],
  },
  settings_path: '/Users/test/Documents/smasher/settings.json',
};

type Call = { command: string; args?: Record<string, unknown> };

/** Stand in for smasher-desktop's commands, recording every invoke. */
function fakeDesktop(overrides: Partial<Record<string, (args?: Record<string, unknown>) => unknown>> = {}) {
  const calls: Call[] = [];
  const handlers: Record<string, (args?: Record<string, unknown>) => unknown> = {
    get_llm_settings: () => stored,
    save_llm_settings: () => stored,
    detect_claude_cli: () => ({
      path: '/Users/test/.local/bin/claude',
      version: '2.1.281 (Claude Code)',
    }),
    ...overrides,
  };
  window.__TAURI__ = {
    core: {
      invoke: (async (command: string, args?: Record<string, unknown>) => {
        calls.push({ command, args });
        return handlers[command](args);
      }) as <T>(command: string, args?: Record<string, unknown>) => Promise<T>,
    },
  };
  return calls;
}

const providerSelect = () => screen.getByTestId('settings-provider') as HTMLSelectElement;
const modelSelect = () => screen.getByTestId('settings-model') as HTMLSelectElement;

async function openDialog() {
  const user = userEvent.setup();
  render(SettingsDialog);
  await user.click(screen.getByRole('button', { name: 'AI model settings' }));
  await screen.findByTestId('settings-provider');
  // The test server always has the claude-cli provider.
  await waitFor(() => expect(providerSelect().querySelector('option[value="claude-cli"]')).toBeTruthy());
  return user;
}

async function pick(user: ReturnType<typeof userEvent.setup>, provider: string, model: string) {
  await user.selectOptions(providerSelect(), provider);
  await user.selectOptions(modelSelect(), model);
}

function savedUpdate(calls: Call[]) {
  const save = calls.find((c) => c.command === 'save_llm_settings');
  return save?.args?.update as {
    providers: { id: string; base_url: string; api_key?: string }[];
    claude_cli_path: string;
    claude_cli_allowed_tools: string[];
  };
}

describe('SettingsDialog', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    delete window.__TAURI__;
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    setApiBaseUrl('http://127.0.0.1:21541/api');
    // Some tests save a default; put the server back to one that is valid for the fake CLI.
    await putSettings({ provider: 'claude-cli', model: 'claude-sonnet' });
  });

  describe('in a browser', () => {
    it('opens from the Settings button and shows the server default and where it came from', async () => {
      await putSettings({ provider: 'claude-cli', model: 'claude-opus' });
      await openDialog();

      expect(providerSelect().value).toBe('claude-cli');
      expect(modelSelect().value).toBe('claude-opus');
      expect(screen.getByTestId('settings-source').textContent).toMatch(/settings file/i);
    });

    it('says API keys come from the environment, and has no key or Claude CLI fields', async () => {
      await openDialog();

      expect(screen.getByText(/environment/i)).toBeTruthy();
      expect(screen.queryByLabelText('Anthropic API key')).toBeNull();
      expect(screen.queryByLabelText('Claude CLI binary path')).toBeNull();
    });

    it('saves a new provider and model on the server, with no restart prompt', async () => {
      const user = await openDialog();

      await pick(user, 'claude-cli', 'claude-fable');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('status')).toHaveTextContent(/Saved/);
      expect(screen.queryByRole('button', { name: 'Restart now' })).toBeNull();
      expect(await getSettings()).toEqual({
        provider: 'claude-cli',
        model: 'claude-fable',
        source: 'settings',
      });
    });

    it('does not save anything until the default is changed', async () => {
      await openDialog();

      expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('asks for a provider instead of saving a model with none', async () => {
      const user = await openDialog();

      await user.selectOptions(providerSelect(), '');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/provider/i);
    });

    it('shows the error when the server cannot be reached', async () => {
      const user = await openDialog();
      await pick(user, 'claude-cli', 'claude-opus');

      setApiBaseUrl('http://127.0.0.1:1/api');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(screen.queryByRole('status')).toBeNull();
    });
  });

  describe('in the desktop app', () => {
    it('shows each provider\'s key and base URL fields and the Claude CLI section', async () => {
      fakeDesktop();
      await openDialog();

      expect(screen.getByText('/Users/test/Documents/smasher/settings.json')).toBeTruthy();
      for (const label of ['Anthropic', 'OpenAI', 'Gemini', 'Ollama']) {
        expect(screen.getByLabelText(`${label} API key`)).toBeTruthy();
        expect(screen.getByLabelText(`${label} base URL`)).toBeTruthy();
      }
      expect(screen.queryByText(/environment/i)).toBeNull();
    });

    it('shows which providers already have a key in the Keychain', async () => {
      fakeDesktop();
      await openDialog();

      expect(screen.getByLabelText('Anthropic API key').getAttribute('placeholder')).toMatch(/Keychain/);
      expect(screen.getByLabelText('OpenAI API key').getAttribute('placeholder')).toBe('Not set');
    });

    it('saves keys and base URLs with no default model in the update, and no restart prompt', async () => {
      const calls = fakeDesktop();
      const user = await openDialog();

      await user.type(screen.getByLabelText('Ollama base URL'), 'http://localhost:11434');
      await user.type(screen.getByLabelText('OpenAI API key'), 'sk-new');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('status')).toHaveTextContent(/Saved/);
      expect(screen.queryByText(/Restart/)).toBeNull();
      const update = savedUpdate(calls);
      expect('default_model' in update).toBe(false);
      expect('default_provider' in update).toBe(false);
      const byId = Object.fromEntries(update.providers.map((p) => [p.id, p]));
      expect(byId.openai.api_key).toBe('sk-new');
      expect(byId.ollama.base_url).toBe('http://localhost:11434');
      expect('api_key' in byId.anthropic).toBe(false);
    });

    it('saves a changed default on the server as well as the keys', async () => {
      const calls = fakeDesktop();
      const user = await openDialog();

      await pick(user, 'claude-cli', 'claude-opus');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('status')).toHaveTextContent(/Saved/);
      expect(calls.some((c) => c.command === 'save_llm_settings')).toBe(true);
      expect((await getSettings()).model).toBe('claude-opus');
    });

    it('removes a stored key with an empty api_key', async () => {
      const calls = fakeDesktop();
      const user = await openDialog();

      await user.click(screen.getByRole('button', { name: 'Remove Anthropic API key' }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await screen.findByRole('status');
      const anthropic = savedUpdate(calls).providers.find((p) => p.id === 'anthropic');
      expect(anthropic?.api_key).toBe('');
    });

    it('shows the error when saving fails, with no success message', async () => {
      fakeDesktop({
        save_llm_settings: () => {
          throw 'Ollama base URL must start with http:// or https://';
        },
      });
      const user = await openDialog();

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ollama base URL must start with http:// or https://'
      );
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('shows the error when loading fails', async () => {
      fakeDesktop({
        get_llm_settings: () => {
          throw 'settings.json is not valid settings JSON';
        },
      });
      const user = userEvent.setup();
      render(SettingsDialog);

      await user.click(screen.getByRole('button', { name: 'AI model settings' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('not valid settings JSON');
    });

    it('shows Claude CLI with a path, the detected version and the allowlist, and no key field', async () => {
      fakeDesktop();
      await openDialog();

      const path = screen.getByLabelText('Claude CLI binary path') as HTMLInputElement;
      expect(path.value).toBe('');
      expect(path.getAttribute('placeholder')).toContain('/Users/test/.local/bin/claude');
      expect(await screen.findByText(/2\.1\.281 \(Claude Code\)/)).toBeTruthy();
      const tools = screen.getByLabelText('Claude CLI allowed tools') as HTMLTextAreaElement;
      expect(tools.value).toBe('Read\nWrite');
      expect(screen.queryByLabelText('Claude CLI API key')).toBeNull();
    });

    it('says when the Claude CLI is not found', async () => {
      fakeDesktop({ detect_claude_cli: () => ({ path: null, version: null }) });
      await openDialog();

      expect(await screen.findByText(/not found/i)).toBeTruthy();
    });

    it('re-detects the Claude CLI at a typed path', async () => {
      const calls = fakeDesktop();
      const user = await openDialog();

      await user.type(screen.getByLabelText('Claude CLI binary path'), '/opt/claude');
      await user.click(screen.getByRole('button', { name: 'Detect Claude CLI' }));

      await waitFor(() =>
        expect(
          calls.some((c) => c.command === 'detect_claude_cli' && c.args?.path === '/opt/claude')
        ).toBe(true)
      );
    });

    it('saves the Claude CLI path and allowlist', async () => {
      const calls = fakeDesktop();
      const user = await openDialog();

      await user.type(screen.getByLabelText('Claude CLI binary path'), '/opt/claude');
      const tools = screen.getByLabelText('Claude CLI allowed tools');
      await user.clear(tools);
      await user.type(tools, 'Read{Enter}  {Enter}Bash(npm run build:*)');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await screen.findByRole('status');
      const update = savedUpdate(calls);
      expect(update.claude_cli_path).toBe('/opt/claude');
      expect(update.claude_cli_allowed_tools).toEqual(['Read', 'Bash(npm run build:*)']);
    });

    it('resets the allowlist to the default', async () => {
      fakeDesktop();
      const user = await openDialog();

      await user.click(screen.getByRole('button', { name: 'Reset allowed tools to default' }));

      const tools = screen.getByLabelText('Claude CLI allowed tools') as HTMLTextAreaElement;
      expect(tools.value).toBe('Read\nEdit\nWrite');
    });
  });
});
