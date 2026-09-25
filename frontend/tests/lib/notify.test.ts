// ABOUTME: Tests for notifyError and pollFailureNotifier, the app-wide error toasts
// ABOUTME: Renders the real sonner Toaster and asserts on the toasts in the DOM

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { toast } from 'svelte-sonner';
import { Toaster } from '../../src/lib/components/ui/sonner/index.js';
import { errorMessage, notifyError, pollFailureNotifier } from '../../src/lib/notify';

// Live toasts only. Sonner's store is global, so a toast dismissed in an
// earlier test can briefly re-render, marked data-removed, as it fades out.
const toasts = () => document.querySelectorAll('[data-sonner-toast][data-removed="false"]');

// Sonner's toast list is global. Close every toast while the Toaster is
// still mounted so none carries over into the next test.
afterEach(async () => {
  toast.dismiss();
  await waitFor(() => expect(toasts().length).toBe(0));
});

describe('errorMessage', () => {
  it('uses an Error message', () => {
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('uses the fallback for a non-Error or an empty message', () => {
    expect(errorMessage('boom', 'fallback')).toBe('fallback');
    expect(errorMessage(new Error(''), 'fallback')).toBe('fallback');
  });
});

describe('notifyError', () => {
  it("shows a toast with the error's message", async () => {
    render(Toaster);

    notifyError(new Error('not found: run x'), 'Failed to load');

    expect(await screen.findByText('not found: run x')).toBeTruthy();
  });

  it('shows the fallback for a non-Error', async () => {
    render(Toaster);

    notifyError({ reason: 'weird' }, 'Failed to load');

    expect(await screen.findByText('Failed to load')).toBeTruthy();
  });
});

describe('pollFailureNotifier', () => {
  it('shows one toast for a run of failures', async () => {
    render(Toaster);
    const notifier = pollFailureNotifier('poll-a', 'Poll failed');

    notifier.fail(new Error('down 1'));
    notifier.fail(new Error('down 2'));
    notifier.fail(new Error('down 3'));

    expect(await screen.findByText('down 1')).toBeTruthy();
    // Give sonner a chance to render anything extra before counting
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(toasts().length).toBe(1);
    expect(screen.queryByText('down 2')).toBeNull();
  });

  it('does not bring a closed toast back while failures continue', async () => {
    render(Toaster);
    const notifier = pollFailureNotifier('poll-a', 'Poll failed');

    notifier.fail(new Error('down'));
    await screen.findByText('down');
    toast.dismiss('poll-a');
    await waitFor(() => expect(toasts().length).toBe(0));

    notifier.fail(new Error('still down'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(toasts().length).toBe(0);
  });

  it('toasts again on the first failure after a success', async () => {
    render(Toaster);
    const notifier = pollFailureNotifier('poll-a', 'Poll failed');

    notifier.fail(new Error('down'));
    await screen.findByText('down');
    toast.dismiss('poll-a');
    await waitFor(() => expect(toasts().length).toBe(0));

    notifier.ok();
    notifier.fail(new Error('down again'));

    expect(await screen.findByText('down again')).toBeTruthy();
    expect(toasts().length).toBe(1);
  });

  it('keeps separate toasts for notifiers with different ids', async () => {
    render(Toaster);
    const questions = pollFailureNotifier('poll-questions', 'Questions failed');
    const gate = pollFailureNotifier('poll-gate', 'Gate failed');

    questions.fail(new Error('questions down'));
    gate.fail(new Error('gate down'));

    expect(await screen.findByText('questions down')).toBeTruthy();
    expect(await screen.findByText('gate down')).toBeTruthy();
    expect(toasts().length).toBe(2);
  });
});
