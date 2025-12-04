import { marked } from 'marked';
import { HTML_BLOCK_CLASSES, CONTENT_DIV_CLASSES } from './markdown-blocks';

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

  // CRITICAL: Extract and process HTML blocks BEFORE markdown parsing
  // This prevents marked.js from treating content inside HTML blocks as code blocks
  const htmlBlocks: string[] = [];
  const classPattern = HTML_BLOCK_CLASSES.join('|');
  
  // Match HTML blocks with nested divs - use a balanced match approach
  processed = processed.replace(new RegExp(`(<div\\s+class="(${classPattern})"[^>]*>)([\\s\\S]*?)(<\\/div>)`, 'gi'), (match, openTag, className, content, closeTag) => {
    // Check if this is actually the matching closing tag (simple check)
    // Count opening and closing divs in content
    const openDivs = (content.match(/<div/gi) || []).length;
    const closeDivs = (content.match(/<\/div>/gi) || []).length;
    
    // If content has balanced divs, this is likely the correct match
    // Otherwise, we'll process what we have (marked.js will handle the rest)
    if (openDivs === closeDivs || openDivs === 0) {
      // Process markdown and LaTeX inside the HTML block
      const processedContent = processHtmlBlockContent(content);
      const placeholder = `\u200B\u200BHTMLBLOCK${htmlBlocks.length}\u200B\u200B`;
      htmlBlocks.push(`${openTag}${processedContent}${closeTag}`);
      return placeholder;
    }
    
    // If divs aren't balanced, return original (let marked.js handle it)
    return match;
  });

  // CRITICAL: Process display math blocks BEFORE markdown parsing
  // Replace $$...$$ with zero-width space placeholders that won't be processed by marked.js
  const displayMathBlocks: string[] = [];
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const placeholder = `\u200B\u200BDISPLAYMATH${displayMathBlocks.length}\u200B\u200B`;
    displayMathBlocks.push(cleanLatex);
    return placeholder;
  });

  // Also process inline math BEFORE markdown parsing to avoid conflicts
  const inlineMathBlocks: string[] = [];
  processed = processed.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const placeholder = `\u200B\u200BINLINEMATH${inlineMathBlocks.length}\u200B\u200B`;
    inlineMathBlocks.push(cleanLatex);
    return placeholder;
  });

  // Parse markdown to HTML
  let html: string;
  try {
    const result = marked(processed);
    html = typeof result === 'string' ? result : String(result);
  } catch (e) {
    console.error('Marked parse error:', e);
    html = processed;
  }

  // Restore HTML blocks AFTER markdown parsing
  htmlBlocks.forEach((blockHtml, index) => {
    const placeholder = `\u200B\u200BHTMLBLOCK${index}\u200B\u200B`;
    html = html.split(placeholder).join(blockHtml);
    const escapedPlaceholder = placeholder.replace(/\u200B/g, '&#8203;');
    html = html.split(escapedPlaceholder).join(blockHtml);
  });

  // Restore display math blocks AFTER markdown parsing
  displayMathBlocks.forEach((latex, index) => {
    const escapedLatex = latex.replace(/"/g, '&quot;');
    const mathDiv = `<div class="math-display" data-latex="${escapedLatex}"></div>`;
    const placeholder = `\u200B\u200BDISPLAYMATH${index}\u200B\u200B`;
    html = html.split(placeholder).join(mathDiv);
    // Also try HTML-escaped version
    const escapedPlaceholder = placeholder.replace(/\u200B/g, '&#8203;');
    html = html.split(escapedPlaceholder).join(mathDiv);
  });

  // Restore inline math blocks AFTER markdown parsing
  inlineMathBlocks.forEach((latex, index) => {
    const escapedLatex = latex.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const mathSpan = `<span class="math-inline" data-latex="${escapedLatex}"></span>`;
    const placeholder = `\u200B\u200BINLINEMATH${index}\u200B\u200B`;
    html = html.split(placeholder).join(mathSpan);
    // Also try HTML-escaped version
    const escapedPlaceholder = placeholder.replace(/\u200B/g, '&#8203;');
    html = html.split(escapedPlaceholder).join(mathSpan);
  });

  // Post-process: Find content divs inside HTML blocks and process their content
  // This handles cases where marked.js wrapped content in <pre><code> tags
  // Process definition-content, info-content, etc. divs specifically
  // Use balanced matching to handle nested divs properly
  const contentClassPattern = CONTENT_DIV_CLASSES.join('|');
  
  // Find all opening tags for content divs
  const contentDivRegex = new RegExp(`<div\\s+class="(${contentClassPattern})"[^>]*>`, 'gi');
  let contentMatch;
  const processedDivs: Array<{start: number, end: number, replacement: string}> = [];
  
  // Collect all content divs with their positions
  while ((contentMatch = contentDivRegex.exec(html)) !== null) {
    const openTag = contentMatch[0];
    const startIndex = contentMatch.index;
    const contentStart = startIndex + openTag.length;
    
    // Find matching closing tag by tracking div depth
    let depth = 1;
    let i = contentStart;
    let foundClosing = false;
    
    while (i < html.length && depth > 0) {
      const nextOpen = html.indexOf('<div', i);
      const nextClose = html.indexOf('</div>', i);
      
      if (nextClose === -1) break; // No closing tag found
      
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        if (depth === 0) {
          // Found matching closing tag
          const content = html.slice(contentStart, nextClose);
          
          // Check if content needs processing - always process if it has code blocks
          // or unprocessed LaTeX
          const hasCodeBlocks = content.includes('<pre><code');
          const hasUnprocessedDisplayMath = content.includes('$$') && !content.includes('math-display');
          const hasUnprocessedInlineMath = content.includes('$') && !content.includes('math-inline') && !content.includes('math-display');
          
          if (hasCodeBlocks || hasUnprocessedDisplayMath || hasUnprocessedInlineMath) {
            
            // Extract ALL content from code blocks and combine with text between them
            let fullContent = '';
            const codeBlockRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
            let lastIndex = 0;
            let codeMatch;
            let hasCodeBlocks = false;
            
            // Reset regex lastIndex
            codeBlockRegex.lastIndex = 0;
            
            // Extract content from all code blocks and preserve text between them
            while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
              hasCodeBlocks = true;
              
              // Add text before this code block (preserve all text, including whitespace)
              const textBefore = content.slice(lastIndex, codeMatch.index);
              fullContent += textBefore;
              
              // Extract and decode code block content
              const codeContent = codeMatch[1];
              
              // First, remove highlight.js spans but preserve their text content
              let decodedContent = codeContent
                .replace(/<span[^>]*>/g, '')
                .replace(/<\/span>/g, '');
              
              // Then decode HTML entities comprehensively
              decodedContent = decodedContent
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&nbsp;/g, ' ')
                // Decode zero-width spaces (used in our placeholders) - try multiple encodings
                .replace(/&#8203;/g, '\u200B')
                .replace(/&#x200B;/gi, '\u200B');
              
              // Decode numeric HTML entities
              decodedContent = decodedContent.replace(/&#(\d+);/g, (match, code) => {
                const num = parseInt(code, 10);
                if (num === 8203) return '\u200B'; // Zero-width space
                if (num >= 32 && num <= 126) return String.fromCharCode(num); // Printable ASCII
                return match; // Keep other entities as-is
              });
              
              // Decode hex HTML entities
              decodedContent = decodedContent.replace(/&#x([0-9a-fA-F]+);/gi, (match, hex) => {
                const num = parseInt(hex, 16);
                if (num === 0x200B) return '\u200B'; // Zero-width space
                if (num >= 32 && num <= 126) return String.fromCharCode(num); // Printable ASCII
                return match; // Keep other entities as-is
              });
              
              fullContent += decodedContent;
              lastIndex = codeMatch.index + codeMatch[0].length;
            }
            
            // Add any remaining text after the last code block
            if (hasCodeBlocks) {
              const textAfter = content.slice(lastIndex);
              fullContent += textAfter;
            } else {
              // No code blocks found, use original content
              fullContent = content;
            }
            
            // Clean up: remove any remaining HTML tags that shouldn't be there
            // but preserve the structure we need
            fullContent = fullContent.trim();
            
            // Process the combined content as a whole - this will handle LaTeX and markdown
            const processedContent = processHtmlBlockContent(fullContent);
            const replacement = `${openTag}${processedContent}</div>`;
            
            processedDivs.push({
              start: startIndex,
              end: nextClose + 6,
              replacement: replacement
            });
          }
          
          foundClosing = true;
          break;
        }
        i = nextClose + 6;
      }
    }
  }
  
  // Apply replacements in reverse order to maintain correct indices
  processedDivs.sort((a, b) => b.start - a.start);
  processedDivs.forEach(({start, end, replacement}) => {
    html = html.slice(0, start) + replacement + html.slice(end);
  });

  // Fix any escaped HTML entities (marked.js might escape our divs/spans)
  html = html.replace(/&lt;div class="math-display" data-latex="([^"]+)"&gt;&lt;\/div&gt;/g,
    '<div class="math-display" data-latex="$1"></div>');
  html = html.replace(/&lt;span class="math-inline" data-latex="([^"]+)"&gt;&lt;\/span&gt;/g, 
    '<span class="math-inline" data-latex="$1"></span>');
  html = html.replace(/&lt;span class='math-inline' data-latex='([^']+)'&gt;&lt;\/span&gt;/g, 
    '<span class="math-inline" data-latex="$1"></span>');

  return html;
}

