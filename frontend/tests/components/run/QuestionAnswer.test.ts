// ABOUTME: Tests for QuestionAnswer, the shared answer controls for one human-gate question
// ABOUTME: Presentational: each kind's controls, what it hands to onanswer, and keeping the input when an answer fails

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import QuestionAnswer from '../../../src/components/run/QuestionAnswer.svelte';
import type { Question } from '../../../src/lib/api/questions';

const FREE: Question = { id: 'q-free', question: 'Say something', choices: [], kind: 'free_form' };
const APPROVAL: Question = { id: 'q-ok', question: 'Continue?', choices: [], kind: 'approval' };
const CHOICE: Question = { id: 'q-pick', question: 'Pick a colour', choices: ['Red', 'Blue'], kind: 'multiple_choice' };

describe('QuestionAnswer', () => {
  it('shows the question by default and labels the input with it', () => {
    render(QuestionAnswer, { props: { question: FREE, onanswer: vi.fn() } });

    expect(screen.getByText('Say something')).not.toHaveClass('sr-only');
    expect(screen.getByRole('textbox', { name: 'Say something' })).toBeTruthy();
  });

  it('applies textClass to the question', () => {
    render(QuestionAnswer, { props: { question: APPROVAL, textClass: 'sr-only', onanswer: vi.fn() } });

    expect(screen.getByText('Continue?')).toHaveClass('sr-only');
    expect(screen.getByRole('group', { name: 'Continue?' })).toBeTruthy();
  });

  it('hands over the typed text and clears it once accepted', async () => {
    const onanswer = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(QuestionAnswer, { props: { question: FREE, onanswer } });

    await user.type(screen.getByRole('textbox'), 'hello{Enter}');

    expect(onanswer).toHaveBeenCalledWith('hello');
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  });

  it('keeps the typed text and re-enables Submit when the answer fails', async () => {
    const onanswer = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(QuestionAnswer, { props: { question: FREE, onanswer } });

    await user.type(screen.getByRole('textbox'), 'keep me');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
    expect(screen.getByRole('textbox')).toHaveValue('keep me');
  });

  it('answers yes or no for an approval', async () => {
    const onanswer = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(QuestionAnswer, { props: { question: APPROVAL, onanswer } });

    await user.click(screen.getByRole('button', { name: 'No' }));

    expect(onanswer).toHaveBeenCalledWith('no');
  });

  it('answers the chosen option for multiple choice, with Submit off until one is chosen', async () => {
    const onanswer = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(QuestionAnswer, { props: { question: CHOICE, onanswer } });

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Blue' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onanswer).toHaveBeenCalledWith('Blue');
  });
});
