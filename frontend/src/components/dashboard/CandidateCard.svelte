<script lang="ts">
  // ABOUTME: A single candidate's card (screenshot thumbnail + lightbox, params, scorecard badges)
  // ABOUTME: Mirrors _candidate_card.html's live_card/failed_card macros

  import type { CandidateResponse } from '../../lib/api/runs';
  import ScorecardBadges, { type Scorecard } from './ScorecardBadges.svelte';
  import CandidatePreview from './CandidatePreview.svelte';
  import CandidateParams from './CandidateParams.svelte';
  import * as Card from '$lib/components/ui/card/index.js';

  let { candidate }: { candidate: CandidateResponse } = $props();

  interface ExitStatus {
    status: 'success' | 'failed';
    reason?: string;
  }

  const exitStatus = $derived(candidate.manifest?.exit_status as ExitStatus | undefined);
  const failed = $derived(exitStatus?.status === 'failed');
  const capturedAt = $derived(candidate.manifest?.captured_at as string | undefined);
  const scorecard = $derived((candidate.scorecard ?? {}) as Scorecard);
  const generationParams = $derived(
    candidate.manifest?.generation_params as Record<string, string> | undefined
  );
</script>

{#if failed}
  <Card.Root
    size="sm"
    class="candidate-card candidate-card-failed gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 shadow-none ring-0"
  >
    <div class="candidate-id font-mono text-xs text-foreground">{candidate.candidate_id}</div>
    {#if capturedAt}
      <div class="candidate-captured-at text-xs text-muted-foreground">{capturedAt}</div>
    {/if}
    {#if exitStatus?.reason}
      <p class="candidate-failure-reason text-sm text-destructive">{exitStatus.reason}</p>
    {/if}
  </Card.Root>
{:else}
  <Card.Root
    size="sm"
    class="candidate-card gap-2 rounded-lg border border-border p-4 shadow-none ring-0"
  >
    <CandidatePreview {candidate} />

    <div class="candidate-id font-mono text-xs text-foreground">{candidate.candidate_id}</div>
    {#if capturedAt}
      <div class="candidate-captured-at text-xs text-muted-foreground">{capturedAt}</div>
    {/if}
    <CandidateParams params={generationParams} />

    <ScorecardBadges {scorecard} />
  </Card.Root>
{/if}
