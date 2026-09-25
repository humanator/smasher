<script lang="ts">
  // ABOUTME: Human-gate Q&A form - answers pending questions via API
  // ABOUTME: Critical for Phase 3 E2E critical path

  import { questionStore } from '../../stores/questions.svelte';
  import * as questionsApi from '../../lib/api/questions';
  import { notifyError, pollFailureNotifier } from '$lib/notify';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  interface Props {
    runId: string;
  }

  const { runId }: Props = $props();

  const KIND_LABELS: Record<questionsApi.Question['kind'], string> = {
    free_form: 'Free Form',
    multiple_choice: 'Multiple Choice',
    approval: 'Approval',
  };

  // Per-card UI state, keyed by question id. Cards read through card(), which
  // falls back to EMPTY, so rendering never has to create an entry.
  interface CardState {
    text: string;
    choice: string | null;
    submitting: boolean;
  }
  const EMPTY: CardState = { text: '', choice: null, submitting: false };
  let cards = $state<Record<string, CardState>>({});

  function card(id: string): CardState {
    return cards[id] ?? EMPTY;
  }

  function update(id: string, patch: Partial<CardState>) {
    cards[id] = { ...card(id), ...patch };
  }

  // Set by each successful fetch; the empty state waits for the first one and
  // stays hidden while a gallery gate card covers the pending question.
  let loaded = $state(false);
  let galleryGateShowing = $state(false);

  // Per run: start from an empty store, fetch now, then every 2s. The store is
  // a singleton, so it's reset again on cleanup so answers don't leak to the next run.
  $effect(() => {
    const id = runId;
    questionStore.reset();
    cards = {};
    loaded = false;
    galleryGateShowing = false;
    const pollFailure = pollFailureNotifier(`questions-poll:${id}`, 'Failed to load questions');
    let stopped = false;

    async function poll() {
      try {
        const response = await questionsApi.listQuestions(id);
        if (stopped) return;
        questionStore.setPending(response.questions);
        galleryGateShowing = response.gallery_gate !== null;
        loaded = true;
        pollFailure.ok();
      } catch (err) {
        if (!stopped) pollFailure.fail(err);
      }
    }

    poll();
    const pollInterval = setInterval(poll, 2000);
    return () => {
      stopped = true;
      clearInterval(pollInterval);
      questionStore.reset();
    };
  });

  async function handleAnswer(questionId: string, answer: string) {
    if (!answer.trim() || card(questionId).submitting) return;
    update(questionId, { submitting: true });
    try {
      const result = await questionsApi.answerQuestion(runId, questionId, answer);
      // The server reports some rejections (e.g. an unknown question) as a 200.
      if (!result.success) throw new Error(result.error ?? '');
      questionStore.answer(questionId, answer);
      update(questionId, { text: '', choice: null });
    } catch (err) {
      // The question stays pending, with its text, so it can be answered again.
      notifyError(err, 'Failed to answer question');
    } finally {
      update(questionId, { submitting: false });
    }
  }
</script>

{#if questionStore.pending.length > 0 || questionStore.answered.length > 0 || (loaded && !galleryGateShowing)}
  <div class="questions rounded-lg border border-border bg-card p-4 text-card-foreground">
    {#if questionStore.pending.length > 0}
      <h3 class="mb-4 text-base font-semibold text-foreground">Pending Questions</h3>
      {#each questionStore.pending as question (question.id)}
        <div class="question-card mb-4 rounded border-l-4 border-primary bg-primary/5 p-4">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" class="uppercase">{KIND_LABELS[question.kind]}</Badge>
            <span class="font-mono text-xs text-muted-foreground break-all">{question.id}</span>
          </div>
          <p class="question-text mb-4 font-medium text-foreground">{question.question}</p>

          {#if question.kind === 'free_form'}
            <!-- A form, so Enter in the input submits too. -->
            <form
              class="answer-form flex gap-2"
              onsubmit={(e) => {
                e.preventDefault();
                handleAnswer(question.id, card(question.id).text);
              }}
            >
              <Input
                type="text"
                placeholder="Enter your answer"
                bind:value={() => card(question.id).text, (text) => update(question.id, { text })}
                disabled={card(question.id).submitting}
              />
              <Button
                type="submit"
                disabled={!card(question.id).text.trim() || card(question.id).submitting}
              >
                Submit
              </Button>
            </form>
          {:else if question.kind === 'approval'}
            <div class="button-group flex flex-wrap gap-2">
              <!-- Yes/No colors carry semantic meaning (approve/reject). -->
              <Button
                onclick={() => handleAnswer(question.id, 'yes')}
                class="bg-green-600 text-white hover:bg-green-700"
              >
                Yes
              </Button>
              <Button
                onclick={() => handleAnswer(question.id, 'no')}
                class="bg-destructive text-white hover:bg-destructive/90"
              >
                No
              </Button>
            </div>
          {:else if question.kind === 'multiple_choice'}
            <div class="choices flex flex-wrap gap-2">
              {#each question.choices as choice}
                <Button onclick={() => handleAnswer(question.id, choice)} variant="secondary">
                  {choice}
                </Button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {:else if loaded && !galleryGateShowing}
      <p class="p-4 text-center text-muted-foreground">No pending questions.</p>
    {/if}

    {#if questionStore.answered.length > 0}
      <h3 class="mb-4 text-base font-semibold text-foreground">Answered Questions</h3>
      {#each questionStore.answered as question (question.id)}
        <div class="answered-card mb-4 rounded border-l-4 border-green-600 bg-green-50 p-4">
          <p class="question-text mb-4 font-medium text-foreground">{question.question}</p>
          <p class="answer-text mt-2 italic text-green-700">Answer: {question.answer}</p>
        </div>
      {/each}
    {/if}
  </div>
{/if}
