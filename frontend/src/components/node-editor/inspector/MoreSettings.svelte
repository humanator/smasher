<script lang="ts">
  // ABOUTME: The "More settings" disclosure under a step's own fields, with "{n} settings" beside it
  // ABOUTME: Its fields (passed as children) render only while it is open

  import type { Snippet } from 'svelte';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  let { count, children }: { count: number; children: Snippet } = $props();

  const uid = $props.id();
  let open = $state(false);
</script>

<div class="mb-5">
  <button
    type="button"
    class="flex w-full items-center gap-2 border-0 border-t border-divider bg-transparent py-3 text-left text-body font-semibold text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
    aria-expanded={open}
    aria-controls={open ? uid : undefined}
    onclick={() => (open = !open)}
  >
    <ChevronRightIcon
      class={['size-3.5 text-muted-foreground transition-transform', open && 'rotate-90']}
      aria-hidden="true"
    />
    More settings
    <span class="ml-auto text-small font-normal text-muted-foreground">{count} settings</span>
  </button>
  {#if open}
    <div id={uid} class="flex flex-col gap-5">
      {@render children()}
    </div>
  {/if}
</div>
