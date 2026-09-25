<script lang="ts">
  // ABOUTME: Live event stream view - displays pipeline events in real-time
  // ABOUTME: Critical for Phase 3 E2E test - verifies Task 6b's replay works

  import { eventStore } from '../../stores/events.svelte';
  import * as eventsApi from '../../lib/api/events';
  import { formatEvent, type EventTone } from '../../lib/eventFormat';
  import { showNotification } from '../../lib/native';

  interface Props {
    runId: string;
  }

  const { runId }: Props = $props();

  // Border and label colour per tone; tinted lines also get a background.
  const TONE_CLASSES: Record<EventTone, string> = {
    blue: 'border-blue-500 [&_.event-label]:text-blue-600 dark:[&_.event-label]:text-blue-400',
    green: 'border-green-500 [&_.event-label]:text-green-600 dark:[&_.event-label]:text-green-400',
    red: 'border-red-500 [&_.event-label]:text-red-600 dark:[&_.event-label]:text-red-400',
    amber: 'border-amber-500 [&_.event-label]:text-amber-600 dark:[&_.event-label]:text-amber-400',
    purple:
      'border-purple-500 [&_.event-label]:text-purple-600 dark:[&_.event-label]:text-purple-400',
    muted: 'border-border [&_.event-label]:text-muted-foreground',
  };
  const TINT_CLASSES: Record<EventTone, string> = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    red: 'bg-red-500/10',
    amber: 'bg-amber-500/10',
    purple: 'bg-purple-500/10',
    muted: 'bg-muted',
  };

  // Newest first.
  const lines = $derived(
    [...eventStore.entries].reverse().map((entry) => ({ ...entry, line: formatEvent(entry.event) }))
  );

  let notified = $state(false);

  // Following new events. Newest is at the top: while the box is scrolled to
  // the top it stays there; otherwise the scroll moves by the height the new
  // lines added, so what's being read doesn't shift. Done by hand, so it behaves
  // the same everywhere; the box sets overflow-anchor: none so the browser's own
  // anchoring doesn't apply the shift a second time.
  let logBox: HTMLDivElement | undefined = $state();
  let atTop = true;
  let heightBefore = 0;

  $effect.pre(() => {
    void eventStore.entries.length;
    if (logBox) heightBefore = logBox.scrollHeight;
  });

  $effect(() => {
    void eventStore.entries.length;
    if (!logBox) return;
    if (atTop) logBox.scrollTop = 0;
    else logBox.scrollTop += logBox.scrollHeight - heightBefore;
  });

  // One run's events stay with that run: start from an empty store, and clear
  // it again when the run changes or the log unmounts.
  // Derived, so setting the same runId again doesn't restart the stream (a
  // derived only notifies when its value changes).
  const streamRunId = $derived(runId);

  $effect(() => {
    const id = streamRunId;
    eventStore.clear();
    notified = false;
    const unsubscribe = eventsApi.subscribeToPipelineEvents(id, (event) => {
      eventStore.add(event);
    });

    return () => {
      unsubscribe();
      eventStore.clear();
    };
  });

  // Task 20: OS-native completion notification via the lib/native shim
  // (Notification API in-browser today, a real Tauri notification once
  // smasher-desktop provides window.__TAURI__ -- no call-site change
  // needed then). Driven off eventStore.isComplete rather than the SSE
  // callback above so it fires exactly once regardless of how the
  // terminal event arrived (live tail or Task 6b's replay), and so it's
  // testable the same way the rest of this file's tests already are --
  // by pushing directly into eventStore, not a real SSE connection.
  $effect(() => {
    if (eventStore.isComplete && !notified) {
      notified = true;
      const events = eventStore.events;
      const terminal = [...events].reverse().find(
        (e) => e.kind === 'pipeline_completed' || e.kind === 'pipeline_aborted'
      );
      if (terminal?.kind === 'pipeline_aborted') {
        void showNotification('Pipeline aborted', { body: formatEvent(terminal).detail });
      } else {
        void showNotification('Pipeline complete', {
          body: terminal?.kind === 'pipeline_completed' ? formatEvent(terminal).detail : undefined,
        });
      }
    }
  });
</script>

<div
  bind:this={logBox}
  onscroll={() => (atTop = (logBox?.scrollTop ?? 0) <= 8)}
  class="event-log max-h-[500px] overflow-y-auto [overflow-anchor:none] rounded-lg border border-border bg-muted/50 p-4"
>
  <h3 class="mb-4 text-base font-semibold text-foreground">Events</h3>

  {#if lines.length === 0}
    <p class="py-8 text-center text-muted-foreground">Waiting for events...</p>
  {:else}
    <div class="flex flex-col gap-1.5">
      {#each lines as { seq, event, line } (seq)}
        <div
          class={[
            'event-item flex items-baseline gap-2 rounded border-l-4 px-3 py-1.5',
            TONE_CLASSES[line.tone],
            line.tinted ? TINT_CLASSES[line.tone] : 'bg-card',
            line.agent ? 'ml-5 text-xs' : 'text-sm',
            line.faded && 'opacity-60',
          ]}
          data-tone={line.tone}
          data-agent={line.agent}
          data-faded={line.faded}
        >
          <span aria-hidden="true">{line.icon}</span>
          <span class="event-label shrink-0 text-xs font-semibold uppercase">{line.label}</span>
          <span
            class={['min-w-0 flex-1 truncate text-foreground', line.italic && 'italic']}
            title={line.detail}
          >
            {line.detail}
          </span>
          <span class="shrink-0 text-xs text-muted-foreground">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  {#if eventStore.isComplete}
    <p class="mt-4 text-center font-medium text-green-600" role="status">Pipeline complete</p>
  {/if}
</div>
