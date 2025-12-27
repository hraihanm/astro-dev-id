/**
 * Pandoc-style image attribute processor
 * Supports: ![](img.png){width=300px class=diagram align=center}
 */

import type { ImageAttributes } from './types';

/**
 * Parse Pandoc-style image attributes from markdown
 * Format: ![](img.png){width=300px class=diagram align=center}
 */
export function parseImageAttributes(attrString: string): ImageAttributes {
  const attrs: ImageAttributes = {};
  
  if (!attrString || !attrString.trim()) {
    return attrs;
  }

  // Remove curly braces if present
  let clean = attrString.trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    clean = clean.slice(1, -1).trim();
  }

  // Split by spaces, but preserve quoted strings
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      current += char;
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim());
  }

  // Parse each token: key=value or key="value"
  for (const token of tokens) {
    const equalIndex = token.indexOf('=');
    if (equalIndex === -1) continue;

    const key = token.substring(0, equalIndex).trim();
    let value = token.substring(equalIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    switch (key.toLowerCase()) {
      case 'width':
        attrs.width = value;
        break;
      case 'height':
        attrs.height = value;
        break;
      case 'alt':
        attrs.alt = value;
        break;
      case 'class':
        attrs.class = value;
        break;
      case 'id':
        attrs.id = value;
        break;
      case 'style':
        attrs.style = value;
        break;
      case 'scale':
        const scale = parseFloat(value);
        if (!isNaN(scale)) {
          attrs.scale = scale;
        }
        break;
      case 'align':
        if (value === 'left' || value === 'center' || value === 'right') {
          attrs.align = value;
        }
        break;
    }
  }

  return attrs;
}

/**
 * Build HTML img tag from attributes
 */
export function buildImageHtml(
  src: string,
  alt: string,
  attrs: ImageAttributes
): string {
  const parts: string[] = [];
  
  // Escape HTML in src and alt
  const safeSrc = escapeHtml(src);
  const safeAlt = escapeHtml(alt || '');
  
  parts.push(`src="${safeSrc}"`);
  if (safeAlt) {
    parts.push(`alt="${safeAlt}"`);
  }

  // Build style attribute
  const styles: string[] = [];
  
  if (attrs.width) {
    styles.push(`width: ${escapeHtml(attrs.width)}`);
  }
  
  if (attrs.height) {
    styles.push(`height: ${escapeHtml(attrs.height)}`);
  }
  
  if (attrs.scale && attrs.scale !== 1) {
    const scalePercent = Math.round(attrs.scale * 100);
    styles.push(`transform: scale(${attrs.scale})`);
    // Adjust width/height if scale is applied
    if (!attrs.width && !attrs.height) {
      styles.push(`max-width: ${scalePercent}%`);
    }
  }
  
  // Always add max-width: 100% for responsiveness unless explicitly overridden
  if (!attrs.style || !attrs.style.includes('max-width')) {
    styles.push('max-width: 100%');
  }
  
  // Always add height: auto to maintain aspect ratio
  if (!attrs.height && !attrs.style?.includes('height')) {
    styles.push('height: auto');
  }
  
  // Handle alignment
  if (attrs.align) {
    if (attrs.align === 'left') {
      styles.push('float: left; margin-right: 1rem');
    } else if (attrs.align === 'right') {
      styles.push('float: right; margin-left: 1rem');
    } else if (attrs.align === 'center') {
      styles.push('display: block; margin-left: auto; margin-right: auto');
    }
  }
  
  // Merge with existing style if present
  if (attrs.style) {
    // Parse existing style and merge
    const existingStyles = attrs.style.split(';').map(s => s.trim()).filter(Boolean);
    styles.push(...existingStyles);
  }
  
  if (styles.length > 0) {
    parts.push(`style="${styles.join('; ')}"`);
  }

  // Add class
  if (attrs.class) {
    parts.push(`class="${escapeHtml(attrs.class)}"`);
  }

  // Add id
  if (attrs.id) {
    parts.push(`id="${escapeHtml(attrs.id)}"`);
  }

  return `<img ${parts.join(' ')} />`;
}

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
 * Process images with Pandoc-style attributes in markdown
 * Converts ![](img.png){width=300px} to HTML before markdown parsing
 */
export function processImageAttributes(content: string): string {
  // Pattern: ![](img.png){attributes} or ![alt](img.png){attributes}
  // Match the entire image markdown including attributes
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (match, alt, src, attrs) => {
    const imageAttrs = parseImageAttributes(attrs);
    return buildImageHtml(src, alt, imageAttrs);
  });
}

