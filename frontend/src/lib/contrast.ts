// ABOUTME: WCAG 2.x contrast ratio helper for hex and rgb(a) colours
// ABOUTME: Translucent colours are composited over a surface first, so token pairs can be checked as rendered

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(value: string): Rgba {
  const v = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(v);
  if (fn) {
    const [r, g, b, a = '1'] = fn[1].split(',').map((p) => p.trim());
    return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) };
  }
  throw new Error(`Unsupported colour: ${value}`);
}

function over(top: Rgba, base: Rgba): Rgba {
  const mix = (t: number, b: number) => t * top.a + b * (1 - top.a);
  return { r: mix(top.r, base.r), g: mix(top.g, base.g), b: mix(top.b, base.b), a: 1 };
}

function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Contrast ratio of `foreground` on `background`. Translucent colours are composited
 * over `surface` (the background first, then the foreground over that result).
 */
export function contrastRatio(foreground: string, background: string, surface = '#FFFFFF'): number {
  const bg = over(parseColor(background), over(parseColor(surface), { r: 255, g: 255, b: 255, a: 1 }));
  const fg = over(parseColor(foreground), bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
