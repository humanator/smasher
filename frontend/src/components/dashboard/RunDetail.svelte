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
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { usePageActions } from '$lib/page-header.svelte';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;

  let run: RunSummary | null = $state(null);
  let graphSvg: string | null = $state(null);
  let error: string | null = $state(null);
  let aborting = $state(false);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refreshRun() {
    try {
      run = await runsApi.getRun(runId);
      error = null;
      if (run && TERMINAL_STATUSES.has(run.status) && pollHandle) {
        clearInterval(pollHandle);
        pollHandle = undefined;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load run';
    }
  }

  async function loadGraph() {
    try {
      const rawSvg = await runsApi.renderGraph(runId);
      graphSvg = sanitizeSvg(rawSvg);
    } catch {
      // Graph rendering can fail for workflows without a resolvable graph;
      // non-fatal to the rest of the run detail view.
      graphSvg = null;
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
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });

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

    {#if graphSvg}
      <div class="graph overflow-auto rounded-lg border border-border bg-card p-4">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- graphSvg is passed through sanitizeSvg() above, which strips <script>, on* handlers, and javascript: hrefs -->
        {@html graphSvg}
      </div>
    {/if}
  {/if}
</div>
