import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SubPipelineForm from './SubPipelineForm.svelte';

// Grounded in composition.rs:199-206: `pipeline`, a file path string to
// another .dot file. Missing -> CompositionError::MissingPipelineAttr.
describe('SubPipelineForm', () => {
  it('pre-populates pipeline from attrs', () => {
    render(SubPipelineForm, {
      props: { attrs: { pipeline: 'examples/sub_flow.dot' }, onChange: vi.fn() },
    });

    expect(screen.getByTestId('sub-pipeline-path')).toHaveValue('examples/sub_flow.dot');
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
});
