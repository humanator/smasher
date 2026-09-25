<script lang="ts">
  // ABOUTME: Root app shell - routes to components based on URL path
  // ABOUTME: Minimal manual routing: catalog at /, run detail at /runs/{id}, workflow editor at /workflows/*

  import './app.css';
  import { onMount } from 'svelte';
  import WorkflowCatalog from './components/dashboard/WorkflowCatalog.svelte';
  import RunList from './components/dashboard/RunList.svelte';
  import RunDetail from './components/dashboard/RunDetail.svelte';
  import EventLog from './components/dashboard/EventLog.svelte';
  import QuestionCard from './components/dashboard/QuestionCard.svelte';
  import CandidateGallery from './components/dashboard/CandidateGallery.svelte';
  import GalleryGate from './components/dashboard/GalleryGate.svelte';
  import DecisionHistory from './components/dashboard/DecisionHistory.svelte';
  import NewWorkflowPage from './components/dashboard/NewWorkflowPage.svelte';
  import WorkflowEditorPage from './components/dashboard/WorkflowEditorPage.svelte';
  import PageHeader from './components/dashboard/PageHeader.svelte';
  import SettingsDialog from './components/dashboard/SettingsDialog.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Toaster } from '$lib/components/ui/sonner/index.js';
  import { providePageHeader } from '$lib/page-header.svelte';
  import { isTauri } from '$lib/native';

  let runId = $state<string | null>(null);
  let workflowPageType = $state<'new' | 'edit' | null>(null);
  let workflowId = $state<string | null>(null);

  // Pages below register their own controls (Save, Abort) into this header.
  const pageHeader = providePageHeader();
  const catalogCrumbs = [{ label: 'Smasher Pipelines', href: '/' }];
  const isCatalog = $derived(!runId && !workflowPageType);
  // LLM settings live in smasher-desktop (Keychain + data dir), so only there.
  const hasSettings = isTauri();
  const pageTitle = $derived(
    workflowPageType === 'new'
      ? 'Create New Workflow'
      : workflowPageType === 'edit'
        ? 'Edit Workflow'
        : runId
          ? `Run ${runId}`
          : 'Smasher Pipelines'
  );
  // The tab title puts the page first so truncated tabs stay readable.
  const documentTitle = $derived(
    workflowPageType === 'new'
      ? 'New Workflow — Smasher'
      : workflowPageType === 'edit'
        ? 'Edit Workflow — Smasher'
        : runId
          ? `Run ${runId} — Smasher`
          : 'Smasher'
  );

  $effect(() => {
    document.title = documentTitle;
  });

  onMount(() => {
    // Set initial path from window.location
    updatePath();

    // Handle navigation via popstate (back/forward buttons)
    window.addEventListener('popstate', updatePath);

    return () => {
      window.removeEventListener('popstate', updatePath);
    };
  });

  function updatePath() {
    const path = window.location.pathname;

    // Extract run ID if path is /runs/{id} -- "new" is excluded since it's
    // not a real run id (the catalog's "Run Workflow" used to link to
    // /runs/new?workflow=..., which nothing consumed and which collided
    // with this exact regex, 404ing every child fetch for a run literally
    // named "new"; that flow now launches the run directly instead of
    // navigating through this route at all, but the exclusion stays as a
    // defensive guard against a stale bookmark/typed URL hitting the same bug).
    const runMatch = path.match(/^\/runs\/(?!new$)([a-z0-9-]+)$/);
    if (runMatch) {
      runId = runMatch[1];
      workflowPageType = null;
      workflowId = null;
      return;
    }

    // Extract workflow page type and ID
    // /workflows/new -> create new
    const newWorkflowMatch = path.match(/^\/workflows\/new$/);
    if (newWorkflowMatch) {
      runId = null;
      workflowPageType = 'new';
      workflowId = null;
      return;
    }

    // /workflows/{id}/edit -> edit existing
    const editWorkflowMatch = path.match(/^\/workflows\/([a-z0-9_-]+)\/edit$/);
    if (editWorkflowMatch) {
      runId = null;
      workflowPageType = 'edit';
      workflowId = editWorkflowMatch[1];
      return;
    }

    // Default to catalog view
    runId = null;
    workflowPageType = null;
    workflowId = null;
  }
</script>

{#snippet newWorkflowAction()}
  <Button href="/workflows/new">New Workflow</Button>
{/snippet}

{#snippet headerActions()}
  {#if isCatalog}
    {@render newWorkflowAction()}
  {:else}
    {@render pageHeader.actions?.()}
  {/if}
  {#if hasSettings}
    <SettingsDialog />
  {/if}
{/snippet}

<div class="min-h-screen bg-muted/40 text-foreground">
  <PageHeader
    title={pageTitle}
    crumbs={isCatalog ? [] : catalogCrumbs}
    actions={isCatalog || hasSettings ? headerActions : pageHeader.actions}
  />

  <main>
    {#if workflowPageType === 'new'}
      <!-- New Workflow Page: the canvas fills everything below the 3.5rem header -->
      <div class="h-[calc(100dvh-3.5rem)]">
        <NewWorkflowPage />
      </div>
    {:else if workflowPageType === 'edit' && workflowId}
      <!-- Edit Workflow Page: the canvas fills everything below the 3.5rem header -->
      <div class="h-[calc(100dvh-3.5rem)]">
        <WorkflowEditorPage {workflowId} />
      </div>
    {:else if runId}
      <!-- Run Detail View: EventLog + QuestionCard -->
      <div class="max-w-6xl mx-auto p-8">
        <div class="mb-8">
          <RunDetail {runId} />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Event Log on the left -->
          <div>
            <h2 class="text-xl font-semibold mb-4">Events</h2>
            <EventLog {runId} />
          </div>

          <!-- Questions on the right -->
          <div>
            <h2 class="text-xl font-semibold mb-4">Questions</h2>
            <QuestionCard {runId} />
          </div>
        </div>

        <div class="mt-8">
          <GalleryGate {runId} />
        </div>

        <div class="mt-8">
          <h2 class="text-xl font-semibold mb-4">Candidates</h2>
          <CandidateGallery {runId} />
        </div>

        <div class="mt-8">
          <h2 class="text-xl font-semibold mb-4">Decision History</h2>
          <DecisionHistory {runId} />
        </div>
      </div>
    {:else}
      <!-- Catalog View: Workflows and Runs stacked in the main column -->
      <div class="mx-auto max-w-6xl px-4 sm:px-8">
        <WorkflowCatalog />
        <RunList />
      </div>
    {/if}
  </main>
</div>

<Toaster />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
