<script lang="ts">
  // ABOUTME: 52px unified toolbar for every page - back link, page title with subtitle, and page-level controls
  // ABOUTME: Presentational; App decides the title/back/subtitle and which actions snippet to render

  import type { Snippet } from 'svelte';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';

  let {
    title,
    subtitle = null,
    subtitleDot = null,
    subtitleLive = false,
    back = null,
    leading,
    titleAccessory,
    actions,
  }: {
    title: string;
    /** Backtick-quoted fragments are set in mono. */
    subtitle?: string | null;
    /** A status dot ahead of the subtitle. */
    subtitleDot?: 'success' | 'warning' | null;
    /** Keeps the subtitle in the page, even when empty, and announces its changes. */
    subtitleLive?: boolean;
    back?: { label: string; href: string } | null;
    /** Controls ahead of the back button, e.g. the phone-width sidebar button. */
    leading?: Snippet | null;
    /** Sits on the title line after the h1, e.g. the Run page's status badge. */
    titleAccessory?: Snippet | null;
    actions?: Snippet | null;
  } = $props();

  // Even indexes are plain text, odd indexes sit between backticks.
  const subtitleParts = $derived(subtitle ? subtitle.split('`') : []);
</script>

<header
  data-tauri-drag-region
  class={cn(
    'bg-background sticky top-0 z-10 flex h-toolbar shrink-0 items-center gap-2 border-b border-border pr-3',
    back ? 'pl-3' : 'pl-5'
  )}
>
  {#if leading}
    {@render leading()}
  {/if}
  {#if back}
    <Button href={back.href} variant="ghost" size="icon" aria-label={`Back to ${back.label}`}>
      <ChevronLeftIcon aria-hidden="true" />
    </Button>
  {/if}
  <div class={cn('flex min-w-0 flex-col justify-center', back && 'pl-1')}>
    <div class="flex min-w-0 items-center gap-2">
      <h1 class="text-heading m-0 truncate font-bold text-foreground">{title}</h1>
      {#if titleAccessory}
        {@render titleAccessory()}
      {/if}
    </div>
    {#if subtitle || subtitleLive}
      <p
        data-testid="toolbar-subtitle"
        class="text-caption m-0 flex min-w-0 items-center gap-1.25 text-muted-foreground"
        aria-live={subtitleLive ? 'polite' : undefined}
      >
        {#if subtitle && subtitleDot}<span
            aria-hidden="true"
            class={cn('size-1.5 shrink-0 rounded-full', subtitleDot === 'success' ? 'bg-success' : 'bg-warning')}
          ></span>{/if}<span class="truncate"
          >{#each subtitleParts as part, i (i)}{#if i % 2 === 1}<code class="font-mono">{part}</code>{:else}{part}{/if}{/each}</span
        >
      </p>
    {/if}
  </div>
  {#if actions}
    <div class="ml-auto flex shrink-0 items-center gap-1.5" data-testid="page-header-actions">
      {@render actions()}
    </div>
  {/if}
</header>
