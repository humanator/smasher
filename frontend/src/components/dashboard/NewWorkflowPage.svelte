<script lang="ts">
  // ABOUTME: Create new workflow page - mounts canvas in create mode
  // ABOUTME: Fetches available target directories and wires onSave to createWorkflowGraph

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import type { EditorGraph } from '../../lib/api/workflows';
  import WorkflowCanvas from '../node-editor/WorkflowCanvas.svelte';

  let availableTargetDirs: string[] = $state([]);
  let error: string | null = $state(null);

  onMount(async () => {
    try {
      const response = await workflowsApi.listWorkflows();
      availableTargetDirs = response.available_target_dirs;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workflow directories';
    }
  });

  async function handleSave(graph: EditorGraph, meta?: { name: string; targetDir: string }) {
    if (!meta) {
      error = 'Workflow name and target directory are required';
      return;
    }

    try {
      const result = await workflowsApi.createWorkflowGraph(
        graph,
        meta.targetDir,
        meta.name
      );

      // Navigate to the edit page for the newly created workflow
      window.location.href = `/workflows/${result.id}/edit`;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save workflow';
    }
  }
</script>

<div class="new-workflow-page">
  <div class="header">
    <a href="/" class="back-link">← Back to Catalog</a>
    <h1>Create New Workflow</h1>
  </div>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <WorkflowCanvas
    graph={undefined}
    workflowId={undefined}
    {availableTargetDirs}
    onSave={handleSave}
  />
</div>

<style>
  .new-workflow-page {
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

  .error {
    color: #dc2626;
    background-color: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 4px;
    padding: 1rem;
  }
</style>
