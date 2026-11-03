// ABOUTME: Tests for inspector/Field.svelte, which renders any FieldSpec from the stepFields catalogue
// ABOUTME: Covers the anatomy (label, Required, More about, help, Try chips, error) and every control type

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import Field from '../../../../src/components/node-editor/inspector/Field.svelte';
import type { FieldSpec } from '../../../../src/lib/stepFields';

const text: FieldSpec = {
  attr: 'task',
  label: 'Task',
  control: 'text',
  help: 'What should the coordinator work out?',
  placeholder: 'e.g. coordinate-review',
  tryChips: ['coordinate-review', 'delegate-subtask'],
  more: [
    { title: 'If left blank', text: 'The step name is used.' },
    { title: 'Good to know', text: 'The suggestions are starting points.' },
  ],
};

describe('Field anatomy', () => {
  it('labels the control and describes it with the help text', () => {
    render(Field, { props: { spec: text, value: '' } });

    const input = screen.getByRole('textbox', { name: 'Task' });
    expect(input).toHaveAttribute('placeholder', 'e.g. coordinate-review');
    expect(input).toHaveAccessibleDescription('What should the coordinator work out?');
  });

  it('shows a Required badge only for required fields', () => {
    const { unmount } = render(Field, { props: { spec: text, value: '' } });
    expect(screen.queryByText('Required')).toBeNull();
    unmount();

    render(Field, { props: { spec: { ...text, required: true }, value: '' } });
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('reveals the More about rows from a toggle that reports aria-expanded', async () => {
    render(Field, { props: { spec: text, value: '' } });
    const toggle = screen.getByRole('button', { name: 'More about Task' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('If left blank')).toBeNull();

    await fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('If left blank')).toBeInTheDocument();
    expect(screen.getByText('The suggestions are starting points.')).toBeInTheDocument();

    await fireEvent.click(toggle);
    expect(screen.queryByText('If left blank')).toBeNull();
  });

  it('has no More about toggle when the spec has no rows', () => {
    render(Field, { props: { spec: { ...text, more: undefined }, value: '' } });
    expect(screen.queryByRole('button', { name: /More about/ })).toBeNull();
  });

  it('fills the field from a Try chip', async () => {
    const oninput = vi.fn();
    render(Field, { props: { spec: text, value: '', oninput } });
    expect(screen.getByText('Try:')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'delegate-subtask' }));

    expect(oninput).toHaveBeenCalledWith('delegate-subtask');
  });

  it('marks the control invalid and describes it with the error', () => {
    render(Field, { props: { spec: text, value: '{', error: 'That is not valid JSON yet.' } });

    const input = screen.getByRole('textbox', { name: 'Task' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('What should the coordinator work out? That is not valid JSON yet.');
    expect(screen.getByRole('alert')).toHaveTextContent('That is not valid JSON yet.');
  });

  it('is not marked invalid without an error', () => {
    render(Field, { props: { spec: text, value: '' } });
    expect(screen.getByRole('textbox', { name: 'Task' })).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('puts the test id on the control', () => {
    render(Field, { props: { spec: text, value: 'x', testId: 'manager-task' } });
    expect(screen.getByTestId('manager-task')).toHaveValue('x');
  });
});

describe('Field controls', () => {
  it('text: reads and writes its value', async () => {
    const oninput = vi.fn();
    render(Field, { props: { spec: text, value: 'sync', oninput } });

    const input = screen.getByRole('textbox', { name: 'Task' }) as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveValue('sync');
    await fireEvent.input(input, { target: { value: 'review' } });

    expect(oninput).toHaveBeenLastCalledWith('review');
  });

  it('textarea: reads and writes its value over the given rows', async () => {
    const oninput = vi.fn();
    render(Field, {
      props: { spec: { attr: 'prompt', label: 'Instructions', control: 'textarea', rows: 7, help: 'h' }, value: 'brief', oninput },
    });

    const area = screen.getByRole('textbox', { name: 'Instructions' });
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toHaveAttribute('rows', '7');
    expect(area).toHaveValue('brief');
    expect(area.className).not.toMatch(/font-mono/);
    await fireEvent.input(area, { target: { value: 'new brief' } });

    expect(oninput).toHaveBeenLastCalledWith('new brief');
  });

  it('code: a monospace textarea that reads and writes its value', async () => {
    const oninput = vi.fn();
    render(Field, {
      props: { spec: { attr: 'config', label: 'Settings (JSON)', control: 'code', help: 'h' }, value: '{}', oninput },
    });

    const area = screen.getByRole('textbox', { name: 'Settings (JSON)' });
    expect(area.tagName).toBe('TEXTAREA');
    expect(area.className).toMatch(/font-mono/);
    expect(area).toHaveValue('{}');
    await fireEvent.input(area, { target: { value: '{"a":1}' } });

    expect(oninput).toHaveBeenLastCalledWith('{"a":1}');
  });

  it('choice: real radios in a fieldset with a legend, checked from the value', async () => {
    const oninput = vi.fn();
    const choice: FieldSpec = {
      attr: 'tool_mode',
      label: 'What should this step run?',
      control: 'choice',
      help: 'Choose one. A step cannot do both.',
      options: [
        { value: 'builtin', title: 'Built-in tool', desc: 'A ready-made check or capture from Smasher.' },
        { value: 'command', title: 'Shell command', desc: 'Any command on your computer.' },
      ],
    };
    render(Field, { props: { spec: choice, value: 'builtin', oninput, testId: 'tool-mode' } });

    const group = screen.getByRole('group', { name: 'What should this step run?' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group.querySelector('legend')).not.toBeNull();
    expect(group).toHaveAccessibleDescription('Choose one. A step cannot do both.');
    expect(screen.getByTestId('tool-mode')).toBe(group);
    const builtin = within(group).getByRole('radio', { name: /Built-in tool/ }) as HTMLInputElement;
    const command = within(group).getByRole('radio', { name: /Shell command/ }) as HTMLInputElement;
    expect(builtin.type).toBe('radio');
    expect(builtin.checked).toBe(true);
    expect(command.checked).toBe(false);
    expect(screen.getByText('Any command on your computer.')).toBeInTheDocument();

    await fireEvent.click(command);

    expect(oninput).toHaveBeenLastCalledWith('command');
  });

  it('choice: checks nothing when the value is not one of the options', () => {
    render(Field, {
      props: {
        spec: { attr: 'tool', label: 'Tool', control: 'choice', help: 'h', options: [{ value: 'a', title: 'A', desc: 'd' }] },
        value: 'shell',
      },
    });
    expect((screen.getByRole('radio', { name: /A/ }) as HTMLInputElement).checked).toBe(false);
  });

  it('switch: shows On or Off and writes the new state', async () => {
    const onCheckedChange = vi.fn();
    const sw: FieldSpec = { attr: 'fail_fast', label: 'Stop everything if one fails', control: 'switch', help: 'When on, …' };
    render(Field, { props: { spec: sw, checked: false, onCheckedChange } });

    const toggle = screen.getByRole('switch', { name: 'Stop everything if one fails' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Off')).toBeInTheDocument();

    await fireEvent.click(toggle);

    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('model: renders the control it is given under its label and help', () => {
    const picker = createRawSnippet(() => ({ render: () => '<p data-testid="picker">picker</p>' }));
    render(Field, {
      props: { spec: { attr: 'model', label: 'Model', control: 'model', help: 'Which AI model does this step’s work.' }, children: picker },
    });

    const group = screen.getByRole('group', { name: 'Model' });
    expect(group).toHaveAccessibleDescription('Which AI model does this step’s work.');
    expect(within(group).getByTestId('picker')).toBeInTheDocument();
  });
});
