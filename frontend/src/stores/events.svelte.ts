// ABOUTME: Svelte 5 rune-based store for pipeline event log
// ABOUTME: Accumulates SSE events, dedups by (kind, timestamp) to handle at-least-once delivery

import type { PipelineEvent } from '../lib/api/events';

function createEventStore() {
  let events = $state<PipelineEvent[]>([]);
  let isTerminal = $state(false);
  // Track seen (kind, timestamp) pairs to dedupe at-least-once delivery
  // from Task 6b's event replay + live tail boundary
  const seen = new Set<string>();

  return {
    get events() {
      return events;
    },

    get isComplete() {
      return isTerminal;
    },

    add(event: PipelineEvent) {
      // Dedupe by (kind, timestamp) -- at-least-once delivery from SSE replay
      // may send the same event twice at the subscribe→read boundary
      const key = `${event.kind}:${event.timestamp}`;
      if (seen.has(key)) {
        return;
      }
      seen.has(key) || seen.add(key);
      events = [...events, event];

      // Track terminal state
      if (event.kind === 'pipeline_completed' || event.kind === 'pipeline_aborted') {
        isTerminal = true;
      }
    },

    clear() {
      events = [];
      isTerminal = false;
      seen.clear();
    },

    reset() {
      this.clear();
    },
  };
}

export const eventStore = createEventStore();
