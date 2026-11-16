// ABOUTME: Tests for EdgeForm.svelte, the connection's Settings tab: Label, Take this path when…, Priority,
// ABOUTME: Go back and redo and the Rule syntax disclosure (grounded in graph/mod.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import EdgeForm from '../../../src/components/node-editor/EdgeForm.svelte';

const blank = { label: null, condition: null, priority: null, loopRestart: false };
const PRIORITY_ERROR = 'Priority must be a whole number, like 1 or 5.';

describe('EdgeForm', () => {
  it('renders pre-populated from label/condition/priority/loopRestart props', () => {
    render(EdgeForm, {
      props: { label: 'retry', condition: 'x > 5', priority: 2, loopRestart: true, onChange: vi.fn() },
    });

    expect(screen.getByRole('textbox', { name: 'Label' })).toBe(screen.getByTestId('edge-label'));
    expect(screen.getByTestId('edge-label')).toHaveValue('retry');
    expect(screen.getByRole('textbox', { name: 'Take this path when…' })).toBe(screen.getByTestId('edge-condition'));
    expect(screen.getByTestId('edge-condition')).toHaveValue('x > 5');
    expect(screen.getByRole('textbox', { name: 'Priority' })).toHaveValue('2');
    const loop = screen.getByRole('switch', { name: 'Go back and redo' });
    expect(loop).toBe(screen.getByTestId('edge-loop-restart'));
    expect(loop).toBeChecked();
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('renders blank and off when label/condition/priority are null and loopRestart is false', () => {
    render(EdgeForm, { props: { ...blank, onChange: vi.fn() } });

    expect(screen.getByTestId('edge-label')).toHaveValue('');
    expect(screen.getByTestId('edge-condition')).toHaveValue('');
    expect(screen.getByTestId('edge-priority')).toHaveValue('');
    expect(screen.getByTestId('edge-loop-restart')).not.toBeChecked();
  });

  it('shows the help under each field', () => {
    render(EdgeForm, { props: { ...blank, onChange: vi.fn() } });

    expect(screen.getByTestId('edge-condition')).toHaveAccessibleDescription(
      'A rule that must be true for the workflow to follow this connection. If left blank, the label is used.',
    );
    expect(screen.getByTestId('edge-priority')).toHaveAccessibleDescription(
      'If more than one connection’s rule is true, the highest number wins. Whole numbers only. The default is 0.',
    );
  });

  it('calls onChange with the new label, and label: null when it is cleared', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, onChange } });

    await fireEvent.input(screen.getByTestId('edge-label'), { target: { value: 'Yes, continue' } });
    expect(onChange).toHaveBeenLastCalledWith({ label: 'Yes, continue' });

    await fireEvent.input(screen.getByTestId('edge-label'), { target: { value: '  ' } });
    expect(onChange).toHaveBeenLastCalledWith({ label: null });
  });

  it('calls onChange with the new condition text as edited', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, onChange } });

    await fireEvent.input(screen.getByTestId('edge-condition'), { target: { value: 'ready' } });

    expect(onChange).toHaveBeenCalledWith({ condition: 'ready' });
  });

  it('calls onChange with condition: null when the condition field is cleared', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, condition: 'ready', onChange } });

    await fireEvent.input(screen.getByTestId('edge-condition'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ condition: null });
  });

  it('fills the condition from a Try chip', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, onChange } });

    await fireEvent.click(screen.getByRole('button', { name: 'outcome=fail' }));

    expect(screen.getByTestId('edge-condition')).toHaveValue('outcome=fail');
    expect(onChange).toHaveBeenLastCalledWith({ condition: 'outcome=fail' });
  });

  it('calls onChange with a parsed integer priority', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, onChange } });

    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: '7' } });

    expect(onChange).toHaveBeenCalledWith({ priority: 7 });
  });

  it('calls onChange with priority: null when the priority field is cleared', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, priority: 3, onChange } });

    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ priority: null });
  });

  it('shows the spec error on the field and does not call onChange for a non-whole-number priority', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, onChange } });

    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: '1.5' } });

    expect(onChange).not.toHaveBeenCalled();
    const priority = screen.getByTestId('edge-priority');
    expect(priority).toHaveAttribute('aria-invalid', 'true');
    expect(priority).toHaveAccessibleDescription(expect.stringContaining(PRIORITY_ERROR));
    expect(screen.getByText(PRIORITY_ERROR)).toBeInTheDocument();

    await fireEvent.input(priority, { target: { value: '5' } });
    expect(priority).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(PRIORITY_ERROR)).toBe(null);
    expect(onChange).toHaveBeenLastCalledWith({ priority: 5 });
  });

  it('calls onChange with the toggled loopRestart boolean', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { ...blank, onChange } });

    await fireEvent.click(screen.getByTestId('edge-loop-restart'));
    expect(onChange).toHaveBeenLastCalledWith({ loopRestart: true });

    await fireEvent.click(screen.getByTestId('edge-loop-restart'));
    expect(onChange).toHaveBeenLastCalledWith({ loopRestart: false });
  });

  it('ends with the Rule syntax disclosure', async () => {
    render(EdgeForm, { props: { ...blank, onChange: vi.fn() } });

    const syntax = screen.getByRole('button', { name: 'Rule syntax' });
    expect(syntax).toHaveAttribute('aria-expanded', 'false');
    await fireEvent.click(syntax);
    expect(screen.getByText('either can be true')).toBeInTheDocument();
  });
});
