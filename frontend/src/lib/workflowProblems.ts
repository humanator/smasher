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

// The node rules that each belong to one field, by kind and attr. The inspector shows the message
// on that field while the rule fires (spec R5: a Required field left empty shows the R6 message).
const FIELD_RULES: Record<string, Record<string, string>> = {
  Codergen: { prompt: 'is missing instructions' },
  Manager: { task: 'is missing a task' },
  Tool: { tool: 'needs a tool chosen', tool_command: 'needs a command' },
  SubPipeline: { pipeline: 'needs a workflow file' },
  Interviewer: { options: 'needs a list of options' },
};
const rule = (kind: string, attr: string) => FIELD_RULES[kind][attr];

/** The field's own problem among a step's problem messages, as a sentence ("Needs a command."), or ''. */
export function fieldProblem(handler: string, attr: string, messages: string[]): string {
  const message = FIELD_RULES[handler]?.[attr];
  if (!message || !messages.includes(message)) return '';
  return `${message[0].toUpperCase()}${message.slice(1)}.`;
}

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
      if (blank(a.prompt) && unnamed) out.push(rule('Codergen', 'prompt'));
      break;
    case 'Manager':
      if (blank(a.task) && unnamed) out.push(rule('Manager', 'task'));
      if (invalidJson(a.config)) out.push('has settings that are not valid JSON');
      break;
    case 'Tool':
      if (toolMode(a) === 'command') {
        if (blank(a.tool_command)) out.push(rule('Tool', 'tool_command'));
      } else {
        if (blank(a.tool)) out.push(rule('Tool', 'tool'));
        if (invalidJson(a.args)) out.push('has settings that are not valid JSON');
      }
      break;
    case 'SubPipeline':
      if (blank(a.pipeline)) out.push(rule('SubPipeline', 'pipeline'));
      break;
    case 'Interviewer':
      if (answerMode(a) === 'options' && blank(a.options)) out.push(rule('Interviewer', 'options'));
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
