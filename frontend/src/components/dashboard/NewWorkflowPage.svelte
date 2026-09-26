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
      window.location.href = `/workflows/${encodeURIComponent(result.id)}/edit`;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save workflow';
    }
  }
</script>

<div class="new-workflow-page flex h-full flex-col">
  {#if error}
    <p
      class="rounded border border-destructive/40 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      {error}
    </p>
  {/if}

  <WorkflowCanvas
    graph={undefined}
    workflowId={undefined}
    {availableTargetDirs}
    onSave={handleSave}
  />
</div>
