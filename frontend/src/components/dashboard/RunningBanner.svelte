<script lang="ts">
  // ABOUTME: The dashboard's "is running" banner for the newest active run, when nothing is waiting on a person
  // ABOUTME: Says when it started and how long it has run, and links to it and to the other active runs

  import PlayIcon from '@lucide/svelte/icons/play';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { isActive, latestRunning, runTitle } from '$lib/runStatus';
  import { formatDuration, formatWhen } from '$lib/timeFormat';
  import { libraryStore } from '../../stores/library.svelte';

  interface Library {
    readonly runs: RunSummary[];
    readonly needsYou: RunSummary[];
    readonly workflows: WorkflowSummary[];
  }

  let {
    library = libraryStore,
    now = undefined,
    timeZone = undefined,
  }: {
    library?: Library;
    /** Pins the clock; by default the banner keeps its own, ticking every 30 s. */
    now?: Date;
    /** Defaults to the system time zone. */
    timeZone?: string;
  } = $props();

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);

  // A run that needs you is running too, and its own banner says more, so this one steps aside.
  const featured = $derived(library.needsYou.length > 0 ? null : latestRunning(library.runs));
  const others = $derived(library.runs.filter((r) => isActive(r.status)).length - 1);

  const detail = $derived.by(() => {
    if (!featured) return '';
    // "Today, 1:31 pm" reads "today, 1:31 pm" mid-sentence; day names stay capitalised.
    const when = formatWhen(featured.started_at, current, timeZone).replace(/^(Today|Yesterday)/, (d) =>
      d.toLowerCase()
    );
    return `Started ${when} · ${formatDuration(featured.started_at, null, current)}`;
  });
</script>

{#if featured}
  <section
    aria-label="Running now"
    class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-muted px-4 py-2.5 sm:px-5"
  >
    <span class="grid size-7 shrink-0 place-items-center rounded-full bg-info text-primary-foreground">
      <PlayIcon class="size-[13px]" aria-hidden="true" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="m-0 text-body font-semibold text-foreground">
        {runTitle(featured, library.workflows)} is running
      </p>
      <p class="m-0 text-xs text-muted-foreground">
        <span>{detail}</span>
        {#if others > 0}
          <a href="/?runs=active#runs" class="ml-1.5 underline underline-offset-2 hover:no-underline">
            + {others} more running
          </a>
        {/if}
      </p>
    </div>
    <Button variant="outline" href="/runs/{featured.id}">Open Run</Button>
  </section>
{/if}
