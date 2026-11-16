<script lang="ts">
  // ABOUTME: The "Rule syntax" disclosure under a connection's settings and a Branch's rules
  // ABOUTME: While open it shows a card of the rule operators and the outcome footer from stepFields

  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { RULE_SYNTAX } from '$lib/stepFields';

  const uid = $props.id();
  let open = $state(false);
</script>

<div>
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
    {RULE_SYNTAX.title}
  </button>
  {#if open}
    <div id={uid} class="overflow-hidden rounded-xl border border-divider">
      {#each RULE_SYNTAX.rows as row (row.code)}
        <div class="flex gap-3 border-b border-divider px-3 py-2 text-body">
          <code class="w-[150px] flex-none font-mono text-small text-foreground">{row.code}</code>
          <span class="text-muted-foreground">{row.text}</span>
        </div>
      {/each}
      <p class="m-0 bg-muted px-3 py-2.5 text-small leading-normal text-muted-foreground">
        {#each RULE_SYNTAX.footer as part, i (i)}
          {#if typeof part === 'string'}{part}{:else if 'code' in part}<code class="font-mono">{part.code}</code>{:else}<strong>{part.strong}</strong>{/if}
        {/each}
      </p>
    </div>
  {/if}
</div>
