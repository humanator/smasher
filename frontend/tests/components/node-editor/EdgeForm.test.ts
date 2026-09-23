// ABOUTME: Tests for EdgeForm.svelte, the Task 8 edge-selection side-panel
// ABOUTME: form for condition/priority/loop_restart (grounded in graph/mod.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import EdgeForm from '../../../src/components/node-editor/EdgeForm.svelte';

describe('EdgeForm', () => {
  it('renders pre-populated from condition/priority/loopRestart props', () => {
    render(EdgeForm, {
      props: { condition: 'x > 5', priority: 2, loopRestart: true, onChange: vi.fn() },
    });

    const conditionInput = screen.getByTestId('edge-condition') as HTMLInputElement;
    const priorityInput = screen.getByTestId('edge-priority') as HTMLInputElement;
    const loopRestartInput = screen.getByTestId('edge-loop-restart');

    expect(conditionInput.value).toBe('x > 5');
    expect(priorityInput.value).toBe('2');
    expect(loopRestartInput).toBeChecked();
  });

  it('renders blank/unchecked fields when condition/priority are null and loopRestart is false', () => {
    render(EdgeForm, {
      props: { condition: null, priority: null, loopRestart: false, onChange: vi.fn() },
    });

    const conditionInput = screen.getByTestId('edge-condition') as HTMLInputElement;
    const priorityInput = screen.getByTestId('edge-priority') as HTMLInputElement;
    const loopRestartInput = screen.getByTestId('edge-loop-restart');

    expect(conditionInput.value).toBe('');
    expect(priorityInput.value).toBe('');
    expect(loopRestartInput).not.toBeChecked();
  });

  it('calls onChange with the new condition text as edited', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: null, priority: null, loopRestart: false, onChange } });

    await fireEvent.input(screen.getByTestId('edge-condition'), { target: { value: 'ready' } });

    expect(onChange).toHaveBeenCalledWith({ condition: 'ready' });
  });

  it('calls onChange with condition: null when the condition field is cleared', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: 'ready', priority: null, loopRestart: false, onChange } });

    await fireEvent.input(screen.getByTestId('edge-condition'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ condition: null });
  });

  it('calls onChange with a parsed integer priority', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: null, priority: null, loopRestart: false, onChange } });

    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: '7' } });

    expect(onChange).toHaveBeenCalledWith({ priority: 7 });
  });

  it('calls onChange with priority: null when the priority field is cleared', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: null, priority: 3, loopRestart: false, onChange } });

    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({ priority: null });
  });

  it('shows a visible error and does not call onChange for a non-numeric priority', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: null, priority: null, loopRestart: false, onChange } });

    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: 'not-a-number' } });

    expect(onChange).not.toHaveBeenCalled();
    // getByTestId throws if not found, so if this doesn't throw, element exists
    const errorElement = screen.getByTestId('edge-priority-error');
    expect(errorElement).toBeTruthy();
  });

  it('calls onChange with the toggled loopRestart boolean', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: null, priority: null, loopRestart: false, onChange } });

    await fireEvent.click(screen.getByTestId('edge-loop-restart'));

    expect(onChange).toHaveBeenCalledWith({ loopRestart: true });
  });
});
