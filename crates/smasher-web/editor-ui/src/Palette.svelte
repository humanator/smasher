<script lang="ts">
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

<aside class="workflow-palette" data-testid="palette">
  {#each PALETTE_GROUPS as group (group.id)}
    <section class="palette-group" data-testid={`palette-group-${group.id}`}>
      {#if group.collapsible}
        <button
          type="button"
          class="palette-group-header"
          data-testid={`palette-group-toggle-${group.id}`}
          aria-expanded={expanded[group.id]}
          onclick={() => toggleGroup(group.id)}
        >
          <span class="palette-group-caret" aria-hidden="true">{expanded[group.id] ? '▾' : '▸'}</span>
          {group.label}
        </button>
      {:else}
        <h3 class="palette-group-header palette-group-header-static">{group.label}</h3>
      {/if}

      {#if !group.collapsible || expanded[group.id]}
        <div class="palette-group-entries">
          {#each group.kinds as nodeType (nodeType)}
            {@const config = NODE_KIND_CONFIG[nodeType]}
            <div
              class="palette-entry"
              data-testid={`palette-entry-${nodeType}`}
              draggable="true"
              role="listitem"
              title={config.description}
              ondragstart={(event) => handleDragStart(event, nodeType)}
              style={`--palette-entry-color: ${THEME_COLORS[config.theme].border}; --palette-entry-bg: ${THEME_COLORS[config.theme].bg};`}
            >
              <span class="palette-entry-icon" aria-hidden="true">{config.icon}</span>
              <span class="palette-entry-title">{config.title}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</aside>

<style>
  .workflow-palette {
    width: 200px;
    flex: 0 0 200px;
    overflow-y: auto;
    border-right: 1px solid #e2e8f0;
    padding: 0.5rem;
    box-sizing: border-box;
    font-size: 0.85rem;
  }

  .palette-group {
    margin-bottom: 0.75rem;
  }

  .palette-group-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    width: 100%;
    background: none;
    border: none;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #475569;
    cursor: pointer;
    padding: 0.25rem 0;
    text-align: left;
  }

  .palette-group-header-static {
    cursor: default;
    margin: 0;
  }

  .palette-group-entries {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.35rem;
  }

  .palette-entry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--palette-entry-color, #94a3b8);
    background: var(--palette-entry-bg, #f8fafc);
    border-radius: 6px;
    cursor: grab;
  }

  .palette-entry:active {
    cursor: grabbing;
  }

  .palette-entry-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.75rem;
    height: 1.5rem;
    padding: 0 0.25rem;
    border-radius: 4px;
    background: var(--palette-entry-color, #94a3b8);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .palette-entry-title {
    color: #1e293b;
  }
</style>
