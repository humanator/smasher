// ABOUTME: Svelte 5 rune-based store for pipeline event log
// ABOUTME: Accumulates SSE events with sequence keys, deduping identical events from replay

import type { PipelineEvent } from '../lib/api/events';

export interface EventEntry {
  seq: number;
  event: PipelineEvent;
}

function createEventStore() {
  let entries = $state<EventEntry[]>([]);
  let isTerminal = $state(false);
  let nextSeq = 0;
  // Full JSON of every event seen, to dedupe at-least-once delivery from
  // Task 6b's event replay + live tail boundary. Distinct events that share a
  // kind and timestamp both stay.
  const seen = new Set<string>();

  return {
    // Arrival order, for keyed rendering.
    get entries() {
      return entries;
    },

    get events() {
      return entries.map((entry) => entry.event);
    },

    get isComplete() {
      return isTerminal;
    },

    add(event: PipelineEvent) {
      const key = JSON.stringify(event);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      entries = [...entries, { seq: nextSeq++, event }];

      // Track terminal state
      if (event.kind === 'pipeline_completed' || event.kind === 'pipeline_aborted') {
        isTerminal = true;
      }
    },

    clear() {
      entries = [];
      isTerminal = false;
      nextSeq = 0;
      seen.clear();
    },

    reset() {
      this.clear();
    },
  };
}

export const eventStore = createEventStore();
