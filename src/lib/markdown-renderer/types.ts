/**
 * TypeScript types for markdown renderer
 */

export interface RenderOptions {
  /** Process custom HTML blocks (definition, theorem, example, etc.) - for chapter content */
  processHtmlBlocks?: boolean;
  /** Sanitize HTML output using DOMPurify (client-side only) */
  sanitize?: boolean;
  /** Base URL for relative image paths */
  baseUrl?: string;
}

export interface ImageAttributes {
  width?: string;
  height?: string;
  alt?: string;
  class?: string;
  id?: string;
  style?: string;
  scale?: number;
  align?: 'left' | 'center' | 'right';
}

export interface MathBlock {
  latex: string;
  type: 'display' | 'inline';
  placeholder: string;
}

