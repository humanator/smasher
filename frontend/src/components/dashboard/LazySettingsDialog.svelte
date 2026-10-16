<script lang="ts">
  // ABOUTME: The AI model settings button plus a Settings window that loads the first time it opens
  // ABOUTME: Keeps SettingsDialog, its sections and ModelPicker out of the entry bundle; open stays two-way bound

  import SettingsIcon from '@lucide/svelte/icons/settings';
  import { Button } from '$lib/components/ui/button/index.js';

  let {
    open = $bindable(false),
    trigger = true,
  }: {
    open?: boolean;
    /** False when the page opens the window from its own button. */
    trigger?: boolean;
  } = $props();

  let wanted = $state(false);
  $effect(() => {
    if (open) wanted = true;
  });
</script>

{#if trigger}
  <Button variant="ghost" size="icon" aria-label="AI model settings" onclick={() => (open = true)}>
    <SettingsIcon />
  </Button>
{/if}

{#if wanted}
  {#await import('./SettingsDialog.svelte') then { default: SettingsDialog }}
    <SettingsDialog bind:open trigger={false} />
  {:catch}
    <p role="alert" class="text-sm text-destructive">Couldn't load Settings. Reload the page to try again.</p>
  {/await}
{/if}
