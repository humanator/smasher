// ABOUTME: Tests for InterviewerForm.svelte, the Ask a person form: Question, the answer mode radios,
// ABOUTME: Options, the gallery switch and Candidates to expect (grounded in interviewer.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import InterviewerForm from '../../../../src/components/node-editor/nodeForms/InterviewerForm.svelte';

// Grounded in interviewer.rs:690-784 (InterviewerHandler::execute):
// - `question` (the question/prompt/label fallback chain is a run-time
//   concern for the handler, not something this form reproduces -- it only
//   ever writes `question`).
// - `gallery` (Bool true) selects gallery-gate mode, reinterpreted only in
//   the handler's free-form branch (reached only when neither `approve`
//   nor `options` is set) -- so the form only offers it for Free text.
// - `approve` (Bool true exactly) for yes/no mode; `options`
//   (comma-separated string) for a fixed-choice list; mutually exclusive by
//   the handler's own branch order.
// - `candidate_count`: absent from interviewer.rs itself, but read by
//   smasher-web's routes/gallery.rs (resolve_candidate_count, the gallery
//   card's expected count only).

const radio = (testId: string) => screen.getByTestId(testId) as HTMLInputElement;

describe('InterviewerForm', () => {
  it('pre-populates the Question from attrs, with its help', () => {
    render(InterviewerForm, { props: { attrs: { question: 'pick a direction' }, onChange: vi.fn() } });

    const question = screen.getByRole('textbox', { name: 'Question' });
    expect(question).toBe(screen.getByTestId('interviewer-question'));
    expect(question).toHaveValue('pick a direction');
    expect(question).toHaveAccessibleDescription('What you want to ask. Shown to the person in the app while the run is paused.');
  });

  it('calls onChange with the updated question as the user types, and removes it when cleared', async () => {
    const onChange = vi.fn();
    render(InterviewerForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('interviewer-question'), { target: { value: 'continue?' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { question: 'continue?' } });

    await fireEvent.input(screen.getByTestId('interviewer-question'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { question: undefined } });
  });

  describe('answer mode', () => {
    it('asks how they should answer, with the three modes and their descriptions', () => {
      render(InterviewerForm, { props: { attrs: {}, onChange: vi.fn() } });

      const mode = screen.getByRole('group', { name: 'How should they answer?' });
      expect(mode).toBe(screen.getByTestId('interviewer-answer-mode'));
      expect(mode).toHaveAccessibleDescription('Choose the kind of answer you need back.');
      const values = (within(mode).getAllByRole('radio') as HTMLInputElement[]).map((r) => r.value);
      expect(values).toEqual(['freeform', 'approve', 'options']);
      expect(within(mode).getByRole('radio', { name: /Free text/ })).toBe(radio('interviewer-answer-mode-freeform'));
      expect(within(mode).getByRole('radio', { name: /Yes or no/ })).toBe(radio('interviewer-answer-mode-approve'));
      expect(within(mode).getByRole('radio', { name: /Pick from a list/ })).toBe(radio('interviewer-answer-mode-options'));
      expect(within(mode).getByText('Choose one of the options you write.')).toBeInTheDocument();
    });

    it('defaults to Free text when neither approve nor options is set', () => {
      render(InterviewerForm, { props: { attrs: {}, onChange: vi.fn() } });

      expect(radio('interviewer-answer-mode-freeform').checked).toBe(true);
      expect(screen.queryByTestId('interviewer-options')).toBe(null);
    });

    it('defaults to Yes or no when attrs.approve is true', () => {
      render(InterviewerForm, { props: { attrs: { approve: true }, onChange: vi.fn() } });

      expect(radio('interviewer-answer-mode-approve').checked).toBe(true);
    });

    it('defaults to Pick from a list and pre-populates Options when attrs.options is a string', () => {
      render(InterviewerForm, { props: { attrs: { options: 'proceed, iterate' }, onChange: vi.fn() } });

      expect(radio('interviewer-answer-mode-options').checked).toBe(true);
      const options = screen.getByRole('textbox', { name: 'Options' });
      expect(options).toBe(screen.getByTestId('interviewer-options'));
      expect(options).toHaveValue('proceed, iterate');
      expect(options).toHaveAttribute('aria-required', 'true');
    });

    it('marks Options as Required', () => {
      render(InterviewerForm, { props: { attrs: { options: '' }, onChange: vi.fn() } });

      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('switching to Yes or no writes approve:true and clears options and the gallery', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { options: 'a,b' }, onChange } });

      await fireEvent.click(radio('interviewer-answer-mode-approve'));

      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { approve: true, options: undefined, gallery: undefined, candidate_count: undefined },
      });
      expect(screen.queryByTestId('interviewer-options')).toBe(null);
    });

    it('switching to Pick from a list writes an empty options list, so the step stays a list, then the typed list', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: {}, onChange } });

      await fireEvent.click(radio('interviewer-answer-mode-options'));
      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { approve: undefined, options: '', gallery: undefined, candidate_count: undefined },
      });

      await fireEvent.input(screen.getByTestId('interviewer-options'), { target: { value: 'yes, no, defer' } });
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { options: 'yes, no, defer' } });

      await fireEvent.input(screen.getByTestId('interviewer-options'), { target: { value: '' } });
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { options: '' } });
    });

    it('switching back to Free text clears approve and options', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { approve: true }, onChange } });

      await fireEvent.click(radio('interviewer-answer-mode-freeform'));

      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { approve: undefined, options: undefined, gallery: undefined, candidate_count: undefined },
      });
    });
  });

  describe('gallery', () => {
    it('defaults the switch off and hides Candidates to expect when attrs.gallery is absent', () => {
      render(InterviewerForm, { props: { attrs: {}, onChange: vi.fn() } });

      const gallery = screen.getByRole('switch', { name: 'Show a gallery of candidates' });
      expect(gallery).toBe(screen.getByTestId('interviewer-gallery-toggle'));
      expect(gallery).not.toBeChecked();
      expect(screen.getByText('Off')).toBeInTheDocument();
      expect(screen.queryByTestId('interviewer-candidate-count')).toBe(null);
    });

    it('defaults the switch on and shows Candidates to expect when attrs.gallery is true', () => {
      render(InterviewerForm, {
        props: { attrs: { gallery: true, candidate_count: '3' }, onChange: vi.fn() },
      });

      expect(screen.getByTestId('interviewer-gallery-toggle')).toBeChecked();
      expect(screen.getByText('On')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Candidates to expect' })).toHaveValue('3');
    });

    it('shows a numeric candidate_count as text', () => {
      render(InterviewerForm, { props: { attrs: { gallery: true, candidate_count: 4 }, onChange: vi.fn() } });

      expect(screen.getByTestId('interviewer-candidate-count')).toHaveValue('4');
    });

    it('turning the switch on writes gallery:true; turning it off removes gallery and candidate_count', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: {}, onChange } });

      await fireEvent.click(screen.getByTestId('interviewer-gallery-toggle'));
      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { gallery: true, candidate_count: undefined },
      });
      expect(screen.getByTestId('interviewer-candidate-count')).toBeInTheDocument();

      await fireEvent.click(screen.getByTestId('interviewer-gallery-toggle'));
      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { gallery: undefined, candidate_count: undefined },
      });
      expect(screen.queryByTestId('interviewer-candidate-count')).toBe(null);
    });

    it('typing Candidates to expect writes the string as-is (integer or phase_default(...))', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { gallery: true }, onChange } });

      await fireEvent.input(screen.getByTestId('interviewer-candidate-count'), {
        target: { value: 'phase_default(discover)' },
      });

      expect(onChange).toHaveBeenLastCalledWith({ attrs: { candidate_count: 'phase_default(discover)' } });
    });

    it('is offered only for Free text answers', () => {
      render(InterviewerForm, { props: { attrs: { approve: true }, onChange: vi.fn() } });

      expect(screen.queryByTestId('interviewer-gallery-toggle')).toBe(null);
      expect(screen.queryByTestId('interviewer-candidate-count')).toBe(null);
    });

    it('choosing a non-free-text answer while the gallery is on turns it off and clears candidate_count', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { gallery: true, candidate_count: '3' }, onChange } });

      await fireEvent.click(radio('interviewer-answer-mode-options'));

      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { approve: undefined, options: '', gallery: undefined, candidate_count: undefined },
      });

      await fireEvent.click(radio('interviewer-answer-mode-freeform'));
      expect(screen.getByTestId('interviewer-gallery-toggle')).not.toBeChecked();
      expect(screen.queryByTestId('interviewer-candidate-count')).toBe(null);
    });

    it('lets the answer mode change while the gallery is on', () => {
      render(InterviewerForm, { props: { attrs: { gallery: true }, onChange: vi.fn() } });

      for (const value of ['freeform', 'approve', 'options']) {
        expect(radio(`interviewer-answer-mode-${value}`).disabled).toBe(false);
      }
    });

    it('ignores a gallery attr on a step that is not Free text', () => {
      render(InterviewerForm, { props: { attrs: { approve: true, gallery: true }, onChange: vi.fn() } });

      expect(radio('interviewer-answer-mode-approve').checked).toBe(true);
      expect(screen.queryByTestId('interviewer-gallery-toggle')).toBe(null);
    });
  });

  describe('problems', () => {
    it('shows the "needs a list of options" problem on Options when the canvas reports it', () => {
      render(InterviewerForm, { props: { attrs: { options: '' }, problems: ['needs a list of options'], onChange: vi.fn() } });

      const options = screen.getByTestId('interviewer-options');
      expect(options).toHaveAttribute('aria-invalid', 'true');
      expect(options).toHaveAccessibleDescription(expect.stringContaining('Needs a list of options.'));
    });

    it('shows no problem on Options when none is reported', () => {
      render(InterviewerForm, { props: { attrs: { options: 'a, b' }, problems: [], onChange: vi.fn() } });

      expect(screen.getByTestId('interviewer-options')).not.toHaveAttribute('aria-invalid');
    });
  });
});
