// ABOUTME: Conversion between editor graph and flow library formats
// ABOUTME: Graph layout with dagre, node/edge rendering, round-trip serialization

import dagre from '@dagrejs/dagre';
import { MarkerType, type Edge as FlowEdge, type Node as FlowNode } from '@xyflow/svelte';
import { nodeStyleFor } from './nodeConfig';
import type { EditorEdge, EditorGraph, EditorNode } from './types';

// Matches rendering.rs's own `rankdir` graph_attr default -- kept in sync so
// a graph that never sets `rankdir` explicitly lays out the same direction
// on canvas as it does in its server-rendered run-view SVG. Both sides
// picked top-to-bottom over graphviz's own left-to-right default: pipeline
// steps read more naturally as a vertical list at the width most of this
// editor's UI (side panel + palette eating horizontal space) actually has
// to work with.
export const DEFAULT_RANKDIR = 'TB';

// Node canvas position has nowhere to live in the DOT/Graph model (spec
// Assumption 5): it rides through as an ordinary "pos" generic node attr,
// formatted "x,y". A node with no (or an unparseable) pos gets a
// deterministic grid position instead of stacking at (0,0).
const GRID_COLUMNS = 4;
const GRID_SPACING_X = 220;
const GRID_SPACING_Y = 120;

// Sized to comfortably fit a themed node card's label without dagre packing
// ranks/rows too tightly -- there's no real DOM measurement available at
// conversion time (nodes aren't mounted yet), so this is a fixed estimate,
// same tradeoff render_capture's own fixed-viewport screenshots accept.
const DAGRE_NODE_WIDTH = 180;
const DAGRE_NODE_HEIGHT = 56;
const DAGRE_RANK_SEP = 90;
const DAGRE_NODE_SEP = 60;

function parsePos(attrs: Record<string, unknown> | undefined): { x: number; y: number } | null {
  if (!attrs) return null;
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

// A graph freshly opened in the editor for the first time (hand-authored
// .dot, never saved via this editor) has no `pos` on any node -- the old
// per-node grid fallback ignored edges entirely, so anything beyond a
// trivial pipeline rendered with connector lines cutting straight through
// unrelated node cards. Graphviz's own `dot` layout (what run_to_dot_with_
// status's server-rendered SVG already uses -- rendering.rs) is a layered/
// ranked algorithm for exactly this reason; dagre implements the same
// family of algorithm client-side. Only engaged when *every* node is
// missing pos: a graph with a mix of positioned and unpositioned nodes has
// already been arranged by a human in this editor at least once, and
// rerunning a global auto-layout would silently discard that arrangement
// out from under them -- the existing per-node grid fallback still covers
// that mixed case, unchanged.
function dagreLayout(
  nodeIds: string[],
  edges: EditorEdge[],
  rankdir: string,
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir, nodesep: DAGRE_NODE_SEP, ranksep: DAGRE_RANK_SEP });
  g.setDefaultEdgeLabel(() => ({}));
  for (const id of nodeIds) {
    g.setNode(id, { width: DAGRE_NODE_WIDTH, height: DAGRE_NODE_HEIGHT });
  }
  const knownIds = new Set(nodeIds);
  for (const e of edges) {
    if (knownIds.has(e.from) && knownIds.has(e.to)) {
      g.setEdge(e.from, e.to);
    }
  }
  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const id of nodeIds) {
    const laidOut = g.node(id);
    // dagre positions a node by its center; Svelte Flow positions by
    // top-left corner.
    positions.set(id, { x: laidOut.x - DAGRE_NODE_WIDTH / 2, y: laidOut.y - DAGRE_NODE_HEIGHT / 2 });
  }
  return positions;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  attrs: Record<string, unknown>;
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  condition: string | null | undefined;
  priority: number | null | undefined;
  loopRestart: boolean;
  attrs: Record<string, unknown>;
}

export function toFlowNodes(
  editorNodes: EditorNode[],
  editorEdges: EditorEdge[] = [],
  graphAttrs: Record<string, unknown> = {},
): FlowNode<WorkflowNodeData>[] {
  const explicitPositions = editorNodes.map((n) => parsePos(n.attrs));
  // Edges are what dagre ranks nodes by -- a graph with no edges at all has
  // nothing for it to lay out relative to, so it falls back to the plain
  // grid same as before (also covers the "no nodes" degenerate case).
  const allMissingPos =
    editorNodes.length > 0 && editorEdges.length > 0 && explicitPositions.every((p) => p === null);
  // Mirrors rendering.rs's own `rankdir` graph_attr lookup/default so a
  // graph that sets it gets the same flow direction on canvas as its
  // server-rendered run-view SVG.
  const rankdir = typeof graphAttrs.rankdir === 'string' ? graphAttrs.rankdir : DEFAULT_RANKDIR;
  const layout = allMissingPos
    ? dagreLayout(
        editorNodes.map((n) => n.id),
        editorEdges,
        rankdir,
      )
    : null;

  return editorNodes.map((n, i) => ({
    id: n.id,
    // WorkflowNode.svelte (registered as the "workflow" nodeTypes entry in
    // WorkflowCanvasInner.svelte) renders whatever `data.label` is,
    // regardless of `nodeType`, so an unrecognized/future node_type string
    // can't crash rendering here -- same fallback convention as Task 4's
    // original "default" node type it replaces.
    type: 'workflow',
    position: explicitPositions[i] ?? layout?.get(n.id) ?? defaultPosition(i),
    // Kind-colored card background/border (see nodeConfig.ts's nodeStyleFor)
    // -- was documented as wired up here since Task 6 but never actually
    // called, so every node rendered in the library's uncolored default
    // regardless of kind.
    style: nodeStyleFor(n.node_type),
    data: { label: n.label ?? n.id, nodeType: n.node_type, attrs: n.attrs ?? {} },
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
    // Control-flow direction (source -> target) is the entire point of a
    // pipeline DAG, but nothing on the loaded-edge path ever set a marker,
    // so every connection rendered as a plain undirected line. No `color`
    // override -- leaving it unset makes the arrowhead inherit the edge's
    // own stroke (`context-stroke`), the same "one source of truth" the
    // stylesheet's --xy-edge-stroke-default override already relies on.
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      condition: e.condition,
      priority: e.priority,
      loopRestart: e.loop_restart ?? false,
      attrs: e.attrs ?? {},
    },
  }));
}

export function toEditorGraph(
  name: string | null | undefined,
  graphAttrs: Record<string, unknown>,
  flowNodes: FlowNode<WorkflowNodeData>[],
  flowEdges: FlowEdge<WorkflowEdgeData>[],
): EditorGraph {
  return {
    name: name ?? undefined,
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
      label: e.label ?? undefined,
      condition: e.data?.condition ?? undefined,
      priority: e.data?.priority ?? undefined,
      loop_restart: e.data?.loopRestart ?? false,
      attrs: e.data?.attrs ?? {},
    })),
  };
}
