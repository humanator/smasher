// ABOUTME: Tests for useNow, the ticking clock the dashboard reads for durations and waits
// ABOUTME: Fake timers drive the interval; an effect root stands in for a component

import { describe, it, expect, vi, afterEach } from 'vitest';
import { flushSync } from 'svelte';
import { useNow } from '../../../src/lib/hooks/useNow.svelte';

describe('useNow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at the current time and moves on every interval', () => {
    vi.useFakeTimers({ now: new Date('2026-10-16T00:00:00Z') });
    let now!: { readonly current: Date };
    const cleanup = $effect.root(() => {
      now = useNow(30_000);
    });
    flushSync();

    expect(now.current.toISOString()).toBe('2026-10-16T00:00:00.000Z');
    vi.advanceTimersByTime(29_999);
    expect(now.current.toISOString()).toBe('2026-10-16T00:00:00.000Z');
    vi.advanceTimersByTime(1);
    expect(now.current.toISOString()).toBe('2026-10-16T00:00:30.000Z');
    cleanup();
  });

  it('stops ticking once its owner is gone', () => {
    vi.useFakeTimers({ now: new Date('2026-10-16T00:00:00Z') });
    let now!: { readonly current: Date };
    const cleanup = $effect.root(() => {
      now = useNow(1000);
    });
    flushSync();
    cleanup();

    vi.advanceTimersByTime(5000);
    expect(now.current.toISOString()).toBe('2026-10-16T00:00:00.000Z');
  });
});
