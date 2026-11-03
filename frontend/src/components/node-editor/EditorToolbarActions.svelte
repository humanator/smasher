<script lang="ts">
  // ABOUTME: The editor's toolbar controls (R1): Zoom out, zoom level, Zoom in, Fit, Export .dot file and Save
  // ABOUTME: Presentational; the canvas owns the viewport and the save, and hands their state and callbacks in

  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ShareIcon from '@lucide/svelte/icons/share';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import ToolbarDivider from '../shell/ToolbarDivider.svelte';
  import ToolbarIconButton from '../shell/ToolbarIconButton.svelte';

  let {
    zoom,
    onZoomIn,
    onZoomOut,
    onFit,
    onExport = undefined,
    onSave,
    saving,
    saveDisabled,
  }: {
    /** The canvas's zoom level, 1 = 100%. */
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
    /** Absent in create mode, where there is no file to export yet. */
    onExport?: () => void;
    onSave: () => void;
    saving: boolean;
    saveDisabled: boolean;
  } = $props();
</script>

<Tooltip.Provider>
  <div role="group" aria-label="Zoom" class="flex items-center rounded-md bg-muted p-0.5">
    <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onclick={onZoomOut}>
      <MinusIcon aria-hidden="true" />
    </Button>
    <span class="min-w-10 text-center text-xs text-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
    <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onclick={onZoomIn}>
      <PlusIcon aria-hidden="true" />
    </Button>
  </div>
  <Button variant="outline" onclick={onFit}>Fit</Button>
  <ToolbarDivider />
  {#if onExport}
    <ToolbarIconButton label="Export .dot file" icon={ShareIcon} onclick={onExport} testId="export-dot-button" />
  {/if}
  <Button variant="outline" onclick={onSave} disabled={saveDisabled} data-testid="save-button">
    {saving ? 'Saving…' : 'Save'}
  </Button>
</Tooltip.Provider>
