<script lang="ts">
  // ABOUTME: The runs table: status, workflow and run id, start time and duration; each row links to /runs/{id}
  // ABOUTME: Shared by the dashboard's Recent runs and the workflow page's run history, which adds failure reasons

  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { summariseRunError } from '$lib/runError';
  import { isActive, isNeedsYou, runTitle } from '$lib/runStatus';
  import { formatDuration, formatWhen } from '$lib/timeFormat';
  import StatusBadge from './StatusBadge.svelte';

  let {
    runs,
    workflows = [],
    now = undefined,
    timeZone = undefined,
    columns = 'dashboard',
    labels = new Map(),
  }: {
    runs: RunSummary[];
    /** Lets a row show its workflow's title; without it rows fall back to the graph name. */
    workflows?: WorkflowSummary[];
    /** Pins the clock; by default the table keeps its own, ticking every 30 s. */
    now?: Date;
    /** Defaults to the system time zone. */
    timeZone?: string;
    /** 'workflow' drops the workflow name for the run id, and adds a failed run's reason. */
    columns?: 'dashboard' | 'workflow';
    /** Step id → step name, for naming the step a failed run stopped at. */
    labels?: ReadonlyMap<string, string>;
  } = $props();

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);
  // A stopped run without an end time has no duration to show.
  function duration(run: RunSummary): string {
    return formatDuration(run.started_at, isActive(run.status) ? null : (run.completed_at ?? ''), current);
  }

  // Phones stack each row (status and workflow, then start and duration); from md up
  // it's one line per run under the column headers.
  const GRID = $derived(
    columns === 'workflow'
      ? 'md:grid md:grid-cols-[110px_minmax(0,1fr)_110px_110px] md:items-center md:gap-3 px-3'
      : 'md:grid md:grid-cols-[130px_minmax(0,1fr)_170px_120px] md:items-center md:gap-3 px-3'
  );
  const ROW = $derived(`${GRID} flex flex-wrap items-center gap-x-3 gap-y-0.5`);

  function failureReason(run: RunSummary): string | null {
    return run.status === 'Failed' ? summariseRunError(run.error, labels) : null;
  }
</script>

<div role="table" aria-label="Runs" class="relative overflow-x-auto rounded-lg border border-border bg-card">
  <div role="rowgroup">
    <div role="row" class="{GRID} hidden h-[26px] border-b border-border bg-muted text-caption font-semibold text-muted-foreground">
      <span role="columnheader">Status</span>
      {#if columns === 'workflow'}
        <span role="columnheader">Started</span>
        <span role="columnheader">Run</span>
      {:else}
        <span role="columnheader">Workflow</span>
        <span role="columnheader">Started</span>
      {/if}
      <span role="columnheader">Duration</span>
    </div>
  </div>
  <div role="rowgroup">
    {#each runs as run, i (run.id)}
      <div
        role="row"
        class="{ROW} relative min-h-[34px] py-1.5 md:py-1 hover:bg-accent/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-inset {i % 2 === 1 ? 'bg-muted' : 'bg-card'}"
      >
        <span role="cell"><StatusBadge status={isNeedsYou(run) ? 'Needs you' : run.status} /></span>
        {#if columns === 'workflow'}
          {@const reason = failureReason(run)}
          <span role="cell" class="flex min-w-0 flex-1 flex-col">
            <span class="text-xs text-foreground/80">{formatWhen(run.started_at, current, timeZone)}</span>
            {#if reason}
              <span id="run-reason-{run.id}" class="flex items-start gap-1 text-[11.5px] leading-snug text-destructive">
                <TriangleAlertIcon class="mt-px size-3 shrink-0" aria-hidden="true" />
                <span>{reason}</span>
              </span>
            {/if}
          </span>
          <span class="basis-full md:hidden" aria-hidden="true"></span>
          <span role="cell">
            <!-- The run id is the link; its ::after stretches over the whole row. -->
            <a
              id="run-link-{run.id}"
              href="/runs/{run.id}"
              aria-labelledby={reason ? `run-link-${run.id} run-reason-${run.id}` : undefined}
              class="font-mono text-caption text-muted-foreground outline-none after:absolute after:inset-0 after:content-['']"
              >{run.id}</a
            >
          </span>
          <span role="cell" class="text-xs text-muted-foreground tabular-nums">{duration(run)}</span>
        {:else}
          <span role="cell" class="flex min-w-0 flex-1 items-baseline gap-2">
            <span class="truncate text-body font-medium text-foreground">{runTitle(run, workflows)}</span>
            <!-- The run id is the link; its ::after stretches over the whole row. -->
            <a
              href="/runs/{run.id}"
              class="shrink-0 font-mono text-caption text-muted-foreground outline-none after:absolute after:inset-0 after:content-['']"
              >{run.id}</a
            >
          </span>
          <span class="basis-full md:hidden" aria-hidden="true"></span>
          <span role="cell" class="text-xs text-foreground/80">{formatWhen(run.started_at, current, timeZone)}</span>
          <span role="cell" class="text-xs text-muted-foreground tabular-nums">{duration(run)}</span>
        {/if}
      </div>
    {/each}
  </div>
</div>
