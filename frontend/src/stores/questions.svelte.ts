// ABOUTME: Svelte 5 rune-based store for pending human-gate questions
// ABOUTME: Tracks unanswered and answered questions, updated via polling

export interface Question {
  id: string;
  question: string;
  choices: string[];
  kind: 'free_form' | 'multiple_choice' | 'approval';
  node_id: string;
}

export interface AnsweredQuestion extends Question {
  answer: string;
  answeredAt: string;
}

function createQuestionStore() {
  let pending = $state<Question[]>([]);
  let answered = $state<AnsweredQuestion[]>([]);

  return {
    get pending() {
      return pending;
    },

    get answered() {
      return answered;
    },

    get all() {
      return [...pending, ...answered];
    },

    setPending(questions: Question[]) {
      pending = questions;
    },

    answer(questionId: string, answer: string) {
      const q = pending.find((q) => q.id === questionId);
      if (!q) return;

      pending = pending.filter((q) => q.id !== questionId);
      answered = [
        ...answered,
        {
          ...q,
          answer,
          answeredAt: new Date().toISOString(),
        },
      ];
    },

    clear() {
      pending = [];
      answered = [];
    },

    reset() {
      this.clear();
    },
  };
}

export const questionStore = createQuestionStore();
