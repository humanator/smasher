// ABOUTME: Tests for CodergenForm.svelte, the Task 17b codergen node-kind side-panel
// ABOUTME: form for prompt/provider/model attributes (grounded in handler.rs).

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import CodergenForm from '../../../../src/components/node-editor/nodeForms/CodergenForm.svelte';
import { setApiBaseUrl } from '../../../../src/lib/api/client-config';

// Grounded in handler.rs:227-269: `prompt` (falls back to node label at
// execution time -- not this form's concern) and `model` (optional
// override), both plain strings.
//
// The provider/model selects are filled from the real server's /api/models; its
// fake claude CLI guarantees a `claude-cli` provider with the Claude aliases.
describe('CodergenForm', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  const providerSelect = () => screen.getByTestId('codergen-provider') as HTMLSelectElement;
  const modelSelect = () => screen.getByTestId('codergen-model') as HTMLSelectElement;

  it('pre-populates prompt, provider and model from attrs', async () => {
    render(CodergenForm, {
      props: {
        attrs: { prompt: 'write a haiku', provider: 'claude-cli', model: 'claude-opus' },
        onChange: vi.fn(),
      },
    });

    expect((screen.getByTestId('codergen-prompt') as HTMLTextAreaElement).value).toBe(
      'write a haiku'
    );
    await waitFor(() => expect(providerSelect().value).toBe('claude-cli'));
    expect(modelSelect().value).toBe('claude-opus');
  });

  it('shows a legacy model-only node unchanged and writes nothing on load', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: { model: 'claude-opus' }, onChange } });

    await waitFor(() => expect(providerSelect().value).toBe('claude-cli'));
    expect(modelSelect().value).toBe('claude-opus');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders blank fields and Server default when attrs has neither key', () => {
    render(CodergenForm, { props: { attrs: {}, onChange: vi.fn() } });

    expect((screen.getByTestId('codergen-prompt') as HTMLTextAreaElement).value).toBe('');
    expect(providerSelect().value).toBe('');
    expect(modelSelect().value).toBe('');
  });

  it('calls onChange with the updated prompt as the user types', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('codergen-prompt'), { target: { value: 'summarize the diff' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { prompt: 'summarize the diff' } });
  });

  it('choosing a provider writes provider and its default model', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: {}, onChange } });
    await waitFor(() => expect(providerSelect().options.length).toBeGreaterThan(1));

    await fireEvent.change(providerSelect(), { target: { value: 'claude-cli' } });

    expect(onChange).toHaveBeenCalledWith({
      attrs: { provider: 'claude-cli', model: 'claude-sonnet' },
    });
  });

  it('choosing Server default deletes provider and model', async () => {
    const onChange = vi.fn();
    render(CodergenForm, {
      props: { attrs: { provider: 'claude-cli', model: 'claude-opus' }, onChange },
    });
    await waitFor(() => expect(providerSelect().value).toBe('claude-cli'));

    await fireEvent.change(providerSelect(), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { provider: undefined, model: undefined } });
  });

  it('clearing prompt back to blank removes the attr entirely (undefined), not an empty string', async () => {
    const onChange = vi.fn();
    render(CodergenForm, { props: { attrs: { prompt: 'x' }, onChange } });

    await fireEvent.input(screen.getByTestId('codergen-prompt'), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { prompt: undefined } });
  });
});
