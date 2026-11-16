<script lang="ts">
  // ABOUTME: Canvas orchestrator for the workflow node editor
  // ABOUTME: Manages nodes, edges, selection, forms, save/create modes

  import {
    Background,
    BackgroundVariant,
    ConnectionMode,
    MarkerType,
    MiniMap,
    SvelteFlow,
    type Edge as FlowEdge,
    type Node as FlowNode,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { setContext, tick, untrack, type Component } from 'svelte';
  import Palette from './Palette.svelte';
  import FlowBridge, { type FlowApi } from './FlowBridge.svelte';
  import StatusBar from './StatusBar.svelte';
  import EditorToolbarActions from './EditorToolbarActions.svelte';
  import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG, type NodeKindConfig } from './nodeConfig';
  import {
    DEFAULT_RANKDIR,
    toEditorGraph,
    toFlowEdges,
    toFlowNodes,
    type WorkflowEdgeData,
    type WorkflowNodeData,
  } from './convert';
  import type { AttrValue, EdgeFormChange, EditorGraph, NodeFormChange, NodeFormProps } from './types';
  import { EDGE_ACTIONS_CONTEXT_KEY, connectionName, type WorkflowEdgeActions } from './edgeContext';
  import { FLOW_DIRECTION_CONTEXT_KEY, type FlowDirection } from './flowDirectionContext';
  import { NODE_STATE_CONTEXT_KEY, type WorkflowNodeState } from './nodeContext';
  import WorkflowEdge from './WorkflowEdge.svelte';
  import Legend from './Legend.svelte';
  import WorkflowNode from './WorkflowNode.svelte';
  import EdgeForm from './EdgeForm.svelte';
  import Inspector, { type InspectorView } from './inspector/Inspector.svelte';
  import Field from './inspector/Field.svelte';
  import CodergenForm from './nodeForms/CodergenForm.svelte';
  import InterviewerForm from './nodeForms/InterviewerForm.svelte';
  import ToolForm from './nodeForms/ToolForm.svelte';
  import ManagerForm from './nodeForms/ManagerForm.svelte';
  import SubPipelineForm from './nodeForms/SubPipelineForm.svelte';
  import FlowForm from './nodeForms/FlowForm.svelte';
  import RetrySettings from './inspector/RetrySettings.svelte';
  import BranchRules, { type BranchPath } from './inspector/BranchRules.svelte';
  import { usePageActions, usePageSubtitle } from '$lib/page-header.svelte';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { formatSavedAgo } from '$lib/timeFormat';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { stepFields } from '$lib/stepFields';
  import { stepKind } from '$lib/stepKinds';
  import { workflowProblems, type Problem } from '$lib/workflowProblems';

  // Task 8: WorkflowEdge.svelte is the only edge type this canvas renders
  // (loaded edges via convert.ts's toFlowEdges, freshly hand-drawn ones via
  // defaultEdgeOptions below) -- registered once here rather than inline in
  // the template so the object identity is stable across re-renders.
  const edgeTypes = { workflow: WorkflowEdge };

  // WorkflowNode.svelte replaces the library's built-in "default" node type
  // with the step card (chip, kind, name, summary, Needs attention), plus
  // left/right handles alongside top/bottom (see its own comment for why).
  const nodeTypes = { workflow: WorkflowNode };

  // Task 7: one form component per NodeType, rendered in a selected-node
  // side panel. Start/Exit/Parallel/FanIn/Conditional (no kind-specific
  // attrs per grounding, except Split's two) *and* any unrecognized/future
  // node_type string (same "don't crash on unknown kind" convention Task 4/6
  // already established for canvas rendering/the palette) fall back to
  // FlowForm, which also needs the kind, via the `null` arm below.
  function formComponentFor(nodeType: string): Component<NodeFormProps> | null {
    switch (nodeType) {
      case 'Codergen':
        return CodergenForm;
      case 'Interviewer':
        return InterviewerForm;
      case 'Tool':
        return ToolForm;
      case 'Manager':
        return ManagerForm;
      case 'SubPipeline':
        return SubPipelineForm;
      default:
        return null;
    }
  }

  // All the actual canvas UI/state logic, kept as a plain (non-custom-
  // element) Svelte component so it can be unit-tested via
  // @testing-library/svelte's standard render() -- this component is the
  // main canvas orchestrator, not wrapped in a custom-element shell.
  //
  // Follow-up to Task 5, approved by Jobsworth: when there's no
  // `workflowId` yet (the /workflows/new case), the Save button has
  // nothing to PUT to -- a small inline name/target-dir form is shown
  // instead, and `onSave` is called with a second `meta` argument so the
  // host shell can call `createGraph` (POST, a new file) rather than
  // `saveGraph` (PUT, an existing one).
  //
  // `onExport` (the edit page's Export .dot file) and `onRun` (its Run
  // dialog) sit in the toolbar next to Save, in the page header when there
  // is one. `onSave` resolving to `false` means nothing was written (the
  // edit page's conflict toast), so the changes stay unsaved.
  let { graph = undefined, workflowId = undefined, availableTargetDirs = [], onSave, onExport = undefined, onRun = undefined }: {
    graph?: EditorGraph;
    workflowId?: string;
    availableTargetDirs?: string[];
    onSave: (graph: EditorGraph, meta?: { name: string; targetDir: string }) => void | boolean | Promise<void | boolean>;
    onExport?: () => void;
    onRun?: () => void;
  } = $props();

  const uid = $props.id();

  const isCreateMode = $derived(!workflowId);
  // The create bar's accessible name; not on the board (proposed 2026-11-03).
  const CREATE_BAR_LABEL = 'New workflow details';
  let createName = $state('');
  let createTargetDir = $state('');

  // Default the <select> to the first configured directory once the host
  // bootstrap script assigns `availableTargetDirs` (mirrors the same
  // "assign once, on first real data" pattern the `graph` $effect below
  // already uses).
  $effect(() => {
    if (!createTargetDir && availableTargetDirs.length > 0) {
      createTargetDir = availableTargetDirs[0];
    }
  });

  let nodes = $state.raw<FlowNode<WorkflowNodeData>[]>([]);
  let edges = $state.raw<FlowEdge<WorkflowEdgeData>[]>([]);
  let graphName = $state<string | null>(null);
  let graphAttrs = $state<Record<string, AttrValue>>({});

  // Read by every WorkflowNode.svelte instance (see flowDirectionContext.ts)
  // to decide which handle pair renders first -- a single reactive object
  // set once via setContext, updated in place below rather than reassigned
  // so already-mounted node instances see the live value.
  const flowDirection: FlowDirection = $state({ rankdir: DEFAULT_RANKDIR });
  setContext(FLOW_DIRECTION_CONTEXT_KEY, flowDirection);

  // Unsaved changes (D1): every edit bumps `revision`, and a save records
  // the revision it wrote, so an edit made while a save is in flight stays
  // unsaved. Loading (or reloading) a graph is a clean start.
  let revision = $state(0);
  let savedRevision = $state(0);
  let savedAt = $state<Date | null>(null);
  const dirty = $derived(revision !== savedRevision);

  function markDirty() {
    revision += 1;
  }

  $effect(() => {
    if (graph) {
      nodes = toFlowNodes(graph.nodes, graph.edges, graph.graph_attrs);
      edges = toFlowEdges(graph.edges);
      graphName = graph.name ?? null;
      graphAttrs = (graph.graph_attrs ?? {}) as Record<string, AttrValue>;
      flowDirection.rankdir = typeof (graph.graph_attrs?.rankdir) === 'string' ? (graph.graph_attrs.rankdir) : DEFAULT_RANKDIR;
      untrack(() => (savedRevision = revision));
    }
  });

  export function currentGraph(): EditorGraph {
    return toEditorGraph(graphName, graphAttrs, nodes, edges);
  }

  // Task 6: dropping a Palette entry creates a new node of that NodeType.
  // The drop point is converted to flow coordinates (pan and zoom applied)
  // with useSvelteFlow()'s screenToFlowPosition. That hook only works in a
  // descendant of <SvelteFlow>, and this component's own <script> runs
  // outside that context, so FlowBridge.svelte (rendered inside <SvelteFlow>
  // below) hands it -- with the other viewport helpers -- back up via `flow`.
  let nodeIdCounter = 0;

  function nextNodeId(nodeType: string): string {
    const base = nodeType.toLowerCase();
    let id: string;
    do {
      nodeIdCounter += 1;
      id = `${base}-${nodeIdCounter}`;
    } while (nodes.some((n) => n.id === id));
    return id;
  }

  export function addNodeAtPosition(
    nodeType: string,
    position: { x: number; y: number }
  ): string | undefined {
    const config = (NODE_KIND_CONFIG as Record<string, NodeKindConfig>)[nodeType];
    if (!config) return undefined;
    const newNode: FlowNode<WorkflowNodeData> = {
      id: nextNodeId(nodeType),
      type: 'workflow',
      position,
      data: { label: stepKind(nodeType).plain, nodeType, attrs: { ...config.defaultAttrs } },
    };
    nodes = [...nodes, newNode];
    markDirty();
    return newNode.id;
  }

  // Task 7: selected-node side panel. Svelte Flow's own `onnodeclick`/
  // `onpaneclick` events (events.d.ts's NodeEvents/PaneEvents) drive
  // selection instead of reading `nodes.find(n => n.selected)` -- both
  // approaches observe the same underlying selection state, but the event
  // handlers avoid needing a $derived scan of `nodes` on every click and
  // read naturally as "the thing the user just clicked". `selectedNode` is
  // still derived live from the `nodes` array (not captured once at click
  // time) so the panel keeps reflecting the node's current attrs/label as
  // they're edited, and gracefully disappears if the node is deleted out
  // from under it (Backspace) instead of pointing at a stale id.
  //
  // Task 8 added the same for edges, and Task 9 the step library's guide:
  // one inspector slot, so the selection is a single value -- selecting one
  // thing replaces whatever was selected before.
  type Selection =
    | { kind: 'none' }
    | { kind: 'node'; id: string }
    | { kind: 'edge'; id: string }
    | { kind: 'guide'; handler: string };
  let selection = $state<Selection>({ kind: 'none' });
  const selectedNodeId = $derived(selection.kind === 'node' ? selection.id : null);
  const selectedEdgeId = $derived(selection.kind === 'edge' ? selection.id : null);
  const selectedNode = $derived(nodes.find((n) => n.id === selectedNodeId) ?? null);
  const selectedEdge = $derived(edges.find((e) => e.id === selectedEdgeId) ?? null);
  const guideHandler = $derived(selection.kind === 'guide' ? selection.handler : null);

  function handleNodeClick({ node }: { node: FlowNode<WorkflowNodeData> }) {
    selection = { kind: 'node', id: node.id };
  }

  function handleEdgeClick({ edge }: { edge: FlowEdge<WorkflowEdgeData> }) {
    selection = { kind: 'edge', id: edge.id };
  }

  // Enter or Space on a focused step or connection selects it in Svelte Flow
  // with no click, so the inspector follows that key too (SC5). Svelte Flow
  // ignores the keys inside form controls, and so does this.
  function handleCanvasKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, button')) return;
    const node = target.closest<HTMLElement>('.svelte-flow__node');
    const edge = target.closest<SVGElement>('.svelte-flow__edge');
    const id = (node ?? edge)?.dataset.id;
    if (!id) return;
    if (node && nodes.some((n) => n.id === id)) selection = { kind: 'node', id };
    else if (edge && edges.some((e) => e.id === id)) selection = { kind: 'edge', id };
  }

  // Delegated from the canvas region, whose focusable children are the steps and connections.
  $effect(() => {
    const region = canvasRegion;
    if (!region) return;
    region.addEventListener('keydown', handleCanvasKeyDown);
    return () => region.removeEventListener('keydown', handleCanvasKeyDown);
  });

  // A step picked in the library (or unpicked: null). Whatever was selected
  // on the canvas is let go, in Svelte Flow too, so no card stays ringed.
  function selectGuide(handler: string | null) {
    if (handler === null) {
      selection = { kind: 'none' };
      return;
    }
    nodes = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));
    edges = edges.map((e) => (e.selected ? { ...e, selected: false } : e));
    selection = { kind: 'guide', handler };
  }

  // jsdom never renders a `.svelte-flow__edge` DOM element at all (it
  // relies on the same getBoundingClientRect-based node measurement this
  // file's own test suite already documented jsdom lacking for edge *path*
  // rendering -- here it means edges are entirely absent from
  // `store.visible.edges`, not just drawn with NaN coordinates), so no real
  // click/hover DOM event can reach an edge in a jsdom test. Exported so
  // tests can drive the real selection handler directly by id, the same
  // "call the underlying handler, not a synthetic gesture jsdom can't
  // produce" precedent `addNodeAtPosition` already set for Task 4's
  // drag-and-drop.
  export function selectEdge(edgeId: string) {
    const edge = edges.find((e) => e.id === edgeId);
    if (edge) handleEdgeClick({ edge });
  }

  function handlePaneClick() {
    selection = { kind: 'none' };
  }

  // Close inspector: let go of the selection, in Svelte Flow too. Below
  // 1100px it also puts the inspector away.
  function clearSelection() {
    nodes = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));
    edges = edges.map((e) => (e.selected ? { ...e, selected: false } : e));
    selection = { kind: 'none' };
    inspectorOpen = false;
  }

  // D13: below 768px the step library and the inspector are sheets opened
  // from the toolbar, and zoom collapses to Fit. From 768px to 1100px the
  // inspector sits beside the canvas but can be put away. Selecting
  // anything (a step picked in the library included) shows it again.
  const phone = new IsMobile();
  const narrow = new IsMobile(1100);
  let stepsOpen = $state(false);
  // Beside the canvas it starts out shown; a phone's sheet starts closed.
  let inspectorOpen = $state(!phone.current);
  const inspectorShown = $derived(!narrow.current || inspectorOpen);

  $effect(() => {
    if (selection.kind === 'none') return;
    untrack(() => {
      inspectorOpen = true;
      if (selection.kind === 'guide') stepsOpen = false;
    });
  });

  // The inspector's Delete Step / Delete Connection (D3). A step takes its
  // connections with it, as Backspace does.
  export function deleteSelection() {
    if (selection.kind === 'node') {
      const id = selection.id;
      nodes = nodes.filter((n) => n.id !== id);
      edges = edges.filter((e) => e.source !== id && e.target !== id);
    } else if (selection.kind === 'edge') {
      const id = selection.id;
      edges = edges.filter((e) => e.id !== id);
    }
    if (selection.kind === 'node' || selection.kind === 'edge') markDirty();
    selection = { kind: 'none' };
  }

  // Task 8: the select and delete callbacks WorkflowEdge.svelte reads via
  // Svelte context (see edgeContext.ts's own comment on why context, not a
  // prop, is needed here). A label pill click selects its connection in
  // Svelte Flow itself but isn't an edge click, so it reports here too.
  // Exported for the same jsdom-can't-render-edges reason as selectEdge
  // above: tests call `.onDeleteEdge(...)`/`.onSelectEdge(...)` on this
  // same object directly instead of duplicating its logic in a test helper.
  export const edgeActions: WorkflowEdgeActions = {
    onSelectEdge: (edgeId: string) => selectEdge(edgeId),
    onDeleteEdge: (edgeId: string) => {
      edges = edges.filter((e) => e.id !== edgeId);
      markDirty();
      if (selectedEdgeId === edgeId) selection = { kind: 'none' };
    },
  };
  setContext(EDGE_ACTIONS_CONTEXT_KEY, edgeActions);

  // Advice for the step cards (and, later, the status bar): recomputed on
  // every graph change, never blocking Save (spec R6).
  const problems = $derived(workflowProblems(nodes, edges));
  const problemsByNode = $derived.by(() => {
    const byNode = new Map<string, string[]>();
    for (const p of problems) {
      if (p.nodeId) byNode.set(p.nodeId, [...(byNode.get(p.nodeId) ?? []), p.message]);
    }
    return byNode;
  });
  const outgoingByNode = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const e of edges) counts.set(e.source, (counts.get(e.source) ?? 0) + 1);
    return counts;
  });
  const nodeState: WorkflowNodeState = {
    get problemsByNode() {
      return problemsByNode;
    },
    get outgoingByNode() {
      return outgoingByNode;
    },
  };
  setContext(NODE_STATE_CONTEXT_KEY, nodeState);

  // A card's accessible name is "{kind}: {name}", plus ", needs attention"
  // when it has a problem. SvelteFlow's NodeWrapper (the focusable element)
  // reads it from the node's `ariaLabel`, so it is kept in step here; the
  // write only happens when a name actually changed, so this settles after
  // one pass instead of fighting the drag updates `bind:nodes` applies.
  function nodeAriaLabel(n: FlowNode<WorkflowNodeData>): string {
    const name = `${stepKind(n.data.nodeType).plain}: ${n.data.label}`;
    return problemsByNode.has(n.id) ? `${name}, needs attention` : name;
  }

  $effect(() => {
    const next = nodes.map((n) => {
      const ariaLabel = nodeAriaLabel(n);
      return n.ariaLabel === ariaLabel ? n : { ...n, ariaLabel };
    });
    if (next.some((n, i) => n !== nodes[i])) nodes = next;
  });

  // The same for connections: "Connection from {a} to {b}[, labelled {label}]".
  const labelById = $derived(new Map(nodes.map((n) => [n.id, n.data.label])));

  // A selection whose node or edge has gone (Backspace) shows Nothing selected.
  const inspectorView: InspectorView = $derived.by(() => {
    if (selectedNode) return { kind: 'node', handler: selectedNode.data.nodeType, title: selectedNode.data.label };
    if (selectedEdge) {
      const from = labelById.get(selectedEdge.source) ?? selectedEdge.source;
      const to = labelById.get(selectedEdge.target) ?? selectedEdge.target;
      return { kind: 'edge', title: `${from} → ${to}` };
    }
    if (guideHandler) return { kind: 'guide', handler: guideHandler };
    return { kind: 'none' };
  });
  const inspectorKey = $derived(inspectorView.kind === 'none' ? 'none' : `${selection.kind}:${'id' in selection ? selection.id : guideHandler}`);

  $effect(() => {
    const next = edges.map((e) => {
      const label = typeof e.label === 'string' ? e.label : undefined;
      const ariaLabel = connectionName(labelById.get(e.source) ?? e.source, labelById.get(e.target) ?? e.target, label);
      return e.ariaLabel === ariaLabel ? e : { ...e, ariaLabel };
    });
    if (next.some((e, i) => e !== edges[i])) edges = next;
  });

  // Applies an EdgeForm.svelte onChange patch to the selected edge's live
  // graph state -- the edge-form analogue of applyNodeFormChange above.
  // condition/priority/loop_restart are their own typed WorkflowEdgeData
  // fields (not a generic attrs bag -- see types.ts's EdgeFormChange
  // comment), so each is applied only when the patch actually mentions it.
  function applyEdgeFormChange(edgeId: string, patch: EdgeFormChange) {
    markDirty();
    edges = edges.map((e) => {
      if (e.id !== edgeId) return e;
      return {
        ...e,
        label: patch.label !== undefined ? (patch.label ?? undefined) : e.label,
        data: {
          condition: patch.condition !== undefined ? patch.condition : (e.data?.condition ?? null),
          priority: patch.priority !== undefined ? patch.priority : (e.data?.priority ?? null),
          loopRestart: patch.loopRestart !== undefined ? patch.loopRestart : (e.data?.loopRestart ?? false),
          attrs: e.data?.attrs ?? {},
        },
      };
    });
  }

  // A Branch's settings edit its outgoing connections' conditions (BranchRules).
  function branchPaths(nodeId: string): BranchPath[] {
    return edges
      .filter((e) => e.source === nodeId)
      .map((e) => ({
        id: e.id,
        target: labelById.get(e.target) ?? e.target,
        label: typeof e.label === 'string' ? e.label : '',
        loop: e.data?.loopRestart === true,
        condition: e.data?.condition,
      }));
  }

  // Applies a nodeForms/*.svelte onChange patch to the selected node's live
  // graph state. `patch.attrs` is merged key-by-key rather than spread
  // wholesale, so a key mapped to `undefined` deletes that attr (e.g.
  // InterviewerForm unchecking gallery) without disturbing attrs the patch
  // doesn't mention (e.g. `pos`, or a future attr no current form knows
  // about). `patch.label` is separate from every per-kind form's own attrs
  // patch -- see the shared Label field below -- but this function accepts
  // both so one code path handles either kind of edit.
  function applyNodeFormChange(nodeId: string, patch: NodeFormChange) {
    markDirty();
    nodes = nodes.map((n) => {
      if (n.id !== nodeId) return n;
      const nextAttrs = { ...n.data.attrs };
      if (patch.attrs) {
        for (const [key, value] of Object.entries(patch.attrs)) {
          if (value === undefined) {
            delete nextAttrs[key];
          } else {
            nextAttrs[key] = value;
          }
        }
      }
      return {
        ...n,
        data: {
          ...n.data,
          label: patch.label !== undefined ? patch.label : n.data.label,
          attrs: nextAttrs,
        },
      };
    });
  }

  // useSvelteFlow()'s helpers, handed up by FlowBridge (see addNodeAtPosition's
  // comment). Its onZoom level is for the toolbar's zoom group.
  let flow: FlowApi | undefined;
  let zoom = $state(1);

  // Backspace/Delete and drawn connections change the graph inside Svelte
  // Flow, so they are counted here. A drag counts only when it ends with a
  // step somewhere new, because `pos` is saved; a click is not a move.
  function handleFlowDelete({ nodes: gone, edges: goneEdges }: { nodes: FlowNode[]; edges: FlowEdge[] }) {
    if (gone.length > 0 || goneEdges.length > 0) markDirty();
  }

  let dragStart = new Map<string, { x: number; y: number }>();

  function handleNodeDragStart({ nodes: dragged }: { nodes: FlowNode[] }) {
    dragStart = new Map(dragged.map((n) => [n.id, { ...n.position }]));
  }

  function handleNodeDragStop({ nodes: dragged }: { nodes: FlowNode[] }) {
    const moved = dragged.some((n) => {
      const start = dragStart.get(n.id);
      return !start || start.x !== n.position.x || start.y !== n.position.y;
    });
    dragStart = new Map();
    if (moved) markDirty();
  }

  // A node's size is only known once Svelte Flow has rendered and measured
  // it, so a dropped node is placed with its top-left at the drop point and
  // then moved up and left by half its size here, which centres it under
  // the pointer (where it sat while being dragged). It stays hidden until
  // then, so it never shows in the wrong place for a frame.
  let nodeToCentre = $state<string | null>(null);

  $effect(() => {
    if (!nodeToCentre) return;
    const node = nodes.find((n) => n.id === nodeToCentre);
    if (!node) {
      nodeToCentre = null;
      return;
    }
    const { width, height } = node.measured ?? {};
    if (!width || !height) return;
    nodeToCentre = null;
    nodes = nodes.map((n) =>
      n.id === node.id
        ? {
            ...n,
            style: undefined,
            position: { x: n.position.x - width / 2, y: n.position.y - height / 2 },
          }
        : n
    );
  });

  // The Step guide's Add to Canvas (D6), the keyboard path for adding a
  // step: it goes in the middle of the visible canvas, centred the same way
  // a dropped step is, and is selected so its settings open straight away.
  let canvasRegion: HTMLElement | undefined;
  let focusStepName = false;

  function addStepAtCentre(nodeType: string) {
    if (!flow || !canvasRegion) return;
    const rect = canvasRegion.getBoundingClientRect();
    const centre = flow.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    const id = addNodeAtPosition(nodeType, centre);
    if (!id) return;
    nodes = nodes.map((n) => (n.id === id ? { ...n, style: 'visibility: hidden;' } : n));
    nodeToCentre = id;
    focusStepName = true;
    selectNode(id);
  }

  // The button that was pressed has gone with the guide, so focus moves to
  // the new step's name, the first thing a keyboard user will want to change.
  function focusOnMount(settings: HTMLElement) {
    if (!focusStepName) return;
    focusStepName = false;
    void tick().then(() => settings.querySelector('input')?.focus());
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const nodeType = event.dataTransfer?.getData(NODE_DRAG_DATA_TYPE);
    if (!nodeType || !flow) return;
    const id = addNodeAtPosition(nodeType, flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    if (!id) return;
    nodes = nodes.map((n) => (n.id === id ? { ...n, style: 'visibility: hidden;' } : n));
    nodeToCentre = id;
  }

  // Review in the status bar: select the problem's step or connection, in
  // Svelte Flow too (so its ring shows), and pan to it at the current zoom.
  function selectNode(nodeId: string) {
    nodes = nodes.map((n) => (!!n.selected === (n.id === nodeId) ? n : { ...n, selected: n.id === nodeId }));
    edges = edges.map((e) => (e.selected ? { ...e, selected: false } : e));
    selection = { kind: 'node', id: nodeId };
  }

  function centreOf(nodeId: string): { x: number; y: number } | null {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return {
      x: node.position.x + (node.measured?.width ?? 0) / 2,
      y: node.position.y + (node.measured?.height ?? 0) / 2,
    };
  }

  function reviewProblem(problem: Problem) {
    let centre: { x: number; y: number } | null = null;
    if (problem.nodeId) {
      selectNode(problem.nodeId);
      centre = centreOf(problem.nodeId);
    } else if (problem.edgeId) {
      const edge = edges.find((e) => e.id === problem.edgeId);
      if (!edge) return;
      nodes = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));
      edges = edges.map((e) => (!!e.selected === (e.id === edge.id) ? e : { ...e, selected: e.id === edge.id }));
      selectEdge(edge.id);
      const a = centreOf(edge.source);
      const b = centreOf(edge.target);
      if (a && b) centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    if (centre && flow) void flow.setCenter(centre.x, centre.y, { zoom: flow.getZoom(), duration: 200 });
  }

  let saving = $state(false);
  let saveError = $state<string | null>(null);

  /** Resolves true when the graph was written. */
  async function handleSave(): Promise<boolean> {
    saveError = null;
    const writing = revision;
    let meta: { name: string; targetDir: string } | undefined;
    if (isCreateMode) {
      const name = createName.trim();
      if (!name) {
        // Client-side nicety only -- create_graph's own server-side
        // blank-name rejection is the real enforcement, same discipline
        // create_workflow already applies.
        saveError = 'workflow name must not be blank';
        return false;
      }
      if (!createTargetDir) {
        saveError = 'choose a target directory';
        return false;
      }
      meta = { name, targetDir: createTargetDir };
    }
    saving = true;
    try {
      if ((await onSave(currentGraph(), meta)) === false) return false;
      recordSave(writing);
      return true;
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
      return false;
    } finally {
      saving = false;
    }
  }

  // Run (D11) runs what is on the canvas: unsaved changes are saved first,
  // and the dialog opens only if that worked.
  async function handleRun() {
    if (dirty && !(await handleSave())) return;
    onRun?.();
  }

  function recordSave(writtenRevision: number) {
    savedRevision = writtenRevision;
    savedAt = new Date();
  }

  /** The page saved the graph itself (the conflict toast's Save anyway). */
  export function markSaved() {
    recordSave(revision);
  }

  // A new workflow has no file to compare with, so only its name gates Save.
  const saveDisabled = $derived(saving || (isCreateMode ? !createName.trim() : !dirty));

  // The save state under the title (D1). "Saved …" only ever follows a save
  // made here, so nothing is claimed on load.
  const now = useNow();
  usePageSubtitle(
    () => {
      if (saving) return 'Saving…';
      if (dirty) return 'Unsaved changes';
      return savedAt ? `Saved ${formatSavedAgo(savedAt.toISOString(), now.current)}` : null;
    },
    { dot: () => (saving ? null : dirty ? 'warning' : savedAt ? 'success' : null), live: true }
  );

  // Leaving the page (any link: the router loads each page afresh) asks first.
  $effect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  });

  // Save lives in the page header when there is one.
  const saveInHeader = usePageActions(saveAction);
