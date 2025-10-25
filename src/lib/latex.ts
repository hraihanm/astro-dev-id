import katex from 'katex';
import { marked } from 'marked';

export function renderLatex(content: string): string {
  // Process LaTeX blocks (display mode)
  const latexBlockRegex = /\$\$([\s\S]*?)\$\$/g;
  let processed = content.replace(latexBlockRegex, (match, latex) => {
    try {
      return katex.renderToString(latex, { 
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000'
      });
    } catch (error: any) {
      return `<div class="latex-error bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        LaTeX Error: ${error.message}
      </div>`;
    }
  });
  
  // Process inline LaTeX
  const latexInlineRegex = /\$([^$]+)\$/g;
  processed = processed.replace(latexInlineRegex, (match, latex) => {
    try {
      return katex.renderToString(latex, { 
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000'
      });
    } catch (error: any) {
      return `<span class="latex-error text-red-600">LaTeX Error: ${error.message}</span>`;
    }
  });
  
  return processed;
}

export function renderMarkdown(content: string): string {
  const processed = renderLatex(content);
  return marked(processed);
}

