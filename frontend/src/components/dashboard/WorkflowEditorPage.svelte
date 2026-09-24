<script lang="ts">
  // ABOUTME: Edit existing workflow page - fetches graph and mounts canvas in edit mode
  // ABOUTME: Wires onSave to an ETag-checked updateWorkflowGraph (409 -> Reload / Save anyway), Export .dot to the native save shim

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
  let canvas: ReturnType<typeof WorkflowCanvas> | undefined = $state();
  // ETag of the file as last loaded or saved; sent as If-Match on save.
  let etag: string | null = null;
  // Set when a save was refused because the file changed on disk.
  let conflict: string | null = $state(null);

  async function loadGraph() {
    ({ graph, etag } = await workflowsApi.getWorkflowGraph(workflowId));
  }

  onMount(async () => {
    try {
      await loadGraph();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workflow';
    } finally {
      loading = false;
    }
  });

  // Other save errors are rethrown so the canvas shows them in its own
  // save-error slot and stays mounted with the unsaved edits.
  async function handleSave(updatedGraph: EditorGraph) {
    conflict = null;
    try {
      etag = await workflowsApi.updateWorkflowGraph(workflowId, updatedGraph, etag ?? undefined);
    } catch (err) {
      if ((err as { status?: number }).status === 409) {
        conflict = (err as Error).message;
        return;
      }
      throw err;
    }
  }

  async function handleReload() {
    try {
      await loadGraph();
      conflict = null;
    } catch (err) {
      conflict = err instanceof Error ? err.message : 'Failed to reload workflow';
    }
  }

  async function handleSaveAnyway() {
    if (!canvas) return;
    try {
      etag = await workflowsApi.updateWorkflowGraph(workflowId, canvas.currentGraph());
      conflict = null;
    } catch (err) {
      conflict = err instanceof Error ? err.message : 'Failed to save workflow';
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
    {#if conflict}
      <div
        class="flex items-center gap-3 rounded border border-destructive/40 bg-destructive/10 p-4 text-destructive"
        role="alert"
        data-testid="save-conflict"
      >
        <p class="flex-1">{conflict}. Reload to see the version on disk, or save yours over it.</p>
        <Button variant="secondary" onclick={handleReload} data-testid="conflict-reload">Reload</Button>
        <Button variant="destructive" onclick={handleSaveAnyway} data-testid="conflict-save-anyway">
          Save anyway
        </Button>
      </div>
    {/if}
    <WorkflowCanvas
      bind:this={canvas}
      {graph}
      {workflowId}
      availableTargetDirs={[]}
      onSave={handleSave}
    />
  {/if}
</div>
