<script lang="ts">
  // ABOUTME: Step library: searchable, grouped list of step kinds to drag onto the canvas or read about
  // ABOUTME: Names, blurbs, groups and colours come from stepKinds; picking one opens its Step guide

  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { STEP_GROUPS, stepKind } from '$lib/stepKinds';
  import { NODE_DRAG_DATA_TYPE } from './nodeConfig';

  // Purely presentational: the canvas owns the selection (its `guide` case)
  // and passes it back in as `selected`.
  // `class` restyles the frame, e.g. to fill the phone-width sheet.
  let {
    selected,
    onSelect,
    class: className = undefined,
  }: { selected: string | null; onSelect: (handler: string | null) => void; class?: string } = $props();

  const uid = $props.id();
  let query = $state('');

  // Matches the plain name, technical name and blurb, as Main.dc.html does.
  const groups = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return STEP_GROUPS.map((group) => ({
      ...group,
      kinds: group.kinds.map(stepKind).filter((k) => !q || `${k.plain} ${k.tech} ${k.blurb}`.toLowerCase().includes(q)),
    })).filter((group) => group.kinds.length > 0);
  });

  function handleDragStart(event: DragEvent, nodeType: string) {
    event.dataTransfer?.setData(NODE_DRAG_DATA_TYPE, nodeType);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }
</script>

<aside
  aria-label="Step library"
  class={cn('flex w-[260px] flex-none flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground min-h-0', className)}
  data-testid="palette"
>
  <div class="flex-none px-3 pt-3 pb-2">
    <Label for="{uid}-search" class="sr-only">Search steps</Label>
    <Input id="{uid}-search" type="search" search placeholder="Search steps" bind:value={query} />
    <p class="mx-1.5 mt-2 mb-0 text-caption leading-snug text-sidebar-muted-foreground">
      Drag a step onto the canvas. Select one here to read what it does and what each of its settings means.
    </p>
  </div>
  <div class="min-h-0 flex-1 overflow-auto px-2.5 pb-4">
    {#if groups.length === 0}
      <p class="mx-2 my-3 text-small text-sidebar-muted-foreground">No steps match that search.</p>
    {/if}
    {#each groups as group (group.id)}
      <section>
        <h3 class="mx-2 mt-3.5 mb-1 text-caption font-semibold text-sidebar-muted-foreground">{group.title}</h3>
        {#each group.kinds as kind (kind.handler)}
          <button
            type="button"
            class={[
              'group mb-px flex w-full cursor-grab items-start gap-2.25 rounded-md px-2 py-1.5 text-left active:cursor-grabbing',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
              selected === kind.handler ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/60',
            ]}
            data-testid="palette-entry-{kind.handler}"
            aria-pressed={selected === kind.handler}
            draggable="true"
            ondragstart={(event) => handleDragStart(event, kind.handler)}
            onclick={() => onSelect(selected === kind.handler ? null : kind.handler)}
          >
            <span class="step-chip grid size-6.5 flex-none place-items-center rounded-md" style:--ink={kind.ink} style:--tint={kind.tint}>
              <kind.icon class="size-3.75" aria-hidden="true" />
            </span>
            <span class="block min-w-0">
              <span class="block text-body font-medium text-sidebar-foreground">{kind.plain}</span>
              <!-- The board's muted blurb is under 4.5:1 on the selected and hover backgrounds, so it darkens there. -->
              <span
                class={[
                  'mt-px block text-caption leading-snug',
                  selected === kind.handler ? 'text-foreground-secondary' : 'text-sidebar-muted-foreground group-hover:text-foreground-secondary',
                ]}
              >
                {kind.blurb}
              </span>
            </span>
          </button>
        {/each}
      </section>
    {/each}
  </div>
</aside>

<style>
  .step-chip {
    background: var(--tint);
    color: var(--ink);
  }
</style>
