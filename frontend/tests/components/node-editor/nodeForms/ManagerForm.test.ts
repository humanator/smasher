// ABOUTME: Tests for ManagerForm.svelte, the Task 17b manager node-kind side-panel
// ABOUTME: form for task/config attributes (grounded in manager_handler.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { setApiBaseUrl } from '../../../../src/lib/api/client-config';
import ManagerForm from '../../../../src/components/node-editor/nodeForms/ManagerForm.svelte';

// Grounded in manager_handler.rs:49-90: `task` (falls back to node label)
// and `config`, a JSON-encoded string -- same parse-and-fail-at-run-time
// treatment as ToolForm's `args`.
const JSON_ERROR = /^That is not valid JSON yet \(.+\)\. The step would fail when it runs\.$/;

describe('ManagerForm', () => {
  it('labels Task, Settings (JSON) and Model with the catalogue copy', () => {
    render(ManagerForm, { props: { attrs: {}, onChange: vi.fn() } });

    expect(screen.getByRole('textbox', { name: 'Task' })).toBe(screen.getByTestId('manager-task'));
    expect(screen.getByRole('textbox', { name: 'Task' })).toHaveAccessibleDescription(
      'What should the coordinator work out? Write it in plain language. It is sent to the AI as-is.',
    );
    const config = screen.getByRole('textbox', { name: 'Settings (JSON)' });
    expect(config).toBe(screen.getByTestId('manager-config'));
    expect(config).toHaveAttribute('placeholder', '{ }');
    expect(within(screen.getByRole('group', { name: 'Model' })).getByTestId('manager-provider')).toBeInTheDocument();
  });

  it('pre-populates task/config from attrs', () => {
    render(ManagerForm, {
      props: { attrs: { task: 'coordinate-review', config: '{"depth":2}' }, onChange: vi.fn() },
    });

    const taskInput = screen.getByTestId('manager-task') as HTMLInputElement;
    const configInput = screen.getByTestId('manager-config') as HTMLTextAreaElement;
    expect(taskInput.value).toBe('coordinate-review');
    expect(configInput.value).toBe('{"depth":2}');
    expect(screen.queryByText(/not valid JSON/)).toBe(null);
  });

  it('calls onChange with the updated task as the user types', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('manager-task'), { target: { value: 'fan-out-review' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { task: 'fan-out-review' } });
  });

  it('clearing the task removes the attr', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: { task: 'sync' }, onChange } });

    await fireEvent.input(screen.getByTestId('manager-task'), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { task: undefined } });
  });

  it('invalid JSON in config shows the spec message without throwing, and still writes the text', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: {}, onChange } });

    await expect(
      fireEvent.input(screen.getByTestId('manager-config'), { target: { value: '{bad' } }),
    ).resolves.not.toThrow();

    expect(screen.getByText(JSON_ERROR)).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('manager-config')).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { config: '{bad' } });
  });

  it('clearing config back to blank removes the attr and clears the error', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: { config: '{bad' }, onChange } });
    expect(screen.getByText(JSON_ERROR)).toHaveAttribute('role', 'alert');

    await fireEvent.input(screen.getByTestId('manager-config'), { target: { value: '' } });

    expect(screen.queryByText(/not valid JSON/)).toBe(null);
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { config: undefined } });
  });

  it('offers task suggestions as Try chips that fill the field without constraining it', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: {}, onChange } });

    for (const chip of ['coordinate-review', 'delegate-subtask', 'aggregate-results', 'escalate-to-human']) {
      expect(screen.getByRole('button', { name: chip })).toBeInTheDocument();
    }
    await fireEvent.click(screen.getByRole('button', { name: 'aggregate-results' }));

    expect(screen.getByTestId('manager-task')).toHaveValue('aggregate-results');
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { task: 'aggregate-results' } });
  });

  it('shows the provider and model pickers and writes their changes as attrs', async () => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: { provider: 'claude-cli', model: 'claude-opus' }, onChange } });

    const model = screen.getByTestId('manager-model') as HTMLSelectElement;
    expect(screen.getByTestId('manager-provider')).toBeTruthy();
    await waitFor(() => expect(model.querySelector('option[value="claude-sonnet"]')).toBeTruthy());
    await fireEvent.change(model, { target: { value: 'claude-sonnet' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { model: 'claude-sonnet' } });
  });

  it('shows the "missing a task" problem on Task when the canvas reports it, and not the JSON one', () => {
    render(ManagerForm, {
      props: { attrs: { config: '{' }, problems: ['is missing a task', 'has settings that are not valid JSON'], onChange: vi.fn() },
    });

    const task = screen.getByTestId('manager-task');
    expect(task).toHaveAttribute('aria-invalid', 'true');
    expect(task).toHaveAccessibleDescription(expect.stringContaining('Is missing a task.'));
    expect(screen.queryByText('Has settings that are not valid JSON.')).toBe(null);
  });

  it('shows no problem on Task when none is reported', () => {
    render(ManagerForm, { props: { attrs: {}, onChange: vi.fn() } });

    expect(screen.getByTestId('manager-task')).not.toHaveAttribute('aria-invalid');
  });
});
