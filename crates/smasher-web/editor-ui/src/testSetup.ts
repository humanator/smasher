import '@testing-library/jest-dom/vitest';
// Side-effect import: registers an afterEach(cleanup) so each render() in
// WorkflowCanvasInner.test.ts doesn't leak DOM into the next test.
import '@testing-library/svelte/vitest';

// jsdom implements neither ResizeObserver nor real layout -- Svelte Flow
// (like its React Flow sibling) observes node/pane size to compute layout,
// so both need a stub in a jsdom test environment. This is standard
// guidance for testing xyflow-family libraries outside a real browser, not
// something specific to this component.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver ??= ResizeObserverStub;

// jsdom doesn't implement matchMedia at all. Svelte Flow uses it internally
// for a prefers-color-scheme media query (initial-store.svelte.js) -- a
// standard jsdom test-environment gap, not specific to this component.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
