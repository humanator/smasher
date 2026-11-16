// ABOUTME: Turns the engine's run error string into the one line the run history shows
// ABOUTME: Strips handler wrappers and names the step by its label; never adds a cause of its own

const NODE = /node '([^']+)'/;
const MAX_LENGTH = 140;

// The engine's wrapper prefixes, from the #[error] formats in smasher-attractor's
// engine.rs (EngineError), handler.rs (HandlerError) and retry.rs (RetryError).
const WRAPPERS = [
  /^handler error: /,
  /^handler '[^']*' failed on node '[^']*': /,
  /^retry exhausted for node '[^']*': /,
  /^node '[^']*' failed with no available route: /,
  /^deterministic failure cycle: .*? with: /,
  /^max retries exceeded for node '[^']*' after \d+ attempts: /,
];

export function summariseRunError(error: string | null, labels: ReadonlyMap<string, string>): string | null {
  if (!error?.trim()) return null;
  const nodeId = NODE.exec(error)?.[1];
  const message = tidy(stripWrappers(error.trim())) ?? tidy(error.trim())!;
  return nodeId ? `${labels.get(nodeId) ?? nodeId}: ${message}` : message;
}

function stripWrappers(error: string): string {
  let rest = error;
  for (let stripped = true; stripped; ) {
    stripped = false;
    for (const wrapper of WRAPPERS) {
      const next = rest.replace(wrapper, '');
      if (next !== rest) {
        rest = next;
        stripped = true;
      }
    }
  }
  return rest;
}

/** The first sentence or line, capitalised and ending in a full stop, or cut at MAX_LENGTH with "…". */
function tidy(message: string): string | null {
  let text = message.trim().split('\n')[0].trim();
  if (!text) return null;
  const sentenceEnd = /[.!?](\s|$)/.exec(text);
  if (sentenceEnd) text = text.slice(0, sentenceEnd.index + 1);
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (text.length > MAX_LENGTH) return text.slice(0, MAX_LENGTH - 1).trimEnd() + '…';
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}
