<script lang="ts">
  // ABOUTME: Workflow page at /workflows/{id}: toolbar (back, Edit Workflow, Run), what it does, its active run and history
  // ABOUTME: Reads workflows and runs from the shared library store; fetches only the workflow's graph, once

  import { onMount } from 'svelte';
  import PlayIcon from '@lucide/svelte/icons/play';
  import { getWorkflowGraph, type EditorGraph } from '../../lib/api/workflows';
  import type { RunSummary } from '../../lib/api/runs';
  import type { WorkflowSummary } from '../../lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { errorMessage } from '$lib/notify';
  import { formatWorkflowName } from '$lib/utils';
  import { describeLoops, orderSteps, stepLabel } from '$lib/workflowSteps';
  import { usePageActions, usePageBack, usePageSubtitle, usePageTitle } from '$lib/page-header.svelte';
  import { libraryStore } from '../../stores/library.svelte';
  import ActiveRunBanner from './ActiveRunBanner.svelte';
  import LazyRunDialog from './LazyRunDialog.svelte';
  import RunTable from './RunTable.svelte';
  import StepList from './StepList.svelte';

  interface Library {
    readonly workflows: WorkflowSummary[];
    readonly runs: RunSummary[];
    readonly loaded: boolean;
    readonly error: string | null;
    refresh(): Promise<void>;
  }

  let { workflowId, library = libraryStore }: { workflowId: string; library?: Library } = $props();

  let runDialogOpen = $state(false);

  const workflow = $derived(library.workflows.find((w) => w.id === workflowId) ?? null);
  // Newest first, as the server lists them. The banner and the history both come from this one list.
  const runs = $derived(library.runs.filter((run) => run.workflow_id === workflowId));

  let graph = $state<EditorGraph | null>(null);
  let graphError = $state<string | null>(null);
  const order = $derived(graph ? orderSteps(graph) : { steps: [], backEdges: [] });
  const intro = $derived(graph ? describeLoops(graph, order) : '');
  /** Step id → the name every section uses for it. */
  const labels = $derived(new Map((graph?.nodes ?? []).map((n) => [n.id, stepLabel(n)])));

  async function loadGraph() {
    graphError = null;
    try {
      graph = (await getWorkflowGraph(workflowId)).graph;
    } catch (err) {
      graphError = errorMessage(err, 'The server could not read it.');
    }
  }

  onMount(() => {
    void loadGraph();
  });

  // App shows "Workflow" until the library has loaded.
  usePageTitle(() => {
    if (!library.loaded) return null;
    return workflow ? formatWorkflowName(workflow.name) : 'Workflow not found';
  });
  usePageSubtitle(() => (workflow ? `\`${workflow.name}\` · ${workflow.source_dir}` : null));
  usePageBack(() => ({ label: 'Workflows', href: '/' }));
  const actionsInHeader = usePageActions(workflowActions);
</script>

{#snippet workflowActions()}
  {#if workflow}
    <Button href="/workflows/{encodeURIComponent(workflow.id)}/edit" variant="outline">Edit Workflow</Button>
    <Button onclick={() => (runDialogOpen = true)}>
      <PlayIcon aria-hidden="true" />
      Run
    </Button>
  {/if}
{/snippet}

{#if library.loaded && workflow}
  <ActiveRunBanner {runs} {labels} />
{/if}

<div class="workflow-detail flex flex-col gap-6 px-4 pt-5 pb-8 sm:px-6">
  {#if !library.loaded && library.error}
    <div
      role="alert"
      class="flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive"
    >
      <span class="min-w-0 flex-1">Couldn't load your workflows. {library.error}</span>
      <Button variant="outline" size="sm" onclick={() => void library.refresh()}>Try Again</Button>
    </div>
  {:else if library.loaded && !workflow}
    <div class="flex flex-col items-start gap-3">
      <p class="m-0 text-body text-foreground">We couldn't find that workflow. It may have been renamed or moved.</p>
      <Button href="/" variant="outline">Back to Workflows</Button>
    </div>
  {:else}
    {#if workflow && !actionsInHeader}
      <div class="flex items-center gap-2">{@render workflowActions()}</div>
    {/if}

    <div class="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <StepList
        steps={order.steps}
        {intro}
        loading={!graph && !graphError}
        error={graphError}
        editHref="/workflows/{encodeURIComponent(workflowId)}/edit"
        onRetry={() => void loadGraph()}
      />

      <section aria-labelledby="history-heading" class="min-w-0">
        <h2 id="history-heading" class="m-0 text-heading font-bold text-foreground">Run history</h2>
        <p class="mt-0.5 mb-2.5 text-xs text-muted-foreground">
          Every run of this workflow, newest first. Open one to see what happened step by step.
        </p>

        {#if library.error}
          <div
            role="alert"
            class="mb-2.5 flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive"
          >
            <span class="min-w-0 flex-1">Couldn't refresh this workflow's runs. {library.error}</span>
            <Button variant="outline" size="sm" onclick={() => void library.refresh()}>Try Again</Button>
          </div>
        {/if}

        {#if !library.loaded}
          <div role="status" aria-label="Loading runs" class="overflow-hidden rounded-lg border border-border bg-card">
            {#each [0, 1, 2] as i (i)}
              <div class="flex min-h-[34px] items-center gap-3 px-3 py-1.5 {i % 2 === 1 ? 'bg-muted' : ''}" aria-hidden="true">
                <Skeleton class="h-4 w-20 rounded-full" />
                <Skeleton class="h-3.5 w-32 rounded" />
                <Skeleton class="ml-auto h-3.5 w-16 rounded" />
              </div>
            {/each}
          </div>
        {:else if runs.length > 0}
          <RunTable {runs} columns="workflow" {labels} />
        {:else}
          <div class="rounded-lg border border-border px-3 py-6 text-center">
            <p class="m-0 text-body text-muted-foreground">This workflow hasn't run yet.</p>
            <Button size="sm" class="mt-3" onclick={() => (runDialogOpen = true)}>
              <PlayIcon aria-hidden="true" />
              Run
            </Button>
          </div>
        {/if}
      </section>
    </div>

    {#if workflow}
      <LazyRunDialog {workflow} bind:open={runDialogOpen} />
    {/if}
  {/if}
</div>
