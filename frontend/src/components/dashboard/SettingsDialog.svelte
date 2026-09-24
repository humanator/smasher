<script lang="ts">
  // ABOUTME: Desktop-only LLM settings modal: default model/provider, each provider's API key and base URL, and the Claude CLI
  // ABOUTME: Reads/writes via smasher-desktop's Tauri commands; keys go to the Keychain and never come back

  import SettingsIcon from '@lucide/svelte/icons/settings';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import {
    getLlmSettings,
    saveLlmSettings,
    detectClaudeCli,
    restartApp,
    type ClaudeCliDetection,
    type LlmSettings,
    type ProviderSettingsUpdate,
  } from '$lib/native';

  /** Editable form state for one provider. */
  interface ProviderForm {
    id: string;
    label: string;
    baseUrl: string;
    hasKey: boolean;
    newKey: string;
    removeKey: boolean;
  }

  const BASE_URL_HINTS: Record<string, string> = {
    ollama: 'Ollama Cloud by default; http://localhost:11434 for a local ollama serve',
  };

  let open = $state(false);
  let loading = $state(false);
  let saving = $state(false);
  let saved = $state(false);
  let error = $state<string | null>(null);
  let settingsPath = $state('');
  let defaultModel = $state('');
  let defaultProvider = $state('');
  let providers = $state<ProviderForm[]>([]);
  let claudeCliPath = $state('');
  let allowedTools = $state('');
  let defaultAllowedTools = $state<string[]>([]);
  let detection = $state<ClaudeCliDetection | null>(null);

  function fill(settings: LlmSettings) {
    defaultModel = settings.default_model;
    defaultProvider = settings.default_provider;
    settingsPath = settings.settings_path;
    providers = settings.providers.map((p) => ({
      id: p.id,
      label: p.label,
      baseUrl: p.base_url,
      hasKey: p.has_key,
      newKey: '',
      removeKey: false,
    }));
    claudeCliPath = settings.claude_cli.path;
    allowedTools = settings.claude_cli.allowed_tools.join('\n');
    defaultAllowedTools = settings.claude_cli.default_allowed_tools;
  }

  async function detect() {
    try {
      detection = await detectClaudeCli(claudeCliPath);
    } catch (e) {
      error = message(e);
    }
  }

  function message(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  async function load() {
    loading = true;
    saved = false;
    error = null;
    try {
      fill(await getLlmSettings());
      detect();
    } catch (e) {
      error = message(e);
    } finally {
      loading = false;
    }
  }

  function keyUpdate(p: ProviderForm): Pick<ProviderSettingsUpdate, 'api_key'> {
    if (p.newKey.trim()) return { api_key: p.newKey };
    if (p.removeKey) return { api_key: '' };
    return {};
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    error = null;
    try {
      fill(
        await saveLlmSettings({
          default_model: defaultModel,
          default_provider: defaultProvider,
          providers: providers.map((p) => ({ id: p.id, base_url: p.baseUrl, ...keyUpdate(p) })),
          claude_cli_path: claudeCliPath,
          claude_cli_allowed_tools: allowedTools
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean),
        })
      );
      saved = true;
    } catch (e) {
      error = message(e);
    } finally {
      saving = false;
    }
  }

  async function restart() {
    try {
      await restartApp();
    } catch (e) {
      error = message(e);
    }
  }

  function keyPlaceholder(p: ProviderForm): string {
    if (p.removeKey) return 'Will be removed on save';
    return p.hasKey ? 'Stored in Keychain — type to replace' : 'Not set';
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => isOpen && load()}>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" aria-label="Settings" {...props}>
        <SettingsIcon />
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-xl">
    <Dialog.Header>
      <Dialog.Title>LLM settings</Dialog.Title>
      <Dialog.Description>
        API keys are stored in the macOS Keychain. Changes apply after Smasher restarts.
      </Dialog.Description>
    </Dialog.Header>

    {#if loading}
      <p class="text-muted-foreground">Loading…</p>
    {:else}
      <form class="grid gap-6" onsubmit={save}>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="settings-default-model">Default model</Label>
            <Input
              id="settings-default-model"
              bind:value={defaultModel}
              placeholder="claude-sonnet-5"
              autocomplete="off"
              spellcheck={false}
            />
          </div>
          <div class="grid gap-2">
            <Label for="settings-default-provider">Default provider</Label>
            <NativeSelect.Root id="settings-default-provider" bind:value={defaultProvider} class="w-full">
              <NativeSelect.Option value="">Infer from model name</NativeSelect.Option>
              {#each providers as p (p.id)}
                <NativeSelect.Option value={p.id}>{p.label}</NativeSelect.Option>
              {/each}
              <NativeSelect.Option value="claude-cli">Claude CLI</NativeSelect.Option>
            </NativeSelect.Root>
          </div>
        </div>

        {#each providers as p (p.id)}
          <fieldset class="grid gap-3 border-t border-border pt-4">
            <legend class="text-sm font-semibold">{p.label}</legend>
            <div class="grid gap-2">
              <Label for="settings-{p.id}-key">API key</Label>
              <div class="flex gap-2">
                <Input
                  id="settings-{p.id}-key"
                  type="password"
                  aria-label="{p.label} API key"
                  bind:value={p.newKey}
                  placeholder={keyPlaceholder(p)}
                  autocomplete="off"
                />
                {#if p.hasKey && !p.removeKey}
                  <Button
                    variant="outline"
                    aria-label="Remove {p.label} API key"
                    onclick={() => (p.removeKey = true)}
                  >
                    Remove
                  </Button>
                {/if}
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="settings-{p.id}-url">Base URL</Label>
              <Input
                id="settings-{p.id}-url"
                aria-label="{p.label} base URL"
                bind:value={p.baseUrl}
                placeholder="Default"
                autocomplete="off"
                spellcheck={false}
              />
              {#if BASE_URL_HINTS[p.id]}
                <p class="text-xs text-muted-foreground">{BASE_URL_HINTS[p.id]}</p>
              {/if}
            </div>
          </fieldset>
        {/each}

        <fieldset class="grid gap-3 border-t border-border pt-4">
          <legend class="text-sm font-semibold">Claude CLI</legend>
          <p class="text-xs text-muted-foreground">
            Runs every LLM node through the local <code>claude</code> command with the account it's
            logged into. No API key needed.
          </p>
          <div class="grid gap-2">
            <Label for="settings-claude-cli-path">Binary path</Label>
            <div class="flex gap-2">
              <Input
                id="settings-claude-cli-path"
                aria-label="Claude CLI binary path"
                bind:value={claudeCliPath}
                placeholder={detection?.path ? `Auto-detect (${detection.path})` : 'Auto-detect'}
                autocomplete="off"
                spellcheck={false}
              />
              <Button variant="outline" aria-label="Detect Claude CLI" onclick={detect}>Detect</Button>
            </div>
            {#if detection}
              <p class="text-xs text-muted-foreground">
                {detection.version ? `Found: ${detection.version}` : 'claude not found'}
              </p>
            {/if}
          </div>
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <Label for="settings-claude-cli-tools">Allowed tools</Label>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Reset allowed tools to default"
                onclick={() => (allowedTools = defaultAllowedTools.join('\n'))}
              >
                Reset
              </Button>
            </div>
            <Textarea
              id="settings-claude-cli-tools"
              aria-label="Claude CLI allowed tools"
              bind:value={allowedTools}
              rows={6}
              spellcheck={false}
              class="font-mono text-xs"
            />
            <p class="text-xs text-muted-foreground">
              One per line, e.g. <code>Bash(npm run build:*)</code>. Codergen nodes may use only
              these; anything else is denied.
            </p>
          </div>
        </fieldset>

        {#if error}
          <p role="alert" class="text-sm text-destructive">{error}</p>
        {/if}

        <Dialog.Footer class="items-center">
          {#if saved}
            <p class="mr-auto text-sm" role="status">Saved. Restart Smasher to apply.</p>
            <Button variant="outline" onclick={restart}>Restart now</Button>
          {:else if settingsPath}
            <p class="mr-auto truncate text-xs text-muted-foreground" title={settingsPath}>{settingsPath}</p>
          {/if}
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
