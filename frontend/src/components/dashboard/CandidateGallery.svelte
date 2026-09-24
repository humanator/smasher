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

<div class="candidate-gallery py-4" data-run-id={runId}>
  {#if loading}
    <p class="p-6 text-center text-muted-foreground">Loading candidates...</p>
  {:else if error}
    <p class="p-6 text-center text-destructive" role="alert">Error: {error}</p>
  {:else if candidates.length === 0}
    <p class="p-6 text-center text-muted-foreground">No candidates yet.</p>
  {:else}
    <div class="candidate-grid grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
      {#each candidates as candidate (candidate.candidate_id)}
        <CandidateCard {candidate} />
      {/each}
    </div>
  {/if}
</div>
