<script lang="ts">
  // ABOUTME: The runs table: run id linking to /runs/{id}, workflow name, status and start time
  // ABOUTME: Shared by the run list and the workflow detail page's run history; ondelete adds row checkboxes and delete

  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { RunSummary } from '../../lib/api/runs';
  import { isActive } from '$lib/runStatus';
  import * as Table from '$lib/components/ui/table/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import StatusBadge from './StatusBadge.svelte';

  let {
    runs,
    ondelete,
  }: {
    runs: RunSummary[];
    /** Deletes the given runs; when set, rows get checkboxes and a delete action. */
    ondelete?: (ids: string[]) => Promise<void>;
  } = $props();

  // Picked ids; ones that vanish from `runs` or start running drop out of `selectedIds`.
  let picked: string[] = $state([]);
  // The ids awaiting confirmation; the dialog is open while this is set.
  let pending: string[] | null = $state(null);
  let deleting = $state(false);
  let deleteError: string | null = $state(null);

  const finishedIds = $derived(runs.filter((run) => !isActive(run.status)).map((run) => run.id));
  const selectedIds = $derived(finishedIds.filter((id) => picked.includes(id)));
  const allSelected = $derived(finishedIds.length > 0 && selectedIds.length === finishedIds.length);

  function setPicked(id: string, checked: boolean) {
    picked = checked ? [...picked, id] : picked.filter((p) => p !== id);
  }

  function confirmDelete(ids: string[]) {
    deleteError = null;
    pending = ids;
  }

  async function runDelete() {
    if (!pending || !ondelete) return;
    deleting = true;
    deleteError = null;
    try {
      await ondelete(pending);
      picked = picked.filter((id) => !pending?.includes(id));
      pending = null;
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Failed to delete runs';
    } finally {
      deleting = false;
    }
  }
</script>

{#if ondelete}
  <div class="mb-3 flex justify-end">
    <Button
      variant="destructive"
      size="sm"
      disabled={selectedIds.length === 0}
      onclick={() => confirmDelete(selectedIds)}
    >
      <Trash2Icon />
      Delete selected ({selectedIds.length})
    </Button>
  </div>
{/if}

<div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
  <Table.Root>
    <Table.Header class="bg-muted/50">
      <Table.Row>
        {#if ondelete}
          <Table.Head class="w-10">
            <Checkbox
              aria-label="Select all finished runs"
              checked={allSelected}
              indeterminate={selectedIds.length > 0 && !allSelected}
              disabled={finishedIds.length === 0}
              onCheckedChange={(checked) => (picked = checked ? [...finishedIds] : [])}
            />
          </Table.Head>
        {/if}
        <Table.Head class="text-muted-foreground">Run</Table.Head>
        <Table.Head class="text-muted-foreground">Workflow</Table.Head>
        <Table.Head class="text-muted-foreground">Status</Table.Head>
        <Table.Head class="text-muted-foreground">Started</Table.Head>
        {#if ondelete}
          <Table.Head class="w-10"><span class="sr-only">Actions</span></Table.Head>
        {/if}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each runs as run (run.id)}
        <Table.Row>
          {#if ondelete}
            <Table.Cell>
              <Checkbox
                aria-label="Select run {run.id}"
                checked={selectedIds.includes(run.id)}
                disabled={isActive(run.status)}
                onCheckedChange={(checked) => setPicked(run.id, checked)}
              />
            </Table.Cell>
          {/if}
          <Table.Cell>
            <a href="/runs/{run.id}" class="font-mono text-primary hover:underline">{run.id}</a>
          </Table.Cell>
          <Table.Cell>
            {#if run.graph_name?.trim()}
              {run.graph_name}
            {:else}
              <span class="text-muted-foreground">unnamed</span>
            {/if}
          </Table.Cell>
          <Table.Cell><StatusBadge status={run.status} /></Table.Cell>
          <Table.Cell>{new Date(run.started_at).toLocaleString()}</Table.Cell>
          {#if ondelete}
            <Table.Cell>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete run {run.id}"
                title={isActive(run.status) ? 'Cancel the run before deleting it' : 'Delete run'}
                disabled={isActive(run.status)}
                onclick={() => confirmDelete([run.id])}
              >
                <Trash2Icon />
              </Button>
            </Table.Cell>
          {/if}
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

{#if ondelete}
  <Dialog.Root
    open={pending !== null}
    onOpenChange={(open) => {
      if (!open && !deleting) pending = null;
    }}
  >
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>
          Delete {pending?.length ?? 0} {pending?.length === 1 ? 'run' : 'runs'}?
        </Dialog.Title>
        <Dialog.Description>
          This permanently deletes {pending?.length === 1 ? 'the run' : 'these runs'} and all
          {pending?.length === 1 ? 'its' : 'their'} artifacts. It can't be undone.
        </Dialog.Description>
      </Dialog.Header>
      {#if deleteError}
        <p class="text-sm text-destructive" role="alert">{deleteError}</p>
      {/if}
      <Dialog.Footer>
        <Button variant="outline" disabled={deleting} onclick={() => (pending = null)}>Cancel</Button>
        <Button variant="destructive" disabled={deleting} onclick={runDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
