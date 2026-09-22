// ABOUTME: Tests for EventLog component
// ABOUTME: Verifies real-time event display and Task 6b replay

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import EventLog from '../../../src/components/dashboard/EventLog.svelte';
import { eventStore } from '../../../src/stores/events.svelte';

describe('EventLog', () => {
  beforeEach(() => {
    eventStore.clear();
  });

  it('renders empty state initially', () => {
    render(EventLog, { props: { runId: 'run-123' } });
    expect(screen.getByText('Waiting for events...')).toBeTruthy();
  });

  it('displays accumulated events', async () => {
    const { container } = render(EventLog, { props: { runId: 'run-123' } });

    // Simulate events arriving
    eventStore.add({
      kind: 'pipeline_started',
      timestamp: '2026-09-22T10:00:00Z',
      graph_name: 'test',
    });

    eventStore.add({
      kind: 'node_started',
      timestamp: '2026-09-22T10:00:01Z',
      node_id: 'node1',
      node_type: 'task',
    });

    // Wait for updates
    await new Promise((resolve) => setTimeout(resolve, 50));

    const items = container.querySelectorAll('.event-item');
    expect(items.length).toBe(2);
  });

  it('shows completion status when pipeline completes', async () => {
    render(EventLog, { props: { runId: 'run-123' } });

    eventStore.add({
      kind: 'pipeline_completed',
      timestamp: '2026-09-22T10:00:10Z',
      outcome: { type: 'success' },
      total_nodes: 5,
      duration_ms: 10000,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Pipeline complete')).toBeTruthy();
  });

  it('formats event descriptions correctly', async () => {
    render(EventLog, { props: { runId: 'run-123' } });

    eventStore.add({
      kind: 'human_prompt_issued',
      timestamp: '2026-09-22T10:00:05Z',
      node_id: 'gate1',
      question: 'Is this acceptable?',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Question: Is this acceptable?')).toBeTruthy();
  });
});
