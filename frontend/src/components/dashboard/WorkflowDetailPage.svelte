<script lang="ts">
  // ABOUTME: Workflow page at /workflows/{id}: name, source, Edit, Run Workflow, its featured run and history
  // ABOUTME: Filters GET /api/workflows and GET /api/runs in the browser, as there are no per-id endpoints

  import { onMount } from 'svelte';
  import * as workflowsApi from '../../lib/api/workflows';
  import type { WorkflowSummary } from '../../lib/api/workflows';
  import * as runsApi from '../../lib/api/runs';
  import type { RunSummary } from '../../lib/api/runs';
  import { pickFeaturedRun } from '../../lib/runStatus';
  import { Button } from '$lib/components/ui/button/index.js';
  import { formatWorkflowName } from '$lib/utils';
  import { usePageActions, usePageTitle } from '$lib/page-header.svelte';
  import RunDialog from './RunDialog.svelte';
  import RunMetaList from './RunMetaList.svelte';
  import RunTable from './RunTable.svelte';
  import StatusBadge from './StatusBadge.svelte';

  let { workflowId }: { workflowId: string } = $props();

  let workflow: WorkflowSummary | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);
  let runDialogOpen = $state(false);

  const RUNS_POLL_INTERVAL_MS = 5000;

  // This workflow's runs, newest first as the server lists them. The card
  // and the history both come from this one list.
  let runs: RunSummary[] = $state([]);
  let runsLoaded = $state(false);
  let runsError: string | null = $state(null);
  const featured = $derived(pickFeaturedRun(runs));

  async function refreshRuns() {
    try {
      const response = await runsApi.listRuns();
      runs = response.runs.filter((run) => run.workflow_id === workflowId);
      runsError = null;
    } catch (err) {
      runsError = err instanceof Error ? err.message : 'Failed to load runs';
    } finally {
      runsLoaded = true;
    }
  }

  onMount(() => {
    (async () => {
      try {
        const { workflows } = await workflowsApi.listWorkflows();
        workflow = workflows.find((w) => w.id === workflowId) ?? null;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load workflow';
      } finally {
        loading = false;
      }
    })();

    refreshRuns();
    const pollHandle = setInterval(refreshRuns, RUNS_POLL_INTERVAL_MS);
    return () => clearInterval(pollHandle);
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

    {#if featured}
      <section
        aria-label={featured.heading}
        class="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground"
      >
        <h3 class="text-base font-semibold text-foreground">{featured.heading}</h3>
        <div class="flex flex-wrap items-center gap-3">
          <a href="/runs/{featured.run.id}" class="font-mono text-primary hover:underline">
            {featured.run.id}
          </a>
          <StatusBadge status={featured.run.status} />
        </div>
        <p class="text-sm text-muted-foreground">
          Started {new Date(featured.run.started_at).toLocaleString()}
        </p>
        <RunMetaList run={featured.run} />
        {#if featured.moreRunning > 0}
          <p class="text-sm text-muted-foreground">+{featured.moreRunning} more running</p>
        {/if}
      </section>
    {/if}

    <section aria-label="Run History" class="flex flex-col gap-4">
      <h3 class="text-base font-semibold text-foreground">Run History</h3>
      {#if runsError}
        <p class="text-destructive" role="alert">Error: {runsError}</p>
      {:else if runs.length > 0}
        <RunTable {runs} />
      {:else if runsLoaded}
        <p class="text-muted-foreground">No runs yet.</p>
      {/if}
    </section>

    <RunDialog {workflow} bind:open={runDialogOpen} />
  {/if}
</div>
