// ABOUTME: Vitest setup file
// ABOUTME: Polyfill EventSource for SSE testing in Node.js environment

import { EventSource as EventSourcePolyfill } from 'eventsource';

// Make EventSource available globally for all tests
// eslint-disable-next-line no-var
declare global {
  // eslint-disable-next-line no-var
  var EventSource: typeof EventSourcePolyfill;
}
globalThis.EventSource = EventSourcePolyfill;
