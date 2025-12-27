# Markdown Renderer Unification Proposal

## Current State Analysis

### Problems Identified

1. **Code Duplication**: `renderMarkdown` logic duplicated across 7+ files:
   - `src/lib/latex.ts` (server-side, chapter pages)
   - `src/pages/quizzes/[id].astro` (client-side)
   - `src/pages/quizzes/[id]/review/[attemptId].astro` (client-side)
   - `src/pages/quizzes/[id]/results.astro` (client-side)
   - `src/pages/admin/quizzes/[id]/edit.astro` (client-side, editor preview)
   - `src/pages/admin/courses/[courseId]/chapters/[chapterId]/edit.astro` (client-side, editor preview)
   - `src/pages/admin/courses/[courseId]/chapters/new.astro` (client-side, editor preview)

2. **Hardcoded Image Attributes**: Currently only supports `{width=300px}`, hardcoded in regex across all files

3. **Inconsistent Processing**: Each file has slightly different implementations:
   - Some use `escapeHtml` differently
   - Some have DOMPurify sanitization (review page)
   - Some process HTML blocks (chapter editor)
   - Some don't

4. **Limited Attribute Support**: Only `width` is supported, but Pandoc/Marp support:
   - `width`, `height`, `alt`, `class`, `id`, `style`, `scale`, `align`

### Current Technology Stack

- **Markdown Parser**: `marked` v11.0.0 (NPM package for server, CDN for client)
- **Math Renderer**: KaTeX (client-side only, loaded from CDN)
- **Special Features**: Custom HTML blocks (definition, theorem, example, etc.)

---

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Markdown Renderer                │
│                  src/lib/markdown-renderer/                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │  Core Renderer   │────────▶│  Image Processor  │       │
│  │  (marked.js)    │         │  (Pandoc-style)   │       │
│  └──────────────────┘         └──────────────────┘       │
│           │                            │                   │
│           ▼                            ▼                   │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │  Math Processor  │         │  HTML Block       │       │
│  │  (LaTeX)         │         │  Processor        │       │
│  └──────────────────┘         └──────────────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Client Bundle (for browser use)                 │     │
│  │  markdown-renderer-client.ts                     │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Solution 1: Unified Module with Shared Core (Recommended)

#### Structure

```
src/lib/markdown-renderer/
├── core.ts                    # Core rendering logic (shared)
├── image-processor.ts         # Pandoc-style image attribute parsing
├── math-processor.ts          # LaTeX processing
├── html-block-processor.ts    # Custom HTML block handling
├── client.ts                  # Client-side bundle (exports to window)
└── types.ts                   # TypeScript types
```

#### Key Features

1. **Pandoc-Style Image Attributes**:
   ```markdown
   ![](image.png){width=300px}
   ![](image.png){width=50% height=200px}
   ![](image.png){class=diagram id=fig1}
   ![](image.png){style="border:1px solid black;"}
   ![](image.png){scale=0.5}
   ![](image.png){align=center}
   ![](image.png){width=300px class=diagram align=right}
   ```

2. **Unified Processing Pipeline**:
   ```typescript
   // Server-side
   import { renderMarkdown } from '@/lib/markdown-renderer/core';
   const html = renderMarkdown(content, { 
     processHtmlBlocks: true,  // For chapters
     sanitize: false            // Server-side doesn't need DOMPurify
   });

   // Client-side
   import { renderMarkdownClient } from '@/lib/markdown-renderer/client';
   const html = renderMarkdownClient(content, {
     sanitize: true  // Use DOMPurify for user-generated content
   });
   ```

3. **Custom Marked Renderer**:
   Use `marked`'s custom renderer API to handle images properly:
   ```typescript
   import { marked } from 'marked';
   
   const renderer = new marked.Renderer();
   renderer.image = (href, title, text) => {
     // Parse Pandoc-style attributes from title or custom syntax
     const attrs = parseImageAttributes(title);
     return `<img src="${href}" alt="${text}" ${attrs} />`;
   };
   ```

---

