<script lang="ts">
  // ABOUTME: The run panel's Activity tab: the run's events newest first, as Key moments or Everything
  // ABOUTME: Keeps the old event log's scroll anchoring

  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import { formatEvent, type EventLevel, type EventTone, type StepLabels } from '../../lib/eventFormat';
  import type { PipelineEvent } from '../../lib/api/events';

  let {
    events,
    labels,
  }: {
    /** In arrival order; RunPage owns the one stream that fills them. */
    events: readonly PipelineEvent[];
    /** Step names by node id, so lines say "Draft three concepts" rather than "draft". */
    labels?: StepLabels;
  } = $props();

  const HELP: Record<EventLevel, string> = {
    key: 'The run starting and finishing, each step, questions for you and loops.',
    all: 'Everything above, plus every tool call, agent message and token count.',
  };

  // Label colour and dot colour per tone; tinted lines also get a background.
  const TONE_CLASSES: Record<EventTone, string> = {
    blue: '[&_.event-label]:text-info-foreground [&_[data-dot]]:bg-info',
    green: '[&_.event-label]:text-success-foreground [&_[data-dot]]:bg-success',
    red: '[&_.event-label]:text-destructive [&_[data-dot]]:bg-invalid',
    amber: '[&_.event-label]:text-warning-foreground [&_[data-dot]]:bg-warning',
    purple: '[&_.event-label]:text-primary-subtle-foreground [&_[data-dot]]:bg-primary',
    muted: '[&_.event-label]:text-muted-foreground [&_[data-dot]]:bg-border-strong',
  };
  const TINT_CLASSES: Record<EventTone, string> = {
    blue: 'bg-info/10',
    green: 'bg-success-subtle',
    red: 'bg-destructive-surface',
    amber: 'bg-warning/10',
    purple: 'bg-primary-subtle',
    muted: 'bg-muted',
  };

  let level = $state<EventLevel>('key');

  // Newest first. The position in the arrival order is the key: events only ever append.
  const lines = $derived(
    events
      .map((event, seq) => ({ seq, event, line: formatEvent(event, labels) }))
      .filter(({ line }) => level === 'all' || line.level === 'key')
      .reverse()
  );

  function choose(value: string) {
    // Pressing the chosen one again would clear a single-choice group; there is always one choice.
    if (value === 'key' || value === 'all') level = value;
  }

  // Following new events. Newest is at the top: while the box is scrolled to
  // the top it stays there; otherwise the scroll moves by the height the new
  // lines added, so what's being read doesn't shift. Done by hand, so it behaves
  // the same everywhere; the box sets overflow-anchor: none so the browser's own
  // anchoring doesn't apply the shift a second time.
  let logBox: HTMLDivElement | undefined = $state();
  let atTop = true;
  let heightBefore = 0;

  $effect.pre(() => {
    void lines.length;
    if (logBox) heightBefore = logBox.scrollHeight;
  });

  $effect(() => {
    void lines.length;
    if (!logBox) return;
    if (atTop) logBox.scrollTop = 0;
    else logBox.scrollTop += logBox.scrollHeight - heightBefore;
  });
</script>

<div class="flex h-full min-h-0 flex-col gap-2.5">
  <div class="flex shrink-0 flex-col gap-1.5">
    <ToggleGroup.Root
      type="single"
      variant="default"
      size="sm"
      aria-label="Show in the activity log"
      bind:value={() => level, choose}
    >
      <ToggleGroup.Item value="key">Key moments</ToggleGroup.Item>
      <ToggleGroup.Item value="all">Everything</ToggleGroup.Item>
    </ToggleGroup.Root>
    <p class="m-0 text-xs text-muted-foreground">{HELP[level]}</p>
  </div>

  <div bind:this={logBox} onscroll={() => (atTop = (logBox?.scrollTop ?? 0) <= 8)} class="event-log min-h-0 flex-1 overflow-y-auto [overflow-anchor:none]">
    {#if lines.length === 0}
      <p class="m-0 py-6 text-center text-body text-muted-foreground">Waiting for events...</p>
    {:else}
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        {#each lines as { seq, event, line } (seq)}
          <li
            class={[
              'event-item flex flex-col gap-0.5 rounded-md px-2 py-1.5',
              TONE_CLASSES[line.tone],
              line.tinted && TINT_CLASSES[line.tone],
              line.agent ? 'ml-5 text-xs' : 'text-sm',
              line.faded && 'opacity-60',
            ]}
            data-tone={line.tone}
            data-agent={line.agent}
            data-faded={line.faded}
          >
            <div class="flex items-center gap-1.5">
              <span data-dot aria-hidden="true" class="size-2 shrink-0 rounded-full"></span>
              <span class="event-label text-xs font-semibold">{line.label}</span>
              <time class="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums" datetime={event.timestamp}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </time>
            </div>
            {#if line.detail}
              <span class={['break-words text-foreground', line.italic && 'italic']}>{line.detail}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
