<script lang="ts">
  // ABOUTME: Custom node type registered as the "workflow" nodeTypes entry in
  // ABOUTME: WorkflowCanvasInner.svelte -- adds left/right handles alongside
  // ABOUTME: the built-in "default" node's top/bottom pair.
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { getContext } from 'svelte';
  import { FLOW_DIRECTION_CONTEXT_KEY, type FlowDirection } from './flowDirectionContext';

  let { data }: NodeProps = $props();

  const flowDirection = getContext<FlowDirection | undefined>(FLOW_DIRECTION_CONTEXT_KEY);

  // A loaded edge with no explicit sourceHandle/targetHandle resolves to
  // whichever handle of the right type is registered first in the DOM (see
  // flowDirectionContext.ts) -- so the pair matching the graph's actual flow
  // direction has to render first, or every old/implicit edge would connect
  // via the wrong side regardless of where the nodes actually sit. The other
  // pair still renders (with an explicit `id`, so a human can drag a new
  // connection to/from it deliberately) purely as a manual escape hatch --
  // e.g. a long edge that jumps far ahead or behind in the pipeline reads
  // more clearly off the top/bottom of a card than fighting through
  // everything laid out to its left/right.
  const isHorizontal = $derived(flowDirection?.rankdir === 'LR' || flowDirection?.rankdir === 'RL');
</script>

{#if isHorizontal}
  <Handle type="source" id="right" position={Position.Right} />
  <Handle type="target" id="left" position={Position.Left} />
  <Handle type="source" id="bottom" position={Position.Bottom} />
  <Handle type="target" id="top" position={Position.Top} />
{:else}
  <Handle type="source" id="bottom" position={Position.Bottom} />
  <Handle type="target" id="top" position={Position.Top} />
  <Handle type="source" id="right" position={Position.Right} />
  <Handle type="target" id="left" position={Position.Left} />
{/if}
{data?.label}

<style>
  /* @xyflow/svelte/dist/style.css only styles the built-in
     `.svelte-flow__node-default` (plus input/output/group) -- a custom
     node's own `.svelte-flow__node-workflow` class gets none of that
     padding/border-radius/width/text-align/border/background look, so it's
     replicated here verbatim (same source values, style.css's own
     `.svelte-flow__node-default` rule) rather than silently regressing to
     an unstyled box now that per-kind coloring (nodeConfig.ts's
     nodeStyleFor) depends on this node rendering as a card in the first
     place. :global() is required -- this class is applied by SvelteFlow's
     own NodeWrapper, not this component's template. */
  :global(.svelte-flow__node-workflow) {
    padding: 10px;
    border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));
    width: 150px;
    font-size: 12px;
    color: var(--xy-node-color, var(--xy-node-color-default));
    text-align: center;
    border: var(--xy-node-border, var(--xy-node-border-default));
    background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));
  }

  :global(.svelte-flow__node-workflow.selectable:hover) {
    box-shadow: var(--xy-node-boxshadow-hover, var(--xy-node-boxshadow-hover-default));
  }

  :global(.svelte-flow__node-workflow.selectable.selected),
  :global(.svelte-flow__node-workflow.selectable:focus),
  :global(.svelte-flow__node-workflow.selectable:focus-visible) {
    outline: none;
    border: var(--xy-node-border-selected, var(--xy-node-border-selected-default));
  }
</style>
