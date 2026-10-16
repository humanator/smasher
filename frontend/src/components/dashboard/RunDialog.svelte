<script lang="ts">
  // ABOUTME: The Run sheet: brief, model, extra values and (under Advanced) step overrides for one workflow, then launch it
  // ABOUTME: Validates client-side via buildRunRequest, keeps typed values per workflow, opens the new run

  import { untrack } from 'svelte';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { formatWorkflowName } from '$lib/utils';
  import ModelPicker from '../node-editor/nodeForms/ModelPicker.svelte';
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
  let advancedOpen = $state(false);
  // The picker reads its starting values once, so restoring a draft remounts it.
  let pickerKey = $state(0);

  // Each opening restores the workflow's last values, but never its old errors.
  $effect(() => {
    if (!open) return;
    const id = workflow.id;
    untrack(() => {
      values = getDraft(id);
      // Overrides from a draft are never hidden behind the closed disclosure.
      advancedOpen = values.nodeOverrides.trim() !== '';
      pickerKey++;
      errors = {};
      serverError = null;
    });
  });

  function edited(field: keyof RunFormValues) {
    saveDraft(workflow.id, values);
    if (field === 'variables' || field === 'nodeOverrides') delete errors[field];
    serverError = null;
  }

  function pickModel(patch: { provider?: string; model?: string }) {
    if ('provider' in patch) values.provider = patch.provider ?? '';
    if ('model' in patch) values.model = patch.model ?? '';
    edited('model');
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
      <Dialog.Title>Run “{formatWorkflowName(workflow.name)}”</Dialog.Title>
      <Dialog.Description>
        Everything here is optional. Leave a field blank and the workflow uses its usual behaviour.
      </Dialog.Description>
    </Dialog.Header>

    <form class="grid gap-4" onsubmit={submit}>
      <div class="grid gap-1.5">
        <Label for="run-brief">Brief</Label>
        <Textarea
          id="run-brief"
          bind:value={values.brief}
          oninput={() => edited('brief')}
          placeholder="e.g. Three concepts for a mobile checkout that feels calmer"
          rows={3}
          aria-describedby="run-brief-hint"
        />
        <p id="run-brief-hint" class="text-xs text-muted-foreground">
          A short note on what this run is for. It is passed to the workflow as a value called “brief”, so steps and
          prompts can use it.
        </p>
      </div>

      {#key pickerKey}
        <ModelPicker
          idPrefix="run"
          provider={values.provider}
          model={values.model}
          blankLabel="Default model"
          modelHint="Which AI model to use for this run. Leave blank to use your default model from Settings."
          onChange={pickModel}
        />
      {/key}

      <div class="grid gap-1.5">
        <Label for="run-variables">Extra values</Label>
        <Textarea
          id="run-variables"
          bind:value={values.variables}
          oninput={() => edited('variables')}
          placeholder="audience=first-time buyers"
          rows={4}
          spellcheck={false}
          class="font-mono text-xs"
          aria-invalid={errors.variables ? true : undefined}
          aria-describedby={errors.variables ? 'run-variables-hint run-variables-error' : 'run-variables-hint'}
        />
        {#if errors.variables}
          <p id="run-variables-error" class="text-sm text-destructive">{errors.variables}</p>
        {/if}
        <p id="run-variables-hint" class="text-xs text-muted-foreground">
          Extra information to hand to the workflow, one per line as name=value. Steps and rules can read each one by
          its name. A brief written above takes priority over a brief= line here.
        </p>
      </div>

      <div class="grid gap-3">
        <button
          type="button"
          class="flex w-fit items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
          aria-expanded={advancedOpen}
          aria-controls="run-advanced"
          onclick={() => (advancedOpen = !advancedOpen)}
        >
          <ChevronRightIcon class="size-3 transition-transform {advancedOpen ? 'rotate-90' : ''}" aria-hidden="true" />
          Advanced: change the model for individual steps
        </button>
        {#if advancedOpen}
          <div id="run-advanced" class="grid gap-1.5">
            <Label for="run-node-overrides">Step overrides (JSON)</Label>
            <Textarea
              id="run-node-overrides"
              bind:value={values.nodeOverrides}
              oninput={() => edited('nodeOverrides')}
              placeholder={'{"draft_concepts": {"model": "claude-opus-4-20250514"}}'}
              rows={3}
              spellcheck={false}
              class="font-mono text-xs"
              aria-invalid={errors.nodeOverrides ? true : undefined}
              aria-describedby={errors.nodeOverrides
                ? 'run-node-overrides-hint run-node-overrides-error'
                : 'run-node-overrides-hint'}
            />
            {#if errors.nodeOverrides}
              <p id="run-node-overrides-error" class="text-sm text-destructive">{errors.nodeOverrides}</p>
            {/if}
            <p id="run-node-overrides-hint" class="text-xs text-muted-foreground">
              Swap the model or provider for particular steps, for this run only, without editing the workflow. Use the
              step’s ID from the workflow file, not its name on the canvas.
            </p>
          </div>
        {/if}
      </div>

      {#if serverError}
        <p role="alert" class="text-sm text-destructive">{serverError}</p>
      {/if}

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={starting}>{starting ? 'Starting…' : 'Start Run'}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
