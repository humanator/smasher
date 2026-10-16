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

const MAX_LOOP_SENTENCES = 3;

/**
 * The step list's intro: "The steps in order." plus one plain sentence per
 * loop-back edge. Past three, the rest collapse into a count of the steps
 * they loop back from.
 */
export function describeLoops(graph: EditorGraph, order: OrderedSteps): string {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const name = (id: string) => `“${stepLabel(byId.get(id)!)}”`;
  const firstStep = order.steps.find((n) => n.node_type !== 'Start');

  const sentences = order.backEdges.slice(0, MAX_LOOP_SENTENCES).map((e) => {
    const to = e.to === firstStep?.id ? 'the first step' : name(e.to);
    const label = e.label?.trim();
    if (!label) return `After ${name(e.from)}, the workflow can go back to ${to} and try again.`;
    const says = label === label.toUpperCase() ? label : label.toLowerCase();
    return `If ${name(e.from)} says ${says}, the workflow goes back to ${to} and tries again.`;
  });

  const others = new Set(order.backEdges.slice(MAX_LOOP_SENTENCES).map((e) => e.from)).size;
  if (others > 0) {
    sentences.push(`It can also loop back from ${others} other step${others === 1 ? '' : 's'}.`);
  }
  return ['The steps in order.', ...sentences].join(' ');
}
