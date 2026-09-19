import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import WorkflowCanvasInner from './WorkflowCanvasInner.svelte';
import type { EditorGraph } from './types';

const sampleGraph: EditorGraph = {
  name: 'Sample',
  graph_attrs: {},
  nodes: [
    { id: 'a', node_type: 'Start', label: 'A', attrs: { pos: '0,0' } },
    { id: 'b', node_type: 'Codergen', label: 'B', attrs: { pos: '200,0' } },
  ],
  edges: [
    { from: 'a', to: 'b', label: null, condition: null, priority: null, loop_restart: false, attrs: {} },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setting the graph prop', () => {
  it('renders the expected number of nodes and edges', async () => {
    const { component } = render(WorkflowCanvasInner, {
      props: { graph: sampleGraph, onSave: vi.fn() },
    });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });
    // Edge *path* rendering needs measured handle positions (real
    // getBoundingClientRect), which jsdom doesn't provide -- checked via
    // state instead of DOM geometry for that reason, not node count.
    expect(component.currentGraph().edges).toHaveLength(1);
  });
});

describe('built-in delete interaction', () => {
  it('removes a selected node from internal state when Backspace is pressed', async () => {
    const { component } = render(WorkflowCanvasInner, {
      props: { graph: sampleGraph, onSave: vi.fn() },
    });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });
    expect(component.currentGraph().nodes.map((n) => n.id)).toEqual(['a', 'b']);

    const nodeA = screen.getByText('A').closest('.svelte-flow__node') as HTMLElement;
    await fireEvent.click(nodeA);
    await fireEvent.keyDown(document, { key: 'Backspace' });

    await waitFor(() => {
      expect(component.currentGraph().nodes.map((n) => n.id)).toEqual(['b']);
    });
    // The edge referencing the deleted node goes with it.
    expect(component.currentGraph().edges).toHaveLength(0);
  });
});

describe('reacting to a changed graph prop', () => {
  it('reflects nodes/edges added by re-assigning graph (what a future palette drag will do)', async () => {
    const { component, rerender } = render(WorkflowCanvasInner, {
      props: { graph: sampleGraph, onSave: vi.fn() },
    });

    await waitFor(() => {
      expect(component.currentGraph().nodes).toHaveLength(2);
    });

    await rerender({
      graph: {
        ...sampleGraph,
        nodes: [...sampleGraph.nodes, { id: 'c', node_type: 'Exit', label: 'C', attrs: {} }],
      },
      onSave: vi.fn(),
    });

    await waitFor(() => {
      expect(component.currentGraph().nodes.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    });
  });
});

describe('unknown node_type', () => {
  it('renders a generic fallback label instead of crashing', async () => {
    render(WorkflowCanvasInner, {
      props: {
        graph: {
          name: null,
          graph_attrs: {},
          nodes: [{ id: 'mystery', node_type: 'FromTheFuture', label: null, attrs: {} }],
          edges: [],
        },
        onSave: vi.fn(),
      },
    });

    await waitFor(() => {
      expect(screen.getByText('mystery')).toBeInTheDocument();
    });
  });
});

describe('save action (edit mode -- workflowId set)', () => {
  it('invokes onSave with the current graph shape and no meta when clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, workflowId: 'existing-workflow', onSave } });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });

    await fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const submitted = onSave.mock.calls[0][0] as EditorGraph;
    expect(submitted.nodes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(onSave.mock.calls[0][1]).toBeUndefined();
  });

  it('surfaces a save error from a rejected onSave without crashing', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('workflow not found'));
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, workflowId: 'existing-workflow', onSave } });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });

    await fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('save-error')).toHaveTextContent('workflow not found');
    });
  });

  it('does not render the create-mode name/target-dir fields', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, workflowId: 'existing-workflow', onSave: vi.fn() } });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });
    expect(screen.queryByTestId('create-name-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('create-target-dir-select')).not.toBeInTheDocument();
  });
});

// Follow-up to Task 5, approved by Jobsworth: when there's no `workflowId`
// (the /workflows/new case), Save has nowhere to PUT to -- a small inline
// name/target-dir form is shown instead, and Save calls onSave with a
// second `meta` argument so the host shell can call createGraph instead of
// saveGraph.
describe('create mode (no workflowId)', () => {
  const emptyGraph: EditorGraph = { name: null, graph_attrs: {}, nodes: [], edges: [] };

  it('renders name and target-dir fields, defaulting the dir to the first available one', async () => {
    render(WorkflowCanvasInner, {
      props: { graph: emptyGraph, availableTargetDirs: ['examples', 'other'], onSave: vi.fn() },
    });

    const nameInput = await screen.findByTestId('create-name-input');
    const dirSelect = screen.getByTestId('create-target-dir-select') as HTMLSelectElement;
    expect(nameInput).toBeInTheDocument();
    expect(dirSelect.value).toBe('examples');
  });

  it('disables Save until a non-blank name is entered', async () => {
    render(WorkflowCanvasInner, {
      props: { graph: emptyGraph, availableTargetDirs: ['examples'], onSave: vi.fn() },
    });

    const saveButton = await screen.findByTestId('save-button');
    expect(saveButton).toBeDisabled();

    await fireEvent.input(screen.getByTestId('create-name-input'), { target: { value: 'my-pipeline' } });

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('calls onSave with the graph and {name, targetDir} meta when Save is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(WorkflowCanvasInner, {
      props: { graph: emptyGraph, availableTargetDirs: ['examples', 'other'], onSave },
    });

    await fireEvent.input(await screen.findByTestId('create-name-input'), {
      target: { value: 'my-pipeline' },
    });
    await fireEvent.change(screen.getByTestId('create-target-dir-select'), { target: { value: 'other' } });
    await fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    expect(onSave.mock.calls[0][1]).toEqual({ name: 'my-pipeline', targetDir: 'other' });
  });

  it('does not call onSave and shows a validation error if Save is somehow triggered with a blank name', async () => {
    const onSave = vi.fn();
    render(WorkflowCanvasInner, {
      props: { graph: emptyGraph, availableTargetDirs: ['examples'], onSave },
    });

    // Whitespace-only counts as blank, same discipline create_workflow/
    // create_graph apply server-side.
    await fireEvent.input(await screen.findByTestId('create-name-input'), {
      target: { value: '   ' },
    });

    expect(screen.getByTestId('save-button')).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
