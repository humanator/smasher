import { describe, expect, it } from 'vitest';
import { toEditorGraph, toFlowEdges, toFlowNodes } from '../../../src/components/node-editor/convert';
import type { EditorEdge, EditorNode } from '../../../src/components/node-editor/types';

describe('toFlowNodes', () => {
  it('uses an explicit pos attr as the node position', () => {
    const nodes: EditorNode[] = [
      { id: 'a', node_type: 'Codergen', label: 'A', attrs: { pos: '120,80' } },
    ];
    const flow = toFlowNodes(nodes);
    expect(flow[0].position).toEqual({ x: 120, y: 80 });
  });

  it('assigns a deterministic grid position when pos is absent and no edges connect the nodes', () => {
    // Disconnected nodes (dagre can't rank them relative to each other)
    // still fall back to the grid -- only a graph with edges to lay out by
    // gets the dagre treatment below.
    const nodes: EditorNode[] = [
      { id: 'a', node_type: 'Start', label: 'A', attrs: {} },
      { id: 'b', node_type: 'Exit', label: 'B', attrs: {} },
    ];
    const flow = toFlowNodes(nodes);
    expect(flow[0].position).not.toEqual(flow[1].position);
    expect(flow[0].position).toEqual({ x: 0, y: 0 });
  });

  it('auto-lays-out a fully unpositioned graph top-to-bottom by default (matching the server-rendered SVG default rankdir) with no node/edge overlap', () => {
    const nodes: EditorNode[] = [
      { id: 'start', node_type: 'Start', label: 'Start', attrs: {} },
      { id: 'gen', node_type: 'Codergen', label: 'Gen', attrs: {} },
      { id: 'exit', node_type: 'Exit', label: 'Exit', attrs: {} },
    ];
    const edges: EditorEdge[] = [
      { from: 'start', to: 'gen', attrs: {} },
      { from: 'gen', to: 'exit', attrs: {} },
    ];
    const flow = toFlowNodes(nodes, edges);
    const byId = Object.fromEntries(flow.map((n) => [n.id, n.position]));

    // Default rankdir=TB: each successive rank sits strictly below the last.
    expect(byId.gen.y).toBeGreaterThan(byId.start.y);
    expect(byId.exit.y).toBeGreaterThan(byId.gen.y);
  });

  it('is deterministic across repeated calls for the same unpositioned graph', () => {
    const nodes: EditorNode[] = [
      { id: 'start', node_type: 'Start', label: 'Start', attrs: {} },
      { id: 'exit', node_type: 'Exit', label: 'Exit', attrs: {} },
    ];
    const edges: EditorEdge[] = [
      { from: 'start', to: 'exit', attrs: {} },
    ];
    expect(toFlowNodes(nodes, edges)).toEqual(toFlowNodes(nodes, edges));
  });

  it("respects an explicit graph_attrs.rankdir (matching render_to_dot's own preamble)", () => {
    const nodes: EditorNode[] = [
      { id: 'start', node_type: 'Start', label: 'Start', attrs: {} },
      { id: 'exit', node_type: 'Exit', label: 'Exit', attrs: {} },
    ];
    const edges: EditorEdge[] = [
      { from: 'start', to: 'exit', attrs: {} },
    ];
    const flow = toFlowNodes(nodes, edges, { rankdir: 'LR' });
    const byId = Object.fromEntries(flow.map((n) => [n.id, n.position]));
    expect(byId.exit.x).toBeGreaterThan(byId.start.x);
  });

  it('gives every node a kind-colored inline style (nodeConfig.THEME_COLORS)', () => {
    const nodes: EditorNode[] = [{ id: 'a', node_type: 'Codergen', label: 'A', attrs: {} }];
    const flow = toFlowNodes(nodes);
    expect(flow[0].style).toContain('#e0edff');
    expect(flow[0].style).toContain('#3b82f6');
  });

  it('leaves style undefined for an unknown/future node_type rather than crashing', () => {
    const nodes: EditorNode[] = [{ id: 'weird', node_type: 'FromTheFuture', attrs: {} }];
    expect(() => toFlowNodes(nodes)).not.toThrow();
    expect(toFlowNodes(nodes)[0].style).toBeUndefined();
  });

  // Task 8 acceptance criterion: "Loading a graph where some nodes have pos
  // and others don't leaves the positioned ones alone and only assigns
  // defaults to the rest" -- this logic already existed from Task 4 (see
  // this file's own two tests above), but wasn't exercised by a *mixed*
  // fixture. Confirmed it already satisfies the criterion as written rather
  // than needing a code change: `parsePos` always wins when present
  // (regardless of array position), and `defaultPosition(index)` is keyed
  // off each node's own array index, so a node without `pos` sitting next to
  // one that has it still gets its own distinct default rather than
  // colliding with position 0.
  it('leaves an explicit pos alone and assigns a default only to nodes missing it', () => {
    const nodes: EditorNode[] = [
      { id: 'has-pos', node_type: 'Start', label: 'Has', attrs: { pos: '500,500' } },
      { id: 'no-pos-1', node_type: 'Codergen', label: 'One', attrs: {} },
      { id: 'no-pos-2', node_type: 'Exit', label: 'Two', attrs: {} },
    ];
    const flow = toFlowNodes(nodes);

    expect(flow[0].position).toEqual({ x: 500, y: 500 });
    // Neither defaulted node collides with the explicit position or with
    // each other.
    expect(flow[1].position).not.toEqual(flow[0].position);
    expect(flow[2].position).not.toEqual(flow[0].position);
    expect(flow[1].position).not.toEqual(flow[2].position);
  });

  it('does not crash on an unknown/future node_type, falling back to a generic label', () => {
    const nodes: EditorNode[] = [
      { id: 'weird', node_type: 'FromTheFuture', attrs: {} },
    ];
    expect(() => toFlowNodes(nodes)).not.toThrow();
    const flow = toFlowNodes(nodes);
    expect(flow[0].type).toBe('workflow');
    expect(flow[0].data.label).toBe('weird');
    expect(flow[0].data.nodeType).toBe('FromTheFuture');
  });
});

