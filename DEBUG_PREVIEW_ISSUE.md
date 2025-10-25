# 🔍 Debug LaTeX Preview Issue

## Problem
LaTeX preview in chapter editor only shows markdown, not enhanced math rendering.

## Debugging Steps

### 1. **Test with Simple LaTeX**

**Go to chapter editor:**
```
http://localhost:3000/admin/courses/1/chapters/1/edit
```

**Add this test content:**
```markdown
# Test Chapter

Here's inline math: $E = mc^2$

And display math:
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
```

### 2. **Check Browser Console**

**Open Developer Tools** (F12 → Console)

**Click "Refresh Preview" button**

**Look for these debug messages:**
```
Preview button clicked
Content: # Test Chapter\n\nHere's inline math: $E = mc^2$...
Found inline math: E = mc^2
Found display math: \int_0^1 x^2 dx = \frac{1}{3}
Rendered HTML: <h1>Test Chapter</h1><p>Here's inline math: <span class="math-inline"...
Enhancing LaTeX preview...
Found math elements: 2
Math element 0: math-inline latex: E = mc^2
Math element 1: math-display latex: \int_0^1 x^2 dx = \frac{1}{3}
Enhanced math element 0
Enhanced math element 1
LaTeX preview enhanced
```

### 3. **Check What's Missing**

**If you see:**
- ✅ "Preview button clicked" - Button works
- ✅ "Found inline math" - LaTeX detection works
- ✅ "Found math elements: 2" - Elements found
- ❌ No "Enhanced math element" - Enhancement failing

**If you see:**
- ❌ No "Found inline math" - LaTeX not detected
- ❌ "Found math elements: 0" - No math elements found

### 4. **Check HTML Output**

**In Console, type:**
```javascript
document.getElementById('preview-content').innerHTML
```

**Should show:**
```html
<h1>Test Chapter</h1>
<p>Here's inline math: <span class="math-inline" data-latex="E = mc^2">
  <div class="math-content">
    <div class="math-raw">$E = mc^2$</div>
    <div class="math-rendered">E = mc²</div>
  </div>
</span></p>
```

## Common Issues

### Issue 1: LaTeX Not Detected
**Symptoms:** No "Found inline math" messages
**Cause:** Regex not matching LaTeX syntax
**Fix:** Check for extra spaces or wrong delimiters

### Issue 2: Math Elements Not Found
**Symptoms:** "Found math elements: 0"
**Cause:** HTML not properly generated
**Fix:** Check `renderMarkdown` function

### Issue 3: Enhancement Not Working
**Symptoms:** "Found math elements: 2" but no enhancement
**Cause:** `renderLatexPreview` function failing
**Fix:** Check `data-latex` attributes

### Issue 4: CSS Not Applied
**Symptoms:** HTML correct but no styling
**Cause:** CSS not loaded or conflicting
**Fix:** Check CSS classes and styles

## Test Cases

### Test 1: Simple Inline Math
**Input:** `$x^2$`
**Expected:** Boxed with rendered x²

### Test 2: Simple Display Math
**Input:**
```markdown
$$
E = mc^2
$$
```
**Expected:** Centered box with rendered E = mc²

### Test 3: Fractions
**Input:** `$\frac{a}{b}$`
**Expected:** Proper fraction layout

### Test 4: Greek Letters
**Input:** `$\alpha + \beta$`
**Expected:** α + β symbols

## Quick Fixes

### If LaTeX Not Detected
1. **Check syntax:** Use `$...$` not `$ ... $`
2. **Check delimiters:** Use `$$...$$` for display
3. **Check line breaks:** Display math needs line breaks

### If Enhancement Failing
1. **Check console errors**
2. **Verify `data-latex` attributes**
3. **Check CSS classes**

### If Styling Missing
1. **Check CSS is loaded**
2. **Verify class names**
3. **Check for conflicts**

## Expected Final Result

**Input:**
```markdown
# Test

Inline: $E = mc^2$

Display:
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
```

**Preview Should Show:**
- ✅ Heading: "Test"
- ✅ Inline math: Boxed with "E = mc²"
- ✅ Display math: Centered box with "∫₀¹ x² dx = ⅓"
- ✅ Proper styling and typography

---

**Run the test and check the console logs to identify the issue!**
