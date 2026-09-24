<script lang="ts">
  // ABOUTME: Edit existing workflow page - fetches graph and mounts canvas in edit mode
  // ABOUTME: Wires onSave to updateWorkflowGraph, and Export .dot to the native save shim

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import type { EditorGraph } from '../../lib/api/workflows';
  import WorkflowCanvas from '../node-editor/WorkflowCanvas.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { saveFile } from '../../lib/native';

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

  async function handleExport() {
    try {
      const dot = await workflowsApi.getWorkflowDot(workflowId);
      await saveFile(`${workflowId}.dot`, new Blob([dot], { type: 'text/vnd.graphviz' }));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to export workflow';
    }
  }
</script>

<div class="workflow-editor-page flex flex-col gap-8 p-8">
  {#if loading}
    <p class="rounded bg-muted p-4 text-muted-foreground">Loading workflow...</p>
  {:else if error}
    <p
      class="rounded border border-destructive/40 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      {error}
    </p>
  {:else if graph}
    <div class="flex justify-end">
      <Button variant="secondary" onclick={handleExport} data-testid="export-dot-button">
        Export .dot
      </Button>
    </div>
    <WorkflowCanvas
      {graph}
      {workflowId}
      availableTargetDirs={[]}
      onSave={handleSave}
    />
  {/if}
</div>
