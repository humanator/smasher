<script lang="ts">
  // ABOUTME: A toolbar icon button with a help-tag tooltip; the tooltip text is also its accessible name
  // ABOUTME: A link when given href, otherwise a button; needs a Tooltip.Provider above it

  import type { Component } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';

  let {
    label,
    icon: Icon,
    href = undefined,
    onclick = undefined,
  }: {
    label: string;
    icon: Component;
    href?: string;
    onclick?: () => void;
  } = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <Button {...props} {href} {onclick} variant="ghost" size="icon" aria-label={label}>
        <Icon aria-hidden="true" />
      </Button>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content>{label}</Tooltip.Content>
</Tooltip.Root>
