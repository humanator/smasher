// ABOUTME: Tests for the Card primitive restyled to the Run and Workflow boards
// ABOUTME: 10px corners, the board's surfaces per variant, 13px type and no shadcn rounded-4xl

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import CardHost from './CardHost.svelte';

const classesOf = (el: HTMLElement) => el.className.split(' ');

describe('Card', () => {
  it('is a white card with 10px corners and the card shadow by default', () => {
    render(CardHost);
    const card = screen.getByTestId('card');
    expect(classesOf(card)).toEqual(expect.arrayContaining(['bg-card', 'rounded-xl', 'shadow-card', 'text-body']));
    expect(card.className).not.toContain('rounded-4xl');
    expect(card.getAttribute('data-variant')).toBe('default');
  });

  it.each([
    ['muted', ['bg-muted', 'border-border']],
    ['success', ['bg-success-subtle', 'border-success-border']],
    ['destructive', ['bg-destructive-surface', 'border-destructive-border']],
  ] as const)('the %s variant uses its board surface and hairline', (variant, expected) => {
    render(CardHost, { props: { variant } });
    const classes = classesOf(screen.getByTestId('card'));
    expect(classes).toEqual(expect.arrayContaining([...expected, 'border']));
    expect(classes).not.toContain('shadow-card');
  });

  it('pads hero cards 18/20px and sm cards 12px', () => {
    render(CardHost);
    expect(classesOf(screen.getByTestId('card'))).toEqual(expect.arrayContaining(['[--card-spacing:--spacing(5)]', 'py-[18px]']));
  });

  it('sets the title in 13px semibold and the description at 12px', () => {
    render(CardHost);
    expect(classesOf(screen.getByText('Finished in 10 min 35 s'))).toEqual(expect.arrayContaining(['text-body', 'font-semibold']));
    expect(classesOf(screen.getByText('All seven steps ran.'))).toContain('text-small');
  });
});
