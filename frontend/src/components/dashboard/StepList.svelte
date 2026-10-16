<script lang="ts">
  // ABOUTME: Step list for a workflow - numbered rows with kind chip, label and plain-language kind
  // ABOUTME: Kind label, icon and colours come from stepKinds so every screen names steps the same way

  import type { EditorNode } from '$lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { stepKind } from '$lib/stepKinds';
  import { stepLabel } from '$lib/workflowSteps';

  let {
    steps,
    intro,
    loading = false,
    error = null,
    editHref,
    onRetry,
  }: {
    /** In running order (orderSteps). */
    steps: EditorNode[];
    /** From describeLoops. */
    intro: string;
    loading?: boolean;
    error?: string | null;
    editHref: string;
    onRetry: () => void;
  } = $props();
</script>

<section aria-labelledby="steps-heading" class="min-w-0">
  <h2 id="steps-heading" class="m-0 text-heading font-bold text-foreground">What it does</h2>

  {#if loading}
    <div role="status" aria-label="Loading steps" class="mt-2.5 overflow-hidden rounded-lg border border-border bg-muted">
      {#each [0, 1, 2, 3, 4] as i (i)}
        <div class="flex items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0" aria-hidden="true">
          <span class="w-4"></span>
          <Skeleton class="size-6.5 rounded-md" />
          <span class="flex flex-col gap-1">
            <Skeleton class="h-3.5 w-40 rounded" />
            <Skeleton class="h-3 w-16 rounded" />
          </span>
        </div>
      {/each}
    </div>
  {:else if error}
    <div
      role="alert"
      class="mt-2.5 flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive"
    >
      <span class="min-w-0 flex-1">Couldn't read this workflow's steps. {error}</span>
      <Button variant="outline" size="sm" onclick={onRetry}>Try Again</Button>
    </div>
  {:else if steps.length === 0}
    <div class="mt-2.5 rounded-lg border border-border px-3 py-6 text-center">
      <p class="m-0 text-body text-muted-foreground">This workflow has no steps yet.</p>
      <Button href={editHref} variant="outline" size="sm" class="mt-3">Edit Workflow</Button>
    </div>
  {:else}
    <p class="mt-0.5 mb-2.5 text-xs text-muted-foreground">{intro}</p>
    <ol class="m-0 list-none overflow-hidden rounded-lg border border-border bg-muted p-0">
      {#each steps as step, i (step.id)}
        {@const kind = stepKind(step.node_type)}
        <li class="flex items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0">
          <span class="w-4 shrink-0 text-right text-caption tabular-nums text-muted-foreground">{i + 1}</span>
          <span
            class="step-chip grid size-6.5 shrink-0 place-items-center rounded-md"
            style:--ink={kind.ink}
            style:--tint={kind.tint}
            style:--ink-dark={kind.inkDark}
            style:--tint-dark={kind.tintDark}
          >
            <kind.icon class="size-3.5" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="block text-body font-medium text-foreground">{stepLabel(step)}</span>
            <span class="block text-caption text-muted-foreground">{kind.plain}</span>
          </span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .step-chip {
    background: var(--tint);
    color: var(--ink);
  }
  :global(.dark) .step-chip {
    background: var(--tint-dark);
    color: var(--ink-dark);
  }
</style>
