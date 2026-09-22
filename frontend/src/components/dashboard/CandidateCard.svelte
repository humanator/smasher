<script lang="ts">
  // ABOUTME: A single candidate's live-embed card (screenshot/bundle preview + scorecard badges)
  // ABOUTME: Mirrors _candidate_card.html's live_card/failed_card macros

  import type { CandidateResponse } from '../../lib/api/runs';
  import ScorecardBadges, { type Scorecard } from './ScorecardBadges.svelte';

  let { candidate }: { candidate: CandidateResponse } = $props();

  interface ExitStatus {
    status: 'success' | 'failed';
    reason?: string;
  }

  const exitStatus = $derived(candidate.manifest?.exit_status as ExitStatus | undefined);
  const failed = $derived(exitStatus?.status === 'failed');
  const capturedAt = $derived(candidate.manifest?.captured_at as string | undefined);
  const scorecard = $derived((candidate.scorecard ?? {}) as Scorecard);
</script>

{#if failed}
  <div class="candidate-card candidate-card-failed">
    <div class="candidate-id">{candidate.candidate_id}</div>
    {#if exitStatus?.reason}
      <p class="candidate-failure-reason">{exitStatus.reason}</p>
    {/if}
  </div>
{:else}
  <div class="candidate-card">
    <div class="candidate-embed">
      {#if candidate.bundle_url}
        <iframe
          src={candidate.bundle_url}
          title="Candidate {candidate.candidate_id}"
          sandbox="allow-scripts"
          class="candidate-thumbnail"
        ></iframe>
      {:else}
        <img
          src={candidate.screenshot_url}
          alt="Candidate {candidate.candidate_id}"
          class="candidate-thumbnail"
        />
      {/if}
    </div>

    <div class="candidate-id">{candidate.candidate_id}</div>
    {#if capturedAt}
      <div class="candidate-captured-at">{capturedAt}</div>
    {/if}

    <ScorecardBadges {scorecard} />
  </div>
{/if}

<style>
  .candidate-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .candidate-card-failed {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .candidate-embed {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 4px;
    background: #f1f5f9;
  }

  .candidate-thumbnail {
    width: 100%;
    height: 100%;
    border: none;
    object-fit: cover;
  }

  .candidate-id {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #1e293b;
  }

  .candidate-captured-at {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .candidate-failure-reason {
    color: #b91c1c;
    font-size: 0.875rem;
  }
</style>
