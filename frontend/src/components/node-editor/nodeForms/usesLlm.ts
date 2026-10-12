// ABOUTME: Says whether a node of a given kind and attrs calls an LLM, and so gets a model picker
// ABOUTME: The one place to extend when a new node kind (or tool) starts calling a model

import type { AttrValue } from '$lib/api/workflows';

// The built-in tools that make a model call. Every other tool runs natively
// (render_capture, system_lint), and a node with a `tool_command` runs a shell
// command; neither falls back to an LLM any more.
const LLM_TOOLS = new Set(['task_critic', 'synthesis']);

/**
 * True when running a node of this kind can call a model. Codergen and Manager always
 * do. A Tool does only when it is `task_critic` or `synthesis`.
 */
export function usesLlm(nodeType: string, attrs: Record<string, AttrValue>): boolean {
  switch (nodeType) {
    case 'Codergen':
    case 'Manager':
      return true;
    case 'Tool':
      return typeof attrs.tool === 'string' && LLM_TOOLS.has(attrs.tool);
    default:
      return false;
  }
}
