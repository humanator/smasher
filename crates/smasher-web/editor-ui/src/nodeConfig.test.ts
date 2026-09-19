import { describe, expect, it } from 'vitest';
import { NODE_DRAG_DATA_TYPE, NODE_KIND_CONFIG, PALETTE_GROUPS, THEME_COLORS } from './nodeConfig';
import type { NodeType } from './types';

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

  it('gives every entry a non-blank icon/title, a known theme, and a valid paletteGroup', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      const config = NODE_KIND_CONFIG[nodeType];
      expect(config.icon.trim().length).toBeGreaterThan(0);
      expect(config.title.trim().length).toBeGreaterThan(0);
      expect(THEME_COLORS[config.theme]).toBeDefined();
      expect(['pipeline-steps', 'control-flow', 'structural']).toContain(config.paletteGroup);
    }
  });
});

describe('PALETTE_GROUPS', () => {
  it('covers every NodeType exactly once, across the 3 documented groups', () => {
    const seen = PALETTE_GROUPS.flatMap((g) => g.kinds);
    expect(seen.sort()).toEqual([...ALL_NODE_TYPES].sort());
    expect(new Set(seen).size).toBe(ALL_NODE_TYPES.length);
  });

  it("matches the spec's suggested grouping (Pipeline Steps / Control Flow / Structural)", () => {
    const byId = Object.fromEntries(PALETTE_GROUPS.map((g) => [g.id, g]));
    expect(byId['pipeline-steps'].kinds).toEqual(['Codergen', 'Tool', 'Manager']);
    expect(byId['control-flow'].kinds).toEqual(['Interviewer', 'Conditional', 'SubPipeline']);
    expect(byId['structural'].kinds).toEqual(['Start', 'Exit', 'Parallel', 'FanIn']);
  });

  it('marks only the structural group as non-collapsible (Agent Flow\'s dedicated Start/Exit cards)', () => {
    for (const group of PALETTE_GROUPS) {
      expect(group.collapsible).toBe(group.id !== 'structural');
    }
  });

  it("every kind's own NODE_KIND_CONFIG.paletteGroup matches the group it's actually listed under", () => {
    for (const group of PALETTE_GROUPS) {
      for (const kind of group.kinds) {
        expect(NODE_KIND_CONFIG[kind].paletteGroup).toBe(group.id);
      }
    }
  });
});

describe('NODE_DRAG_DATA_TYPE', () => {
  it('is a non-empty, MIME-type-shaped string shared by Palette (dragstart) and the canvas (drop)', () => {
    expect(NODE_DRAG_DATA_TYPE.length).toBeGreaterThan(0);
    expect(NODE_DRAG_DATA_TYPE).toMatch(/\//);
  });
});
