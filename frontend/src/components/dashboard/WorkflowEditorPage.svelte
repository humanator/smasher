<script lang="ts">
  // ABOUTME: Edit existing workflow page - fetches graph and mounts canvas in edit mode
  // ABOUTME: Wires onSave to an ETag-checked updateWorkflowGraph (409 -> toast with Reload / Save anyway), Export .dot to the native save shim

  import { onDestroy, onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
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
  // The toast shown while a save is refused because the file changed on disk.
  let conflictToast: string | number | undefined;

  function showConflict() {
    conflictToast = toast.warning('This workflow changed on disk since you opened it', {
      id: conflictToast,
      description: 'Reload to see the version on disk, or save yours over it.',
      duration: Number.POSITIVE_INFINITY,
      action: { label: 'Save anyway', onClick: handleSaveAnyway },
      cancel: { label: 'Reload', onClick: handleReload },
    });
  }

  function clearConflict() {
    if (conflictToast !== undefined) toast.dismiss(conflictToast);
    conflictToast = undefined;
  }

  onDestroy(clearConflict);

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
    clearConflict();
    try {
      etag = await workflowsApi.updateWorkflowGraph(workflowId, updatedGraph, etag ?? undefined);
    } catch (err) {
      if ((err as { status?: number }).status === 409) {
        showConflict();
        return;
      }
      throw err;
    }
  }

  // The toast's buttons close it themselves.
  async function handleReload() {
    conflictToast = undefined;
    try {
      await loadGraph();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reload workflow');
    }
  }

  async function handleSaveAnyway() {
    conflictToast = undefined;
    if (!canvas) return;
    try {
      etag = await workflowsApi.updateWorkflowGraph(workflowId, canvas.currentGraph());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save workflow');
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
      bind:this={canvas}
      {graph}
      {workflowId}
      availableTargetDirs={[]}
      onSave={handleSave}
    />
  {/if}
</div>
