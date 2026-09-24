<script lang="ts">
  // ABOUTME: Renders nothing; hands useSvelteFlow()'s screenToFlowPosition up to its parent
  // ABOUTME: Must be a child of <SvelteFlow>, which is where that hook's context exists

  import { useSvelteFlow, type XYPosition } from '@xyflow/svelte';

  let { onReady }: { onReady: (toFlow: (screen: XYPosition) => XYPosition) => void } = $props();

  const { screenToFlowPosition } = useSvelteFlow();
  // Braces matter: a function returned from an effect is its teardown.
  $effect(() => {
    onReady(screenToFlowPosition);
  });
</script>
