// ABOUTME: Tests for the step-kind vocabulary (plain name, tech name, group, icon, colours)
// ABOUTME: Checks every editor node kind is covered and every ink/tint pair meets WCAG AA in both themes

import { describe, it, expect } from 'vitest';
import { stepKind } from '../../src/lib/stepKinds';
import { NODE_KIND_CONFIG } from '../../src/components/node-editor/nodeConfig';
import { contrastRatio } from '../../src/lib/contrast';

const EXPECTED: Record<string, { plain: string; group: string }> = {
  Codergen: { plain: 'AI Agent', group: 'ai' },
  Manager: { plain: 'AI Coordinator', group: 'ai' },
  Tool: { plain: 'Tool', group: 'tool' },
  Interviewer: { plain: 'Ask a person', group: 'human' },
  Conditional: { plain: 'Branch', group: 'flow' },
  Parallel: { plain: 'Split', group: 'flow' },
  FanIn: { plain: 'Join', group: 'flow' },
  SubPipeline: { plain: 'Nested workflow', group: 'flow' },
  Start: { plain: 'Start', group: 'edge' },
  Exit: { plain: 'Finish', group: 'edge' },
};

describe('stepKind', () => {
  it('covers every kind the node editor knows about', () => {
    expect(Object.keys(NODE_KIND_CONFIG).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))('%s is "%j"', (handler, { plain, group }) => {
    const kind = stepKind(handler);
    expect(kind.plain).toBe(plain);
    expect(kind.tech).toBe(handler);
    expect(kind.group).toBe(group);
    expect(kind.icon).toBeTruthy();
  });

  it('falls back to a plain "Step" in the flow group for an unknown handler', () => {
    const kind = stepKind('Mystery');
    expect(kind.plain).toBe('Step');
    expect(kind.group).toBe('flow');
    expect(kind.tech).toBe('Mystery');
    expect(kind.ink).toBe(stepKind('Conditional').ink);
  });

  it('uses the spec colours for the light theme', () => {
    expect(stepKind('Codergen')).toMatchObject({ ink: '#3730A3', tint: '#ECEBFB' });
    expect(stepKind('Tool')).toMatchObject({ ink: '#0F5F5A', tint: '#E1F1EF' });
    expect(stepKind('Interviewer')).toMatchObject({ ink: '#8A4B06', tint: '#FBEEDA' });
    expect(stepKind('Conditional')).toMatchObject({ ink: '#334155', tint: '#E8EBF0' });
    expect(stepKind('Start')).toMatchObject({ ink: '#1E6B2E', tint: '#E3F3E6' });
  });

  describe.each([...Object.keys(EXPECTED), 'Mystery'])('%s colours', (handler) => {
    it('has ink on tint at 4.5:1 in light', () => {
      const { ink, tint } = stepKind(handler);
      expect(contrastRatio(ink, tint)).toBeGreaterThanOrEqual(4.5);
    });

    it('has ink on tint at 4.5:1 in dark', () => {
      const { inkDark, tintDark } = stepKind(handler);
      expect(contrastRatio(inkDark, tintDark)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
