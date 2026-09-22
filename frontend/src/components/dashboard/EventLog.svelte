<script lang="ts">
  // ABOUTME: Live event stream view - displays pipeline events in real-time
  // ABOUTME: Critical for Phase 3 E2E test - verifies Task 6b's replay works

  import { eventStore } from '../../stores/events.svelte';
  import * as eventsApi from '../../lib/api/events';
  import type { PipelineEvent } from '../../lib/api/events';

  interface Props {
    runId: string;
  }

  const { runId }: Props = $props();

  let isStreaming = $state(true);
  let unsubscribe: (() => void) | null = null;

  $effect(() => {
    if (runId && isStreaming) {
      unsubscribe = eventsApi.subscribeToPipelineEvents(runId, (event) => {
        eventStore.add(event);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });

  function eventDescription(event: PipelineEvent): string {
    switch (event.kind) {
      case 'pipeline_started':
        return `Pipeline started: ${event.graph_name}`;
      case 'pipeline_completed':
        return `Pipeline completed: ${event.outcome?.type || 'unknown'}`;
      case 'pipeline_aborted':
        return `Pipeline aborted: ${event.reason}`;
      case 'node_started':
        return `Node started: ${event.node_id} (${event.node_type})`;
      case 'node_completed':
        return `Node completed: ${event.node_id}`;
      case 'node_failed':
        return `Node failed: ${event.node_id} - ${event.error}`;
      case 'human_prompt_issued':
        return `Question: ${event.question}`;
      case 'human_response_received':
        return `Response: ${event.response}`;
      case 'edge_traversed':
        return `Edge: ${event.from} → ${event.to}`;
      default:
        return `${event.kind}`;
    }
  }
</script>

<div class="event-log">
  <h3>Events</h3>

  {#if eventStore.events.length === 0}
    <p class="empty">Waiting for events...</p>
  {:else}
    <div class="events-list">
      {#each eventStore.events as event (event.kind + event.timestamp)}
        <div class="event-item">
          <div class="event-kind">{event.kind}</div>
          <div class="event-desc">{eventDescription(event)}</div>
          <div class="event-time">{new Date(event.timestamp).toLocaleTimeString()}</div>
        </div>
      {/each}
    </div>
  {/if}

  {#if eventStore.isComplete}
    <p class="complete" role="status">Pipeline complete</p>
  {/if}
</div>

<style>
  .event-log {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    background: #f8fafc;
    max-height: 500px;
    overflow-y: auto;
  }

  h3 {
    margin: 0 0 1rem 0;
    color: #1e293b;
    font-size: 1rem;
  }

  .empty {
    color: #94a3b8;
    text-align: center;
    padding: 2rem 0;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .event-item {
    background: white;
    border-left: 4px solid #3b82f6;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .event-kind {
    font-weight: 600;
    color: #3b82f6;
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  .event-desc {
    color: #1e293b;
    margin: 0.25rem 0;
  }

  .event-time {
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .complete {
    color: #16a34a;
    font-weight: 500;
    text-align: center;
    margin-top: 1rem;
  }
</style>
