<script lang="ts">
  // ABOUTME: Human-gate Q&A form - answers pending questions via API
  // ABOUTME: Critical for Phase 3 E2E critical path

  import { onMount } from 'svelte';
  import { questionStore } from '../../stores/questions.svelte';
  import * as questionsApi from '../../lib/api/questions';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';

  interface Props {
    runId: string;
  }

  const { runId }: Props = $props();

  let pollInterval: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    // Poll questions every 2 seconds
    pollInterval = setInterval(async () => {
      try {
        const response = await questionsApi.listQuestions(runId);
        questionStore.setPending(response.questions);
      } catch (err) {
        console.error('Failed to poll questions:', err);
      }
    }, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });

  async function handleAnswer(questionId: string, answer: string) {
    try {
      await questionsApi.answerQuestion(runId, questionId, answer);
      questionStore.answer(questionId, answer);
    } catch (err) {
      console.error('Failed to answer question:', err);
    }
  }
</script>

<div class="questions rounded-lg border border-border bg-card p-4 text-card-foreground">
  {#if questionStore.pending.length > 0}
    <h3 class="mb-4 text-base font-semibold text-foreground">Pending Questions</h3>
    {#each questionStore.pending as question (question.id)}
      <div class="question-card mb-4 rounded border-l-4 border-primary bg-primary/5 p-4">
        <p class="question-text mb-4 font-medium text-foreground">{question.question}</p>

        {#if question.kind === 'free_form'}
          <div class="answer-form">
            <Input
              type="text"
              placeholder="Enter your answer"
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleAnswer(question.id, target.value);
                  target.value = '';
                }
              }}
            />
          </div>
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
