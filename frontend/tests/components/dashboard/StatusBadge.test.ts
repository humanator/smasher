// ABOUTME: Tests for StatusBadge, the pill that shows a run's or workflow's status
// ABOUTME: Checks the status is text, not colour alone, and the dot is hidden from assistive tech

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import StatusBadge from '../../../src/components/dashboard/StatusBadge.svelte';

describe('StatusBadge', () => {
  it('shows the status as text with an aria-hidden dot', () => {
    const { container } = render(StatusBadge, { props: { status: 'Running' } });

    expect(screen.getByText('Running')).toBeTruthy();
    const dot = container.querySelector('[data-slot="badge-dot"]');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveStyle({ background: 'var(--info)' });
  });

  it('renders Needs you without a dot', () => {
    const { container } = render(StatusBadge, { props: { status: 'Needs you' } });

    expect(screen.getByText('Needs you')).toBeTruthy();
    expect(container.querySelector('[data-slot="badge-dot"]')).toBeNull();
  });
});
