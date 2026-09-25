<script lang="ts">
  // ABOUTME: A candidate's generation_params as a collapsed `params` section, one key: value row each
  // ABOUTME: Renders nothing when there are none; a plain <details> so a gate card's <label> ignores it

  let { params }: { params: Record<string, string> | undefined } = $props();

  // The API sends generation_params sorted by key, so the entries keep its order.
  const entries = $derived(Object.entries(params ?? {}));
</script>

{#if entries.length > 0}
  <details class="candidate-params text-xs text-muted-foreground">
    <summary class="cursor-pointer select-none">params</summary>
    <ul class="mt-1 flex flex-col gap-0.5 font-mono">
      {#each entries as [key, value] (key)}
        <li>{key}: {value}</li>
      {/each}
    </ul>
  </details>
{/if}
