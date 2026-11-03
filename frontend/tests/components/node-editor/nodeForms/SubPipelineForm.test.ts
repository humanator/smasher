// ABOUTME: Tests for SubPipelineForm.svelte, the Task 17b sub-pipeline node-kind side-panel
// ABOUTME: form for pipeline attribute (grounded in composition.rs).

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SubPipelineForm from '../../../../src/components/node-editor/nodeForms/SubPipelineForm.svelte';

// Grounded in composition.rs:199-206: `pipeline`, a file path string to
// another .dot file. Missing -> CompositionError::MissingPipelineAttr.
describe('SubPipelineForm', () => {
  it('labels the required Workflow file field with the catalogue copy', () => {
    render(SubPipelineForm, { props: { attrs: {}, onChange: vi.fn() } });

    const path = screen.getByRole('textbox', { name: 'Workflow file' });
    expect(path).toBe(screen.getByTestId('sub-pipeline-path'));
    expect(path).toHaveAttribute('placeholder', 'examples/sub_flow.dot');
    expect(path).toHaveAttribute('aria-required', 'true');
    expect(path).toHaveAccessibleDescription('The path to the workflow (.dot file) to run as part of this one.');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('pre-populates pipeline from attrs', () => {
    render(SubPipelineForm, {
      props: { attrs: { pipeline: 'examples/sub_flow.dot' }, onChange: vi.fn() },
    });

    const pathInput = screen.getByTestId('sub-pipeline-path') as HTMLInputElement;
    expect(pathInput.value).toBe('examples/sub_flow.dot');
  });

  it('calls onChange with the updated path as the user types', async () => {
    const onChange = vi.fn();
    render(SubPipelineForm, { props: { attrs: {}, onChange } });

    await fireEvent.input(screen.getByTestId('sub-pipeline-path'), {
      target: { value: 'examples/other.dot' },
    });

    expect(onChange).toHaveBeenCalledWith({ attrs: { pipeline: 'examples/other.dot' } });
  });

  it('clearing the path removes the attr entirely', async () => {
    const onChange = vi.fn();
    render(SubPipelineForm, { props: { attrs: { pipeline: 'x.dot' }, onChange } });

    await fireEvent.input(screen.getByTestId('sub-pipeline-path'), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ attrs: { pipeline: undefined } });
  });

  it('shows the "needs a workflow file" problem on Workflow file when the canvas reports it', () => {
    render(SubPipelineForm, { props: { attrs: {}, problems: ['needs a workflow file'], onChange: vi.fn() } });

    const path = screen.getByTestId('sub-pipeline-path');
    expect(path).toHaveAttribute('aria-invalid', 'true');
    expect(path).toHaveAccessibleDescription(expect.stringContaining('Needs a workflow file.'));
  });

  it('shows no problem on Workflow file when none is reported', () => {
    render(SubPipelineForm, { props: { attrs: { pipeline: 'a.dot' }, problems: [], onChange: vi.fn() } });

    expect(screen.getByTestId('sub-pipeline-path')).not.toHaveAttribute('aria-invalid');
  });
});
