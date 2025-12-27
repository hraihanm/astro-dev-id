/**
 * Core markdown renderer - unified rendering logic
 * Used by both server-side and client-side code
 */

import { marked } from 'marked';
import { HTML_BLOCK_CLASSES } from '../markdown-blocks';
import { processImageAttributes } from './image-processor';
import { processDisplayMath, processInlineMath, restoreMathBlocks } from './math-processor';
import { processHtmlBlocks, restoreHtmlBlocks, postProcessContentDivs } from './html-block-processor';
import type { RenderOptions } from './types';

// Configure marked.js
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

// Custom renderer to preserve HTML in list items
const renderer = new marked.Renderer();
const originalListItem = renderer.listitem;
renderer.listitem = function(text: string) {
  // Don't escape HTML in list items - marked.js should preserve it
  return originalListItem.call(this, text);
};
marked.use({ renderer });

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Normalize newlines
 */
function normalizeNewlines(content: string): string {
  return content.replace(/\r\n?|\u2028|\u2029/g, '\n');
}

/**
 * Fix tabs in list items - marked.js treats lines starting with tabs as code blocks
 */
function fixTabsInListItems(content: string): string {
  return content.split('\n').map(line => {
    // If line starts with a list marker followed by tabs, convert tabs to spaces
    if (/^(\s*[-*+]|\s*\d+\.)\s*\t/.test(line)) {
      return line.replace(/\t/g, '    '); // 4 spaces per tab
    }
    return line;
  }).join('\n');
}

/**
 * Main markdown rendering function
 */
export function renderMarkdown(content: string, options: RenderOptions = {}): string {
  if (!content) return '';
  
  // 1. Normalize newlines
  let processed = normalizeNewlines(content);
  
  // 2. Fix tabs in list items
  processed = fixTabsInListItems(processed);
  
  // 3. Process HTML blocks (if enabled - for chapter content)
  let htmlBlocks: string[] = [];
  if (options.processHtmlBlocks) {
    const htmlBlockResult = processHtmlBlocks(processed);
    processed = htmlBlockResult.processed;
    htmlBlocks = htmlBlockResult.blocks;
  }
  
  // 4. Process images with Pandoc-style attributes BEFORE markdown parsing
  processed = processImageAttributes(processed);
  
  // 5. Process display math blocks BEFORE markdown parsing
  const displayMathResult = processDisplayMath(processed);
  processed = displayMathResult.processed;
  
  // 6. Process inline math BEFORE markdown parsing
  const inlineMathResult = processInlineMath(processed);
  processed = inlineMathResult.processed;
  
  // 7. Parse markdown to HTML using marked
  let html: string;
  try {
    const result = marked(processed);
    html = typeof result === 'string' ? result : String(result);
  } catch (e) {
    console.error('Marked parse error:', e);
    html = processed;
  }
  
  // 8. Restore HTML blocks AFTER markdown parsing
  if (options.processHtmlBlocks && htmlBlocks.length > 0) {
    html = restoreHtmlBlocks(html, htmlBlocks);
  }
  
  // 9. Restore math blocks AFTER markdown parsing
  const allMathBlocks = [...displayMathResult.blocks, ...inlineMathResult.blocks];
  html = restoreMathBlocks(html, allMathBlocks);
  
  // 10. Post-process content divs inside HTML blocks (if HTML blocks were processed)
  if (options.processHtmlBlocks) {
    html = postProcessContentDivs(html);
  }
  
  return html;
}

