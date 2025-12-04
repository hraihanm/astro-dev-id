/**
 * Shared constants for markdown block processing
 * Used by both client-side (editor preview) and server-side (chapter viewing) rendering
 */

export const HTML_BLOCK_CLASSES = [
  'definition-block',
  'info-block',
  'warning-block',
  'tip-block',
  'note-block',
  'example-block',
  'theorem-block'
] as const;

export const CONTENT_DIV_CLASSES = [
  'definition-content',
  'info-content',
  'warning-content',
  'tip-content',
  'note-content',
  'example-content',
  'example-problem',
  'example-solution',
  'theorem-content'
] as const;
