<script lang="ts">
  // ABOUTME: The workflow page's banner for its active run: where it paused and what it waits for, or how long it has run
  // ABOUTME: Asks for the featured run's questions only while it needs a person; hidden when nothing is active

  import PlayIcon from '@lucide/svelte/icons/play';
  import UserIcon from '@lucide/svelte/icons/user';
  import { listQuestions, type ListQuestionsResponse } from '$lib/api/questions';
  import type { RunSummary } from '$lib/api/runs';
  import { Button } from '$lib/components/ui/button/index.js';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { questionKind, type QuestionKindText } from '$lib/questionKind';
  import { isActive, isNeedsYou, pickFeaturedRun } from '$lib/runStatus';
  import { formatDuration, formatWhenInline } from '$lib/timeFormat';
  import StatusBadge from './StatusBadge.svelte';

  let {
    runs,
    labels,
    fetchQuestions = listQuestions,
    now = undefined,
    timeZone = undefined,
  }: {
    /** This workflow's runs, newest first. */
    runs: RunSummary[];
    /** Step id → step name, for "Paused at …". */
    labels: ReadonlyMap<string, string>;
    fetchQuestions?: (runId: string) => Promise<ListQuestionsResponse>;
    /** Pins the clock; by default the banner keeps its own, ticking every 30 s. */
    now?: Date;
    /** Defaults to the system time zone. */
    timeZone?: string;
  } = $props();

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);

  const featured = $derived.by(() => {
    const pick = pickFeaturedRun(runs);
    return pick && isActive(pick.run.status) ? pick : null;
  });
  const run = $derived(featured?.run ?? null);
  const needsYou = $derived(run ? isNeedsYou(run) : false);

  // Polls hand over new run objects every few seconds; ask again only when
  // the featured run or its number of questions actually changes.
  const askKey = $derived(run && needsYou ? `${run.id}:${run.pending_questions}` : null);

  let answer = $state<{ key: string; kind: QuestionKindText | null; nodeId: string | null } | null>(null);

  $effect(() => {
    const key = askKey;
    if (!key) return;
    const runId = key.slice(0, key.lastIndexOf(':'));
    let stale = false;
    fetchQuestions(runId).then(
      (response) => {
        if (stale) return;
        // The gallery gate's own question if there is one, else the oldest, as questionKind words it.
        const asked = response.gallery_gate
          ? response.questions.find((q) => q.id === response.gallery_gate!.question_id)
          : response.questions[0];
        answer = { key, kind: questionKind(response), nodeId: asked?.node_id ?? null };
      },
      () => {
        if (!stale) answer = { key, kind: null, nodeId: null };
      }
    );
    return () => {
      stale = true;
    };
  });

  const asked = $derived(answer && answer.key === askKey ? answer : null);
  const when = $derived(run ? formatWhenInline(run.started_at, current, timeZone) : '');
  const pausedAt = $derived(asked?.nodeId ? (labels.get(asked.nodeId) ?? asked.nodeId) : null);
</script>

{#if featured && run}
  <section
    aria-label="Active run"
    class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 sm:px-6 {needsYou
      ? 'border-primary/20 bg-primary-subtle'
      : 'border-border bg-muted'}"
  >
    <span
      class="grid size-7 shrink-0 place-items-center rounded-full text-primary-foreground {needsYou
        ? 'bg-primary'
        : 'bg-info'}"
    >
      {#if needsYou}
        <UserIcon class="size-[15px]" aria-hidden="true" />
      {:else}
        <PlayIcon class="size-[13px]" aria-hidden="true" />
      {/if}
    </span>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <a
          href="/runs/{run.id}"
          class="font-mono text-xs font-semibold text-foreground underline underline-offset-2 hover:no-underline"
        >
          {run.id}
        </a>
        <StatusBadge status={needsYou ? 'Needs you' : run.status} />
      </div>
      <p
        data-testid="active-run-detail"
        class="m-0 mt-px text-xs {needsYou ? 'text-primary-subtle-foreground' : 'text-muted-foreground'}"
      >
        {#if !needsYou}
          Started {when} · {formatDuration(run.started_at, null, current)}
        {:else if !asked?.kind}
          Started {when}.
        {:else if pausedAt}
          Started {when}. Paused at <strong class="font-semibold">{pausedAt}</strong>, waiting for you to {asked.kind
            .waitingFor}.
        {:else}
          Started {when}. Waiting for you to {asked.kind.waitingFor}.
        {/if}
      </p>
      {#if featured.moreRunning > 0}
        <p class="m-0 text-xs text-muted-foreground">+ {featured.moreRunning} more running</p>
      {/if}
    </div>
    {#if needsYou}
      <Button href="/runs/{run.id}" class="max-sm:w-full">{asked?.kind?.action ?? 'Open Run'}</Button>
    {:else}
      <Button href="/runs/{run.id}" variant="outline" class="max-sm:w-full">Open Run</Button>
    {/if}
  </section>
{/if}
