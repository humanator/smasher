<script lang="ts">
  // ABOUTME: The editor's toolbar controls (R1): Zoom out, zoom level, Zoom in, Fit, Export .dot file, Save and Run
  // ABOUTME: Presentational; the canvas owns the viewport, the save and the narrow-width sheets (Steps, Inspector)

  import BlocksIcon from '@lucide/svelte/icons/blocks';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PanelRightIcon from '@lucide/svelte/icons/panel-right';
  import ScanIcon from '@lucide/svelte/icons/scan';
  import PlayIcon from '@lucide/svelte/icons/play';
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
    onRun = undefined,
    saving,
    saveDisabled,
    compact = false,
    onSteps = undefined,
    stepsOpen = false,
    onInspector = undefined,
    inspectorOpen = false,
  }: {
    /** The canvas's zoom level, 1 = 100%. */
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
    /** Absent in create mode, where there is no file to export yet. */
    onExport?: () => void;
    onSave: () => void;
    /** Absent in create mode until the first save (D11). */
    onRun?: () => void;
    saving: boolean;
    saveDisabled: boolean;
    /** Phone width (D13): zoom collapses to Fit, and Fit and Run become icons so the toolbar fits. */
    compact?: boolean;
    /** Phone width: opens the step library sheet. */
    onSteps?: () => void;
    stepsOpen?: boolean;
    /** Below 1100px: shows the inspector (a sheet on a phone). */
    onInspector?: () => void;
    inspectorOpen?: boolean;
  } = $props();
</script>

<Tooltip.Provider>
  {#if onSteps}
    <ToolbarIconButton label="Steps" icon={BlocksIcon} onclick={onSteps} expanded={stepsOpen} />
  {/if}
  {#if onInspector}
    <ToolbarIconButton label="Inspector" icon={PanelRightIcon} onclick={onInspector} expanded={inspectorOpen} />
  {/if}
  {#if !compact}
    <div role="group" aria-label="Zoom" class="flex items-center rounded-md bg-muted p-0.5">
      <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onclick={onZoomOut}>
        <MinusIcon aria-hidden="true" />
      </Button>
      <span class="min-w-10 text-center text-xs text-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onclick={onZoomIn}>
        <PlusIcon aria-hidden="true" />
      </Button>
    </div>
  {/if}
  {#if compact}
    <ToolbarIconButton label="Fit" icon={ScanIcon} onclick={onFit} />
  {:else}
    <Button variant="outline" onclick={onFit}>Fit</Button>
    <ToolbarDivider />
  {/if}
  {#if onExport}
    <ToolbarIconButton label="Export .dot file" icon={ShareIcon} onclick={onExport} testId="export-dot-button" />
  {/if}
  <Button variant="outline" onclick={onSave} disabled={saveDisabled} data-testid="save-button">
    {saving ? 'Saving…' : 'Save'}
  </Button>
  {#if onRun}
    {#if compact}
      <Button onclick={onRun} disabled={saving} size="icon" aria-label="Run">
        <PlayIcon aria-hidden="true" />
      </Button>
    {:else}
      <Button onclick={onRun} disabled={saving}>
        <PlayIcon aria-hidden="true" />
        Run
      </Button>
    {/if}
  {/if}
</Tooltip.Provider>
