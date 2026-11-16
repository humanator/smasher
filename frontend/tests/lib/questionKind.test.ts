// ABOUTME: Tests for questionKind, which words what a waiting run needs from a person
// ABOUTME: Pure function tests over GET /api/runs/{id}/questions responses

import { describe, it, expect } from 'vitest';
import { questionKind } from '../../src/lib/questionKind';
import type { ListQuestionsResponse, Question } from '../../src/lib/api/questions';
import type { CandidateResponse } from '../../src/lib/api/runs';

function question(kind: Question['kind']): Question {
  return { id: 'q1', question: 'Proceed?', choices: [], kind, node_id: 'gate' };
}

describe('questionKind', () => {
  it('asks to pick a favourite for a gallery gate, with its candidate count', () => {
    const response: ListQuestionsResponse = {
      questions: [question('multiple_choice')],
      gallery_gate: {
        question_id: 'q1',
        candidates: [{} as CandidateResponse, {} as CandidateResponse, {} as CandidateResponse],
        expected_count: 3,
        outgoing_edges: [],
      },
    };
    expect(questionKind(response)).toEqual({
      text: 'Pick a favourite',
      action: 'Review Candidates',
      candidates: 3,
      waitingFor: 'choose from 3 candidates',
    });
  });

  it('says "1 candidate" when a gallery gate has one ready', () => {
    const response: ListQuestionsResponse = {
      questions: [],
      gallery_gate: { question_id: 'q1', candidates: [{} as CandidateResponse], expected_count: 3, outgoing_edges: [] },
    };
    expect(questionKind(response)?.waitingFor).toBe('choose from 1 candidate');
  });

  it.each([
    ['approval', 'Approve or reject', 'approve or reject it'],
    ['multiple_choice', 'Choose an option', 'choose an option'],
    ['free_form', 'Answer a question', 'answer a question'],
  ] as const)('words a %s question as "%s" with an Answer button', (kind, text, waitingFor) => {
    const response: ListQuestionsResponse = { questions: [question(kind)], gallery_gate: null };
    expect(questionKind(response)).toEqual({ text, action: 'Answer', candidates: null, waitingFor });
  });

  it('words the oldest question when several are waiting', () => {
    const response: ListQuestionsResponse = {
      questions: [question('approval'), question('free_form')],
      gallery_gate: null,
    };
    expect(questionKind(response)?.text).toBe('Approve or reject');
  });

  it('returns null when nothing is waiting', () => {
    expect(questionKind({ questions: [], gallery_gate: null })).toBeNull();
  });
});
