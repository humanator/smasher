// ABOUTME: EventSource wrapper for SSE pipeline events
// ABOUTME: All 17 PipelineEvent variants with auto-cleanup

import { getApiUrl } from './client-config';

// Base event structure with timestamp
interface BaseEvent {
  timestamp: string;
}

// 1. pipeline_started
interface PipelineStartedEvent extends BaseEvent {
  kind: 'pipeline_started';
  graph_name: string;
}

// 2. pipeline_completed
interface PipelineCompletedEvent extends BaseEvent {
  kind: 'pipeline_completed';
  outcome: unknown;
  total_nodes: number;
  duration_ms: number;
}

// 3. pipeline_aborted
interface PipelineAbortedEvent extends BaseEvent {
  kind: 'pipeline_aborted';
  reason: string;
}

// 4. node_started
interface NodeStartedEvent extends BaseEvent {
  kind: 'node_started';
  node_id: string;
  node_type: string;
}

// 5. node_completed
interface NodeCompletedEvent extends BaseEvent {
  kind: 'node_completed';
  node_id: string;
  outcome: unknown;
  duration_ms: number;
}

// 6. node_failed
interface NodeFailedEvent extends BaseEvent {
  kind: 'node_failed';
  node_id: string;
  error: string;
  duration_ms: number;
}

// 7. edge_traversed
interface EdgeTraversedEvent extends BaseEvent {
  kind: 'edge_traversed';
  from: string;
  to: string;
  label?: string;
}

// 8. loop_restarted
interface LoopRestartedEvent extends BaseEvent {
  kind: 'loop_restarted';
  from: string;
  to: string;
  restart_count: number;
}

// 9. context_updated
interface ContextUpdatedEvent extends BaseEvent {
  kind: 'context_updated';
  key: string;
}

// 10. checkpoint_created
interface CheckpointCreatedEvent extends BaseEvent {
  kind: 'checkpoint_created';
  node_id: string;
}

// 11. human_prompt_issued
interface HumanPromptIssuedEvent extends BaseEvent {
  kind: 'human_prompt_issued';
  node_id: string;
  question: string;
}

// 12. human_response_received
interface HumanResponseReceivedEvent extends BaseEvent {
  kind: 'human_response_received';
  node_id: string;
  response: string;
}

// 13. agent_turn_started
interface AgentTurnStartedEvent extends BaseEvent {
  kind: 'agent_turn_started';
  node_id: string;
  turn_number: number;
}

// 14. agent_message
interface AgentMessageEvent extends BaseEvent {
  kind: 'agent_message';
  node_id: string;
  text: string;
}

// 15. agent_tool_call_started
interface AgentToolCallStartedEvent extends BaseEvent {
  kind: 'agent_tool_call_started';
  node_id: string;
  tool_name: string;
  tool_call_id: string;
  input_preview?: string;
}

// 16. agent_tool_call_completed
interface AgentToolCallCompletedEvent extends BaseEvent {
  kind: 'agent_tool_call_completed';
  node_id: string;
  tool_name: string;
  tool_call_id: string;
  duration_ms: number;
  is_error: boolean;
  result_preview?: string;
}

// 17. agent_token_usage
interface AgentTokenUsageEvent extends BaseEvent {
  kind: 'agent_token_usage';
  node_id: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd?: number;
}

// Union type for all pipeline events
export type PipelineEvent =
  | PipelineStartedEvent
  | PipelineCompletedEvent
  | PipelineAbortedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | NodeFailedEvent
  | EdgeTraversedEvent
  | LoopRestartedEvent
  | ContextUpdatedEvent
  | CheckpointCreatedEvent
  | HumanPromptIssuedEvent
  | HumanResponseReceivedEvent
  | AgentTurnStartedEvent
  | AgentMessageEvent
  | AgentToolCallStartedEvent
  | AgentToolCallCompletedEvent
  | AgentTokenUsageEvent;

export interface PipelineEventStream {
  subscribe(callback: (event: PipelineEvent) => void): () => void;
}

export { setApiBaseUrl } from './client-config';

