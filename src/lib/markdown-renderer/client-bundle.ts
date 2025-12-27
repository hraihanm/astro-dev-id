/**
 * Client-side bundle for markdown rendering
 * This file can be imported in client components or loaded as a script
 * 
 * Usage in <script> tags:
 * <script src="/lib/markdown-renderer-client.js"></script>
 * <script>
 *   const html = window.markdownRenderer.render(content);
 * </script>
 */

// This will be bundled by Astro/Vite for client-side use
// For now, we'll create a version that works in browser context

import { renderMarkdown } from './core';
import type { RenderOptions } from './types';

/**
 * Client-side renderer wrapper
 * Note: In browser context, we can't use DOMPurify unless it's loaded separately
 */
export function renderMarkdownClient(
  content: string,
  options: RenderOptions = {}
): string {
  // Render using unified core
  return renderMarkdown(content, {
    ...options,
    processHtmlBlocks: options.processHtmlBlocks || false,  // Usually false for quizzes
    sanitize: false  // DOMPurify should be handled separately if needed
  });
}

// Export to window for use in <script> tags
if (typeof window !== 'undefined') {
  (window as any).markdownRenderer = {
    render: renderMarkdownClient,
    renderMarkdown: renderMarkdownClient
  };
}

