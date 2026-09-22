<script lang="ts">
  // ABOUTME: Run detail page - status badge, token counter, abort button, graph SVG
  // ABOUTME: Composes the non-SSE, non-question parts of the run detail view

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { RunSummary } from '../../lib/api/runs';
  import StatusBadge from './StatusBadge.svelte';
  import TokenCounter from './TokenCounter.svelte';
  import { sanitizeSvg } from '../../lib/sanitizeSvg';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;
  const TERMINAL_STATUSES = new Set(['Completed', 'Failed', 'Aborted']);

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
</script>

<div class="run-detail">
  {#if error}
    <p class="error" role="alert">Error: {error}</p>
  {/if}

  {#if run}
    <div class="header">
      <StatusBadge status={run.status} />
      {#if !TERMINAL_STATUSES.has(run.status)}
        <button class="btn btn-abort" onclick={handleAbort} disabled={aborting}>
          {aborting ? 'Aborting...' : 'Abort'}
        </button>
      {/if}
    </div>

    <TokenCounter {runId} />

    {#if graphSvg}
      <div class="graph">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- graphSvg is passed through sanitizeSvg() above, which strips <script>, on* handlers, and javascript: hrefs -->
        {@html graphSvg}
      </div>
    {/if}
  {/if}
</div>

<style>
  .run-detail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .error {
    color: #dc2626;
  }

  .btn {
    padding: 0.375rem 0.875rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .btn-abort {
    background-color: #dc2626;
    color: white;
  }

  .btn-abort:hover:not(:disabled) {
    background-color: #b91c1c;
  }

  .btn-abort:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }

  .graph {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    overflow: auto;
  }
</style>