function parseEvent(eventType: string | null, data: unknown): PipelineEvent | null {
  if (typeof data !== 'object' || data === null) {
    console.warn('Invalid event data:', data);
    return null;
  }

  if (!eventType) {
    console.warn('Event has no type');
    return null;
  }

  const dataObj = data as Record<string, unknown>;

  // Ensure timestamp exists
  if (typeof dataObj.timestamp !== 'string') {
    console.warn('Event missing timestamp:', data);
    return null;
  }

  // Parse based on event type name
  switch (eventType) {
    case 'pipeline_started':
      return {
        kind: 'pipeline_started',
        timestamp: dataObj.timestamp as string,
        graph_name: (dataObj.graph_name as string) || '',
      };
    case 'pipeline_completed':
      return {
        kind: 'pipeline_completed',
        timestamp: dataObj.timestamp as string,
        outcome: dataObj.outcome,
        total_nodes: (dataObj.total_nodes as number) || 0,
        duration_ms: (dataObj.duration_ms as number) || 0,
      };
    case 'pipeline_aborted':
      return {
        kind: 'pipeline_aborted',
        timestamp: dataObj.timestamp as string,
        reason: (dataObj.reason as string) || '',
      };
    case 'node_started':
      return {
        kind: 'node_started',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        node_type: (dataObj.node_type as string) || '',
      };
    case 'node_completed':
      return {
        kind: 'node_completed',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        outcome: dataObj.outcome,
        duration_ms: (dataObj.duration_ms as number) || 0,
      };
    case 'node_failed':
      return {
        kind: 'node_failed',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        error: (dataObj.error as string) || '',
        duration_ms: (dataObj.duration_ms as number) || 0,
      };
    case 'edge_traversed':
      return {
        kind: 'edge_traversed',
        timestamp: dataObj.timestamp as string,
        from: (dataObj.from as string) || '',
        to: (dataObj.to as string) || '',
        label: dataObj.label as string | undefined,
      };
    case 'loop_restarted':
      return {
        kind: 'loop_restarted',
        timestamp: dataObj.timestamp as string,
        from: (dataObj.from as string) || '',
        to: (dataObj.to as string) || '',
        restart_count: (dataObj.restart_count as number) || 0,
      };
    case 'context_updated':
      return {
        kind: 'context_updated',
        timestamp: dataObj.timestamp as string,
        key: (dataObj.key as string) || '',
      };
    case 'checkpoint_created':
      return {
        kind: 'checkpoint_created',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
      };
    case 'human_prompt_issued':
      return {
        kind: 'human_prompt_issued',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        question: (dataObj.question as string) || '',
      };
    case 'human_response_received':
      return {
        kind: 'human_response_received',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        response: (dataObj.response as string) || '',
      };
    case 'agent_turn_started':
      return {
        kind: 'agent_turn_started',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        turn_number: (dataObj.turn_number as number) || 0,
      };
    case 'agent_message':
      return {
        kind: 'agent_message',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        text: (dataObj.text as string) || '',
      };
    case 'agent_tool_call_started':
      return {
        kind: 'agent_tool_call_started',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        tool_name: (dataObj.tool_name as string) || '',
        tool_call_id: (dataObj.tool_call_id as string) || '',
        input_preview: dataObj.input_preview as string | undefined,
      };
    case 'agent_tool_call_completed':
      return {
        kind: 'agent_tool_call_completed',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        tool_name: (dataObj.tool_name as string) || '',
        tool_call_id: (dataObj.tool_call_id as string) || '',
        duration_ms: (dataObj.duration_ms as number) || 0,
        is_error: (dataObj.is_error as boolean) || false,
        result_preview: dataObj.result_preview as string | undefined,
      };
    case 'agent_token_usage':
      return {
        kind: 'agent_token_usage',
        timestamp: dataObj.timestamp as string,
        node_id: (dataObj.node_id as string) || '',
        input_tokens: (dataObj.input_tokens as number) || 0,
        output_tokens: (dataObj.output_tokens as number) || 0,
        cost_usd: dataObj.cost_usd as number | undefined,
      };
    default:
      console.warn('Unknown event type:', eventType);
      return null;
  }
}

export function subscribeToPipelineEvents(
  runId: string,
  callback: (event: PipelineEvent) => void,
): () => void {
  const url = getApiUrl(`/runs/${runId}/events`);
  const eventSource = new EventSource(url);
  let isOpen = true;

  const handleMessage = (event: Event, eventType: string): void => {
    if (!isOpen) return;

    const messageEvent = event as MessageEvent;
    try {
      const data = JSON.parse(messageEvent.data) as unknown;

      const parsed = parseEvent(eventType, data);
      if (parsed) {
        callback(parsed);

        // Auto-cleanup on terminal events
        if (parsed.kind === 'pipeline_completed' || parsed.kind === 'pipeline_aborted') {
          isOpen = false;
          eventSource.close();
        }
      }
    } catch (error) {
      console.error('Error parsing event:', error, messageEvent.data);
    }
  };

  // EventSource event types use the event name as listener
  const eventTypes = [
    'pipeline_started',
    'pipeline_completed',
    'pipeline_aborted',
    'node_started',
    'node_completed',
    'node_failed',
    'edge_traversed',
    'loop_restarted',
    'context_updated',
    'checkpoint_created',
    'human_prompt_issued',
    'human_response_received',
    'agent_turn_started',
    'agent_message',
    'agent_tool_call_started',
    'agent_tool_call_completed',
    'agent_token_usage',
  ];

  for (const eventType of eventTypes) {
    eventSource.addEventListener(eventType, (event: Event) => handleMessage(event, eventType));
  }

  eventSource.onerror = (): void => {
    if (isOpen) {
      console.error('EventSource connection error');
      isOpen = false;
      eventSource.close();
    }
  };

  // Return unsubscribe function
  return (): void => {
    if (isOpen) {
      isOpen = false;
      eventSource.close();
    }
  };
}
