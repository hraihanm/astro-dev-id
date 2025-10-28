import { marked } from 'marked';

// Simple HTML escape for code content
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

// Optimized: Use placeholders for LaTeX instead of server-side rendering
// LaTeX will be rendered client-side for better performance
export function renderMarkdown(content: string): string {
  if (!content) return '';
  
  // Normalize newlines
  let processed = content.replace(/\r\n?|\u2028|\u2029/g, '\n');

  // Convert display math blocks ($$ ... $$) to placeholders
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const cleanLatex = (latex || '').trim();
    // Sanitize the LaTeX to remove problematic Unicode characters
    const sanitized = sanitizeLatex(cleanLatex);
    return `\n<div class="math-display" data-latex="${sanitized}"></div>\n`;
  });

  // Convert inline math $...$ to placeholders
  processed = processed.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, latex) => {
    const cleanLatex = (latex || '').trim();
    // Sanitize the LaTeX to remove problematic Unicode characters
    const sanitized = sanitizeLatex(cleanLatex);
    return `<span class="math-inline" data-latex="${sanitized}"></span>`;
  });

  // Parse markdown to HTML
  const html = marked(processed);
  if (typeof html === 'string') {
    return html;
  }
  // If marked returns a promise, wait for it
  throw new Error('marked returned a promise - this should not happen');
}

// Sanitize LaTeX content to remove problematic Unicode characters
function sanitizeLatex(latex: string): string {
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

