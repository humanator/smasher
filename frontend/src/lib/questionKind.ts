// ABOUTME: Words what a waiting run needs from a person, for the needs-you banner
// ABOUTME: Maps a questions response to "Pick a favourite" / "Approve or reject" / …, the button label and a mid-sentence phrase

import type { ListQuestionsResponse, Question } from './api/questions';

export interface QuestionKindText {
  text: string;
  action: 'Review Candidates' | 'Answer';
  /** How many candidates a gallery gate has ready; null for other questions. */
  candidates: number | null;
  /** Ends "…waiting for you to {waitingFor}.", e.g. "choose from 3 candidates". */
  waitingFor: string;
}

const KIND_TEXT: Record<Question['kind'], { text: string; waitingFor: string }> = {
  approval: { text: 'Approve or reject', waitingFor: 'approve or reject it' },
  multiple_choice: { text: 'Choose an option', waitingFor: 'choose an option' },
  free_form: { text: 'Answer a question', waitingFor: 'answer a question' },
};

// Words the gallery gate if there is one, otherwise the oldest question.
// Returns null when nothing is waiting.
export function questionKind(response: ListQuestionsResponse): QuestionKindText | null {
  if (response.gallery_gate) {
    const candidates = response.gallery_gate.candidates.length;
    return {
      text: 'Pick a favourite',
      action: 'Review Candidates',
      candidates,
      waitingFor: `choose from ${candidates} candidate${candidates === 1 ? '' : 's'}`,
    };
  }
  const oldest = response.questions[0];
  if (!oldest) return null;
  return { ...KIND_TEXT[oldest.kind], action: 'Answer', candidates: null };
}
