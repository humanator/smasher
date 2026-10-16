<script lang="ts">
  // ABOUTME: Loads the Run sheet the first time it opens, so it (and ModelPicker) stay out of the entry bundle
  // ABOUTME: Same props as RunDialog; open stays two-way bound through to it

  let {
    workflow,
    open = $bindable(false),
  }: { workflow: { id: string; name: string }; open?: boolean } = $props();

  // Once loaded it stays mounted, so closing animates and the draft logic runs as before.
  let wanted = $state(false);
  $effect(() => {
    if (open) wanted = true;
  });
</script>

{#if wanted}
  {#await import('./RunDialog.svelte') then { default: RunDialog }}
    <RunDialog {workflow} bind:open />
  {:catch}
    <p role="alert" class="text-sm text-destructive">Couldn't load the run form. Reload the page to try again.</p>
  {/await}
{/if}
