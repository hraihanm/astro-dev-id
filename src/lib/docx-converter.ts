import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

/**
 * Convert DOCX file to Markdown with equation support
 * Handles mathematical equations by preserving them as LaTeX
 */
export async function convertDocxToMarkdown(docxPath: string): Promise<string> {
  try {
    // Read DOCX file
    const buffer = fs.readFileSync(docxPath);
    
    // Convert DOCX to HTML first
    const result = await mammoth.convertToHtml({ buffer });
    
    // Convert HTML to Markdown-like format
    let markdown = result.value;
    
    // Handle mathematical equations
    // Look for MathML or equation objects and convert to LaTeX
    markdown = convertEquationsToLatex(markdown);
    
    // Convert HTML tags to Markdown
    markdown = convertHtmlToMarkdown(markdown);
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return markdown.trim();
  } catch (error) {
    console.error('Error converting DOCX to Markdown:', error);
    throw new Error(`Failed to convert DOCX: ${error.message}`);
  }
}

/**
 * Convert mathematical equations to LaTeX format
 */
function convertEquationsToLatex(html: string): string {
  // Handle MathML equations
  html = html.replace(/<math[^>]*>(.*?)<\/math>/gs, (match, content) => {
    // Convert MathML to LaTeX (basic conversion)
    let latex = content
      .replace(/<mi>(.*?)<\/mi>/g, '$1')
      .replace(/<mo>(.*?)<\/mo>/g, '$1')
      .replace(/<mn>(.*?)<\/mn>/g, '$1')
      .replace(/<msup>(.*?)<\/msup>/g, '^{$1}')
      .replace(/<msub>(.*?)<\/msub>/g, '_{$1}')
      .replace(/<mfrac>(.*?)<\/mfrac>/g, '\\frac{$1}{$2}')
      .replace(/<msqrt>(.*?)<\/msqrt>/g, '\\sqrt{$1}')
      .replace(/<mroot>(.*?)<\/mroot>/g, '\\sqrt[$2]{$1}')
      .replace(/<mtext>(.*?)<\/mtext>/g, '\\text{$1}')
      .replace(/<[^>]*>/g, '') // Remove remaining tags
      .trim();
    
    return `$$${latex}$$`;
  });
  
  // Handle Word equation objects (basic patterns)
  html = html.replace(/<span[^>]*class="[^"]*equation[^"]*"[^>]*>(.*?)<\/span>/gs, (match, content) => {
    // Try to extract mathematical content
    let latex = content.replace(/<[^>]*>/g, '').trim();
    if (latex) {
      return `$$${latex}$$`;
    }
    return match;
  });
  
  return html;
}

/**
 * Convert HTML tags to Markdown syntax
 */
function convertHtmlToMarkdown(html: string): string {
  // Headers
  html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gs, '# $1\n\n');
  html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gs, '## $1\n\n');
  html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gs, '### $1\n\n');
  html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gs, '#### $1\n\n');
  html = html.replace(/<h5[^>]*>(.*?)<\/h5>/gs, '##### $1\n\n');
  html = html.replace(/<h6[^>]*>(.*?)<\/h6>/gs, '###### $1\n\n');
  
  // Paragraphs
  html = html.replace(/<p[^>]*>(.*?)<\/p>/gs, '$1\n\n');
  
  // Bold and italic
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gs, '**$1**');
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gs, '**$1**');
  html = html.replace(/<em[^>]*>(.*?)<\/em>/gs, '*$1*');
  html = html.replace(/<i[^>]*>(.*?)<\/i>/gs, '*$1*');
  
  // Lists
  html = html.replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gs);
    if (items) {
      return items.map(item => {
        const text = item.replace(/<li[^>]*>(.*?)<\/li>/s, '$1').replace(/<[^>]*>/g, '').trim();
        return `- ${text}`;
      }).join('\n') + '\n\n';
    }
    return match;
  });
  
  html = html.replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gs);
    if (items) {
      return items.map((item, index) => {
        const text = item.replace(/<li[^>]*>(.*?)<\/li>/s, '$1').replace(/<[^>]*>/g, '').trim();
        return `${index + 1}. ${text}`;
      }).join('\n') + '\n\n';
    }
    return match;
  });
  
  // Links
  html = html.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs, '[$2]($1)');
  
  // Images
  html = html.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gs, '![$2]($1)');
  html = html.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gs, '![$1]($2)');
  
  // Code
  html = html.replace(/<code[^>]*>(.*?)<\/code>/gs, '`$1`');
  html = html.replace(/<pre[^>]*>(.*?)<\/pre>/gs, '```\n$1\n```\n\n');
  
  // Remove remaining HTML tags
  html = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  html = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return html;
}

/**
 * Extract images and media from DOCX
 */
export async function extractDocxMedia(docxPath: string, outputDir: string): Promise<string[]> {
  try {
    const buffer = fs.readFileSync(docxPath);
    const result = await mammoth.convertToHtml({ 
      buffer,
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    });
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Extract and save images
    const imageMatches = result.value.match(/<img[^>]*src="data:([^"]*)"[^>]*>/g);
    const savedImages: string[] = [];
    
    if (imageMatches) {
      imageMatches.forEach((match, index) => {
        const base64Match = match.match(/src="data:([^;]+);base64,([^"]+)"/);
        if (base64Match) {
          const mimeType = base64Match[1];
          const base64Data = base64Match[2];
          const extension = mimeType.split('/')[1] || 'png';
          const filename = `image_${index + 1}.${extension}`;
          const filepath = path.join(outputDir, filename);
          
          fs.writeFileSync(filepath, base64Data, 'base64');
          savedImages.push(filename);
        }
      });
    }
    
    return savedImages;
  } catch (error) {
    console.error('Error extracting media from DOCX:', error);
    return [];
  }
}

/**
 * Test function to convert a DOCX file
 */
export async function testDocxConversion(docxPath: string): Promise<void> {
  try {
    console.log(`Converting ${docxPath} to Markdown...`);
    
    const markdown = await convertDocxToMarkdown(docxPath);
    const outputPath = docxPath.replace('.docx', '.md');
    
    fs.writeFileSync(outputPath, markdown);
    console.log(`✅ Converted successfully: ${outputPath}`);
    console.log(`📄 Preview (first 500 chars):`);
    console.log(markdown.substring(0, 500) + '...');
    
    // Extract media
    const mediaDir = path.dirname(docxPath) + '/media';
    const images = await extractDocxMedia(docxPath, mediaDir);
    if (images.length > 0) {
      console.log(`🖼️  Extracted ${images.length} images to ${mediaDir}`);
    }
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
  }
}
