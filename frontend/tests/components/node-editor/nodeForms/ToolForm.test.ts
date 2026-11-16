// ABOUTME: Tests for ToolForm.svelte, the tool node-kind side-panel form: a built-in
// ABOUTME: tool (tool/args, plus a model for LLM tools) or a shell command (tool_command/timeout), grounded in tool_handler.rs.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import ToolForm from '../../../../src/components/node-editor/nodeForms/ToolForm.svelte';

// Grounded in tool_handler.rs (ToolHandler::execute): a tool node sets
// exactly one of `tool` (a built-in, with optional JSON `args`) or
// `tool_command` (a shell command, with optional `timeout`). Neither or
// both fails the run, and the label is never used as a tool name. The form
// is in shell mode whenever `tool_command` exists, even empty (nodeSummary's
// toolMode), so the card and the form always agree.

const radio = (testId: string) => screen.getByTestId(testId) as HTMLInputElement;
const JSON_ERROR = /^That is not valid JSON yet \(.+\)\. The step would fail when it runs\.$/;

describe('ToolForm', () => {
  it('asks what the step should run, with the two modes and their descriptions', () => {
    render(ToolForm, { props: { attrs: {}, onChange: vi.fn() } });

    const mode = screen.getByRole('group', { name: 'What should this step run?' });
    expect(mode).toBe(screen.getByTestId('tool-mode'));
    expect(mode).toHaveAccessibleDescription('Choose one. A step cannot do both.');
    expect(within(mode).getByRole('radio', { name: /Built-in tool/ })).toBe(radio('tool-mode-builtin'));
    expect(within(mode).getByRole('radio', { name: /Shell command/ })).toBe(radio('tool-mode-command'));
    expect(within(mode).getByText('Any command on your computer.')).toBeInTheDocument();
  });

  it('opens a node with a tool in built-in mode with the tool pre-selected', () => {
    render(ToolForm, {
      props: { attrs: { tool: 'render_capture', args: '{"cmd":"ls"}' }, onChange: vi.fn() },
    });

    expect(radio('tool-mode-builtin').checked).toBe(true);
    expect(radio('tool-select-render_capture').checked).toBe(true);
    expect((screen.getByTestId('tool-args') as HTMLTextAreaElement).value).toBe('{"cmd":"ls"}');
    expect(screen.queryByTestId('tool-command')).toBe(null);
    expect(screen.queryByTestId('tool-timeout')).toBe(null);
    expect(screen.queryByText(/not valid JSON/)).toBe(null);
  });

  it('opens a node with a tool_command in shell mode showing the command and timeout', () => {
    render(ToolForm, {
      props: { attrs: { tool_command: 'npm test', timeout: '30s' }, onChange: vi.fn() },
    });

    expect(radio('tool-mode-command').checked).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Command' })).toBe(screen.getByTestId('tool-command'));
    expect((screen.getByTestId('tool-command') as HTMLTextAreaElement).value).toBe('npm test');
    expect(screen.getByRole('textbox', { name: 'Time limit' })).toHaveValue('30s');
    expect(screen.queryByTestId('tool-select')).toBe(null);
    expect(screen.queryByTestId('tool-args')).toBe(null);
  });

  it('opens a node with an empty tool_command in shell mode, as its card does', () => {
    render(ToolForm, { props: { attrs: { tool_command: '' }, onChange: vi.fn() } });

    expect(radio('tool-mode-command').checked).toBe(true);
    expect(screen.getByTestId('tool-command')).toHaveValue('');
  });

  it('shows a numeric timeout as text', () => {
    render(ToolForm, {
      props: { attrs: { tool_command: 'make', timeout: 120 }, onChange: vi.fn() },
    });

    expect((screen.getByTestId('tool-timeout') as HTMLInputElement).value).toBe('120');
  });

  it('a new node with no attributes starts in built-in mode with nothing selected', () => {
    render(ToolForm, { props: { attrs: {}, onChange: vi.fn() } });

    expect(radio('tool-mode-builtin').checked).toBe(true);
    const tools = within(screen.getByTestId('tool-select')).getAllByRole('radio') as HTMLInputElement[];
    expect(tools.some((t) => t.checked)).toBe(false);
  });

  it('offers only the four built-in tools as a required choice, each with its description', () => {
    render(ToolForm, { props: { attrs: {}, onChange: vi.fn() } });

    const group = screen.getByRole('group', { name: 'Tool' });
    expect(group).toBe(screen.getByTestId('tool-select'));
    const values = (within(group).getAllByRole('radio') as HTMLInputElement[]).map((o) => o.value);
    expect(values).toEqual(['render_capture', 'system_lint', 'task_critic', 'synthesis']);
    expect(within(group).getByText('Required')).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: /Design-system check/ })).toBeInTheDocument();
    expect(within(group).getByText('Checks a candidate against the design system’s rules. No AI involved.')).toBeInTheDocument();
    expect(screen.queryByText(/Custom/)).toBe(null);
    expect(screen.queryByTestId('tool-name')).toBe(null);
  });

  it('keeps an unrecognized tool name, checks no built-in and warns that it is not a built-in', () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool: 'shell' }, onChange } });

    const tools = within(screen.getByTestId('tool-select')).getAllByRole('radio') as HTMLInputElement[];
    expect(tools.some((t) => t.checked)).toBe(false);
    expect(screen.getByTestId('tool-unknown-warning').textContent).toMatch(/"shell" is not a built-in tool/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('choosing a built-in tool writes tool and clears the unknown-tool warning', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool: 'shell' }, onChange } });

    await fireEvent.click(radio('tool-select-system_lint'));

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool: 'system_lint' } });
    expect(radio('tool-select-system_lint').checked).toBe(true);
    expect(screen.queryByTestId('tool-unknown-warning')).toBe(null);
  });

  it.each(['render_capture', 'system_lint', 'task_critic', 'synthesis'])('choosing %s writes tool', async (tool) => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await fireEvent.click(radio(`tool-select-${tool}`));

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool } });
  });

  it('switching to shell command clears tool and args, writes an empty command and shows the command field', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool: 'system_lint', args: '{}' }, onChange } });

    await fireEvent.click(radio('tool-mode-command'));

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool: undefined, args: undefined, tool_command: '' } });
    expect((screen.getByTestId('tool-command') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByTestId('tool-select')).toBe(null);
  });

  it('switching to built-in tool clears tool_command and timeout', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool_command: 'make', timeout: '60' }, onChange } });

    await fireEvent.click(radio('tool-mode-builtin'));

    expect(onChange).toHaveBeenLastCalledWith({
      attrs: { tool_command: undefined, timeout: undefined },
    });
    const tools = within(screen.getByTestId('tool-select')).getAllByRole('radio') as HTMLInputElement[];
    expect(tools.some((t) => t.checked)).toBe(false);
    expect(screen.queryByTestId('tool-command')).toBe(null);
  });

  it('switching back to built-in after switching away starts with a blank tool and args', async () => {
    render(ToolForm, { props: { attrs: { tool: 'synthesis', args: '{"a":1}' }, onChange: vi.fn() } });

    await fireEvent.click(radio('tool-mode-command'));
    await fireEvent.click(radio('tool-mode-builtin'));

    expect(radio('tool-select-synthesis').checked).toBe(false);
    expect(screen.getByTestId('tool-args')).toHaveValue('');
  });

  it('typing a command writes tool_command, and clearing it keeps an empty one so the step stays a command', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool_command: 'x' }, onChange } });

    await fireEvent.input(screen.getByTestId('tool-command'), { target: { value: 'make test' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool_command: 'make test' } });

    await fireEvent.input(screen.getByTestId('tool-command'), { target: { value: '  ' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { tool_command: '' } });
    expect(radio('tool-mode-command').checked).toBe(true);
  });

  it('typing a timeout writes it, and clearing it removes the attr', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { tool_command: 'make' }, onChange } });

    await fireEvent.input(screen.getByTestId('tool-timeout'), { target: { value: '30s' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { timeout: '30s' } });

    await fireEvent.input(screen.getByTestId('tool-timeout'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { timeout: undefined } });
  });

  it('labels Tool settings (JSON) and writes valid JSON with no error', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    const args = screen.getByRole('textbox', { name: 'Tool settings (JSON)' });
    expect(args).toBe(screen.getByTestId('tool-args'));
    await fireEvent.input(args, { target: { value: '{"a": 1}' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: '{"a": 1}' } });
    expect(screen.queryByText(/not valid JSON/)).toBe(null);
  });

  it('invalid JSON in args shows the spec message without throwing, and still propagates the raw text', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: {}, onChange } });

    await expect(
      fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '{not valid json' } }),
    ).resolves.not.toThrow();

    expect(screen.getByText(JSON_ERROR)).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('tool-args')).toHaveAttribute('aria-invalid', 'true');
    // The raw (invalid) text is still written -- authoring isn't blocked,
    // just visibly flagged; the panel doesn't silently swallow or discard it.
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: '{not valid json' } });
  });

  it('clearing args back to blank removes the attr and clears the error', async () => {
    const onChange = vi.fn();
    render(ToolForm, { props: { attrs: { args: '{bad' }, onChange } });
    expect(screen.getByText(JSON_ERROR)).toBeInTheDocument();

    await fireEvent.input(screen.getByTestId('tool-args'), { target: { value: '' } });

    expect(screen.queryByText(/not valid JSON/)).toBe(null);
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { args: undefined } });
  });

  describe('model picker', () => {
    it.each(['task_critic', 'synthesis'])('shows under a Model field for %s, which calls a model', (tool) => {
      render(ToolForm, { props: { attrs: { tool }, onChange: vi.fn() } });

      const model = screen.getByRole('group', { name: 'Model' });
      expect(within(model).getByTestId('tool-provider')).toBeTruthy();
      expect(within(model).getByTestId('tool-model')).toBeTruthy();
    });

    it('is absent for an unknown tool, which no longer falls back to an LLM', () => {
      render(ToolForm, { props: { attrs: { tool: 'http_fetch' }, onChange: vi.fn() } });

      expect(screen.queryByTestId('tool-model')).toBe(null);
    });

    it.each(['render_capture', 'system_lint'])('is absent for a native tool such as %s', (tool) => {
      render(ToolForm, { props: { attrs: { tool }, onChange: vi.fn() } });

      expect(screen.queryByTestId('tool-model')).toBe(null);
      expect(screen.queryByRole('group', { name: 'Model' })).toBe(null);
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

      await fireEvent.click(radio('tool-select-synthesis'));
      expect(screen.getByTestId('tool-model')).toBeTruthy();

      await fireEvent.click(radio('tool-select-system_lint'));
      expect(screen.queryByTestId('tool-model')).toBe(null);
    });
  });

  it('shows the "needs a tool chosen" problem on Tool, describing the group with it', () => {
    render(ToolForm, { props: { attrs: {}, problems: ['needs a tool chosen'], onChange: vi.fn() } });

    const group = screen.getByTestId('tool-select');
    expect(group).toHaveAccessibleDescription(expect.stringContaining('Needs a tool chosen.'));
    expect(within(group).getByRole('alert')).toHaveTextContent('Needs a tool chosen.');
  });

  it('shows the "needs a command" problem on Command when the canvas reports it', () => {
    render(ToolForm, { props: { attrs: { tool_command: '' }, problems: ['needs a command'], onChange: vi.fn() } });

    const command = screen.getByTestId('tool-command');
    expect(command).toHaveAttribute('aria-invalid', 'true');
    expect(command).toHaveAccessibleDescription(expect.stringContaining('Needs a command.'));
  });

  it('shows no problem on Tool or Command when none is reported', () => {
    render(ToolForm, { props: { attrs: { tool: 'system_lint' }, problems: [], onChange: vi.fn() } });

    expect(screen.queryByText('Needs a tool chosen.')).toBe(null);
    expect(screen.getByTestId('tool-select')).toHaveAccessibleDescription('Pick the built-in tool to run.');
  });
});
