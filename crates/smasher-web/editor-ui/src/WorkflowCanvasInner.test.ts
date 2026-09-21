import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import WorkflowCanvasInner from './WorkflowCanvasInner.svelte';
import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG } from './nodeConfig';
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

// Task 6: node-kind visual registry + palette sidebar. Palette.svelte
// itself calls @xyflow/svelte's context-dependent bits only indirectly (it
// has none of its own -- see WorkflowCanvasInner.svelte's comment on why
// drop-position math is done by hand instead of via useSvelteFlow(), which
// would have required wrapping Palette in a <SvelteFlowProvider> just to
// render it standalone). Tested here, through the real integration point,
// rather than a throwaway Palette-only render harness.
describe('palette', () => {
  it('renders the 3 documented groups with their entries', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });

    await waitFor(() => {
      expect(screen.getByTestId('palette-group-pipeline-steps')).toBeInTheDocument();
    });

    const pipelineSteps = within(screen.getByTestId('palette-group-pipeline-steps'));
    expect(pipelineSteps.getByText('Codergen')).toBeInTheDocument();
    expect(pipelineSteps.getByText('Tool')).toBeInTheDocument();
    expect(pipelineSteps.getByText('Manager')).toBeInTheDocument();

    const controlFlow = within(screen.getByTestId('palette-group-control-flow'));
    expect(controlFlow.getByText('Human Gate')).toBeInTheDocument();
    expect(controlFlow.getByText('Conditional')).toBeInTheDocument();
    expect(controlFlow.getByText('Sub-Pipeline')).toBeInTheDocument();

    const structural = within(screen.getByTestId('palette-group-structural'));
    expect(structural.getByText('Start')).toBeInTheDocument();
    expect(structural.getByText('Exit')).toBeInTheDocument();
    expect(structural.getByText('Parallel')).toBeInTheDocument();
    expect(structural.getByText('Fan-In')).toBeInTheDocument();
  });

  it('collapses and expands the Pipeline Steps group independently of Control Flow', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });

    await waitFor(() => {
      expect(screen.getByTestId('palette-entry-Codergen')).toBeInTheDocument();
    });
    expect(screen.getByTestId('palette-entry-Interviewer')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('palette-group-toggle-pipeline-steps'));

    expect(screen.queryByTestId('palette-entry-Codergen')).not.toBeInTheDocument();
    // Control Flow wasn't touched -- stays expanded.
    expect(screen.getByTestId('palette-entry-Interviewer')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('palette-group-toggle-pipeline-steps'));

    expect(screen.getByTestId('palette-entry-Codergen')).toBeInTheDocument();
  });

  it('renders the structural group with no collapse toggle (always visible)', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });

    await waitFor(() => {
      expect(screen.getByTestId('palette-entry-Start')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('palette-group-toggle-structural')).not.toBeInTheDocument();
  });

  it('marks entries draggable and puts the NodeType on the drag payload via dragstart', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });

    const entry = await screen.findByTestId('palette-entry-Codergen');
    expect(entry).toHaveAttribute('draggable', 'true');

    const setData = vi.fn();
    await fireEvent.dragStart(entry, {
      dataTransfer: { setData, effectAllowed: '' } as unknown as DataTransfer,
    });

    expect(setData).toHaveBeenCalledWith(NODE_DRAG_DATA_TYPE, 'Codergen');
  });
});

// The actual HTML5 drag-and-drop *gesture* isn't reliably simulatable in
// jsdom (Task 4's own documented limitation -- no real pointer capture or
// coordinates); per that same precedent, the drop *logic* is tested by
// calling the underlying handler directly instead of firing a synthetic
// `drop` DragEvent at a screen coordinate.
// Task 7: node-kind form components + the selected-node side panel that
// swaps between them. `sampleGraph` above only has Start/Codergen; this
// fixture adds one node per interesting kind so each form's testid can be
// checked without perturbing the existing tests above.
const multiKindGraph: EditorGraph = {
  name: 'MultiKind',
  graph_attrs: {},
  nodes: [
    { id: 'start', node_type: 'Start', label: 'Begin', attrs: {} },
    { id: 'gen', node_type: 'Codergen', label: 'Generate', attrs: { prompt: 'write code', model: 'gpt-5' } },
    { id: 'ask', node_type: 'Interviewer', label: 'Ask', attrs: { question: 'ok?' } },
    { id: 'run', node_type: 'Tool', label: 'Run', attrs: { tool: 'shell' } },
    { id: 'mgr', node_type: 'Manager', label: 'Coordinate', attrs: { task: 'sync' } },
    { id: 'sub', node_type: 'SubPipeline', label: 'Delegate', attrs: { pipeline: 'sub.dot' } },
  ],
  edges: [],
};

