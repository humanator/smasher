// ABOUTME: Tests for nodeSummary, the one-line summary under a step card's name
// ABOUTME: One case per kind, truncation at the 60/50/36 character boundaries, and the empty states

import { describe, it, expect } from 'vitest';
import { nodeSummary, toolMode, answerMode } from '../../src/lib/nodeSummary';
import type { AttrValue } from '../../src/lib/api/workflows';

function node(nodeType: string, attrs: Record<string, AttrValue> = {}) {
  return { nodeType, attrs };
}

const chars = (n: number) => 'x'.repeat(n);

describe('nodeSummary', () => {
  describe('AI Agent', () => {
    it('shows the instructions', () => {
      expect(nodeSummary(node('Codergen', { prompt: 'Draft three concepts' }))).toBe('Draft three concepts');
    });

    it('collapses whitespace and line breaks', () => {
      expect(nodeSummary(node('Codergen', { prompt: '  Read the brief\n\nand   draft ' }))).toBe('Read the brief and draft');
    });

    it('keeps 60 characters and cuts 61 to 59 plus an ellipsis', () => {
      expect(nodeSummary(node('Codergen', { prompt: chars(60) }))).toBe(chars(60));
      expect(nodeSummary(node('Codergen', { prompt: chars(61) }))).toBe(`${chars(59)}…`);
    });

    it.each<Record<string, AttrValue>>([{}, { prompt: '' }, { prompt: '  \n ' }])('says No instructions yet for %j', (attrs) => {
      expect(nodeSummary(node('Codergen', attrs))).toBe('No instructions yet');
    });
  });

  describe('AI Coordinator', () => {
    it('shows the task, cut at 60', () => {
      expect(nodeSummary(node('Manager', { task: 'coordinate-review' }))).toBe('coordinate-review');
      expect(nodeSummary(node('Manager', { task: chars(60) }))).toBe(chars(60));
      expect(nodeSummary(node('Manager', { task: chars(61) }))).toBe(`${chars(59)}…`);
    });

    it('says No task yet when there is none', () => {
      expect(nodeSummary(node('Manager'))).toBe('No task yet');
    });
  });

  describe('Tool', () => {
    it('shows a command after a $, cut at 50', () => {
      expect(nodeSummary(node('Tool', { tool_command: 'npm test' }))).toBe('$ npm test');
      expect(nodeSummary(node('Tool', { tool_command: chars(50) }))).toBe(`$ ${chars(50)}`);
      expect(nodeSummary(node('Tool', { tool_command: chars(51) }))).toBe(`$ ${chars(49)}…`);
    });

    it('says Add a command when the command is set but empty', () => {
      expect(nodeSummary(node('Tool', { tool_command: '' }))).toBe('Add a command');
      expect(nodeSummary(node('Tool', { tool_command: '   ' }))).toBe('Add a command');
    });

    it('shows a built-in tool by its title', () => {
      expect(nodeSummary(node('Tool', { tool: 'system_lint' }))).toBe('Design-system check');
      expect(nodeSummary(node('Tool', { tool: 'render_capture' }))).toBe('Screenshot a design');
      expect(nodeSummary(node('Tool', { tool: 'task_critic' }))).toBe('Usability critique');
      expect(nodeSummary(node('Tool', { tool: 'synthesis' }))).toBe('Summarise critiques');
    });

    it('says Choose a tool with no tool, or one that is not built in', () => {
      expect(nodeSummary(node('Tool'))).toBe('Choose a tool');
      expect(nodeSummary(node('Tool', { tool: 'not_a_tool' }))).toBe('Choose a tool');
    });
  });

  describe('Ask a person', () => {
    it('leads with the answer mode', () => {
      expect(nodeSummary(node('Interviewer', { question: 'Ship it?', approve: true }))).toBe('Yes or no · Ship it?');
      expect(nodeSummary(node('Interviewer', { question: 'Which?', options: 'a, b' }))).toBe('Pick from a list · Which?');
      expect(nodeSummary(node('Interviewer', { question: 'Pick one', gallery: true }))).toBe('Gallery · Pick one');
      expect(nodeSummary(node('Interviewer', { question: 'Pick one', gallery: 'true' }))).toBe('Gallery · Pick one');
      expect(nodeSummary(node('Interviewer', { question: 'Thoughts?' }))).toBe('Free text · Thoughts?');
    });

    it('cuts the question at 36', () => {
      expect(nodeSummary(node('Interviewer', { question: chars(36) }))).toBe(`Free text · ${chars(36)}`);
      expect(nodeSummary(node('Interviewer', { question: chars(37) }))).toBe(`Free text · ${chars(35)}…`);
    });

    it('shows only the mode, as the board does, when there is no question', () => {
      expect(nodeSummary(node('Interviewer'))).toBe('Free text · ');
    });
  });

  describe('Branch', () => {
    it('counts the paths out', () => {
      expect(nodeSummary(node('Conditional'), 2)).toBe('2 paths out');
      expect(nodeSummary(node('Conditional'), 0)).toBe('0 paths out');
      expect(nodeSummary(node('Conditional'))).toBe('0 paths out');
    });
  });

  describe('Nested workflow', () => {
    it('shows the file, or No file chosen', () => {
      expect(nodeSummary(node('SubPipeline', { pipeline: 'examples/sub_flow.dot' }))).toBe('examples/sub_flow.dot');
      expect(nodeSummary(node('SubPipeline'))).toBe('No file chosen');
      expect(nodeSummary(node('SubPipeline', { pipeline: '  ' }))).toBe('No file chosen');
    });
  });

  it.each(['Parallel', 'FanIn', 'Start', 'Exit', 'Mystery'])('%s has no summary', (nodeType) => {
    expect(nodeSummary(node(nodeType, { prompt: 'ignored' }), 3)).toBe('');
  });
});

describe('toolMode', () => {
  it('is command when tool_command is set, even empty, and builtin otherwise', () => {
    expect(toolMode({ tool_command: 'ls' })).toBe('command');
    expect(toolMode({ tool_command: '' })).toBe('command');
    expect(toolMode({ tool: 'system_lint' })).toBe('builtin');
    expect(toolMode({})).toBe('builtin');
  });
});

describe('answerMode', () => {
  it('follows the handler’s order: approve, then options, then free text', () => {
    expect(answerMode({ approve: true, options: 'a' })).toBe('approve');
    expect(answerMode({ approve: 'true' })).toBe('approve');
    expect(answerMode({ options: 'a, b' })).toBe('options');
    expect(answerMode({ options: '' })).toBe('options');
    expect(answerMode({ approve: false })).toBe('freeform');
    expect(answerMode({})).toBe('freeform');
  });
});
