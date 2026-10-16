// ABOUTME: Tests for the step-kind vocabulary (plain name, tech name, group, icon, colours)
// ABOUTME: Checks every editor node kind is covered and every ink/tint pair meets WCAG AA in both themes

import { describe, it, expect } from 'vitest';
import { stepKind, STEP_GROUPS } from '../../src/lib/stepKinds';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import NetworkIcon from '@lucide/svelte/icons/network';
import TerminalIcon from '@lucide/svelte/icons/terminal';
import UserIcon from '@lucide/svelte/icons/user';
import DiamondIcon from '@lucide/svelte/icons/diamond';
import SplitIcon from '@lucide/svelte/icons/split';
import MergeIcon from '@lucide/svelte/icons/merge';
import FolderIcon from '@lucide/svelte/icons/folder';
import PlayIcon from '@lucide/svelte/icons/play';
import SquareIcon from '@lucide/svelte/icons/square';
import { NODE_KIND_CONFIG } from '../../src/components/node-editor/nodeConfig';
import { contrastRatio } from '../../src/lib/contrast';

// Main.dc.html KINDS and ICONS (icons are the lucide equivalents of the board paths).
const EXPECTED: Record<string, { plain: string; tech: string; group: string; icon: unknown }> = {
  Codergen: { plain: 'AI Agent', tech: 'Codergen', group: 'ai', icon: SparklesIcon },
  Manager: { plain: 'AI Coordinator', tech: 'Manager', group: 'ai', icon: NetworkIcon },
  Tool: { plain: 'Tool', tech: 'Tool', group: 'tool', icon: TerminalIcon },
  Interviewer: { plain: 'Ask a person', tech: 'Human Gate (Interviewer)', group: 'human', icon: UserIcon },
  Conditional: { plain: 'Branch', tech: 'Conditional', group: 'flow', icon: DiamondIcon },
  Parallel: { plain: 'Split', tech: 'Parallel', group: 'flow', icon: SplitIcon },
  FanIn: { plain: 'Join', tech: 'Fan-In', group: 'flow', icon: MergeIcon },
  SubPipeline: { plain: 'Nested workflow', tech: 'Sub-Pipeline', group: 'flow', icon: FolderIcon },
  Start: { plain: 'Start', tech: 'Start', group: 'edge', icon: PlayIcon },
  Exit: { plain: 'Finish', tech: 'Exit', group: 'edge', icon: SquareIcon },
};

describe('stepKind', () => {
  it('covers every kind the node editor knows about', () => {
    expect(Object.keys(NODE_KIND_CONFIG).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))('%s matches the Main board', (handler, { plain, tech, group, icon }) => {
    const kind = stepKind(handler);
    expect(kind.plain).toBe(plain);
    expect(kind.tech).toBe(tech);
    expect(kind.handler).toBe(handler);
    expect(kind.group).toBe(group);
    expect(kind.icon).toBe(icon);
    expect(kind.blurb.length).toBeGreaterThan(0);
    expect(kind.about[0][0]).toBe('What it does');
  });

  it('carries the board blurbs word for word', () => {
    expect(stepKind('Codergen').blurb).toBe('Gives an AI model a brief and lets it do the work.');
    expect(stepKind('Exit').blurb).toBe('Where the workflow ends. You can have several.');
  });

  it('lists the palette groups in board order with their titles and kinds', () => {
    expect(STEP_GROUPS.map((g) => [g.id, g.title, g.kinds])).toEqual([
      ['ai', 'AI steps', ['Codergen', 'Manager']],
      ['tool', 'Tools and checks', ['Tool']],
      ['human', 'People', ['Interviewer']],
      ['flow', 'Flow', ['Conditional', 'Parallel', 'FanIn', 'SubPipeline']],
      ['edge', 'Start and finish', ['Start', 'Exit']],
    ]);
  });

  it('falls back to a plain "Step" in the flow group for an unknown handler', () => {
    const kind = stepKind('Mystery');
    expect(kind.plain).toBe('Step');
    expect(kind.group).toBe('flow');
    expect(kind.tech).toBe('Mystery');
    expect(kind.handler).toBe('Mystery');
    expect(kind.about).toEqual([]);
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
