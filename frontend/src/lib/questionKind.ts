// ABOUTME: Words what a waiting run needs from a person, for the needs-you banner
// ABOUTME: Maps a questions response to "Pick a favourite" / "Approve or reject" / … plus the button label

import type { ListQuestionsResponse, Question } from './api/questions';

export interface QuestionKindText {
  text: string;
  action: 'Review Candidates' | 'Answer';
  /** How many candidates a gallery gate has ready; null for other questions. */
  candidates: number | null;
}

const KIND_TEXT: Record<Question['kind'], string> = {
  approval: 'Approve or reject',
  multiple_choice: 'Choose an option',
  free_form: 'Answer a question',
};

// Words the gallery gate if there is one, otherwise the oldest question.
// Returns null when nothing is waiting.
export function questionKind(response: ListQuestionsResponse): QuestionKindText | null {
  if (response.gallery_gate) {
    return { text: 'Pick a favourite', action: 'Review Candidates', candidates: response.gallery_gate.candidates.length };
  }
  const oldest = response.questions[0];
  if (!oldest) return null;
  return { text: KIND_TEXT[oldest.kind], action: 'Answer', candidates: null };
}
