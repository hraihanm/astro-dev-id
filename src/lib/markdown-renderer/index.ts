/**
 * Unified Markdown Renderer - Main Entry Point
 * 
 * This module provides a unified markdown rendering system with:
 * - Pandoc-style image attributes (width, height, class, id, style, scale, align)
 * - LaTeX/Math support (KaTeX client-side rendering)
 * - Custom HTML blocks (for chapter content)
 * 
 * Usage:
 * - Server-side: import { renderMarkdown } from '@/lib/markdown-renderer/core'
 * - Client-side: import { renderMarkdownClient } from '@/lib/markdown-renderer/client'
 */

export { renderMarkdown } from './core';
export { renderMarkdownClient } from './client';
export type { RenderOptions, ImageAttributes } from './types';
export { parseImageAttributes, buildImageHtml, processImageAttributes } from './image-processor';
export { processDisplayMath, processInlineMath, restoreMathBlocks, sanitizeLatex } from './math-processor';
export { processHtmlBlocks, restoreHtmlBlocks, postProcessContentDivs } from './html-block-processor';

