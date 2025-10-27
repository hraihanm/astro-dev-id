# Quiz/Problem Set Import System

## Problem Statement
You have Indonesian-format problem sets using custom markers that need to be imported into the Astro learning portal for student quizzes.

## Source Format Analysis

Your current format uses:
```
%ModelSoal-PGK%        # Question start marker
[Question text + LaTeX + images + tables]
%OPTK1_A_3%           # Option 1 (Markdown can contain LaTeX)
%OPTK2_A_3%           # Option 2
%OPTK3_A_3%           # Option 3
%OPTK4_A_3%           # Option 4
%OPTK5_A_3%           # Option 5
%doc%                  # Question end marker
```

Or alternative:
```
%OPTA ... %OPTB ... %OPTC ... %OPTD ... %OPTE ...
```

### Example from Your Data:
```
%ModelSoal-PGK%
Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

| Panjang gelombang (nm) | Temperatur (K) |
|------------------------|----------------|
| 2897,77                | 1000           |

%OPTK1\_A\_3% 
$$x = (3 \times 10^6)y^{-1}$$
  
%OPTK2\_A\_3% $x = (3 \times 10^{-6})x^{-1}$   
%OPTK3\_A\_3% $y = (3 \times 10^6)x^{-1}$   
%OPTK4\_A\_3% $y = (3 \times 10^{-6})x^{-1}$   
%OPTK5\_A\_3% $y = (3 \times 10^6)x^{-2}$   
%doc%
```

## Target System Format

Your Astro site expects JSON with this structure:
```typescript
{
  type: 'multiple-choice',           // or 'multiple-select', 'text', 'number'
  question: string,                   // Can contain Markdown + LaTeX
  options?: string[],                // Array of options (for multiple-choice)
  correctAnswer: number,              // Index of correct answer (0-based)
  images?: string[],                 // Image paths if applicable
  metadata?: {                         // Optional metadata
    category?: string,
    difficulty?: string,
    tags?: string[]
  }
}
```

## Proposed Solution

### Phase 1: Format Converter Tool

Create: `src/scripts/convert-indonesian-format.ts`

**Features:**
1. **Parser** - Extracts questions from your format
2. **LaTeX Preserver** - Maintains all `$...$` and `$$...$$` blocks
3. **Image Handler** - Detects `![](path)` and provides guidance for upload
4. **Option Mapper** - Converts `%OPTK1_A_3%` → options array
5. **Answer Detector** - Identifies correct answer (usually first option `OPTK1` = 0)

**Usage:**
```bash
node src/scripts/convert-indonesian-format.ts input-file.txt
```

**Output:** `converted-questions.json`

### Phase 2: Bulk Import API

Create: `src/pages/api/admin/quiz/bulk-import.ts`

**Flow:**
1. Admin uploads `.json` file
2. Validate question structure
3. Preview questions (with LaTeX rendered)
4. Admin confirms
5. Create quiz in database
6. Return success with quiz ID

### Phase 3: Admin UI Enhancement

Add to: `src/pages/admin/quizzes/create.astro`

**Features:**
- File upload for bulk import
- Question preview with rendered LaTeX
- Edit individual questions before saving
- Batch operations (select multiple to edit/delete)

## Implementation Plan

### Step 1: Parser Implementation

