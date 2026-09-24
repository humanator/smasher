<script lang="ts">
  // ABOUTME: Top bar for every page - breadcrumb trail, page title, and page-level controls
  // ABOUTME: Presentational; App decides the title/crumbs and which actions snippet to render

  import type { Snippet } from 'svelte';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

  let {
    title,
    crumbs = [],
    actions,
  }: {
    title: string;
    crumbs?: { label: string; href: string }[];
    actions?: Snippet | null;
  } = $props();
</script>

<header
  class="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  {#if crumbs.length > 0}
    <Breadcrumb.Root>
      <Breadcrumb.List>
        {#each crumbs as crumb (crumb.href)}
          <Breadcrumb.Item>
            <Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
        {/each}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  {/if}
  <h1 class="m-0 truncate text-lg font-semibold text-foreground">{title}</h1>
  {#if actions}
    <div class="ml-auto flex shrink-0 items-center gap-2" data-testid="page-header-actions">
      {@render actions()}
    </div>
  {/if}
</header>
