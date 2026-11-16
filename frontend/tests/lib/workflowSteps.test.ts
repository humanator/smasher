// ABOUTME: Tests for the workflow page's step ordering and step labels
// ABOUTME: Covers linear, looping, parallel, unreachable, multi-exit, self-loop and empty graphs

import { describe, it, expect } from 'vitest';
import { describeLoops, orderSteps, stepLabel } from '../../src/lib/workflowSteps';
import type { EditorEdge, EditorGraph, EditorNode } from '../../src/lib/api/workflows';

function node(id: string, node_type = 'Codergen', label?: string): EditorNode {
  return label === undefined ? { id, node_type } : { id, node_type, label };
}

function edge(from: string, to: string, extra: Partial<EditorEdge> = {}): EditorEdge {
  return { from, to, ...extra };
}

function ids(graph: EditorGraph): string[] {
  return orderSteps(graph).steps.map((n) => n.id);
}

function expectEachNodeOnce(graph: EditorGraph) {
  const order = ids(graph);
  expect([...order].sort()).toEqual(graph.nodes.map((n) => n.id).sort());
}

describe('orderSteps', () => {
  it('keeps a linear graph in running order', () => {
    const graph: EditorGraph = {
      nodes: [node('exit', 'Exit'), node('b'), node('a'), node('start', 'Start')],
      edges: [edge('start', 'a'), edge('a', 'b'), edge('b', 'exit')],
    };
    expect(ids(graph)).toEqual(['start', 'a', 'b', 'exit']);
    expect(orderSteps(graph).backEdges).toEqual([]);
    expectEachNodeOnce(graph);
  });

  it("orders the design's seven steps and collects the Branch's loop back", () => {
    const loop = edge('checks', 'draft', { label: 'no' });
    const graph: EditorGraph = {
      nodes: [
        node('start', 'Start'),
        node('draft', 'Codergen', 'Draft three concepts'),
        node('lint', 'Tool', 'Check against design system'),
        node('critique', 'Tool', 'Usability critique'),
        node('checks', 'Conditional', 'Did the checks pass?'),
        node('pick', 'Interviewer', 'Pick a favourite'),
        node('done', 'Exit', 'Done'),
      ],
      edges: [
        edge('start', 'draft'),
        edge('draft', 'lint'),
        edge('lint', 'critique'),
        edge('critique', 'checks'),
        edge('checks', 'pick', { label: 'yes' }),
        loop,
        edge('pick', 'done'),
      ],
    };
    expect(ids(graph)).toEqual(['start', 'draft', 'lint', 'critique', 'checks', 'pick', 'done']);
    expect(orderSteps(graph).backEdges).toEqual([loop]);
    expectEachNodeOnce(graph);
  });

  it('treats a loop_restart edge as a back edge even when it points forward', () => {
    const restart = edge('a', 'b', { loop_restart: true });
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('a'), node('b'), node('exit', 'Exit')],
      edges: [edge('start', 'a'), restart, edge('a', 'b'), edge('b', 'exit')],
    };
    expect(ids(graph)).toEqual(['start', 'a', 'b', 'exit']);
    expect(orderSteps(graph).backEdges).toEqual([restart]);
  });

  it('lists both parallel branches before the join, higher priority first', () => {
    const graph: EditorGraph = {
      nodes: [
        node('start', 'Start'),
        node('split', 'Parallel'),
        node('left'),
        node('right'),
        node('join', 'FanIn'),
        node('exit', 'Exit'),
      ],
      edges: [
        edge('start', 'split'),
        edge('split', 'left'),
        edge('split', 'right', { priority: 5 }),
        edge('left', 'join'),
        edge('right', 'join'),
        edge('join', 'exit'),
      ],
    };
    expect(ids(graph)).toEqual(['start', 'split', 'right', 'left', 'join', 'exit']);
    expectEachNodeOnce(graph);
  });

  it('keeps a join after a longer branch', () => {
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('a1'), node('a2'), node('b'), node('join', 'FanIn')],
      edges: [
        edge('start', 'a1'),
        edge('start', 'b'),
        edge('a1', 'a2'),
        edge('a2', 'join'),
        edge('b', 'join'),
      ],
    };
    expect(ids(graph)).toEqual(['start', 'a1', 'b', 'a2', 'join']);
  });

  it('breaks priority ties by declaration order', () => {
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('z'), node('y')],
      edges: [edge('start', 'z'), edge('start', 'y')],
    };
    expect(ids(graph)).toEqual(['start', 'z', 'y']);
  });

  it('appends steps the start cannot reach, in declaration order, before the exits', () => {
    const graph: EditorGraph = {
      nodes: [node('orphan2'), node('start', 'Start'), node('a'), node('exit', 'Exit'), node('orphan1')],
      edges: [edge('start', 'a'), edge('a', 'exit')],
    };
    expect(ids(graph)).toEqual(['start', 'a', 'orphan2', 'orphan1', 'exit']);
    expectEachNodeOnce(graph);
  });

  it('puts every exit last', () => {
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('branch', 'Conditional'), node('fail', 'Exit'), node('ok', 'Exit'), node('fix')],
      edges: [
        edge('start', 'branch'),
        edge('branch', 'fail'),
        edge('branch', 'fix'),
        edge('fix', 'ok'),
      ],
    };
    expect(ids(graph)).toEqual(['start', 'branch', 'fix', 'fail', 'ok']);
    expectEachNodeOnce(graph);
  });

  it('collects a self-loop as a back edge', () => {
    const self = edge('a', 'a');
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('a'), node('exit', 'Exit')],
      edges: [edge('start', 'a'), self, edge('a', 'exit')],
    };
    expect(ids(graph)).toEqual(['start', 'a', 'exit']);
    expect(orderSteps(graph).backEdges).toEqual([self]);
    expectEachNodeOnce(graph);
  });

  it('collects several back edges in visit order', () => {
    const fromC = edge('c', 'a');
    const fromB = edge('b', 'a');
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('a'), node('b'), node('c'), node('exit', 'Exit')],
      edges: [edge('start', 'a'), edge('a', 'b'), fromC, edge('b', 'c'), fromB, edge('c', 'exit')],
    };
    expect(orderSteps(graph).backEdges).toEqual([fromC, fromB]);
  });

  it('returns nothing for an empty graph', () => {
    expect(orderSteps({ nodes: [], edges: [] })).toEqual({ steps: [], backEdges: [] });
  });

  it('ignores edges to steps that do not exist', () => {
    const graph: EditorGraph = {
      nodes: [node('start', 'Start'), node('a')],
      edges: [edge('start', 'ghost'), edge('start', 'a')],
    };
    expect(ids(graph)).toEqual(['start', 'a']);
  });
});

