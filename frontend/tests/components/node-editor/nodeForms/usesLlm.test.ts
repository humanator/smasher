// ABOUTME: Tests for usesLlm, the single place that says which node kinds call an LLM
// ABOUTME: Drives where the model picker shows, so a new LLM node kind is added in one spot

import { describe, expect, it } from 'vitest';
import { usesLlm } from '../../../../src/components/node-editor/nodeForms/usesLlm';

describe('usesLlm', () => {
  it('is true for Codergen and Manager nodes', () => {
    expect(usesLlm('Codergen', {})).toBe(true);
    expect(usesLlm('Manager', {})).toBe(true);
  });

  it('is true for the tools that call a model', () => {
    expect(usesLlm('Tool', { tool: 'task_critic' })).toBe(true);
    expect(usesLlm('Tool', { tool: 'synthesis' })).toBe(true);
  });

  it('is false for the tools that run natively', () => {
    expect(usesLlm('Tool', { tool: 'render_capture' })).toBe(false);
    expect(usesLlm('Tool', { tool: 'system_lint' })).toBe(false);
  });

  it('is true for other tools without a tool_command (they fall back to an LLM)', () => {
    expect(usesLlm('Tool', {})).toBe(true);
    expect(usesLlm('Tool', { tool: 'http_fetch' })).toBe(true);
  });

  it('is false for a tool that has a tool_command', () => {
    expect(usesLlm('Tool', { tool: 'shell', tool_command: 'ls -la' })).toBe(false);
  });

  it('is false for node kinds that never call a model', () => {
    for (const kind of ['Start', 'Exit', 'Conditional', 'Interviewer', 'Parallel', 'FanIn', 'SubPipeline']) {
      expect(usesLlm(kind, { model: 'x' }), kind).toBe(false);
    }
  });
});
