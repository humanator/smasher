<script lang="ts">
  // ABOUTME: A single candidate's live-embed card (screenshot/bundle preview + scorecard badges)
  // ABOUTME: Mirrors _candidate_card.html's live_card/failed_card macros

  import type { CandidateResponse } from '../../lib/api/runs';

  let { candidate }: { candidate: CandidateResponse } = $props();

  interface ExitStatus {
    status: 'success' | 'failed';
    reason?: string;
  }

  interface LintCheck {
    name: string;
    passed: boolean;
    violations: string[];
  }

  interface Scorecard {
    lint?: { checks: LintCheck[] } | null;
    critic?: { success: boolean; friction: string[] } | null;
    synthesis?: { recommendation: string; reasons: string[] } | null;
  }

  const exitStatus = $derived(candidate.manifest?.exit_status as ExitStatus | undefined);
  const failed = $derived(exitStatus?.status === 'failed');
  const capturedAt = $derived(candidate.manifest?.captured_at as string | undefined);

  const scorecard = $derived((candidate.scorecard ?? {}) as Scorecard);
  const lintChecks = $derived(scorecard.lint?.checks ?? []);
  const lintPassed = $derived(lintChecks.length > 0 ? lintChecks.every((c) => c.passed) : null);
  const lintViolations = $derived(lintChecks.flatMap((c) => c.violations));
  const criticSuccess = $derived(scorecard.critic?.success ?? null);
  const criticFriction = $derived(scorecard.critic?.friction ?? []);
  const synthesisLabel = $derived(scorecard.synthesis?.recommendation ?? null);
  const synthesisReasons = $derived(scorecard.synthesis?.reasons ?? []);
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

    <div class="scorecard">
      {#if lintPassed !== null}
        <span class="scorecard-badge {lintPassed ? 'scorecard-badge-pass' : 'scorecard-badge-fail'}">
          lint: {lintPassed ? 'pass' : 'fail'}
        </span>
        {#each lintViolations as violation (violation)}
          <span class="scorecard-violation">{violation}</span>
        {/each}
      {/if}

      {#if criticSuccess !== null}
        <span class="scorecard-badge {criticSuccess ? 'scorecard-badge-pass' : 'scorecard-badge-fail'}">
          critic: {criticSuccess ? 'success' : 'friction'}
        </span>
        {#each criticFriction as friction (friction)}
          <span class="scorecard-violation">{friction}</span>
        {/each}
      {/if}

      {#if synthesisLabel}
        <span class="scorecard-recommendation scorecard-recommendation-{synthesisLabel}">
          synthesis: {synthesisLabel}
        </span>
        {#each synthesisReasons as reason (reason)}
          <span class="scorecard-reason">{reason}</span>
        {/each}
      {/if}
    </div>
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

  .scorecard {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .scorecard-badge {
    display: inline-block;
    padding: 0.0625rem 0.5rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .scorecard-badge-pass {
    background: #dcfce7;
    color: #15803d;
  }

  .scorecard-badge-fail {
    background: #fee2e2;
    color: #b91c1c;
  }

  .scorecard-recommendation {
    display: inline-block;
    padding: 0.0625rem 0.5rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
  }

  .scorecard-violation,
  .scorecard-reason {
    font-size: 0.6875rem;
    color: #64748b;
    width: 100%;
  }
</style>
