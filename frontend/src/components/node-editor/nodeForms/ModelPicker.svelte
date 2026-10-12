<script lang="ts">
  // ABOUTME: Provider + model selects shared by every node form that can call an LLM
  // ABOUTME: Reads the configured providers from GET /api/models; writes provider/model attrs

  import { onMount, untrack } from 'svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
  import { listModels, type ProviderModels } from '$lib/api/models';

  // `onChange` receives only the attrs that changed; an `undefined` value means
  // "delete this attr", the same convention as NodeAttrsPatch. "Server default" is
  // the absence of both attrs. A legacy node with only `model` is shown under the
  // provider that lists that model, but nothing is written until the user edits.
  let {
    provider,
    model,
    onChange,
    models: providedModels,
    idPrefix,
  }: {
    provider?: string;
    model?: string;
    onChange: (patch: { provider?: string; model?: string }) => void;
    /** Provider lists to use instead of fetching them (tests, parents that already have them). */
    models?: ProviderModels[];
    /** Prefix for the test ids: `<prefix>-provider` and `<prefix>-model`. */
    idPrefix: string;
  } = $props();
  const uid = $props.id();

  let providers = $state<ProviderModels[]>(untrack(() => providedModels ?? []));
  let loadError = $state<string | null>(null);
  let providerAttr = $state(untrack(() => provider ?? ''));
  let modelAttr = $state(untrack(() => model ?? ''));

  onMount(async () => {
    if (providedModels) return;
    try {
      providers = await listModels();
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'could not load models';
    }
  });

  const knows = (p: ProviderModels, id: string) =>
    p.models.some((m) => m.id === id || m.aliases.includes(id));

  // The provider shown: the saved one, else whichever provider lists the saved model.
  let shownProvider = $derived(
    providerAttr || (modelAttr ? (providers.find((p) => knows(p, modelAttr))?.provider ?? '') : '')
  );
  let current = $derived(providers.find((p) => p.provider === shownProvider));
  let isCustom = $derived(!!modelAttr && !(current && knows(current, modelAttr)));
  // Free text only when the provider's list came back empty.
  let freeText = $derived(!!current && current.models.length === 0);

  function handleProviderChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    providerAttr = value;
    const next = providers.find((p) => p.provider === value);
    modelAttr = next?.default_model ?? '';
    onChange({ provider: value || undefined, model: modelAttr || undefined });
  }

  function handleModelChange(event: Event) {
    modelAttr = (event.target as HTMLSelectElement | HTMLInputElement).value;
    onChange({ model: modelAttr || undefined });
  }
</script>

<div class="flex flex-col gap-3" data-testid="{idPrefix}-model-picker">
  <div class="flex flex-col gap-1.5">
    <Label for="{uid}-provider">Provider</Label>
    <NativeSelect.Root
      id="{uid}-provider"
      class="w-full"
      data-testid="{idPrefix}-provider"
      value={shownProvider}
      onchange={handleProviderChange}
    >
      <NativeSelect.Option value="">Server default</NativeSelect.Option>
      {#each providers as p (p.provider)}
        <NativeSelect.Option value={p.provider}>{p.label}</NativeSelect.Option>
      {/each}
    </NativeSelect.Root>
  </div>
  <div class="flex flex-col gap-1.5">
    <Label for="{uid}-model">Model</Label>
    {#if freeText}
      <Input
        id="{uid}-model"
        type="text"
        data-testid="{idPrefix}-model"
        value={modelAttr}
        oninput={handleModelChange}
        placeholder="model name"
      />
    {:else}
      <NativeSelect.Root
        id="{uid}-model"
        class="w-full"
        data-testid="{idPrefix}-model"
        value={modelAttr}
        onchange={handleModelChange}
      >
        <NativeSelect.Option value="">
          {current ? 'Select a model…' : 'Server default model'}
        </NativeSelect.Option>
        {#each current?.models ?? [] as m (m.id)}
          <NativeSelect.Option value={m.id}>{m.label}</NativeSelect.Option>
        {/each}
        {#if isCustom}
          <NativeSelect.Option value={modelAttr}>{modelAttr} (custom)</NativeSelect.Option>
        {/if}
      </NativeSelect.Root>
    {/if}
  </div>
  {#if loadError}
    <p class="m-0 text-xs text-destructive" role="alert" data-testid="{idPrefix}-models-error">
      Could not load models: {loadError}
    </p>
  {/if}
</div>
