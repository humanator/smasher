import type { Edge as FlowEdge, Node as FlowNode } from '@xyflow/svelte';
import type { AttrValue, EditorEdge, EditorGraph, EditorNode } from './types';

// Node canvas position has nowhere to live in the DOT/Graph model (spec
// Assumption 5): it rides through as an ordinary "pos" generic node attr,
// formatted "x,y". A node with no (or an unparseable) pos gets a
// deterministic grid position instead of stacking at (0,0).
const GRID_COLUMNS = 4;
const GRID_SPACING_X = 220;
const GRID_SPACING_Y = 120;

function parsePos(attrs: Record<string, AttrValue>): { x: number; y: number } | null {
  const raw = attrs.pos;
  if (typeof raw !== 'string') return null;
  const parts = raw.split(',');
  if (parts.length !== 2) return null;
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x, y };
}

function defaultPosition(index: number): { x: number; y: number } {
  return {
    x: (index % GRID_COLUMNS) * GRID_SPACING_X,
    y: Math.floor(index / GRID_COLUMNS) * GRID_SPACING_Y,
  };
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  attrs: Record<string, AttrValue>;
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  condition: string | null;
  priority: number | null;
  loopRestart: boolean;
  attrs: Record<string, AttrValue>;
}

export function toFlowNodes(editorNodes: EditorNode[]): FlowNode<WorkflowNodeData>[] {
  return editorNodes.map((n, i) => ({
    id: n.id,
    // Generic rendering only (Task 4 scope) -- Svelte Flow's built-in
    // "default" node type renders whatever `data.label` is, regardless of
    // `nodeType`, so an unrecognized/future node_type string can't crash
    // rendering here; per-kind themed cards land in Task 6.
    type: 'default',
    position: parsePos(n.attrs) ?? defaultPosition(i),
    data: { label: n.label ?? n.id, nodeType: n.node_type, attrs: n.attrs },
  }));
}

export function toFlowEdges(editorEdges: EditorEdge[]): FlowEdge<WorkflowEdgeData>[] {
  return editorEdges.map((e, i) => ({
    id: `${e.from}->${e.to}#${i}`,
    source: e.from,
    target: e.to,
    label: e.label ?? undefined,
    // Task 8: WorkflowEdge.svelte, registered as the "workflow" edgeTypes
    // entry in WorkflowCanvasInner.svelte -- same bezier path the built-in
    // "default" edge draws, plus a hover/selection-revealed delete button.
    type: 'workflow',
    data: {
      condition: e.condition,
      priority: e.priority,
      loopRestart: e.loop_restart,
      attrs: e.attrs,
    },
  }));
}

export function toEditorGraph(
  name: string | null,
  graphAttrs: Record<string, AttrValue>,
  flowNodes: FlowNode<WorkflowNodeData>[],
  flowEdges: FlowEdge<WorkflowEdgeData>[],
): EditorGraph {
  return {
    name,
    graph_attrs: graphAttrs,
    nodes: flowNodes.map((n) => ({
      id: n.id,
      node_type: n.data.nodeType,
      label: n.data.label,
      attrs: { ...n.data.attrs, pos: `${n.position.x},${n.position.y}` },
    })),
    edges: flowEdges.map((e) => ({
      from: e.source,
      to: e.target,
      label: e.label ?? null,
      condition: e.data?.condition ?? null,
      priority: e.data?.priority ?? null,
      loop_restart: e.data?.loopRestart ?? false,
      attrs: e.data?.attrs ?? {},
    })),
  };
}
