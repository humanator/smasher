<script lang="ts">
  // ABOUTME: Run-launch dialog: model, variables, brief and node overrides for one workflow, then launch it
  // ABOUTME: Validates client-side via buildRunRequest, keeps typed values per workflow, opens the new run

  import { untrack } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { formatWorkflowName } from '$lib/utils';
  import * as runsApi from '../../lib/api/runs';
  import { errorMessage } from '../../lib/notify';
  import { buildRunRequest, type RunFormErrors, type RunFormValues } from '../../lib/runRequest';
  import { getDraft, saveDraft } from '../../lib/runDrafts';

  let {
    workflow,
    open = $bindable(false),
  }: { workflow: { id: string; name: string }; open?: boolean } = $props();

  let values = $state<RunFormValues>({ model: '', variables: '', brief: '', nodeOverrides: '' });
  let errors = $state<RunFormErrors>({});
  let serverError = $state<string | null>(null);
  let starting = $state(false);

  // Each opening restores the workflow's last values, but never its old errors.
  $effect(() => {
    if (!open) return;
    const id = workflow.id;
    untrack(() => {
      values = getDraft(id);
      errors = {};
      serverError = null;
    });
  });

  function edited(field: keyof RunFormValues) {
    saveDraft(workflow.id, values);
    if (field === 'variables' || field === 'nodeOverrides') delete errors[field];
    serverError = null;
  }

  // A launch isn't aborted when the dialog closes: the run already exists on
  // the server, so it still opens rather than being orphaned out of sight.
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const result = buildRunRequest(values);
    if (!result.ok) {
      errors = result.errors;
      return;
    }
    starting = true;
    serverError = null;
    try {
      const response = await runsApi.runWorkflow(workflow.id, result.request);
      window.location.href = `/runs/${response.run_id}`;
    } catch (err) {
      serverError = errorMessage(err, 'Failed to start run');
      starting = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Run {formatWorkflowName(workflow.name)}</Dialog.Title>
      <Dialog.Description>Leave Model blank to use the server's default.</Dialog.Description>
    </Dialog.Header>

    <form class="grid gap-4" onsubmit={submit}>
      <div class="grid gap-2">
        <Label for="run-model">Model</Label>
        <Input
          id="run-model"
          bind:value={values.model}
          oninput={() => edited('model')}
          placeholder="(default)"
          autocomplete="off"
          spellcheck={false}
        />
      </div>

      <div class="grid gap-2">
        <Label for="run-variables">Variables</Label>
        <Textarea
          id="run-variables"
          bind:value={values.variables}
          oninput={() => edited('variables')}
          placeholder="key=value"
          rows={4}
          spellcheck={false}
          class="font-mono text-xs"
          aria-invalid={errors.variables ? true : undefined}
          aria-describedby={errors.variables ? 'run-variables-error' : undefined}
        />
        {#if errors.variables}
          <p id="run-variables-error" class="text-sm text-destructive">{errors.variables}</p>
        {/if}
      </div>

      <div class="grid gap-2">
        <Label for="run-brief">Brief</Label>
        <Textarea
          id="run-brief"
          bind:value={values.brief}
          oninput={() => edited('brief')}
          rows={3}
        />
      </div>

      <div class="grid gap-2">
        <Label for="run-node-overrides">Node Overrides (JSON)</Label>
        <Textarea
          id="run-node-overrides"
          bind:value={values.nodeOverrides}
          oninput={() => edited('nodeOverrides')}
          placeholder={'{"node_id": {"model": "..."}}'}
          rows={2}
          spellcheck={false}
          class="font-mono text-xs"
          aria-invalid={errors.nodeOverrides ? true : undefined}
          aria-describedby={errors.nodeOverrides ? 'run-node-overrides-error' : undefined}
        />
        {#if errors.nodeOverrides}
          <p id="run-node-overrides-error" class="text-sm text-destructive">
            {errors.nodeOverrides}
          </p>
        {/if}
      </div>

      {#if serverError}
        <p role="alert" class="text-sm text-destructive">{serverError}</p>
      {/if}

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={starting}>{starting ? 'Starting…' : 'Run'}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