## Implementation Plan

### Phase 1: Create Unified Core Module

**File: `src/lib/markdown-renderer/core.ts`**

```typescript
import { marked } from 'marked';
import { processImageAttributes } from './image-processor';
import { processMath } from './math-processor';
import { processHtmlBlocks } from './html-block-processor';

export interface RenderOptions {
  processHtmlBlocks?: boolean;  // For chapter content
  sanitize?: boolean;          // Use DOMPurify (client-side)
  baseUrl?: string;            // For relative image URLs
}

export function renderMarkdown(
  content: string, 
  options: RenderOptions = {}
): string {
  // 1. Normalize newlines
  // 2. Process HTML blocks (if enabled)
  // 3. Process images with attributes
  // 4. Process math (LaTeX)
  // 5. Parse markdown with marked
  // 6. Restore HTML blocks
  // 7. Sanitize (if enabled)
  // 8. Return HTML
}
```

**File: `src/lib/markdown-renderer/image-processor.ts`**

```typescript
/**
 * Parse Pandoc-style image attributes: ![](img.png){width=300px class=diagram}
 * Supports: width, height, alt, class, id, style, scale, align
 */
export interface ImageAttributes {
  width?: string;
  height?: string;
  alt?: string;
  class?: string;
  id?: string;
  style?: string;
  scale?: number;
  align?: 'left' | 'center' | 'right';
}

export function parseImageAttributes(attrString: string): ImageAttributes {
  // Parse {width=300px class=diagram align=center}
  // Return structured object
}

export function buildImageHtml(
  src: string, 
  alt: string, 
  attrs: ImageAttributes
): string {
  // Build <img> tag with all attributes
  // Handle scale, align, etc.
}
```

### Phase 2: Create Client Bundle

**File: `src/lib/markdown-renderer/client.ts`**

```typescript
// Client-side bundle that can be loaded in browser
// Exports to window.markdownRenderer for use in .astro files

import DOMPurify from 'dompurify';  // Only in client bundle
import { renderMarkdown } from './core';

export function renderMarkdownClient(
  content: string,
  options: RenderOptions = {}
): string {
  const html = renderMarkdown(content, {
    ...options,
    sanitize: true  // Always sanitize client-side
  });
  
  return DOMPurify.sanitize(html);
}

// Export to window for use in <script> tags
if (typeof window !== 'undefined') {
  (window as any).markdownRenderer = {
    render: renderMarkdownClient
  };
}
```

### Phase 3: Refactor Existing Files

Replace all duplicated `renderMarkdown` functions with imports:

```typescript
// Before (in quiz pages)
function renderMarkdown(text) {
  // 50+ lines of duplicated code
}

// After
import { renderMarkdownClient } from '@/lib/markdown-renderer/client';
// Or use window.markdownRenderer.render() in <script> tags
```

---

## Library Options Comparison

### Option A: Stick with `marked` + Custom Extensions (Recommended)

**Pros:**
- ✅ Already using it (v11.0.0)
- ✅ Lightweight and fast
- ✅ Good custom renderer API
- ✅ Works server-side and client-side
- ✅ No breaking changes needed

**Cons:**
- ⚠️ Need to implement Pandoc attributes ourselves
- ⚠️ No built-in attribute parsing

**Implementation:**
- Use `marked`'s custom renderer for images
- Pre-process markdown to extract attributes before parsing
- Post-process HTML to add attributes

---

### Option B: Switch to `markdown-it` + Plugins

**Pros:**
- ✅ Rich plugin ecosystem
- ✅ `markdown-it-attrs` plugin supports `{attr=value}` syntax
- ✅ `markdown-it-implicit-figures` for figure support
- ✅ More extensible

**Cons:**
- ❌ Need to migrate from `marked`
- ❌ Different API
- ❌ Slightly larger bundle size
- ❌ Breaking change

**Example:**
```typescript
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItImplicitFigures from 'markdown-it-implicit-figures';

const md = MarkdownIt()
  .use(markdownItAttrs)
  .use(markdownItImplicitFigures);
```

