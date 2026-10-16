<script lang="ts">
  // ABOUTME: Workflow page at /workflows/{id}: toolbar (back, Edit Workflow, Run), its featured run and history
  // ABOUTME: Reads the shared library store, which already polls workflows and runs, so it fetches neither itself

  import PlayIcon from '@lucide/svelte/icons/play';
  import type { RunSummary } from '../../lib/api/runs';
  import type { WorkflowSummary } from '../../lib/api/workflows';
  import { pickFeaturedRun } from '../../lib/runStatus';
  import { Button } from '$lib/components/ui/button/index.js';
  import { formatWorkflowName } from '$lib/utils';
  import { usePageActions, usePageBack, usePageSubtitle, usePageTitle } from '$lib/page-header.svelte';
  import { libraryStore } from '../../stores/library.svelte';
  import LazyRunDialog from './LazyRunDialog.svelte';
  import RunMetaList from './RunMetaList.svelte';
  import RunTable from './RunTable.svelte';
  import StatusBadge from './StatusBadge.svelte';

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
  // Newest first, as the server lists them. The card and the history both come from this one list.
  const runs = $derived(library.runs.filter((run) => run.workflow_id === workflowId));
  const featured = $derived(pickFeaturedRun(runs));

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

<div class="workflow-detail flex flex-col gap-6">
  {#if !library.loaded && library.error}
    <div role="alert" class="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 p-4 text-body">
      <p class="m-0 text-destructive">Couldn't load your workflows. {library.error}</p>
      <Button variant="outline" size="sm" onclick={() => void library.refresh()}>Try Again</Button>
    </div>
  {:else if !library.loaded}
    <p class="sr-only" role="status">Loading workflow…</p>
  {:else if !workflow}
    <div class="flex flex-col items-start gap-3">
      <p class="m-0 text-body text-foreground">We couldn't find that workflow. It may have been renamed or moved.</p>
      <Button href="/" variant="outline">Back to Workflows</Button>
    </div>
  {:else}
    {#if !actionsInHeader}
      <div class="flex items-center gap-2">{@render workflowActions()}</div>
    {/if}

    <div class="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col gap-6"></div>

      <div class="flex min-w-0 flex-col gap-6">
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
          {#if runs.length > 0}
            <RunTable {runs} />
          {:else}
            <p class="text-muted-foreground">No runs yet.</p>
          {/if}
        </section>
      </div>
    </div>

    <LazyRunDialog {workflow} bind:open={runDialogOpen} />
  {/if}
</div>
