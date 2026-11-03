<script lang="ts">
  // ABOUTME: One inspector field drawn from a FieldSpec: label, Required, More about, help, control, Try chips, error
  // ABOUTME: Controls are text, textarea, code, choice (radios in a fieldset), switch (On/Off) and model (a slot)

  import type { Snippet } from 'svelte';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as FieldUi from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import type { FieldSpec } from '$lib/stepFields';

  // `value` (text, textarea, code, choice) and `checked` (switch) are bindable,
  // so a form can either bind them or seed them and listen to the callbacks.
  // `children` is the control for a 'model' field, e.g. ModelPicker.
  let {
    spec,
    value = $bindable(''),
    checked = $bindable(false),
    oninput,
    onCheckedChange,
    error = '',
    testId,
    children,
  }: {
    spec: FieldSpec;
    value?: string;
    checked?: boolean;
    oninput?: (value: string) => void;
    onCheckedChange?: (checked: boolean) => void;
    /** Shown under the control; marks it aria-invalid. */
    error?: string;
    /** data-testid for the control (the fieldset for a choice). */
    testId?: string;
    children?: Snippet;
  } = $props();

  const uid = $props.id();
  const controlId = `${uid}-control`;
  const labelId = `${uid}-label`;
  const helpId = `${uid}-help`;
  const errorId = `${uid}-error`;
  const moreId = `${uid}-more`;

  let moreOpen = $state(false);
  const describedBy = $derived(error ? `${helpId} ${errorId}` : helpId);
  const invalid = $derived(error ? true : undefined);

  function setValue(next: string) {
    value = next;
    oninput?.(next);
  }

  function setChecked(next: boolean) {
    checked = next;
    onCheckedChange?.(next);
  }
</script>

{#snippet header(asLegend: boolean)}
  <!-- A choice field's label is its fieldset's legend; the fieldset is named by the label text alone. -->
  <svelte:element this={asLegend ? 'legend' : 'div'} class="mb-1 flex w-full items-center gap-2">
    {#if spec.control === 'choice' || spec.control === 'model'}
      <span id={labelId} class="text-body font-medium text-foreground">{spec.label}</span>
    {:else}
      <FieldUi.Label for={controlId}>{spec.label}</FieldUi.Label>
    {/if}
    {#if spec.required}
      <Badge variant="outline">Required</Badge>
    {/if}
    {#if spec.more?.length}
      <Button
        class="ml-auto"
        variant={moreOpen ? 'default' : 'outline'}
        size="icon-xs"
        aria-label="More about {spec.label}"
        aria-expanded={moreOpen}
        aria-controls={moreOpen ? moreId : undefined}
        onclick={() => (moreOpen = !moreOpen)}
      >
        <CircleHelpIcon aria-hidden="true" />
      </Button>
    {/if}
  </svelte:element>
  <p id={helpId} class="m-0 mb-2 text-small text-muted-foreground">{spec.help}</p>
{/snippet}

{#snippet details()}
  {#if spec.tryChips?.length}
    <div class="mt-2 flex flex-wrap gap-1.5">
      <span class="self-center text-small text-muted-foreground">Try:</span>
      {#each spec.tryChips as chip (chip)}
        <Button variant="outline" size="xs" onclick={() => setValue(chip)}>{chip}</Button>
      {/each}
    </div>
  {/if}
  {#if error}
    <FieldUi.Error id={errorId} class="mt-1.5">{error}</FieldUi.Error>
  {/if}
  {#if moreOpen && spec.more?.length}
    <div id={moreId} class="mt-2.5 rounded-lg bg-card px-3.5 py-3">
      {#each spec.more as row (row.title)}
        <div class="mb-2 last:mb-0">
          <div class="text-caption font-semibold text-muted-foreground">{row.title}</div>
          <div class="mt-0.5 text-body text-foreground [overflow-wrap:anywhere]">{row.text}</div>
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

{#if spec.control === 'choice'}
  <fieldset
    class="m-0 min-w-0 border-0 p-0"
    aria-labelledby={labelId}
    aria-describedby={describedBy}
    data-testid={testId}
  >
    {@render header(true)}
    <div class="flex flex-col gap-2">
      {#each spec.options ?? [] as option (option.value)}
        <label class="flex items-start gap-2">
          <input
            type="radio"
            class="mt-0.5 size-3.5 flex-none accent-primary"
            name={uid}
            value={option.value}
            checked={value === option.value}
            data-testid={testId ? `${testId}-${option.value}` : undefined}
            onchange={() => setValue(option.value)}
          />
          <span class="block">
            <span class="block text-body font-semibold text-foreground">{option.title}</span>
            <span class="mt-px block text-small text-muted-foreground">{option.desc}</span>
          </span>
        </label>
      {/each}
    </div>
    {@render details()}
  </fieldset>
{:else}
  <div data-slot="inspector-field">
    {@render header(false)}
    {#if spec.control === 'text'}
      <Input
        id={controlId}
        type="text"
        data-testid={testId}
        placeholder={spec.placeholder}
        aria-required={spec.required || undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        {value}
        oninput={(event) => setValue((event.target as HTMLInputElement).value)}
      />
    {:else if spec.control === 'textarea' || spec.control === 'code'}
      <Textarea
        id={controlId}
        mono={spec.control === 'code'}
        rows={spec.rows ?? 3}
        data-testid={testId}
        placeholder={spec.placeholder}
        aria-required={spec.required || undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        {value}
        oninput={(event) => setValue((event.target as HTMLTextAreaElement).value)}
      />
    {:else if spec.control === 'switch'}
      <div class="flex items-center gap-2.5">
        <Switch
          id={controlId}
          data-testid={testId}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {checked}
          onCheckedChange={setChecked}
        />
        <span class="text-body text-foreground" aria-hidden="true">{checked ? 'On' : 'Off'}</span>
      </div>
    {:else}
      <div role="group" aria-labelledby={labelId} aria-describedby={describedBy}>
        {@render children?.()}
      </div>
    {/if}
    {@render details()}
  </div>
{/if}
