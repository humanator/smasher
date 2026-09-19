// `npm run dev` entry point only -- not part of the shipped bundle. The
// real production entry is WorkflowCanvas.svelte itself (compiled to the
// <workflow-canvas> custom element via vite.config.ts's build.lib), which
// smasher-web's real pages bootstrap the same way this does, just with a
// real workflow id and server-fetched graph instead of this sample data.
import './WorkflowCanvas.svelte';
import type { EditorGraph } from './types';

const sampleGraph: EditorGraph = {
  name: 'DevPreview',
  graph_attrs: {},
  nodes: [
    { id: 'start', node_type: 'Start', label: 'Start', attrs: {} },
    {
      id: 'gen',
      node_type: 'Codergen',
      label: 'Generate',
      attrs: { prompt: 'write the thing', model: 'claude-sonnet-4-20250514' },
    },
    { id: 'exit', node_type: 'Exit', label: 'Exit', attrs: {} },
  ],
  edges: [
    { from: 'start', to: 'gen', label: null, condition: null, priority: null, loop_restart: false, attrs: {} },
    { from: 'gen', to: 'exit', label: null, condition: null, priority: null, loop_restart: false, attrs: {} },
  ],
};

const el = document.createElement('workflow-canvas') as HTMLElement & { graph?: EditorGraph };
el.style.display = 'block';
el.style.height = '100%';
el.graph = sampleGraph;
el.addEventListener('workflow-saved', (e) => {
  console.log('workflow-saved', (e as CustomEvent).detail);
});
document.getElementById('app')!.appendChild(el);
