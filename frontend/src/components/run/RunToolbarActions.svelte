<script lang="ts">
  // ABOUTME: The run page's toolbar controls: Abort Run while active or Run Again once finished, a divider, the Run information toggle
  // ABOUTME: Presentational; RunPage owns the state and passes the handlers. Needs no Tooltip.Provider above it

  import InspectorIcon from '@lucide/svelte/icons/panel-right';
  import RefreshIcon from '@lucide/svelte/icons/refresh-cw';
  import SquareIcon from '@lucide/svelte/icons/square';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import ToolbarDivider from '../shell/ToolbarDivider.svelte';
  import ToolbarIconButton from '../shell/ToolbarIconButton.svelte';

  let {
    active,
    aborting = false,
    onAbort,
    onRunAgain = null,
    panelOpen,
    onTogglePanel,
  }: {
    /** The run has not ended: Abort Run shows instead of Run Again. */
    active: boolean;
    aborting?: boolean;
    onAbort: () => void;
    /** Opens the Run dialog; null hides Run Again (ad-hoc runs have no workflow). */
    onRunAgain?: (() => void) | null;
    panelOpen: boolean;
    onTogglePanel: () => void;
  } = $props();
</script>

<Tooltip.Provider>
  {#if active}
    <Button variant="destructive" onclick={onAbort} disabled={aborting}>
      <SquareIcon aria-hidden="true" />
      {aborting ? 'Aborting…' : 'Abort Run'}
    </Button>
  {:else if onRunAgain}
    <Button variant="outline" onclick={onRunAgain}>
      <RefreshIcon aria-hidden="true" />
      Run Again
    </Button>
  {/if}
  <ToolbarDivider />
  <ToolbarIconButton
    label="Run information"
    icon={InspectorIcon}
    pressed={panelOpen}
    expanded={panelOpen}
    onclick={onTogglePanel}
  />
</Tooltip.Provider>
