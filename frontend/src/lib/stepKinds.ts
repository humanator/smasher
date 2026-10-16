// ABOUTME: One vocabulary for step kinds: plain name, technical name, group, icon, colours and help copy
// ABOUTME: Every screen describes a node through stepKind(handler) so names, colours and copy never drift

import type { Component } from 'svelte';
import DiamondIcon from '@lucide/svelte/icons/diamond';
import FolderIcon from '@lucide/svelte/icons/folder';
import MergeIcon from '@lucide/svelte/icons/merge';
import NetworkIcon from '@lucide/svelte/icons/network';
import PlayIcon from '@lucide/svelte/icons/play';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import SplitIcon from '@lucide/svelte/icons/split';
import SquareIcon from '@lucide/svelte/icons/square';
import TerminalIcon from '@lucide/svelte/icons/terminal';
import UserIcon from '@lucide/svelte/icons/user';
import WorkflowIcon from '@lucide/svelte/icons/workflow';

export type StepGroup = 'ai' | 'tool' | 'human' | 'flow' | 'edge';

/** A heading and paragraph from the editor's About tab, e.g. ['Use it when', '…']. */
export type AboutSection = [heading: string, text: string];

export interface StepKind {
  plain: string;
  /** The name shown as "Also called …" and in technical details, e.g. "Human Gate (Interviewer)". */
  tech: string;
  /** The engine's handler name, as written in DOT and returned by the API. */
  handler: string;
  group: StepGroup;
  icon: Component;
  /** One line for the step library. */
  blurb: string;
  about: AboutSection[];
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

/** The step library's sections, in board order. */
export const STEP_GROUPS: { id: StepGroup; title: string; kinds: string[] }[] = [
  { id: 'ai', title: 'AI steps', kinds: ['Codergen', 'Manager'] },
  { id: 'tool', title: 'Tools and checks', kinds: ['Tool'] },
  { id: 'human', title: 'People', kinds: ['Interviewer'] },
  { id: 'flow', title: 'Flow', kinds: ['Conditional', 'Parallel', 'FanIn', 'SubPipeline'] },
  { id: 'edge', title: 'Start and finish', kinds: ['Start', 'Exit'] },
];

type KindCopy = Pick<StepKind, 'plain' | 'tech' | 'group' | 'icon' | 'blurb' | 'about'>;

// Copy is Main.dc.html KINDS word for word; icons are the lucide equivalents of its ICONS paths.
const KINDS: Record<string, KindCopy> = {
  Codergen: {
    plain: 'AI Agent',
    tech: 'Codergen',
    group: 'ai',
    icon: SparklesIcon,
    blurb: 'Gives an AI model a brief and lets it do the work.',
    about: [
      ['What it does', 'Starts an AI agent with your instructions. The agent can read and change files in the project while it works, and its result is passed on to the steps that follow.'],
      ['Use it when', 'You want something made or changed: drafting concepts, writing code, rewriting copy, or fixing a problem an earlier step found.'],
      ['If it goes wrong', 'With no instructions and no step name the step fails with “no prompt specified”. You can send failures down a different path with a connection rule such as outcome=fail.'],
    ],
  },
  Manager: {
    plain: 'AI Coordinator',
    tech: 'Manager',
    group: 'ai',
    icon: NetworkIcon,
    blurb: 'Asks an AI to coordinate a task and report back.',
    about: [
      ['What it does', 'Sends a task description to an AI model that acts as a coordinator, then saves what it returns for later steps.'],
      ['Use it when', 'You need to review, delegate or combine the results of earlier steps. For example: coordinate a review, or aggregate results.'],
      ['Looking for approval?', 'This step talks to an AI, not a person. To get a human decision, use an Ask a person step.'],
      ['If it goes wrong', 'Fails with “no task specified” if Task and the step name are both empty, or “invalid JSON in config” if Settings cannot be read.'],
    ],
  },
  Tool: {
    plain: 'Tool',
    tech: 'Tool',
    group: 'tool',
    icon: TerminalIcon,
    blurb: 'Runs a built-in check or a command. No AI unless the tool says so.',
    about: [
      ['What it does', 'Runs one thing and records the result: either one of four built-in tools, or a shell command on your computer. The step never calls an AI itself. Only Usability critique and Summarise critiques make a single AI call each.'],
      ['Use it when', 'Capturing screenshots, running automated checks, running tests or scripts, or producing a critique that feeds a decision.'],
      ['What it saves', 'For commands, what it printed, any errors and the exit code are saved as tool.output, tool.stderr and tool.exit_code so rules and later steps can use them.'],
      ['If it goes wrong', 'Fails if neither or both of Tool and Command are set, the tool name is not built in, Settings are not valid JSON, a command exits with anything other than 0, or the time limit runs out.'],
    ],
  },
  Interviewer: {
    plain: 'Ask a person',
    tech: 'Human Gate (Interviewer)',
    group: 'human',
    icon: UserIcon,
    blurb: 'Pauses the workflow and asks a person.',
    about: [
      ['What it does', 'Stops the run and shows a question in the app. The run carries on when someone answers. The answer is saved under this step’s name for later steps and rules to use.'],
      ['Use it when', 'You need an approval, a choice between options, some feedback, or a pick from a gallery of generated designs.'],
      ['Three ways to answer', 'Free text lets people type anything (or use the gallery). Yes or no gives an approval. Pick from a list offers your own choices.'],
    ],
  },
  Conditional: {
    plain: 'Branch',
    tech: 'Conditional',
    group: 'flow',
    icon: DiamondIcon,
    blurb: 'Chooses which path to follow next.',
    about: [
      ['What it does', 'Looks at how things stand and sends the workflow down one of the paths leaving it. The rules live on those paths, so you can edit them right here.'],
      ['Use it when', 'You want to loop until a check passes, skip a step, or handle failure differently from success.'],
      ['What rules can look at', 'The result of the step before (outcome) and any value a step saved, such as tool.output or the answer to a question.'],
      ['When several paths match', 'The path with the highest priority wins. Paths labelled success, yes or true match a good result; failure, error, no or false match a bad one.'],
    ],
  },
  Parallel: {
    plain: 'Split',
    tech: 'Parallel',
    group: 'flow',
    icon: SplitIcon,
    blurb: 'Runs several paths at the same time.',
    about: [
      ['What it does', 'Starts every path leaving this step at once instead of one after another. Pair it with a Join to wait for them all.'],
      ['Use it when', 'Several checks or variants do not depend on each other and you want them side by side.'],
    ],
  },
  FanIn: {
    plain: 'Join',
    tech: 'Fan-In',
    group: 'flow',
    icon: MergeIcon,
    blurb: 'Waits for split paths to finish, then carries on.',
    about: [
      ['What it does', 'Collects the paths started by a Split and continues once they are done.'],
      ['Good to know', 'If more than one path saves the same value, the last one to finish wins.'],
    ],
  },
  SubPipeline: {
    plain: 'Nested workflow',
    tech: 'Sub-Pipeline',
    group: 'flow',
    icon: FolderIcon,
    blurb: 'Runs another workflow as a single step.',
    about: [
      ['What it does', 'Loads a separate workflow file and runs it inside this one, sharing the same saved values.'],
      ['Use it when', 'You have a routine, such as a review process, that you want to reuse across several workflows.'],
    ],
  },
  Start: {
    plain: 'Start',
    tech: 'Start',
    group: 'edge',
    icon: PlayIcon,
    blurb: 'Where the workflow begins. You need exactly one.',
    about: [['What it does', 'The single starting point. The workflow begins here and follows the connection leaving it.']],
  },
  Exit: {
    plain: 'Finish',
    tech: 'Exit',
    group: 'edge',
    icon: SquareIcon,
    blurb: 'Where the workflow ends. You can have several.',
    about: [['What it does', 'Ends the workflow. Use more than one to mark different outcomes, like Success and Failed.']],
  },
};

export function stepKind(handler: string): StepKind {
  const known: KindCopy = KINDS[handler] ?? {
    plain: 'Step',
    tech: handler,
    group: 'flow',
    icon: WorkflowIcon,
    blurb: '',
    about: [],
  };
  return { ...known, handler, ...GROUP_COLOURS[known.group] };
}
