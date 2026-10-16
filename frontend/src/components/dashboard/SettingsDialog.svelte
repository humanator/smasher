<script lang="ts">
  // ABOUTME: The Settings window: Defaults (provider/model for new runs), plus Services and Claude CLI tabs in the desktop app
  // ABOUTME: The default goes through PUT /api/settings; desktop keys go to the Keychain via Tauri commands and never come back

  import { untrack } from 'svelte';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import KeyRoundIcon from '@lucide/svelte/icons/key-round';
  import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { getSettings, putSettings, type LlmDefaults } from '$lib/api/settings';
  import DefaultsSection from './settings/DefaultsSection.svelte';
  import {
    getLlmSettings,
    saveLlmSettings,
    detectClaudeCli,
    isTauri,
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

  let {
    open = $bindable(false),
    trigger = true,
  }: {
    open?: boolean;
    /** False when the page opens the dialog from its own button. */
    trigger?: boolean;
  } = $props();
  let loading = $state(false);
  let saving = $state(false);
  let saved = $state(false);
  let error = $state<string | null>(null);
  let settingsPath = $state('');
  // The server's default as last loaded or saved, and the pair being edited.
  let defaults = $state<LlmDefaults | null>(null);
  let pickedProvider = $state('');
  let pickedModel = $state('');
  let dirty = $state(false);
  // The picker reads its starting values once, so a reload remounts it (and refetches the lists).
  let pickerKey = $state(0);
  // Keys, base URLs and the Claude CLI live in the desktop app only.
  const desktop = isTauri();
  let providers = $state<ProviderForm[]>([]);
  let claudeCliPath = $state('');
  let allowedTools = $state('');
  let defaultAllowedTools = $state<string[]>([]);
  let detection = $state<ClaudeCliDetection | null>(null);

  type Section = 'defaults' | 'services' | 'cli';
  const SECTIONS: { value: Section; label: string; icon: typeof SettingsIcon }[] = [
    { value: 'defaults', label: 'Defaults', icon: SettingsIcon },
    { value: 'services', label: 'Services', icon: KeyRoundIcon },
    { value: 'cli', label: 'Claude CLI', icon: SquareTerminalIcon },
  ];
  let section = $state<Section>('defaults');
  // The browser has only the defaults, so the window is just "Settings" there.
  const title = $derived(desktop ? SECTIONS.find((s) => s.value === section)!.label : 'Settings');

  function pick(patch: { provider?: string; model?: string }) {
    if ('provider' in patch) pickedProvider = patch.provider ?? '';
    if ('model' in patch) pickedModel = patch.model ?? '';
    dirty = true;
    saved = false;
  }

  function showDefaults(next: LlmDefaults) {
    defaults = next;
    pickedProvider = next.provider ?? '';
    pickedModel = next.model;
    dirty = false;
    pickerKey++;
  }

  function fill(settings: LlmSettings) {
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
    section = 'defaults';
    saved = false;
    error = null;
    try {
      showDefaults(await getSettings());
      if (desktop) {
        fill(await getLlmSettings());
        detect();
      }
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
      // Keys first: saving them makes a newly keyed provider available to choose.
      if (desktop) {
        fill(
          await saveLlmSettings({
            providers: providers.map((p) => ({ id: p.id, base_url: p.baseUrl, ...keyUpdate(p) })),
            claude_cli_path: claudeCliPath,
            claude_cli_allowed_tools: allowedTools
              .split('\n')
              .map((t) => t.trim())
              .filter(Boolean),
          })
        );
      }
      if (dirty) {
        if (!pickedProvider) throw new Error('Choose a provider for the default model.');
        showDefaults(await putSettings({ provider: pickedProvider, model: pickedModel }));
      } else if (desktop) {
        pickerKey++;
      }
      saved = true;
    } catch (e) {
      error = message(e);
    } finally {
      saving = false;
    }
  }

  // Every opening reloads, whether the trigger or the page opened it.
  let wasOpen = false;
  $effect(() => {
    if (open && !wasOpen) untrack(load);
    wasOpen = open;
  });

  function keyPlaceholder(p: ProviderForm): string {
    if (p.removeKey) return 'Will be removed on save';
    return p.hasKey ? 'Stored in Keychain — type to replace' : 'Not set';
  }
</script>

<Dialog.Root bind:open>
  {#if trigger}
    <Dialog.Trigger>
      {#snippet child({ props })}
        <Button variant="ghost" size="icon" aria-label="AI model settings" {...props}>
          <SettingsIcon />
        </Button>
      {/snippet}
    </Dialog.Trigger>
  {/if}
  <Dialog.Content
    showCloseButton={false}
    class="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[620px]"
  >
    {#if desktop}
      <Tabs.Root bind:value={section} class="flex min-h-0 flex-1 flex-col gap-0">
        {@render window(true)}
      </Tabs.Root>
    {:else}
      {@render window(false)}
    {/if}
  </Dialog.Content>
</Dialog.Root>

{#snippet window(tabs: boolean)}
  <header class="shrink-0 border-b border-border bg-muted px-3 pt-2 pb-1.5">
    <div class="relative flex h-7 items-center justify-center">
      <Dialog.Close>
        {#snippet child({ props })}
          <Button variant="ghost" size="icon-sm" class="absolute left-0" aria-label="Close settings" {...props}>
            <XIcon />
          </Button>
        {/snippet}
      </Dialog.Close>
      <Dialog.Title class="text-[13px] font-semibold">{title}</Dialog.Title>
    </div>
    {#if tabs}
      <Tabs.List aria-label="Settings sections" class="mx-auto mt-1 flex gap-1 bg-transparent p-0">
        {#each SECTIONS as s (s.value)}
          <Tabs.Trigger
            value={s.value}
            class="h-auto min-w-[72px] flex-none flex-col gap-0.5 rounded-md px-2 pt-1.5 pb-1 text-[11px] text-foreground/80 data-active:bg-foreground/7 data-active:font-normal data-active:text-primary data-active:shadow-none dark:data-active:bg-white/10"
          >
            <s.icon class="size-[22px]" strokeWidth={1.7} aria-hidden="true" />
            {s.label}
          </Tabs.Trigger>
        {/each}
      </Tabs.List>
    {/if}
  </header>

  {#if loading}
    <p class="px-5 py-6 text-muted-foreground">Loading…</p>
  {:else}
    <form class="flex min-h-0 flex-1 flex-col" onsubmit={save}>
      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {#if tabs}
          <Tabs.Content value="defaults">{@render defaultsSection()}</Tabs.Content>
          <Tabs.Content value="services" class="grid gap-4">{@render servicesSection()}</Tabs.Content>
          <Tabs.Content value="cli" class="grid gap-4">{@render cliSection()}</Tabs.Content>
        {:else}
          {@render defaultsSection()}
        {/if}

        {#if error}
          <p role="alert" class="mt-4 text-sm text-destructive">{error}</p>
        {/if}
      </div>

      <footer class="flex shrink-0 items-center gap-3 border-t border-border px-5 py-3">
        {#if saved}
          <p class="mr-auto text-sm" role="status">Saved. Changes apply to the next run.</p>
        {:else if desktop && settingsPath}
          <p class="mr-auto truncate text-xs text-muted-foreground" title={settingsPath}>{settingsPath}</p>
        {/if}
        <Button type="submit" class="ml-auto" disabled={saving || (!desktop && !dirty)}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </footer>
    </form>
  {/if}
{/snippet}

{#snippet defaultsSection()}
  <DefaultsSection
    provider={pickedProvider}
    model={pickedModel}
    source={defaults?.source ?? null}
    {pickerKey}
    {desktop}
    onPick={pick}
  />
{/snippet}

{#snippet servicesSection()}
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

{/snippet}

{#snippet cliSection()}
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
{/snippet}
