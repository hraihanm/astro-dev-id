# Multiple Choice Problem Import Guide

This guide explains how to import multiple choice problems from Markdown files into the system.

## Markdown Format

The system expects Markdown files with the following structure:

```markdown
# Soal Pilihan Ganda

## Question 1 text here with optional $\LaTeX$ equations

### Option A text

### Option B text

### Option C text

### Option D text

### Option E text

<solution_title> Jawaban: C

Solution explanation goes here with optional $\LaTeX$ equations and images.

More solution text...

## Question 2 text here

### Option A

### Option B

...
```

### Format Rules:

1. **Title (Optional)**: Single `#` heading at the start (will be skipped)
2. **Questions**: Each question starts with `##` heading
3. **Options**: Each option starts with `###` heading
4. **Solution Marker**: `<solution_title> Jawaban: X` where X is A, B, C, D, or E
5. **Solution Text**: Everything after the solution marker until the next question
6. **Images**: Standard Markdown image syntax `![alt](path)` supported in questions, options, and solutions
7. **LaTeX**: Dollar signs for inline math `$x^2$` and double dollars for display math `$$x^2$$`

## Example Question

```markdown
## $\alpha$ Tauri merupakan bintang raksasa merah dengan luminositas $439\ L_{\odot}$ dan temperatur permukaan $3900\ K$. Berapakah radius bintang ini?

### 12 $R_{\odot}$

### 11 $R_{\odot}$

### 9,5 $R_{\odot}$

### 46,1 $R_{\odot}$

### 8,7 $R_{\odot}$

<solution_title> Jawaban: D

Dari persamaan luminositas bintang,

$$ L = 4\pi R^{2}\sigma T^{4},\ \ L \propto R^{2}T^{4}$$

Kita dapat bandingkan dengan Matahari,

$$\frac{R}{R_{\odot}} = \left( \frac{L}{L_{\odot}} \right)^{\frac{1}{2}}\left( \frac{T}{T_{\odot}} \right)^{- 2}$$
```

## API Endpoints

### 1. Import to Course

**Endpoint**: `POST /api/admin/mc/import`

**Form Data**:
- `file`: Markdown file (.md)
- `courseId`: Course ID (required)
- `title`: Quiz title (optional, defaults to "Soal Pilihan Ganda")
- `chapterId`: Chapter ID (optional)

**Example**:
```javascript
const formData = new FormData();
formData.append('file', markdownFile);
formData.append('courseId', '123');
formData.append('title', 'Astronomy Quiz');

const response = await fetch('/api/admin/mc/import', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// { success: true, problemCount: 5, quiz: {...}, problems: [...] }
```

### 2. Import Standalone

**Endpoint**: `POST /api/admin/mc/import-standalone`

**Form Data**:
- `file`: Markdown file (.md)
- `title`: Quiz title (required)

**Example**:
```javascript
const formData = new FormData();
formData.append('file', markdownFile);
formData.append('title', 'Standalone Quiz');

const response = await fetch('/api/admin/mc/import-standalone', {
  method: 'POST',
  body: formData
});
```

## Output Format

The problems are stored as JSON in the database:

```json
{
  "type": "multiple-choice-problem-set",
  "problems": [
    {
      "id": 1,
      "question": "Question text with $\\LaTeX$",
      "questionImages": ["path/to/image.png"],
      "options": [
        {
          "id": "A",
          "text": "Option A text",
          "images": []
        },
        {
          "id": "B",
          "text": "Option B text",
          "images": []
        }
      ],
      "correctAnswer": "B",
      "solution": "Explanation text",
      "solutionImages": []
    }
  ]
}
```

## Testing

A test file is provided to verify the parser works correctly:

```bash
# Test the parser with sample data
ts-node src/lib/parsers/__test__/mc-problem.test.ts
```

## Error Handling

The parser will:
- Skip questions without options
- Skip questions without solution markers
- Log warnings for malformed questions
- Continue parsing remaining questions on error

Common errors:
- **"No options found"**: Ensure options start with `###`
- **"No solution marker found"**: Ensure `<solution_title> Jawaban: X` is present
- **"No problems found"**: Ensure questions start with `##`

## Migration from Old Formats

If you have questions in a different format, you can:
1. Convert them to this Markdown format
2. Use the DOCX converter (`src/lib/docx-converter.ts`) to convert Word documents
3. Write a custom parser following the pattern in `src/lib/parsers/mc-problem.ts`

## Integration with Frontend

To create an upload UI:

```typescript
<form onsubmit={handleSubmit}>
  <input type="file" name="file" accept=".md" required />
  <input type="text" name="title" placeholder="Quiz Title" required />
  <input type="number" name="courseId" placeholder="Course ID (optional)" />
  <button type="submit">Import Questions</button>
</form>

<script>
async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const endpoint = formData.get('courseId') 
    ? '/api/admin/mc/import' 
    : '/api/admin/mc/import-standalone';
    
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    alert(`Imported ${result.problemCount} questions!`);
  }
}
</script>
```

## Related Files

- Parser: `src/lib/parsers/mc-problem.ts`
- API (Course): `src/pages/api/admin/mc/import.ts`
- API (Standalone): `src/pages/api/admin/mc/import-standalone.ts`
- Test: `src/lib/parsers/__test__/mc-problem.test.ts`
- Essay Import: `src/pages/api/admin/essay/import.ts` (similar pattern)

