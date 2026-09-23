// ABOUTME: Tests for InterviewerForm.svelte, the Task 17b interviewer node-kind side-panel
// ABOUTME: form for question/gallery/approve/options/candidate_count attributes (grounded in interviewer.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import InterviewerForm from '../../../../src/components/node-editor/nodeForms/InterviewerForm.svelte';

// Grounded in interviewer.rs:690-784 (InterviewerHandler::execute), NOT the
// spec's illustrative "gallery+candidate_count" example taken at face
// value:
// - `question` (the question/prompt/label fallback chain is a run-time
//   concern for the handler, not something this form reproduces -- it only
//   ever writes `question`).
// - `gallery` (Bool true) selects gallery-gate mode, reinterpreted only in
//   the handler's free-form branch (reached only when neither `approve`
//   nor `options` is set) -- so the form only allows it when Answer mode is
//   Free-form.
// - `approve` (Bool true exactly) for yes/no mode; `options`
//   (comma-separated string) for a fixed-choice list; mutually exclusive by
//   the handler's own branch order.
// - `candidate_count`: confirmed absent from interviewer.rs itself, but
//   genuinely read by smasher-web's routes/gallery.rs
//   (resolve_candidate_count, gallery dashboard card display count only) --
//   real and worth wiring for gallery-mode gates.
describe('InterviewerForm', () => {
  it('pre-populates question from attrs', () => {
    render(InterviewerForm, { props: { attrs: { question: 'pick a direction' }, onChange: vi.fn() } });

    const questionInput = screen.getByTestId('interviewer-question') as HTMLTextAreaElement;
    expect(questionInput.value).toBe('pick a direction');
  });

  it('calls onChange with the updated question as the user types', async () => {
    const onChange = vi.fn();
    render(InterviewerForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('interviewer-question'), { target: { value: 'continue?' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { question: 'continue?' } });
  });

  describe('gallery mode', () => {
    it('defaults the toggle off and hides candidate_count when attrs.gallery is absent', () => {
      render(InterviewerForm, { props: { attrs: {}, onChange: vi.fn() } });

      const galleryToggle = screen.getByTestId('interviewer-gallery-toggle');
      expect(galleryToggle).not.toBeChecked();
      expect(screen.queryByTestId('interviewer-candidate-count')).toBe(null);
    });

    it('defaults the toggle on and shows candidate_count when attrs.gallery is true', () => {
      render(InterviewerForm, {
        props: { attrs: { gallery: true, candidate_count: '3' }, onChange: vi.fn() },
      });

      const galleryToggle = screen.getByTestId('interviewer-gallery-toggle');
      const countInput = screen.getByTestId('interviewer-candidate-count') as HTMLInputElement;
      expect(galleryToggle).toBeChecked();
      expect(countInput.value).toBe('3');
    });

    it('checking the toggle writes gallery:true; unchecking removes it', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: {}, onChange } });

      await fireEvent.click(screen.getByTestId('interviewer-gallery-toggle'));
      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { gallery: true, candidate_count: undefined },
      });

      await fireEvent.click(screen.getByTestId('interviewer-gallery-toggle'));
      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { gallery: undefined, candidate_count: undefined },
      });
    });

    it('typing a candidate_count while gallery is on writes the string as-is (integer or phase_default(...))', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { gallery: true }, onChange } });

      await fireEvent.input(screen.getByTestId('interviewer-candidate-count'), {
        target: { value: 'phase_default(discover)' },
      });

      expect(onChange).toHaveBeenLastCalledWith({ attrs: { candidate_count: 'phase_default(discover)' } });
    });

    it('disables the gallery toggle when Answer mode is not Free-form', () => {
      render(InterviewerForm, { props: { attrs: { approve: true }, onChange: vi.fn() } });

      const galleryToggle = screen.getByTestId('interviewer-gallery-toggle') as HTMLInputElement;
      expect(galleryToggle.disabled).toBe(true);
    });
  });

  describe('answer mode', () => {
    it('defaults to Free-form when neither approve nor options is set', () => {
      render(InterviewerForm, { props: { attrs: {}, onChange: vi.fn() } });

      const modeSelect = screen.getByTestId('interviewer-answer-mode') as HTMLSelectElement;
      expect(modeSelect.value).toBe('freeform');
      expect(screen.queryByTestId('interviewer-options')).toBe(null);
    });

    it('defaults to Yes/No when attrs.approve is true', () => {
      render(InterviewerForm, { props: { attrs: { approve: true }, onChange: vi.fn() } });

      const modeSelect = screen.getByTestId('interviewer-answer-mode') as HTMLSelectElement;
      expect(modeSelect.value).toBe('approve');
    });

    it('defaults to Options and pre-populates the options field when attrs.options is a string', () => {
      render(InterviewerForm, { props: { attrs: { options: 'proceed, iterate' }, onChange: vi.fn() } });

      const modeSelect = screen.getByTestId('interviewer-answer-mode') as HTMLSelectElement;
      const optionsInput = screen.getByTestId('interviewer-options') as HTMLInputElement;
      expect(modeSelect.value).toBe('options');
      expect(optionsInput.value).toBe('proceed, iterate');
    });

    it('switching to Yes/No writes approve:true and clears options', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { options: 'a,b' }, onChange } });

      await fireEvent.change(screen.getByTestId('interviewer-answer-mode'), { target: { value: 'approve' } });

      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { approve: true, options: undefined, gallery: undefined, candidate_count: undefined },
      });
    });

    it('switching to Options shows the options field and writes the typed comma-separated string', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: {}, onChange } });

      await fireEvent.change(screen.getByTestId('interviewer-answer-mode'), { target: { value: 'options' } });
      await fireEvent.input(screen.getByTestId('interviewer-options'), { target: { value: 'yes, no, defer' } });

      expect(onChange).toHaveBeenLastCalledWith({ attrs: { options: 'yes, no, defer' } });
    });

    it('switching away from Free-form while gallery is on turns gallery off', async () => {
      const onChange = vi.fn();
      render(InterviewerForm, { props: { attrs: { gallery: true }, onChange } });

      await fireEvent.change(screen.getByTestId('interviewer-answer-mode'), { target: { value: 'approve' } });

      expect(onChange).toHaveBeenLastCalledWith({
        attrs: { approve: true, options: undefined, gallery: undefined, candidate_count: undefined },
      });
      const galleryToggle = screen.getByTestId('interviewer-gallery-toggle');
      expect(galleryToggle).not.toBeChecked();
    });

    it('disables the answer-mode select while gallery mode is on', () => {
      render(InterviewerForm, { props: { attrs: { gallery: true }, onChange: vi.fn() } });

      const modeSelect = screen.getByTestId('interviewer-answer-mode') as HTMLSelectElement;
      expect(modeSelect.disabled).toBe(true);
    });
  });
});