describe('stepLabel', () => {
  it('uses the label when there is one', () => {
    expect(stepLabel(node('draft', 'Codergen', 'Draft three concepts'))).toBe('Draft three concepts');
  });

  it('falls back to the id when the label is missing or blank', () => {
    expect(stepLabel(node('draft'))).toBe('draft');
    expect(stepLabel(node('draft', 'Codergen', '  '))).toBe('draft');
  });

  it('calls a start step with neither label nor id "Start"', () => {
    expect(stepLabel(node('', 'Start'))).toBe('Start');
  });
});

describe('describeLoops', () => {
  const nodes = [
    node('start', 'Start'),
    node('draft', 'Codergen', 'Draft three concepts'),
    node('lint', 'Tool', 'Check against design system'),
    node('critique', 'Tool', 'Usability critique'),
    node('checks', 'Conditional', 'Did the checks pass?'),
    node('done', 'Exit', 'Done'),
  ];
  const chain = [
    edge('start', 'draft'),
    edge('draft', 'lint'),
    edge('lint', 'critique'),
    edge('critique', 'checks'),
    edge('checks', 'done'),
  ];

  function describe_(extra: EditorEdge[], graphNodes = nodes): string {
    const graph: EditorGraph = { nodes: graphNodes, edges: [...chain, ...extra] };
    return describeLoops(graph, orderSteps(graph));
  }

  it('says only "The steps in order." when nothing loops', () => {
    expect(describe_([])).toBe('The steps in order.');
  });

  it('explains a labelled loop back to the first step', () => {
    expect(describe_([edge('checks', 'draft', { label: 'No' })])).toBe(
      'The steps in order. If “Did the checks pass?” says no, the workflow goes back to the first step and tries again.'
    );
  });

  it('names a middle step it loops back to and words an unlabelled loop', () => {
    expect(describe_([edge('checks', 'lint')])).toBe(
      'The steps in order. After “Did the checks pass?”, the workflow can go back to “Check against design system” and try again.'
    );
  });

  it('keeps an all-capitals label as written', () => {
    expect(describe_([edge('checks', 'draft', { label: 'FAIL' })])).toBe(
      'The steps in order. If “Did the checks pass?” says FAIL, the workflow goes back to the first step and tries again.'
    );
  });

  it('treats a blank label as no label', () => {
    expect(describe_([edge('checks', 'lint', { label: ' ' })])).toContain('After “Did the checks pass?”');
  });

  it('names steps through stepLabel, so an unlabelled step reads as its id', () => {
    const unlabelled = nodes.map((n) => (n.id === 'checks' ? node('checks', 'Conditional') : n));
    expect(describe_([edge('checks', 'lint')], unlabelled)).toContain('After “checks”,');
  });

  it('collapses loops after the third into one sentence, singular', () => {
    const text = describe_([
      edge('lint', 'draft'),
      edge('critique', 'draft'),
      edge('checks', 'draft'),
      edge('checks', 'lint', { label: 'retry' }),
    ]);
    expect(text.match(/go(es)? back to/g)).toHaveLength(3);
    expect(text.endsWith(' It can also loop back from 1 other step.')).toBe(true);
  });

  it('collapses loops after the third into one sentence, plural', () => {
    const text = describe_([
      edge('lint', 'draft'),
      edge('critique', 'draft'),
      edge('checks', 'draft'),
      edge('critique', 'lint'),
      edge('checks', 'lint'),
    ]);
    expect(text.endsWith(' It can also loop back from 2 other steps.')).toBe(true);
  });
});
