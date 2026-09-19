import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StructuralForm from './StructuralForm.svelte';

// Start/Exit/Parallel/FanIn/Conditional carry no attrs beyond `label` in any
// real handler (graph/mod.rs's node_type_from_shape + ConditionalHandler
// grounding) -- `label` itself is edited via WorkflowCanvasInner's shared
// side-panel field, not duplicated here, so this form has nothing
// kind-specific to render or write.
describe('StructuralForm', () => {
  it('renders without kind-specific inputs, regardless of attrs passed', () => {
    render(StructuralForm, { props: { attrs: { pos: '0,0' }, onChange: vi.fn() } });

    expect(screen.getByTestId('structural-form')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('never calls onChange on its own', () => {
    const onChange = vi.fn();
    render(StructuralForm, { props: { attrs: {}, onChange } });

    expect(onChange).not.toHaveBeenCalled();
  });
});
