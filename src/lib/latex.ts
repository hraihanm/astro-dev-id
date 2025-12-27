// Re-export unified renderer for backward compatibility
// Chapter content needs HTML block processing
import { renderMarkdown as renderMarkdownCore } from './markdown-renderer/core';
import type { RenderOptions } from './markdown-renderer/types';

/**
 * Render markdown content (server-side)
 * For chapter content, enables HTML block processing
 * 
 * @param content - Markdown content to render
 * @param processHtmlBlocks - Whether to process custom HTML blocks (default: true for chapters)
 * @returns Rendered HTML
 */
export function renderMarkdown(content: string, processHtmlBlocks: boolean = true): string {
  return renderMarkdownCore(content, {
    processHtmlBlocks,
    sanitize: false  // Server-side doesn't need DOMPurify
  });
}
