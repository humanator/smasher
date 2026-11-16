// ABOUTME: The run panel's remembered open state and tab, kept per viewer in localStorage
// ABOUTME: Every access is wrapped: private windows and blocked site data throw, and the panel then just uses its defaults

export type PanelTab = 'progress' | 'activity' | 'details';

export const PANEL_TABS: readonly PanelTab[] = ['progress', 'activity', 'details'];

const OPEN_KEY = 'smasher.runPanel.open';
const TAB_KEY = 'smasher.runPanel.tab';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered; the panel works the same this visit.
  }
}

/** True or false as last chosen, null when never chosen or unreadable. */
export function loadPanelOpen(): boolean | null {
  const value = read(OPEN_KEY);
  return value === '1' ? true : value === '0' ? false : null;
}

export function savePanelOpen(open: boolean) {
  write(OPEN_KEY, open ? '1' : '0');
}

export function loadPanelTab(): PanelTab | null {
  const value = read(TAB_KEY);
  return PANEL_TABS.find((tab) => tab === value) ?? null;
}

export function savePanelTab(tab: PanelTab) {
  write(TAB_KEY, tab);
}
