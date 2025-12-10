# LaTeX Rendering Guide (Preview & Chapter Page)

## Key Files
- `src/lib/latex.ts` — server/client-safe markdown → HTML with math placeholders.
- `src/pages/courses/[slug]/chapter/[order].astro` — student-facing chapter page; calls `renderMarkdown`, splits blocks, loads KaTeX/HLJS in a small inline script.
- `src/pages/admin/courses/[courseId]/chapters/[chapterId]/edit.astro` — admin editor + live preview; client-side uses the same `renderMarkdown` logic (duplicated inside this page’s script block) and loads marked/KaTeX/HLJS from CDN.
- `src/styles/global.css` — prose and content block styles (definition/theorem/example, lists, tables).
- `src/lib/markdown-blocks.ts` — class lists for HTML block passthrough (definition, theorem, etc.).

## Rendering Pipeline (Student Chapter Page)
1. **Server** (`renderMarkdown` in `src/lib/latex.ts`)
   - Normalizes text; preserves HTML blocks by temporary placeholders.
   - Replaces `$$...$$` with `<div class="math-display" data-latex="...">{fallback}</div>`.
   - Replaces `$...$` with `<span class="math-inline" data-latex="...">{fallback}</span>`.
   - Parses remaining markdown via `marked` (GFM, breaks=true, headerIds off, mangle off).
   - Restores HTML blocks and content divs; post-processes to ensure math placeholders survive escaping.
   - Outputs HTML that still contains `math-display` / `math-inline` elements.
2. **Client** (`[order].astro` inline script)
   - Loads KaTeX CSS/JS (0.16.9) and Highlight.js CSS/JS (11.9.0) on demand.
   - On load, finds `.math-display` / `.math-inline`, reads `data-latex`, and runs `katex.render`. The fallback inner text we now inject prevents “empty bullets” before KaTeX paints.
   - Highlights code blocks with HLJS after math render.

## Rendering Pipeline (Admin Preview)
1. **Browser-side** (inside `edit.astro`)
   - Loads marked, KaTeX, HLJS from CDN.
   - Uses an in-page `renderMarkdown` (same placeholder strategy) to parse the editor content.
   - Writes HTML into `#preview-content`, then runs:
     - `processRemainingPlaceholders` / `processLatexInDOM` (fallback safety).
     - `renderLatexWithKaTeX` to paint math.
     - HLJS for code blocks.
   - Monaco editor provides markdown input; updates preview on debounce.
2. **Why same logic twice?**
   - Server uses `src/lib/latex.ts`.
   - Admin preview duplicates logic in the page script for zero round-trips while typing.

## Recent Fixes (Dec 2025)
- Inline/display math placeholders now include escaped raw LaTeX text inside the span/div (in `src/lib/latex.ts`) so bullets aren’t empty before KaTeX paints.
- Chapter page script now waits for DOMContentLoaded before loading/rendering KaTeX/HLJS.
- Chapter page script adds fallbacks:
  - Converts any remaining `$...$` / `$$...$$` text nodes to `.math-inline` / `.math-display` before render.
  - Wraps leading symbols before `=` inside list items (e.g., `L = ...`, `\sigma = ...`) into `.math-inline` so bullets render math like the admin preview.

## Styling Notes
- Lists are explicitly styled in `global.css` and `chapter-content` to counter Tailwind resets (`display: list-item`, `list-style-type` set).
- Content blocks (definition/theorem/example) styled in `global.css` for both `.chapter-content` and `.prose`.
- KaTeX font size tweaked via `.katex` and display margins set in `global.css`.

## Debugging Checklist
- Math missing? Inspect DOM for `.math-inline`/`.math-display` presence and `data-latex` value.
- Empty bullets? Ensure placeholder spans/divs still have inner text (fallback). If not, check `renderMarkdown` pipeline.
- CSS conflicts? Confirm list elements have `list-style-type` and `display: list-item`.
- KaTeX load? Check for the CDN link/script in `<head>` and `window.katex` existence.
- Highlighting? Verify HLJS script loaded and `hljs.highlightElement` runs on `pre code`.

## How to Trace Quickly
- Student view flow: `chapter content` → `renderMarkdown` (`src/lib/latex.ts`) → HTML with math placeholders → `[order].astro` inline script renders math.
- Admin preview flow: editor value → page-level `renderMarkdown` (in `edit.astro` script) → HTML with math placeholders → same page renders math.

## Suggested Improvements (optional)
- DRY: import `renderMarkdown` into the admin preview instead of maintaining a duplicated version.
- Consider Tailwind Typography plugin for markdown instead of manual prose styles.
