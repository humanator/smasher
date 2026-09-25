// ABOUTME: Renders agent markdown to sanitised HTML with marked and DOMPurify
// ABOUTME: Used before {@html}-injecting agent replies under Answered Questions

import DOMPurify from 'dompurify';
import { marked } from 'marked';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text, { gfm: true, async: false }));
}
