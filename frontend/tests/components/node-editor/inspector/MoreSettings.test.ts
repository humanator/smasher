// ABOUTME: Tests for inspector/MoreSettings.svelte, the disclosure that holds a step's advanced fields
// ABOUTME: It shows "{n} settings", reports aria-expanded and only renders its fields while open

import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import MoreSettings from '../../../../src/components/node-editor/inspector/MoreSettings.svelte';

const fields = createRawSnippet(() => ({ render: () => '<p>Retries field</p>' }));

describe('MoreSettings', () => {
  it('starts closed, with the count of settings inside', () => {
    render(MoreSettings, { props: { count: 4, children: fields } });

    const toggle = screen.getByRole('button', { name: /More settings/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('4 settings');
    expect(screen.queryByText('Retries field')).toBeNull();
  });

  it('opens and closes from the toggle', async () => {
    render(MoreSettings, { props: { count: 4, children: fields } });
    const toggle = screen.getByRole('button', { name: /More settings/ });

    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Retries field')).toBeInTheDocument();

    await fireEvent.click(toggle);
    expect(screen.queryByText('Retries field')).toBeNull();
  });
});
