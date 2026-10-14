<script lang="ts">
  // ABOUTME: Sidebar content - the Library nav, a Workflows nav with state dots, a footer and the collapse toggle
  // ABOUTME: Presentational (plain props, no network); AppShell feeds it from the library store inside a Sidebar.Provider

  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import WorkflowIcon from '@lucide/svelte/icons/workflow';
  import PlayIcon from '@lucide/svelte/icons/play';
  import HandIcon from '@lucide/svelte/icons/hand';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import type { WorkflowState } from '../../stores/library.svelte';

  let {
    workflows,
    runCount,
    needsYouCount,
    currentWorkflowId = null,
    native = false,
  }: {
    workflows: { id: string; label: string; state: WorkflowState }[];
    runCount: number;
    needsYouCount: number;
    currentWorkflowId?: string | null;
    /** In the desktop app the real traffic lights sit in the header, so it reserves room for them. */
    native?: boolean;
  } = $props();

  const sidebar = Sidebar.useSidebar();
  // The phone-width sheet is always shown in full.
  const expanded = $derived(sidebar.isMobile || sidebar.open);

  const footerText = $derived(
    needsYouCount === 0
      ? 'Smasher'
      : `Smasher · ${needsYouCount} ${needsYouCount === 1 ? 'run needs' : 'runs need'} your decision`
  );

  const rowClass = 'h-7 gap-2 rounded-md px-2 text-[13px]';
</script>

<Sidebar.Root collapsible="icon">
  <aside class="flex h-full min-h-0 flex-col">
    <div
      data-tauri-drag-region={native ? '' : undefined}
      class={cn(
        'flex h-[52px] shrink-0 items-center pr-3',
        native ? 'pl-[78px]' : 'pl-5',
        !expanded && 'justify-center px-0',
        !expanded && native && 'h-[76px] flex-col gap-2'
      )}
    >
      {#if expanded && !native}
        <span data-testid="wordmark" class="text-[15px] font-bold">Smasher</span>
      {/if}
      <Button
        variant="ghost"
        size="icon"
        class={cn(expanded && 'ml-auto')}
        aria-label="Toggle sidebar"
        aria-expanded={expanded}
        onclick={() => sidebar.toggle()}
      >
        <PanelLeftIcon aria-hidden="true" />
      </Button>
    </div>

    <nav aria-label="Library" class="px-2.5">
      {#if expanded}
        <Sidebar.GroupLabel class="h-6 rounded-md px-2 text-[11px] font-semibold text-sidebar-muted-foreground">
          Library
        </Sidebar.GroupLabel>
      {/if}
      <Sidebar.Menu class="gap-px">
        <Sidebar.MenuItem>
          <Sidebar.MenuButton class={rowClass}>
            {#snippet child({ props })}
              <a {...props} href="/" title="Workflows">
                <WorkflowIcon aria-hidden="true" class="text-primary" />
                {#if expanded}
                  <span class="truncate">Workflows</span>
                  <span class="ml-auto text-[11px] text-sidebar-muted-foreground">{workflows.length}</span>
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton class={rowClass}>
            {#snippet child({ props })}
              <a {...props} href="/#runs" title="Recent runs">
                <PlayIcon aria-hidden="true" class="text-primary" />
                {#if expanded}
                  <span class="truncate">Recent runs</span>
                  <span class="ml-auto text-[11px] text-sidebar-muted-foreground">{runCount}</span>
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton class={rowClass}>
            {#snippet child({ props })}
              <a {...props} href="/?runs=needs-you#runs" title="Needs you">
                <HandIcon aria-hidden="true" class="text-primary" />
                {#if expanded}
                  <span class="truncate">Needs you</span>
                  {#if needsYouCount > 0}
                    <Badge data-testid="needs-you-count" class="ml-auto">{needsYouCount}</Badge>
                  {/if}
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </nav>

    <nav aria-label="Workflows" class="mt-3 flex min-h-0 flex-1 flex-col px-2.5">
      {#if expanded}
        <Sidebar.GroupLabel class="h-6 rounded-md px-2 text-[11px] font-semibold text-sidebar-muted-foreground">
          Workflows
        </Sidebar.GroupLabel>
      {/if}
      <Sidebar.Menu class="min-h-0 flex-1 gap-px overflow-y-auto">
        {#each workflows as workflow (workflow.id)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton class={rowClass} isActive={workflow.id === currentWorkflowId}>
              {#snippet child({ props })}
                <a
                  {...props}
                  href={`/workflows/${encodeURIComponent(workflow.id)}`}
                  title={workflow.label}
                  aria-current={workflow.id === currentWorkflowId ? 'page' : undefined}
                >
                  {#if expanded}
                    <span class="truncate">{workflow.label}</span>
                  {:else}
                    <WorkflowIcon aria-hidden="true" class="text-sidebar-muted-foreground" />
                  {/if}
                  {#if workflow.state}
                    <span
                      data-testid="state-dot"
                      class={cn(
                        'size-[7px] shrink-0 rounded-full',
                        expanded && 'ml-auto',
                        workflow.state === 'needs-you' ? 'bg-primary' : 'bg-info'
                      )}
                    >
                      <span class="sr-only">{workflow.state === 'needs-you' ? 'needs you' : 'running'}</span>
                    </span>
                  {/if}
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </nav>

    {#if expanded}
      <a href="/design" class="shrink-0 px-5 pb-1 text-[11px] text-sidebar-muted-foreground hover:text-sidebar-foreground">Design system</a>
      <div data-testid="sidebar-footer" class="shrink-0 px-5 py-2.5 text-[11px] leading-snug text-sidebar-muted-foreground">
        {footerText}
      </div>
    {/if}
  </aside>
</Sidebar.Root>
