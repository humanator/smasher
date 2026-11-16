<script lang="ts">
  // ABOUTME: The dashboard's Recent runs: a filter with live counts over the library's runs, then the runs table
  // ABOUTME: The filter follows ?runs= (replaceState, back/forward); ?runs=needs-you shows Active with waiting runs first

  import { onMount } from 'svelte';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import { parseRunFilter, runFilterHref, type RunFilter } from '$lib/runFilter';
  import { isNeedsYou, runGroup } from '$lib/runStatus';
  import { libraryStore } from '../../stores/library.svelte';
  import RunTable from './RunTable.svelte';

  interface Library {
    readonly runs: RunSummary[];
    readonly workflows: WorkflowSummary[];
    readonly loaded: boolean;
  }

  let { library = libraryStore }: { library?: Library } = $props();

  const FILTERS: { value: RunFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed or stopped' },
  ];

  const initial = parseRunFilter(window.location.search);
  let filter = $state<RunFilter>(initial.filter);
  let needsYouFirst = $state(initial.needsYouFirst);

  const counts = $derived.by(() => {
    const result: Record<RunFilter, number> = { all: library.runs.length, active: 0, completed: 0, failed: 0 };
    for (const run of library.runs) result[runGroup(run.status)]++;
    return result;
  });

  const shown = $derived.by(() => {
    const runs = filter === 'all' ? library.runs : library.runs.filter((r) => runGroup(r.status) === filter);
    // A stable sort keeps newest-first within each half.
    return needsYouFirst ? [...runs].sort((a, b) => Number(isNeedsYou(b)) - Number(isNeedsYou(a))) : runs;
  });

  function choose(value: string) {
    // Clicking the selected item would clear a single toggle group; keep it selected instead.
    if (!value) return;
    filter = value as RunFilter;
    needsYouFirst = false;
    window.history.replaceState(window.history.state, '', runFilterHref(filter) + window.location.hash);
  }

  onMount(() => {
    const follow = () => {
      ({ filter, needsYouFirst } = parseRunFilter(window.location.search));
    };
    window.addEventListener('popstate', follow);
    return () => window.removeEventListener('popstate', follow);
  });
</script>

<section id="runs" aria-labelledby="runs-heading" class="scroll-mt-4">
  <div class="mb-0.5 flex flex-wrap items-center gap-x-3 gap-y-2">
    <h2 id="runs-heading" class="m-0 text-heading font-bold text-foreground">Recent runs</h2>
    <div class="ml-auto max-w-full overflow-x-auto">
      <ToggleGroup.Root type="single" variant="default" aria-label="Show runs" bind:value={() => filter, choose}>
        {#each FILTERS as option (option.value)}
          <ToggleGroup.Item value={option.value}>
            {option.label}
            <span class="text-muted-foreground tabular-nums">{counts[option.value]}</span>
          </ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
    </div>
  </div>
  <p class="mt-0.5 mb-2.5 text-xs text-muted-foreground">
    Every time a workflow runs, it shows up here. “Needs you” means the run is paused and waiting for an answer.
  </p>

  {#if !library.loaded}
    <p class="m-0 rounded-lg border border-border px-3 py-4 text-body text-muted-foreground">Loading runs…</p>
  {:else if library.runs.length === 0}
    <p class="m-0 rounded-lg border border-border px-3 py-4 text-body text-muted-foreground">
      No runs yet. Run a workflow to see it here.
    </p>
  {:else if shown.length === 0}
    <p class="m-0 rounded-lg border border-border px-3 py-4 text-body text-muted-foreground">No runs in this view.</p>
  {:else}
    <RunTable runs={shown} workflows={library.workflows} />
  {/if}
</section>