```typescript
// src/lib/parsers/indonesian-format.ts

interface ParseResult {
  question: string;
  options: string[];
  correctAnswer: number;
  images: string[];
  metadata?: {
    category?: string;
    difficulty?: string;
  };
}

export function parseIndonesianFormat(content: string): ParseResult[] {
  const questions: ParseResult[] = [];
  
  // Split by question markers
  const questionBlocks = content.split('%ModelSoal-PGK%').filter(block => block.trim());
  
  for (const block of questionBlocks) {
    const questionData: ParseResult = {
      question: '',
      options: [],
      correctAnswer: 0,
      images: [],
      metadata: {}
    };
    
    // Extract question text (between ModelSoal and first OPTK)
    const questionMatch = block.match(/^([^%]+?)(?=%OPT)/s);
    if (questionMatch) {
      questionData.question = questionMatch[1].trim();
      
      // Extract images
      const imageMatches = questionData.question.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);
      questionData.images = Array.from(imageMatches, m => m[2]);
    }
    
    // Extract options
    const optionPatterns = [
      /%OPTK1[^%]+%/,
      /%OPTK2[^%]+%/,
      /%OPTK3[^%]+%/,
      /%OPTK4[^%]+%/,
      /%OPTK5[^%]+%/,
    ];
    
    for (const pattern of optionPatterns) {
      const match = block.match(pattern);
      if (match) {
        // Remove marker, extract content
        const optionContent = match[0]
          .replace(/^%OPTK\d_[^%]+%/, '')
          .replace(/%doc%$/, '')
          .trim();
        questionData.options.push(optionContent);
      }
    }
    
    // Identify correct answer (usually first option with OPTK1)
    questionData.correctAnswer = 0; // Default to first option
    
    questions.push(questionData);
  }
  
  return questions;
}
```

### Step 2: Converter

```typescript
// src/lib/parsers/question-converter.ts

import { parseIndonesianFormat } from './indonesian-format';
import { createQuiz } from '../quizzes';

export interface ConversionOptions {
  courseId: number;
  quizTitle: string;
  timeLimit?: number;
  maxAttempts?: number;
}

export async function convertAndImport(
  content: string,
  options: ConversionOptions
) {
  // Parse Indonesian format
  const parsed = parseIndonesianFormat(content);
  
  // Convert to system format
  const questions = parsed.map((q, index) => ({
    id: index,
    type: 'multiple-choice',
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    images: q.images
  }));
  
  // Create quiz
  const quiz = await createQuiz({
    courseId: options.courseId,
    title: options.quizTitle,
    questions,
    settings: {
      timeLimit: options.timeLimit,
      maxAttempts: options.maxAttempts
    }
  });
  
  return quiz;
}
```

### Step 3: Import API

```typescript
// src/pages/api/admin/quiz/import.ts

import type { APIRoute } from 'astro';
import { convertAndImport } from '../../../lib/parsers/question-converter';

export const POST: APIRoute = async ({ request, cookies }) => {
  const userId = cookies.get('user_id')?.value;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const courseId = parseInt(formData.get('courseId') as string);
  const title = formData.get('title') as string;
  
  const content = await file.text();
  
  try {
    const quiz = await convertAndImport(content, {
      courseId,
      quizTitle: title
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      quiz,
      message: `Imported ${quiz.questions.length} questions`
    }));
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500
    });
  }
};
```

## Image Handling Strategy

**Option 1: Manual Upload** (Recommended for MVP)
- Parser extracts image references
- Admin manually uploads images via admin UI
- System maps local paths to uploaded paths

**Option 2: Automated**
- Parser detects images in quiz folder
- Copies to `/public/uploads/quizzes/[quiz-id]/`
- Updates paths automatically

## Example Workflow

1. **Prepare Source File**
   ```
   Save your .txt file: `questions/physics-chapter3.txt`
   ```

2. **Run Conversion**
   ```bash
   node src/scripts/convert-indonesian-format.ts questions/physics-chapter3.txt
   ```

3. **Review Output**
   - Open generated `converted-questions.json`
   - Verify LaTeX rendering
   - Check image references

4. **Upload via Admin**
   - Go to `/admin/quizzes/create`
   - Select course
   - Upload JSON file
   - Preview and confirm

5. **Complete**
   - Quiz created with all questions
   - Students can take quiz immediately

## Supported Features

✅ Multiple choice questions  
✅ LaTeX math notation  
✅ Markdown tables  
✅ Image references  
✅ Bulk import  
✅ Answer validation  
✅ Preview before import  

## Future Enhancements

- Multiple correct answers (multiple-select)
- Text answer questions
- Numeric answer with tolerance
- Image inline question display
- Question difficulty/weighting
- Automated image extraction from PDF source

## Questions to Address

1. **Correct Answer Detection**: How is correct answer indicated? Always first option?
2. **Images**: Where are source images stored? Need upload path?
3. **Large Files**: How many questions per file? Need pagination?
4. **Validation**: Any special validation rules for Indonesian exams?

