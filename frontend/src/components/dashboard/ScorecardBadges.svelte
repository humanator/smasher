<script lang="ts">
  // ABOUTME: Lint/critic/synthesis scorecard badges for a candidate
  // ABOUTME: Used by the run page's Candidates

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
  const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
  const lintViolations = $derived(lintChecks.flatMap((c) => c.violations));
  const criticSuccess = $derived(scorecard.critic?.success ?? null);
  const criticFriction = $derived(scorecard.critic?.friction ?? []);
  const synthesisLabel = $derived(scorecard.synthesis?.recommendation ?? null);
  const synthesisDot = $derived(
    synthesisLabel === 'proceed' ? 'var(--info)' : synthesisLabel === 'iterate' ? 'var(--warning)' : 'var(--muted-foreground)'
  );
  // The engine says "proceed"; the person reads "Advance".
  const synthesisText = $derived(
    synthesisLabel === 'proceed' ? 'Advance' : synthesisLabel ? synthesisLabel.charAt(0).toUpperCase() + synthesisLabel.slice(1) : ''
  );
  const synthesisReasons = $derived(scorecard.synthesis?.reasons ?? []);
</script>

<!-- Plain-language rows, one per line; the engine's own name is the tooltip. -->
<div class="scorecard flex flex-col gap-1.5">
  {#if lintPassed !== null}
    <div>
      <span title="Shown as “lint” in the workflow engine" class="inline-flex">
        <Badge variant="secondary" dot={lintPassed ? 'var(--success)' : 'var(--destructive)'}>
          Design-system check: {lintPassed ? 'Passed' : lintViolations.length > 0 ? plural(lintViolations.length, 'issue') : 'Failed'}
        </Badge>
      </span>
    </div>
    {#each lintViolations as violation (violation)}
      <span class="scorecard-violation text-small text-muted-foreground">{violation}</span>
    {/each}
  {/if}

  {#if criticSuccess !== null}
    <div>
      <span title="Shown as “critic” in the workflow engine" class="inline-flex">
        <Badge variant="secondary" dot={criticSuccess ? 'var(--success)' : 'var(--warning)'}>
          Usability: {criticSuccess
            ? 'No friction found'
            : criticFriction.length > 0
              ? plural(criticFriction.length, 'friction point')
              : 'Friction found'}
        </Badge>
      </span>
    </div>
    {#each criticFriction as friction (friction)}
      <span class="scorecard-violation text-small text-muted-foreground">{friction}</span>
    {/each}
  {/if}

  {#if synthesisLabel}
    <div>
      <span title="Shown as “synthesis” in the workflow engine" class="inline-flex">
        <Badge variant="secondary" dot={synthesisDot}>
          Recommendation: {synthesisText}
        </Badge>
      </span>
    </div>
    {#each synthesisReasons as reason (reason)}
      <span class="scorecard-reason text-small text-muted-foreground">{reason}</span>
    {/each}
  {/if}
</div>
