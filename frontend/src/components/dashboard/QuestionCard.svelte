<script lang="ts">
  // ABOUTME: Human-gate Q&A form - answers pending questions via API
  // ABOUTME: Critical for Phase 3 E2E critical path

  import { onMount } from 'svelte';
  import { questionStore } from '../../stores/questions.svelte';
  import * as questionsApi from '../../lib/api/questions';

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

<div class="questions">
  {#if questionStore.pending.length > 0}
    <h3>Pending Questions</h3>
    {#each questionStore.pending as question (question.id)}
      <div class="question-card">
        <p class="question-text">{question.question}</p>

        {#if question.kind === 'free_form'}
          <div class="answer-form">
            <input
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
          <div class="button-group">
            <button onclick={() => handleAnswer(question.id, 'yes')} class="btn btn-success">
              Yes
            </button>
            <button onclick={() => handleAnswer(question.id, 'no')} class="btn btn-danger">
              No
            </button>
          </div>
        {:else if question.kind === 'multiple_choice'}
          <div class="choices">
            {#each question.choices as choice}
              <button onclick={() => handleAnswer(question.id, choice)} class="btn btn-secondary">
                {choice}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}

  {#if questionStore.answered.length > 0}
    <h3>Answered Questions</h3>
    {#each questionStore.answered as question (question.id)}
      <div class="answered-card">
        <p class="question-text">{question.question}</p>
        <p class="answer-text">Answer: {question.answer}</p>
      </div>
    {/each}
  {/if}
</div>

<style>
  .questions {
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
    font-size: 1rem;
  }

  .question-card {
    background: #f0f9ff;
    border-left: 4px solid #0284c7;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
  }

  .question-text {
    margin: 0 0 1rem 0;
    color: #1e293b;
    font-weight: 500;
  }

  .answer-form input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .button-group,
  .choices {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .btn-success {
    background-color: #16a34a;
    color: white;
  }

  .btn-success:hover {
    background-color: #15803d;
  }

  .btn-danger {
    background-color: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background-color: #b91c1c;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }

  .answered-card {
    background: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
  }

  .answer-text {
    margin: 0.5rem 0 0 0;
    color: #15803d;
    font-style: italic;
  }
</style>
