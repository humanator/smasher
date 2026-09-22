// ABOUTME: Tests for CodergenForm.svelte, the Task 17b codergen node-kind side-panel
// ABOUTME: form for prompt/model attributes (grounded in handler.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CodergenForm from '../../../../src/components/node-editor/nodeForms/CodergenForm.svelte';

// Grounded in handler.rs:227-269: `prompt` (falls back to node label at
// execution time -- not this form's concern) and `model` (optional
// override), both plain strings.
describe('CodergenForm', () => {
  it('pre-populates prompt/model from attrs', () => {
    render(CodergenForm, {
      props: { attrs: { prompt: 'write a haiku', model: 'claude-sonnet-4-5' }, onChange: vi.fn() },
    });

    const promptInput = screen.getByTestId('codergen-prompt') as HTMLTextAreaElement;
    const modelInput = screen.getByTestId('codergen-model') as HTMLInputElement;

    expect(promptInput.value).toBe('write a haiku');
    expect(modelInput.value).toBe('claude-sonnet-4-5');
  });

  it('renders blank fields when attrs has neither key', () => {
    render(CodergenForm, { props: { attrs: {}, onChange: vi.fn() } });

    const promptInput = screen.getByTestId('codergen-prompt') as HTMLTextAreaElement;
    const modelInput = screen.getByTestId('codergen-model') as HTMLInputElement;

    expect(promptInput.value).toBe('');
    expect(modelInput.value).toBe('');
  });

  it('calls onChange with the updated prompt as the user types', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('codergen-prompt'), { target: { value: 'summarize the diff' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { prompt: 'summarize the diff' } });
  });

  it('calls onChange with the updated model as the user types', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('codergen-model'), { target: { value: 'gpt-5' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { model: 'gpt-5' } });
  });

  it('clearing prompt back to blank removes the attr entirely (undefined), not an empty string', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: { prompt: 'x' }, onChange } });

    await fireEvent.input(screen.getByTestId('codergen-prompt'), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { prompt: undefined } });
  });
});
