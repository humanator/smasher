<script lang="ts" module>
  import type { SetCenterOptions, ViewportHelperFunctionOptions, XYPosition } from '@xyflow/svelte';

  /** The useSvelteFlow() helpers the canvas and its toolbar use from outside <SvelteFlow>. */
  export interface FlowApi {
    screenToFlowPosition: (screen: XYPosition) => XYPosition;
    zoomIn: (options?: ViewportHelperFunctionOptions) => Promise<boolean>;
    zoomOut: (options?: ViewportHelperFunctionOptions) => Promise<boolean>;
    fitView: () => Promise<boolean>;
    setCenter: (x: number, y: number, options?: SetCenterOptions) => Promise<boolean>;
    getZoom: () => number;
  }
</script>

<script lang="ts">
  // ABOUTME: Renders nothing; hands useSvelteFlow()'s viewport helpers and the live zoom level up to its parent
  // ABOUTME: Must be a child of <SvelteFlow>, which is where that hook's context exists

  import { useStore, useSvelteFlow } from '@xyflow/svelte';

  let { onReady, onZoom }: { onReady: (api: FlowApi) => void; onZoom?: (zoom: number) => void } = $props();

  const { screenToFlowPosition, zoomIn, zoomOut, fitView, setCenter, getZoom } = useSvelteFlow();
  const store = useStore();

  // Braces matter: a function returned from an effect is its teardown.
  $effect(() => {
    onReady({ screenToFlowPosition, zoomIn, zoomOut, fitView: () => fitView(), setCenter, getZoom });
  });

  $effect(() => {
    onZoom?.(store.viewport.zoom);
  });
</script>
