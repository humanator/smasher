<script lang="ts">
  // ABOUTME: Canvas orchestrator for the workflow node editor
  // ABOUTME: Manages nodes, edges, selection, forms, save/create modes

  import {
    Background,
    ConnectionMode,
    Controls,
    MarkerType,
    MiniMap,
    SvelteFlow,
    type Edge as FlowEdge,
    type Node as FlowNode,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { setContext, untrack, type Component } from 'svelte';
  import Palette from './Palette.svelte';
  import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG, nodeStyleFor, type NodeKindConfig } from './nodeConfig';
  import {
    DEFAULT_RANKDIR,
    toEditorGraph,
    toFlowEdges,
    toFlowNodes,
    type WorkflowEdgeData,
    type WorkflowNodeData,
  } from './convert';
  import type { AttrValue, EdgeFormChange, EditorGraph, NodeFormChange, NodeFormProps } from './types';
  import { EDGE_ACTIONS_CONTEXT_KEY, type WorkflowEdgeActions } from './edgeContext';
  import { FLOW_DIRECTION_CONTEXT_KEY, type FlowDirection } from './flowDirectionContext';
  import WorkflowEdge from './WorkflowEdge.svelte';
  import WorkflowNode from './WorkflowNode.svelte';
  import EdgeForm from './EdgeForm.svelte';
  import CodergenForm from './nodeForms/CodergenForm.svelte';
  import InterviewerForm from './nodeForms/InterviewerForm.svelte';
  import ToolForm from './nodeForms/ToolForm.svelte';
  import ManagerForm from './nodeForms/ManagerForm.svelte';
  import SubPipelineForm from './nodeForms/SubPipelineForm.svelte';
  import StructuralForm from './nodeForms/StructuralForm.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';

  // Task 8: WorkflowEdge.svelte is the only edge type this canvas renders
  // (loaded edges via convert.ts's toFlowEdges, freshly hand-drawn ones via
  // defaultEdgeOptions below) -- registered once here rather than inline in
  // the template so the object identity is stable across re-renders.
  const edgeTypes = { workflow: WorkflowEdge };

  // WorkflowNode.svelte replaces the library's built-in "default" node type
  // -- same look, plus left/right handles alongside top/bottom (see its own
  // comment for why).
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
  let { graph = undefined, workflowId = undefined, availableTargetDirs = [], onSave }: {
    graph?: EditorGraph;
    workflowId?: string;
    availableTargetDirs?: string[];
    onSave: (graph: EditorGraph, meta?: { name: string; targetDir: string }) => void | Promise<void>;
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
  // Position is computed by hand from the drop event's screen coordinates
  // relative to the canvas container, rather than via @xyflow/svelte's
  // useSvelteFlow()/screenToFlowPosition() -- that hook only works inside
  // a component already rendered as a descendant of <SvelteFlow> (or
  // wrapped in an explicit <SvelteFlowProvider>), and this component's own
  // <script> runs before its <SvelteFlow> child mounts, so the context
  // isn't available at the point this handler is defined. Screen-space
  // (not pan/zoom-adjusted flow-space) is an accepted simplification for
  // this task's "generic rendering only" scope -- correct at the default
  // zoom/pan a freshly opened canvas starts at.
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

  export function addNodeAtPosition(nodeType: string, position: { x: number; y: number }) {
    const config = (NODE_KIND_CONFIG as Record<string, NodeKindConfig>)[nodeType];
    if (!config) return;
    const newNode: FlowNode<WorkflowNodeData> = {
      id: nextNodeId(nodeType),
      type: 'workflow',
      position,
      style: nodeStyleFor(nodeType),
      data: { label: config.title, nodeType, attrs: {} },
    };
    nodes = [...nodes, newNode];
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
  let selectedNodeId = $state<string | null>(null);
  const selectedNode = $derived(nodes.find((n) => n.id === selectedNodeId) ?? null);

  // Task 8: the same pattern, for edges -- one inspector panel slot shared
  // between a selected node and a selected edge (never both at once:
  // selecting either clears the other, matching this canvas having a single
  // side panel, not two independent ones).
  let selectedEdgeId = $state<string | null>(null);
  const selectedEdge = $derived(edges.find((e) => e.id === selectedEdgeId) ?? null);

  function handleNodeClick({ node }: { node: FlowNode<WorkflowNodeData> }) {
    selectedNodeId = node.id;
    selectedEdgeId = null;
  }

  function handleEdgeClick({ edge }: { edge: FlowEdge<WorkflowEdgeData> }) {
    selectedEdgeId = edge.id;
    selectedNodeId = null;
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
    selectedNodeId = null;
    selectedEdgeId = null;
  }

  // Task 8: hover state + the delete callback WorkflowEdge.svelte reads via
  // Svelte context (see edgeContext.ts's own comment on why context, not a
  // prop, is needed here). A single reactive ($state) object set once via
  // setContext -- every WorkflowEdge instance reads the same live object.
  // Exported for the same jsdom-can't-render-edges reason as selectEdge
  // above: WorkflowEdge.svelte (the real consumer, via Svelte context --
  // see edgeContext.ts) can't be driven by a real pointer-hover/click DOM
  // event in a test, so tests call `.onDeleteEdge(...)`/set
  // `.hoveredEdgeId` on this same live object directly instead of
  // duplicating its logic in a separate test-only helper.
  export const edgeActions: WorkflowEdgeActions = $state({
    hoveredEdgeId: null,
    onDeleteEdge: (edgeId: string) => {
      edges = edges.filter((e) => e.id !== edgeId);
      if (selectedEdgeId === edgeId) selectedEdgeId = null;
    },
  });
  setContext(EDGE_ACTIONS_CONTEXT_KEY, edgeActions);

  function handleEdgePointerEnter({ edge }: { edge: FlowEdge<WorkflowEdgeData> }) {
    edgeActions.hoveredEdgeId = edge.id;
  }

  function handleEdgePointerLeave() {
    edgeActions.hoveredEdgeId = null;
  }

  // Task 8 (connection handle polish): handles are hidden by default and
  // revealed on node hover via CSS alone (see the :global rules below), but
  // "turn an accent color once connected" needs to know *which* nodes have
  // at least one edge -- not expressible in CSS since a node's handle
  // elements and the edges attached to it aren't DOM siblings/ancestors of
  // each other. Recomputed only from `edges` (untracked read of `nodes`, so
  // this doesn't re-run -- and fight the drag/selection updates `bind:nodes`
  // applies -- every time `nodes` itself changes for unrelated reasons, e.g.
  // a drag repositioning a node).
  const connectedNodeIds = $derived(new Set(edges.flatMap((e) => [e.source, e.target])));

  $effect(() => {
    const connected = connectedNodeIds;
    const current = untrack(() => nodes);
    const next = current.map((n) => {
      const base = typeof n.class === 'string' ? n.class.replace(/\bwf-node-connected\b/g, '').trim() : '';
      const withFlag = connected.has(n.id) ? (base ? `${base} wf-node-connected` : 'wf-node-connected') : base;
      if ((n.class ?? '') === withFlag) return n;
      return { ...n, class: withFlag || undefined };
    });
    if (next.some((n, i) => n !== current[i])) {
      nodes = next;
    }
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

  let canvasAreaEl: HTMLDivElement | undefined;

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const nodeType = event.dataTransfer?.getData(NODE_DRAG_DATA_TYPE);
    if (!nodeType || !canvasAreaEl) return;
    const rect = canvasAreaEl.getBoundingClientRect();
    addNodeAtPosition(nodeType, { x: event.clientX - rect.left, y: event.clientY - rect.top });
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

  // Shared by the node and edge inspector <aside>s (one side-panel slot).
  const inspectorClass = 'w-[260px] flex-[0_0_260px] overflow-y-auto border-l border-border p-2.5 box-border';
</script>

<div class="w-full h-full min-h-[480px] flex flex-row">
  <Palette />
  <div class="flex-1 min-w-0 flex flex-col">
    {#if isCreateMode}
      <div class="flex gap-3 items-end pb-2">
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
      bind:this={canvasAreaEl}
      ondragover={handleDragOver}
      ondrop={handleDrop}
    >
      <SvelteFlow
        bind:nodes
        bind:edges
        fitView
        {nodeTypes}
        {edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{ type: 'workflow', markerEnd: { type: MarkerType.ArrowClosed } }}
        onnodeclick={handleNodeClick}
        onpaneclick={handlePaneClick}
        onedgeclick={handleEdgeClick}
        onedgepointerenter={handleEdgePointerEnter}
        onedgepointerleave={handleEdgePointerLeave}
      >
        <Background />
        <Controls />
        <MiniMap />
      </SvelteFlow>
    </div>
    <Button onclick={handleSave} disabled={saveDisabled} data-testid="save-button">
      {saving ? 'Saving…' : 'Save'}
    </Button>
    {#if saveError}
      <p role="alert" data-testid="save-error" class="text-destructive text-sm mt-2">{saveError}</p>
    {/if}
  </div>
  {#if selectedNode}
    {@const node = selectedNode}
    {@const FormComponent = formComponentFor(node.data.nodeType)}
    <aside class={inspectorClass} data-testid="node-inspector">
      <div class="flex items-center justify-between mb-2.5">
        <span class="font-semibold text-sm text-foreground" data-testid="node-inspector-title">
          {(NODE_KIND_CONFIG as Record<string, NodeKindConfig>)[node.data.nodeType]?.title ?? node.data.nodeType}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-base text-muted-foreground"
          onclick={() => (selectedNodeId = null)}
          aria-label="Close node inspector"
        >
          ×
        </Button>
      </div>
      <p class="mb-2.5 text-xs leading-snug text-muted-foreground" data-testid="node-inspector-description">
        {(NODE_KIND_CONFIG as Record<string, NodeKindConfig>)[node.data.nodeType]?.description ?? ''}
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
          onclick={() => (selectedEdgeId = null)}
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
  {/if}
</div>

<style>
  /* Connection handles dim (not fully hidden -- an earlier revision hid
     them at opacity 0 until hover, which made it impossible to discover
     where a connection could even be dragged from) until the owning node
     is hovered, brightened to full opacity with a plain opacity
     transition; a node that has at least one edge (wf-node-connected,
     computed in this file's `connectedNodeIds` $effect above) keeps its
     handles visibly accent-colored even without hovering, so a "wired up"
     node reads as such at a glance instead of needing a hover to confirm.
     :global() is required here -- these elements are rendered by @xyflow/
     svelte's own child components (DefaultNode/Handle.svelte), not by this
     component's own template, so Svelte's default per-component style
     scoping never reaches them. */
  :global(.svelte-flow__handle) {
    opacity: 0.45;
    transition:
      opacity 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  :global(.svelte-flow__node:hover .svelte-flow__handle),
  :global(.svelte-flow__node.selected .svelte-flow__handle) {
    opacity: 1;
  }

  :global(.svelte-flow__node.wf-node-connected .svelte-flow__handle) {
    opacity: 1;
    background-color: #3b82f6;
    border-color: #3b82f6;
  }

  /* Edge lines default to Svelte Flow's own pale-gray 1px stroke
     (--xy-edge-stroke-default: #b1b1b7), which is nearly invisible against
     this app's light canvas background -- a loaded graph with every node
     genuinely connected read as a disconnected grid of boxes because the
     lines joining them couldn't be seen. Overriding the library's own
     theming variables (rather than hand-styling every edge path) keeps
     hover/selected states, arrowheads, etc. all still driven by the one
     source of truth. */
  :global(.svelte-flow) {
    --xy-edge-stroke-default: #64748b;
    --xy-edge-stroke-width-default: 2;
    --xy-edge-stroke-selected-default: #3b82f6;
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
