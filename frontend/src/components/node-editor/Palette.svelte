<script lang="ts">
  // ABOUTME: Left-hand palette/panel for draggable node-kind entries
  // ABOUTME: Collapsible groups of draggable node kinds, plus structural section

  import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG, PALETTE_GROUPS, THEME_COLORS, type PaletteGroupId } from './nodeConfig';

  // Left-hand palette/panel (spec Assumption 2's Agent Flow reference --
  // Svelte Flow has no built-in Stencil the way X6 does, so this is
  // custom-built): collapsible groups of draggable node-kind entries, plus
  // a separate always-visible structural section. Purely presentational --
  // it owns no canvas/graph state and doesn't call @xyflow/svelte's
  // context-dependent hooks (see WorkflowCanvasInner.svelte's comment on
  // why the drop-side position math is done by hand instead of via
  // useSvelteFlow(), which would otherwise force this component to be
  // rendered inside a <SvelteFlowProvider> just to exist).
  let expanded = $state<Record<PaletteGroupId, boolean>>({
    'pipeline-steps': true,
    'control-flow': true,
    structural: true,
  });

  function toggleGroup(id: PaletteGroupId) {
    expanded[id] = !expanded[id];
  }

  function handleDragStart(event: DragEvent, nodeType: string) {
    event.dataTransfer?.setData(NODE_DRAG_DATA_TYPE, nodeType);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }
</script>

<aside class="w-[200px] flex-shrink-0 overflow-y-auto border-r border-slate-200 p-2 text-xs" data-testid="palette">
  {#each PALETTE_GROUPS as group (group.id)}
    <section class="mb-3" data-testid={`palette-group-${group.id}`}>
      {#if group.collapsible}
        <button
          type="button"
          class="flex items-center gap-1 w-full bg-none border-0 font-semibold text-xs uppercase tracking-wider text-slate-700 cursor-pointer px-0 py-1 text-left"
          data-testid={`palette-group-toggle-${group.id}`}
          aria-expanded={expanded[group.id]}
          onclick={() => toggleGroup(group.id)}
        >
          <span aria-hidden="true">{expanded[group.id] ? '▾' : '▸'}</span>
          {group.label}
        </button>
      {:else}
        <h3 class="font-semibold text-xs uppercase tracking-wider text-slate-700 m-0">{group.label}</h3>
      {/if}

      {#if !group.collapsible || expanded[group.id]}
        <div class="flex flex-col gap-1 mt-1">
          {#each group.kinds as nodeType (nodeType)}
            {@const config = NODE_KIND_CONFIG[nodeType]}
            <div
              class="palette-entry flex items-center gap-2 p-1 rounded cursor-grab active:cursor-grabbing border"
              data-testid={`palette-entry-${nodeType}`}
              draggable="true"
              role="listitem"
              title={config.description}
              ondragstart={(event) => handleDragStart(event, nodeType)}
              style={`--palette-entry-color: ${THEME_COLORS[config.theme].border}; --palette-entry-bg: ${THEME_COLORS[config.theme].bg};`}
            >
              <span class="inline-flex items-center justify-center min-w-7 h-6 px-1 rounded text-white text-xs font-bold" style={`background-color: var(--palette-entry-color, #94a3b8);`} aria-hidden="true">{config.icon}</span>
              <span class="text-slate-900">{config.title}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</aside>

<style>
  /* Dynamic palette entry colors can't be expressed as static Tailwind classes,
     so we keep the minimal CSS for border and background using CSS custom properties. */
  .palette-entry {
    border-color: var(--palette-entry-color, #94a3b8);
    background-color: var(--palette-entry-bg, #f8fafc);
  }
</style>
