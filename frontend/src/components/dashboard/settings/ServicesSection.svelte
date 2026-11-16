<script lang="ts" module>
  /** Editable form state for one provider; SettingsDialog owns it and saves it. */
  export interface ProviderForm {
    id: string;
    label: string;
    baseUrl: string;
    hasKey: boolean;
    newKey: string;
    removeKey: boolean;
  }
</script>

<script lang="ts">
  // ABOUTME: Settings → Services: one disclosure row per provider with its key status, API key and base URL
  // ABOUTME: Edits the dialog's provider forms in place; a removed key is cleared only when the dialog saves

  import { untrack } from 'svelte';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';

  let { providers }: { providers: ProviderForm[] } = $props();

  const URL_HELP =
    'Only change this to point at a different server, such as a company proxy. Leave blank to use the standard address.';
  const URL_HINTS: Record<string, string> = {
    ollama: 'Ollama Cloud is used by default; enter http://localhost:11434 to use a copy running on this Mac.',
  };

  // One row open at a time, the first to begin with.
  let openId = $state<string | null>(untrack(() => providers[0]?.id ?? null));

  const keySaved = (p: ProviderForm) => p.hasKey && !p.removeKey;

  function keyPlaceholder(p: ProviderForm): string {
    if (p.removeKey) return 'Removed when you save';
    return p.hasKey ? 'Saved. Type to replace.' : 'Paste your API key';
  }
</script>

<div class="overflow-hidden rounded-lg border border-border bg-card">
  {#each providers as p (p.id)}
    {@const open = openId === p.id}
    <div class="border-b border-border last:border-b-0">
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-body font-medium outline-none hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
        aria-expanded={open}
        aria-controls="settings-{p.id}-panel"
        onclick={() => (openId = open ? null : p.id)}
      >
        <ChevronRightIcon
          class="size-3 shrink-0 text-muted-foreground transition-transform {open ? 'rotate-90' : ''}"
          aria-hidden="true"
        />
        <span>{p.label}</span>
        <Badge class="ml-auto" variant={keySaved(p) ? 'secondary' : 'outline'} dot={keySaved(p) ? 'var(--success)' : undefined}>
          {keySaved(p) ? 'Key saved' : 'No key'}
        </Badge>
      </button>
      {#if open}
        <div id="settings-{p.id}-panel" class="grid gap-4 px-3 pt-1 pb-4 pl-8">
          <div class="grid gap-1.5">
            <Label for="settings-{p.id}-key">API key</Label>
            <div class="flex gap-2">
              <Input
                id="settings-{p.id}-key"
                type="password"
                aria-label="{p.label} API key"
                aria-describedby="settings-{p.id}-key-hint"
                bind:value={p.newKey}
                placeholder={keyPlaceholder(p)}
                autocomplete="off"
              />
              {#if keySaved(p)}
                <Button variant="outline" aria-label="Remove {p.label} API key" onclick={() => (p.removeKey = true)}>
                  Remove
                </Button>
              {/if}
            </div>
            <p id="settings-{p.id}-key-hint" class="text-xs text-muted-foreground">
              The secret that lets Smasher use your account with {p.label}. It is saved to the Keychain, never into a
              workflow.
            </p>
          </div>
          <div class="grid gap-1.5">
            <Label for="settings-{p.id}-url">Base URL</Label>
            <Input
              id="settings-{p.id}-url"
              aria-label="{p.label} base URL"
              aria-describedby="settings-{p.id}-url-hint"
              bind:value={p.baseUrl}
              placeholder="Default"
              autocomplete="off"
              spellcheck={false}
            />
            <p id="settings-{p.id}-url-hint" class="text-xs text-muted-foreground">
              {URL_HELP}{URL_HINTS[p.id] ? ` ${URL_HINTS[p.id]}` : ''}
            </p>
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
