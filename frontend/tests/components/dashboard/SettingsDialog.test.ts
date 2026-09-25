// ABOUTME: Tests for the desktop LLM settings modal: loading, the save payload, errors, and restart
// ABOUTME: jsdom has no Tauri runtime, so window.__TAURI__.core.invoke stands in for smasher-desktop's commands

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import SettingsDialog from '../../../src/components/dashboard/SettingsDialog.svelte';
import type { LlmSettings } from '../../../src/lib/native/index';

const stored: LlmSettings = {
  default_model: 'claude-sonnet-4-20250514',
  default_provider: '',
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
    restart_app: () => undefined,
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

async function openDialog() {
  const user = userEvent.setup();
  render(SettingsDialog);
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  await screen.findByLabelText('Default model');
  return user;
}

function savedUpdate(calls: Call[]) {
  const save = calls.find((c) => c.command === 'save_llm_settings');
  return save?.args?.update as {
    default_model: string;
    default_provider: string;
    providers: { id: string; base_url: string; api_key?: string }[];
    claude_cli_path: string;
    claude_cli_allowed_tools: string[];
  };
}

describe('SettingsDialog', () => {
  afterEach(() => {
    delete window.__TAURI__;
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
  });

  it('loads the stored settings when opened', async () => {
    fakeDesktop();
    await openDialog();

    expect((screen.getByLabelText('Default model') as HTMLInputElement).value).toBe(
      'claude-sonnet-4-20250514'
    );
    expect(screen.getByText('/Users/test/Documents/smasher/settings.json')).toBeTruthy();
    for (const label of ['Anthropic', 'OpenAI', 'Gemini', 'Ollama']) {
      expect(screen.getByLabelText(`${label} API key`)).toBeTruthy();
      expect(screen.getByLabelText(`${label} base URL`)).toBeTruthy();
    }
  });

  it('shows which providers already have a key in the Keychain', async () => {
    fakeDesktop();
    await openDialog();

    expect(screen.getByLabelText('Anthropic API key').getAttribute('placeholder')).toMatch(/Keychain/);
    expect(screen.getByLabelText('OpenAI API key').getAttribute('placeholder')).toBe('Not set');
  });

  it('saves edits, sending only the keys that were typed', async () => {
    const calls = fakeDesktop();
    const user = await openDialog();

    await user.clear(screen.getByLabelText('Default model'));
    await user.type(screen.getByLabelText('Default model'), 'gemma4:31b-cloud');
    await user.selectOptions(screen.getByLabelText('Default provider'), 'ollama');
    await user.type(screen.getByLabelText('Ollama base URL'), 'http://localhost:11434');
    await user.type(screen.getByLabelText('OpenAI API key'), 'sk-new');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText(/Restart Smasher to apply/);
    const update = savedUpdate(calls);
    expect(update.default_model).toBe('gemma4:31b-cloud');
    expect(update.default_provider).toBe('ollama');
    const byId = Object.fromEntries(update.providers.map((p) => [p.id, p]));
    expect(byId.openai.api_key).toBe('sk-new');
    expect(byId.ollama.base_url).toBe('http://localhost:11434');
    expect('api_key' in byId.anthropic).toBe(false);
  });

  it('removes a stored key with an empty api_key', async () => {
    const calls = fakeDesktop();
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Remove Anthropic API key' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText(/Restart Smasher to apply/);
    const anthropic = savedUpdate(calls).providers.find((p) => p.id === 'anthropic');
    expect(anthropic?.api_key).toBe('');
  });

  it('shows the error when saving fails, without the restart prompt', async () => {
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
    expect(screen.queryByRole('button', { name: 'Restart now' })).toBeNull();
  });

  it('shows the error when loading fails', async () => {
    fakeDesktop({
      get_llm_settings: () => {
        throw 'settings.json is not valid settings JSON';
      },
    });
    const user = userEvent.setup();
    render(SettingsDialog);

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('not valid settings JSON');
  });

  it('restarts the app after a save when asked', async () => {
    const calls = fakeDesktop();
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(await screen.findByRole('button', { name: 'Restart now' }));

    await waitFor(() => expect(calls.some((c) => c.command === 'restart_app')).toBe(true));
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
    expect(screen.getByRole('option', { name: 'Claude CLI' })).toBeTruthy();
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

  it('saves Claude CLI as the default provider with its path and allowlist', async () => {
    const calls = fakeDesktop();
    const user = await openDialog();

    await user.selectOptions(screen.getByLabelText('Default provider'), 'claude-cli');
    await user.type(screen.getByLabelText('Claude CLI binary path'), '/opt/claude');
    const tools = screen.getByLabelText('Claude CLI allowed tools');
    await user.clear(tools);
    await user.type(tools, 'Read{Enter}  {Enter}Bash(npm run build:*)');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText(/Restart Smasher to apply/);
    const update = savedUpdate(calls);
    expect(update.default_provider).toBe('claude-cli');
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
