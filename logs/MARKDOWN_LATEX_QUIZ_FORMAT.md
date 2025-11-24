# Markdown + LaTeX Quiz Format

## Clean, Professional Format for Your Astro Site

### Why This Format?

1. **Already Works**: Your site renders Markdown + LaTeX perfectly
2. **No Custom Parsers**: Uses existing KaTeX renderer
3. **Easy to Write**: Clean, readable syntax
4. **Professional**: Similar to academic standards
5. **Flexible**: Supports math, tables, images, everything

---

## Format Specification

### Syntax

```markdown
---
# Metadata (optional)
title: "Physics Quiz Chapter 3"
course: "physics-101"
---

# Quiz Title

## Question 1

[Question text with tables, LaTeX math, images, etc.]

**Correct Answer:** 2

**Options:**
1. [option A content]
2. [option B content] ← This is the correct answer
3. [option C content]
4. [option D content]
5. [option E content]

---

## Question 2

[Another question with more content]

**Correct Answer:** 4

**Options:**
1. Option A
2. Option B
3. Option C
4. Option D  ← Correct
5. Option E

...
```

---

## Real Example from Your Data

### Original Indonesian Format:
```
%ModelSoal-PGK%
Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

| Panjang gelombang (nm) | Temperatur (K) |
|------------------------|----------------|
| 2897,77                | 1000           |
| 1931,85                | 1500           |
...

%OPTK1_A_3% $$x = (3 \times 10^6)y^{-1}$$
%OPTK2_A_3% $x = (3 \times 10^{-6})x^{-1}$   
...
%doc%
```

### Converted Markdown Format:

```markdown
## Question 1: Temperature-Wavelength Relationship

Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

| Panjang gelombang (nm) | Temperatur (K) |
|------------------------|----------------|
| 2897,77                | 1000           |
| 1931,85                | 1500           |
| 1448,89                | 2000           |
| 1159,11                | 2500           |
| 965,924                | 3000           |
| 827,935                | 3500           |
| 724,443                | 4000           |
| 643,949                | 4500           |
| 579,554                | 5000           |
| 526,867                | 5500           |
| 482,962                | 6000           |
| 445,811                | 6500           |
| 413,967                | 7000           |
| 386,369                | 7500           |
| 362,221                | 8000           |
| 340,914                | 8500           |
| 321,975                | 9000           |
| 305,029                | 9500           |
| 289,777                | 10000          |

**Correct Answer:** 2

**Options:**
1. $$x = (3 \times 10^{-6})x^{-1}$$
2. $$x = (3 \times 10^6)y^{-1}$$
3. $$y = (3 \times 10^6)x^{-1}$$
4. $$y = (3 \times 10^{-6})x^{-1}$$
5. $$y = (3 \times 10^6)x^{-2}$$

---

## Question 2: Sunrise Observation

Jika suatu hari seorang pengamat melihat Matahari terbit tepat dari arah timur, maka pernyataan yang benar adalah

**Correct Answer:** 1

**Options:**
1. Pengamatan kemungkinan dilakukan sekitar tanggal 21 Maret
2. Posisi pengamat berada di selatan ekuator
3. Pengamatan kemungkinan dilakukan sekitar tanggal 22 Juni
4. Posisi pengamat berada di utara ekuator
5. Pengamatan kemungkinan dilakukan sekitar tanggal 23 September
```

---

## Handling Images

```markdown
## Question 3: Star Radius Calculation

Untuk bintang A pada gambar, jejarinya adalah 900 jejari Matahari. 
Modulus jarak bintang A adalah (diketahui jejari Matahari = $6.96 \times 10^{10}$ cm, 
1 radian = 206 265 detik busur, 1 parseks = $3.086 \times 10^{18}$ cm, asumsikan $\alpha$ sangat kecil)

![Star Diagram](../images/figure_7.jpg)

**Correct Answer:** 2

**Options:**
1. 16,6
2. 20,9
3. 11,6
4. 6,6
5. 15,9
```

---

## Complex Questions with Formulas

