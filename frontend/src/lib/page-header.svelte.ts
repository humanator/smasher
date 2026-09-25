// ABOUTME: Context that lets a page's components place their controls in the shared page header
// ABOUTME: App provides it; components register actions via usePageActions(), a title via usePageTitle()

import { getContext, setContext, type Snippet } from 'svelte';

const KEY = Symbol('page-header');

export class PageHeaderState {
  actions = $state<Snippet | null>(null);
  /** A title the page sets from data it loads; null leaves App's own. */
  title = $state<string | null>(null);
}

export function providePageHeader(): PageHeaderState {
  return setContext(KEY, new PageHeaderState());
}

/**
 * Registers `actions` as the page header's controls for as long as the
 * calling component is mounted. Returns false when no header is provided
 * (e.g. the component rendered on its own), in which case the caller
 * should render `actions` inline itself. Must be called during component
 * initialisation.
 */
export function usePageActions(actions: Snippet): boolean {
  const header = getContext<PageHeaderState | undefined>(KEY);
  if (!header) return false;
  $effect(() => {
    header.actions = actions;
    return () => {
      if (header.actions === actions) header.actions = null;
    };
  });
  return true;
}

/**
 * Sets the page header's title to `title()` for as long as the calling
 * component is mounted, following it as it changes. A null title leaves
 * App's fallback in place. Must be called during component initialisation.
 */
export function usePageTitle(title: () => string | null): void {
  const header = getContext<PageHeaderState | undefined>(KEY);
  if (!header) return;
  $effect(() => {
    const current = title();
    header.title = current;
    return () => {
      if (header.title === current) header.title = null;
    };
  });
}
