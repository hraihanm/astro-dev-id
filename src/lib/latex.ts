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

  // CRITICAL: Extract and process HTML blocks BEFORE markdown parsing
  // This prevents marked.js from treating content inside HTML blocks as code blocks
  const htmlBlocks: string[] = [];
  const htmlBlockClasses = ['definition-block', 'info-block', 'warning-block', 'tip-block', 'note-block', 'example-block'];
  const classPattern = htmlBlockClasses.join('|');
  
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
  const contentDivClasses = ['definition-content', 'info-content', 'warning-content', 'tip-content', 'note-content', 'example-content'];
  const contentClassPattern = contentDivClasses.join('|');
  
  html = html.replace(new RegExp(`(<div\\s+class="(${contentClassPattern})"[^>]*>)([\\s\\S]*?)(<\\/div>)`, 'gi'), (match, openTag, className, content, closeTag) => {
    // Check if content is wrapped in code blocks or contains unprocessed LaTeX
    if (content.includes('<pre><code') || 
        (content.includes('$$') && !content.includes('math-display')) || 
        (content.includes('$') && !content.includes('math-inline') && !content.includes('math-display'))) {
      
      // Extract all content from <pre><code> blocks
      let processedContent = content;
      const codeBlockRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
      let codeMatch;
      
      while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
        const codeContent = codeMatch[1];
        // Decode HTML entities
        const decodedContent = codeContent
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/<span[^>]*>/g, '') // Remove highlight.js spans
          .replace(/<\/span>/g, '');
        
        // Process the decoded content
        const processed = processHtmlBlockContent(decodedContent);
        // Replace the code block with processed content
        processedContent = processedContent.replace(codeMatch[0], processed);
      }
      
      // If there are still code blocks or unprocessed LaTeX, process everything
      if (processedContent.includes('<pre><code') || 
          (processedContent.includes('$$') && !processedContent.includes('math-display')) ||
          (processedContent.includes('$') && !processedContent.includes('math-inline') && !processedContent.includes('math-display'))) {
        // Remove all code blocks and process the remaining content
        const cleanedContent = processedContent.replace(/<pre><code[^>]*>[\s\S]*?<\/code><\/pre>/gi, '');
        const finalProcessed = processHtmlBlockContent(cleanedContent);
        processedContent = finalProcessed;
      }
      
      return `${openTag}${processedContent}${closeTag}`;
    }
    return match;
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

