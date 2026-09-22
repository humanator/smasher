<script lang="ts">
  // ABOUTME: Polled list of past gallery-gate decisions for a run
  // ABOUTME: Mirrors decision_history.html

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { DecisionResponse } from '../../lib/api/runs';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;

  let decisions: DecisionResponse[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refresh() {
    try {
      const response = await runsApi.listDecisions(runId);
      decisions = response.decisions;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load decision history';
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

<div class="decision-history">
  {#if loading}
    <p class="loading">Loading decision history...</p>
  {:else if error}
    <p class="error" role="alert">Error: {error}</p>
  {:else if decisions.length === 0}
    <p class="empty-state">No decisions yet.</p>
  {:else}
    <ul class="decision-list">
      {#each decisions as decision (decision.node_id + decision.timestamp)}
        <li class="decision-item">
          <div class="decision-header">
            <span class="decision-node">{decision.node_id}</span>
            <span class="decision-edge">{decision.decision}</span>
            <span class="decision-timestamp">{new Date(decision.timestamp).toLocaleString()}</span>
          </div>
          {#if decision.selected.length > 0}
            <div class="decision-selected">
              {#each decision.selected as candidateId (candidateId)}
                <span class="decision-candidate">{candidateId}</span>
              {/each}
            </div>
          {/if}
          {#if Object.keys(decision.comments).length > 0}
            <dl class="decision-comments">
              {#each Object.entries(decision.comments) as [candidateId, comment] (candidateId)}
                <div class="decision-comment">
                  <dt>{candidateId}</dt>
                  <dd>{comment}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .loading,
  .error,
  .empty-state {
    font-size: 1rem;
    color: #64748b;
    text-align: center;
    padding: 1.5rem;
  }

  .error {
    color: #dc2626;
  }

  .decision-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .decision-item {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
  }

  .decision-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .decision-node {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #1e293b;
    font-weight: 600;
  }

  .decision-edge {
    display: inline-block;
    padding: 0.0625rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
  }

  .decision-timestamp {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-left: auto;
  }

  .decision-selected {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .decision-candidate {
    font-family: monospace;
    font-size: 0.75rem;
    padding: 0.0625rem 0.5rem;
    border-radius: 4px;
    background: #dcfce7;
    color: #15803d;
  }

  .decision-comments {
    margin: 0.5rem 0 0 0;
  }

  .decision-comment {
    font-size: 0.8125rem;
    color: #475569;
    margin-bottom: 0.25rem;
  }

  .decision-comment dt {
    display: inline;
    font-family: monospace;
    font-weight: 600;
  }

  .decision-comment dt::after {
    content: ': ';
  }

  .decision-comment dd {
    display: inline;
    margin: 0;
  }
</style>
