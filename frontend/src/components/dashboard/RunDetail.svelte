<script lang="ts">
  // ABOUTME: Run detail page - status badge, token counter, abort button, graph SVG
  // ABOUTME: Composes the non-SSE, non-question parts of the run detail view

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { RunSummary } from '../../lib/api/runs';
  import StatusBadge from './StatusBadge.svelte';
  import TokenCounter from './TokenCounter.svelte';
  import RunMetaList from './RunMetaList.svelte';
  import { sanitizeSvg } from '../../lib/sanitizeSvg';
  import { TERMINAL_STATUSES } from '../../lib/runStatus';
  import { graphErrorMessage } from '../../lib/graphError';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { usePageActions } from '$lib/page-header.svelte';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;
  const GRAPH_POLL_INTERVAL_MS = 3000;

  let run: RunSummary | null = $state(null);
  let graphSvg: string | null = $state(null);
  let graphError: string | null = $state(null);
  let lastRawSvg: string | null = null;
  let error: string | null = $state(null);
  let aborting = $state(false);
  let pollHandle: ReturnType<typeof setInterval> | undefined;
  let graphPollHandle: ReturnType<typeof setInterval> | undefined;

  async function refreshRun() {
    try {
      run = await runsApi.getRun(runId);
      error = null;
      if (run && TERMINAL_STATUSES.has(run.status) && pollHandle) {
        stopPolling();
        // One last fetch so the graph shows the final node colours.
        loadGraph();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load run';
    }
  }

  function stopPolling() {
    clearInterval(pollHandle);
    clearInterval(graphPollHandle);
    pollHandle = undefined;
    graphPollHandle = undefined;
  }

  async function loadGraph() {
    try {
      const rawSvg = await runsApi.renderGraph(runId);
      graphError = null;
      // Replace the markup only when the graph changed, so it doesn't flicker.
      if (rawSvg !== lastRawSvg) {
        lastRawSvg = rawSvg;
        graphSvg = sanitizeSvg(rawSvg);
      }
    } catch (err) {
      // Shown inline in the graph's place, never as a toast.
      graphError = graphErrorMessage(err instanceof Error ? err.message : '');
    }
  }

  async function handleAbort() {
    aborting = true;
    try {
      const resp = await runsApi.cancelRun(runId);
      if (run) run = { ...run, status: resp.status };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to abort run';
    } finally {
      aborting = false;
    }
  }

  onMount(() => {
    refreshRun();
    loadGraph();
    pollHandle = setInterval(refreshRun, POLL_INTERVAL_MS);
    graphPollHandle = setInterval(loadGraph, GRAPH_POLL_INTERVAL_MS);
  });

  onDestroy(stopPolling);

  // Status + Abort live in the page header when there is one.
  const actionsInHeader = usePageActions(runActions);
</script>

{#snippet runActions()}
  {#if run}
    <div class="flex items-center gap-3">
      <StatusBadge status={run.status} />
      {#if !TERMINAL_STATUSES.has(run.status)}
        <Separator orientation="vertical" class="h-5" />
        <Button
          variant="destructive"
          size="sm"
          class="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive"
          onclick={handleAbort}
          disabled={aborting}
        >
          {aborting ? 'Aborting...' : 'Abort'}
        </Button>
      {/if}
    </div>
  {/if}
{/snippet}

<div class="run-detail flex flex-col gap-4">
  {#if error}
    <p class="text-destructive" role="alert">Error: {error}</p>
  {/if}

  {#if run}
    {#if !actionsInHeader}
      {@render runActions()}
    {/if}

    <RunMetaList {run} />

    <TokenCounter {runId} />
  {/if}

  {#if graphSvg || graphError}
    <section class="flex flex-col gap-2">
      <h3 class="text-base font-semibold text-foreground">Pipeline Graph</h3>
      {#if graphError}
        <p class="graph-error text-destructive break-words">{graphError}</p>
      {:else}
        <div
          class="graph rounded-lg border border-border bg-card p-4 [&_svg]:h-auto [&_svg]:max-w-full"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- graphSvg is passed through sanitizeSvg() above, which strips <script>, on* handlers, and javascript: hrefs -->
          {@html graphSvg}
        </div>
      {/if}
    </section>
  {/if}
</div>
