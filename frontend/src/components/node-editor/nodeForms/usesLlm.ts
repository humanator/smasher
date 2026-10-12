// ABOUTME: Says whether a node of a given kind and attrs calls an LLM, and so gets a model picker
// ABOUTME: The one place to extend when a new node kind (or tool) starts calling a model

import type { AttrValue } from '$lib/api/workflows';

// Tools the engine runs itself, with no model call (see the backend chain in
// smasher-web's run_launch.rs: render_capture and system_lint are native).
const NATIVE_TOOLS = new Set(['render_capture', 'system_lint']);

/**
 * True when running a node of this kind can call a model. Codergen and Manager always
 * do. A Tool does unless it is one of the native tools or has a `tool_command`; any
 * other tool falls back to the LLM backend, as do `task_critic` and `synthesis`.
 */
export function usesLlm(nodeType: string, attrs: Record<string, AttrValue>): boolean {
  switch (nodeType) {
    case 'Codergen':
    case 'Manager':
      return true;
    case 'Tool': {
      const command = attrs.tool_command;
      if (typeof command === 'string' && command.trim()) return false;
      const tool = typeof attrs.tool === 'string' ? attrs.tool : '';
      return !NATIVE_TOOLS.has(tool);
    }
    default:
      return false;
  }
}
