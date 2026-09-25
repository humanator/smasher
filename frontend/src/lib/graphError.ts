// ABOUTME: Turns a graph-render error from the server into the text the run page shows
// ABOUTME: A missing Graphviz gets an install hint; other messages pass through

const GRAPHVIZ_HINT =
  "Graphviz's `dot` command isn't installed, or isn't on PATH. Install it (e.g. " +
  '`brew install graphviz` on macOS, `apt install graphviz` on Debian/Ubuntu) and reload ' +
  'this page.';

export function graphErrorMessage(message: string): string {
  if (message.includes('graphviz not available')) return GRAPHVIZ_HINT;
  return message || 'Failed to render the pipeline graph';
}
