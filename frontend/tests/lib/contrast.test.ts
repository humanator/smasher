// ABOUTME: Tests for the WCAG contrast helper used by the token and step-kind tests
// ABOUTME: Pure function tests with known reference ratios

import { describe, it, expect } from 'vitest';
import { parseColor, contrastRatio } from '../../src/lib/contrast';

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#BE185D')).toEqual({ r: 190, g: 24, b: 93, a: 1 });
  });

  it('parses 3-digit hex', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('parses rgba with a fractional alpha', () => {
    expect(parseColor('rgba(0,0,0,.09)')).toEqual({ r: 0, g: 0, b: 0, a: 0.09 });
  });

  it('parses rgb as opaque', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
  });

  it('throws on an unsupported value', () => {
    expect(() => parseColor('oklch(1 0 0)')).toThrow(/unsupported colour/i);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('is 1 for identical colours', () => {
    expect(contrastRatio('#6E6E73', '#6E6E73')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#BE185D', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#BE185D'), 10);
  });

  it('matches a published reference value (#767676 on white is 4.54)', () => {
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
  });

  it('composites a translucent background over the surface', () => {
    // 50% black over white is rgb(127.5, 127.5, 127.5), which is 3.98:1 against white.
    expect(contrastRatio('#FFFFFF', 'rgba(0,0,0,.5)', '#FFFFFF')).toBeCloseTo(3.98, 2);
  });

  it('composites a translucent foreground over the background', () => {
    const solid = contrastRatio('rgb(127.5,127.5,127.5)', '#FFFFFF');
    expect(contrastRatio('rgba(0,0,0,.5)', '#FFFFFF')).toBeCloseTo(solid, 5);
  });
});
