import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ToolForm from './ToolForm.svelte';

// Grounded in tool_handler.rs:53-92: `tool` (falls back to node label) and
// `args`, a JSON-encoded string parsed via serde_json::from_str -- invalid
// JSON fails the *run*, not this panel, so the form must show a visible
// error without crashing or blocking further edits.
describe('ToolForm', () => {
  it('pre-populates tool/args from attrs', () => {
    render(ToolForm, {
      props: { attrs: { tool: 'shell', args: '{"cmd":"ls"}' }, onChange: vi.fn() },
    });

    expect(screen.getByTestId('tool-name')).toHaveValue('shell');
    expect(screen.getByTestId('tool-args')).toHaveValue('{"cmd":"ls"}');
    expect(screen.queryByTestId('tool-args-error')).not.toBeInTheDocument();
  });

  it('calls onChange with the updated tool name as the user types', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('tool-name'), { target: { value: 'http_fetch' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { tool: 'http_fetch' } });
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
