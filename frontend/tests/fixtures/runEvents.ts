// ABOUTME: Recorded-shape pipeline event sequences for the run page's pure logic tests
// ABOUTME: Hand-written to match the engine's PipelineEvent payloads (see crates/smasher-attractor events.rs)

import type { PipelineEvent } from '../../src/lib/api/events';

// Timestamps count up from 10:00:00 in whole seconds so sequences stay in order.
function at(second: number): string {
  return new Date(Date.UTC(2026, 10, 2, 10, 0, second)).toISOString();
}

type Fields<K extends PipelineEvent['kind']> = Omit<Extract<PipelineEvent, { kind: K }>, 'kind' | 'timestamp'>;

function event<K extends PipelineEvent['kind']>(kind: K, second: number, fields: Fields<K>): PipelineEvent {
  return { kind, timestamp: at(second), ...fields } as unknown as PipelineEvent;
}

export const STEPS = [{ id: 'start' }, { id: 'draft' }, { id: 'lint' }, { id: 'pick' }, { id: 'exit' }];

const started = (id: string, second: number, node_type = 'Codergen') =>
  event('node_started', second, { node_id: id, node_type });
const completed = (id: string, second: number, duration_ms: number) =>
  event('node_completed', second, { node_id: id, outcome: { status: 'success' }, duration_ms });

/** Every step runs once and the pipeline completes. */
export const SINGLE_PASS: PipelineEvent[] = [
  event('pipeline_started', 0, { graph_name: 'Concepts' }),
  started('start', 0, 'Start'),
  completed('start', 0, 4),
  event('edge_traversed', 0, { from: 'start', to: 'draft' }),
  started('draft', 1),
  event('agent_token_usage', 5, { node_id: 'draft', input_tokens: 100, output_tokens: 40 }),
  completed('draft', 11, 10_000),
  started('lint', 12, 'Tool'),
  completed('lint', 14, 1_500),
  started('pick', 15, 'Interviewer'),
  event('human_prompt_issued', 15, { node_id: 'pick', question: 'Pick a favourite' }),
  event('human_response_received', 40, { node_id: 'pick', response: 'approve' }),
  completed('pick', 40, 25_000),
  started('exit', 41, 'Exit'),
  completed('exit', 41, 2),
  event('pipeline_completed', 41, { outcome: { status: 'success' }, total_nodes: 5, duration_ms: 41_000 }),
];

/** The person sent the pick back once: draft and lint run twice. */
export const LOOPED: PipelineEvent[] = [
  event('pipeline_started', 0, { graph_name: 'Concepts' }),
  started('start', 0, 'Start'),
  completed('start', 0, 4),
  started('draft', 1),
  completed('draft', 11, 10_000),
  started('lint', 12, 'Tool'),
  completed('lint', 14, 2_000),
  started('pick', 15, 'Interviewer'),
  event('human_prompt_issued', 15, { node_id: 'pick', question: 'Pick a favourite' }),
  event('human_response_received', 30, { node_id: 'pick', response: 'iterate' }),
  completed('pick', 30, 15_000),
  event('loop_restarted', 31, { from: 'pick', to: 'draft', restart_count: 1 }),
  started('draft', 32),
  completed('draft', 42, 10_000),
  started('lint', 43, 'Tool'),
  completed('lint', 45, 2_000),
  started('pick', 46, 'Interviewer'),
  event('human_prompt_issued', 46, { node_id: 'pick', question: 'Pick a favourite' }),
  event('human_response_received', 60, { node_id: 'pick', response: 'approve' }),
  completed('pick', 60, 14_000),
  started('exit', 61, 'Exit'),
  completed('exit', 61, 2),
  event('pipeline_completed', 61, { outcome: { status: 'success' }, total_nodes: 5, duration_ms: 61_000 }),
];

/** The lint tool fails and nothing routes the failure. */
export const FAILED: PipelineEvent[] = [
  event('pipeline_started', 0, { graph_name: 'Concepts' }),
  started('start', 0, 'Start'),
  completed('start', 0, 4),
  started('draft', 1),
  completed('draft', 11, 10_000),
  started('lint', 12, 'Tool'),
  event('node_failed', 13, { node_id: 'lint', error: 'tool exited with status 1', duration_ms: 900 }),
  event('pipeline_aborted', 13, { reason: "node 'lint' failed with no available route: tool exited with status 1" }),
];

/** Parked on the gate, waiting for a person. */
export const WAITING: PipelineEvent[] = [
  event('pipeline_started', 0, { graph_name: 'Concepts' }),
  started('start', 0, 'Start'),
  completed('start', 0, 4),
  started('draft', 1),
  completed('draft', 11, 10_000),
  started('lint', 12, 'Tool'),
  completed('lint', 14, 2_000),
  started('pick', 15, 'Interviewer'),
  event('human_prompt_issued', 15, { node_id: 'pick', question: 'Pick a favourite' }),
];

/** Stopped by the person while the draft step was running. */
export const ABORTED: PipelineEvent[] = [
  event('pipeline_started', 0, { graph_name: 'Concepts' }),
  started('start', 0, 'Start'),
  completed('start', 0, 4),
  started('draft', 1),
  event('pipeline_aborted', 6, { reason: 'cancelled' }),
];
