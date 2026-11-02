<script lang="ts">
  // ABOUTME: The run page's Run information panel: Progress, Activity and Details tabs, 300px on the right or a sheet below 768px
  // ABOUTME: Open state belongs to RunPage (it drives the toolbar toggle); the chosen tab is remembered per viewer in localStorage

  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { loadPanelTab, savePanelTab, PANEL_TABS, type PanelTab } from '$lib/runPanelPrefs';
  import { stepProgress } from '$lib/runProgress';
  import type { PipelineEvent } from '../../lib/api/events';
  import type { GraphNodeSummary, RunSummary } from '../../lib/api/runs';
  import ActivityLog from './ActivityLog.svelte';
  import ProgressList from './ProgressList.svelte';
  import RunDetails from './RunDetails.svelte';

  let {
    open,
    onOpenChange = () => {},
    steps,
    events,
    labels,
    run = null,
    active = false,
    now = new Date(),
  }: {
    open: boolean;
    /** Called when the sheet closes itself (Escape, the close button, a tap outside). */
    onOpenChange?: (open: boolean) => void;
    /** In running order. */
    steps: readonly GraphNodeSummary[];
    events: readonly PipelineEvent[];
    /** Step names by node id, for the Activity tab's lines. */
    labels?: ReadonlyMap<string, string>;
    /** For the Details tab; null until the run has loaded. */
    run?: RunSummary | null;
    /** Whether the run is still going, which keeps the token counts polling. */
    active?: boolean;
    /** Ticks while the run is going, so "so far" ages. */
    now?: Date;
  } = $props();

  const LABELS: Record<PanelTab, string> = { progress: 'Progress', activity: 'Activity', details: 'Details' };

  const mobile = new IsMobile();
  let tab = $state<string>(loadPanelTab() ?? 'progress');
  const progress = $derived(stepProgress(steps, events));

  function onTabChange(value: string) {
    const known = PANEL_TABS.find((t) => t === value);
    if (known) savePanelTab(known);
  }
</script>

{#snippet body()}
  <Tabs.Root bind:value={tab} onValueChange={onTabChange} class="min-h-0 flex-1 gap-3">
    <Tabs.List variant="line" fullWidth class="shrink-0">
      {#each PANEL_TABS as t (t)}
        <Tabs.Trigger value={t}>{LABELS[t]}</Tabs.Trigger>
      {/each}
    </Tabs.List>
    <Tabs.Content value="progress" class="min-h-0 flex-1 overflow-y-auto">
      <ProgressList {steps} {progress} />
    </Tabs.Content>
    <Tabs.Content value="activity" class="min-h-0 flex-1 overflow-hidden">
      <ActivityLog {events} {labels} />
    </Tabs.Content>
    <Tabs.Content value="details" class="min-h-0 flex-1 overflow-y-auto">
      {#if run}
        <RunDetails {run} {active} {now} />
      {:else}
        <p class="m-0 text-body text-muted-foreground">The run's details appear once the run has loaded.</p>
      {/if}
    </Tabs.Content>
  </Tabs.Root>
{/snippet}

{#if mobile.current}
  <Sheet.Root {open} {onOpenChange}>
    <Sheet.Content side="right" class="gap-3 p-4">
      <Sheet.Title class="m-0 text-heading font-semibold text-foreground">Run information</Sheet.Title>
      <Sheet.Description class="sr-only">Progress, activity and details for this run.</Sheet.Description>
      {@render body()}
    </Sheet.Content>
  </Sheet.Root>
{:else if open}
  <!-- The inner box is as tall as the viewport and sticks, so a long log scrolls inside the panel instead of stretching the page. -->
  <aside aria-label="Run information" class="w-[300px] shrink-0 border-l border-border">
    <div class="sticky top-0 flex h-svh flex-col px-4 pt-5 pb-8">
      {@render body()}
    </div>
  </aside>
{/if}
