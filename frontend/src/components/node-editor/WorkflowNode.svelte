<script lang="ts">
  // ABOUTME: Step card for the workflow canvas: kind chip, kind, name, summary and Needs attention badge
  // ABOUTME: Start and Finish are pills; handles stay hidden until hover, focus, selection or a connection drag

  import { Handle, Position, useConnection, type Node as FlowNode, type NodeProps } from '@xyflow/svelte';
  import { getContext } from 'svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { nodeSummary } from '$lib/nodeSummary';
  import { stepKind } from '$lib/stepKinds';
  import type { WorkflowNodeData } from './convert';
  import { FLOW_DIRECTION_CONTEXT_KEY, type FlowDirection } from './flowDirectionContext';
  import { NODE_STATE_CONTEXT_KEY, type WorkflowNodeState } from './nodeContext';
  import './WorkflowNode.css';

  let { id, data }: NodeProps<FlowNode<WorkflowNodeData>> = $props();

  const flowDirection = getContext<FlowDirection | undefined>(FLOW_DIRECTION_CONTEXT_KEY);
  const nodeState = getContext<WorkflowNodeState | undefined>(NODE_STATE_CONTEXT_KEY);
  const connection = useConnection();

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

  const kind = $derived(stepKind(data.nodeType));
  const isPill = $derived(data.nodeType === 'Start' || data.nodeType === 'Exit');
  const summary = $derived(nodeSummary(data, nodeState?.outgoingByNode.get(id) ?? 0));
  const needsAttention = $derived(nodeState?.problemsByNode.has(id) ?? false);
  // Hover, focus and selection reveal handles in WorkflowNode.css; a drag in
  // progress anywhere on the canvas reveals every card's handles (D4).
  const handleClass = $derived(connection.current.inProgress ? 'wf-handle wf-handle-live' : 'wf-handle');
</script>

{#if isHorizontal}
  <Handle type="source" id="right" position={Position.Right} class={handleClass} />
  <Handle type="target" id="left" position={Position.Left} class={handleClass} />
  <Handle type="source" id="bottom" position={Position.Bottom} class={handleClass} />
  <Handle type="target" id="top" position={Position.Top} class={handleClass} />
{:else}
  <Handle type="source" id="bottom" position={Position.Bottom} class={handleClass} />
  <Handle type="target" id="top" position={Position.Top} class={handleClass} />
  <Handle type="source" id="right" position={Position.Right} class={handleClass} />
  <Handle type="target" id="left" position={Position.Left} class={handleClass} />
{/if}

{#if isPill}
  <div class="wf-pill" style:--ink={kind.ink} style:--tint={kind.tint}>
    <span class="wf-chip size-5.5 rounded-full">
      <kind.icon class="size-3.5" aria-hidden="true" />
    </span>
    <span class="wf-name min-w-0 truncate text-body font-semibold text-foreground">{data.label}</span>
  </div>
{:else}
  <div class="wf-card" style:--ink={kind.ink} style:--tint={kind.tint}>
    <div class="flex items-center gap-2">
      <span class="wf-chip size-6 rounded-md">
        <kind.icon class="size-3.5" aria-hidden="true" />
      </span>
      <span class="wf-kind text-caption font-semibold">{kind.plain}</span>
      {#if needsAttention}
        <Badge variant="secondary" dot="var(--warning)" class="ml-auto">Needs attention</Badge>
      {/if}
    </div>
    <div class="wf-name mt-2.5 truncate text-sm font-semibold text-foreground">{data.label}</div>
    {#if summary}
      <div class="wf-summary mt-0.5 truncate text-small text-muted-foreground">{summary}</div>
    {/if}
  </div>
{/if}
