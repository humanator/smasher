<script lang="ts">
  import { Background, Controls, MiniMap, SvelteFlow, type Edge as FlowEdge, type Node as FlowNode } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import type { Component } from 'svelte';
  import Palette from './Palette.svelte';
  import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG, type NodeKindConfig } from './nodeConfig';
  import { toEditorGraph, toFlowEdges, toFlowNodes, type WorkflowEdgeData, type WorkflowNodeData } from './convert';
  import type { AttrValue, EditorGraph, NodeFormChange, NodeFormProps } from './types';
  import CodergenForm from './nodeForms/CodergenForm.svelte';
  import InterviewerForm from './nodeForms/InterviewerForm.svelte';
  import ToolForm from './nodeForms/ToolForm.svelte';
  import ManagerForm from './nodeForms/ManagerForm.svelte';
  import SubPipelineForm from './nodeForms/SubPipelineForm.svelte';
  import StructuralForm from './nodeForms/StructuralForm.svelte';

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
  // @testing-library/svelte's standard render() -- WorkflowCanvas.svelte
  // is the thin <svelte:options customElement> shell around this that
  // does the host-page property/event plumbing (not reliably testable
  // outside a real browser; see WorkflowCanvas.svelte's own comment).
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

  $effect(() => {
    if (graph) {
      nodes = toFlowNodes(graph.nodes);
      edges = toFlowEdges(graph.edges);
      graphName = graph.name;
      graphAttrs = graph.graph_attrs;
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
      type: 'default',
      position,
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

  function handleNodeClick({ node }: { node: FlowNode<WorkflowNodeData> }) {
    selectedNodeId = node.id;
  }

  function handlePaneClick() {
    selectedNodeId = null;
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
</script>

<div class="workflow-canvas-root" style="width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: row;">
  <Palette />
  <div class="workflow-canvas-main" style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
    {#if isCreateMode}
      <div class="create-workflow-fields" style="display: flex; gap: 0.75rem; align-items: flex-end; padding-bottom: 0.5rem;">
        <label style="display: flex; flex-direction: column; font-size: 0.85rem;">
          Name
          <input
            type="text"
            data-testid="create-name-input"
            bind:value={createName}
            placeholder="my-pipeline"
          />
        </label>
        <label style="display: flex; flex-direction: column; font-size: 0.85rem;">
          Directory
          <select data-testid="create-target-dir-select" bind:value={createTargetDir}>
            {#each availableTargetDirs as dir (dir)}
              <option value={dir}>{dir}</option>
            {/each}
          </select>
        </label>
      </div>
    {/if}
    <div
      class="canvas-area"
      style="flex: 1; position: relative;"
      role="region"
      aria-label="Workflow canvas drop zone"
      bind:this={canvasAreaEl}
      ondragover={handleDragOver}
      ondrop={handleDrop}
    >
      <SvelteFlow bind:nodes bind:edges fitView onnodeclick={handleNodeClick} onpaneclick={handlePaneClick}>
        <Background />
        <Controls />
        <MiniMap />
      </SvelteFlow>
    </div>
    <button type="button" onclick={handleSave} disabled={saveDisabled} data-testid="save-button">
      {saving ? 'Saving…' : 'Save'}
    </button>
    {#if saveError}
      <p role="alert" data-testid="save-error">{saveError}</p>
    {/if}
  </div>
  {#if selectedNode}
    {@const node = selectedNode}
    {@const FormComponent = formComponentFor(node.data.nodeType)}
    <aside class="node-inspector" data-testid="node-inspector">
      <div class="node-inspector-header">
        <span class="node-inspector-title" data-testid="node-inspector-title">
          {(NODE_KIND_CONFIG as Record<string, NodeKindConfig>)[node.data.nodeType]?.title ?? node.data.nodeType}
        </span>
        <button
          type="button"
          class="node-inspector-close"
          onclick={() => (selectedNodeId = null)}
          aria-label="Close node inspector"
        >
          ×
        </button>
      </div>
      <!-- Remount on selection change: each nodeForms/*.svelte component
           seeds its local field state from `attrs` only once per mount
           (documented in each form's own comment) -- {#key} forces a fresh
           instance instead of letting a prop update slip past that
           intentional one-time read when the user selects a different node. -->
      {#key node.id}
        <label class="node-form-field node-inspector-label-field">
          Label
          <input
            type="text"
            data-testid="node-inspector-label"
            value={node.data.label}
            oninput={(event) =>
              applyNodeFormChange(node.id, { label: (event.target as HTMLInputElement).value })}
          />
        </label>
        <FormComponent attrs={node.data.attrs} onChange={(patch) => applyNodeFormChange(node.id, patch)} />
      {/key}
    </aside>
  {/if}
</div>

<style>
  .node-inspector {
    width: 260px;
    flex: 0 0 260px;
    overflow-y: auto;
    border-left: 1px solid #e2e8f0;
    padding: 0.6rem;
    box-sizing: border-box;
  }

  .node-inspector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  .node-inspector-title {
    font-weight: 600;
    font-size: 0.85rem;
    color: #1e293b;
  }

  .node-inspector-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    color: #64748b;
  }

  .node-inspector-label-field {
    margin-bottom: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.8rem;
    color: #475569;
  }

  .node-inspector-label-field input {
    font: inherit;
    padding: 0.35rem 0.45rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    color: #1e293b;
  }
</style>
