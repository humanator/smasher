<script lang="ts">
  // ABOUTME: Lint/critic/synthesis scorecard badges for a candidate
  // ABOUTME: Shared between CandidateCard (read-only gallery) and GalleryGate (decision UI)

  interface LintCheck {
    name: string;
    passed: boolean;
    violations: string[];
  }

  export interface Scorecard {
    lint?: { checks: LintCheck[] } | null;
    critic?: { success: boolean; friction: string[] } | null;
    synthesis?: { recommendation: string; reasons: string[] } | null;
  }

  let { scorecard }: { scorecard: Scorecard } = $props();

  const lintChecks = $derived(scorecard.lint?.checks ?? []);
  const lintPassed = $derived(lintChecks.length > 0 ? lintChecks.every((c) => c.passed) : null);
  const lintViolations = $derived(lintChecks.flatMap((c) => c.violations));
  const criticSuccess = $derived(scorecard.critic?.success ?? null);
  const criticFriction = $derived(scorecard.critic?.friction ?? []);
  const synthesisLabel = $derived(scorecard.synthesis?.recommendation ?? null);
  const synthesisReasons = $derived(scorecard.synthesis?.reasons ?? []);
</script>

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

<style>
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