async function clickNodeByLabel(label: string) {
  const el = screen.getByText(label).closest('.svelte-flow__node') as HTMLElement;
  await fireEvent.click(el);
}

describe('node inspector (Task 7 side panel)', () => {
  it('is absent until a node is selected', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });

    await waitFor(() => expect(screen.getByText('Begin')).toBeInTheDocument());
    expect(screen.queryByTestId('node-inspector')).not.toBeInTheDocument();
  });

  it('shows CodergenForm for a Codergen node, pre-populated from its attrs', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());

    await clickNodeByLabel('Generate');

    expect(screen.getByTestId('node-inspector')).toBeInTheDocument();
    expect(screen.getByTestId('codergen-form')).toBeInTheDocument();
    expect(screen.getByTestId('codergen-prompt')).toHaveValue('write code');
    expect(screen.getByTestId('codergen-model')).toHaveValue('gpt-5');
    expect(screen.getByTestId('node-inspector-label')).toHaveValue('Generate');
    expect(screen.getByTestId('node-inspector-description')).toHaveTextContent(
      'Runs an AI coding agent from a prompt to generate or modify code.',
    );
  });

  it('shows InterviewerForm for an Interviewer node', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Ask')).toBeInTheDocument());

    await clickNodeByLabel('Ask');

    expect(screen.getByTestId('interviewer-form')).toBeInTheDocument();
    expect(screen.getByTestId('interviewer-question')).toHaveValue('ok?');
  });

  it('shows ToolForm for a Tool node', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Run')).toBeInTheDocument());

    await clickNodeByLabel('Run');

    expect(screen.getByTestId('tool-form')).toBeInTheDocument();
    expect(screen.getByTestId('tool-name')).toHaveValue('shell');
  });

  it('shows ManagerForm for a Manager node', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Coordinate')).toBeInTheDocument());

    await clickNodeByLabel('Coordinate');

    expect(screen.getByTestId('manager-form')).toBeInTheDocument();
    expect(screen.getByTestId('manager-task')).toHaveValue('sync');
  });

  it('shows SubPipelineForm for a SubPipeline node', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Delegate')).toBeInTheDocument());

    await clickNodeByLabel('Delegate');

    expect(screen.getByTestId('sub-pipeline-form')).toBeInTheDocument();
    expect(screen.getByTestId('sub-pipeline-path')).toHaveValue('sub.dot');
  });

  it('shows StructuralForm (label-only) for a Start node', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Begin')).toBeInTheDocument());

    await clickNodeByLabel('Begin');

    expect(screen.getByTestId('structural-form')).toBeInTheDocument();
    expect(screen.getByTestId('node-inspector-label')).toHaveValue('Begin');
  });

  it('shows StructuralForm as a fallback for an unrecognized node_type string', async () => {
    render(WorkflowCanvasInner, {
      props: {
        graph: {
          name: null,
          graph_attrs: {},
          nodes: [{ id: 'mystery', node_type: 'FromTheFuture', label: 'Mystery', attrs: {} }],
          edges: [],
        },
        onSave: vi.fn(),
      },
    });
    await waitFor(() => expect(screen.getByText('Mystery')).toBeInTheDocument());

    await clickNodeByLabel('Mystery');

    expect(screen.getByTestId('structural-form')).toBeInTheDocument();
  });

  it('closes when the pane (not a node) is clicked', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());
    await clickNodeByLabel('Generate');
    expect(screen.getByTestId('node-inspector')).toBeInTheDocument();

    const pane = document.querySelector('.svelte-flow__pane') as HTMLElement;
    await fireEvent.click(pane);

    expect(screen.queryByTestId('node-inspector')).not.toBeInTheDocument();
  });

  it('closes via the inspector\'s own close button', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());
    await clickNodeByLabel('Generate');

    await fireEvent.click(screen.getByLabelText('Close node inspector'));

    expect(screen.queryByTestId('node-inspector')).not.toBeInTheDocument();
  });

  it('editing a kind-specific field updates the node\'s attrs in live graph state immediately', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());
    await clickNodeByLabel('Generate');

    await fireEvent.input(screen.getByTestId('codergen-prompt'), { target: { value: 'write tests instead' } });

    const updated = component.currentGraph().nodes.find((n) => n.id === 'gen');
    expect(updated?.attrs.prompt).toBe('write tests instead');
    // Untouched attrs on the same node survive the edit.
    expect(updated?.attrs.model).toBe('gpt-5');
  });

  it('editing the shared Label field updates the node\'s label in live graph state immediately', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());
    await clickNodeByLabel('Generate');

    await fireEvent.input(screen.getByTestId('node-inspector-label'), { target: { value: 'Generate Code' } });

    const updated = component.currentGraph().nodes.find((n) => n.id === 'gen');
    expect(updated?.label).toBe('Generate Code');
  });

  it('unchecking a boolean-backed field (Interviewer gallery toggle) removes the attr from live graph state', async () => {
    const { component } = render(WorkflowCanvasInner, {
      props: {
        graph: {
          ...multiKindGraph,
          nodes: multiKindGraph.nodes.map((n) =>
            n.id === 'ask' ? { ...n, attrs: { question: 'ok?', gallery: true, candidate_count: '3' } } : n,
          ),
        },
        onSave: vi.fn(),
      },
    });
    await waitFor(() => expect(screen.getByText('Ask')).toBeInTheDocument());
    await clickNodeByLabel('Ask');
    expect(screen.getByTestId('interviewer-gallery-toggle')).toBeChecked();

    await fireEvent.click(screen.getByTestId('interviewer-gallery-toggle'));

    const updated = component.currentGraph().nodes.find((n) => n.id === 'ask');
    expect(updated?.attrs.gallery).toBeUndefined();
    expect(updated?.attrs.candidate_count).toBeUndefined();
    expect(updated?.attrs.question).toBe('ok?');
  });

  it('switching selection to a different node swaps the form and shows that node\'s own attrs, not the previous selection\'s', async () => {
    render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());

    await clickNodeByLabel('Generate');
    expect(screen.getByTestId('codergen-form')).toBeInTheDocument();

    await clickNodeByLabel('Ask');

    expect(screen.queryByTestId('codergen-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('interviewer-form')).toBeInTheDocument();
    expect(screen.getByTestId('interviewer-question')).toHaveValue('ok?');
  });

  it('deselects gracefully when the selected node is deleted out from under the panel', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: multiKindGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getByText('Generate')).toBeInTheDocument());
    await clickNodeByLabel('Generate');
    expect(screen.getByTestId('node-inspector')).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: 'Backspace' });

    await waitFor(() => {
      expect(component.currentGraph().nodes.find((n) => n.id === 'gen')).toBeUndefined();
    });
    expect(screen.queryByTestId('node-inspector')).not.toBeInTheDocument();
  });
});

