// ABOUTME: Converts between a step attr and the text in its inspector field
// ABOUTME: Whole numbers go back as numbers, because the engine reads counts as Number attrs only

import type { AttrValue } from '../types';

/** The text a field shows for an attr: strings and numbers as-is, anything else blank. */
export function attrText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/**
 * The attr a text field writes: blank removes it, a whole number is written as a number, and
 * anything else as trimmed text. A count like "3" written as text would round-trip through the
 * .dot file as a quoted string, which retry.rs and parallel.rs ignore; "1s" stays text, and the
 * DOT parser reads it as a duration.
 */
export function numberOrText(text: string): AttrValue | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}
