// ABOUTME: Tests for graphErrorMessage, which turns a graph-render error into the text shown
// ABOUTME: Pure function tests: Graphviz install hint, pass-through, and the empty fallback

import { describe, it, expect } from 'vitest';
import { graphErrorMessage } from '../../src/lib/graphError';

describe('graphErrorMessage', () => {
  it('gives the install hint when Graphviz is missing', () => {
    const message =
      'internal error: graph render failed: graphviz not available: No such file or directory';

    expect(graphErrorMessage(message)).toBe(
      "Graphviz's `dot` command isn't installed, or isn't on PATH. Install it (e.g. " +
        '`brew install graphviz` on macOS, `apt install graphviz` on Debian/Ubuntu) and reload ' +
        'this page.'
    );
  });

  it('returns any other message as-is', () => {
    expect(graphErrorMessage('run not found: no-such-run')).toBe('run not found: no-such-run');
  });

  it('falls back when the message is empty', () => {
    expect(graphErrorMessage('')).toBe('Failed to render the pipeline graph');
  });
});
