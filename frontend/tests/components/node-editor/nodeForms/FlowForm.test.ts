// ABOUTME: Tests for FlowForm.svelte, the settings for Split, Join, Start, Finish, Branch and unknown kinds
// ABOUTME: Split writes max_concurrency and fail_fast (parallel.rs); the others show their notes

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import FlowForm from '../../../../src/components/node-editor/nodeForms/FlowForm.svelte';
import { KIND_NOTES } from '../../../../src/lib/stepFields';

// parallel.rs's parallel_attrs_from_node reads max_concurrency as a Number
// and fail_fast as a Bool, falling back to 10 and false; any other type is
// ignored. A string "4" would round-trip into the .dot file as "4" (a
// String), so a whole number is written as a number.

describe('FlowForm', () => {
  describe('Split', () => {
    it('shows At most at once and Stop everything if one fails, seeded from attrs', () => {
      render(FlowForm, { props: { handler: 'Parallel', attrs: { max_concurrency: 4, fail_fast: true }, onChange: vi.fn() } });

      const most = screen.getByRole('textbox', { name: 'At most at once' });
      expect(most).toBe(screen.getByTestId('parallel-max-concurrency'));
      expect(most).toHaveValue('4');
      expect(most).toHaveAccessibleDescription('Limits how many paths run at the same time.');
      const failFast = screen.getByRole('switch', { name: 'Stop everything if one fails' });
      expect(failFast).toBe(screen.getByTestId('parallel-fail-fast'));
      expect(failFast).toBeChecked();
    });

    it('starts blank and off on a new Split', () => {
      render(FlowForm, { props: { handler: 'Parallel', attrs: {}, onChange: vi.fn() } });

      expect(screen.getByTestId('parallel-max-concurrency')).toHaveValue('');
      expect(screen.getByTestId('parallel-fail-fast')).not.toBeChecked();
    });

    it('writes a whole number as a number, other text as-is, and removes a blank', async () => {
      const onChange = vi.fn();
      render(FlowForm, { props: { handler: 'Parallel', attrs: {}, onChange } });
      const most = screen.getByTestId('parallel-max-concurrency');

      await fireEvent.input(most, { target: { value: ' 3 ' } });
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { max_concurrency: 3 } });

      await fireEvent.input(most, { target: { value: 'lots' } });
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { max_concurrency: 'lots' } });

      await fireEvent.input(most, { target: { value: '' } });
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { max_concurrency: undefined } });
    });

    it('turning Stop everything on writes fail_fast=true, and off removes it (the default)', async () => {
      const onChange = vi.fn();
      render(FlowForm, { props: { handler: 'Parallel', attrs: {}, onChange } });

      await fireEvent.click(screen.getByTestId('parallel-fail-fast'));
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { fail_fast: true } });

      await fireEvent.click(screen.getByTestId('parallel-fail-fast'));
      expect(onChange).toHaveBeenLastCalledWith({ attrs: { fail_fast: undefined } });
    });
  });

  it.each([
    ['FanIn', KIND_NOTES.FanIn],
    ['Start', 'This step has no settings beyond its name.'],
    ['Exit', 'This step has no settings beyond its name.'],
  ])('%s shows its note and no fields', (handler, note) => {
    render(FlowForm, { props: { handler, attrs: { pos: '0,0' }, onChange: vi.fn() } });

    expect(screen.getByTestId('flow-form')).toHaveTextContent(note);
    expect(screen.queryByRole('textbox')).toBe(null);
    expect(screen.queryByRole('switch')).toBe(null);
  });

  it('Join explains that it waits for the paths a Split started', () => {
    render(FlowForm, { props: { handler: 'FanIn', attrs: {}, onChange: vi.fn() } });

    expect(screen.getByText(/It waits for the paths started by a Split\./)).toBeInTheDocument();
  });

  it('an unrecognized kind shows the no-settings note rather than crashing', () => {
    render(FlowForm, { props: { handler: 'FromTheFuture', attrs: {}, onChange: vi.fn() } });

    expect(screen.getByTestId('flow-form')).toHaveTextContent('This step has no settings beyond its name.');
  });

  it('never calls onChange on its own', () => {
    const onChange = vi.fn();
    render(FlowForm, { props: { handler: 'Parallel', attrs: { max_concurrency: 2 }, onChange } });

    expect(onChange).not.toHaveBeenCalled();
  });
});