</script>

{#snippet inspectorSettings()}
  {#if selectedNode}
    {@const node = selectedNode}
    {@const FormComponent = formComponentFor(node.data.nodeType)}
    <div class="flex flex-col gap-5" use:focusOnMount>
      <Field
        spec={stepFields(node.data.nodeType)[0]}
        value={node.data.label}
        testId="node-inspector-label"
        oninput={(label) => applyNodeFormChange(node.id, { label })}
      />
      {#if node.data.nodeType === 'Conditional'}
        <BranchRules
          paths={branchPaths(node.id)}
          onChange={(edgeId, condition) => applyEdgeFormChange(edgeId, { condition })}
        />
      {:else if FormComponent}
        <FormComponent
          attrs={node.data.attrs}
          problems={problemsByNode.get(node.id) ?? []}
          onChange={(patch: NodeFormChange) => applyNodeFormChange(node.id, patch)}
        />
      {:else}
        <FlowForm handler={node.data.nodeType} attrs={node.data.attrs} onChange={(patch) => applyNodeFormChange(node.id, patch)} />
      {/if}
      <RetrySettings handler={node.data.nodeType} attrs={node.data.attrs} onChange={(patch) => applyNodeFormChange(node.id, patch)} />
    </div>
  {:else if selectedEdge}
    {@const edge = selectedEdge}
    <EdgeForm
      label={typeof edge.label === 'string' ? edge.label : null}
      condition={edge.data?.condition ?? null}
      priority={edge.data?.priority ?? null}
      loopRestart={edge.data?.loopRestart ?? false}
      onChange={(patch) => applyEdgeFormChange(edge.id, patch)}
    />
  {/if}
{/snippet}

{#snippet saveAction()}
  <EditorToolbarActions
    {zoom}
    onZoomIn={() => void flow?.zoomIn()}
    onZoomOut={() => void flow?.zoomOut()}
    onFit={() => void flow?.fitView()}
    {onExport}
    onSave={() => void handleSave()}
    onRun={onRun && !isCreateMode ? () => void handleRun() : undefined}
    {saving}
    {saveDisabled}
    compact={phone.current}
    onSteps={phone.current ? () => (stepsOpen = !stepsOpen) : undefined}
    {stepsOpen}
    onInspector={narrow.current ? () => (inspectorOpen = !inspectorOpen) : undefined}
    {inspectorOpen}
  />
{/snippet}

<!-- Remount on selection change: each form seeds its local field state
     from `attrs` only once per mount (documented in each form's own
     comment), and the inspector's tab goes back to Settings. -->
{#snippet inspectorPanel(className?: string)}
  {#key inspectorKey}
    <Inspector
      view={inspectorView}
      onClose={clearSelection}
      onDelete={deleteSelection}
      onAdd={addStepAtCentre}
      settings={inspectorSettings}
      class={className}
    />
  {/key}
{/snippet}

<div class="w-full h-full flex-1 min-h-[480px] flex flex-row">
  {#if phone.current}
    <Sheet.Root bind:open={stepsOpen}>
      <!-- A step picked here opens its guide in the Inspector sheet, which takes focus; don't hand it back to Steps. -->
      <Sheet.Content
        side="left"
        showCloseButton={false}
        aria-label="Step library"
        class="w-[280px] gap-0 p-0"
        onCloseAutoFocus={(event) => {
          if (inspectorOpen) event.preventDefault();
        }}
      >
        <Sheet.Title class="sr-only">Step library</Sheet.Title>
        <Palette selected={guideHandler} onSelect={selectGuide} class="w-full flex-1 border-r-0" />
      </Sheet.Content>
    </Sheet.Root>
    <Sheet.Root bind:open={inspectorOpen}>
      <Sheet.Content side="right" showCloseButton={false} aria-label="Inspector" class="w-full gap-0 p-0 data-[side=right]:max-w-[360px]">
        <Sheet.Title class="sr-only">Inspector</Sheet.Title>
        {@render inspectorPanel('w-full flex-1 border-l-0')}
      </Sheet.Content>
    </Sheet.Root>
  {:else}
    <Palette selected={guideHandler} onSelect={selectGuide} />
  {/if}
  <div class="flex-1 min-w-0 flex flex-col">
    {#if isCreateMode}
      <!-- D10: a new workflow's Name and Folder sit in a slim bar above the canvas. -->
      <div
        role="group"
        aria-label={CREATE_BAR_LABEL}
        class="flex flex-none flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border bg-background px-3 py-1.5"
      >
        <div class="flex items-center gap-2">
          <Label for="{uid}-create-name" class="text-caption text-muted-foreground">Name</Label>
          <Input
            id="{uid}-create-name"
            type="text"
            data-testid="create-name-input"
            bind:value={createName}
            placeholder="my-pipeline"
            class="w-56"
          />
        </div>
        <div class="flex items-center gap-2">
          <Label for="{uid}-create-target-dir" class="text-caption text-muted-foreground">Folder</Label>
          <NativeSelect.Root
            id="{uid}-create-target-dir"
            data-testid="create-target-dir-select"
            bind:value={createTargetDir}
          >
            {#each availableTargetDirs as dir (dir)}
              <NativeSelect.Option value={dir}>{dir}</NativeSelect.Option>
            {/each}
          </NativeSelect.Root>
        </div>
      </div>
    {/if}
    <div
      class="flex-1 relative"
      bind:this={canvasRegion}
      role="region"
      aria-label="Workflow canvas drop zone"
      ondragover={handleDragOver}
      ondrop={handleDrop}
    >
      <SvelteFlow
        bind:nodes
        bind:edges
        fitView
        minZoom={0.1}
        deleteKey={['Backspace', 'Delete']}
        {nodeTypes}
        {edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{ type: 'workflow', markerEnd: { type: MarkerType.ArrowClosed } }}
        onnodeclick={handleNodeClick}
        onpaneclick={handlePaneClick}
        onedgeclick={handleEdgeClick}
        ondelete={handleFlowDelete}
        onconnect={markDirty}
        onnodedragstart={handleNodeDragStart}
        onnodedragstop={handleNodeDragStop}
      >
        <FlowBridge onReady={(api) => (flow = api)} onZoom={(level) => (zoom = level)} />
        <Background variant={BackgroundVariant.Dots} gap={20} bgColor="var(--muted)" patternColor="var(--divider)" />
        <MiniMap
          class="overflow-hidden rounded-lg shadow-tooltip"
          bgColor="var(--card)"
          maskColor="var(--scrim-faint)"
          nodeColor={(n) => stepKind(String(n.data.nodeType)).tint}
          nodeStrokeColor={(n) => stepKind(String(n.data.nodeType)).ink}
          nodeStrokeWidth={1}
        />
      </SvelteFlow>
      <Legend />
    </div>
    <StatusBar stepCount={nodes.length} connectionCount={edges.length} {problems} onReview={reviewProblem} />
    {#if !saveInHeader}
      {@render saveAction()}
    {/if}
    {#if saveError}
      <p role="alert" data-testid="save-error" class="text-destructive text-sm px-3 py-2">{saveError}</p>
    {/if}
  </div>
  {#if !phone.current && inspectorShown}
    {@render inspectorPanel()}
  {/if}
</div>

<style>
  /* Edge lines default to Svelte Flow's own pale-gray 1px stroke
     (--xy-edge-stroke-default, a pale grey), which is nearly invisible against
     this app's light canvas background -- a loaded graph with every node
     genuinely connected read as a disconnected grid of boxes because the
     lines joining them couldn't be seen. Overriding the library's own
     theming variables (rather than hand-styling every edge path) keeps
     hover/selected states, arrowheads, etc. all still driven by the one
     source of truth. */
  :global(.svelte-flow) {
    /* Theme tokens so edges follow dark mode. The board draws its lighter neutral grey, which is
       under 3:1 against the canvas, so edges keep the darker muted grey. */
    --xy-edge-stroke-default: var(--muted-foreground);
    --xy-edge-stroke-width-default: 2;
    --xy-edge-stroke-selected-default: var(--primary);
  }

  /* @xyflow/svelte 1.6.6's own base.css gives `.svelte-flow__viewport` and
     `.svelte-flow__pane` real dimensions via a shared `.svelte-flow__container`
     class (`width: 100%; height: 100%`), but never gives `.svelte-flow__edges`
     (each edge's wrapping <svg class="svelte-flow__edge-wrapper"> included)
     any sizing at all -- confirmed via computed-style inspection that both
     collapse to a 0x0 CSS box (absolutely positioned, auto width, no content
     to shrink-wrap around, so shrink-to-fit resolves to 0). A zero-width or
     zero-height <svg> is spec'd to not render its content at all, `overflow:
     visible` or not -- every edge line was being laid out with correct
     path/stroke data (confirmed via getBoundingClientRect and computed
     style) yet never painted a single pixel. Sizing both explicitly to fill
     their real (non-zero) `.svelte-flow__viewport` ancestor fixes rendering
     without touching the library's own files. */
  :global(.svelte-flow__edges),
  :global(svg.svelte-flow__edge-wrapper) {
    width: 100%;
    height: 100%;
  }
</style>
