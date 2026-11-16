// ABOUTME: Tests for formatEvent and formatDuration, the event log's line formatter
// ABOUTME: Pure function tests: one per event kind in plain words, plus key/all level, step names and unknown kinds

import { describe, it, expect } from 'vitest';
import { formatEvent, formatDuration } from '../../src/lib/eventFormat';
import type { PipelineEvent } from '../../src/lib/api/events';

const timestamp = '2026-09-25T10:00:00Z';

function line(event: Record<string, unknown>) {
  return formatEvent({ timestamp, ...event } as unknown as PipelineEvent);
}

const plain = { agent: false, faded: false, tinted: false, level: 'key' };

describe('formatDuration', () => {
  it.each([
    [0, '0ms'],
    [999, '999ms'],
    [1000, '1.0s'],
    [59_999, '60.0s'],
    [61_000, '1m 1s'],
  ])('%i ms reads %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe('formatEvent', () => {
  it('pipeline_started', () => {
    expect(line({ kind: 'pipeline_started', graph_name: 'LoopCheck' })).toMatchObject({
      icon: '⚡', label: 'Run started', detail: 'LoopCheck', tone: 'blue', ...plain,
    });
  });

  it('pipeline_completed', () => {
    expect(
      line({ kind: 'pipeline_completed', outcome: {}, total_nodes: 3, duration_ms: 1500 })
    ).toMatchObject({
      icon: '✓', label: 'Run completed', detail: '3 steps · 1.5s', tone: 'green', ...plain,
    });
  });

  it('pipeline_aborted', () => {
    expect(line({ kind: 'pipeline_aborted', reason: 'cancelled' })).toMatchObject({
      icon: '✕', label: 'Run stopped', detail: 'cancelled', tone: 'red',
      agent: false, faded: false, tinted: true, level: 'key',
    });
  });

  it('node_started', () => {
    expect(line({ kind: 'node_started', node_id: 'gate', node_type: 'Interviewer' })).toMatchObject({
      icon: '▶', label: 'Step started', detail: 'gate · Ask a person', tone: 'amber', ...plain,
    });
  });

  it('node_completed', () => {
    expect(
      line({ kind: 'node_completed', node_id: 'gate', outcome: {}, duration_ms: 12 })
    ).toMatchObject({
      icon: '✓', label: 'Step finished', detail: 'gate · 12ms', tone: 'green', ...plain,
    });
  });

  it('node_failed', () => {
    expect(
      line({
        kind: 'node_failed',
        node_id: 'bad',
        error: 'invalid JSON',
        duration_ms: 3,
      })
    ).toMatchObject({
      icon: '✕', label: 'Step failed', detail: 'bad · 3ms · invalid JSON', tone: 'red', ...plain,
    });
  });

  it('edge_traversed', () => {
    expect(line({ kind: 'edge_traversed', from: 'start', to: 'gate' })).toMatchObject({
      icon: '→', label: 'Moved on', detail: 'start → gate', tone: 'muted',
      agent: false, faded: true, tinted: false, level: 'all',
    });
  });

  it('loop_restarted', () => {
    expect(
      line({ kind: 'loop_restarted', from: 'gate', to: 'start', restart_count: 1 })
    ).toMatchObject({
      icon: '↻', label: 'Went back (loop 1)', detail: 'gate → start', tone: 'amber', ...plain,
    });
  });

  it('context_updated', () => {
    expect(line({ kind: 'context_updated', key: 'gate' })).toMatchObject({
      icon: '⟳', label: 'Context updated', detail: 'gate', tone: 'muted',
      agent: false, faded: true, tinted: false, level: 'all',
    });
  });

  it('checkpoint_created', () => {
    expect(line({ kind: 'checkpoint_created', node_id: 'gate' })).toMatchObject({
      icon: '◆', label: 'Progress saved', detail: 'gate', tone: 'muted',
      agent: false, faded: true, tinted: false, level: 'all',
    });
  });

  it('human_prompt_issued', () => {
    expect(
      line({ kind: 'human_prompt_issued', node_id: 'gate', question: 'Again?' })
    ).toMatchObject({
      icon: '?', label: 'Waiting for you', detail: 'gate · Again?', tone: 'purple',
      agent: false, faded: false, tinted: true, level: 'key',
    });
  });

  it('human_response_received', () => {
    expect(
      line({ kind: 'human_response_received', node_id: 'gate', response: 'done' })
    ).toMatchObject({
      icon: '✎', label: 'Answer received', detail: 'gate · done', tone: 'purple', ...plain,
    });
  });

  it('agent_tool_call_started', () => {
    expect(
      line({
        kind: 'agent_tool_call_started', node_id: 'code', tool_name: 'read_file', tool_call_id: 't1',
      })
    ).toMatchObject({
      icon: '🔧', label: 'Tool call', detail: 'code · read_file', tone: 'purple',
      agent: true, faded: false, tinted: false, level: 'all',
    });
  });

  it('agent_tool_call_completed', () => {
    expect(
      line({
        kind: 'agent_tool_call_completed', node_id: 'code', tool_name: 'read_file',
        tool_call_id: 't1', duration_ms: 40, is_error: false, result_preview: 'fn main',
      })
    ).toMatchObject({
      icon: '✓', label: 'Tool call', detail: 'code · read_file · 40ms · fn main', tone: 'green',
      agent: true, faded: false, tinted: false, level: 'all',
    });
  });

  it('agent_message', () => {
    expect(line({ kind: 'agent_message', node_id: 'code', text: 'Thinking' })).toMatchObject({
      icon: '💬', label: 'Agent', detail: 'code · Thinking', tone: 'blue', italic: true,
      agent: true, faded: false, tinted: false, level: 'all',
    });
  });

  it('agent_turn_started', () => {
    expect(line({ kind: 'agent_turn_started', node_id: 'code', turn_number: 2 })).toMatchObject({
      icon: '↻', label: 'Turn 2', detail: 'code', tone: 'muted',
      agent: true, faded: true, tinted: false, level: 'all',
    });
  });

  it('agent_token_usage', () => {
    expect(
      line({ kind: 'agent_token_usage', node_id: 'code', input_tokens: 10, output_tokens: 5 })
    ).toMatchObject({
      icon: '⊛', label: 'Tokens', detail: 'code · in:10 out:5', tone: 'muted',
      agent: true, faded: true, tinted: false, level: 'all',
    });
  });

  it('shows the edge label only when set', () => {
    expect(line({ kind: 'edge_traversed', from: 'gate', to: 'exit', label: 'done' }).detail).toBe(
      'gate → exit [done]'
    );
  });

  it('turns a failed tool call red', () => {
    const failed = line({
      kind: 'agent_tool_call_completed', node_id: 'code', tool_name: 'shell',
      tool_call_id: 't2', duration_ms: 5, is_error: true,
    });
    expect(failed).toMatchObject({ icon: '✕', tone: 'red', detail: 'code · shell · 5ms' });
  });

  it('shows a cost only when above zero', () => {
    const base = { kind: 'agent_token_usage', node_id: 'code', input_tokens: 10, output_tokens: 5 };
    expect(line({ ...base, cost_usd: 0 }).detail).toBe('code · in:10 out:5');
    expect(line({ ...base, cost_usd: 0.0123 }).detail).toBe('code · in:10 out:5 · $0.0123');
  });

  it('shows the failure message as sent, quotes and all', () => {
    const failed = line({ kind: 'node_failed', node_id: 'bad', error: 'boom "x"', duration_ms: 1 });
    expect(failed.detail).toBe('bad · 1ms · boom "x"');
  });

  it('labels an aborted run as failed unless it was cancelled', () => {
    expect(line({ kind: 'pipeline_aborted', reason: 'max steps (100) exceeded' })).toMatchObject({
      label: 'Run failed', detail: 'max steps (100) exceeded', tone: 'red', tinted: true, level: 'key',
    });
  });

  it('names loop counts in the label', () => {
    expect(line({ kind: 'loop_restarted', from: 'a', to: 'b', restart_count: 3 }).label).toBe(
      'Went back (loop 3)'
    );
  });

  it('keeps run, step, gate and loop events as key moments', () => {
    const keys = [
      { kind: 'pipeline_started', graph_name: 'g' },
      { kind: 'pipeline_completed', outcome: {}, total_nodes: 1, duration_ms: 1 },
      { kind: 'pipeline_aborted', reason: 'x' },
      { kind: 'node_started', node_id: 'a', node_type: 'Tool' },
      { kind: 'node_completed', node_id: 'a', outcome: {}, duration_ms: 1 },
      { kind: 'node_failed', node_id: 'a', error: 'x', duration_ms: 1 },
      { kind: 'loop_restarted', from: 'a', to: 'b', restart_count: 1 },
      { kind: 'human_prompt_issued', node_id: 'a', question: 'q' },
      { kind: 'human_response_received', node_id: 'a', response: 'r' },
    ];
    for (const event of keys) expect(line(event).level, event.kind).toBe('key');
  });

  it('puts tool calls, agent text, tokens and bookkeeping under everything', () => {
    const alls = [
      { kind: 'edge_traversed', from: 'a', to: 'b' },
      { kind: 'context_updated', key: 'k' },
      { kind: 'checkpoint_created', node_id: 'a' },
      { kind: 'agent_turn_started', node_id: 'a', turn_number: 1 },
      { kind: 'agent_message', node_id: 'a', text: 't' },
      { kind: 'agent_tool_call_started', node_id: 'a', tool_name: 't', tool_call_id: '1' },
      { kind: 'agent_tool_call_completed', node_id: 'a', tool_name: 't', tool_call_id: '1', duration_ms: 1, is_error: false },
      { kind: 'agent_token_usage', node_id: 'a', input_tokens: 1, output_tokens: 1 },
    ];
    for (const event of alls) expect(line(event).level, event.kind).toBe('all');
  });

  describe('with step labels', () => {
    const labels = new Map([
      ['draft', 'Draft three concepts'],
      ['lint', 'Check against design system'],
    ]);
    const named = (event: Record<string, unknown>) =>
      formatEvent({ timestamp, ...event } as unknown as PipelineEvent, labels);

    it('names steps instead of showing their ids', () => {
      expect(named({ kind: 'node_started', node_id: 'draft', node_type: 'Codergen' }).detail).toBe(
        'Draft three concepts · AI Agent'
      );
      expect(named({ kind: 'node_completed', node_id: 'draft', outcome: {}, duration_ms: 12 }).detail).toBe(
        'Draft three concepts · 12ms'
      );
      expect(named({ kind: 'edge_traversed', from: 'draft', to: 'lint', label: 'ok' }).detail).toBe(
        'Draft three concepts → Check against design system [ok]'
      );
      expect(named({ kind: 'human_prompt_issued', node_id: 'draft', question: 'Q?' }).detail).toBe(
        'Draft three concepts · Q?'
      );
      expect(named({ kind: 'agent_message', node_id: 'lint', text: 'Hi' }).detail).toBe(
        'Check against design system · Hi'
      );
    });

    it('falls back to the id for a step not in the map', () => {
      expect(named({ kind: 'checkpoint_created', node_id: 'mystery' }).detail).toBe('mystery');
      expect(named({ kind: 'edge_traversed', from: 'draft', to: 'mystery' }).detail).toBe(
        'Draft three concepts → mystery'
      );
    });
  });

  it('falls back to the raw kind, muted, for an unknown kind', () => {
    expect(line({ kind: 'something_new' })).toMatchObject({ label: 'something_new', tone: 'muted' });
  });
});
