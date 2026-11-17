<script lang="ts">
  // ABOUTME: The frame around every route - source-list sidebar, 52px toolbar and the page's main area
  // ABOUTME: Feeds the sidebar from the library store; below 768px the sidebar is a sheet opened from the toolbar

  import { onMount, type Snippet } from 'svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { isTauri } from '$lib/native';
  import { formatWorkflowName } from '$lib/utils';
  import { libraryStore } from '../../stores/library.svelte';
  import SourceList from './SourceList.svelte';
  import Toolbar from './Toolbar.svelte';

  let {
    title,
    subtitle = null,
    subtitleDot = null,
    subtitleLive = false,
    back = null,
    actions,
    titleAccessory = null,
    currentWorkflowId = null,
    librarySection = null,
    sidebarCollapsed = false,
    children,
  }: {
    title: string;
    subtitle?: string | null;
    subtitleDot?: 'success' | 'warning' | null;
    subtitleLive?: boolean;
    back?: { label: string; href: string } | null;
    actions?: Snippet | null;
    titleAccessory?: Snippet | null;
    currentWorkflowId?: string | null;
    /** The Library screen being shown, highlighted in the sidebar. */
    librarySection?: 'workflows' | 'runs' | 'needs-you' | null;
    /** Start with the sidebar folded to its icon rail, as the editor does for its step library. */
    sidebarCollapsed?: boolean;
    children: Snippet;
  } = $props();

  const workflows = $derived(
    libraryStore.workflows.map((w) => ({
      id: w.id,
      label: formatWorkflowName(w.name),
      state: libraryStore.workflowState(w.id),
    }))
  );

  onMount(() => {
    libraryStore.start();
    return () => libraryStore.stop();
  });
</script>

<Sidebar.Provider open={!sidebarCollapsed} style="--sidebar-width: 220px; --sidebar-width-icon: 76px;">
  <SourceList
    {workflows}
    runCount={libraryStore.runs.length}
    needsYouCount={libraryStore.needsYou.length}
    {currentWorkflowId}
    {librarySection}
    native={isTauri()}
  />
  <div class="flex min-w-0 flex-1 flex-col bg-background text-foreground">
    <Toolbar {title} {subtitle} {subtitleDot} {subtitleLive} {back} {titleAccessory} {actions}>
      {#snippet leading()}
        <Sidebar.Trigger class="md:hidden" aria-label="Open sidebar" />
      {/snippet}
    </Toolbar>
    <main class="min-w-0 flex-1">
      {@render children()}
    </main>
  </div>
</Sidebar.Provider>
