// ABOUTME: Time wording for the dashboard: when something happened, how long a run took, how long a run has waited
// ABOUTME: Pure functions that take `now` (and optionally a time zone) so callers and tests control the clock

const DASH = '—';
const LOCALE = 'en-AU';

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface CalendarParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
  monthName: string;
  hour: number;
  minute: number;
}

function partsIn(date: Date, timeZone: string | undefined): CalendarParts {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const num = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  const names = new Intl.DateTimeFormat(LOCALE, { timeZone, weekday: 'short', month: 'short' }).formatToParts(date);
  const name = (type: Intl.DateTimeFormatPartTypes) => names.find((p) => p.type === type)?.value ?? '';
  return {
    year: num('year'),
    month: num('month'),
    day: num('day'),
    weekday: name('weekday'),
    monthName: name('month'),
    hour: num('hour'),
    minute: num('minute'),
  };
}

// Whole days between two calendar dates, ignoring the time of day.
function dayNumber({ year, month, day }: CalendarParts): number {
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function clock({ hour, minute }: CalendarParts): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

/** "Today, 10:42 am", "Yesterday, 4:20 pm", "Fri 9 Oct, 3:48 pm" or "Thu 9 Oct 2025, 3:48 pm". */
export function formatWhen(iso: string | null | undefined, now: Date, timeZone?: string): string {
  const date = parse(iso);
  if (!date) return DASH;
  const when = partsIn(date, timeZone);
  const today = partsIn(now, timeZone);
  const daysAgo = dayNumber(today) - dayNumber(when);
  if (daysAgo === 0) return `Today, ${clock(when)}`;
  if (daysAgo === 1) return `Yesterday, ${clock(when)}`;
  const year = when.year === today.year ? '' : ` ${when.year}`;
  return `${when.weekday} ${when.day} ${when.monthName}${year}, ${clock(when)}`;
}

/** "48 s", "7 min 48 s" or "1 h 12 min"; with no end, measures to `now` and adds "so far". */
export function formatDuration(startIso: string, endIso: string | null, now: Date): string {
  const start = parse(startIso);
  const end = endIso === null ? now : parse(endIso);
  if (!start || !end) return DASH;
  const total = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  let text: string;
  if (hours > 0) text = minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  else if (minutes > 0) text = seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  else text = `${seconds} s`;
  return endIso === null ? `${text} so far` : text;
}

/** "waiting less than a minute", "waiting 1 minute", "waiting 6 minutes" or "waiting 2 hours". */
export function formatWaiting(iso: string | null | undefined, now: Date): string {
  const since = parse(iso);
  if (!since) return DASH;
  const minutes = Math.floor((now.getTime() - since.getTime()) / 60_000);
  if (minutes < 1) return 'waiting less than a minute';
  if (minutes < 60) return `waiting ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  return `waiting ${hours} hour${hours === 1 ? '' : 's'}`;
}