```markdown
## Question 4: Day Length Calculation

Seorang pengamat menghitung panjang siang hari di lokasi dia berada. 
Ternyata di hari itu, panjang siang tercatat lebih dari 12 jam. 

Jika panjang siang bisa dihitung dengan rumus

\[
\cos H = -\tan\phi\tan\delta_{\odot}
\]

dengan $\phi$ = lintang pengamat, $\delta_{\odot}$ = deklinasi Matahari, 
H = sudut jam Matahari saat di horizon, dan 2H adalah panjang siang, 
maka apa yang bisa disimpulkan terkait lokasi dan waktu pengamatan?

**Correct Answer:** 3

**Options:**
1. Pengamat berada di Bumi belahan utara, dan waktu pengamatan antara 21 Maret – 23 September
2. Pengamat berada di Bumi belahan utara, dan waktu pengamatan antara 23 September – 21 Maret
3. Pengamat berada di Bumi belahan selatan, dan waktu pengamatan antara 21 Maret – 23 September
4. Pengamat berada di Bumi belahan selatan, dan waktu pengamatan antara 23 September – 21 Maret
5. Pengamat berada di ekuator, atau waktu pengamatan tanggal 21 Maret atau 23 September
```

---

## Parser Implementation

I'll create a simple parser to convert this Markdown format to your system's JSON:

```typescript
// src/lib/parsers/quiz-markdown.ts

interface QuizQuestion {
  id: number;
  type: 'multiple-choice';
  question: string;      // Can contain LaTeX
  options: string[];     // Can contain LaTeX
  correctAnswer: number; // 0-indexed
  images?: string[];
}

export function parseMarkdownQuiz(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Split by ## Question headers
  const questionBlocks = content.split(/^## Question \d+:/gm);
  
  for (const [index, block] of questionBlocks.entries()) {
    if (!block.trim()) continue;
    
    // Extract question text (before "Correct Answer:")
    const questionMatch = block.match(/^(.+?)(?=\*\*Correct Answer)/s);
    if (!questionMatch) continue;
    
    // Extract correct answer number
    const correctAnswerMatch = block.match(/\*\*Correct Answer:\*\*\s*(\d+)/);
    if (!correctAnswerMatch) continue;
    
    const correctAnswer = parseInt(correctAnswerMatch[1]) - 1; // Convert to 0-indexed
    
    // Extract options
    const options: string[] = [];
    const optionRegex = /^\d+\.\s*(.+)$/gm;
    const optionMatches = block.matchAll(optionRegex);
    
    for (const match of optionMatches) {
      options.push(match[1].trim());
    }
    
    // Extract images
    const images: string[] = [];
    const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    const imageMatches = block.matchAll(imageRegex);
    for (const match of imageMatches) {
      images.push(match[1]);
    }
    
    questions.push({
      id: index,
      type: 'multiple-choice',
      question: questionMatch[1].trim(),
      options,
      correctAnswer,
      images
    });
  }
  
  return questions;
}
```

---

## Usage

### 1. Write Your Quiz File

Create `quizzes/physics-chapter-3.md`:

```markdown
# Physics Quiz: Chapter 3

## Question 1
[Your question here]
...

## Question 2
[Your question here]
...
```

### 2. Convert to System Format

```typescript
import { parseMarkdownQuiz } from './lib/parsers/quiz-markdown';
import { createQuiz } from './lib/quizzes';

const content = await Deno.readTextFile('quizzes/physics-chapter-3.md');
const questions = parseMarkdownQuiz(content);

const quiz = await createQuiz({
  courseId: 1,
  title: 'Physics Quiz: Chapter 3',
  questions,
  settings: {
    timeLimit: 30 * 60, // 30 minutes
    maxAttempts: 3
  }
});
```

### 3. Use in Your System

Students take the quiz with full LaTeX rendering, proper formatting, images, everything works!

---

## Benefits

✅ **Clean Syntax**: No custom markers, just Markdown  
✅ **LaTeX Support**: All math renders beautifully  
✅ **Images**: Standard Markdown image syntax  
✅ **Tables**: Standard Markdown tables  
✅ **Professional**: Used by many platforms  
✅ **Version Control**: Plain text, Git-friendly  
✅ **Easy Editing**: Use any Markdown editor  
✅ **No Compilation**: Works immediately  

---

## What Do You Want?

1. **Implement the converter** from Indonesian format → Markdown?
2. **Build the parser** to import Markdown quizzes?
3. **Create admin UI** for uploading/editing Markdown quizzes?
4. **All of the above**?

Let me know and I'll start implementation!

