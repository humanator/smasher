<script lang="ts">
  // ABOUTME: The Recent runs screen: the needs-you or running banner over the filtered, deletable runs table
  // ABOUTME: Reads the library store and puts the run count in the page header's subtitle

  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { usePageSubtitle } from '$lib/page-header.svelte';
  import { libraryStore } from '../../stores/library.svelte';
  import NeedsYouBanner from './NeedsYouBanner.svelte';
  import RunningBanner from './RunningBanner.svelte';
  import RunList from './RunList.svelte';

  interface Library {
    readonly runs: RunSummary[];
    readonly needsYou: RunSummary[];
    readonly workflows: WorkflowSummary[];
    readonly loaded: boolean;
    refresh?: () => Promise<void>;
  }

  let { library = libraryStore }: { library?: Library } = $props();

  usePageSubtitle(() => {
    if (!library.loaded) return null;
    const count = library.runs.length;
    const runs = `${count} run${count === 1 ? '' : 's'}`;
    const waiting = library.needsYou.length;
    // Worded like the Workflows subtitle, where "needs you" is the status's name.
    return waiting > 0 ? `${runs} · ${waiting} needs you` : runs;
  });
</script>

<!-- One banner at a time: a run waiting on you outranks one that's just running. -->
<NeedsYouBanner {library} />
<RunningBanner {library} />

<div class="px-4 pt-5 pb-8 sm:px-6">
  <RunList {library} />
</div>
