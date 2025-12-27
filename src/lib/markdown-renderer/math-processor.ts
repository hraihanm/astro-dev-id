/**
 * LaTeX/Math processing for markdown
 * Converts $$...$$ and $...$ to placeholders for client-side rendering
 */

import type { MathBlock } from './types';

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
 * Sanitize LaTeX content to remove problematic Unicode characters
 */
export function sanitizeLatex(latex: string): string {
  if (!latex) return '';
  return latex
    // Remove zero-width spaces (8203)
    .replace(/\u200B/g, '')
    // Remove thin spaces (8201, 202F) - replace with regular space
    .replace(/[\u2009\u202F\u200A]/g, ' ')
    // Remove non-breaking spaces (160) - replace with regular space  
    .replace(/\u00A0/g, ' ')
    // Remove combining marks (arrows, accents, etc.) (8400-842F range, including 8407)
    .replace(/[\u0300-\u036F\u20D0-\u20FF]/g, '')
    // Normalize line endings
    .replace(/\r\n?|\u2028|\u2029/g, '\n')
    // Clean up multiple spaces (but preserve intentional spacing in math)
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Process display math blocks ($$ ... $$)
 */
export function processDisplayMath(content: string): { 
  processed: string; 
  blocks: MathBlock[] 
} {
  const blocks: MathBlock[] = [];
  
  const processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const placeholder = `\u200B\u200BDISPLAYMATH${blocks.length}\u200B\u200B`;
    
    blocks.push({
      latex: cleanLatex,
      type: 'display',
      placeholder
    });
    
    return placeholder;
  });
  
  return { processed, blocks };
}

/**
 * Process inline math ($ ... $)
 */
export function processInlineMath(content: string): { 
  processed: string; 
  blocks: MathBlock[] 
} {
  const blocks: MathBlock[] = [];
  
  const processed = content.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const placeholder = `\u200B\u200BINLINEMATH${blocks.length}\u200B\u200B`;
    
    blocks.push({
      latex: cleanLatex,
      type: 'inline',
      placeholder
    });
    
    return placeholder;
  });
  
  return { processed, blocks };
}

/**
 * Restore math blocks to HTML after markdown parsing
 */
export function restoreMathBlocks(html: string, blocks: MathBlock[]): string {
  let result = html;
  
  for (const block of blocks) {
    const escapedLatex = block.latex
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    const fallbackLatex = escapeHtml(block.latex);
    
    let mathHtml: string;
    if (block.type === 'display') {
      mathHtml = `<div class="math-display" data-latex="${escapedLatex}">${fallbackLatex}</div>`;
    } else {
      mathHtml = `<span class="math-inline" data-latex="${escapedLatex}">${fallbackLatex}</span>`;
    }
    
    // Replace placeholder (both normal and HTML-escaped versions)
    result = result.split(block.placeholder).join(mathHtml);
    const escapedPlaceholder = block.placeholder.replace(/\u200B/g, '&#8203;');
    result = result.split(escapedPlaceholder).join(mathHtml);
  }
  
  // Fix any escaped HTML entities that marked.js might have created
  result = result.replace(/&lt;div class="math-display" data-latex="([^"]+)"&gt;&lt;\/div&gt;/g,
    '<div class="math-display" data-latex="$1"></div>');
  result = result.replace(/&lt;span class="math-inline" data-latex="([^"]+)"&gt;&lt;\/span&gt;/g, 
    '<span class="math-inline" data-latex="$1"></span>');
  result = result.replace(/&lt;span class='math-inline' data-latex='([^']+)'&gt;&lt;\/span&gt;/g, 
    '<span class="math-inline" data-latex="$1"></span>');
  
  return result;
}

