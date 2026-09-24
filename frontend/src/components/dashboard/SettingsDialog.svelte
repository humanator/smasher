<script lang="ts">
  // ABOUTME: Desktop-only LLM settings modal: default model/provider plus each provider's API key and base URL
  // ABOUTME: Reads/writes via smasher-desktop's Tauri commands; keys go to the Keychain and never come back

  import SettingsIcon from '@lucide/svelte/icons/settings';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
  import {
    getLlmSettings,
    saveLlmSettings,
    restartApp,
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
