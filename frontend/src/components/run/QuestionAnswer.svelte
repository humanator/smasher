<script lang="ts">
  // ABOUTME: The answer controls for one human-gate question: choice radios, Yes/No, or a free-text field, each with its question
  // ABOUTME: Presentational; hands the answer to onanswer and keeps the input until it reports success. Shared by the run page and Needs you

  import type { Question } from '$lib/api/questions';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';

  let {
    question,
    textClass = 'text-body font-medium text-foreground',
    onanswer,
  }: {
    question: Question;
    /** Classes for the question's text, e.g. sr-only where something else on the page already says it. */
    textClass?: string;
    /** Sends the answer; resolves true once it is accepted, false to keep the input as typed. */
    onanswer: (answer: string) => Promise<boolean>;
  } = $props();

  let text = $state('');
  let choice = $state<string | null>(null);
  let submitting = $state(false);

  async function answer(value: string) {
    if (!value.trim() || submitting) return;
    submitting = true;
    try {
      if (await onanswer(value)) {
        text = '';
        choice = null;
      }
    } finally {
      submitting = false;
    }
  }
</script>

<!-- Multiple choice shows the question as its fieldset's legend instead. -->
{#if question.kind !== 'multiple_choice'}
  <p id="question-text-{question.id}" class="question-text mb-4 {textClass}">{question.question}</p>
{/if}

{#if question.kind === 'free_form'}
  <!-- A form, so Enter in the input submits too. -->
  <form
    class="answer-form flex gap-2"
    onsubmit={(e) => {
      e.preventDefault();
      answer(text);
    }}
  >
    <Input
      type="text"
      aria-labelledby="question-text-{question.id}"
      placeholder="Enter your answer"
      bind:value={text}
      disabled={submitting}
    />
    <Button type="submit" disabled={!text.trim() || submitting}>Submit</Button>
  </form>
{:else if question.kind === 'approval'}
  <div class="button-group flex flex-wrap gap-2" role="group" aria-labelledby="question-text-{question.id}">
    <!-- Yes/No colors carry semantic meaning (approve/reject). -->
    <Button onclick={() => answer('yes')} disabled={submitting}>Yes</Button>
    <Button onclick={() => answer('no')} disabled={submitting} variant="destructive">No</Button>
  </div>
{:else if question.kind === 'multiple_choice'}
  <form
    class="choices flex flex-col gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      answer(choice ?? '');
    }}
  >
    <fieldset class="flex flex-col gap-2" disabled={submitting}>
      <legend class="question-text mb-2 {textClass}">
        {question.question}
      </legend>
      {#each question.choices as option (option)}
        <label class="flex items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="choice-{question.id}"
            value={option}
            checked={choice === option}
            onchange={() => (choice = option)}
            class="accent-primary"
          />
          {option}
        </label>
      {/each}
    </fieldset>
    <Button type="submit" class="self-start" disabled={!choice || submitting}>Submit</Button>
  </form>
{/if}
