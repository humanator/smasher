<script lang="ts">
  // ABOUTME: The runs table: status, workflow and run id, start time and duration; each row links to /runs/{id}
  // ABOUTME: Shared by the dashboard's Recent runs and the workflow page's run history; active durations tick every 30 s

  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { isActive, isNeedsYou } from '$lib/runStatus';
  import { formatDuration, formatWhen } from '$lib/timeFormat';
  import { formatWorkflowName } from '$lib/utils';
  import StatusBadge from './StatusBadge.svelte';

  let {
    runs,
    workflows = [],
    now = undefined,
    timeZone = undefined,
  }: {
    runs: RunSummary[];
    /** Lets a row show its workflow's title; without it rows fall back to the graph name. */
    workflows?: WorkflowSummary[];
    /** Pins the clock; by default the table keeps its own, ticking every 30 s. */
    now?: Date;
    /** Defaults to the system time zone. */
    timeZone?: string;
  } = $props();

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);
  const titles = $derived(new Map(workflows.map((w) => [w.id, formatWorkflowName(w.name)])));

  function workflowTitle(run: RunSummary): string {
    const title = run.workflow_id ? titles.get(run.workflow_id) : undefined;
    return title ?? (run.graph_name?.trim() || 'Unnamed workflow');
  }

  // A stopped run without an end time has no duration to show.
  function duration(run: RunSummary): string {
    return formatDuration(run.started_at, isActive(run.status) ? null : (run.completed_at ?? ''), current);
  }

  const GRID = 'grid grid-cols-[130px_minmax(0,1fr)_170px_120px] items-center gap-3 px-3';
</script>

<div role="table" aria-label="Runs" class="relative overflow-x-auto rounded-lg border border-border bg-card">
  <div role="rowgroup">
    <div role="row" class="{GRID} h-[26px] border-b border-border bg-muted text-[11px] font-semibold text-muted-foreground">
      <span role="columnheader">Status</span>
      <span role="columnheader">Workflow</span>
      <span role="columnheader">Started</span>
      <span role="columnheader">Duration</span>
    </div>
  </div>
  <div role="rowgroup">
    {#each runs as run, i (run.id)}
      <div
        role="row"
        class="{GRID} relative min-h-[34px] py-1 hover:bg-accent/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-inset {i % 2 === 1 ? 'bg-muted' : 'bg-card'}"
      >
        <span role="cell"><StatusBadge status={isNeedsYou(run) ? 'Needs you' : run.status} /></span>
        <span role="cell" class="flex min-w-0 items-baseline gap-2">
          <span class="truncate text-[13px] font-medium text-foreground">{workflowTitle(run)}</span>
          <!-- The run id is the link; its ::after stretches over the whole row. -->
          <a
            href="/runs/{run.id}"
            class="shrink-0 font-mono text-[11px] text-muted-foreground outline-none after:absolute after:inset-0 after:content-['']"
            >{run.id}</a
          >
        </span>
        <span role="cell" class="text-xs text-foreground/80">{formatWhen(run.started_at, current, timeZone)}</span>
        <span role="cell" class="text-xs text-muted-foreground tabular-nums">{duration(run)}</span>
      </div>
    {/each}
  </div>
</div>