// Process markdown and LaTeX inside HTML block content
function processHtmlBlockContent(content: string): string {
  if (!content) return '';
  
  // Process display math blocks
  const displayMathBlocks: string[] = [];
  let processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const placeholder = `\u200B\u200BDISPLAYMATH${displayMathBlocks.length}\u200B\u200B`;
    displayMathBlocks.push(cleanLatex);
    return placeholder;
  });

  // Process inline math
  const inlineMathBlocks: string[] = [];
  processed = processed.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, latex) => {
    const cleanLatex = sanitizeLatex((latex || '').trim());
    const placeholder = `\u200B\u200BINLINEMATH${inlineMathBlocks.length}\u200B\u200B`;
    inlineMathBlocks.push(cleanLatex);
    return placeholder;
  });

  // Process markdown inside the HTML block
  let html: string;
  try {
    html = marked(processed);
    if (typeof html !== 'string') {
      html = String(html);
    }
  } catch (e) {
    console.error('Marked parse failed for HTML block:', e);
    html = processed;
  }

  // Restore display math
  displayMathBlocks.forEach((latex, index) => {
    const escapedLatex = latex.replace(/"/g, '&quot;');
    const mathDiv = `<div class="math-display" data-latex="${escapedLatex}"></div>`;
    const placeholder = `\u200B\u200BDISPLAYMATH${index}\u200B\u200B`;
    html = html.split(placeholder).join(mathDiv);
    const escapedPlaceholder = placeholder.replace(/\u200B/g, '&#8203;');
    html = html.split(escapedPlaceholder).join(mathDiv);
  });

  // Restore inline math
  inlineMathBlocks.forEach((latex, index) => {
    const escapedLatex = latex.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const mathSpan = `<span class="math-inline" data-latex="${escapedLatex}"></span>`;
    const placeholder = `\u200B\u200BINLINEMATH${index}\u200B\u200B`;
    html = html.split(placeholder).join(mathSpan);
    const escapedPlaceholder = placeholder.replace(/\u200B/g, '&#8203;');
    html = html.split(escapedPlaceholder).join(mathSpan);
  });

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
