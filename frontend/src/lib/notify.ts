// ABOUTME: App-wide error toasts, built on svelte-sonner's <Toaster /> in App.svelte
// ABOUTME: notifyError for one-off failures; pollFailureNotifier toasts once per run of failures

import { toast } from 'svelte-sonner';

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function notifyError(err: unknown, fallback: string, id?: string): void {
  toast.error(errorMessage(err, fallback), { id });
}

// A poller calls fail() on every failed tick and ok() on every good one. Only the first
// failure after a success shows a toast, so a dead server doesn't re-toast every 2s.
export function pollFailureNotifier(id: string, fallback: string) {
  let failing = false;
  return {
    fail(err: unknown) {
      if (!failing) notifyError(err, fallback, id);
      failing = true;
    },
    ok() {
      failing = false;
    },
  };
}
