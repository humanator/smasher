<script lang="ts">
  // ABOUTME: Candidate gallery view for a run - full grid via GET /api/runs/{id}/candidates
  // ABOUTME: Mirrors candidate_gallery.html, plus scorecard badges from the scorecard field

  import { onMount, onDestroy } from 'svelte';
  import * as runsApi from '../../lib/api/runs';
  import type { CandidateResponse } from '../../lib/api/runs';
  import CandidateCard from './CandidateCard.svelte';

  let { runId }: { runId: string } = $props();

  const POLL_INTERVAL_MS = 5000;

  let candidates: CandidateResponse[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let pollHandle: ReturnType<typeof setInterval> | undefined;

  async function refresh() {
    try {
      const response = await runsApi.listCandidates(runId);
      candidates = response.candidates;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load candidates';
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

<div class="candidate-gallery" data-run-id={runId}>
  {#if loading}
    <p class="loading">Loading candidates...</p>
  {:else if error}
    <p class="error" role="alert">Error: {error}</p>
  {:else if candidates.length === 0}
    <p class="empty-state">No candidates yet.</p>
  {:else}
    <div class="candidate-grid">
      {#each candidates as candidate (candidate.candidate_id)}
        <CandidateCard {candidate} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .candidate-gallery {
    padding: 1rem 0;
  }

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

  .candidate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
  }
</style>
