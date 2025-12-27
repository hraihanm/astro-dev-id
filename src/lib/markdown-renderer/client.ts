/**
 * Client-side markdown renderer bundle
 * Can be used in browser <script> tags or imported in client components
 */

import { renderMarkdown } from './core';
import type { RenderOptions } from './types';

/**
 * Client-side renderer (with optional sanitization)
 * Note: DOMPurify should be loaded separately if sanitization is needed
 */
export function renderMarkdownClient(
  content: string,
  options: RenderOptions = {}
): string {
  // Render markdown
  const html = renderMarkdown(content, options);
  
  // Sanitize if requested and DOMPurify is available
  if (options.sanitize && typeof window !== 'undefined' && (window as any).DOMPurify) {
    return (window as any).DOMPurify.sanitize(html);
  }
  
  return html;
}

/**
 * Export to window for use in <script> tags
 * Usage: window.markdownRenderer.render(content, options)
 */
if (typeof window !== 'undefined') {
  (window as any).markdownRenderer = {
    render: renderMarkdownClient,
    renderMarkdown: renderMarkdownClient  // Alias for convenience
  };
}

