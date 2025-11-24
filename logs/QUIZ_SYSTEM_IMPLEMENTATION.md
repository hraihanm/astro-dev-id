# Quiz System Implementation Summary

## What's Been Implemented

### ✅ 1. Complex Multiple Choice Scoring

**File:** `src/lib/scoring.ts`

Added new question type: `complex-multiple-choice` with **penalty-based scoring**:

- Each correct answer: +1/N points
- Each incorrect answer: -1/N points
- Minimum score: 0 (no negative scores)

**Example:**
- 3 correct answers out of 5 options
- Student selects 2 correct, 1 wrong
- Score: (2/3) - (1/3) = 1/3 = 0.33 points

---

### ✅ 2. Markdown Parser

**File:** `src/lib/parsers/quiz-markdown.ts`

Parser that converts Markdown quiz files to system-compatible JSON.

**Supports:**
- Simple multiple choice
- Complex multiple choice (multiple correct answers)
- LaTeX math notation
- Images
- Tables

---

## Format Specification

### Simple Multiple Choice

```markdown
## Question 1

Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

| Column A | Column B |
|----------|----------|
| Data 1   | Data 2   |

**Type:** simple
**Correct Answer:** 2

**Options:**
1. Option A with $inline math$
2. Option B with $$display math$$
3. Option C
4. Option D
5. Option E
```

### Complex Multiple Choice

```markdown
## Question 2

Which of the following are prime numbers? Select all that apply.

**Type:** complex
**Correct Answers:** 1, 3, 5

**Options:**
1. 2
2. 4
3. 7
4. 8
5. 11
```

---

## How Institutions Handle Complex MC

### 1. **Penalty-Based** (You - MIT/Caltech style) ✅
```
Score = max(0, correct/N - incorrect/N)
```
- Rewards partial knowledge
- Prevents guessing
- Floor at 0

### 2. **All-or-Nothing** (Your old system)
```
Score = 1 if all correct, else 0
```
- Simple, but harsh
- No partial credit

### 3. **Percentage-Based** (Canvas/Blackboard)
```
Score = correct_count / total_correct
```
- Simple partial credit
- No penalties

### 4. **No Penalty** (Some systems)
```
Score = correct_count / total_options
```
- Only rewards, never penalizes

---

## Usage Example

### 1. Create a Markdown Quiz File

Create `quizzes/physics-chapter-3.md`:

```markdown
# Physics Quiz: Chapter 3

## Question 1: Simple MC

What is $E = mc^2$?

**Type:** simple
**Correct Answer:** 1

**Options:**
1. Energy-mass equivalence
2. Force equation
3. Wave equation
4. Quantum equation
5. Relativistic equation

---

## Question 2: Complex MC

Which are correct statements about light? (Select all that apply)

**Type:** complex
**Correct Answers:** 1, 3, 5

**Options:**
1. Light travels at constant speed in vacuum
2. Light requires a medium
3. Light exhibits wave-particle duality
4. Light travels slower than sound
5. Light can be polarized

---

## Question 3: With Image

![Figure](images/figure_1.jpg)

Based on the diagram, which statements are true?

**Type:** complex
**Correct Answers:** 2, 4

**Options:**
1. Point A is closer to the source
2. Point B has higher intensity
3. Point C is in the shadow
4. Point D is at maximum amplitude
5. Point E is at minimum
```

### 2. Import to Your System

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

---

## Scoring Examples

### Question: 3 correct answers (B, D, E)

| Student Selection | Correct | Incorrect | Calculation | Score |
|-------------------|---------|-----------|-------------|-------|
| B, D, E (all correct) | 3 | 0 | (3/3) - (0/3) | **1.00** ✅ |
| B, D (2 correct) | 2 | 0 | (2/3) - (0/3) | **0.67** |
| B, D, A (2 correct, 1 wrong) | 2 | 1 | (2/3) - (1/3) | **0.33** |
| B (1 correct) | 1 | 0 | (1/3) - (0/3) | **0.33** |
| A, C (all wrong) | 0 | 2 | (0/3) - (2/3) | **0.00** |
| B, A, C, D (2 correct, 2 wrong) | 2 | 2 | (2/3) - (2/3) | **0.00** |
| B, D, A, C (2 correct, 2 wrong) | 2 | 2 | (2/3) - (2/3) | **0.00** |

---

## Next Steps

### To Complete Implementation:

1. ✅ Scoring logic (DONE)
2. ✅ Markdown parser (DONE)
3. ⏳ Create import API endpoint
4. ⏳ Update quiz creation UI
5. ⏳ Add visual indicator for complex questions
6. ⏳ Test with real questions

Would you like me to:
- Create the import API endpoint?
- Update the admin UI for quiz creation?
- Create an example quiz file with your Indonesian questions?

Let me know what you'd like to tackle next!