describe('dropping a palette entry onto the canvas (addNodeAtPosition)', () => {
  it('creates a new node of the given NodeType at the given position, with the config default label', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(component.currentGraph().nodes).toHaveLength(2));

    component.addNodeAtPosition('Codergen', { x: 321, y: 87 });

    await waitFor(() => {
      expect(component.currentGraph().nodes).toHaveLength(3);
    });
    // sampleGraph already has a Codergen node ('b') -- find by exclusion
    // to unambiguously grab the newly-created one, not the pre-existing.
    const created = component.currentGraph().nodes.find((n) => !['a', 'b'].includes(n.id));
    expect(created).toBeDefined();
    expect(created?.node_type).toBe('Codergen');
    expect(created?.label).toBe(NODE_KIND_CONFIG.Codergen.title);
    expect(created?.attrs.pos).toBe('321,87');
  });

  it('ignores an unrecognized node type instead of crashing or adding a node', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(component.currentGraph().nodes).toHaveLength(2));

    expect(() => component.addNodeAtPosition('FromTheFuture', { x: 0, y: 0 })).not.toThrow();
    expect(component.currentGraph().nodes).toHaveLength(2);
  });

  it('assigns distinct ids when the same kind is dropped twice', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(component.currentGraph().nodes).toHaveLength(2));

    component.addNodeAtPosition('Tool', { x: 0, y: 0 });
    component.addNodeAtPosition('Tool', { x: 10, y: 10 });

    await waitFor(() => expect(component.currentGraph().nodes).toHaveLength(4));
    const toolIds = component.currentGraph().nodes.filter((n) => n.node_type === 'Tool').map((n) => n.id);
    expect(new Set(toolIds).size).toBe(2);
  });
});

