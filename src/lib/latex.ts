import { marked } from 'marked';

// Configure marked.js to preserve HTML and handle GFM
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
  
  // Fix tabs in list items - marked.js treats lines starting with tabs as code blocks
  // Convert tabs to spaces in list items to prevent code block detection
  // This regex matches list items (bullet or numbered) and replaces tabs with spaces
  processed = processed.split('\n').map(line => {
    // If line starts with a list marker followed by tabs, convert tabs to spaces
    if (/^(\s*[-*+]|\s*\d+\.)\s*\t/.test(line)) {
      return line.replace(/\t/g, '    '); // 4 spaces per tab
    }
    return line;
  }).join('\n');

  // Step 1: Convert display math blocks ($$ ... $$) to HTML divs
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    return `\n<div class="math-display" data-latex="${cleanLatex.replace(/"/g, '&quot;')}"></div>\n`;
  });

  // Step 2: Use unique placeholders for inline math to avoid marked.js escaping HTML
  // Store the LaTeX content for later replacement
  const inlineMathMap: Map<string, string> = new Map();
  let placeholderIndex = 0;
  
  processed = processed.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const escapedLatex = cleanLatex.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const placeholder = `__MATH_INLINE_${placeholderIndex}__`;
    inlineMathMap.set(placeholder, `<span class="math-inline" data-latex="${escapedLatex}"></span>`);
    placeholderIndex++;
    return placeholder;
  });

  // Step 3: Parse markdown to HTML
  let html: string;
  try {
    const result = marked(processed);
    html = typeof result === 'string' ? result : String(result);
  } catch (e) {
    console.error('Marked parse error:', e);
    html = processed;
  }

  // Step 4: Replace placeholders with actual HTML spans AFTER markdown parsing
  // This ensures marked.js doesn't escape our HTML
  inlineMathMap.forEach((htmlSpan, placeholder) => {
    // Escape the placeholder for regex (in case it contains special chars)
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(escapedPlaceholder, 'g'), htmlSpan);
  });

  // Step 5: Also fix any escaped HTML entities as a fallback
  html = html.replace(/&lt;span class="math-inline" data-latex="([^"]+)"&gt;&lt;\/span&gt;/g, 
    '<span class="math-inline" data-latex="$1"></span>');
  
  html = html.replace(/&lt;span class='math-inline' data-latex='([^']+)'&gt;&lt;\/span&gt;/g, 
    '<span class="math-inline" data-latex="$1"></span>');

  return html;
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

