/// <reference path="../.astro/types.d.ts" />

// Extend Window interface for KaTeX and custom functions
interface Window {
  katex?: {
    render: (latex: string, element: HTMLElement, options?: any) => void;
  };
  renderLatex?: () => void;
}

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly AUTH_SECRET: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly EMAIL_FROM?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: string;
  readonly SMTP_USER?: string;
  readonly SMTP_PASS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}