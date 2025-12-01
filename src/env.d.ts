/// <reference path="../.astro/types.d.ts" />

// Extend Window interface for KaTeX and custom functions
interface Window {
  katex?: {
    render: (latex: string, element: HTMLElement, options?: any) => void;
  };
  renderLatex?: () => void;
}