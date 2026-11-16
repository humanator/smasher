<script lang="ts">
  // ABOUTME: The Step guide a library pick opens: the kind's About sections and "Settings in this step"
  // ABOUTME: Lists each field's label, Required badge and help (Step name left out), then Add to Canvas (D6)

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { STEP_GUIDE, stepFields } from '$lib/stepFields';
  import { stepKind } from '$lib/stepKinds';

  let { handler, onAdd }: { handler: string; onAdd: (handler: string) => void } = $props();

  const uid = $props.id();
  const about = $derived(stepKind(handler).about);
  const fields = $derived(stepFields(handler).filter((f) => f.attr !== 'label'));
</script>

{#each about as [heading, text] (heading)}
  <div class="mb-4.5">
    <h3 class="m-0 mb-1 text-small font-semibold text-muted-foreground">{heading}</h3>
    <p class="m-0 text-body leading-normal text-foreground">{text}</p>
  </div>
{/each}

<h3 id="{uid}-settings" class="m-0 mt-6 mb-2.5 border-t border-divider pt-4.5 text-small font-semibold text-muted-foreground">
  {STEP_GUIDE.settingsTitle}
</h3>
{#if fields.length}
  <ul class="m-0 list-none p-0" aria-labelledby="{uid}-settings">
    {#each fields as field (field.attr)}
      <li class="mb-3.5">
        <div class="flex items-center gap-2">
          <span class="text-body font-medium text-foreground">{field.label}</span>
          {#if field.required}
            <Badge variant="outline">Required</Badge>
          {/if}
        </div>
        <p class="m-0 mt-0.5 text-body leading-normal text-muted-foreground">{field.help}</p>
      </li>
    {/each}
  </ul>
{:else}
  <p class="m-0 text-body text-muted-foreground">{STEP_GUIDE.noSettings}</p>
{/if}

<Button class="mt-5 w-full" onclick={() => onAdd(handler)}>{STEP_GUIDE.add}</Button>
