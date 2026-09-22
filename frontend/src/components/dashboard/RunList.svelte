<script lang="ts">
  // ABOUTME: Run list page - polls GET /api/runs and shows real run status
  // ABOUTME: Links each row to its run detail page at /runs/{id}

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { RunSummary } from '../../lib/api/runs';

  const POLL_INTERVAL_MS = 5000;

  let runs: RunSummary[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refresh() {
    try {
      const response = await runsApi.listRuns();
      runs = response.runs;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load runs';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    refresh();
    pollHandle = setInterval(refresh, POLL_INTERVAL_MS);
  });

  onDestroy(() => {
    if (pollHandle) clearInterval(pollHandle);
  });
</script>

<div class="run-list">
  <h1>Runs</h1>

  {#if loading}
    <p class="loading">Loading runs...</p>
  {:else if error}
    <p class="error" role="alert">Error: {error}</p>
  {:else if runs.length === 0}
    <p class="empty-state">No runs yet.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Run</th>
          <th>Workflow</th>
          <th>Status</th>
          <th>Started</th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run (run.id)}
          <tr>
            <td>
              <a href="/runs/{run.id}">{run.id}</a>
            </td>
            <td>{run.graph_name}</td>
            <td><span class="status status-{run.status.toLowerCase()}">{run.status}</span></td>
            <td>{new Date(run.started_at).toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .run-list {
    padding: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: #1e293b;
  }

  .loading,
  .error,
  .empty-state {
    font-size: 1.125rem;
    color: #64748b;
    text-align: center;
    padding: 2rem;
  }

  .error {
    color: #dc2626;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  th,
  td {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 0.875rem;
  }

  td {
    font-size: 0.875rem;
    color: #1e293b;
  }

  a {
    color: #3b82f6;
    text-decoration: none;
    font-family: monospace;
  }

  a:hover {
    text-decoration: underline;
  }

  .status {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-running {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-completed {
    background: #dcfce7;
    color: #15803d;
  }

  .status-failed {
    background: #fee2e2;
    color: #b91c1c;
  }

  .status-aborted,
  .status-cancelled {
    background: #f1f5f9;
    color: #475569;
  }
</style>
