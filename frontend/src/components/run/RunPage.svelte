<script lang="ts">
  // ABOUTME: Run page at /runs/{id}: toolbar (back, title, status, Abort Run or Run Again) and the hero for the run's state
  // ABOUTME: Polls the run, loads its steps once and follows its events; the sections below the hero are still the older ones

  import { onMount, untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { errorMessage } from '$lib/notify';
  import { heroModel } from '$lib/runHero';
  import { isActive, isNeedsYou, runTitle } from '$lib/runStatus';
  import { formatDuration, formatWhenInline } from '$lib/timeFormat';
  import { formatWorkflowName } from '$lib/utils';
  import {
    usePageActions,
    usePageBack,
    usePageSubtitle,
    usePageTitle,
    usePageTitleAccessory,
  } from '$lib/page-header.svelte';
  import * as eventsApi from '../../lib/api/events';
  import * as questionsApi from '../../lib/api/questions';
  import * as runsApi from '../../lib/api/runs';
  import type { ApiError } from '../../lib/api/errors';
  import type { DecisionResponse, GraphNodeSummary, RunSummary } from '../../lib/api/runs';
  import type { WorkflowSummary } from '../../lib/api/workflows';
  import { eventStore } from '../../stores/events.svelte';
  import { libraryStore } from '../../stores/library.svelte';
  import LazyRunDialog from '../dashboard/LazyRunDialog.svelte';
  import StatusBadge from '../dashboard/StatusBadge.svelte';
  import RunHero from './RunHero.svelte';
  import RunToolbarActions from './RunToolbarActions.svelte';

  interface Library {
    readonly workflows: WorkflowSummary[];
    readonly loaded: boolean;
  }

  let { runId, library = libraryStore }: { runId: string; library?: Library } = $props();

  const POLL_INTERVAL_MS = 5000;

  let run = $state<RunSummary | null>(null);
  let notFound = $state(false);
  let loadError = $state<string | null>(null);
  let actionError = $state<string | null>(null);
  let steps = $state<GraphNodeSummary[]>([]);
  // The hero counts and names steps, so it waits for them rather than flash ids.
  let stepsSettled = $state(false);
  let decisions = $state<DecisionResponse[]>([]);
  let question = $state<string | null>(null);
  let aborting = $state(false);
  let runDialogOpen = $state(false);
  // The Run information panel arrives with the Progress tab; for now this only drives the toggle.
  let panelOpen = $state(typeof window !== 'undefined' && window.innerWidth >= 1100);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  const now = useNow(1000);

  const workflow = $derived(run?.workflow_id ? (library.workflows.find((w) => w.id === run?.workflow_id) ?? null) : null);
  const active = $derived(run ? isActive(run.status) : false);
  const hero = $derived(
    run
      ? heroModel({
          run,
          steps,
          events: eventStore.events,
          decisions,
          question,
          // Read once per change of data, not every tick: only a finished run's duration uses it.
          now: untrack(() => new Date()),
        })
      : null
  );

  function stopPolling() {
    clearInterval(pollHandle);
    pollHandle = undefined;
  }

  async function refresh() {
    try {
      const latest = await runsApi.getRun(runId);
      run = latest;
      notFound = false;
      loadError = null;
      await loadDetails(latest);
      if (!isActive(latest.status)) stopPolling();
    } catch (err) {
      if ((err as ApiError).status === 404) {
        notFound = true;
        stopPolling();
      } else {
        loadError = errorMessage(err, 'Something went wrong.');
      }
    }
  }

  // What the hero's words need beyond the run itself. A failure here leaves the hero with less to say, not an error.
  async function loadDetails(latest: RunSummary) {
    const [decided, asked] = await Promise.all([
      runsApi.listDecisions(runId).catch(() => null),
      latest.pending_questions > 0 ? questionsApi.listQuestions(runId).catch(() => null) : null,
    ]);
    if (decided) decisions = decided.decisions;
    question = asked?.questions[0]?.question ?? null;
  }

  async function loadSteps() {
    try {
      steps = (await runsApi.getRunSteps(runId)).nodes;
    } catch {
      // The hero falls back to step ids.
    } finally {
      stepsSettled = true;
    }
  }

  async function abort() {
    aborting = true;
    actionError = null;
    try {
      const response = await runsApi.cancelRun(runId);
      if (run) run = { ...run, status: response.status };
      await refresh();
    } catch (err) {
      actionError = `Couldn't abort the run. ${errorMessage(err, 'Something went wrong.')}`;
    } finally {
      aborting = false;
    }
  }

  onMount(() => {
    void refresh();
    void loadSteps();
    pollHandle = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return stopPolling;
  });

  // The page follows the run's events; the older event log below also fills this store, which de-duplicates.
  $effect(() => {
    const id = runId;
    eventStore.clear();
    const unsubscribe = eventsApi.subscribeToPipelineEvents(id, (event) => eventStore.add(event));
    return () => {
      unsubscribe();
      eventStore.clear();
    };
  });

  usePageTitle(() => {
    if (notFound) return 'Run not found';
    return run ? runTitle(run, library.workflows) : null;
  });
  usePageSubtitle(() =>
    run
      ? `\`${run.id}\` · Started ${formatWhenInline(run.started_at, now.current)} · ${formatDuration(run.started_at, run.completed_at, now.current)}`
      : null
  );
  usePageBack(() =>
    workflow
      ? { label: formatWorkflowName(workflow.name), href: `/workflows/${encodeURIComponent(workflow.id)}` }
      : { label: 'Workflows', href: '/' }
  );
  usePageTitleAccessory(() => (run ? statusAccessory : null));
  const actionsInHeader = usePageActions(runActions);
</script>

{#snippet statusAccessory()}
  {#if run}
    <StatusBadge status={isNeedsYou(run) ? 'Needs you' : run.status} />
  {/if}
{/snippet}

{#snippet runActions()}
  {#if run}
    <RunToolbarActions
      {active}
      {aborting}
      onAbort={() => void abort()}
      onRunAgain={workflow ? () => (runDialogOpen = true) : null}
      {panelOpen}
      onTogglePanel={() => (panelOpen = !panelOpen)}
    />
  {/if}
{/snippet}

<div class="flex flex-col gap-5 px-4 pt-5 pb-8 sm:px-7 sm:pt-6">
  {#if run && !actionsInHeader}
    <div class="flex items-center gap-2">{@render runActions()}</div>
  {/if}

  {#if notFound}
    <div class="flex flex-col items-start gap-3">
      <p class="m-0 text-body text-foreground">We couldn't find that run. It may have been removed.</p>
      <Button href="/" variant="outline">Back to Workflows</Button>
    </div>
  {:else}
    {#if loadError}
      <div
        role="alert"
        class="flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive"
      >
        <span class="min-w-0 flex-1">Couldn't load this run. {loadError}</span>
        <Button variant="outline" size="sm" onclick={() => void refresh()}>Try Again</Button>
      </div>
    {/if}
    {#if actionError}
      <p role="alert" class="m-0 text-body text-destructive">{actionError}</p>
    {/if}

    {#if run && hero && stepsSettled}
      <RunHero
        {hero}
        resultsPath={run.run_working_dir}
        editHref={workflow ? `/workflows/${encodeURIComponent(workflow.id)}/edit` : null}
        onRunAgain={workflow ? () => (runDialogOpen = true) : null}
      />
    {:else if !loadError}
      <div role="status" aria-label="Loading run" class="rounded-xl border border-border px-5 py-[18px]">
        <Skeleton class="h-3 w-20 rounded" />
        <Skeleton class="mt-2 h-6 w-64 rounded" />
        <Skeleton class="mt-3 h-3.5 w-80 max-w-full rounded" />
      </div>
    {/if}
  {/if}

  {#if workflow}
    <LazyRunDialog {workflow} bind:open={runDialogOpen} />
  {/if}
</div>
