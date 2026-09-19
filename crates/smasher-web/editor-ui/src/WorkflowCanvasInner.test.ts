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

describe('save action', () => {
  it('invokes onSave with the current graph shape when clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave } });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });

    await fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const submitted = onSave.mock.calls[0][0] as EditorGraph;
    expect(submitted.nodes.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('surfaces a save error from a rejected onSave without crashing', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('workflow not found'));
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave } });

    await waitFor(() => {
      expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2);
    });

    await fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('save-error')).toHaveTextContent('workflow not found');
    });
  });
});
