<script lang="ts">
  // ABOUTME: Root app shell - routes to components based on URL path
  // ABOUTME: Minimal manual routing: catalog at /, run detail at /runs/{id}, workflow editor at /workflows/*

  import './app.css';
  import { onMount } from 'svelte';
  import WorkflowCatalog from './components/dashboard/WorkflowCatalog.svelte';
  import RunForm from './components/dashboard/RunForm.svelte';
  import RunList from './components/dashboard/RunList.svelte';
  import RunDetail from './components/dashboard/RunDetail.svelte';
  import EventLog from './components/dashboard/EventLog.svelte';
  import QuestionCard from './components/dashboard/QuestionCard.svelte';
  import CandidateGallery from './components/dashboard/CandidateGallery.svelte';
  import GalleryGate from './components/dashboard/GalleryGate.svelte';
  import DecisionHistory from './components/dashboard/DecisionHistory.svelte';
  import NewWorkflowPage from './components/dashboard/NewWorkflowPage.svelte';
  import WorkflowEditorPage from './components/dashboard/WorkflowEditorPage.svelte';

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

    // Extract run ID if path is /runs/{id}
    const runMatch = path.match(/^\/runs\/([a-z0-9-]+)$/);
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

<main class="min-h-screen bg-gray-50">
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
        <a href="/" class="text-blue-600 hover:underline">← Back to Catalog</a>
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
    <!-- Catalog View: WorkflowCatalog + RunForm -->
    <div class="max-w-6xl mx-auto p-8">
      <h1 class="text-4xl font-bold mb-8 text-center">Smasher Pipelines</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Available Workflows -->
        <div>
          <h2 class="text-2xl font-semibold mb-4">Available Workflows</h2>
          <WorkflowCatalog />
        </div>

        <!-- Run Form (Manual Submission) -->
        <div>
          <h2 class="text-2xl font-semibold mb-4">Submit Pipeline</h2>
          <RunForm />
        </div>
      </div>

      <div class="mt-8">
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
