<script lang="ts">
  // ABOUTME: Edit existing workflow page - fetches graph and mounts canvas in edit mode, titled with the workflow's name
  // ABOUTME: Wires onSave to an ETag-checked updateWorkflowGraph (412 -> toast with Reload / Save anyway), Export .dot to the native save shim, Run to the Run dialog

  import { onDestroy, onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import * as workflowsApi from '../../lib/api/workflows';
  import type { EditorGraph } from '../../lib/api/workflows';
  import type { WorkflowSummary } from '../../lib/api/workflows';
  import WorkflowCanvas from '../node-editor/WorkflowCanvas.svelte';
  import { saveFile } from '../../lib/native';
  import { formatWorkflowName } from '$lib/utils';
  import { usePageBack, usePageTitle } from '$lib/page-header.svelte';
  import { libraryStore } from '../../stores/library.svelte';
  import LazyRunDialog from './LazyRunDialog.svelte';

  let { workflowId, library = libraryStore }: { workflowId: string; library?: { readonly workflows: WorkflowSummary[] } } =
    $props();

  // Named as on the workflow page (D10); App shows "Workflow" until the library has loaded.
  const workflow = $derived(library.workflows.find((w) => w.id === workflowId) ?? null);
  const name = $derived(workflow ? formatWorkflowName(workflow.name) : null);
  usePageTitle(() => name);
  let runDialogOpen = $state(false);
  usePageBack(() => ({ label: name ?? 'Workflow', href: `/workflows/${encodeURIComponent(workflowId)}` }));

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
  // save-error slot and stays mounted with the unsaved edits. A conflict
  // resolves to false: nothing was written, so the edits stay unsaved.
  async function handleSave(updatedGraph: EditorGraph): Promise<boolean> {
    clearConflict();
    try {
      etag = await workflowsApi.updateWorkflowGraph(workflowId, updatedGraph, etag ?? undefined);
      return true;
    } catch (err) {
      if ((err as { status?: number }).status === 412) {
        showConflict();
        return false;
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
      canvas.markSaved();
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

<div class="workflow-editor-page flex h-full flex-col">
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
    <WorkflowCanvas
      onExport={handleExport}
      onRun={() => (runDialogOpen = true)}
      bind:this={canvas}
      {graph}
      {workflowId}
      availableTargetDirs={[]}
      onSave={handleSave}
    />
    <!-- The dialog names the workflow by its file; until the library has it, the id stands in. -->
    <LazyRunDialog workflow={{ id: workflowId, name: workflow?.name ?? workflowId }} bind:open={runDialogOpen} />
  {/if}
</div>
