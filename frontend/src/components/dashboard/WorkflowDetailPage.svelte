<script lang="ts">
  // ABOUTME: Workflow page at /workflows/{id}: name, source, Edit and Run Workflow
  // ABOUTME: Finds the workflow in GET /api/workflows, since there's no single-workflow endpoint

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import type { WorkflowSummary } from '../../lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { formatWorkflowName } from '$lib/utils';
  import { usePageActions, usePageTitle } from '$lib/page-header.svelte';
  import RunDialog from './RunDialog.svelte';

  let { workflowId }: { workflowId: string } = $props();

  let workflow: WorkflowSummary | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);
  let runDialogOpen = $state(false);

  onMount(async () => {
    try {
      const { workflows } = await workflowsApi.listWorkflows();
      workflow = workflows.find((w) => w.id === workflowId) ?? null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workflow';
    } finally {
      loading = false;
    }
  });

  // App shows "Workflow" until this is known.
  usePageTitle(() => {
    if (loading || error) return null;
    return workflow ? formatWorkflowName(workflow.name) : 'Workflow not found';
  });

  // Edit + Run Workflow live in the page header when there is one.
  const actionsInHeader = usePageActions(workflowActions);
</script>

{#snippet workflowActions()}
  {#if workflow}
    <div class="flex items-center gap-2">
      <Button
        href="/workflows/{encodeURIComponent(workflow.id)}/edit"
        variant="secondary"
        size="sm"
      >
        Edit
      </Button>
      <Button size="sm" onclick={() => (runDialogOpen = true)}>Run Workflow</Button>
    </div>
  {/if}
{/snippet}

<div class="workflow-detail flex flex-col gap-6">
  {#if loading}
    <p class="text-muted-foreground">Loading workflow...</p>
  {:else if error}
    <p class="text-destructive" role="alert">Error: {error}</p>
  {:else if !workflow}
    <div class="flex flex-col items-start gap-2">
      <p class="text-lg text-foreground">Workflow not found.</p>
      <a href="/" class="text-primary hover:underline">← All workflows</a>
    </div>
  {:else}
    <div class="flex flex-col gap-1 text-sm text-muted-foreground">
      <p class="font-mono">{workflow.name}</p>
      <p>Source: {workflow.source_dir}</p>
    </div>

    {#if !actionsInHeader}
      {@render workflowActions()}
    {/if}

    <RunDialog {workflow} bind:open={runDialogOpen} />
  {/if}
</div>
