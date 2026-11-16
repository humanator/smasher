// ABOUTME: Tests for the step-kind vocabulary (plain name, tech name, group, icon, colours)
// ABOUTME: Checks every editor node kind is covered and every ink/tint token pair meets WCAG AA in both themes

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
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'src', 'lib', 'stepKinds.ts'), 'utf-8');
const css = readFileSync(join(process.cwd(), 'src', 'app.css'), 'utf-8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf('\n}', start);
  const tokens: Record<string, string> = {};
  for (const m of css.slice(start, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

const themes = { light: block(':root'), dark: block('.dark') };
const tailwind = block('@theme inline');

/** Turns 'var(--kind-ai-ink)' into that theme's value. */
function resolve(value: string, tokens: Record<string, string>): string {
  const name = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  expect(name, value).toBeDefined();
  return tokens[name!];
}

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

  it('refers to the kind colour tokens by var() and keeps no dark copies', () => {
    expect(stepKind('Codergen')).toMatchObject({ ink: 'var(--kind-ai-ink)', tint: 'var(--kind-ai-tint)' });
    expect(stepKind('Tool')).toMatchObject({ ink: 'var(--kind-tool-ink)', tint: 'var(--kind-tool-tint)' });
    expect(stepKind('Interviewer')).toMatchObject({ ink: 'var(--kind-human-ink)', tint: 'var(--kind-human-tint)' });
    expect(stepKind('Conditional')).toMatchObject({ ink: 'var(--kind-flow-ink)', tint: 'var(--kind-flow-tint)' });
    expect(stepKind('Start')).toMatchObject({ ink: 'var(--kind-edge-ink)', tint: 'var(--kind-edge-tint)' });
    expect(stepKind('Codergen')).not.toHaveProperty('inkDark');
    expect(stepKind('Codergen')).not.toHaveProperty('tintDark');
  });

  it('has no raw hex colours in stepKinds.ts', () => {
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  // The values the kinds had as hex before they moved into app.css, so no screen changes colour.
  // Light pairs are Main.dc.html GROUPS; dark pairs are derived (lighter ink on a deep tint).
  it.each([
    ['ai', '#3730A3', '#ECEBFB', '#A5B4FC', '#26264A'],
    ['tool', '#0F5F5A', '#E1F1EF', '#5EEAD4', '#11302E'],
    ['human', '#8A4B06', '#FBEEDA', '#FCD34D', '#3A2A10'],
    ['flow', '#334155', '#E8EBF0', '#CBD5E1', '#2A303A'],
    ['edge', '#1E6B2E', '#E3F3E6', '#86EFAC', '#17301D'],
  ])('--kind-%s-* keep their colours in light and dark', (group, ink, tint, inkDark, tintDark) => {
    expect(themes.light[`--kind-${group}-ink`]).toBe(ink);
    expect(themes.light[`--kind-${group}-tint`]).toBe(tint);
    expect(themes.dark[`--kind-${group}-ink`]).toBe(inkDark);
    expect(themes.dark[`--kind-${group}-tint`]).toBe(tintDark);
  });

  it.each(['ai', 'tool', 'human', 'flow', 'edge'])('exposes the %s kind colours to Tailwind', (group) => {
    for (const part of ['ink', 'tint']) {
      expect(tailwind[`--color-kind-${group}-${part}`]).toBe(`var(--kind-${group}-${part})`);
    }
  });

  describe.each([...Object.keys(EXPECTED), 'Mystery'])('%s colours', (handler) => {
    it.each(Object.entries(themes))('has ink on tint at 4.5:1 in %s', (_theme, tokens) => {
      const { ink, tint } = stepKind(handler);
      expect(contrastRatio(resolve(ink, tokens), resolve(tint, tokens))).toBeGreaterThanOrEqual(4.5);
    });
  });
});
