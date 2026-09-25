// ABOUTME: Tests for formatEvent and formatDuration, the event log's line formatter
// ABOUTME: Pure function tests: one per event kind, plus durations, failures and unknown kinds

import { describe, it, expect } from 'vitest';
import { formatEvent, formatDuration } from '../../src/lib/eventFormat';
import type { PipelineEvent } from '../../src/lib/api/events';

const timestamp = '2026-09-25T10:00:00Z';

function line(event: Record<string, unknown>) {
  return formatEvent({ timestamp, ...event } as unknown as PipelineEvent);
}

const plain = { agent: false, faded: false, tinted: false };

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
      icon: '⚡', label: 'Pipeline started', detail: 'LoopCheck', tone: 'blue', ...plain,
    });
  });

  it('pipeline_completed', () => {
    expect(
      line({ kind: 'pipeline_completed', outcome: {}, total_nodes: 3, duration_ms: 1500 })
    ).toMatchObject({
      icon: '✓', label: 'Pipeline completed', detail: '3 nodes · 1.5s', tone: 'green', ...plain,
    });
  });

  it('pipeline_aborted', () => {
    expect(line({ kind: 'pipeline_aborted', reason: 'cancelled' })).toMatchObject({
      icon: '✕', label: 'Pipeline aborted', detail: 'cancelled', tone: 'red',
      agent: false, faded: false, tinted: true,
    });
  });

  it('node_started', () => {
    expect(line({ kind: 'node_started', node_id: 'gate', node_type: 'Interviewer' })).toMatchObject({
      icon: '▶', label: 'Node started', detail: 'gate (Interviewer)', tone: 'amber', ...plain,
    });
  });

  it('node_completed', () => {
    expect(
      line({ kind: 'node_completed', node_id: 'gate', outcome: {}, duration_ms: 12 })
    ).toMatchObject({
      icon: '✓', label: 'Node completed', detail: 'gate · 12ms', tone: 'green', ...plain,
    });
  });

  it('node_failed', () => {
    expect(
      line({
        kind: 'node_failed',
        node_id: 'bad',
        error: 'Failure { error: "invalid JSON", retryable: false, notes: None }',
        duration_ms: 3,
      })
    ).toMatchObject({
      icon: '✕', label: 'Node failed', detail: 'bad · 3ms · invalid JSON', tone: 'red', ...plain,
    });
  });

  it('edge_traversed', () => {
    expect(line({ kind: 'edge_traversed', from: 'start', to: 'gate' })).toMatchObject({
      icon: '→', label: 'Edge', detail: 'start → gate', tone: 'muted',
      agent: false, faded: true, tinted: false,
    });
  });

  it('loop_restarted', () => {
    expect(
      line({ kind: 'loop_restarted', from: 'gate', to: 'start', restart_count: 1 })
    ).toMatchObject({
      icon: '↻', label: 'Loop #1', detail: 'gate → start', tone: 'amber', ...plain,
    });
  });

  it('context_updated', () => {
    expect(line({ kind: 'context_updated', key: 'gate' })).toMatchObject({
      icon: '⟳', label: 'Context updated', detail: 'gate', tone: 'muted',
      agent: false, faded: true, tinted: false,
    });
  });

  it('checkpoint_created', () => {
    expect(line({ kind: 'checkpoint_created', node_id: 'gate' })).toMatchObject({
      icon: '◆', label: 'Checkpoint', detail: 'gate', tone: 'muted',
      agent: false, faded: true, tinted: false,
    });
  });

  it('human_prompt_issued', () => {
    expect(
      line({ kind: 'human_prompt_issued', node_id: 'gate', question: 'Again?' })
    ).toMatchObject({
      icon: '?', label: 'Awaiting input', detail: 'gate · Again?', tone: 'purple',
      agent: false, faded: false, tinted: true,
    });
  });

  it('human_response_received', () => {
    expect(
      line({ kind: 'human_response_received', node_id: 'gate', response: 'done' })
    ).toMatchObject({
      icon: '✎', label: 'Input received', detail: 'gate · done', tone: 'purple', ...plain,
    });
  });

  it('agent_tool_call_started', () => {
    expect(
      line({
        kind: 'agent_tool_call_started', node_id: 'code', tool_name: 'read_file', tool_call_id: 't1',
      })
    ).toMatchObject({
      icon: '🔧', label: 'Tool call', detail: 'code · read_file', tone: 'purple',
      agent: true, faded: false, tinted: false,
    });
  });

  it('agent_tool_call_completed', () => {
    expect(
      line({
        kind: 'agent_tool_call_completed', node_id: 'code', tool_name: 'read_file',
        tool_call_id: 't1', duration_ms: 40, is_error: false, result_preview: 'fn main',
      })
    ).toMatchObject({
      icon: '✓', label: 'Tool done', detail: 'code · read_file · 40ms · fn main', tone: 'green',
      agent: true, faded: false, tinted: false,
    });
  });

  it('agent_message', () => {
    expect(line({ kind: 'agent_message', node_id: 'code', text: 'Thinking' })).toMatchObject({
      icon: '💬', label: 'Agent', detail: 'code · Thinking', tone: 'blue', italic: true,
      agent: true, faded: false, tinted: false,
    });
  });

  it('agent_turn_started', () => {
    expect(line({ kind: 'agent_turn_started', node_id: 'code', turn_number: 2 })).toMatchObject({
      icon: '↻', label: 'Turn 2', detail: 'code', tone: 'muted',
      agent: true, faded: true, tinted: false,
    });
  });

  it('agent_token_usage', () => {
    expect(
      line({ kind: 'agent_token_usage', node_id: 'code', input_tokens: 10, output_tokens: 5 })
    ).toMatchObject({
      icon: '⊛', label: 'Tokens', detail: 'code · in:10 out:5', tone: 'muted',
      agent: true, faded: true, tinted: false,
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

  it('unescapes the quoted error out of a Debug failure', () => {
    const failed = line({
      kind: 'node_failed',
      node_id: 'bad',
      error: 'Failure { error: "boom \\"x\\"", retryable: false, notes: None }',
      duration_ms: 1,
    });
    expect(failed.detail).toBe('bad · 1ms · boom "x"');
  });

  it('passes a plain failure string through', () => {
    const failed = line({ kind: 'node_failed', node_id: 'bad', error: 'plain', duration_ms: 1 });
    expect(failed.detail).toBe('bad · 1ms · plain');
  });

  it('falls back to the raw kind, muted, for an unknown kind', () => {
    expect(line({ kind: 'something_new' })).toMatchObject({ label: 'something_new', tone: 'muted' });
  });
});
