// ABOUTME: Tests for workflowProblems, the client-side advice the status bar and step cards show
// ABOUTME: Each node rule, invalid JSON, edge priority, Start/Finish counts, ordering and the clean sample graph

import { describe, it, expect } from 'vitest';
import { workflowProblems, type ProblemNode, type ProblemEdge } from '../../src/lib/workflowProblems';
import type { AttrValue } from '../../src/lib/api/workflows';

function n(id: string, nodeType: string, label: string, attrs: Record<string, AttrValue> = {}): ProblemNode {
  return { id, data: { label, nodeType, attrs } };
}

function e(source: string, target: string, priority?: unknown): ProblemEdge {
  return { id: `${source}->${target}#0`, source, target, data: { priority } };
}

const START = n('start', 'Start', 'Start');
const DONE = n('done', 'Exit', 'Done');

/** Wraps nodes in a Start and a Finish so only the nodes' own problems show. */
function problems(...nodes: ProblemNode[]) {
  return workflowProblems([START, ...nodes, DONE], []);
}

// Main.dc.html's sample workflow, "Design concepts review", as the canvas holds it.
const SAMPLE_NODES: ProblemNode[] = [
  n('n1', 'Start', 'Start'),
  n('n2', 'Codergen', 'Draft three concepts', {
    prompt: 'Read the design brief in brief.md and create three distinct UI concepts as self-contained HTML files in candidates/.',
  }),
  n('n3', 'Tool', 'Check against design system', { tool: 'system_lint', args: '{"candidate_dir": "candidates/a"}' }),
  n('n4', 'Tool', 'Usability critique', { tool: 'task_critic' }),
  n('n5', 'Conditional', 'Did the checks pass?'),
  n('n6', 'Interviewer', 'Pick a favourite', { question: 'Which concept should we take forward?', gallery: true, candidate_count: '3' }),
  n('n7', 'Exit', 'Done'),
];
const SAMPLE_EDGES: ProblemEdge[] = [e('n1', 'n2'), e('n2', 'n3'), e('n3', 'n4'), e('n4', 'n5'), e('n5', 'n6', 1), e('n5', 'n2'), e('n6', 'n7')];

