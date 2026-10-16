<script lang="ts">
  // ABOUTME: The home page: toolbar search and actions, the needs-you banner, All workflows and Recent runs
  // ABOUTME: Reads the library store, owns the search query, the Run sheet, Settings and .dot import

  import PlusIcon from '@lucide/svelte/icons/plus';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import * as workflowsApi from '$lib/api/workflows';
  import type { WorkflowSummary } from '$lib/api/workflows';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { useNow } from '$lib/hooks/useNow.svelte';
  import { loadFile } from '$lib/native';
  import { errorMessage } from '$lib/notify';
  import { usePageActions, usePageSubtitle } from '$lib/page-header.svelte';
  import { filterWorkflows } from '$lib/workflowSearch';
  import { libraryStore } from '../../stores/library.svelte';
  import ToolbarIconButton from '../shell/ToolbarIconButton.svelte';
  import NeedsYouBanner from './NeedsYouBanner.svelte';
  import LazyRunDialog from './LazyRunDialog.svelte';
  import LazySettingsDialog from './LazySettingsDialog.svelte';
  import RunList from './RunList.svelte';
  import WorkflowTable from './WorkflowTable.svelte';

  let { library = libraryStore }: { library?: typeof libraryStore } = $props();

  const now = useNow();
  // Phones get the search full width under the toolbar, where it fits.
  const mobile = new IsMobile();
  let query = $state('');
  let runTarget = $state<WorkflowSummary | null>(null);
  let runDialogOpen = $state(false);
  let settingsOpen = $state(false);
  let importError = $state<string | null>(null);

  const shownCount = $derived(filterWorkflows(library.workflows, query).length);
  const needsYouCount = $derived(library.needsYou.length);

  usePageSubtitle(() => {
    if (!library.loaded) return null;
    const workflows = `${shownCount} workflow${shownCount === 1 ? '' : 's'}`;
    return needsYouCount > 0 ? `${workflows} · ${needsYouCount} needs you` : workflows;
  });
  const inHeader = usePageActions(toolbarActions);

  function openRun(workflow: WorkflowSummary) {
    runTarget = workflow;
    runDialogOpen = true;
  }

  // Native open dialog in the desktop app, file input in the browser. The
  // workflow is named after the file's stem, then opened in the editor.
  async function importDot() {
    importError = null;
    try {
      const file = await loadFile();
      if (!file) return;
      const name = file instanceof File ? file.name.replace(/\.(dot|gv)$/i, '') : 'imported';
      const { id } = await workflowsApi.importWorkflowDot(name, await file.text());
      window.location.href = `/workflows/${encodeURIComponent(id)}/edit`;
    } catch (err) {
      importError = errorMessage(err, 'Failed to import workflow');
    }
  }
</script>

{#snippet search()}
  <Input search type="search" aria-label="Search workflows" placeholder="Search" bind:value={query} />
{/snippet}

{#snippet toolbarActions()}
  <Tooltip.Provider>
    {#if !mobile.current}
      <div class="mr-1.5 w-[210px]">{@render search()}</div>
    {/if}
    <ToolbarIconButton label="Import .dot file" icon={UploadIcon} onclick={importDot} />
    <ToolbarIconButton label="AI model settings" icon={SettingsIcon} onclick={() => (settingsOpen = true)} />
    <ToolbarIconButton label="New workflow" icon={PlusIcon} href="/workflows/new" />
  </Tooltip.Provider>
{/snippet}

{#if !inHeader}
  <div class="flex items-center gap-1.5 px-6 pt-3">{@render toolbarActions()}</div>
{/if}

<NeedsYouBanner {library} />

{#if mobile.current}
  <div class="border-b border-border px-4 py-2">{@render search()}</div>
{/if}

<div class="px-4 pt-5 pb-8 sm:px-6">
  {#if importError}
    <p role="alert" class="mb-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive">
      Couldn't import that file: {importError}
    </p>
  {/if}

  <WorkflowTable
    workflows={library.workflows}
    runs={library.runs}
    now={now.current}
    {query}
    loading={!library.loaded && !library.error}
    error={library.loaded ? null : library.error}
    onRun={openRun}
    onRetry={() => void library.refresh()}
    onImport={importDot}
  />

  <div class="mt-7">
    <RunList {library} />
  </div>
</div>

{#if runTarget}
  <LazyRunDialog workflow={runTarget} bind:open={runDialogOpen} />
{/if}
<LazySettingsDialog bind:open={settingsOpen} trigger={false} />
