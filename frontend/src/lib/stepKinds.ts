// ABOUTME: One vocabulary for step kinds: plain name, technical name, group, icon and colours
// ABOUTME: Every screen describes a node through stepKind(handler) so names and colours never drift

import type { Component } from 'svelte';
import BotIcon from '@lucide/svelte/icons/bot';
import BrainIcon from '@lucide/svelte/icons/brain';
import CirclePlayIcon from '@lucide/svelte/icons/circle-play';
import FlagIcon from '@lucide/svelte/icons/flag';
import GitBranchIcon from '@lucide/svelte/icons/git-branch';
import MergeIcon from '@lucide/svelte/icons/merge';
import SplitIcon from '@lucide/svelte/icons/split';
import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
import UserIcon from '@lucide/svelte/icons/user';
import WorkflowIcon from '@lucide/svelte/icons/workflow';

export type StepGroup = 'ai' | 'tool' | 'human' | 'flow' | 'edge';

export interface StepKind {
  plain: string;
  tech: string;
  group: StepGroup;
  icon: Component;
  ink: string;
  tint: string;
  inkDark: string;
  tintDark: string;
}

// Group colours from Main.dc.html GROUPS; the dark pairs are derived (lighter ink on a deep tint).
const GROUP_COLOURS: Record<StepGroup, Pick<StepKind, 'ink' | 'tint' | 'inkDark' | 'tintDark'>> = {
  ai: { ink: '#3730A3', tint: '#ECEBFB', inkDark: '#A5B4FC', tintDark: '#26264A' },
  tool: { ink: '#0F5F5A', tint: '#E1F1EF', inkDark: '#5EEAD4', tintDark: '#11302E' },
  human: { ink: '#8A4B06', tint: '#FBEEDA', inkDark: '#FCD34D', tintDark: '#3A2A10' },
  flow: { ink: '#334155', tint: '#E8EBF0', inkDark: '#CBD5E1', tintDark: '#2A303A' },
  edge: { ink: '#1E6B2E', tint: '#E3F3E6', inkDark: '#86EFAC', tintDark: '#17301D' },
};

const KINDS: Record<string, { plain: string; group: StepGroup; icon: Component }> = {
  Codergen: { plain: 'AI Agent', group: 'ai', icon: BotIcon },
  Manager: { plain: 'AI Coordinator', group: 'ai', icon: BrainIcon },
  Tool: { plain: 'Tool', group: 'tool', icon: SquareTerminalIcon },
  Interviewer: { plain: 'Ask a person', group: 'human', icon: UserIcon },
  Conditional: { plain: 'Branch', group: 'flow', icon: GitBranchIcon },
  Parallel: { plain: 'Split', group: 'flow', icon: SplitIcon },
  FanIn: { plain: 'Join', group: 'flow', icon: MergeIcon },
  SubPipeline: { plain: 'Nested workflow', group: 'flow', icon: WorkflowIcon },
  Start: { plain: 'Start', group: 'edge', icon: CirclePlayIcon },
  Exit: { plain: 'Finish', group: 'edge', icon: FlagIcon },
};

export function stepKind(handler: string): StepKind {
  const known = KINDS[handler] ?? { plain: 'Step', group: 'flow' as const, icon: WorkflowIcon };
  return { ...known, tech: handler, ...GROUP_COLOURS[known.group] };
}
