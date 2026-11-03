// ABOUTME: Node-kind canvas configuration: the default attrs a newly added step starts with
// ABOUTME: Names, groups, icons and colours live in $lib/stepKinds; field copy in $lib/stepFields

import type { AttrValue, NodeType } from './types';

// One entry per NodeType. A `Record<NodeType, ...>` (not `Record<string,
// ...>`) so TypeScript's exhaustiveness checking catches a missing kind at
// compile time, and the canvas can tell a known kind from an unrecognized
// one before adding a node (spec D8).
export interface NodeKindConfig {
  /** Attrs a step of this kind starts with when added from the step library. */
  defaultAttrs: Record<string, AttrValue>;
}

// Every kind starts empty, as the editor always has: each step's problems
// (workflowProblems) then say what it still needs.
export const NODE_KIND_CONFIG: Record<NodeType, NodeKindConfig> = {
  Codergen: { defaultAttrs: {} },
  Tool: { defaultAttrs: {} },
  Manager: { defaultAttrs: {} },
  Interviewer: { defaultAttrs: {} },
  Conditional: { defaultAttrs: {} },
  SubPipeline: { defaultAttrs: {} },
  Start: { defaultAttrs: {} },
  Exit: { defaultAttrs: {} },
  Parallel: { defaultAttrs: {} },
  FanIn: { defaultAttrs: {} },
};

// Shared between Palette.svelte's dragstart and WorkflowCanvasInner's drop
// handler -- the DataTransfer key a dropped palette entry's NodeType rides
// on. Namespaced (not just "text/plain") so a drop handler here never
// misfires on drag data meant for something else on the page.
export const NODE_DRAG_DATA_TYPE = 'application/x-workflow-node-type';
