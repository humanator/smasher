// ABOUTME: Tests for QuestionCard component
// ABOUTME: Verifies question polling and answer submission

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import QuestionCard from '../../../src/components/dashboard/QuestionCard.svelte';
import * as questionsApi from '../../../src/lib/api/questions';
import { questionStore } from '../../../src/stores/questions.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

vi.mock('../../../src/lib/api/questions');

describe('QuestionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    questionStore.clear();
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  it('renders empty state when no questions', () => {
    render(QuestionCard, { props: { runId: 'run-123' } });
    // Component doesn't render anything when empty (OK behavior)
  });

  it('displays pending questions from store', async () => {
    render(QuestionCard, { props: { runId: 'run-123' } });

    questionStore.setPending([
      {
        id: 'q1',
        question: 'Is this acceptable?',
        choices: [],
        kind: 'free_form',
        node_id: 'gate1',
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Is this acceptable?')).toBeTruthy();
  });

  it('submits free_form answer', async () => {
    const user = userEvent.setup();

    vi.mocked(questionsApi.answerQuestion).mockResolvedValue({
      success: true,
    });

    render(QuestionCard, { props: { runId: 'run-123' } });

    questionStore.setPending([
      {
        id: 'q1',
        question: 'Your answer?',
        choices: [],
        kind: 'free_form',
        node_id: 'gate1',
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const input = screen.getByPlaceholderText('Enter your answer') as HTMLInputElement;
    await user.type(input, 'yes');
    await user.keyboard('{Enter}');

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(questionsApi.answerQuestion).toHaveBeenCalledWith('run-123', 'q1', 'yes');
  });

  it('shows answered questions', async () => {
    render(QuestionCard, { props: { runId: 'run-123' } });

    const question = {
      id: 'q1',
      question: 'Complete?',
      choices: [],
      kind: 'free_form' as const,
      node_id: 'gate1',
    };

    questionStore.setPending([question]);
    questionStore.answer('q1', 'done');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Complete?')).toBeTruthy();
    expect(screen.getByText('Answer: done')).toBeTruthy();
  });

  it('handles approval questions with yes/no buttons', async () => {
    const user = userEvent.setup();

    vi.mocked(questionsApi.answerQuestion).mockResolvedValue({
      success: true,
    });

    render(QuestionCard, { props: { runId: 'run-123' } });

    questionStore.setPending([
      {
        id: 'q2',
        question: 'Continue?',
        choices: [],
        kind: 'approval',
        node_id: 'gate2',
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const yesBtn = screen.getByText('Yes') as HTMLButtonElement;
    await user.click(yesBtn);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(questionsApi.answerQuestion).toHaveBeenCalledWith('run-123', 'q2', 'yes');
  });
});
