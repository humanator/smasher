// ABOUTME: Tests for question store
// ABOUTME: Verifies question tracking and answer recording

import { describe, it, expect, beforeEach } from 'vitest';
import { questionStore } from '../../src/stores/questions.svelte';

describe('question store', () => {
  beforeEach(() => {
    questionStore.reset();
  });

  it('starts with empty questions', () => {
    expect(questionStore.pending).toEqual([]);
    expect(questionStore.answered).toEqual([]);
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

  it('moves question from pending to answered when answered', () => {
    const question = {
      id: 'q2',
      question: 'Choose one',
      choices: ['a', 'b', 'c'],
      kind: 'multiple_choice' as const,
      node_id: 'gate_2',
    };

    questionStore.setPending([question]);
    expect(questionStore.pending).toHaveLength(1);

    questionStore.answer('q2', 'a');

    expect(questionStore.pending).toHaveLength(0);
    expect(questionStore.answered).toHaveLength(1);
    expect(questionStore.answered[0].answer).toBe('a');
  });

  it('tracks answeredAt timestamp', () => {
    const question = {
      id: 'q3',
      question: 'Continue?',
      choices: [],
      kind: 'approval' as const,
      node_id: 'gate_3',
    };

    questionStore.setPending([question]);

    const beforeAnswer = new Date();
    questionStore.answer('q3', 'yes');
    const afterAnswer = new Date();

    expect(questionStore.answered).toHaveLength(1);
    const answeredAt = new Date(questionStore.answered[0].answeredAt);
    expect(answeredAt.getTime()).toBeGreaterThanOrEqual(beforeAnswer.getTime());
    expect(answeredAt.getTime()).toBeLessThanOrEqual(afterAnswer.getTime());
  });

  it('provides all questions (pending + answered)', () => {
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
    questionStore.answer('q1', 'answer1');

    expect(questionStore.all).toHaveLength(2);
    expect(questionStore.pending).toHaveLength(1);
    expect(questionStore.answered).toHaveLength(1);
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
    questionStore.answer('q1', 'answer');

    expect(questionStore.all).toHaveLength(1);

    questionStore.clear();

    expect(questionStore.pending).toEqual([]);
    expect(questionStore.answered).toEqual([]);
  });
});