describe('workflowProblems', () => {
  it('finds nothing wrong with the sample graph', () => {
    expect(workflowProblems(SAMPLE_NODES, SAMPLE_EDGES)).toEqual([]);
  });

  describe('AI Agent', () => {
    it('is missing instructions only when both Instructions and the step name are empty', () => {
      expect(problems(n('a', 'Codergen', ''))).toEqual([{ nodeId: 'a', label: '', message: 'is missing instructions' }]);
      expect(problems(n('a', 'Codergen', '  ', { prompt: ' \n' }))).toHaveLength(1);
      expect(problems(n('a', 'Codergen', 'Draft'))).toEqual([]);
      expect(problems(n('a', 'Codergen', '', { prompt: 'Draft' }))).toEqual([]);
    });
  });

  describe('AI Coordinator', () => {
    it('is missing a task only when both Task and the step name are empty', () => {
      expect(problems(n('m', 'Manager', ''))).toEqual([{ nodeId: 'm', label: '', message: 'is missing a task' }]);
      expect(problems(n('m', 'Manager', 'Review'))).toEqual([]);
      expect(problems(n('m', 'Manager', '', { task: 'coordinate-review' }))).toEqual([]);
    });

    it('flags settings that are not valid JSON, after the task rule', () => {
      expect(problems(n('m', 'Manager', 'Review', { config: '{ nope' }))).toEqual([
        { nodeId: 'm', label: 'Review', message: 'has settings that are not valid JSON' },
      ]);
      expect(problems(n('m', 'Manager', '', { config: '{' })).map((p) => p.message)).toEqual([
        'is missing a task',
        'has settings that are not valid JSON',
      ]);
      expect(problems(n('m', 'Manager', 'Review', { config: '  ' }))).toEqual([]);
      expect(problems(n('m', 'Manager', 'Review', { config: '{"a": 1}' }))).toEqual([]);
    });
  });

  describe('Tool', () => {
    it('needs a tool chosen when it runs a built-in tool', () => {
      expect(problems(n('t', 'Tool', 'Check'))).toEqual([{ nodeId: 't', label: 'Check', message: 'needs a tool chosen' }]);
      expect(problems(n('t', 'Tool', 'Check', { tool: '' }))).toHaveLength(1);
      expect(problems(n('t', 'Tool', 'Check', { tool: 'system_lint' }))).toEqual([]);
    });

    it('flags Tool settings that are not valid JSON', () => {
      expect(problems(n('t', 'Tool', 'Check', { tool: 'system_lint', args: '{"a":' }))).toEqual([
        { nodeId: 't', label: 'Check', message: 'has settings that are not valid JSON' },
      ]);
    });

    it('needs a command when it runs one', () => {
      expect(problems(n('t', 'Tool', 'Test', { tool_command: '  ' }))).toEqual([{ nodeId: 't', label: 'Test', message: 'needs a command' }]);
      expect(problems(n('t', 'Tool', 'Test', { tool_command: 'npm test' }))).toEqual([]);
    });

    it('ignores leftover built-in settings in command mode', () => {
      expect(problems(n('t', 'Tool', 'Test', { tool_command: 'npm test', args: '{' }))).toEqual([]);
    });
  });

  it('a Nested workflow needs a workflow file', () => {
    expect(problems(n('s', 'SubPipeline', 'Review'))).toEqual([{ nodeId: 's', label: 'Review', message: 'needs a workflow file' }]);
    expect(problems(n('s', 'SubPipeline', 'Review', { pipeline: ' ' }))).toHaveLength(1);
    expect(problems(n('s', 'SubPipeline', 'Review', { pipeline: 'sub.dot' }))).toEqual([]);
  });

  it('Pick from a list needs a list of options', () => {
    expect(problems(n('q', 'Interviewer', 'Choose', { options: ' ' }))).toEqual([
      { nodeId: 'q', label: 'Choose', message: 'needs a list of options' },
    ]);
    expect(problems(n('q', 'Interviewer', 'Choose', { options: 'a, b' }))).toEqual([]);
    expect(problems(n('q', 'Interviewer', 'Choose'))).toEqual([]);
    expect(problems(n('q', 'Interviewer', 'Choose', { approve: true, options: '' }))).toEqual([]);
  });

  describe('connections', () => {
    it('flags a priority that is not a whole number, naming the connection', () => {
      const nodes = [START, n('a', 'Codergen', 'Draft'), DONE];
      expect(workflowProblems(nodes, [e('start', 'a', 1.5)])).toEqual([
        { edgeId: 'start->a#0', label: 'Start → Draft', message: 'has a priority that is not a whole number' },
      ]);
      expect(workflowProblems(nodes, [e('start', 'a', 'x')])).toHaveLength(1);
      expect(workflowProblems(nodes, [e('start', 'a', Number.NaN)])).toHaveLength(1);
    });

    it.each([undefined, null, 0, -2, 5, '', '3'])('accepts a priority of %j', (priority) => {
      expect(workflowProblems([START, DONE], [e('start', 'done', priority)])).toEqual([]);
    });
  });

  describe('Start and Finish', () => {
    it('flags a workflow with no Start step, without a node', () => {
      expect(workflowProblems([DONE], [])).toEqual([{ message: 'has no Start step' }]);
    });

    it('flags more than one Start step once', () => {
      expect(workflowProblems([START, n('s2', 'Start', 'Again'), n('s3', 'Start', 'Third'), DONE], [])).toEqual([
        { message: 'has more than one Start step' },
      ]);
    });

    it('flags a workflow with no Finish step', () => {
      expect(workflowProblems([START], [])).toEqual([{ message: 'has no Finish step' }]);
    });

    it('allows several Finish steps', () => {
      expect(workflowProblems([START, DONE, n('d2', 'Exit', 'Failed')], [])).toEqual([]);
    });

    it('flags both on an empty workflow', () => {
      expect(workflowProblems([], [])).toEqual([{ message: 'has no Start step' }, { message: 'has no Finish step' }]);
    });

    it('never gives a graph-level problem a node, connection or label', () => {
      for (const p of workflowProblems([], [])) {
        expect(p).not.toHaveProperty('nodeId');
        expect(p).not.toHaveProperty('edgeId');
        expect(p).not.toHaveProperty('label');
      }
    });
  });

  it('lists problems in canvas order: steps, then connections, then the workflow', () => {
    const nodes = [n('b', 'SubPipeline', 'Second'), n('a', 'Codergen', ''), n('s', 'Start', 'Start')];
    const result = workflowProblems(nodes, [e('s', 'b', 0.5)]);
    expect(result.map((p) => p.nodeId ?? p.edgeId ?? p.message)).toEqual(['b', 'a', 's->b#0', 'has no Finish step']);
  });

  it('ignores kinds with no rules', () => {
    expect(problems(n('p', 'Parallel', ''), n('j', 'FanIn', ''), n('c', 'Conditional', ''), n('x', 'Mystery', ''))).toEqual([]);
  });
});
