// ABOUTME: Tests for the dashboard's time wording: when something happened, how long it took, how long it has waited
// ABOUTME: Pure function tests with `now` and the time zone pinned, so they never depend on the machine's clock

import { describe, it, expect } from 'vitest';
import { formatDuration, formatWaiting, formatWhen, formatWhenInline } from '../../src/lib/timeFormat';

// 1:00 pm on Friday 16 October 2026 in Sydney (AEDT, UTC+11).
const NOW = new Date('2026-10-16T02:00:00Z');
const SYDNEY = 'Australia/Sydney';

describe('formatWhen', () => {
  it('says Today for a time earlier the same day', () => {
    expect(formatWhen('2026-10-15T23:42:00Z', NOW, SYDNEY)).toBe('Today, 10:42 am');
  });

  it('says Yesterday for a time the day before', () => {
    expect(formatWhen('2026-10-15T05:20:00Z', NOW, SYDNEY)).toBe('Yesterday, 4:20 pm');
  });

  it('gives the weekday, day and month for an earlier date this year', () => {
    expect(formatWhen('2026-10-09T04:48:00Z', NOW, SYDNEY)).toBe('Fri 9 Oct, 3:48 pm');
  });

  it('adds the year for a date in another year', () => {
    expect(formatWhen('2025-10-09T04:48:00Z', NOW, SYDNEY)).toBe('Thu 9 Oct 2025, 3:48 pm');
  });

  it('writes midnight and noon as 12 am and 12 pm', () => {
    expect(formatWhen('2026-10-15T13:05:00Z', NOW, SYDNEY)).toBe('Today, 12:05 am');
    expect(formatWhen('2026-10-15T01:00:00Z', NOW, SYDNEY)).toBe('Yesterday, 12:00 pm');
  });

  it('checks the day boundary in the given time zone, not UTC', () => {
    // 2 pm on the 15th in UTC is 1 am on the 16th in Sydney.
    const iso = '2026-10-15T14:00:00Z';
    expect(formatWhen(iso, NOW, SYDNEY)).toBe('Today, 1:00 am');
    expect(formatWhen(iso, NOW, 'UTC')).toBe('Yesterday, 2:00 pm');
  });

  it('works out Yesterday across a month boundary', () => {
    const now = new Date('2026-11-01T02:00:00Z'); // Sun 1 Nov, 1 pm in Sydney
    expect(formatWhen('2026-10-31T02:00:00Z', now, SYDNEY)).toBe('Yesterday, 1:00 pm');
  });

  it.each([null, undefined, '', 'not a date'])('returns a dash for %j', (iso) => {
    expect(formatWhen(iso, NOW, SYDNEY)).toBe('—');
  });
});

describe('formatDuration', () => {
  const start = '2026-10-16T01:00:00Z';

  it('gives seconds under a minute', () => {
    expect(formatDuration(start, '2026-10-16T01:00:48Z', NOW)).toBe('48 s');
  });

  it('gives minutes and seconds under an hour', () => {
    expect(formatDuration(start, '2026-10-16T01:07:48Z', NOW)).toBe('7 min 48 s');
  });

  it('drops zero seconds from whole minutes', () => {
    expect(formatDuration(start, '2026-10-16T01:07:00Z', NOW)).toBe('7 min');
  });

  it('gives hours and minutes from an hour up', () => {
    expect(formatDuration(start, '2026-10-16T02:12:30Z', NOW)).toBe('1 h 12 min');
  });

  it('drops zero minutes from whole hours', () => {
    expect(formatDuration(start, '2026-10-16T03:00:10Z', NOW)).toBe('2 h');
  });

  it('measures to now and says so far when there is no end', () => {
    expect(formatDuration('2026-10-16T01:52:12Z', null, NOW)).toBe('7 min 48 s so far');
  });

  it('never goes negative', () => {
    expect(formatDuration(start, '2026-10-16T00:59:00Z', NOW)).toBe('0 s');
  });

  it('returns a dash for an invalid start or end', () => {
    expect(formatDuration('nope', null, NOW)).toBe('—');
    expect(formatDuration(start, 'nope', NOW)).toBe('—');
  });
});

describe('formatWaiting', () => {
  it('says less than a minute under 60 seconds', () => {
    expect(formatWaiting('2026-10-16T01:59:15Z', NOW)).toBe('waiting less than a minute');
  });

  it('uses the singular for one minute', () => {
    expect(formatWaiting('2026-10-16T01:58:30Z', NOW)).toBe('waiting 1 minute');
  });

  it('uses the plural for several minutes', () => {
    expect(formatWaiting('2026-10-16T01:54:00Z', NOW)).toBe('waiting 6 minutes');
  });

  it('switches to hours from an hour up', () => {
    expect(formatWaiting('2026-10-16T00:59:00Z', NOW)).toBe('waiting 1 hour');
    expect(formatWaiting('2026-10-15T23:30:00Z', NOW)).toBe('waiting 2 hours');
  });

  it('treats a time in the future as less than a minute', () => {
    expect(formatWaiting('2026-10-16T02:00:05Z', NOW)).toBe('waiting less than a minute');
  });

  it.each([null, '', 'garbage'])('returns a dash for %j', (iso) => {
    expect(formatWaiting(iso, NOW)).toBe('—');
  });
});

describe('formatWhenInline', () => {
  it('lower-cases today for use mid-sentence', () => {
    expect(formatWhenInline('2026-10-15T23:42:00Z', NOW, SYDNEY)).toBe('today, 10:42 am');
  });

  it('lower-cases yesterday for use mid-sentence', () => {
    expect(formatWhenInline('2026-10-15T05:20:00Z', NOW, SYDNEY)).toBe('yesterday, 4:20 pm');
  });

  it('keeps day and month names capitalised this year', () => {
    expect(formatWhenInline('2026-10-09T04:48:00Z', NOW, SYDNEY)).toBe('Fri 9 Oct, 3:48 pm');
  });

  it('keeps day and month names capitalised in an earlier year', () => {
    expect(formatWhenInline('2025-10-09T04:48:00Z', NOW, SYDNEY)).toBe('Thu 9 Oct 2025, 3:48 pm');
  });
});
