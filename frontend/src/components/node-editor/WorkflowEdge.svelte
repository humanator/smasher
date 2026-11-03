<script lang="ts">
  // ABOUTME: Custom edge type for workflow canvas
  // ABOUTME: Smoothstep path, dashed loop style and a clickable label pill

  import { getContext } from 'svelte';
  import { BaseEdge, EdgeLabel, getSmoothStepPath, useStore, type EdgeProps } from '@xyflow/svelte';
  import { EDGE_ACTIONS_CONTEXT_KEY, connectionName, type WorkflowEdgeActions } from './edgeContext';

  let {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    markerEnd,
    style,
    selected,
    label,
    data,
    interactionWidth,
  }: EdgeProps = $props();

  const edgeActions = getContext<WorkflowEdgeActions | undefined>(EDGE_ACTIONS_CONTEXT_KEY);
  const store = useStore();

  // A loop (loop_restart=true) is dashed in the human-group ink (D7).
  const isLoop = $derived(data?.loopRestart === true);
  const text = $derived(typeof label === 'string' ? label : '');

  // The step names, read live (as useNodesData does) so a rename shows here.
  const name = $derived.by(() => {
    void store.nodes;
    const nameOf = (nodeId: string) => {
      const nodeLabel = store.nodeLookup.get(nodeId)?.internals.userNode.data.label;
      return typeof nodeLabel === 'string' ? nodeLabel : nodeId;
    };
    return connectionName(nameOf(source), nameOf(target), text);
  });

  let [path, labelX, labelY] = $derived(
    getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }),
  );
</script>

<BaseEdge
  {id}
  {path}
  {markerStart}
  {markerEnd}
  {style}
  {interactionWidth}
  class={isLoop ? 'wf-edge wf-edge-loop' : 'wf-edge'}
/>
{#if text}
  <!-- selectEdgeOnClick selects it in Svelte Flow (so Backspace deletes it);
       onSelectEdge tells the canvas, since a label click is not an edge click. -->
  <EdgeLabel x={labelX} y={labelY} selectEdgeOnClick transparent>
    <button
      type="button"
      class={[
        'wf-edge-label nodrag nopan h-5 cursor-default whitespace-nowrap rounded-full border bg-card px-2 text-caption font-medium',
        'focus-visible:outline-3 focus-visible:outline-ring',
        isLoop ? 'wf-edge-label-loop text-kind-human-ink' : 'text-foreground-secondary',
        selected ? 'wf-edge-label-selected border-primary' : isLoop ? 'border-kind-human-ink' : 'border-input',
      ]}
      aria-label={name}
      onclick={() => edgeActions?.onSelectEdge(id)}
    >
      {text}
    </button>
  </EdgeLabel>
{/if}

<style>
  /* :global because the path is BaseEdge's element, not this template's.
     The extra .svelte-flow ancestor outranks the library's own selected rule,
     so a selected loop turns accent like any other selected connection. */
  :global(.svelte-flow__edge-path.wf-edge-loop) {
    stroke: var(--kind-human-ink);
    stroke-dasharray: 7 5;
  }

  :global(.svelte-flow .svelte-flow__edge.selected .svelte-flow__edge-path) {
    stroke: var(--primary);
    stroke-width: 3;
  }
</style>
