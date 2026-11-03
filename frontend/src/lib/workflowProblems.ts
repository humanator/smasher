// ABOUTME: Client-side workflow checks: graph -> problems the step cards and status bar show
// ABOUTME: Advice only; the server's save-time validation stays authoritative and nothing blocks Save

import type { AttrValue } from './api/workflows';
import { answerMode, toolMode } from './nodeSummary';
import { priorityError } from './stepFields';

/** A canvas node as WorkflowCanvas holds it (convert.ts WorkflowNodeData). */
export interface ProblemNode {
  id: string;
  data: { label: string; nodeType: string; attrs: Record<string, AttrValue | undefined> };
}

/** A canvas connection as WorkflowCanvas holds it (convert.ts WorkflowEdgeData). */
export interface ProblemEdge {
  id: string;
  source: string;
  target: string;
  data?: { priority?: unknown };
}

/** A step problem has nodeId, a connection problem edgeId, a workflow problem neither. */
export interface Problem {
  nodeId?: string;
  edgeId?: string;
  /** The step name, or "{from} → {to}" for a connection, quoted in the status bar. */
  label?: string;
  message: string;
}

// Not in the spec or Main.dc.html (D9 names the rule but gives no message); wording agreed 2026-11-03.
const BAD_PRIORITY = 'has a priority that is not a whole number';

function blank(value: AttrValue | undefined): boolean {
  return value === undefined || String(value).trim() === '';
}

function invalidJson(value: AttrValue | undefined): boolean {
  if (blank(value)) return false;
  try {
    JSON.parse(String(value));
    return false;
  } catch {
    return true;
  }
}

// Main.dc.html's seven node rules. Instructions and Task fall back to the step name, as the engine does.
function nodeMessages(node: ProblemNode): string[] {
  const { nodeType, attrs: a } = node.data;
  const unnamed = node.data.label.trim() === '';
  const out: string[] = [];
  switch (nodeType) {
    case 'Codergen':
      if (blank(a.prompt) && unnamed) out.push('is missing instructions');
      break;
    case 'Manager':
      if (blank(a.task) && unnamed) out.push('is missing a task');
      if (invalidJson(a.config)) out.push('has settings that are not valid JSON');
      break;
    case 'Tool':
      if (toolMode(a) === 'command') {
        if (blank(a.tool_command)) out.push('needs a command');
      } else {
        if (blank(a.tool)) out.push('needs a tool chosen');
        if (invalidJson(a.args)) out.push('has settings that are not valid JSON');
      }
      break;
    case 'SubPipeline':
      if (blank(a.pipeline)) out.push('needs a workflow file');
      break;
    case 'Interviewer':
      if (answerMode(a) === 'options' && blank(a.options)) out.push('needs a list of options');
      break;
  }
  return out;
}

function wholePriority(priority: unknown): boolean {
  if (priority === undefined || priority === null) return true;
  if (typeof priority === 'number') return Number.isInteger(priority);
  return typeof priority === 'string' && priorityError(priority) === '';
}

/** Every problem in canvas order: steps, then connections, then the workflow as a whole. */
export function workflowProblems(nodes: ProblemNode[], edges: ProblemEdge[]): Problem[] {
  const problems: Problem[] = [];
  for (const node of nodes) {
    for (const message of nodeMessages(node)) problems.push({ nodeId: node.id, label: node.data.label, message });
  }

  const labelOf = new Map(nodes.map((node) => [node.id, node.data.label]));
  for (const edge of edges) {
    if (!wholePriority(edge.data?.priority)) {
      const label = `${labelOf.get(edge.source) ?? edge.source} → ${labelOf.get(edge.target) ?? edge.target}`;
      problems.push({ edgeId: edge.id, label, message: BAD_PRIORITY });
    }
  }

  const starts = nodes.filter((node) => node.data.nodeType === 'Start').length;
  if (starts === 0) problems.push({ message: 'has no Start step' });
  if (starts > 1) problems.push({ message: 'has more than one Start step' });
  if (!nodes.some((node) => node.data.nodeType === 'Exit')) problems.push({ message: 'has no Finish step' });
  return problems;
}
