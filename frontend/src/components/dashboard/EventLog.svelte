<script lang="ts">
  // ABOUTME: Live event stream view - displays pipeline events in real-time
  // ABOUTME: Critical for Phase 3 E2E test - verifies Task 6b's replay works

  import { eventStore } from '../../stores/events.svelte';
  import * as eventsApi from '../../lib/api/events';
  import type { PipelineEvent } from '../../lib/api/events';
  import { showNotification } from '../../lib/native';

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

  // Task 20: OS-native completion notification via the lib/native shim
  // (Notification API in-browser today, a real Tauri notification once
  // smasher-desktop provides window.__TAURI__ -- no call-site change
  // needed then). Driven off eventStore.isComplete rather than the SSE
  // callback above so it fires exactly once regardless of how the
  // terminal event arrived (live tail or Task 6b's replay), and so it's
  // testable the same way the rest of this file's tests already are --
  // by pushing directly into eventStore, not a real SSE connection.
  let notified = $state(false);
  $effect(() => {
    if (eventStore.isComplete && !notified) {
      notified = true;
      const events = eventStore.events;
      const terminal = [...events].reverse().find(
        (e) => e.kind === 'pipeline_completed' || e.kind === 'pipeline_aborted'
      );
      if (terminal?.kind === 'pipeline_aborted') {
        void showNotification('Pipeline aborted', { body: terminal.reason });
      } else {
        void showNotification('Pipeline complete', {
          body: terminal?.kind === 'pipeline_completed' ? eventDescription(terminal) : undefined,
        });
      }
    }
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

<div class="event-log max-h-[500px] overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
  <h3 class="mb-4 text-base font-semibold text-foreground">Events</h3>

  {#if eventStore.events.length === 0}
    <p class="py-8 text-center text-muted-foreground">Waiting for events...</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each eventStore.events as event (event.kind + event.timestamp)}
        <div class="event-item rounded border-l-4 border-primary bg-card p-3 text-sm">
          <div class="text-xs font-semibold uppercase text-primary">{event.kind}</div>
          <div class="my-1 text-foreground">{eventDescription(event)}</div>
          <div class="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</div>
        </div>
      {/each}
    </div>
  {/if}

  {#if eventStore.isComplete}
    <p class="mt-4 text-center font-medium text-green-600" role="status">Pipeline complete</p>
  {/if}
</div>
