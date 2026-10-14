<script lang="ts">
  // ABOUTME: 52px unified toolbar for every page - back link, page title with subtitle, and page-level controls
  // ABOUTME: Presentational; App decides the title/back/subtitle and which actions snippet to render

  import type { Snippet } from 'svelte';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import { Button } from '$lib/components/ui/button/index.js';

  let {
    title,
    subtitle = null,
    back = null,
    actions,
  }: {
    title: string;
    /** Backtick-quoted fragments are set in mono. */
    subtitle?: string | null;
    back?: { label: string; href: string } | null;
    actions?: Snippet | null;
  } = $props();

  // Even indexes are plain text, odd indexes sit between backticks.
  const subtitleParts = $derived(subtitle ? subtitle.split('`') : []);
</script>

<header
  class="sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70"
>
  {#if back}
    <Button href={back.href} variant="ghost" size="icon" aria-label={`Back to ${back.label}`}>
      <ChevronLeftIcon aria-hidden="true" />
    </Button>
  {/if}
  <div class="flex min-w-0 flex-col justify-center">
    <h1 class="m-0 truncate text-[15px] leading-tight font-bold text-foreground">{title}</h1>
    {#if subtitle}
      <p data-testid="toolbar-subtitle" class="m-0 truncate text-[11px] leading-tight text-muted-foreground">
        {#each subtitleParts as part, i (i)}{#if i % 2 === 1}<code class="font-mono">{part}</code>{:else}{part}{/if}{/each}
      </p>
    {/if}
  </div>
  {#if actions}
    <div class="ml-auto flex shrink-0 items-center gap-2" data-testid="page-header-actions">
      {@render actions()}
    </div>
  {/if}
</header>
