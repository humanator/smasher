<script lang="ts">
  // ABOUTME: The run page's hero: one block that says whether the run needs you, is running, finished, couldn't finish or was stopped
  // ABOUTME: Presentational; RunPage hands it the words from heroModel. aria-live only while running, role=alert only on failure

  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleStopIcon from '@lucide/svelte/icons/circle-stop';
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
  import RefreshIcon from '@lucide/svelte/icons/refresh-cw';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Button } from '$lib/components/ui/button/index.js';
  import { isTauri, revealRunFolder } from '$lib/native';
  import { errorMessage } from '$lib/notify';
  import type { HeroModel } from '$lib/runHero';

  let {
    hero,
    resultsPath = null,
    editHref = null,
    onRunAgain = null,
  }: {
    hero: HeroModel;
    /** The run's working folder; Show Results in Finder needs it. */
    resultsPath?: string | null;
    /** The workflow's editor; null for ad-hoc runs, which have no file to edit. */
    editHref?: string | null;
    /** Opens the Run dialog; null hides Run Again (ad-hoc runs have no workflow to run). */
    onRunAgain?: (() => void) | null;
  } = $props();

  // Finder exists only in the desktop app.
  const native = isTauri();
  let revealError = $state<string | null>(null);

  async function showResults() {
    if (!resultsPath) return;
    revealError = null;
    try {
      await revealRunFolder(resultsPath);
    } catch (err) {
      revealError = `Couldn't show the results in Finder. ${errorMessage(err, 'Something went wrong.')}`;
    }
  }
</script>

{#snippet runAgain(variant: 'default' | 'outline')}
  {#if onRunAgain}
    <Button {variant} onclick={onRunAgain}>
      <RefreshIcon aria-hidden="true" />
      Run Again
    </Button>
  {/if}
{/snippet}

{#if hero.state === 'waiting'}
  <div data-testid="run-hero" data-state="waiting">
    <div class="text-caption font-semibold text-primary-subtle-foreground">{hero.eyebrow}</div>
    <h2 class="text-display m-0 mt-0.5 font-bold text-foreground">{hero.heading}</h2>
  </div>
{:else if hero.state === 'running'}
  <section
    aria-live="polite"
    data-testid="run-hero"
    data-state="running"
    class="rounded-xl border border-border bg-muted px-5 py-[18px]"
  >
    <div class="text-caption font-semibold text-muted-foreground">Now running</div>
    <h2 class="text-display m-0 mt-0.5 font-bold text-foreground">{hero.heading}</h2>
    <p class="text-small mt-1.5 mb-0 text-muted-foreground">{hero.text}</p>
    <div class="relative mt-3.5 h-1 overflow-hidden rounded-full bg-track" aria-hidden="true">
      <span class="run-bar absolute top-0 bottom-0 w-[35%] rounded-full bg-primary"></span>
    </div>
  </section>
{:else if hero.state === 'completed'}
  <section
    data-testid="run-hero"
    data-state="completed"
    class="flex items-start gap-3.5 rounded-xl border border-success-border bg-success-subtle px-5 py-[18px]"
  >
    <span class="flex size-8 flex-none items-center justify-center rounded-full bg-success text-white">
      <CheckIcon class="size-4" strokeWidth={3} aria-hidden="true" />
    </span>
    <div class="min-w-0 flex-1">
      <h2 class="text-display m-0 font-bold text-foreground">{hero.heading}</h2>
      <p class="text-small mt-1 mb-0 text-foreground-secondary">{hero.text}</p>
      {#if native && resultsPath}
        <div class="mt-3 flex flex-col items-start gap-1.5">
          <Button variant="outline" onclick={() => void showResults()}>
            <FolderOpenIcon aria-hidden="true" />
            Show Results in Finder
          </Button>
          {#if revealError}
            <p role="alert" class="text-small m-0 text-destructive">{revealError}</p>
          {/if}
        </div>
      {/if}
    </div>
  </section>
{:else if hero.state === 'failed'}
  <section
    role="alert"
    data-testid="run-hero"
    data-state="failed"
    class="flex items-start gap-3.5 rounded-xl border border-destructive-border bg-destructive-surface px-5 py-[18px]"
  >
    <TriangleAlertIcon class="size-8 flex-none fill-invalid text-white" strokeWidth={2} aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <h2 class="text-display m-0 font-bold text-foreground">{hero.heading}</h2>
      {#if hero.message}
        <pre
          class="text-small mt-2.5 mb-0 rounded-md border border-input bg-card px-2.5 py-2 font-mono whitespace-pre-wrap text-foreground">{hero.message}</pre>
      {/if}
      <h3 class="text-body mt-3.5 mb-1 font-semibold text-foreground">What you can try</h3>
      <ul class="text-body m-0 mb-3.5 list-disc pl-[18px] text-foreground">
        {#each hero.advice as line (line)}
          <li>{line}</li>
        {/each}
      </ul>
      {#if editHref || onRunAgain}
        <div class="flex flex-wrap gap-2">
          {#if editHref}
            <Button href={editHref} variant="outline">Open in Editor</Button>
          {/if}
          {@render runAgain('default')}
        </div>
      {/if}
    </div>
  </section>
{:else}
  <section
    data-testid="run-hero"
    data-state="aborted"
    class="flex items-start gap-3.5 rounded-xl border border-border bg-muted px-5 py-[18px]"
  >
    <CircleStopIcon class="size-8 flex-none text-foreground-tertiary" strokeWidth={1.75} aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <h2 class="text-display m-0 font-bold text-foreground">{hero.heading}</h2>
      <p class="text-small mt-1 mb-0 text-foreground-secondary">{hero.text}</p>
      {#if onRunAgain}
        <div class="mt-3">{@render runAgain('default')}</div>
      {/if}
    </div>
  </section>
{/if}

<style>
  .run-bar {
    animation: run-slide 1.6s linear infinite;
  }
  @keyframes run-slide {
    from {
      left: -35%;
    }
    to {
      left: 100%;
    }
  }
  /* A static bar for people who ask for less motion. */
  @media (prefers-reduced-motion: reduce) {
    .run-bar {
      animation: none;
      left: 0;
    }
  }
</style>
