// ABOUTME: Tests for failureAdvice, the run page's "What you can try" table
// ABOUTME: Uses the engine's real failure wording (tool_handler.rs, system-lint, render-capture, smasher-llm)

import { describe, it, expect } from 'vitest';
import { failureAdvice, GENERIC_ADVICE } from '../../src/lib/failureAdvice';

describe('failureAdvice', () => {
  it('gives only the generic advice for no error', () => {
    expect(failureAdvice(null)).toEqual([GENERIC_ADVICE]);
    expect(failureAdvice('   ')).toEqual([GENERIC_ADVICE]);
  });

  it('gives only the generic advice for an error it does not know', () => {
    expect(failureAdvice('something odd happened')).toEqual([GENERIC_ADVICE]);
  });

  it('suggests connecting a candidate folder when candidate_dir is missing', () => {
    const advice = failureAdvice("handler error: system_lint: missing candidate_dir");
    expect(advice.join(' ')).toMatch(/candidate_dir/);
    expect(advice).not.toContain(GENERIC_ADVICE);
  });

  it('suggests checking the command when a tool exits non-zero', () => {
    const advice = failureAdvice("node 'lint' failed with no available route: exit code 2: bad flag");
    expect(advice.join(' ')).toMatch(/command/i);
  });

  it('suggests a longer timeout or smaller work when a step times out', () => {
    const advice = failureAdvice('timed out after 30s');
    expect(advice.join(' ')).toMatch(/time/i);
  });

  it('suggests adding an API key when the provider rejects or lacks one', () => {
    for (const error of [
      'authentication failed for provider anthropic: invalid x-api-key',
      'missing API key',
      'provider openai is not configured',
    ]) {
      expect(failureAdvice(error).join(' ')).toMatch(/API key/);
    }
  });

  it('suggests another model or trying again for a provider error', () => {
    for (const error of [
      'rate limited by anthropic: retry after Some(2000)ms',
      'provider openai returned server error (HTTP 500): oops',
      'model gpt-9 not found or not available for provider openai',
    ]) {
      const advice = failureAdvice(error);
      expect(advice.join(' ')).toMatch(/model|again/i);
      expect(advice).not.toContain(GENERIC_ADVICE);
    }
  });

  it('never repeats a suggestion when several patterns match', () => {
    const advice = failureAdvice('request to anthropic timed out after 30000ms; missing API key; exit code 1');
    expect(new Set(advice).size).toBe(advice.length);
    expect(advice.length).toBeGreaterThan(1);
  });

  it('only mentions what the error mentions', () => {
    // A tool failure must not suggest anything about API keys.
    expect(failureAdvice('exit code 1').join(' ')).not.toMatch(/API key/);
  });
});
