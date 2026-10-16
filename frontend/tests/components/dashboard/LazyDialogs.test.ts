// ABOUTME: Tests for LazyRunDialog and LazySettingsDialog, which load their dialog only when it is first needed
// ABOUTME: Checks nothing loads while closed, the real dialog appears once opened, and open stays bound

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import LazyRunDialog from '../../../src/components/dashboard/LazyRunDialog.svelte';
import LazySettingsDialog from '../../../src/components/dashboard/LazySettingsDialog.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';

// Loading is a dynamic import even once compiled, so allow a little longer than the default.
const LOAD = { timeout: 5000 };

const workflow = { id: 'examples__run_launch_check', name: 'run_launch_check.dot' };

describe('lazy dialogs', () => {
  beforeAll(async () => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
    // Compile both dialogs up front: the first transform takes several seconds under
    // Vitest, which says nothing about how the wrappers behave.
    await Promise.all([
      import('../../../src/components/dashboard/RunDialog.svelte'),
      import('../../../src/components/dashboard/SettingsDialog.svelte'),
    ]);
  }, 30_000);

  afterEach(() => {
    // bits-ui's scroll lock clears this on a timer after the open dialog unmounts.
    document.body.style.pointerEvents = '';
  });

  describe('LazyRunDialog', () => {
    it('renders nothing while closed', () => {
      render(LazyRunDialog, { props: { workflow, open: false } });
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('shows the Run sheet once opened', async () => {
      render(LazyRunDialog, { props: { workflow, open: true } });
      expect(await screen.findByRole('heading', { name: 'Run “Run Launch Check”' }, LOAD)).toBeTruthy();
    });

    it('passes a close back to the parent through bind:open', async () => {
      const user = userEvent.setup();
      render(LazyRunDialog, { props: { workflow, open: true } });
      await screen.findByRole('dialog', {}, LOAD);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });
  });

  describe('LazySettingsDialog', () => {
    it('shows its own Settings button and no dialog until it is pressed', async () => {
      const user = userEvent.setup();
      render(LazySettingsDialog);
      expect(screen.queryByRole('dialog')).toBeNull();

      await user.click(screen.getByRole('button', { name: 'AI model settings' }));

      expect(await screen.findByRole('heading', { name: 'Settings' }, LOAD)).toBeTruthy();
    });

    it('can be opened by the page instead, with no button of its own', async () => {
      render(LazySettingsDialog, { props: { trigger: false, open: true } });
      expect(screen.queryByRole('button', { name: 'AI model settings' })).toBeNull();
      expect(await screen.findByRole('heading', { name: 'Settings' }, LOAD)).toBeTruthy();
    });
  });
});
