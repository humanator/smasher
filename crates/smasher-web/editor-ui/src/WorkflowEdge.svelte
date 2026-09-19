<script lang="ts">
  // ABOUTME: Task 8 custom edge type: same bezier path @xyflow/svelte's
  // ABOUTME: built-in "default" edge draws, plus a hover-revealed delete button.
  import { getContext } from 'svelte';
  import { BaseEdge, EdgeLabel, getBezierPath, type EdgeProps } from '@xyflow/svelte';
  import { EDGE_ACTIONS_CONTEXT_KEY, type WorkflowEdgeActions } from './edgeContext';

  let {
    id,
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
    labelStyle,
    interactionWidth,
  }: EdgeProps = $props();

  const edgeActions = getContext<WorkflowEdgeActions | undefined>(EDGE_ACTIONS_CONTEXT_KEY);

  // `edgeActions` is a single reactive ($state) object shared by reference
  // (see edgeContext.ts) -- reading `.hoveredEdgeId` here stays live as
  // WorkflowCanvasInner's onedgepointerenter/leave handlers update it.
  const isHovered = $derived(edgeActions?.hoveredEdgeId === id);
  // Also revealed once selected (not just hovered) -- a clicked edge that's
  // scrolled/panned away from the pointer shouldn't hide its own delete
  // affordance, matching the node inspector panel's own "stays visible for
  // whatever's currently selected" behavior (Task 7).
  const showDelete = $derived(isHovered || selected);

  let [path, labelX, labelY] = $derived(
    getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }),
  );

  function handleDeleteClick(event: MouseEvent) {
    // Selecting the edge (native click-to-select) also fires from this same
    // pointerdown/click -- stop it from bubbling into that so a delete click
    // doesn't also flip the edge's selected state right before removing it.
    event.stopPropagation();
    edgeActions?.onDeleteEdge(id);
  }
</script>

<BaseEdge {id} {path} {markerStart} {markerEnd} {style} {label} {labelStyle} {interactionWidth} />
{#if showDelete}
  <EdgeLabel x={labelX} y={labelY} class="workflow-edge-delete-label">
    <button
      type="button"
      class="workflow-edge-delete"
      data-testid="edge-delete-{id}"
      onclick={handleDeleteClick}
      aria-label="Delete edge"
    >
      ×
    </button>
  </EdgeLabel>
{/if}

<style>
  :global(.workflow-edge-delete-label) {
    pointer-events: all;
  }

  .workflow-edge-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid #ef4444;
    background: #fff;
    color: #ef4444;
    font-size: 0.8rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  .workflow-edge-delete:hover {
    background: #ef4444;
    color: #fff;
  }
</style>
