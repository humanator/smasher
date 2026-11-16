// ABOUTME: Native notifications for a run: once when it first waits for you, once when it ends
// ABOUTME: Driven off the run's events, so it fires however they arrived (live tail or replay) and whichever panel is open

import { formatEvent } from '../eventFormat';
import { showNotification } from '../native';
import type { PipelineEvent } from '../api/events';

/**
 * OS-native notifications via the lib/native shim (Notification API in-browser, a real Tauri
 * notification in smasher-desktop). Call during component setup; `events` is read reactively.
 * One call per page: the page is keyed by run, so a new run is a new call.
 */
export function useRunNotifications(events: () => readonly PipelineEvent[]): void {
  let askedAboutWaiting = false;
  let askedAboutEnd = false;

  $effect(() => {
    const all = events();
    if (!askedAboutWaiting) {
      const waiting = all.find((e) => e.kind === 'human_prompt_issued');
      if (waiting) {
        askedAboutWaiting = true;
        void showNotification('Waiting for you', { body: formatEvent(waiting).detail });
      }
    }

    if (!askedAboutEnd) {
      const end = [...all].reverse().find((e) => e.kind === 'pipeline_completed' || e.kind === 'pipeline_aborted');
      if (end) {
        askedAboutEnd = true;
        const title = end.kind === 'pipeline_aborted' ? 'Pipeline aborted' : 'Pipeline complete';
        void showNotification(title, { body: formatEvent(end).detail });
      }
    }
  });
}
