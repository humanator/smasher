<script lang="ts">
  // ABOUTME: The runs table: status, workflow and run id, start time and duration; each row links to /runs/{id}
  // ABOUTME: Shared by the dashboard's Recent runs and the workflow page's run history; ondelete adds checkboxes and delete

  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { summariseRunError } from '$lib/runError';
  import { isActive, isNeedsYou, runTitle } from '$lib/runStatus';
  import { formatDuration, formatWhen } from '$lib/timeFormat';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import StatusBadge from './StatusBadge.svelte';

  let {
    runs,
    workflows = [],
    now = undefined,
    timeZone = undefined,
    columns = 'dashboard',
    labels = new Map(),
    ondelete,
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
    /** Deletes the given runs; when set, rows get checkboxes and a delete action. */
    ondelete?: (ids: string[]) => Promise<void>;
  } = $props();

  // Picked ids; ones that vanish from `runs` or start running drop out of `selectedIds`.
  let picked: string[] = $state([]);
  // The ids awaiting confirmation; the dialog is open while this is set.
  let pending: string[] | null = $state(null);
  let deleting = $state(false);
  let deleteError: string | null = $state(null);

  const finishedIds = $derived(runs.filter((run) => !isActive(run.status)).map((run) => run.id));
  const selectedIds = $derived(finishedIds.filter((id) => picked.includes(id)));
  const allSelected = $derived(finishedIds.length > 0 && selectedIds.length === finishedIds.length);

  function setPicked(id: string, checked: boolean) {
    picked = checked ? [...picked, id] : picked.filter((p) => p !== id);
  }

  function confirmDelete(ids: string[]) {
    deleteError = null;
    pending = ids;
  }

  async function runDelete() {
    if (!pending || !ondelete) return;
    deleting = true;
    deleteError = null;
    try {
      await ondelete(pending);
      picked = picked.filter((id) => !pending?.includes(id));
      pending = null;
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Failed to delete runs';
    } finally {
      deleting = false;
    }
  }

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);
  // A stopped run without an end time has no duration to show.
  function duration(run: RunSummary): string {
    return formatDuration(run.started_at, isActive(run.status) ? null : (run.completed_at ?? ''), current);
  }

  // Narrow rows stack (status and workflow, then start and duration); wide ones are one
  // line per run under the column headers. The dashboard switches at the viewport's md.
  // The workflow page's history sits beside the step list and the sidebar, so it switches
  // on its own width instead: the fixed columns take about 460px, and the failure reason
  // needs room beside them.
  const GRID = $derived(
    columns === 'workflow'
      ? '@2xl:grid @2xl:grid-cols-[110px_minmax(0,1fr)_180px_110px] @2xl:items-center @2xl:gap-3 px-3'
      : ondelete
        ? 'md:grid md:grid-cols-[20px_130px_minmax(0,1fr)_170px_120px_28px] md:items-center md:gap-3 px-3'
        : 'md:grid md:grid-cols-[130px_minmax(0,1fr)_170px_120px] md:items-center md:gap-3 px-3'
  );
  const ROW = $derived(`${GRID} flex flex-wrap items-center gap-x-3 gap-y-0.5`);
  const SPACER = $derived(columns === 'workflow' ? '@2xl:hidden' : 'md:hidden');
  const ROW_PAD = $derived(columns === 'workflow' ? '@2xl:py-1' : 'md:py-1');

  function failureReason(run: RunSummary): string | null {
    return run.status === 'Failed' ? summariseRunError(run.error, labels) : null;
  }
</script>

