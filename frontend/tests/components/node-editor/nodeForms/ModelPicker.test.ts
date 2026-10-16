// ABOUTME: Tests for ModelPicker, the provider + model selects shared by every LLM node form
// ABOUTME: State cases are driven by passing provider lists in; one test loads them from the REAL server

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import ModelPicker from '../../../../src/components/node-editor/nodeForms/ModelPicker.svelte';
import { setApiBaseUrl } from '../../../../src/lib/api/client-config';
import type { ProviderModels } from '../../../../src/lib/api/models';

const anthropic: ProviderModels = {
  provider: 'anthropic',
  label: 'Anthropic',
  default_model: 'claude-opus-5',
  models: [
    { id: 'claude-opus-5', label: 'Claude Opus 5', aliases: [] },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', aliases: [] },
  ],
  source: 'provider',
};
const ollama: ProviderModels = {
  provider: 'ollama',
  label: 'Ollama',
  default_model: null,
  models: [
    { id: 'gemma4:31b-cloud', label: 'gemma4:31b-cloud', aliases: [] },
    { id: 'llama3:8b', label: 'llama3:8b', aliases: [] },
  ],
  source: 'provider',
};
const emptyOllama: ProviderModels = { ...ollama, models: [] };

const providerSelect = () => screen.getByTestId('mp-provider') as HTMLSelectElement;
const modelSelect = () => screen.getByTestId('mp-model') as HTMLSelectElement;

function renderPicker(
  props: { provider?: string; model?: string; models?: ProviderModels[] },
  onChange = vi.fn()
) {
  render(ModelPicker, { props: { idPrefix: 'mp', models: [anthropic, ollama], onChange, ...props } });
  return onChange;
}

describe('ModelPicker', () => {
  it('lists Server default plus each configured provider', () => {
    renderPicker({});

    const labels = Array.from(providerSelect().options).map((o) => o.textContent?.trim());
    expect(labels).toEqual(['Server default', 'Anthropic', 'Ollama']);
    expect(providerSelect().value).toBe('');
  });

  it('labels its fields Provider and Model by default, with no hints', () => {
    renderPicker({});
    expect(screen.getByLabelText('Provider')).toBe(providerSelect());
    expect(screen.getByLabelText('Model')).toBe(modelSelect());
    expect(providerSelect()).not.toHaveAttribute('aria-describedby');
  });

  it('takes other labels and a hint for each field', () => {
    render(ModelPicker, {
      props: {
        idPrefix: 'mp',
        models: [anthropic],
        onChange: vi.fn(),
        providerLabel: 'Default provider',
        modelLabel: 'Default model',
        providerHint: 'Which service to send requests to.',
        modelHint: 'The model AI steps use.',
        layout: 'rows',
      },
    });
    expect(screen.getByLabelText('Default provider')).toHaveAccessibleDescription('Which service to send requests to.');
    expect(screen.getByLabelText('Default model')).toHaveAccessibleDescription('The model AI steps use.');
  });

  it('labels the blank provider option as asked', () => {
    renderPicker({ blankLabel: 'Choose a provider…' } as never);

    expect(providerSelect().options[0].textContent?.trim()).toBe('Choose a provider…');
  });

  it('shows the saved provider and model', () => {
    renderPicker({ provider: 'anthropic', model: 'claude-sonnet-5' });

    expect(providerSelect().value).toBe('anthropic');
    expect(modelSelect().value).toBe('claude-sonnet-5');
  });

  it('choosing a provider sets that provider and its default model', async () => {
    const onChange = renderPicker({});

    await fireEvent.change(providerSelect(), { target: { value: 'anthropic' } });

    expect(onChange).toHaveBeenLastCalledWith({ provider: 'anthropic', model: 'claude-opus-5' });
    expect(modelSelect().value).toBe('claude-opus-5');
  });

  it('choosing Ollama sets the provider and leaves the model for the user to pick', async () => {
    const onChange = renderPicker({});

    await fireEvent.change(providerSelect(), { target: { value: 'ollama' } });

    expect(onChange).toHaveBeenLastCalledWith({ provider: 'ollama', model: undefined });
    expect(modelSelect().value).toBe('');
    const ids = Array.from(modelSelect().options).map((o) => o.value);
    expect(ids).toEqual(['', 'gemma4:31b-cloud', 'llama3:8b']);
  });

  it('switching provider replaces a model that belongs to the old one', async () => {
    const onChange = renderPicker({ provider: 'anthropic', model: 'claude-sonnet-5' });

    await fireEvent.change(providerSelect(), { target: { value: 'ollama' } });

    expect(onChange).toHaveBeenLastCalledWith({ provider: 'ollama', model: undefined });
  });

  it('choosing a model writes just the model', async () => {
    const onChange = renderPicker({ provider: 'anthropic', model: 'claude-opus-5' });

    await fireEvent.change(modelSelect(), { target: { value: 'claude-sonnet-5' } });

    expect(onChange).toHaveBeenLastCalledWith({ model: 'claude-sonnet-5' });
  });

  it('choosing Server default removes both provider and model', async () => {
    const onChange = renderPicker({ provider: 'anthropic', model: 'claude-opus-5' });

    await fireEvent.change(providerSelect(), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ provider: undefined, model: undefined });
  });

  it('keeps a saved model that is not in the list and labels it custom', () => {
    renderPicker({ provider: 'anthropic', model: 'claude-future-9' });

    expect(modelSelect().value).toBe('claude-future-9');
    const selected = modelSelect().selectedOptions[0];
    expect(selected.textContent).toContain('custom');
  });

  it('shows a model-only legacy node under the provider that lists the model, without writing', () => {
    const onChange = renderPicker({ model: 'claude-sonnet-5' });

    expect(providerSelect().value).toBe('anthropic');
    expect(modelSelect().value).toBe('claude-sonnet-5');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps an unknown model-only legacy value visible as custom under Server default', () => {
    const onChange = renderPicker({ model: 'mystery-model' });

    expect(providerSelect().value).toBe('');
    expect(modelSelect().selectedOptions[0].textContent).toContain('custom');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('falls back to a text field only when the provider list is empty', async () => {
    const onChange = renderPicker({ provider: 'ollama', model: 'my-model', models: [emptyOllama] });

    const text = screen.getByTestId('mp-model') as HTMLInputElement;
    expect(text.tagName).toBe('INPUT');
    expect(text.value).toBe('my-model');

    await fireEvent.input(text, { target: { value: 'other' } });
    expect(onChange).toHaveBeenLastCalledWith({ model: 'other' });
  });

  it('uses selects, never a text field, for a provider with a list', () => {
    renderPicker({ provider: 'anthropic', model: 'claude-opus-5' });

    expect(modelSelect().tagName).toBe('SELECT');
  });

  it('loads the providers from the real server when none are passed in', async () => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
    render(ModelPicker, { props: { idPrefix: 'mp', onChange: vi.fn() } });

    await waitFor(() => {
      const values = Array.from(providerSelect().options).map((o) => o.value);
      expect(values).toContain('claude-cli');
    });
  });
});
