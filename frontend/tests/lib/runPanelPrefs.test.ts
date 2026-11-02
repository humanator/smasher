// ABOUTME: Tests for the run panel's remembered open state and tab, kept per viewer in localStorage
// ABOUTME: Storage is real jsdom storage; a throwing Storage stands in for private windows and blocked site data

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadPanelOpen, savePanelOpen, loadPanelTab, savePanelTab } from '../../src/lib/runPanelPrefs';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

function breakStorage() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
}

describe('panel open state', () => {
  it('is null when nothing was remembered', () => {
    expect(loadPanelOpen()).toBeNull();
  });

  it('round-trips open and closed', () => {
    savePanelOpen(true);
    expect(loadPanelOpen()).toBe(true);
    savePanelOpen(false);
    expect(loadPanelOpen()).toBe(false);
  });

  it('ignores a value it did not write', () => {
    localStorage.setItem('smasher.runPanel.open', 'maybe');
    expect(loadPanelOpen()).toBeNull();
  });

  it('survives storage that throws', () => {
    breakStorage();
    expect(loadPanelOpen()).toBeNull();
    expect(() => savePanelOpen(true)).not.toThrow();
  });
});

describe('panel tab', () => {
  it('is null when nothing was remembered', () => {
    expect(loadPanelTab()).toBeNull();
  });

  it('round-trips a known tab and ignores an unknown one', () => {
    savePanelTab('activity');
    expect(loadPanelTab()).toBe('activity');
    localStorage.setItem('smasher.runPanel.tab', 'bogus');
    expect(loadPanelTab()).toBeNull();
  });

  it('survives storage that throws', () => {
    breakStorage();
    expect(loadPanelTab()).toBeNull();
    expect(() => savePanelTab('details')).not.toThrow();
  });
});
