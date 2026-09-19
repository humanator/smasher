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
  //
  // Follow-up to Task 5, approved by Jobsworth: when there's no
  // `workflowId` yet (the /workflows/new case), the Save button has
  // nothing to PUT to -- a small inline name/target-dir form is shown
  // instead, and `onSave` is called with a second `meta` argument so the
  // host shell can call `createGraph` (POST, a new file) rather than
  // `saveGraph` (PUT, an existing one).
  let { graph = undefined, workflowId = undefined, availableTargetDirs = [], onSave }: {
    graph?: EditorGraph;
    workflowId?: string;
    availableTargetDirs?: string[];
    onSave: (graph: EditorGraph, meta?: { name: string; targetDir: string }) => void | Promise<void>;
  } = $props();

  const isCreateMode = $derived(!workflowId);
  let createName = $state('');
  let createTargetDir = $state('');

  // Default the <select> to the first configured directory once the host
  // bootstrap script assigns `availableTargetDirs` (mirrors the same
  // "assign once, on first real data" pattern the `graph` $effect below
  // already uses).
  $effect(() => {
    if (!createTargetDir && availableTargetDirs.length > 0) {
      createTargetDir = availableTargetDirs[0];
    }
  });

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
    saveError = null;
    let meta: { name: string; targetDir: string } | undefined;
    if (isCreateMode) {
      const name = createName.trim();
      if (!name) {
        // Client-side nicety only -- create_graph's own server-side
        // blank-name rejection is the real enforcement, same discipline
        // create_workflow already applies.
        saveError = 'workflow name must not be blank';
        return;
      }
      if (!createTargetDir) {
        saveError = 'choose a target directory';
        return;
      }
      meta = { name, targetDir: createTargetDir };
    }
    saving = true;
    try {
      await onSave(currentGraph(), meta);
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
    } finally {
      saving = false;
    }
  }

  const saveDisabled = $derived(saving || (isCreateMode && !createName.trim()));
</script>

<div class="workflow-canvas-root" style="width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: column;">
  {#if isCreateMode}
    <div class="create-workflow-fields" style="display: flex; gap: 0.75rem; align-items: flex-end; padding-bottom: 0.5rem;">
      <label style="display: flex; flex-direction: column; font-size: 0.85rem;">
        Name
        <input
          type="text"
          data-testid="create-name-input"
          bind:value={createName}
          placeholder="my-pipeline"
        />
      </label>
      <label style="display: flex; flex-direction: column; font-size: 0.85rem;">
        Directory
        <select data-testid="create-target-dir-select" bind:value={createTargetDir}>
          {#each availableTargetDirs as dir (dir)}
            <option value={dir}>{dir}</option>
          {/each}
        </select>
      </label>
    </div>
  {/if}
  <div class="canvas-area" style="flex: 1; position: relative;">
    <SvelteFlow bind:nodes bind:edges fitView>
      <Background />
      <Controls />
      <MiniMap />
    </SvelteFlow>
  </div>
  <button type="button" onclick={handleSave} disabled={saveDisabled} data-testid="save-button">
    {saving ? 'Saving…' : 'Save'}
  </button>
  {#if saveError}
    <p role="alert" data-testid="save-error">{saveError}</p>
  {/if}
</div>
