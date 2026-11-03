<script lang="ts" module>
  /** What the inspector is showing; the canvas works it out from its selection. */
  export type InspectorView =
    | { kind: 'none' }
    | { kind: 'node'; handler: string; title: string }
    | { kind: 'edge'; title: string }
    | { kind: 'guide'; handler: string };
</script>

<script lang="ts">
  // ABOUTME: The editor's right-hand inspector: Nothing selected, a step, a connection, or a Step guide
  // ABOUTME: Header (chip, kicker, title, Close), Settings/About tabs and the Delete footer; the form comes in as `settings`

  import type { Snippet } from 'svelte';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { CONNECTION_ABOUT, NOTHING_SELECTED, type RichText } from '$lib/stepFields';
  import { stepKind, type AboutSection } from '$lib/stepKinds';

  let {
    view,
    onClose,
    onDelete,
    settings,
  }: {
    view: InspectorView;
    onClose: () => void;
    onDelete: () => void;
    /** The Settings tab's content for a step or connection. */
    settings?: Snippet;
  } = $props();

  let tab = $state('settings');

  const header = $derived.by(() => {
    if (view.kind === 'edge') {
      return {
        ink: 'var(--kind-flow-ink)',
        tint: 'var(--kind-flow-tint)',
        icon: ArrowRightIcon,
        kicker: 'Connection',
        title: view.title,
        sub: '',
        noun: 'connection',
        about: CONNECTION_ABOUT,
      };
    }
    if (view.kind === 'none') return null;
    const kind = stepKind(view.handler);
    return {
      ink: kind.ink,
      tint: kind.tint,
      icon: kind.icon,
      kicker: view.kind === 'guide' ? 'Step guide' : kind.plain,
      title: view.kind === 'guide' ? kind.plain : view.title,
      sub: `Also called “${kind.tech}” in workflow files.`,
      noun: 'step',
      about: kind.about,
    };
  });

  const testId = $derived(
    { none: 'nothing-selected', node: 'node-inspector', edge: 'edge-inspector', guide: 'step-guide' }[view.kind]
  );
</script>

{#snippet rich(text: RichText)}
  {#each text as part, i (i)}
    {#if typeof part === 'string'}{part}{:else if 'strong' in part}<strong>{part.strong}</strong>{:else}<code>{part.code}</code>{/if}
  {/each}
{/snippet}

{#snippet aboutSections(sections: AboutSection[])}
  {#each sections as [heading, text] (heading)}
    <div class="mb-4.5">
      <h3 class="m-0 mb-1 text-small font-semibold text-muted-foreground">{heading}</h3>
      <p class="m-0 text-body leading-normal text-foreground">{text}</p>
    </div>
  {/each}
{/snippet}

<aside
  aria-label="Inspector"
  class="flex min-h-0 w-[360px] flex-none flex-col border-l border-border bg-muted"
  data-testid={testId}
>
  {#if !header}
    <div class="px-5 py-6">
      <h2 class="m-0 mb-1.5 text-heading font-bold text-foreground">{NOTHING_SELECTED.heading}</h2>
      <p class="m-0 mb-4.5 text-small leading-normal text-muted-foreground">{NOTHING_SELECTED.text}</p>
      <h3 class="m-0 mb-2 text-caption font-semibold text-muted-foreground">{NOTHING_SELECTED.stepsTitle}</h3>
      <ol class="m-0 list-decimal rounded-lg border border-border bg-card py-3 pr-3.5 pl-8 text-body leading-normal text-foreground">
        {#each NOTHING_SELECTED.steps as step, i (i)}
          <li class="mb-1.5 last:mb-0">{@render rich(step)}</li>
        {/each}
      </ol>
    </div>
  {:else}
    <Tabs.Root bind:value={tab} class="min-h-0 flex-1 gap-0">
      <div class="flex-none border-b border-border px-4 pt-3.5 pb-3">
        <div class="flex items-start gap-2.5">
          <span class="inspector-chip grid size-8 flex-none place-items-center rounded-md" style:--ink={header.ink} style:--tint={header.tint}>
            <header.icon class="size-4.25" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="inspector-kicker text-caption font-semibold" style:--ink={header.ink}>{header.kicker}</div>
            <h2
              class="m-0 mt-px text-heading leading-snug font-bold text-foreground [overflow-wrap:anywhere]"
              data-testid={view.kind === 'guide' ? undefined : `${view.kind}-inspector-title`}
            >
              {header.title}
            </h2>
            {#if header.sub}
              <p class="m-0 mt-0.5 text-caption text-muted-foreground">{header.sub}</p>
            {/if}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close inspector" onclick={onClose}>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
        {#if view.kind !== 'guide'}
          <Tabs.List fullWidth aria-label="Inspector sections" class="mt-3">
            <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
            <Tabs.Trigger value="about">About this {header.noun}</Tabs.Trigger>
          </Tabs.List>
        {/if}
      </div>
      <div class="min-h-0 flex-1 overflow-auto p-5">
        {#if view.kind === 'guide'}
          <!-- Task 16 fills in the Step guide's About sections and settings list. -->
        {:else}
          <!-- Only the open tab's content is in the page, so the form remounts on Settings. -->
          <Tabs.Content value="settings">
            {#if tab === 'settings'}{@render settings?.()}{/if}
          </Tabs.Content>
          <Tabs.Content value="about">
            {#if tab === 'about'}{@render aboutSections(header.about)}{/if}
          </Tabs.Content>
        {/if}
      </div>
      {#if view.kind === 'node' || view.kind === 'edge'}
        <div class="flex-none border-t border-border px-4 py-3">
          <Button variant="ghost" class="text-destructive hover:bg-destructive-subtle hover:text-destructive" onclick={onDelete}>
            {view.kind === 'node' ? 'Delete Step' : 'Delete Connection'}
          </Button>
        </div>
      {/if}
    </Tabs.Root>
  {/if}
</aside>

<style>
  .inspector-chip {
    background: var(--tint);
    color: var(--ink);
  }

  .inspector-kicker {
    color: var(--ink);
  }
</style>