---

### Option C: Use `remark` (Unified/Remark Ecosystem)

**Pros:**
- ✅ Very powerful and extensible
- ✅ Plugin ecosystem
- ✅ Used by many modern tools
- ✅ AST-based (more control)

**Cons:**
- ❌ Steeper learning curve
- ❌ More complex setup
- ❌ Overkill for current needs
- ❌ Breaking change

---

## Recommendation: Option A (marked + Custom Extensions)

**Why:**
1. **Minimal disruption**: Already using `marked`, no migration needed
2. **Sufficient**: Can implement Pandoc attributes with custom renderer
3. **Performance**: Lightweight and fast
4. **Compatibility**: Works everywhere we need it

**Implementation Strategy:**

1. **Pre-process markdown** to extract image attributes:
   ```typescript
   // Before marked parsing
   ![](img.png){width=300px class=diagram}
   ↓
   ![](img.png)<!--IMAGE_ATTR:{"width":"300px","class":"diagram"}-->
   ```

2. **Use custom renderer** to inject attributes:
   ```typescript
   renderer.image = (href, title, text) => {
     const attrs = extractAttributesFromComment(title);
     return buildImageHtml(href, text, attrs);
   };
   ```

3. **Or use marked's tokenizer** to customize image parsing

---

## Migration Path

### Step 1: Create Unified Module (Non-Breaking)
- Create `src/lib/markdown-renderer/` structure
- Implement core rendering logic
- Add Pandoc-style image attribute support
- Test with existing content

### Step 2: Create Client Bundle
- Build client-side bundle
- Export to `window.markdownRenderer`
- Test in browser

### Step 3: Migrate Files One by One
- Start with quiz pages (simpler, no HTML blocks)
- Then admin editors
- Finally chapter pages (most complex)

### Step 4: Remove Duplicated Code
- Delete old `renderMarkdown` functions
- Update imports
- Test thoroughly

---

## Example Usage After Migration

### Server-Side (Chapter Pages)
```typescript
// src/pages/courses/[slug]/chapter/[order].astro
import { renderMarkdown } from '@/lib/markdown-renderer/core';

const renderedContent = renderMarkdown(chapter.content, {
  processHtmlBlocks: true  // Enable custom HTML blocks
});
```

### Client-Side (Quiz Pages)
```html
<!-- src/pages/quizzes/[id].astro -->
<script>
  import { renderMarkdownClient } from '@/lib/markdown-renderer/client';
  
  function renderMarkdown(text) {
    return renderMarkdownClient(text, {
      sanitize: true
    });
  }
  
  // Use renderMarkdown() as before
</script>
```

### Client-Side (Editor Preview)
```html
<!-- src/pages/admin/quizzes/[id]/edit.astro -->
<script src="/lib/markdown-renderer-client.js"></script>
<script>
  function renderMarkdown(text) {
    return window.markdownRenderer.render(text);
  }
</script>
```

---

## Benefits

1. ✅ **Single Source of Truth**: One implementation, used everywhere
2. ✅ **Pandoc Compatibility**: Full attribute support
3. ✅ **Easier Maintenance**: Fix bugs in one place
4. ✅ **Better Testing**: Can unit test the core module
5. ✅ **Type Safety**: TypeScript types for options and attributes
6. ✅ **Extensibility**: Easy to add new features (e.g., video embeds)

---

## Next Steps

1. **Review this proposal** - Does this approach work for you?
2. **Decide on library** - Stick with `marked` or switch?
3. **Create implementation** - I can start building the unified module
4. **Test migration** - Migrate one file at a time
5. **Documentation** - Update docs with new usage

---

## Questions to Consider

1. **DOMPurify**: Should we always sanitize client-side, or make it optional?
2. **Image URLs**: Do we need base URL rewriting for relative paths?
3. **Backward Compatibility**: Should we support old `{width=300px}` syntax during migration?
4. **Performance**: Any concerns about bundle size for client-side code?
5. **Testing**: Do you want unit tests for the renderer?

