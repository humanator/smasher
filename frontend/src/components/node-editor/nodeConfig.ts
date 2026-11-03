// ABOUTME: Node-kind visual registry and configuration
// ABOUTME: Titles, palette grouping and the drag payload type for all node types

import type { NodeType } from './types';

// Node-kind visual registry (spec Assumption 2): one entry per NodeType,
// mirroring AntV X6's Agent Flow example's JSON-driven AGENT_CONFIGS --
// data-driven, not hardcoded per component, so adding a kind's visuals
// later doesn't mean touching every place that lists kinds. A
// `Record<NodeType, ...>` (not `Record<string, ...>`) so TypeScript's
// exhaustiveness checking catches a missing entry at compile time.

export type PaletteGroupId = 'pipeline-steps' | 'control-flow' | 'structural';

export interface NodeKindConfig {
  icon: string;
  title: string;
  paletteGroup: PaletteGroupId;
  // One-line, plain-language summary of what this node kind actually does
  // at run time -- grounded in docs/handler-reference.md's per-handler
  // description for each NodeType. Shown in the palette and in the
  // selected-node inspector panel so a human authoring a graph doesn't
  // have to already know the handler docs to guess what a kind is for.
  description: string;
}

export const NODE_KIND_CONFIG: Record<NodeType, NodeKindConfig> = {
  Codergen: {
    icon: 'LLM',
    title: 'Codergen',
    paletteGroup: 'pipeline-steps',
    description: 'Runs an AI coding agent from a prompt to generate or modify code.',
  },
  Tool: {
    icon: 'TL',
    title: 'Tool',
    paletteGroup: 'pipeline-steps',
    description: 'Runs a built-in tool (render/capture, lint, critique, etc.) or a shell command in the run directory.',
  },
  Manager: {
    icon: 'MGR',
    title: 'Manager',
    paletteGroup: 'pipeline-steps',
    description: 'Delegates a coordination task to an AI agent.',
  },
  Interviewer: {
    icon: '?',
    title: 'Human Gate',
    paletteGroup: 'control-flow',
    description: 'Pauses for human input -- asks a question, optionally with a gallery of candidates to pick from.',
  },
  Conditional: {
    icon: 'IF',
    title: 'Conditional',
    paletteGroup: 'control-flow',
    description: 'Branches the pipeline based on a condition evaluated against the current context.',
  },
  SubPipeline: {
    icon: 'SUB',
    title: 'Sub-Pipeline',
    paletteGroup: 'control-flow',
    description: "Runs another workflow file as a nested sub-pipeline.",
  },
  Start: {
    icon: '▶',
    title: 'Start',
    paletteGroup: 'structural',
    description: "The pipeline's single entry point.",
  },
  Exit: {
    icon: '■',
    title: 'Exit',
    paletteGroup: 'structural',
    description: 'A pipeline exit point.',
  },
  Parallel: {
    icon: '⑂',
    title: 'Parallel',
    paletteGroup: 'structural',
    description: 'Runs its downstream branches concurrently.',
  },
  FanIn: {
    icon: '⑃',
    title: 'Fan-In',
    paletteGroup: 'structural',
    description: 'Waits for concurrent branches to finish before continuing.',
  },
};

export interface PaletteGroupDef {
  id: PaletteGroupId;
  label: string;
  // Agent Flow's "dedicated Start/Exit cards distinct from working node
  // kinds" (spec Assumption 2) -- the structural group is always visible,
  // the other two are independently collapsible.
  collapsible: boolean;
  kinds: NodeType[];
}

// Suggested palette grouping from the spec, adapted from Agent Flow's
// "Business Logic" / "Knowledge Base & Data" split onto this project's
// actual NodeType kinds.
export const PALETTE_GROUPS: PaletteGroupDef[] = [
  { id: 'pipeline-steps', label: 'Pipeline Steps', collapsible: true, kinds: ['Codergen', 'Tool', 'Manager'] },
  { id: 'control-flow', label: 'Control Flow', collapsible: true, kinds: ['Interviewer', 'Conditional', 'SubPipeline'] },
  { id: 'structural', label: 'Structural', collapsible: false, kinds: ['Start', 'Exit', 'Parallel', 'FanIn'] },
];

// Shared between Palette.svelte's dragstart and WorkflowCanvasInner's drop
// handler -- the DataTransfer key a dropped palette entry's NodeType rides
// on. Namespaced (not just "text/plain") so a drop handler here never
// misfires on drag data meant for something else on the page.
export const NODE_DRAG_DATA_TYPE = 'application/x-workflow-node-type';