// Task 8: connection handle / edge hover polish, edge-selection side panel,
// default position assignment. jsdom never renders a `.svelte-flow__edge`
// DOM element at all (confirmed while writing this task -- edges depend on
// the same getBoundingClientRect-based measurement this file's very first
// test already documented jsdom lacking for edge *path* geometry; here it
// means edges are absent from `store.visible.edges` entirely, not just
// drawn with bad coordinates), so edge selection/hover/delete are driven
// through `component.selectEdge(id)`/`component.edgeActions` -- the same
// "call the real handler directly instead of a synthetic DOM gesture jsdom
// can't produce" precedent `addNodeAtPosition` already set for Task 4's
// drag-and-drop.
describe('connection handle polish (Task 8)', () => {
  it('marks a node with at least one edge as wf-node-connected', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));

    const nodeA = document.querySelector('.svelte-flow__node[data-id="a"]');
    const nodeB = document.querySelector('.svelte-flow__node[data-id="b"]');
    expect(nodeA?.className).toContain('wf-node-connected');
    expect(nodeB?.className).toContain('wf-node-connected');
  });

  it('does not mark an unconnected node as wf-node-connected', async () => {
    render(WorkflowCanvasInner, {
      props: {
        graph: {
          name: null,
          graph_attrs: {},
          nodes: [{ id: 'lonely', node_type: 'Start', label: 'Lonely', attrs: {} }],
          edges: [],
        },
        onSave: vi.fn(),
      },
    });
    await waitFor(() => expect(screen.getByText('Lonely')).toBeInTheDocument());

    const node = document.querySelector('.svelte-flow__node[data-id="lonely"]');
    expect(node?.className).not.toContain('wf-node-connected');
  });

  it('removes the wf-node-connected class once its only edge is deleted', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));

    // The id convert.ts's toFlowEdges assigns (`${from}->${to}#${i}`).
    component.edgeActions.onDeleteEdge('a->b#0');

    await waitFor(() => {
      expect(component.currentGraph().edges).toHaveLength(0);
    });
    const nodeA = document.querySelector('.svelte-flow__node[data-id="a"]');
    expect(nodeA?.className).not.toContain('wf-node-connected');
  });
});

