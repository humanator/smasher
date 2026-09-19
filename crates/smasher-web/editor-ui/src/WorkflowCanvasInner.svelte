<script lang="ts">
  import { Background, Controls, MiniMap, SvelteFlow, type Edge as FlowEdge, type Node as FlowNode } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { toEditorGraph, toFlowEdges, toFlowNodes, type WorkflowEdgeData, type WorkflowNodeData } from './convert';
  import type { AttrValue, EditorGraph } from './types';

  // All the actual canvas UI/state logic, kept as a plain (non-custom-
  // element) Svelte component so it can be unit-tested via
  // @testing-library/svelte's standard render() -- WorkflowCanvas.svelte
  // is the thin <svelte:options customElement> shell around this that
  // does the host-page property/event plumbing (not reliably testable
  // outside a real browser; see WorkflowCanvas.svelte's own comment).
  let { graph = undefined, onSave }: {
    graph?: EditorGraph;
    onSave: (graph: EditorGraph) => void | Promise<void>;
  } = $props();

  let nodes = $state.raw<FlowNode<WorkflowNodeData>[]>([]);
  let edges = $state.raw<FlowEdge<WorkflowEdgeData>[]>([]);
  let graphName = $state<string | null>(null);
  let graphAttrs = $state<Record<string, AttrValue>>({});

  $effect(() => {
    if (graph) {
      nodes = toFlowNodes(graph.nodes);
      edges = toFlowEdges(graph.edges);
      graphName = graph.name;
      graphAttrs = graph.graph_attrs;
    }
  });

  export function currentGraph(): EditorGraph {
    return toEditorGraph(graphName, graphAttrs, nodes, edges);
  }

  let saving = $state(false);
  let saveError = $state<string | null>(null);

  async function handleSave() {
    saving = true;
    saveError = null;
    try {
      await onSave(currentGraph());
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="workflow-canvas-root" style="width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: column;">
  <div class="canvas-area" style="flex: 1; position: relative;">
    <SvelteFlow bind:nodes bind:edges fitView>
      <Background />
      <Controls />
      <MiniMap />
    </SvelteFlow>
  </div>
  <button type="button" onclick={handleSave} disabled={saving} data-testid="save-button">
    {saving ? 'Saving…' : 'Save'}
  </button>
  {#if saveError}
    <p role="alert" data-testid="save-error">{saveError}</p>
  {/if}
</div>
