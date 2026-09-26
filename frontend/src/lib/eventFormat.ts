// ABOUTME: Turns each of the 17 pipeline event kinds into one event-log line
// ABOUTME: Pure formatting only: icon, label, detail and a tone name, no styling classes

import type { PipelineEvent } from './api/events';

export type EventTone = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'muted';

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
}

// Nms under 1s, N.Ns under 60s, then Nm Ns, as the old dashboard showed them.
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function join(...parts: (string | undefined)[]): string {
  return parts.filter((p) => p !== undefined && p !== '').join(' · ');
}

export function formatEvent(event: PipelineEvent): EventLine {
  const base = { agent: false, faded: false, tinted: false, italic: false };
  const agent = { ...base, agent: true };

  switch (event.kind) {
    case 'pipeline_started':
      return { ...base, icon: '⚡', label: 'Pipeline started', detail: event.graph_name, tone: 'blue' };
    case 'pipeline_completed':
      return {
        ...base,
        icon: '✓',
        label: 'Pipeline completed',
        detail: join(`${event.total_nodes} nodes`, formatDuration(event.duration_ms)),
        tone: 'green',
      };
    case 'pipeline_aborted':
      return {
        ...base,
        icon: '✕',
        label: 'Pipeline aborted',
        detail: event.reason,
        tone: 'red',
        tinted: true,
      };
    case 'node_started':
      return {
        ...base,
        icon: '▶',
        label: 'Node started',
        detail: `${event.node_id} (${event.node_type})`,
        tone: 'amber',
      };
    case 'node_completed':
      return {
        ...base,
        icon: '✓',
        label: 'Node completed',
        detail: join(event.node_id, formatDuration(event.duration_ms)),
        tone: 'green',
      };
    case 'node_failed':
      return {
        ...base,
        icon: '✕',
        label: 'Node failed',
        detail: join(event.node_id, formatDuration(event.duration_ms), event.error),
        tone: 'red',
      };
    case 'edge_traversed':
      return {
        ...base,
        icon: '→',
        label: 'Edge',
        detail: `${event.from} → ${event.to}${event.label ? ` [${event.label}]` : ''}`,
        tone: 'muted',
        faded: true,
      };
    case 'loop_restarted':
      return {
        ...base,
        icon: '↻',
        label: `Loop #${event.restart_count}`,
        detail: `${event.from} → ${event.to}`,
        tone: 'amber',
      };
    case 'context_updated':
      return { ...base, icon: '⟳', label: 'Context updated', detail: event.key, tone: 'muted', faded: true };
    case 'checkpoint_created':
      return { ...base, icon: '◆', label: 'Checkpoint', detail: event.node_id, tone: 'muted', faded: true };
    case 'human_prompt_issued':
      return {
        ...base,
        icon: '?',
        label: 'Awaiting input',
        detail: join(event.node_id, event.question),
        tone: 'purple',
        tinted: true,
      };
    case 'human_response_received':
      return {
        ...base,
        icon: '✎',
        label: 'Input received',
        detail: join(event.node_id, event.response),
        tone: 'purple',
      };
    case 'agent_tool_call_started':
      return {
        ...agent,
        icon: '🔧',
        label: 'Tool call',
        detail: join(event.node_id, event.tool_name),
        tone: 'purple',
      };
    case 'agent_tool_call_completed':
      return {
        ...agent,
        icon: event.is_error ? '✕' : '✓',
        label: 'Tool done',
        detail: join(
          event.node_id,
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
        detail: join(event.node_id, event.text),
        tone: 'blue',
        italic: true,
      };
    case 'agent_turn_started':
      return {
        ...agent,
        icon: '↻',
        label: `Turn ${event.turn_number}`,
        detail: event.node_id,
        tone: 'muted',
        faded: true,
      };
    case 'agent_token_usage':
      return {
        ...agent,
        icon: '⊛',
        label: 'Tokens',
        detail: join(
          event.node_id,
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
