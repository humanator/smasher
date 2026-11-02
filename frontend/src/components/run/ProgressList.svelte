<script lang="ts">
  // ABOUTME: The run panel's Progress tab: "N of M steps done" and one row per step with its kind, state and timing
  // ABOUTME: Presentational; RunPage folds the events (stepProgress) and passes steps in running order. Glyphs are decoration, the state is also text

  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import XIcon from '@lucide/svelte/icons/x';
  import { cn } from '$lib/utils';
  import { currentStep, doneCount, stepMeta, type StepProgress, type StepState } from '$lib/runProgress';
  import { stepKind } from '$lib/stepKinds';
  import { stepLabel } from '$lib/workflowSteps';
  import type { GraphNodeSummary } from '../../lib/api/runs';

  let {
    steps,
    progress,
  }: {
    /** In running order. */
    steps: readonly GraphNodeSummary[];
    progress: readonly StepProgress[];
  } = $props();

  // Said aloud before the meta line, because "10s" alone doesn't say a step is done.
  const STATE_WORD: Record<StepState, string> = {
    pending: 'Not started',
    running: 'Running',
    done: 'Done',
    failed: 'Failed',
    waiting: 'Waiting',
  };

  const GLYPH_CLASS: Record<StepState, string> = {
    pending: 'border border-border-strong bg-transparent',
    running: 'bg-primary-subtle text-primary-subtle-foreground',
    done: 'bg-success-subtle text-success',
    failed: 'bg-destructive-subtle text-destructive',
    waiting: 'bg-warning text-warning-foreground',
  };

  function metaLine(nodeType: string, state: StepProgress | undefined): string {
    const meta = state ? stepMeta(state) : 'Not started';
    return nodeType ? `${stepKind(nodeType).plain} · ${meta}` : meta;
  }

  const byId = $derived(new Map(progress.map((p) => [p.id, p])));
  // With no steps from the server the progress itself names the steps.
  const rows = $derived(
    (steps.length > 0 ? steps : progress.map((p) => ({ id: p.id, node_type: '' }))).map((step) => ({
      step,
      state: byId.get(step.id),
    }))
  );
  const current = $derived(currentStep(progress));
</script>

{#if rows.length === 0}
  <p class="m-0 text-body text-muted-foreground">No steps to show yet.</p>
{:else}
  <p class="m-0 mb-3 text-body font-medium text-foreground">{doneCount(progress)} of {progress.length} steps done</p>
  <ol class="m-0 flex list-none flex-col gap-0.5 p-0">
    {#each rows as { step, state } (step.id)}
      {@const s = state?.state ?? 'pending'}
      <li
        aria-current={step.id === current ? 'step' : undefined}
        class={cn('flex items-start gap-2.5 rounded-lg px-2 py-1.5', step.id === current && 'bg-secondary')}
      >
        <span
          data-testid="step-glyph"
          aria-hidden="true"
          class={cn('mt-px grid size-[18px] shrink-0 place-items-center rounded-full', GLYPH_CLASS[s])}
        >
          {#if s === 'done'}
            <CheckIcon class="size-3" stroke-width={3} />
          {:else if s === 'failed'}
            <XIcon class="size-3" stroke-width={3} />
          {:else if s === 'waiting'}
            <CircleHelpIcon class="size-3" stroke-width={3} />
          {:else if s === 'running'}
            <LoaderIcon class="size-3 motion-safe:animate-spin" stroke-width={3} />
          {/if}
        </span>
        <span class="flex min-w-0 flex-col">
          <span data-testid="step-label" class="text-body font-medium break-words text-foreground">{stepLabel(step)}</span>
          <span class="text-caption text-muted-foreground">
            <span class="sr-only">{STATE_WORD[s]}. </span>
            {metaLine(step.node_type, state)}
          </span>
        </span>
      </li>
    {/each}
  </ol>
{/if}
