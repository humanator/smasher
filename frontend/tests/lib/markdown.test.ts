// ABOUTME: Tests for renderMarkdown, which turns agent replies into sanitised HTML
// ABOUTME: Checks GFM rendering, script/handler/javascript: stripping, and safe link targets

import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../src/lib/markdown';

function render(text: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = renderMarkdown(text);
  return container;
}

describe('renderMarkdown', () => {
  it('renders headings, bold and lists', () => {
    const html = render('# Recap\n\nYou said **yes**.\n\n- one\n- two');

    expect(html.querySelector('h1')?.textContent).toBe('Recap');
    expect(html.querySelector('strong')?.textContent).toBe('yes');
    expect(Array.from(html.querySelectorAll('li')).map((li) => li.textContent)).toEqual([
      'one',
      'two',
    ]);
  });

  it('renders GFM tables', () => {
    const html = render('| Gate | Answer |\n|---|---|\n| Binary | yes |');

    expect(html.querySelector('table th')?.textContent).toBe('Gate');
    expect(html.querySelector('table td')?.textContent).toBe('Binary');
  });

  it('strips script tags', () => {
    const html = render('Hello <script>window.pwned = true</script>');

    expect(html.querySelector('script')).toBeNull();
    expect(html.textContent).toContain('Hello');
  });

  it('strips on* event handler attributes', () => {
    const html = render('<img src="x.png" onerror="alert(1)"> <b onclick="alert(2)">hi</b>');

    expect(html.querySelector('img')?.hasAttribute('onerror')).toBe(false);
    expect(html.querySelector('b')?.hasAttribute('onclick')).toBe(false);
  });

  it('strips javascript: hrefs', () => {
    const html = render('[click me](javascript:alert(1))');

    expect(html.innerHTML).not.toContain('javascript:');
  });

  it('opens links in a new tab without an opener', () => {
    const link = render('[docs](https://example.com)').querySelector('a');

    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
