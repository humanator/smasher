import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ManagerForm from './ManagerForm.svelte';

// Grounded in manager_handler.rs:49-90: `task` (falls back to node label)
// and `config`, a JSON-encoded string -- same parse-and-fail-at-run-time
// treatment as ToolForm's `args`.
describe('ManagerForm', () => {
  it('pre-populates task/config from attrs', () => {
    render(ManagerForm, {
      props: { attrs: { task: 'coordinate-review', config: '{"depth":2}' }, onChange: vi.fn() },
    });

    expect(screen.getByTestId('manager-task')).toHaveValue('coordinate-review');
    expect(screen.getByTestId('manager-config')).toHaveValue('{"depth":2}');
    expect(screen.queryByTestId('manager-config-error')).not.toBeInTheDocument();
  });

  it('calls onChange with the updated task as the user types', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('manager-task'), { target: { value: 'fan-out-review' } });

    expect(onChange).toHaveBeenCalledWith({ attrs: { task: 'fan-out-review' } });
  });

  it('invalid JSON in config surfaces a visible error without throwing', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: {}, onChange } });

    await expect(
      fireEvent.input(screen.getByTestId('manager-config'), { target: { value: '{bad' } }),
    ).resolves.not.toThrow();

    expect(screen.getByTestId('manager-config-error')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { config: '{bad' } });
  });

  it('clearing config back to blank removes the attr and clears the error', async () => {
    const onChange = vi.fn();
    render(ManagerForm, { props: { attrs: { config: '{bad' }, onChange } });
    expect(screen.getByTestId('manager-config-error')).toBeInTheDocument();

    await fireEvent.input(screen.getByTestId('manager-config'), { target: { value: '' } });

    expect(screen.queryByTestId('manager-config-error')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { config: undefined } });
  });
});
