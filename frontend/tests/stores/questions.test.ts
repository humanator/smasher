// ABOUTME: Tests for question store
// ABOUTME: Verifies pending-question tracking and removal on answer

import { describe, it, expect, beforeEach } from 'vitest';
import { questionStore } from '../../src/stores/questions.svelte';

describe('question store', () => {
  beforeEach(() => {
    questionStore.reset();
  });

  it('starts with no pending questions', () => {
    expect(questionStore.pending).toEqual([]);
  });

  it('sets pending questions', () => {
    const questions = [
      {
        id: 'q1',
        question: 'Is this acceptable?',
        choices: [],
        kind: 'free_form' as const,
        node_id: 'gate_1',
      },
    ];

    questionStore.setPending(questions);

    expect(questionStore.pending).toHaveLength(1);
    expect(questionStore.pending[0].id).toBe('q1');
  });

  it('removes an answered question from pending', () => {
    const question = {
      id: 'q2',
      question: 'Choose one',
      choices: ['a', 'b', 'c'],
      kind: 'multiple_choice' as const,
      node_id: 'gate_2',
    };

    questionStore.setPending([question]);
    expect(questionStore.pending).toHaveLength(1);

    questionStore.answer('q2');

    expect(questionStore.pending).toHaveLength(0);
  });

  it('leaves other pending questions when one is answered', () => {
    const q1 = {
      id: 'q1',
      question: 'Q1?',
      choices: [],
      kind: 'free_form' as const,
      node_id: 'gate_1',
    };
    const q2 = {
      id: 'q2',
      question: 'Q2?',
      choices: [],
      kind: 'free_form' as const,
      node_id: 'gate_2',
    };

    questionStore.setPending([q1, q2]);
    questionStore.answer('q1');

    expect(questionStore.pending.map((q) => q.id)).toEqual(['q2']);
  });

  it('ignores an answer for a question that is not pending', () => {
    questionStore.setPending([
      { id: 'q1', question: 'Q1?', choices: [], kind: 'free_form' as const, node_id: 'gate_1' },
    ]);

    questionStore.answer('missing');

    expect(questionStore.pending).toHaveLength(1);
  });

  it('clears all questions', () => {
    questionStore.setPending([
      {
        id: 'q1',
        question: 'Q1?',
        choices: [],
        kind: 'free_form' as const,
        node_id: 'gate_1',
      },
    ]);

    questionStore.clear();

    expect(questionStore.pending).toEqual([]);
  });
});