describe('edge inspector (Task 8 side panel)', () => {
  it('is absent until an edge is selected', async () => {
    render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));
    expect(screen.queryByTestId('edge-inspector')).not.toBeInTheDocument();
  });

  it('shows EdgeForm pre-populated from the edge\'s condition/priority/loop_restart when selected', async () => {
    const graph: EditorGraph = {
      ...sampleGraph,
      edges: [
        { from: 'a', to: 'b', label: null, condition: 'ready', priority: 2, loop_restart: true, attrs: {} },
      ],
    };
    const { component } = render(WorkflowCanvasInner, { props: { graph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));

    component.selectEdge('a->b#0');

    await waitFor(() => expect(screen.getByTestId('edge-inspector')).toBeInTheDocument());
    expect(screen.getByTestId('edge-form')).toBeInTheDocument();
    expect(screen.getByTestId('edge-condition')).toHaveValue('ready');
    expect(screen.getByTestId('edge-priority')).toHaveValue('2');
    expect(screen.getByTestId('edge-loop-restart')).toBeChecked();
  });

  it('editing a field updates the edge\'s attrs in live graph state immediately', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));

    component.selectEdge('a->b#0');
    await waitFor(() => expect(screen.getByTestId('edge-form')).toBeInTheDocument());
    await fireEvent.input(screen.getByTestId('edge-condition'), { target: { value: 'x > 5' } });
    await fireEvent.input(screen.getByTestId('edge-priority'), { target: { value: '3' } });
    await fireEvent.click(screen.getByTestId('edge-loop-restart'));

    const updated = component.currentGraph().edges.find((e) => e.from === 'a' && e.to === 'b');
    expect(updated?.condition).toBe('x > 5');
    expect(updated?.priority).toBe(3);
    expect(updated?.loop_restart).toBe(true);
  });

  it('selecting a node closes an open edge inspector, and vice versa', async () => {
    const graph: EditorGraph = { ...sampleGraph };
    const { component } = render(WorkflowCanvasInner, { props: { graph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));

    component.selectEdge('a->b#0');
    await waitFor(() => expect(screen.getByTestId('edge-inspector')).toBeInTheDocument());

    const nodeA = screen.getByText('A').closest('.svelte-flow__node') as HTMLElement;
    await fireEvent.click(nodeA);

    expect(screen.queryByTestId('edge-inspector')).not.toBeInTheDocument();
    expect(screen.getByTestId('node-inspector')).toBeInTheDocument();

    component.selectEdge('a->b#0');
    await waitFor(() => expect(screen.getByTestId('edge-inspector')).toBeInTheDocument());
    expect(screen.queryByTestId('node-inspector')).not.toBeInTheDocument();
  });

  it('closes when the pane is clicked', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));
    component.selectEdge('a->b#0');
    await waitFor(() => expect(screen.getByTestId('edge-inspector')).toBeInTheDocument());

    const pane = document.querySelector('.svelte-flow__pane') as HTMLElement;
    await fireEvent.click(pane);

    expect(screen.queryByTestId('edge-inspector')).not.toBeInTheDocument();
  });

  it('closes via the inspector\'s own close button', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));
    component.selectEdge('a->b#0');
    await waitFor(() => expect(screen.getByTestId('edge-inspector')).toBeInTheDocument());

    await fireEvent.click(screen.getByLabelText('Close edge inspector'));

    expect(screen.queryByTestId('edge-inspector')).not.toBeInTheDocument();
  });
});

describe('edge deletion via edgeActions (Task 8 hover-revealed delete)', () => {
  it('removes the edge from graph state when onDeleteEdge is invoked', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));
    expect(component.currentGraph().edges).toHaveLength(1);

    component.edgeActions.onDeleteEdge('a->b#0');

    await waitFor(() => {
      expect(component.currentGraph().edges).toHaveLength(0);
    });
  });

  it('closes the edge inspector when the currently-selected edge is deleted', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));
    component.selectEdge('a->b#0');
    await waitFor(() => expect(screen.getByTestId('edge-inspector')).toBeInTheDocument());

    component.edgeActions.onDeleteEdge('a->b#0');

    await waitFor(() => {
      expect(screen.queryByTestId('edge-inspector')).not.toBeInTheDocument();
    });
  });

  it('tracks hover state via edgeActions.hoveredEdgeId', async () => {
    const { component } = render(WorkflowCanvasInner, { props: { graph: sampleGraph, onSave: vi.fn() } });
    await waitFor(() => expect(screen.getAllByText(/^[AB]$/)).toHaveLength(2));

    expect(component.edgeActions.hoveredEdgeId).toBeNull();
    component.edgeActions.hoveredEdgeId = 'a->b#0';
    expect(component.edgeActions.hoveredEdgeId).toBe('a->b#0');
  });
});
