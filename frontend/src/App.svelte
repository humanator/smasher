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
  import { Button } from '$lib/components/ui/button/index.js';

  let runId = $state<string | null>(null);
  let workflowPageType = $state<'new' | 'edit' | null>(null);
  let workflowId = $state<string | null>(null);

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

<main class="min-h-screen bg-muted/40 text-foreground">
  {#if workflowPageType === 'new'}
    <!-- New Workflow Page -->
    <div class="max-w-7xl mx-auto">
      <NewWorkflowPage />
    </div>
  {:else if workflowPageType === 'edit' && workflowId}
    <!-- Edit Workflow Page -->
    <div class="max-w-7xl mx-auto">
      <WorkflowEditorPage {workflowId} />
    </div>
  {:else if runId}
    <!-- Run Detail View: EventLog + QuestionCard -->
    <div class="max-w-6xl mx-auto p-8">
      <div class="mb-8">
        <a href="/" class="text-primary hover:underline">← Back to Catalog</a>
        <h1 class="text-3xl font-bold mt-4">Pipeline Run: {runId}</h1>
      </div>

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
    <!-- Catalog View: header, then Workflows and Runs stacked in the main column -->
    <div class="min-h-screen">
      <header class="flex items-center justify-between gap-4 px-5 py-3">
        <h1 class="text-3xl font-bold">Smasher Pipelines</h1>
        <Button href="/workflows/new" size="lg" class="px-11">New Workflow</Button>
      </header>

      <div class="mx-auto max-w-6xl px-4 sm:px-8">
        <WorkflowCatalog />
        <RunList />
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
