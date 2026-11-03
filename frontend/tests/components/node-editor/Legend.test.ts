// ABOUTME: Tests for Legend.svelte, the canvas key for a plain connection and a dashed loop
// ABOUTME: The loop sample uses the warning ink, as the loop connection itself does (spec R3, D7)

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Legend from '../../../src/components/node-editor/Legend.svelte';

describe('Legend', () => {
  it('shows a solid line for the next step and a dashed warning-ink line for a loop', () => {
    render(Legend);

    const next = screen.getByText('Then run the next step').querySelector('[aria-hidden="true"]');
    const loop = screen.getByText('Go back and redo (a loop)').querySelector('[aria-hidden="true"]');
    expect(next).toHaveClass('border-muted-foreground');
    expect(next).not.toHaveClass('border-dashed');
    expect(loop).toHaveClass('border-dashed', 'border-warning-foreground');
  });
});
