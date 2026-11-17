<script lang="ts">
  // ABOUTME: The Needs you screen: every question a run is waiting on, as a card you can answer right there
  // ABOUTME: Reads the library's waiting runs, longest waiting first; each run's card fetches and answers its own questions

  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { usePageSubtitle } from '$lib/page-header.svelte';
  import { libraryStore } from '../../stores/library.svelte';
  import NeedsYouCard from './NeedsYouCard.svelte';

  interface Library {
    readonly needsYou: RunSummary[];
    readonly workflows: WorkflowSummary[];
    readonly loaded: boolean;
    readonly error: string | null;
    refresh?: () => Promise<void>;
  }

  let {
    library = libraryStore,
    now = undefined,
  }: {
    library?: Library;
    /** Pins the clock; by default the page keeps its own, ticking every 30 s. */
    now?: Date;
  } = $props();

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);

  // Runs without a waiting_since come last.
  const since = (run: RunSummary) => (run.waiting_since ? Date.parse(run.waiting_since) : Infinity);
  const runs = $derived([...library.needsYou].sort((a, b) => since(a) - since(b)));
  const questions = $derived(library.needsYou.reduce((sum, run) => sum + run.pending_questions, 0));

  usePageSubtitle(() =>
    library.loaded && questions > 0 ? `${questions} question${questions === 1 ? '' : 's'} waiting` : null
  );
</script>

<div class="px-4 pt-5 pb-8 sm:px-6">
  {#if !library.loaded && library.error}
    <div role="alert" class="flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive">
      <span class="min-w-0 flex-1">Couldn't load what needs you: {library.error}</span>
      <Button variant="outline" size="sm" onclick={() => void library.refresh?.()}>Try Again</Button>
    </div>
  {:else if !library.loaded}
    <p class="m-0 rounded-lg border border-border px-3 py-4 text-body text-muted-foreground">Loading…</p>
  {:else if runs.length === 0}
    <div class="rounded-lg border border-border px-3 py-6 text-center">
      <p class="m-0 text-body font-medium text-foreground">Nothing needs you right now</p>
      <p class="m-0 mt-1 text-xs text-muted-foreground">When a run stops to ask you something, it shows up here.</p>
    </div>
  {:else}
    <p class="mt-0 mb-2.5 text-xs text-muted-foreground">
      These runs are paused until you answer. Answer here, or open the run to see more.
    </p>
    <div class="flex max-w-3xl flex-col gap-3">
      {#each runs as run (run.id)}
        <NeedsYouCard {run} workflows={library.workflows} now={current} onanswered={() => void library.refresh?.()} />
      {/each}
    </div>
  {/if}
</div>
