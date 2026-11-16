<script lang="ts">
  // ABOUTME: Settings → Defaults: the provider and model new runs use, as label-and-hint rows, plus where the default came from
  // ABOUTME: Presentational; SettingsDialog owns the values and saving

  import type { LlmDefaults } from '$lib/api/settings';
  import ModelPicker from '../../node-editor/nodeForms/ModelPicker.svelte';

  let {
    provider,
    model,
    source,
    pickerKey,
    desktop,
    onPick,
  }: {
    provider: string;
    model: string;
    /** Where the saved default came from; null until loaded. */
    source: LlmDefaults['source'] | null;
    /** Bumped by the dialog to remount the picker with fresh values. */
    pickerKey: number;
    desktop: boolean;
    onPick: (patch: { provider?: string; model?: string }) => void;
  } = $props();

  const SOURCE_TEXT: Record<LlmDefaults['source'], string> = {
    settings: 'Saved in the settings file.',
    env: 'Set by the SMASHER_MODEL / SMASHER_PROVIDER environment variables.',
    default: 'The built-in default.',
  };
</script>

<div class="rounded-lg border border-border bg-card px-4">
  {#key pickerKey}
    <ModelPicker
      idPrefix="settings"
      layout="rows"
      blankLabel="Choose a provider…"
      providerLabel="Default provider"
      providerHint="Which service to send requests to. Leave it on a provider and pick one of its models below."
      modelLabel="Default model"
      modelHint="The model AI steps use when neither the run nor the step asks for a specific one."
      provider={provider || undefined}
      model={model || undefined}
      onChange={onPick}
    />
  {/key}
</div>
{#if source}
  <p class="mt-2 text-xs text-muted-foreground" data-testid="settings-source">{SOURCE_TEXT[source]}</p>
{/if}
<p class="mt-3 text-xs text-muted-foreground">
  {#if desktop}
    API keys are stored in your Mac’s Keychain.
  {:else}
    API keys come from the server’s environment or <code>.env</code> file, not from this page.
  {/if}
</p>
