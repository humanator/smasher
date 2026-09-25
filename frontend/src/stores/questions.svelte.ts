// ABOUTME: Svelte 5 rune-based store for pending human-gate questions
// ABOUTME: Tracks unanswered questions, updated via polling; answers come from run events

export interface Question {
  id: string;
  question: string;
  choices: string[];
  kind: 'free_form' | 'multiple_choice' | 'approval';
  node_id?: string;
}

function createQuestionStore() {
  let pending = $state<Question[]>([]);

  return {
    get pending() {
      return pending;
    },

    setPending(questions: Question[]) {
      pending = questions;
    },

    // Drops the question straight away; its answered entry arrives with the
    // run's human_response_received event.
    answer(questionId: string) {
      pending = pending.filter((q) => q.id !== questionId);
    },

    clear() {
      pending = [];
    },

    reset() {
      this.clear();
    },
  };
}

export const questionStore = createQuestionStore();
