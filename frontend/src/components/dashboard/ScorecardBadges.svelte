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

  import { Badge } from '$lib/components/ui/badge/index.js';

  let { scorecard }: { scorecard: Scorecard } = $props();

  const lintChecks = $derived(scorecard.lint?.checks ?? []);
  const lintPassed = $derived(lintChecks.length > 0 ? lintChecks.every((c) => c.passed) : null);
  const lintViolations = $derived(lintChecks.flatMap((c) => c.violations));
  const criticSuccess = $derived(scorecard.critic?.success ?? null);
  const criticFriction = $derived(scorecard.critic?.friction ?? []);
  const synthesisLabel = $derived(scorecard.synthesis?.recommendation ?? null);
  const synthesisReasons = $derived(scorecard.synthesis?.reasons ?? []);
</script>

<!-- Pass/fail colors carry semantic meaning, so they stay as explicit hues. -->
<div class="scorecard flex flex-wrap gap-1.5">
  {#if lintPassed !== null}
    <Badge
      class="scorecard-badge rounded font-semibold {lintPassed
        ? 'scorecard-badge-pass bg-green-100 text-green-700'
        : 'scorecard-badge-fail bg-red-100 text-red-700'}"
    >
      lint: {lintPassed ? 'pass' : 'fail'}
    </Badge>
    {#each lintViolations as violation (violation)}
      <span class="scorecard-violation w-full text-xs text-muted-foreground">{violation}</span>
    {/each}
  {/if}

  {#if criticSuccess !== null}
    <Badge
      class="scorecard-badge rounded font-semibold {criticSuccess
        ? 'scorecard-badge-pass bg-green-100 text-green-700'
        : 'scorecard-badge-fail bg-red-100 text-red-700'}"
    >
      critic: {criticSuccess ? 'success' : 'friction'}
    </Badge>
    {#each criticFriction as friction (friction)}
      <span class="scorecard-violation w-full text-xs text-muted-foreground">{friction}</span>
    {/each}
  {/if}

  {#if synthesisLabel}
    <Badge
      variant="secondary"
      class="scorecard-recommendation scorecard-recommendation-{synthesisLabel} rounded font-semibold"
    >
      synthesis: {synthesisLabel}
    </Badge>
    {#each synthesisReasons as reason (reason)}
      <span class="scorecard-reason w-full text-xs text-muted-foreground">{reason}</span>
    {/each}
  {/if}
</div>
