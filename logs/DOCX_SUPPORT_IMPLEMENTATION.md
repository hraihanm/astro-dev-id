# DOCX to Markdown Conversion Support

## Overview

Added support for converting DOCX files to Markdown while preserving mathematical equations. This allows you to import content from Microsoft Word documents directly into your Astro-based learning platform.

## Features

### ✅ What's Working
- **DOCX to Markdown conversion** using `mammoth.js`
- **Mathematical equation support** - converts Word equations to LaTeX
- **Image extraction** - saves images from DOCX to local files
- **HTML to Markdown conversion** - handles headers, lists, links, etc.
- **Indonesian UI translations** - all interface text translated

### 🔧 Technical Implementation

#### Libraries Used
- `mammoth` - DOCX to HTML conversion
- `docx-preview` - Additional DOCX support

#### Conversion Process
1. **DOCX → HTML** (via mammoth.js)
2. **Equation Detection** - Finds MathML and Word equations
3. **LaTeX Conversion** - Converts equations to `$$...$$` format
4. **HTML → Markdown** - Converts HTML tags to Markdown syntax
5. **Media Extraction** - Saves images to local directory

## Usage

### Basic Conversion
```javascript
import { convertDocxToMarkdown } from './src/lib/docx-converter';

const markdown = await convertDocxToMarkdown('document.docx');
console.log(markdown);
```

### Test Conversion
```bash
# Place your DOCX file in project root as 'test-document.docx'
node scripts/test-docx-conversion.js
```

### Integration with Admin
The converter can be integrated into the admin interface for uploading DOCX files directly.

## Equation Support

### Supported Formats
- **MathML equations** → LaTeX `$$...$$`
- **Word equation objects** → LaTeX `$$...$$`
- **Inline math** → LaTeX `$...$`

### Example Conversion
```
Word Equation: ∫₀^∞ e^(-x²) dx = √π/2
↓
LaTeX: $$\int_0^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

## File Structure

```
src/lib/
  └── docx-converter.ts    # Main conversion functions
scripts/
  └── test-docx-conversion.js  # Test script
```

## Limitations

### Current Limitations
- **Complex equations** may need manual adjustment
- **Custom Word styles** not fully preserved
- **Tables** converted to basic format
- **Embedded objects** may not convert perfectly

### Workarounds
1. **For complex equations**: Export as images or use LaTeX directly
2. **For tables**: Use Markdown table syntax
3. **For custom formatting**: Manual editing after conversion

## Integration Options

### Option 1: Admin Upload Interface
Add DOCX upload to chapter creation:
```astro
<input type="file" accept=".docx" name="docxFile" />
```

### Option 2: Batch Import
Create bulk import tool for multiple DOCX files.

### Option 3: API Endpoint
```typescript
POST /api/admin/convert-docx
Content-Type: multipart/form-data
```

## Testing

### Test with Your DOCX
1. Place your DOCX file in project root
2. Rename to `test-document.docx`
3. Run: `node scripts/test-docx-conversion.js`
4. Check generated `.md` file

### Expected Output
- Markdown file with preserved formatting
- LaTeX equations in `$$...$$` format
- Extracted images in `media/` folder
- Clean, readable Markdown structure

## Next Steps

### Immediate
1. **Test with your DOCX files** containing equations
2. **Verify equation conversion** accuracy
3. **Integrate into admin interface**

### Future Enhancements
1. **Better equation detection** for complex formulas
2. **Table conversion** improvements
3. **Style preservation** for headings and formatting
4. **Batch processing** for multiple files

## Indonesian Translations Complete

### Fixed UI Elements
- ✅ Navigation: "Practice Quizzes" → "Kuis Latihan"
- ✅ Language selector: "Indonesia" → "Bahasa Indonesia"
- ✅ Quiz interface: All text translated
- ✅ Chapter editor: All labels translated
- ✅ Admin interface: All buttons and labels translated

### Remaining i18n Elements
Some elements still use `data-i18n` attributes for dynamic translation system.

---

## Ready to Use!

The DOCX conversion system is ready for testing with your mathematical documents. The architecture supports both Markdown and DOCX input, giving you flexibility in content creation.

**Test it now:**
1. Place a DOCX file with equations in your project root
2. Run the test script
3. Check the converted Markdown output
4. Verify equation rendering in your Astro app