{#if ondelete}
  <div class="mb-2 flex justify-end">
    <Button
      variant="destructive"
      size="sm"
      disabled={selectedIds.length === 0}
      onclick={() => confirmDelete(selectedIds)}
    >
      <Trash2Icon />
      Delete selected ({selectedIds.length})
    </Button>
  </div>
{/if}

<div role="table" aria-label="Runs" class="@container relative overflow-x-auto rounded-lg border border-border bg-card">
  <div role="rowgroup">
    <div role="row" class="{GRID} hidden h-[26px] border-b border-border bg-muted text-caption font-semibold text-muted-foreground">
      {#if ondelete}
        <span role="columnheader" class="flex items-center">
          <Checkbox
            aria-label="Select all finished runs"
            checked={allSelected}
            indeterminate={selectedIds.length > 0 && !allSelected}
            disabled={finishedIds.length === 0}
            onCheckedChange={(checked) => (picked = checked ? [...finishedIds] : [])}
          />
        </span>
      {/if}
      <span role="columnheader">Status</span>
      {#if columns === 'workflow'}
        <span role="columnheader">Started</span>
        <span role="columnheader">Run</span>
      {:else}
        <span role="columnheader">Workflow</span>
        <span role="columnheader">Started</span>
      {/if}
      <span role="columnheader">Duration</span>
      {#if ondelete}
        <span role="columnheader"><span class="sr-only">Actions</span></span>
      {/if}
    </div>
  </div>
  <div role="rowgroup">
    {#each runs as run, i (run.id)}
      <div
        role="row"
        class="{ROW} relative min-h-[34px] py-1.5 {ROW_PAD} hover:bg-accent/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-inset {i % 2 === 1 ? 'bg-muted' : 'bg-card'}"
      >
        {#if ondelete}
          <!-- Raised above the row link's stretched ::after so a click selects instead of navigating. -->
          <span role="cell" class="relative z-10 flex items-center">
            <Checkbox
              aria-label="Select run {run.id}"
              checked={selectedIds.includes(run.id)}
              disabled={isActive(run.status)}
              onCheckedChange={(checked) => setPicked(run.id, checked)}
            />
          </span>
        {/if}
        <span role="cell"><StatusBadge status={isNeedsYou(run) ? 'Needs you' : run.status} /></span>
        {#if columns === 'workflow'}
          {@const reason = failureReason(run)}
          <span role="cell" class="flex min-w-0 flex-1 flex-col">
            <span class="text-xs text-foreground/80">{formatWhen(run.started_at, current, timeZone)}</span>
            {#if reason}
              <span id="run-reason-{run.id}" class="flex items-start gap-1 text-hint text-destructive">
                <TriangleAlertIcon class="mt-px size-3 shrink-0" aria-hidden="true" />
                <span>{reason}</span>
              </span>
            {/if}
          </span>
          <span class="basis-full {SPACER}" aria-hidden="true"></span>
          <span role="cell" class="min-w-0 truncate">
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
          <span class="basis-full {SPACER}" aria-hidden="true"></span>
          <span role="cell" class="text-xs text-foreground/80">{formatWhen(run.started_at, current, timeZone)}</span>
          <span role="cell" class="text-xs text-muted-foreground tabular-nums">{duration(run)}</span>
          {#if ondelete}
            <span role="cell" class="relative z-10 ml-auto md:ml-0">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete run {run.id}"
                title={isActive(run.status) ? 'Cancel the run before deleting it' : 'Delete run'}
                disabled={isActive(run.status)}
                onclick={() => confirmDelete([run.id])}
              >
                <Trash2Icon />
              </Button>
            </span>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
</div>

{#if ondelete}
  <Dialog.Root
    open={pending !== null}
    onOpenChange={(open) => {
      if (!open && !deleting) pending = null;
    }}
  >
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>
          Delete {pending?.length ?? 0} {pending?.length === 1 ? 'run' : 'runs'}?
        </Dialog.Title>
        <Dialog.Description>
          This permanently deletes {pending?.length === 1 ? 'the run' : 'these runs'} and all
          {pending?.length === 1 ? 'its' : 'their'} artifacts. It can't be undone.
        </Dialog.Description>
      </Dialog.Header>
      {#if deleteError}
        <p class="text-sm text-destructive" role="alert">{deleteError}</p>
      {/if}
      <Dialog.Footer>
        <Button variant="outline" disabled={deleting} onclick={() => (pending = null)}>Cancel</Button>
        <Button variant="destructive" disabled={deleting} onclick={runDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
