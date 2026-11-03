import { describe, expect, it } from 'vitest';
import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG } from '../../../src/components/node-editor/nodeConfig';
import type { NodeType } from '../../../src/components/node-editor/types';

// Kept independent of types.ts's own NodeType union so this test still
// catches a missing/extra NODE_KIND_CONFIG entry even if a future edit to
// the union type itself is the thing that's wrong.
const ALL_NODE_TYPES: NodeType[] = [
  'Codergen',
  'Interviewer',
  'Tool',
  'Manager',
  'Conditional',
  'SubPipeline',
  'Start',
  'Exit',
  'Parallel',
  'FanIn',
];

describe('NODE_KIND_CONFIG', () => {
  it("has exactly one entry per NodeType, keyed by the backend's exact capitalized strings", () => {
    expect(Object.keys(NODE_KIND_CONFIG).sort()).toEqual([...ALL_NODE_TYPES].sort());
  });

  it('gives every entry a default attrs object for a newly added step', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      expect(NODE_KIND_CONFIG[nodeType].defaultAttrs).toBeTypeOf('object');
    }
  });
});

// The palette groups moved to stepKinds' STEP_GROUPS; Palette.test.ts checks
// that every NodeType is listed exactly once, in board order.
describe('NODE_DRAG_DATA_TYPE', () => {
  it('is a non-empty, MIME-type-shaped string shared by Palette (dragstart) and the canvas (drop)', () => {
    expect(NODE_DRAG_DATA_TYPE.length).toBeGreaterThan(0);
    expect(NODE_DRAG_DATA_TYPE).toMatch(/\//);
  });
});
