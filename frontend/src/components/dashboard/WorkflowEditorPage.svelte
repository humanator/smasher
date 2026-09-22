<script lang="ts">
  // ABOUTME: Edit existing workflow page - fetches graph and mounts canvas in edit mode
  // ABOUTME: Wires onSave to updateWorkflowGraph for existing workflows

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import type { EditorGraph } from '../../lib/api/workflows';
  import WorkflowCanvas from '../node-editor/WorkflowCanvas.svelte';

  let { workflowId }: { workflowId: string } = $props();

  let graph: EditorGraph | null = $state(null);
  let error: string | null = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      graph = await workflowsApi.getWorkflowGraph(workflowId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workflow';
    } finally {
      loading = false;
    }
  });

  async function handleSave(updatedGraph: EditorGraph) {
    try {
      await workflowsApi.updateWorkflowGraph(workflowId, updatedGraph);
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save workflow';
    }
  }
</script>

<div class="workflow-editor-page">
  <div class="header">
    <a href="/" class="back-link">← Back to Catalog</a>
    <h1>Edit Workflow</h1>
  </div>

  {#if loading}
    <p class="loading">Loading workflow...</p>
  {:else if error}
    <p class="error" role="alert">{error}</p>
  {:else if graph}
    <WorkflowCanvas
      {graph}
      {workflowId}
      availableTargetDirs={[]}
      onSave={handleSave}
    />
  {/if}
</div>

<style>
  .workflow-editor-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .back-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    color: #1e293b;
  }

  .loading,
  .error {
    padding: 1rem;
    border-radius: 4px;
  }

  .loading {
    color: #64748b;
    background-color: #f1f5f9;
  }

  .error {
    color: #dc2626;
    background-color: #fee2e2;
    border: 1px solid #fca5a5;
  }
</style>
