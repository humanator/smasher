// ABOUTME: Tests for ToolForm.svelte, the tool node-kind side-panel form: a built-in
// ABOUTME: tool (tool/args) or a shell command (tool_command/timeout), grounded in tool_handler.rs.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ToolForm from '../../../../src/components/node-editor/nodeForms/ToolForm.svelte';

// Grounded in tool_handler.rs (ToolHandler::execute): a tool node sets
// exactly one of `tool` (a built-in, with optional JSON `args`) or
// `tool_command` (a shell command, with optional `timeout`). Neither or
// both fails the run, and the label is never used as a tool name.
describe('ToolForm', () => {
  it('opens a node with a tool in built-in mode with the tool pre-selected', () => {
    render(ToolForm, {
      props: { attrs: { tool: 'render_capture', args: '{"cmd":"ls"}' }, onChange: vi.fn() },
    });

    expect((screen.getByTestId('tool-mode') as HTMLSelectElement).value).toBe('builtin');
    expect((screen.getByTestId('tool-select') as HTMLSelectElement).value).toBe('render_capture');
    expect((screen.getByTestId('tool-args') as HTMLTextAreaElement).value).toBe('{"cmd":"ls"}');
    expect(screen.queryByTestId('tool-command')).toBe(null);
    expect(screen.queryByTestId('tool-timeout')).toBe(null);
    expect(screen.queryByTestId('tool-args-error')).toBe(null);
  });

  it('opens a node with a tool_command in shell mode showing the command and timeout', () => {
    render(ToolForm, {
      props: { attrs: { tool_command: 'npm test', timeout: '30s' }, onChange: vi.fn() },
    });

    expect((screen.getByTestId('tool-mode') as HTMLSelectElement).value).toBe('command');
    expect((screen.getByTestId('tool-command') as HTMLTextAreaElement).value).toBe('npm test');
    expect((screen.getByTestId('tool-timeout') as HTMLInputElement).value).toBe('30s');
    expect(screen.queryByTestId('tool-select')).toBe(null);
    expect(screen.queryByTestId('tool-args')).toBe(null);
  });

  it('shows a numeric timeout as text', () => {
    render(ToolForm, {
      props: { attrs: { tool_command: 'make', timeout: 120 }, onChange: vi.fn() },
    });

    expect((screen.getByTestId('tool-timeout') as HTMLInputElement).value).toBe('120');
  });

  it('a new node with no attributes starts in built-in mode with nothing selected', () => {
    render(ToolForm, { props: { attrs: {}, onChange: vi.fn() } });

    expect((screen.getByTestId('tool-mode') as HTMLSelectElement).value).toBe('builtin');
    expect((screen.getByTestId('tool-select') as HTMLSelectElement).value).toBe('');
  });

  it('offers only the four built-in tools, with no Custom option', () => {
    render(ToolForm, { props: { attrs: {}, onChange: vi.fn() } });

    const values = Array.from((screen.getByTestId('tool-select') as HTMLSelectElement).options).map(
      (o) => o.value,
    );
    expect(values).toEqual(['', 'render_capture', 'system_lint', 'task_critic', 'synthesis']);
    expect(screen.queryByText(/Custom/)).toBe(null);
    expect(screen.queryByTestId('tool-name')).toBe(null);
  });

  it('keeps an unrecognized tool name visible and warns that it is not a built-in', () => {
    render(ToolForm, { props: { attrs: { tool: 'shell' }, onChange: vi.fn() } });

    expect((screen.getByTestId('tool-select') as HTMLSelectElement).value).toBe('shell');
    expect(screen.getByTestId('tool-unknown-warning').textContent).toMatch(/not a built-in tool/);
  });

  it('selecting a built-in tool calls onChange and shows its description', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.change(screen.getByTestId('tool-select'), { target: { value: 'system_lint' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { tool: 'system_lint' } });
    expect(screen.getByText(/design-system lint/)).toBeTruthy();
  });

  it('switching to shell command clears tool and args and shows the command field', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool: 'system_lint', args: '{}' }, onChange } });

    await fireEvent.change(screen.getByTestId('tool-mode'), { target: { value: 'command' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool: undefined, args: undefined } });
    expect((screen.getByTestId('tool-command') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByTestId('tool-select')).toBe(null);
  });

  it('switching to built-in tool clears tool_command and timeout', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool_command: 'make', timeout: '60' }, onChange } });

    await fireEvent.change(screen.getByTestId('tool-mode'), { target: { value: 'builtin' } });

    expect(onChange).toHaveBeenLastCalledWith({
      attrs: { tool_command: undefined, timeout: undefined },
    });
    expect((screen.getByTestId('tool-select') as HTMLSelectElement).value).toBe('');
    expect(screen.queryByTestId('tool-command')).toBe(null);
  });

  it('typing a command writes tool_command, and clearing it removes the attr', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool_command: 'x' }, onChange } });

    await fireEvent.input(screen.getByTestId('tool-command'), { target: { value: 'make test' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool_command: 'make test' } });

    await fireEvent.input(screen.getByTestId('tool-command'), { target: { value: '  ' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool_command: undefined } });
  });

  it('typing a timeout writes it, and clearing it removes the attr', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool_command: 'make' }, onChange } });

    await fireEvent.input(screen.getByTestId('tool-timeout'), { target: { value: '30s' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { timeout: '30s' } });

    await fireEvent.input(screen.getByTestId('tool-timeout'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { timeout: undefined } });
  });

  it('valid JSON in args calls onChange and shows no error', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '{"a": 1}' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: '{"a": 1}' } });
    expect(screen.queryByTestId('tool-args-error')).toBe(null);
  });

  it('invalid JSON in args surfaces a visible error without throwing, and still propagates the raw text', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await expect(
      fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '{not valid json' } }),
    ).resolves.not.toThrow();

    expect(screen.getByTestId('tool-args-error')).toBeTruthy();
    // The raw (invalid) text is still written -- authoring isn't blocked,
    // just visibly flagged; the panel doesn't silently swallow or discard it.
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: '{not valid json' } });
  });

  it('clearing args back to blank removes the attr and clears the error', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { args: '{bad' }, onChange } });
    expect(screen.getByTestId('tool-args-error')).toBeTruthy();

    await fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '' } });

    expect(screen.queryByTestId('tool-args-error')).toBe(null);
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: undefined } });
  });

  describe('model picker', () => {
    it('shows for the tools that call a model', () => {
      render(ToolForm, { props: { attrs: { tool: 'task_critic' }, onChange: vi.fn() } });

      expect(screen.getByTestId('tool-provider')).toBeTruthy();
      expect(screen.getByTestId('tool-model')).toBeTruthy();
    });

    it('is absent for an unknown tool, which no longer falls back to an LLM', () => {
      render(ToolForm, { props: { attrs: { tool: 'http_fetch' }, onChange: vi.fn() } });

      expect(screen.queryByTestId('tool-model')).toBe(null);
    });

    it('is absent for a native tool such as render_capture', () => {
      render(ToolForm, { props: { attrs: { tool: 'render_capture' }, onChange: vi.fn() } });

      expect(screen.queryByTestId('tool-model')).toBe(null);
    });

    it('is absent for a shell command node', () => {
      render(ToolForm, {
        props: { attrs: { tool_command: 'ls' }, onChange: vi.fn() },
      });

      expect(screen.queryByTestId('tool-model')).toBe(null);
    });

    it('appears and disappears as the selected tool changes', async () => {
      render(ToolForm, { props: { attrs: { tool: 'render_capture' }, onChange: vi.fn() } });
      expect(screen.queryByTestId('tool-model')).toBe(null);

      await fireEvent.change(screen.getByTestId('tool-select'), { target: { value: 'synthesis' } });
      expect(screen.getByTestId('tool-model')).toBeTruthy();

      await fireEvent.change(screen.getByTestId('tool-select'), { target: { value: 'system_lint' } });
      expect(screen.queryByTestId('tool-model')).toBe(null);
    });
  });
});
