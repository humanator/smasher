// ABOUTME: Tests for EdgeForm.svelte, the Task 8 edge-selection side-panel
// ABOUTME: form for condition/priority/loop_restart (grounded in graph/mod.rs).
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import EdgeForm from './EdgeForm.svelte';

describe('EdgeForm', () => {
  it('renders pre-populated from condition/priority/loopRestart props', () => {
    render(EdgeForm, {
      props: { condition: 'x > 5', priority: 2, loopRestart: true, onChange: vi.fn() },
    });

    expect(screen.getByTestId('edge-condition')).toHaveValue('x > 5');
    expect(screen.getByTestId('edge-priority')).toHaveValue('2');
    expect(screen.getByTestId('edge-loop-restart')).toBeChecked();
  });

  it('renders blank/unchecked fields when condition/priority are null and loopRestart is false', () => {
    render(EdgeForm, {
      props: { condition: null, priority: null, loopRestart: false, onChange: vi.fn() },
    });

    expect(screen.getByTestId('edge-condition')).toHaveValue('');
    expect(screen.getByTestId('edge-priority')).toHaveValue('');
    expect(screen.getByTestId('edge-loop-restart')).not.toBeChecked();
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
    expect(screen.getByTestId('edge-priority-error')).toBeInTheDocument();
  });

  it('calls onChange with the toggled loopRestart boolean', async () => {
    const onChange = vi.fn();
    render(EdgeForm, { props: { condition: null, priority: null, loopRestart: false, onChange } });

    await fireEvent.click(screen.getByTestId('edge-loop-restart'));

    expect(onChange).toHaveBeenCalledWith({ loopRestart: true });
  });
});
