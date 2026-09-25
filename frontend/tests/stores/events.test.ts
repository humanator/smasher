// ABOUTME: Tests for event store with dedup logic
// ABOUTME: Verifies accumulation, dedup of identical events, sequence keys, and terminal state

import { describe, it, expect, beforeEach } from 'vitest';
import { eventStore } from '../../src/stores/events.svelte';

describe('event store', () => {
  beforeEach(() => {
    eventStore.clear();
  });

  it('starts with empty events', () => {
    expect(eventStore.events).toEqual([]);
    expect(eventStore.isComplete).toBe(false);
  });

  it('accumulates events in order', () => {
    const event1 = { kind: 'pipeline_started' as const, timestamp: '2026-09-22T10:00:00Z', graph_name: 'test' };
    const event2 = { kind: 'node_started' as const, timestamp: '2026-09-22T10:00:01Z', node_id: 'n1', node_type: 'start' };

    eventStore.add(event1);
    eventStore.add(event2);

    expect(eventStore.events).toHaveLength(2);
    expect(eventStore.events[0].kind).toBe('pipeline_started');
    expect(eventStore.events[1].kind).toBe('node_started');
  });

  it('dedups an identical event', () => {
    const event = { kind: 'node_completed' as const, timestamp: '2026-09-22T10:00:05Z', node_id: 'n1', outcome: { type: 'success' }, duration_ms: 1000 };

    eventStore.add(event);
    eventStore.add(event); // Same event twice (at-least-once delivery from SSE replay)

    // Should only have one event due to dedup
    expect(eventStore.events).toHaveLength(1);
  });

  it('allows same kind with different timestamp', () => {
    const event1 = { kind: 'node_completed' as const, timestamp: '2026-09-22T10:00:05Z', node_id: 'n1', outcome: { type: 'success' }, duration_ms: 1000 };
    const event2 = { kind: 'node_completed' as const, timestamp: '2026-09-22T10:00:10Z', node_id: 'n2', outcome: { type: 'success' }, duration_ms: 1000 };

    eventStore.add(event1);
    eventStore.add(event2);

    expect(eventStore.events).toHaveLength(2);
  });

  it('tracks terminal state on pipeline_completed', () => {
    const startEvent = { kind: 'pipeline_started' as const, timestamp: '2026-09-22T10:00:00Z', graph_name: 'test' };
    const endEvent = { kind: 'pipeline_completed' as const, timestamp: '2026-09-22T10:00:10Z', outcome: { type: 'success' }, total_nodes: 5, duration_ms: 10000 };

    eventStore.add(startEvent);
    expect(eventStore.isComplete).toBe(false);

    eventStore.add(endEvent);
    expect(eventStore.isComplete).toBe(true);
  });

  it('tracks terminal state on pipeline_aborted', () => {
    const abortEvent = { kind: 'pipeline_aborted' as const, timestamp: '2026-09-22T10:00:05Z', reason: 'user cancelled' };

    eventStore.add(abortEvent);
    expect(eventStore.isComplete).toBe(true);
  });

  it('clears events and terminal state', () => {
    const event = { kind: 'pipeline_completed' as const, timestamp: '2026-09-22T10:00:10Z', outcome: { type: 'success' }, total_nodes: 5, duration_ms: 10000 };
    eventStore.add(event);

    expect(eventStore.events).toHaveLength(1);
    expect(eventStore.isComplete).toBe(true);

    eventStore.clear();

    expect(eventStore.events).toHaveLength(0);
    expect(eventStore.isComplete).toBe(false);
  });

  it('keeps two events with the same kind and timestamp but different payloads', () => {
    const at = '2026-09-22T10:00:05Z';
    eventStore.add({ kind: 'checkpoint_created', timestamp: at, node_id: 'a' });
    eventStore.add({ kind: 'checkpoint_created', timestamp: at, node_id: 'b' });

    expect(eventStore.events.map((e) => (e as { node_id: string }).node_id)).toEqual(['a', 'b']);
  });

  it('gives each entry an increasing sequence number in arrival order', () => {
    eventStore.add({ kind: 'checkpoint_created', timestamp: '2026-09-22T10:00:01Z', node_id: 'a' });
    eventStore.add({ kind: 'checkpoint_created', timestamp: '2026-09-22T10:00:02Z', node_id: 'b' });

    const [first, second] = eventStore.entries;
    expect(second.seq).toBeGreaterThan(first.seq);
    expect(eventStore.entries.map((e) => e.event)).toEqual(eventStore.events);
  });

  it('dedups again after clear() for events seen before it', () => {
    const event = { kind: 'checkpoint_created' as const, timestamp: '2026-09-22T10:00:01Z', node_id: 'a' };
    eventStore.add(event);
    eventStore.clear();

    eventStore.add(event);

    expect(eventStore.entries).toHaveLength(1);
    expect(eventStore.entries[0].seq).toBe(0);
  });
});

