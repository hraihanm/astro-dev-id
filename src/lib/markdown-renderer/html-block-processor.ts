/**
 * HTML block processor for custom blocks (definition, theorem, example, etc.)
 * Used in chapter content to preserve custom HTML structures
 */

import { HTML_BLOCK_CLASSES, CONTENT_DIV_CLASSES } from '../markdown-blocks';
import { processDisplayMath, processInlineMath, restoreMathBlocks } from './math-processor';
import { marked } from 'marked';

/**
 * Process markdown and LaTeX inside HTML block content
 */
function processHtmlBlockContent(content: string): string {
  if (!content) return '';
  
  // Process display math blocks
  const displayResult = processDisplayMath(content);
  let processed = displayResult.processed;
  
  // Process inline math
  const inlineResult = processInlineMath(processed);
  processed = inlineResult.processed;
  
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
  
  // Restore math blocks
  const allMathBlocks = [...displayResult.blocks, ...inlineResult.blocks];
  html = restoreMathBlocks(html, allMathBlocks);
  
  return html;
}

/**
 * Process HTML blocks in markdown content
 * Extracts custom HTML blocks (definition, theorem, etc.) and processes their content
 */
export function processHtmlBlocks(content: string): { 
  processed: string; 
  blocks: string[] 
} {
  const blocks: string[] = [];
  const classPattern = HTML_BLOCK_CLASSES.join('|');
  
  // Match HTML blocks with nested divs - use a balanced match approach
  const processed = content.replace(
    new RegExp(`(<div\\s+class="(${classPattern})"[^>]*>)([\\s\\S]*?)(<\\/div>)`, 'gi'),
    (match, openTag, className, blockContent, closeTag) => {
      // Check if this is actually the matching closing tag (simple check)
      // Count opening and closing divs in content
      const openDivs = (blockContent.match(/<div/gi) || []).length;
      const closeDivs = (blockContent.match(/<\/div>/gi) || []).length;
      
      // If content has balanced divs, this is likely the correct match
      // Otherwise, we'll process what we have (marked.js will handle the rest)
      if (openDivs === closeDivs || openDivs === 0) {
        // Process markdown and LaTeX inside the HTML block
        const processedContent = processHtmlBlockContent(blockContent);
        const placeholder = `\u200B\u200BHTMLBLOCK${blocks.length}\u200B\u200B`;
        blocks.push(`${openTag}${processedContent}${closeTag}`);
        return placeholder;
      }
      
      // If divs aren't balanced, return original (let marked.js handle it)
      return match;
    }
  );
  
  return { processed, blocks };
}

/**
 * Restore HTML blocks after markdown parsing
 */
export function restoreHtmlBlocks(html: string, blocks: string[]): string {
  let result = html;
  
  for (let i = 0; i < blocks.length; i++) {
    const placeholder = `\u200B\u200BHTMLBLOCK${i}\u200B\u200B`;
    result = result.split(placeholder).join(blocks[i]);
    const escapedPlaceholder = placeholder.replace(/\u200B/g, '&#8203;');
    result = result.split(escapedPlaceholder).join(blocks[i]);
  }
  
  return result;
}

/**
 * Post-process content divs inside HTML blocks
 * Handles cases where marked.js wrapped content in <pre><code> tags
 */
export function postProcessContentDivs(html: string): string {
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
          
          // Check if content needs processing
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
              
              // Add text before this code block
              const textBefore = content.slice(lastIndex, codeMatch.index);
              fullContent += textBefore;
              
              // Extract and decode code block content
              const codeContent = codeMatch[1];
              
              // Remove highlight.js spans but preserve their text content
              let decodedContent = codeContent
                .replace(/<span[^>]*>/g, '')
                .replace(/<\/span>/g, '');
              
              // Decode HTML entities comprehensively
              decodedContent = decodedContent
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&nbsp;/g, ' ')
                .replace(/&#8203;/g, '\u200B')
                .replace(/&#x200B;/gi, '\u200B');
              
              // Decode numeric HTML entities
              decodedContent = decodedContent.replace(/&#(\d+);/g, (match, code) => {
                const num = parseInt(code, 10);
                if (num === 8203) return '\u200B';
                if (num >= 32 && num <= 126) return String.fromCharCode(num);
                return match;
              });
              
              // Decode hex HTML entities
              decodedContent = decodedContent.replace(/&#x([0-9a-fA-F]+);/gi, (match, hex) => {
                const num = parseInt(hex, 16);
                if (num === 0x200B) return '\u200B';
                if (num >= 32 && num <= 126) return String.fromCharCode(num);
                return match;
              });
              
              fullContent += decodedContent;
              lastIndex = codeMatch.index + codeMatch[0].length;
            }
            
            // Add any remaining text after the last code block
            if (hasCodeBlocks) {
              const textAfter = content.slice(lastIndex);
              fullContent += textAfter;
            } else {
              fullContent = content;
            }
            
            // Clean up
            fullContent = fullContent.trim();
            
            // Process the combined content
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
  let result = html;
  processedDivs.forEach(({start, end, replacement}) => {
    result = result.slice(0, start) + replacement + result.slice(end);
  });
  
  return result;
}

