// ABOUTME: Tests for the runs REST client
// ABOUTME: Tests verify API client structure and types

import { describe, it, expect } from 'vitest';
import * as runs from '../../../src/lib/api/runs';

describe('runs API client', () => {
  it('should export submitRun function', () => {
    expect(typeof runs.submitRun).toBe('function');
  });

  it('should export listRuns function', () => {
    expect(typeof runs.listRuns).toBe('function');
  });

  it('should export getRun function', () => {
    expect(typeof runs.getRun).toBe('function');
  });

  it('should export cancelRun function', () => {
    expect(typeof runs.cancelRun).toBe('function');
  });

  it('should export resumeRun function', () => {
    expect(typeof runs.resumeRun).toBe('function');
  });

  it('should export getTokens function', () => {
    expect(typeof runs.getTokens).toBe('function');
  });

  it('should export renderGraph function', () => {
    expect(typeof runs.renderGraph).toBe('function');
  });

  it('should export listCandidates function', () => {
    expect(typeof runs.listCandidates).toBe('function');
  });

  it('should export parseGraphNodes function', () => {
    expect(typeof runs.parseGraphNodes).toBe('function');
  });

  it('should export getHealth function', () => {
    expect(typeof runs.getHealth).toBe('function');
  });
});
