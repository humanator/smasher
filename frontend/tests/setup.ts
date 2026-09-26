// ABOUTME: Vitest setup file
// ABOUTME: Polyfill EventSource for SSE testing in Node.js environment

import { EventSource as EventSourcePolyfill } from 'eventsource';
import '@testing-library/jest-dom/vitest';
// Side-effect import: registers an afterEach(cleanup) so each render() in
// tests doesn't leak DOM into the next test.
import '@testing-library/svelte/vitest';

// Make EventSource available globally for all tests
globalThis.EventSource = EventSourcePolyfill;

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

// jsdom's Blob predates Blob.prototype.text(), which every target webview
// (WKWebView, Chromium) implements. Read through FileReader, which jsdom has.
if (!Blob.prototype.text) {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
