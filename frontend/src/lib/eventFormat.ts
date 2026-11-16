// ABOUTME: Turns each of the 17 pipeline event kinds into one plain-worded event-log line
// ABOUTME: Pure formatting only: icon, label, detail, tone and key/all level, no styling classes

import type { PipelineEvent } from './api/events';
import { stepKind } from './stepKinds';

export type EventTone = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'muted';

export type EventLevel = 'key' | 'all';

export interface EventLine {
  icon: string;
  label: string;
  detail: string;
  tone: EventTone;
  /** Agent events are indented under their node. */
  agent: boolean;
  /** Bookkeeping events are shown faded. */
  faded: boolean;
  /** Lines that need attention get a tinted background. */
  tinted: boolean;
  italic: boolean;
  /** 'key' lines show under Key moments; 'all' lines only under Everything. */
  level: EventLevel;
}

// Nms under 1s, N.Ns under 60s, then Nm Ns, as the old dashboard showed them.
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

/** Step names by node id, e.g. from the run's steps; an id missing from it shows as itself. */
export type StepLabels = ReadonlyMap<string, string>;

function join(...parts: (string | undefined)[]): string {
  return parts.filter((p) => p !== undefined && p !== '').join(' · ');
}

export function formatEvent(event: PipelineEvent, labels?: StepLabels): EventLine {
  const name = (id: string) => labels?.get(id) ?? id;
  const base = { agent: false, faded: false, tinted: false, italic: false, level: 'key' as EventLevel };
  const agent = { ...base, agent: true, level: 'all' as EventLevel };
  const quiet = { ...base, faded: true, level: 'all' as EventLevel };

  switch (event.kind) {
    case 'pipeline_started':
      return { ...base, icon: '⚡', label: 'Run started', detail: event.graph_name, tone: 'blue' };
    case 'pipeline_completed':
      return {
        ...base,
        icon: '✓',
        label: 'Run completed',
        detail: join(`${event.total_nodes} steps`, formatDuration(event.duration_ms)),
        tone: 'green',
      };
    case 'pipeline_aborted':
      return {
        ...base,
        icon: '✕',
        // The engine reports a stop by the person as "cancelled"; anything else is a failure.
        label: event.reason === 'cancelled' ? 'Run stopped' : 'Run failed',
        detail: event.reason,
        tone: 'red',
        tinted: true,
      };
    case 'node_started':
      return {
        ...base,
        icon: '▶',
        label: 'Step started',
        detail: join(name(event.node_id), stepKind(event.node_type).plain),
        tone: 'amber',
      };
    case 'node_completed':
      return {
        ...base,
        icon: '✓',
        label: 'Step finished',
        detail: join(name(event.node_id), formatDuration(event.duration_ms)),
        tone: 'green',
      };
    case 'node_failed':
      return {
        ...base,
        icon: '✕',
        label: 'Step failed',
        detail: join(name(event.node_id), formatDuration(event.duration_ms), event.error),
        tone: 'red',
      };
    case 'edge_traversed':
      return {
        ...quiet,
        icon: '→',
        label: 'Moved on',
        detail: `${name(event.from)} → ${name(event.to)}${event.label ? ` [${event.label}]` : ''}`,
        tone: 'muted',
      };
    case 'loop_restarted':
      return {
        ...base,
        icon: '↻',
        label: `Went back (loop ${event.restart_count})`,
        detail: `${name(event.from)} → ${name(event.to)}`,
        tone: 'amber',
      };
    case 'context_updated':
      return { ...quiet, icon: '⟳', label: 'Context updated', detail: event.key, tone: 'muted' };
    case 'checkpoint_created':
      return { ...quiet, icon: '◆', label: 'Progress saved', detail: name(event.node_id), tone: 'muted' };
    case 'human_prompt_issued':
      return {
        ...base,
        icon: '?',
        label: 'Waiting for you',
        detail: join(name(event.node_id), event.question),
        tone: 'purple',
        tinted: true,
      };
    case 'human_response_received':
      return {
        ...base,
        icon: '✎',
        label: 'Answer received',
        detail: join(name(event.node_id), event.response),
        tone: 'purple',
      };
    case 'agent_tool_call_started':
      return {
        ...agent,
        icon: '🔧',
        label: 'Tool call',
        detail: join(name(event.node_id), event.tool_name),
        tone: 'purple',
      };
    case 'agent_tool_call_completed':
      return {
        ...agent,
        icon: event.is_error ? '✕' : '✓',
        label: 'Tool call',
        detail: join(
          name(event.node_id),
          event.tool_name,
          formatDuration(event.duration_ms),
          event.result_preview
        ),
        tone: event.is_error ? 'red' : 'green',
      };
    case 'agent_message':
      return {
        ...agent,
        icon: '💬',
        label: 'Agent',
        detail: join(name(event.node_id), event.text),
        tone: 'blue',
        italic: true,
      };
    case 'agent_turn_started':
      return {
        ...agent,
        icon: '↻',
        label: `Turn ${event.turn_number}`,
        detail: name(event.node_id),
        tone: 'muted',
        faded: true,
      };
    case 'agent_token_usage':
      return {
        ...agent,
        icon: '⊛',
        label: 'Tokens',
        detail: join(
          name(event.node_id),
          `in:${event.input_tokens} out:${event.output_tokens}`,
          event.cost_usd ? `$${event.cost_usd.toFixed(4)}` : undefined
        ),
        tone: 'muted',
        faded: true,
      };
    default: {
      // Every known kind is handled above; this also catches kinds the server
      // adds later, which show their raw kind.
      const unknown: never = event;
      return { ...base, icon: '•', label: (unknown as { kind: string }).kind, detail: '', tone: 'muted' };
    }
  }
}