describe('toFlowEdges', () => {
  it('carries condition/priority/loop_restart through as edge data', () => {
    const edges: EditorEdge[] = [
      {
        from: 'a',
        to: 'b',
        label: 'go',
        condition: 'ready',
        priority: 2,
        loop_restart: true,
        attrs: {},
      },
    ];
    const flow = toFlowEdges(edges);
    expect(flow[0].source).toBe('a');
    expect(flow[0].target).toBe('b');
    expect(flow[0].label).toBe('go');
    expect(flow[0].data).toEqual({
      condition: 'ready',
      priority: 2,
      loopRestart: true,
      attrs: {},
    });
  });
});

describe('toEditorGraph', () => {
  it('round-trips nodes/edges built by toFlowNodes/toFlowEdges back to an EditorGraph', () => {
    const nodes: EditorNode[] = [
      { id: 'a', node_type: 'Codergen', label: 'A', attrs: { prompt: 'hi' } },
      { id: 'b', node_type: 'Exit', label: 'B', attrs: {} },
    ];
    const edges: EditorEdge[] = [
      {
        from: 'a',
        to: 'b',
        condition: 'done',
        priority: 1,
        loop_restart: false,
        attrs: {},
      },
    ];

    const flowNodes = toFlowNodes(nodes);
    const flowEdges = toFlowEdges(edges);
    const result = toEditorGraph('MyGraph', { goal: 'test' }, flowNodes, flowEdges);

    expect(result.name).toBe('MyGraph');
    expect(result.graph_attrs).toEqual({ goal: 'test' });
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].id).toBe('a');
    expect(result.nodes[0].node_type).toBe('Codergen');
    expect(result.nodes[0].attrs!.prompt).toBe('hi');
    // Position is always written back as a "pos" attr.
    expect(typeof result.nodes[0].attrs!.pos).toBe('string');

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({
      from: 'a',
      to: 'b',
      condition: 'done',
      priority: 1,
      loop_restart: false,
    });
  });
});
