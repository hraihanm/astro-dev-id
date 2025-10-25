# Handling Large Files in Chapter Editor

## The Issue

When saving chapters with large content (over 1MB), you may encounter:
- `431 Request Header Fields Too Large` error
- Slow save times
- Browser timeouts

## Solutions Implemented

### 1. Server Configuration Updated ✅

**File: `astro.config.mjs`**
- Increased Vite chunk size limits
- Optimized server settings

**File: `server.config.js`**
- JSON body limit: 10MB
- URL-encoded limit: 10MB
- Header size: 16KB

### 2. Client-Side Improvements ✅

**File Size Monitoring:**
- Real-time size display
- Color-coded warnings:
  - Gray: < 1MB (OK)
  - Yellow: 1-5MB (Warning)
  - Red: > 5MB (Large!)

**Smart Handling:**
- Warning dialog for files > 5MB
- Loading indicator during save
- Better error messages
- Disabled submit button during save

### 3. Restart Required ⚠️

After implementing these fixes, **restart your dev server**:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Best Practices for Large Content

### Option 1: Split Into Multiple Chapters

Instead of one huge chapter, split into smaller ones:

**Bad:**
```
Chapter 1: Everything About Math (10MB)
```

**Good:**
```
Chapter 1: Introduction (500KB)
Chapter 2: Basic Concepts (800KB)
Chapter 3: Advanced Topics (600KB)
Chapter 4: Applications (400KB)
```

### Option 2: Use External Resources

For very large content:

1. **Upload images separately** - Don't embed huge base64 images
2. **Link to external PDFs** - Instead of embedding
3. **Use external video links** - YouTube, Vimeo, etc.

### Option 3: Optimize Content

**Compress Images:**
```markdown
<!-- Bad: Inline base64 image (100KB+) -->
![image](data:image/png;base64,iVBORw0KG...)

<!-- Good: External link -->
![image](https://your-cdn.com/image.jpg)
```

**Remove Unnecessary Content:**
- Delete unused sections
- Remove redundant whitespace
- Minimize inline data

### Option 4: Progressive Loading

For truly massive content, consider:
- Load sections on-demand
- Use pagination within chapters
- Implement "Read More" sections

## File Size Guidelines

| Size | Status | Recommendation |
|------|--------|----------------|
| < 100 KB | ✅ Excellent | Ideal size |
| 100 KB - 500 KB | ✅ Good | No issues |
| 500 KB - 1 MB | ⚠️ Warning | Consider splitting |
| 1 MB - 5 MB | ⚠️ Large | Split recommended |
| > 5 MB | ❌ Too Large | Must split |

## Technical Details

### Current Limits

**Server Side:**
- Max JSON body: 10MB
- Max URL-encoded: 10MB
- Max header size: 16KB

**Client Side:**
- Warning threshold: 5MB
- Confirmation required: > 5MB
- Recommended max: 2MB per chapter

**Browser:**
- Varies by browser
- Generally 10-50MB
- May timeout on slow connections

### Why Large Files Are Problematic

1. **Performance:**
   - Slow loading times
   - High memory usage
   - Browser lag

2. **User Experience:**
   - Long wait times
   - Potential crashes
   - Poor mobile experience

3. **Technical Issues:**
   - Request size limits
   - Database storage
   - Backup size

## What to Do If You Hit Limits

### Error: "Content is too large"

**Solution 1: Split the Chapter**
```bash
# Instead of:
Chapter 1: All Content (6MB)

# Do:
Chapter 1a: Part 1 (2MB)
Chapter 1b: Part 2 (2MB)
Chapter 1c: Part 3 (2MB)
```

**Solution 2: Use External Storage**
```markdown
# Link to external resources
[Download Full Content (PDF)](https://example.com/content.pdf)

# Embed only essential parts
## Summary
Key points here...

## Full Details
For complete information, see the [full document](link).
```

**Solution 3: Optimize Content**
```bash
# Remove:
- Embedded images (use links instead)
- Redundant explanations
- Duplicate content
- Excessive whitespace

# Keep:
- Essential text
- Important equations
- Key concepts
```

### Error: "Request Header Fields Too Large"

This typically means the total request (including all data) exceeds limits.

**Quick Fix:**
1. Check content size (look at size indicator)
2. If > 5MB, split into smaller chapters
3. Save each part separately
4. Link chapters together

### Error: "Timeout"

If save takes too long:

1. **Check your connection** - Slow network?
2. **Reduce file size** - Split content
3. **Try again** - Temporary server issue?
4. **Contact admin** - May need server upgrade

## Monitoring Content Size

The chapter editor now shows real-time size:

**Bottom right of content textarea:**
- Green/Gray: Safe to save
- Yellow: Consider splitting
- Red: Likely to fail

**Before saving:**
- Check the size indicator
- If red, split the content
- If yellow, consider splitting

## Example: Splitting Large Content

### Before (One Large Chapter - 8MB)

```markdown
# Complete Guide to Calculus

## Introduction
[Long text...]

## Derivatives
[Long text with many examples...]

## Integrals
[Long text with many examples...]

## Applications
[Long text with many examples...]

## Advanced Topics
[Long text with many examples...]
```

### After (Multiple Smaller Chapters)

**Chapter 1: Introduction (1MB)**
```markdown
# Introduction to Calculus
[Introduction content only]

[Next Chapter: Derivatives →](/courses/calculus/chapter/2)
```

**Chapter 2: Derivatives (2MB)**
```markdown
# Derivatives
[← Previous: Introduction](/courses/calculus/chapter/1)

[Derivatives content]

[Next Chapter: Integrals →](/courses/calculus/chapter/3)
```

**Chapter 3: Integrals (2MB)**
```markdown
# Integrals
[← Previous: Derivatives](/courses/calculus/chapter/2)

[Integrals content]

[Next Chapter: Applications →](/courses/calculus/chapter/4)
```

## Summary

✅ **Server limits increased** to 10MB
✅ **Size monitoring** added to editor
✅ **Smart warnings** for large files
✅ **Better error handling** implemented

⚠️ **Recommendations:**
- Keep chapters under 2MB
- Split large content
- Use external links for big resources
- Monitor the size indicator

🎯 **Best Practice:**
- Focus on quality over quantity
- Break content into digestible chunks
- Link related chapters
- Optimize for student experience

---

**Need Help?**
- Check the size indicator while editing
- Look for the yellow/red warnings
- Split content if prompted
- Test save with smaller sections first

