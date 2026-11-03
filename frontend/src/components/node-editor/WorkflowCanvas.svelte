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
  import { setContext, type Component, type Snippet } from 'svelte';
  import Palette from './Palette.svelte';
  import FlowBridge, { type FlowApi } from './FlowBridge.svelte';
  import StatusBar from './StatusBar.svelte';
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
  import CodergenForm from './nodeForms/CodergenForm.svelte';
  import InterviewerForm from './nodeForms/InterviewerForm.svelte';
  import ToolForm from './nodeForms/ToolForm.svelte';
  import ManagerForm from './nodeForms/ManagerForm.svelte';
  import SubPipelineForm from './nodeForms/SubPipelineForm.svelte';
  import StructuralForm from './nodeForms/StructuralForm.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { usePageActions } from '$lib/page-header.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
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
  // attrs per grounding) *and* any unrecognized/future node_type string
  // (same "don't crash on unknown kind" convention Task 4/6 already
  // established for canvas rendering/the palette) fall back to
  // StructuralForm via the `default` arm below.
  function formComponentFor(nodeType: string): Component<NodeFormProps> {
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
        return StructuralForm;
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
  // `extraActions` (e.g. the edit page's Export .dot) render next to Save,
  // in the page header when there is one.
  let { graph = undefined, workflowId = undefined, availableTargetDirs = [], onSave, extraActions }: {
    graph?: EditorGraph;
    workflowId?: string;
    availableTargetDirs?: string[];
    onSave: (graph: EditorGraph, meta?: { name: string; targetDir: string }) => void | Promise<void>;
    extraActions?: Snippet;
  } = $props();

  const uid = $props.id();

  const isCreateMode = $derived(!workflowId);
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

  $effect(() => {
    if (graph) {
      nodes = toFlowNodes(graph.nodes, graph.edges, graph.graph_attrs);
      edges = toFlowEdges(graph.edges);
      graphName = graph.name ?? null;
      graphAttrs = (graph.graph_attrs ?? {}) as Record<string, AttrValue>;
      flowDirection.rankdir = typeof (graph.graph_attrs?.rankdir) === 'string' ? (graph.graph_attrs.rankdir) : DEFAULT_RANKDIR;
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
    edges = edges.map((e) => {
      if (e.id !== edgeId) return e;
      return {
        ...e,
        data: {
          condition: patch.condition !== undefined ? patch.condition : (e.data?.condition ?? null),
          priority: patch.priority !== undefined ? patch.priority : (e.data?.priority ?? null),
          loopRestart: patch.loopRestart !== undefined ? patch.loopRestart : (e.data?.loopRestart ?? false),
          attrs: e.data?.attrs ?? {},
        },
      };
    });
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
  // comment). Its onZoom level is for the toolbar's zoom group (Task 17).
  let flow: FlowApi | undefined;

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

  async function handleSave() {
    saveError = null;
    let meta: { name: string; targetDir: string } | undefined;
    if (isCreateMode) {
      const name = createName.trim();
      if (!name) {
        // Client-side nicety only -- create_graph's own server-side
        // blank-name rejection is the real enforcement, same discipline
        // create_workflow already applies.
        saveError = 'workflow name must not be blank';
        return;
      }
      if (!createTargetDir) {
        saveError = 'choose a target directory';
        return;
      }
      meta = { name, targetDir: createTargetDir };
    }
    saving = true;
    try {
      await onSave(currentGraph(), meta);
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
    } finally {
      saving = false;
    }
  }

  const saveDisabled = $derived(saving || (isCreateMode && !createName.trim()));

  // Save lives in the page header when there is one.
  const saveInHeader = usePageActions(saveAction);

  // Shared by the node and edge inspector <aside>s (one side-panel slot).
  const inspectorClass = 'w-[260px] flex-[0_0_260px] overflow-y-auto border-l border-border p-2.5 box-border';
</script>

{#snippet saveAction()}
  {@render extraActions?.()}
  <Button onclick={handleSave} disabled={saveDisabled} data-testid="save-button">
    {saving ? 'Saving…' : 'Save'}
  </Button>
{/snippet}

<div class="w-full h-full flex-1 min-h-[480px] flex flex-row">
  <Palette selected={guideHandler} onSelect={selectGuide} />
  <div class="flex-1 min-w-0 flex flex-col">
    {#if isCreateMode}
      <div class="flex gap-3 items-end px-3 py-2">
        <div class="flex flex-col gap-1.5">
          <Label for="{uid}-create-name">Name</Label>
          <Input
            id="{uid}-create-name"
            type="text"
            data-testid="create-name-input"
            bind:value={createName}
            placeholder="my-pipeline"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="{uid}-create-target-dir">Directory</Label>
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
        {nodeTypes}
        {edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{ type: 'workflow', markerEnd: { type: MarkerType.ArrowClosed } }}
        onnodeclick={handleNodeClick}
        onpaneclick={handlePaneClick}
        onedgeclick={handleEdgeClick}
      >
        <FlowBridge onReady={(api) => (flow = api)} />
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
  {#if selectedNode}
    {@const node = selectedNode}
    {@const FormComponent = formComponentFor(node.data.nodeType)}
    <aside class={inspectorClass} data-testid="node-inspector">
      <div class="flex items-center justify-between mb-2.5">
        <span class="font-semibold text-sm text-foreground" data-testid="node-inspector-title">
          {stepKind(node.data.nodeType).plain}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-base text-muted-foreground"
          onclick={() => (selection = { kind: 'none' })}
          aria-label="Close node inspector"
        >
          ×
        </Button>
      </div>
      <p class="mb-2.5 text-xs leading-snug text-muted-foreground" data-testid="node-inspector-description">
        {stepKind(node.data.nodeType).blurb}
      </p>
      <!-- Remount on selection change: each nodeForms/*.svelte component
           seeds its local field state from `attrs` only once per mount
           (documented in each form's own comment) -- {#key} forces a fresh
           instance instead of letting a prop update slip past that
           intentional one-time read when the user selects a different node. -->
      {#key node.id}
        <div class="mb-2.5 flex flex-col gap-1.5">
          <Label for="{uid}-node-label">Label</Label>
          <Input
            id="{uid}-node-label"
            type="text"
            data-testid="node-inspector-label"
            value={node.data.label}
            oninput={(event) =>
              applyNodeFormChange(node.id, { label: (event.target as HTMLInputElement).value })}
          />
        </div>
        <FormComponent attrs={node.data.attrs} onChange={(patch: NodeFormChange) => applyNodeFormChange(node.id, patch)} />
      {/key}
    </aside>
  {:else if selectedEdge}
    {@const edge = selectedEdge}
    <aside class={inspectorClass} data-testid="edge-inspector">
      <div class="flex items-center justify-between mb-2.5">
        <span class="font-semibold text-sm text-foreground" data-testid="edge-inspector-title">Edge</span>
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-base text-muted-foreground"
          onclick={() => (selection = { kind: 'none' })}
          aria-label="Close edge inspector"
        >
          ×
        </Button>
      </div>
      <!-- Remount on selection change, same reasoning as the node
           inspector's own {#key} above -- EdgeForm.svelte seeds its local
           field state from condition/priority/loopRestart only once per
           mount. -->
      {#key edge.id}
        <EdgeForm
          condition={edge.data?.condition ?? null}
          priority={edge.data?.priority ?? null}
          loopRestart={edge.data?.loopRestart ?? false}
          onChange={(patch) => applyEdgeFormChange(edge.id, patch)}
        />
      {/key}
    </aside>
  {:else if guideHandler}
    <!-- Placeholder until Task 16 builds the full Step guide. -->
    <aside class={inspectorClass} data-testid="step-guide" aria-label="Inspector">
      <p class="m-0 text-caption font-semibold text-muted-foreground">Step guide</p>
      <h2 class="m-0 text-heading font-bold text-foreground">{stepKind(guideHandler).plain}</h2>
    </aside>
  {/if}
</div>

<style>
  /* Edge lines default to Svelte Flow's own pale-gray 1px stroke
     (--xy-edge-stroke-default: #b1b1b7), which is nearly invisible against
     this app's light canvas background -- a loaded graph with every node
     genuinely connected read as a disconnected grid of boxes because the
     lines joining them couldn't be seen. Overriding the library's own
     theming variables (rather than hand-styling every edge path) keeps
     hover/selected states, arrowheads, etc. all still driven by the one
     source of truth. */
  :global(.svelte-flow) {
    /* Theme tokens so edges follow dark mode. The board draws --neutral (#AEAEB2); the editor
       rebuild decides whether that is visible enough, so this keeps the darker muted grey for now. */
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
