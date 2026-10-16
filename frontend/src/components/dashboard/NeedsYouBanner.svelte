<script lang="ts">
  // ABOUTME: The dashboard's "waiting for your decision" banner for the run that has waited on a person longest
  // ABOUTME: Words what it needs from its questions, how long it has waited, and links to it and to the rest

  import UserIcon from '@lucide/svelte/icons/user';
  import { listQuestions, type ListQuestionsResponse } from '$lib/api/questions';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { questionKind, type QuestionKindText } from '$lib/questionKind';
  import { longestWaiting, runTitle } from '$lib/runStatus';
  import { formatWaiting } from '$lib/timeFormat';
  import { libraryStore } from '../../stores/library.svelte';

  interface Library {
    readonly needsYou: RunSummary[];
    readonly workflows: WorkflowSummary[];
  }

  let {
    library = libraryStore,
    fetchQuestions = listQuestions,
    now = undefined,
  }: {
    library?: Library;
    fetchQuestions?: (runId: string) => Promise<ListQuestionsResponse>;
    /** Pins the clock; by default the banner keeps its own, ticking every 30 s. */
    now?: Date;
  } = $props();

  const clock = useNow(30_000);
  const current = $derived(now ?? clock.current);

  const featured = $derived(longestWaiting(library.needsYou));
  const others = $derived(library.needsYou.length - 1);
  // Polls hand over new run objects every few seconds; ask again only when
  // the featured run or its number of questions actually changes.
  const askKey = $derived(featured ? `${featured.id}:${featured.pending_questions}` : null);

  let answer = $state<{ key: string; kind: QuestionKindText | null; failed: boolean } | null>(null);

  $effect(() => {
    const key = askKey;
    if (!key) return;
    const runId = key.slice(0, key.lastIndexOf(':'));
    let stale = false;
    fetchQuestions(runId).then(
      (response) => {
        if (!stale) answer = { key, kind: questionKind(response), failed: false };
      },
      () => {
        if (!stale) answer = { key, kind: null, failed: true };
      }
    );
    return () => {
      stale = true;
    };
  });

  const kind = $derived(answer && answer.key === askKey ? answer.kind : null);

  const detail = $derived.by(() => {
    if (!featured) return '';
    const parts: string[] = [];
    if (kind) {
      parts.push(kind.text);
      if (kind.candidates !== null) {
        parts.push(`${kind.candidates} candidate${kind.candidates === 1 ? '' : 's'} ready`);
      }
    }
    parts.push(formatWaiting(featured.waiting_since, current));
    return parts.join(' · ');
  });
</script>

{#if featured}
  <section
    aria-label="Waiting for you"
    class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-primary/20 bg-primary-subtle px-4 py-2.5 sm:px-5"
  >
    <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
      <UserIcon class="size-[15px]" aria-hidden="true" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="m-0 text-[13px] font-semibold text-foreground">
        {runTitle(featured, library.workflows)} is waiting for your decision
      </p>
      <p class="m-0 text-xs text-primary-subtle-foreground">
        <span>{detail}</span>
        {#if others > 0}
          <a href="/?runs=needs-you#runs" class="ml-1.5 underline underline-offset-2 hover:no-underline">
            + {others} more waiting
          </a>
        {/if}
      </p>
    </div>
    <Button href="/runs/{featured.id}">{kind?.action ?? 'Open Run'}</Button>
  </section>
{/if}
