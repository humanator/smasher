<script lang="ts">
  // ABOUTME: Sidebar content - the Library nav, a Workflows nav with state dots, a footer and the collapse toggle
  // ABOUTME: Presentational (plain props, no network); AppShell feeds it from the library store inside a Sidebar.Provider

  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import FileIcon from '@lucide/svelte/icons/file';
  import UserIcon from '@lucide/svelte/icons/user';
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
    librarySection = null,
  }: {
    workflows: { id: string; label: string; state: WorkflowState }[];
    runCount: number;
    needsYouCount: number;
    currentWorkflowId?: string | null;
    /** In the desktop app the real traffic lights sit in the header, so it reserves room for them. */
    native?: boolean;
    /** The Library row for the page being shown (the dashboard and its runs views). */
    librarySection?: 'workflows' | 'runs' | 'needs-you' | null;
  } = $props();

  const sidebar = Sidebar.useSidebar();
  // The phone-width sheet is always shown in full.
  const expanded = $derived(sidebar.isMobile || sidebar.open);

  const footerText = $derived(
    needsYouCount === 0
      ? 'Smasher'
      : `Smasher · ${needsYouCount} ${needsYouCount === 1 ? 'run needs' : 'runs need'} your decision`
  );

  const current = (section: typeof librarySection) => (librarySection === section ? 'page' : undefined);
</script>

<Sidebar.Root collapsible="icon">
  <aside class="flex h-full min-h-0 flex-col">
    <div
      data-tauri-drag-region={native ? '' : undefined}
      class={cn(
        'flex h-toolbar shrink-0 items-center pr-3',
        native ? 'pl-[78px]' : 'pl-5',
        !expanded && 'justify-center px-0',
        !expanded && native && 'h-[76px] flex-col gap-2'
      )}
    >
      {#if expanded && !native}
        <span data-testid="wordmark" class="text-heading font-bold">Smasher</span>
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
        <Sidebar.GroupLabel>Library</Sidebar.GroupLabel>
      {/if}
      <Sidebar.Menu class="gap-px">
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={librarySection === 'workflows'}>
            {#snippet child({ props })}
              <a {...props} href="/" title="Workflows" aria-current={current('workflows')}>
                {@render flowIcon()}
                {#if expanded}
                  <span class="truncate">Workflows</span>
                  <span class="ml-auto text-small text-sidebar-muted-foreground">{workflows.length}</span>
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={librarySection === 'runs'}>
            {#snippet child({ props })}
              <a {...props} href="/#runs" title="Recent runs" aria-current={current('runs')}>
                <ClockIcon aria-hidden="true" class="text-primary" />
                {#if expanded}
                  <span class="truncate">Recent runs</span>
                  <span class="ml-auto text-small text-sidebar-muted-foreground">{runCount}</span>
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={librarySection === 'needs-you'}>
            {#snippet child({ props })}
              <a {...props} href="/?runs=needs-you#runs" title="Needs you" aria-current={current('needs-you')}>
                <UserIcon aria-hidden="true" class="text-primary" />
                {#if expanded}
                  <span class="truncate">Needs you</span>
                  {#if needsYouCount > 0}
                    <Badge data-testid="needs-you-count" class="ml-auto h-4 min-w-[18px] px-[5px] font-semibold">{needsYouCount}</Badge>
                  {/if}
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </nav>

    <nav aria-label="Workflows" class="mt-3.5 flex min-h-0 flex-1 flex-col px-2.5">
      {#if expanded}
        <Sidebar.GroupLabel>Workflows</Sidebar.GroupLabel>
      {/if}
      <Sidebar.Menu class="min-h-0 flex-1 gap-px overflow-y-auto">
        {#each workflows as workflow (workflow.id)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={workflow.id === currentWorkflowId}>
              {#snippet child({ props })}
                <a
                  {...props}
                  href={`/workflows/${encodeURIComponent(workflow.id)}`}
                  title={workflow.label}
                  aria-current={workflow.id === currentWorkflowId ? 'page' : undefined}
                >
                  <FileIcon data-icon="workflow-file" aria-hidden="true" class="text-muted-foreground" />
                  {#if expanded}
                    <span class="truncate">{workflow.label}</span>
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
      <a href="/design" class="shrink-0 px-[18px] pt-2 pb-1 text-caption text-sidebar-muted-foreground hover:text-sidebar-foreground">Design system</a>
      <div data-testid="sidebar-footer" class="shrink-0 px-[18px] pt-2.5 pb-3.5 text-caption leading-[1.4] text-sidebar-muted-foreground">
        {footerText}
      </div>
    {/if}
  </aside>
</Sidebar.Root>

{#snippet flowIcon()}
  <!-- The board's "flow" glyph (two linked steps); lucide has no exact match. -->
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
    <path d="M6 3v12M18 9v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
{/snippet}
