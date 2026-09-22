// ABOUTME: Tests for the SVG sanitizer used before {@html}-injecting graph SVGs
// ABOUTME: Confirms script tags, event-handler attributes, and javascript: hrefs are stripped

import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from '../../src/lib/sanitizeSvg';

describe('sanitizeSvg', () => {
  it('strips script tags', () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('alert(1)');
  });

  it('strips on* event handler attributes', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect onclick="alert(2)" width="10" height="10" /></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('alert(2)');
  });

  it('strips javascript: hrefs', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(3)"><text>link</text></a></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('preserves legitimate graph structure', () => {
    const graph =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
      '<g class="node"><polygon points="0,0 50,50 0,100" fill="#fff" stroke="#000"/>' +
      '<text x="10" y="10">start</text></g></svg>';
    const clean = sanitizeSvg(graph);
    expect(clean).toContain('polygon');
    expect(clean).toContain('start');
    expect(clean).toContain('class="node"');
  });

  it('returns empty string for unparseable input', () => {
    expect(sanitizeSvg('not svg at all')).toBe('');
  });
});
