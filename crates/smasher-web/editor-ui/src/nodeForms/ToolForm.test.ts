import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ToolForm from './ToolForm.svelte';

// Grounded in tool_handler.rs:53-92: `tool` (falls back to node label) and
// `args`, a JSON-encoded string parsed via serde_json::from_str -- invalid
// JSON fails the *run*, not this panel, so the form must show a visible
// error without crashing or blocking further edits.
describe('ToolForm', () => {
  it('pre-selects the matching option for a known tool and hides the custom field', () => {
    render(ToolForm, {
      props: { attrs: { tool: 'render_capture', args: '{"cmd":"ls"}' }, onChange: vi.fn() },
    });

    expect(screen.getByTestId('tool-select')).toHaveValue('render_capture');
    expect(screen.getByTestId('tool-args')).toHaveValue('{"cmd":"ls"}');
    expect(screen.queryByTestId('tool-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tool-args-error')).not.toBeInTheDocument();
  });

  it('falls back to Custom for an unrecognized tool name and shows it in the text field', () => {
    render(ToolForm, {
      props: { attrs: { tool: 'shell' }, onChange: vi.fn() },
    });

    expect(screen.getByTestId('tool-select')).toHaveValue('__custom__');
    expect(screen.getByTestId('tool-name')).toHaveValue('shell');
  });

  it('selecting a known tool calls onChange and hides the custom field', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.change(screen.getByTestId('tool-select'), { target: { value: 'system_lint' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { tool: 'system_lint' } });
    expect(screen.queryByTestId('tool-name')).not.toBeInTheDocument();
    expect(screen.getByText(/design-system lint/)).toBeInTheDocument();
  });

  it('selecting Custom reveals a text field, and typing calls onChange with the typed name', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.change(screen.getByTestId('tool-select'), { target: { value: '__custom__' } });
    expect(screen.getByTestId('tool-name')).toHaveValue('');

    await fireEvent.input(screen.getByTestId('tool-name'), { target: { value: 'http_fetch' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool: 'http_fetch' } });
  });

  it('valid JSON in args calls onChange and shows no error', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '{"a": 1}' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: '{"a": 1}' } });
    expect(screen.queryByTestId('tool-args-error')).not.toBeInTheDocument();
  });

  it('invalid JSON in args surfaces a visible error without throwing, and still propagates the raw text', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await expect(
      fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '{not valid json' } }),
    ).resolves.not.toThrow();

    expect(screen.getByTestId('tool-args-error')).toBeInTheDocument();
    // The raw (invalid) text is still written -- authoring isn't blocked,
    // just visibly flagged; the panel doesn't silently swallow or discard it.
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: '{not valid json' } });
  });

  it('clearing args back to blank removes the attr and clears the error', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { args: '{bad' }, onChange } });
    expect(screen.getByTestId('tool-args-error')).toBeInTheDocument();

    await fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '' } });

    expect(screen.queryByTestId('tool-args-error')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: undefined } });
  });
});
