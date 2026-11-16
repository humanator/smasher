<script lang="ts">
  // ABOUTME: The dashboard's "All workflows" table: name, status, last activity, location, Edit and Run…
  // ABOUTME: Presentational; status comes from the runs it's given, and the page owns loading, search and import

  import PlayIcon from '@lucide/svelte/icons/play';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { workflowStatus } from '$lib/runStatus';
  import { formatWorkflowName } from '$lib/utils';
  import { filterWorkflows } from '$lib/workflowSearch';
  import StatusBadge from './StatusBadge.svelte';

  let {
    workflows,
    runs,
    now,
    timeZone = undefined,
    query = '',
    loading = false,
    error = null,
    onRun,
    onRetry,
    onImport,
  }: {
    workflows: WorkflowSummary[];
    /** Newest first, as the server lists them. */
    runs: RunSummary[];
    now: Date;
    /** Defaults to the system time zone. */
    timeZone?: string;
    query?: string;
    loading?: boolean;
    error?: string | null;
    onRun: (workflow: WorkflowSummary) => void;
    onRetry: () => void;
    onImport: () => void;
  } = $props();

  const rows = $derived(
    filterWorkflows(workflows, query).map((w) => ({
      workflow: w,
      title: formatWorkflowName(w.name),
      href: `/workflows/${encodeURIComponent(w.id)}`,
      ...workflowStatus(w.id, runs, now, timeZone),
    }))
  );

  // Phones stack each row (title and status, then activity and location, then actions);
  // from md up it's one line per workflow under the column headers.
  const GRID = 'md:grid md:grid-cols-[minmax(0,2fr)_130px_150px_130px_132px] md:items-center md:gap-3 px-3';
  const ROW = `${GRID} flex flex-wrap items-center gap-x-3 gap-y-1`;
  // Forces the next cells onto a new line on phones; gone from md up.
  const BREAK = 'basis-full md:hidden';
</script>

<section id="workflows" aria-labelledby="workflows-heading">
  <h2 id="workflows-heading" class="m-0 text-heading font-bold text-foreground">All workflows</h2>
  <p class="mt-0.5 mb-2.5 text-xs text-muted-foreground">
    A workflow is a saved set of steps. Open one to see its runs, edit it, or start a new run.
  </p>

  {#if error}
    <div role="alert" class="flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive">
      <span class="min-w-0 flex-1">Couldn't load workflows: {error}</span>
      <Button variant="outline" size="sm" onclick={onRetry}>Try Again</Button>
    </div>
  {:else if !loading && workflows.length === 0}
    <div class="rounded-lg border border-border px-3 py-6 text-center">
      <p class="m-0 text-body text-muted-foreground">No workflows yet. Create one or import a .dot file.</p>
      <div class="mt-3 flex justify-center gap-2">
        <Button href="/workflows/new" size="sm">New Workflow</Button>
        <Button variant="outline" size="sm" onclick={onImport}>Import .dot File</Button>
      </div>
    </div>
  {:else}
    <div
      role="table"
      aria-label="All workflows"
      aria-busy={loading}
      class="relative overflow-x-auto rounded-lg border border-border bg-card"
    >
      <div role="rowgroup">
        <div role="row" class="{GRID} hidden h-[26px] border-b border-border bg-muted text-caption font-semibold text-muted-foreground">
          <span role="columnheader">Name</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Last activity</span>
          <span role="columnheader">Location</span>
          <span role="columnheader"><span class="sr-only">Actions</span></span>
        </div>
      </div>
      <div role="rowgroup">
        {#if loading}
          {#each [0, 1, 2] as i (i)}
            <div class="{ROW} min-h-11 py-2" aria-hidden="true">
              <Skeleton class="h-3.5 w-40 rounded" />
              <Skeleton class="h-3.5 w-20 rounded" />
              <Skeleton class="h-3.5 w-28 rounded" />
              <Skeleton class="h-3.5 w-20 rounded" />
              <span></span>
            </div>
          {/each}
        {:else if rows.length === 0}
          <p class="m-0 px-3 py-4 text-body text-muted-foreground">No workflows match that search.</p>
        {:else}
          {#each rows as row, i (row.workflow.id)}
            <div role="row" class="{ROW} min-h-11 py-2 md:py-1.5 {i % 2 === 1 ? 'bg-muted' : 'bg-card'}">
              <span role="cell" class="min-w-0 flex-1">
                <a href={row.href} class="block truncate text-body font-medium text-foreground hover:underline">
                  {row.title}
                </a>
                <span class="block truncate font-mono text-caption text-muted-foreground">{row.workflow.name}</span>
              </span>
              <span role="cell"><StatusBadge status={row.status} /></span>
              <span class={BREAK} aria-hidden="true"></span>
              <span role="cell" class="text-xs text-foreground/80">{row.lastActivity}</span>
              <span role="cell" class="min-w-0 flex-1 truncate font-mono text-caption text-muted-foreground">{row.workflow.source_dir}</span>
              <span class={BREAK} aria-hidden="true"></span>
              <span role="cell" class="flex gap-1.5 pt-1 md:justify-end md:pt-0">
                <Button href="{row.href}/edit" variant="outline" size="sm">Edit</Button>
                <Button variant="outline" size="sm" onclick={() => onRun(row.workflow)}>
                  <PlayIcon aria-hidden="true" />Run…
                </Button>
              </span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</section>
