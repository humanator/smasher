<script lang="ts">
  // ABOUTME: The run page's Decision bar for a waiting gallery gate: what is selected, and one button per outgoing edge
  // ABOUTME: Presentational; iterate and approve have their own words, any other edge is an extra outline button

  import CheckIcon from '@lucide/svelte/icons/check';
  import InfoIcon from '@lucide/svelte/icons/info';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import { gateButtons, type GateButton } from '$lib/decisionEdges';

  let {
    edges,
    selected,
    submitting = false,
    error = null,
    onDecide,
  }: {
    /** The gate's outgoing edges; each one is a decision. */
    edges: readonly string[];
    selected: readonly string[];
    /** A decision is on its way: every button is off until the server answers. */
    submitting?: boolean;
    /** Why the last decision was not taken. */
    error?: string | null;
    onDecide: (edge: string) => void;
  } = $props();

  const buttons = $derived(gateButtons(edges));
  const status = $derived(
    selected.length === 0
      ? 'Nothing selected yet. Select the candidates you want to keep.'
      : `${selected.length} selected: ${selected.join(', ')}`
  );

  function explain(button: GateButton): string {
    switch (button.kind) {
      case 'iterate':
        return 'sends your notes back and makes new candidates. Select none to start over.';
      case 'approve':
        return 'keeps the candidates you selected and lets the workflow go on.';
      default:
        return `sends the workflow down its “${button.edge.trim()}” route.`;
    }
  }
</script>

<section
  aria-label="Decision"
  class="sticky bottom-0 -mx-4 -mb-8 flex flex-col gap-3 border-t border-border bg-muted px-4 py-3 sm:-mx-7 sm:flex-row sm:items-center sm:justify-between sm:pr-5 sm:pl-7"
>
  <div class="flex min-w-0 flex-col gap-0.5">
    <div class="flex items-center gap-1.5 text-body font-semibold text-foreground">
      What should happen next?
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="ghost" size="icon-xs" aria-label="What the buttons do">
                <InfoIcon aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content class="flex-col items-start">
            {#each buttons as button (button.edge)}
              <span><strong>{button.label}</strong> {explain(button)}</span>
            {/each}
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
    <p class="text-small m-0 text-muted-foreground">{status}</p>
    {#if error}
      <p role="alert" class="text-small m-0 text-destructive">{error}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-2 sm:flex-row">
    {#each buttons as button (button.edge)}
      <Button
        size="lg"
        variant={button.kind === 'approve' ? 'default' : 'outline'}
        class="w-full sm:w-auto"
        disabled={submitting || (button.kind === 'approve' && selected.length === 0)}
        onclick={() => onDecide(button.edge)}
      >
        {#if button.kind === 'approve'}<CheckIcon aria-hidden="true" />{/if}
        {button.label}
      </Button>
    {/each}
  </div>
</section>
