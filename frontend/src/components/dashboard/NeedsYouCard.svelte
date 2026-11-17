<script lang="ts">
  // ABOUTME: One waiting run on the Needs you screen: a card per pending question, answered in place
  // ABOUTME: Fetches the run's questions; a gallery gate gets a Review candidates link to the run instead of answer controls

  import { untrack } from 'svelte';
  import { answerQuestion, listQuestions, type ListQuestionsResponse, type Question } from '$lib/api/questions';
  import type { RunSummary } from '$lib/api/runs';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { Button } from '$lib/components/ui/button/index.js';
  import { errorMessage, notifyError } from '$lib/notify';
  import { runTitle } from '$lib/runStatus';
  import { formatWaiting } from '$lib/timeFormat';
  import QuestionAnswer from '../run/QuestionAnswer.svelte';

  let {
    run,
    workflows,
    now,
    onanswered,
  }: {
    run: RunSummary;
    workflows: readonly WorkflowSummary[];
    now: Date;
    /** Called after an answer is accepted, so the page can refresh what's waiting. */
    onanswered?: () => void;
  } = $props();

  type Item =
    | { kind: 'question'; id: string; question: Question }
    | { kind: 'gallery'; id: string; text: string; candidates: number | null };

  // Polls hand over new run objects every few seconds; ask again only when
  // what the run waits on changes (a new question has a new waiting_since).
  const askKey = $derived(`${run.pending_questions}:${run.waiting_since ?? ''}`);
  let attempt = $state(0);
  let fetched = $state<{ response: ListQuestionsResponse | null; error: string | null } | null>(null);
  let answered = $state<string[]>([]);

  $effect(() => {
    void askKey;
    void attempt;
    const runId = untrack(() => run.id);
    let stale = false;
    listQuestions(runId).then(
      (response) => {
        if (!stale) fetched = { response, error: null };
      },
      (err) => {
        if (!stale) fetched = { response: null, error: errorMessage(err, 'Failed to load questions') };
      }
    );
    return () => {
      stale = true;
    };
  });

  // A gate's question is a gallery pick when the server sends its candidates,
  // or, before any are ready, when the question belongs to one of the run's gallery gates.
  const items = $derived.by((): Item[] => {
    const response = fetched?.response;
    if (!response) return [];
    const result: Item[] = [];
    if (response.gallery_gate) {
      result.push({
        kind: 'gallery',
        id: response.gallery_gate.question_id,
        text: 'Pick a favourite',
        candidates: response.gallery_gate.candidates.length,
      });
    }
    for (const question of response.questions) {
      if (question.node_id && run.gallery_gates.includes(question.node_id)) {
        result.push({ kind: 'gallery', id: question.id, text: question.question, candidates: null });
      } else {
        result.push({ kind: 'question', id: question.id, question });
      }
    }
    return result.filter((item) => !answered.includes(item.id));
  });

  const title = $derived(runTitle(run, workflows));
  const waiting = $derived(formatWaiting(run.waiting_since, now));

  async function answer(questionId: string, value: string): Promise<boolean> {
    try {
      const result = await answerQuestion(run.id, questionId, value);
      // The server reports some rejections (e.g. an unknown question) as a 200.
      if (!result.success) throw new Error(result.error ?? '');
      answered = [...answered, questionId];
      onanswered?.();
      return true;
    } catch (err) {
      // The card stays, with its input, so it can be answered again.
      notifyError(err, 'Failed to answer question');
      return false;
    }
  }
</script>

{#snippet header(openLink: boolean)}
  <div class="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
    <h2 class="m-0 min-w-0 text-body font-semibold text-foreground">{title}</h2>
    <span class="text-xs text-muted-foreground">{waiting}</span>
    {#if openLink}
      <a href="/runs/{run.id}" class="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
        Open run
      </a>
    {/if}
  </div>
{/snippet}

{#if !fetched}
  <article data-run-id={run.id} aria-busy="true" class="rounded-xl border border-border bg-card px-5 py-[18px] text-card-foreground">
    {@render header(true)}
    <p class="m-0 text-body text-muted-foreground">Loading the question…</p>
  </article>
{:else if fetched.error}
  <article data-run-id={run.id} class="rounded-xl border border-border bg-card px-5 py-[18px] text-card-foreground">
    {@render header(true)}
    <div role="alert" class="flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-surface px-3 py-2.5 text-body text-destructive">
      <span class="min-w-0 flex-1">Couldn't load this question: {fetched.error}</span>
      <Button variant="outline" size="sm" onclick={() => attempt++}>Try Again</Button>
    </div>
  </article>
{:else}
  {#each items as item (item.id)}
    <article data-run-id={run.id} class="rounded-xl border border-border bg-card px-5 py-[18px] text-card-foreground">
      {#if item.kind === 'question'}
        {@render header(true)}
        <QuestionAnswer question={item.question} onanswer={(value) => answer(item.id, value)} />
      {:else}
        {@render header(false)}
        <p class="m-0 text-body font-medium text-foreground">{item.text}</p>
        {#if item.candidates !== null}
          <p class="m-0 mt-0.5 text-xs text-muted-foreground">
            {item.candidates} candidate{item.candidates === 1 ? '' : 's'} ready
          </p>
        {/if}
        <Button href="/runs/{run.id}" class="mt-4">Review candidates</Button>
      {/if}
    </article>
  {/each}
{/if}
