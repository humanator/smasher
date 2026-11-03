<script lang="ts">
  // ABOUTME: Status bar under the canvas: step and connection counts, and the workflow's problems
  // ABOUTME: Review hands the first problem back so the canvas can select it and pan to it

  import { Button } from '$lib/components/ui/button/index.js';
  import type { Problem } from '$lib/workflowProblems';

  let {
    stepCount,
    connectionCount,
    problems,
    onReview,
  }: {
    stepCount: number;
    connectionCount: number;
    problems: Problem[];
    onReview: (problem: Problem) => void;
  } = $props();

  const first = $derived(problems[0]);
  // A workflow-level problem (no Start, no Finish) has no step to quote; its
  // subject is "This workflow" (wording proposed 2026-11-03, not on the board).
  const summary = $derived.by(() => {
    if (problems.length !== 1) return `${problems.length} things to fix.`;
    return first.label !== undefined ? `“${first.label}” ${first.message}.` : `This workflow ${first.message}.`;
  });
  const canReview = $derived(first !== undefined && (first.nodeId !== undefined || first.edgeId !== undefined));
</script>

<footer
  class="flex h-7 flex-none items-center gap-3.5 border-t border-border bg-muted px-3.5 text-caption text-muted-foreground"
  aria-live="polite"
>
  <span>{stepCount} steps · {connectionCount} connections</span>
  <span class="flex-1"></span>
  {#if first}
    <span class="flex items-center gap-1.5 text-foreground">
      <span class="size-1.75 rounded-full bg-warning" aria-hidden="true"></span>
      <span>{summary}</span>
      {#if canReview}
        <Button variant="link" size="xs" onclick={() => onReview(first)}>Review</Button>
      {/if}
    </span>
  {:else}
    <span class="flex items-center gap-1.5 font-medium text-success-foreground">
      <span class="size-1.75 rounded-full bg-success" aria-hidden="true"></span>
      No problems found
    </span>
  {/if}
</footer>
