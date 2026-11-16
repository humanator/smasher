// ABOUTME: Tests for the Badge primitive's optional status dot
// ABOUTME: The dot is decorative (aria-hidden); without it the markup is unchanged

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import { createRawSnippet } from 'svelte';
import Badge from '../../../src/lib/components/ui/badge/badge.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Running</span>' }));

describe('Badge', () => {
  it('renders only its children when there is no dot', () => {
    render(Badge, { props: { children: label } });
    const badge = screen.getByText('Running').parentElement as HTMLElement;
    expect(badge.getAttribute('data-slot')).toBe('badge');
    expect(badge.querySelector('[data-slot="badge-dot"]')).toBeNull();
    expect(badge.children).toHaveLength(1);
  });

  it('renders an aria-hidden 6px dot in the given colour ahead of the label', () => {
    render(Badge, { props: { dot: 'var(--info)', children: label } });
    const badge = screen.getByText('Running').parentElement as HTMLElement;
    const dot = badge.querySelector('[data-slot="badge-dot"]') as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(dot.className).toContain('size-1.5');
    expect(dot.style.background).toContain('var(--info)');
    expect(badge.firstElementChild).toBe(dot);
  });
});
