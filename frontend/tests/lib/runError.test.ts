// ABOUTME: Tests for summariseRunError, the one-line failure reason in a workflow's run history
// ABOUTME: Uses the engine's exact #[error] formats from engine.rs, handler.rs and retry.rs

import { describe, it, expect } from 'vitest';
import { summariseRunError } from '../../src/lib/runError';

const labels = new Map([
  ['lint', 'Check against design system'],
  ['draft', 'Draft three concepts'],
]);

describe('summariseRunError', () => {
  it('returns null for null, empty or blank input', () => {
    expect(summariseRunError(null, labels)).toBeNull();
    expect(summariseRunError('', labels)).toBeNull();
    expect(summariseRunError('   ', labels)).toBeNull();
  });

  it("strips the handler failure wrapper and names the step by its label", () => {
    expect(summariseRunError("handler 'tool' failed on node 'lint': command exited with status 1", labels)).toBe(
      'Check against design system: Command exited with status 1.'
    );
  });

  it('strips "handler error: " around a handler failure', () => {
    expect(
      summariseRunError("handler error: handler 'tool' failed on node 'lint': command exited with status 1", labels)
    ).toBe('Check against design system: Command exited with status 1.');
  });

  it('strips the retry-exhausted wrapper', () => {
    expect(summariseRunError("retry exhausted for node 'draft': rate limited", labels)).toBe(
      'Draft three concepts: Rate limited.'
    );
  });

  it('strips the no-available-route wrapper', () => {
    expect(summariseRunError("node 'lint' failed with no available route: lint found 3 problems", labels)).toBe(
      'Check against design system: Lint found 3 problems.'
    );
  });

  it('strips the deterministic failure cycle wrapper', () => {
    expect(
      summariseRunError("deterministic failure cycle: node 'lint' failed 3 times with: exit code 2", labels)
    ).toBe('Check against design system: Exit code 2.');
  });

  it('strips the max-retries wrapper from retry.rs', () => {
    expect(
      summariseRunError("max retries exceeded for node 'draft' after 4 attempts: upstream timed out", labels)
    ).toBe('Draft three concepts: Upstream timed out.');
  });

  it('strips nested wrappers and names the step from the first node mentioned', () => {
    expect(
      summariseRunError(
        "node 'lint' failed with no available route: handler error: handler 'tool' failed on node 'lint': exit 1",
        labels
      )
    ).toBe('Check against design system: Exit 1.');
  });

  it('falls back to the node id when the step has no label', () => {
    expect(summariseRunError("retry exhausted for node 'ghost': boom", labels)).toBe('ghost: Boom.');
  });

  it('passes an unrecognised message through, tidied', () => {
    expect(summariseRunError('pipeline cancelled', labels)).toBe('Pipeline cancelled.');
  });

  it('keeps a message that already ends a sentence', () => {
    expect(summariseRunError('Disk full!', labels)).toBe('Disk full!');
  });

  it('cuts at the first sentence', () => {
    expect(summariseRunError("retry exhausted for node 'draft': timed out. Tried 3 hosts. Gave up.", labels)).toBe(
      'Draft three concepts: Timed out.'
    );
  });

  it('cuts at the first line', () => {
    expect(summariseRunError('exit status 1\nstderr: something', labels)).toBe('Exit status 1.');
  });

  it('cuts a long message at 140 characters with an ellipsis', () => {
    const long = 'x'.repeat(200);
    const summary = summariseRunError(long, labels)!;
    expect(summary).toHaveLength(140);
    expect(summary.endsWith('…')).toBe(true);
    expect(summary.startsWith('X' + 'x'.repeat(10))).toBe(true);
  });

  it('adds nothing but the label, a capital, a full stop and an ellipsis', () => {
    const inputs = [
      "handler error: handler 'tool' failed on node 'lint': command exited with status 1",
      'pipeline stalled: no progress for 300s',
      'y'.repeat(300),
    ];
    for (const input of inputs) {
      const summary = summariseRunError(input, labels)!;
      const stripped = summary
        .replace(/^[^:]+: /, (m) => ([...labels.values()].some((l) => m === `${l}: `) ? '' : m))
        .replace(/[.…]$/, '')
        .toLowerCase();
      expect(input.toLowerCase()).toContain(stripped);
    }
  });
});
