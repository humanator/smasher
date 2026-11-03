// ABOUTME: The one-line summary under a step card's name, from the step's kind and attrs
// ABOUTME: Per-kind rules and truncation lengths follow Main.dc.html's node cards

import type { AttrValue } from './api/workflows';
import { BUILT_IN_TOOLS } from './stepFields';

type Attrs = Record<string, AttrValue | undefined>;

function text(value: AttrValue | undefined): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/** Collapses whitespace, then cuts to `max` characters with a trailing ellipsis. */
function trunc(value: AttrValue | undefined, max: number): string {
  const s = text(value).replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** A Tool runs a shell command once `tool_command` is set (even empty), otherwise a built-in tool. */
export function toolMode(attrs: Attrs): 'builtin' | 'command' {
  return typeof attrs.tool_command === 'string' ? 'command' : 'builtin';
}

/** The answer mode an Ask a person step gets, in the handler's order: approve, options, free text. */
export function answerMode(attrs: Attrs): 'approve' | 'options' | 'freeform' {
  if (attrs.approve === true || attrs.approve === 'true') return 'approve';
  if (typeof attrs.options === 'string') return 'options';
  return 'freeform';
}

function answerPrefix(attrs: Attrs): string {
  switch (answerMode(attrs)) {
    case 'approve':
      return 'Yes or no · ';
    case 'options':
      return 'Pick from a list · ';
    default:
      return attrs.gallery === true || attrs.gallery === 'true' ? 'Gallery · ' : 'Free text · ';
  }
}

/** The card's summary line, or '' for kinds that have none. `outgoing` counts the step's connections out. */
export function nodeSummary(node: { nodeType: string; attrs: Attrs }, outgoing = 0): string {
  const a = node.attrs;
  switch (node.nodeType) {
    case 'Codergen':
      return trunc(a.prompt, 60) || 'No instructions yet';
    case 'Manager':
      return trunc(a.task, 60) || 'No task yet';
    case 'Tool': {
      if (toolMode(a) === 'command') {
        const command = trunc(a.tool_command, 50);
        return command ? `$ ${command}` : 'Add a command';
      }
      return BUILT_IN_TOOLS.find((t) => t.value === a.tool)?.title ?? 'Choose a tool';
    }
    case 'Interviewer':
      return answerPrefix(a) + trunc(a.question, 36);
    case 'Conditional':
      return `${outgoing} paths out`;
    case 'SubPipeline':
      return text(a.pipeline).trim() || 'No file chosen';
    default:
      return '';
  }
}
