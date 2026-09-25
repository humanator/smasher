// ABOUTME: Tests for the candidate lightbox sizing helpers, viewportOf and fitScale
// ABOUTME: Pure function tests: viewport fallbacks and fit-to-box scaling that never scales up

import { describe, it, expect } from 'vitest';
import { DEFAULT_VIEWPORT, fitScale, viewportOf } from '../../src/lib/previewScale';

describe('viewportOf', () => {
  it('returns a valid manifest viewport as given', () => {
    expect(viewportOf({ viewport: { width: 390, height: 844 } })).toEqual({ width: 390, height: 844 });
  });

  it('defaults to 1280×800', () => {
    expect(DEFAULT_VIEWPORT).toEqual({ width: 1280, height: 800 });
  });

  it('falls back to the default for a missing manifest', () => {
    expect(viewportOf(undefined)).toEqual(DEFAULT_VIEWPORT);
  });

  it('falls back to the default for a manifest without a viewport', () => {
    expect(viewportOf({ captured_at: '2026-09-25T00:00:00Z' })).toEqual(DEFAULT_VIEWPORT);
  });

  it('falls back to the default for a partial viewport', () => {
    expect(viewportOf({ viewport: { width: 390 } })).toEqual(DEFAULT_VIEWPORT);
    expect(viewportOf({ viewport: { height: 844 } })).toEqual(DEFAULT_VIEWPORT);
  });

  it('falls back to the default for a zero or negative side', () => {
    expect(viewportOf({ viewport: { width: 0, height: 800 } })).toEqual(DEFAULT_VIEWPORT);
    expect(viewportOf({ viewport: { width: 1280, height: -1 } })).toEqual(DEFAULT_VIEWPORT);
  });

  it('falls back to the default for non-numeric sides', () => {
    expect(viewportOf({ viewport: { width: '1280', height: '800' } })).toEqual(DEFAULT_VIEWPORT);
    expect(viewportOf({ viewport: 'desktop' })).toEqual(DEFAULT_VIEWPORT);
    expect(viewportOf({ viewport: null })).toEqual(DEFAULT_VIEWPORT);
  });
});

describe('fitScale', () => {
  const viewport = { width: 1280, height: 800 };

  it('returns 1 when the box is larger in both directions', () => {
    expect(fitScale(viewport, { width: 2000, height: 1200 })).toBe(1);
  });

  it('returns 1 when the box is exactly the viewport size', () => {
    expect(fitScale(viewport, { width: 1280, height: 800 })).toBe(1);
  });

  it('uses the width when the width is tighter', () => {
    expect(fitScale(viewport, { width: 640, height: 800 })).toBe(0.5);
  });

  it('uses the height when the height is tighter', () => {
    expect(fitScale(viewport, { width: 1280, height: 200 })).toBe(0.25);
  });

  it('scales down when only one side is smaller', () => {
    expect(fitScale(viewport, { width: 3000, height: 400 })).toBe(0.5);
  });
});
