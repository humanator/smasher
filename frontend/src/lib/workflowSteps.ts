// ABOUTME: Puts a workflow graph's steps in running order for the workflow page's "What it does" list
// ABOUTME: Finds the loop-back edges so the step list stays linear, and names steps the same way everywhere

import type { EditorEdge, EditorGraph, EditorNode } from './api/workflows';

export interface OrderedSteps {
  steps: EditorNode[];
  backEdges: EditorEdge[];
}

/** A step's name: its label, then its id. A start step with neither is "Start". */
export function stepLabel(node: EditorNode): string {
  const label = node.label?.trim();
  if (label) return label;
  if (node.id) return node.id;
  return node.node_type === 'Start' ? 'Start' : '';
}

/**
 * Steps in running order: breadth-first from the start step, following
 * out-edges by priority (highest first, as the engine picks them), then
 * declaration order. A step is listed only once every step leading into it
 * is, so a join comes after its longest branch. Loop-back edges are skipped
 * and returned separately. Steps the start can't reach follow in declaration
 * order, and exits always come last.
 */
export function orderSteps(graph: EditorGraph): OrderedSteps {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, EditorEdge[]>(graph.nodes.map((n) => [n.id, []]));
  graph.edges.forEach((e) => {
    if (byId.has(e.from) && byId.has(e.to)) outEdges.get(e.from)!.push(e);
  });
  // Array.prototype.sort is stable, so equal priorities keep declaration order.
  for (const list of outEdges.values()) list.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const start = graph.nodes.find((n) => n.node_type === 'Start');
  const backEdges = findBackEdges(graph.nodes, start, outEdges);
  const isBack = new Set(backEdges);
  const forward = (id: string) => outEdges.get(id)!.filter((e) => !isBack.has(e));

  const reached = new Set<string>();
  if (start) {
    const queue = [start.id];
    reached.add(start.id);
    while (queue.length) {
      for (const e of forward(queue.shift()!)) {
        if (!reached.has(e.to)) {
          reached.add(e.to);
          queue.push(e.to);
        }
      }
    }
  }

  const waitingOn = new Map<string, number>();
  for (const id of reached) {
    for (const e of forward(id)) waitingOn.set(e.to, (waitingOn.get(e.to) ?? 0) + 1);
  }
  const visited: EditorNode[] = [];
  const queue = start ? [start.id] : [];
  while (queue.length) {
    const id = queue.shift()!;
    visited.push(byId.get(id)!);
    for (const e of forward(id)) {
      const left = waitingOn.get(e.to)! - 1;
      waitingOn.set(e.to, left);
      if (left === 0) queue.push(e.to);
    }
  }

  const unreached = graph.nodes.filter((n) => !reached.has(n.id));
  const isExit = (n: EditorNode) => n.node_type === 'Exit';
  const steps = [
    ...visited.filter((n) => !isExit(n)),
    ...unreached.filter((n) => !isExit(n)),
    ...visited.filter(isExit),
    ...unreached.filter(isExit),
  ];
  return { steps, backEdges };
}

/** Depth-first from the start, then from any step it can't reach, collecting loop-back edges in visit order. */
function findBackEdges(
  nodes: EditorNode[],
  start: EditorNode | undefined,
  outEdges: Map<string, EditorEdge[]>
): EditorEdge[] {
  const back: EditorEdge[] = [];
  const done = new Set<string>();
  const onPath = new Set<string>();

  function visit(id: string) {
    done.add(id);
    onPath.add(id);
    for (const e of outEdges.get(id)!) {
      if (e.loop_restart || onPath.has(e.to)) back.push(e);
      else if (!done.has(e.to)) visit(e.to);
    }
    onPath.delete(id);
  }

  if (start) visit(start.id);
  for (const n of nodes) if (!done.has(n.id)) visit(n.id);
  return back;
}
