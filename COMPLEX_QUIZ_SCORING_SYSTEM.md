# Complex Multiple Choice Scoring System

## Overview

This document describes the **Complex Multiple Choice** question type with penalty-based scoring, used commonly in academic institutions worldwide.

---

## How Other Institutions Handle Complex Multiple Choice

### Common Approaches:

1. **Penalty-Based (Your Request)** ✅
   - Each correct answer: +1/N points
   - Each incorrect answer: -1/N points  
   - Minimum score: 0 (no negatives)
   - **Used by:** MIT, Caltech, many European universities
   - **Advantage:** Prevents guessing, rewards partial knowledge

2. **All-or-Nothing**
   - Full points only if ALL correct answers selected
   - Zero points otherwise
   - **Used by:** Most basic LMS systems
   - **Your current system uses this for `multiple-select`**

3. **Partial Credit**
   - If 2 out of 3 correct: 2/3 of points
   - Simpler than penalty-based
   - **Used by:** Canvas, Blackboard, many US universities

4. **No Negative Points**
   - Correct answers: +points
   - Incorrect answers: 0 points (no penalty)
   - **Used by:** Some non-penalty systems

---

## Scoring Formula

### Your Chosen System: Penalty-Based

```
For a question with N correct answers:

Score = max(0, (correct_selections / N) - (incorrect_selections / N))
```

### Example Calculations:

**Question:** 3 correct answers out of 5 options
- Correct answers: A, C, E
- Value per answer: 1/3 = 0.333 points

**Case 1: Student selects A, B, C, D**
- Correct selections: A, C = 2
- Incorrect selections: B, D = 2
- Points: (2/3) - (2/3) = 0
- ✅ No penalty, just no points

**Case 2: Student selects A, C, E**
- Correct selections: A, C, E = 3
- Incorrect selections: 0
- Points: (3/3) - (0/3) = 1.0
- ✅ Full marks!

**Case 3: Student selects A, C, E, B**
- Correct selections: A, C, E = 3
- Incorrect selections: B = 1
- Points: (3/3) - (1/3) = 2/3 = 0.667
- ✅ Partial credit

**Case 4: Student selects B, D**
- Correct selections: 0
- Incorrect selections: B, D = 2
- Points: (0/3) - (2/3) = -0.667 → max(0, -0.667) = 0
- ✅ Minimum score is 0, no negative points

---

## Format Specification

### Markdown Format with Complex MC Support

```markdown
## Question 1: Simple Multiple Choice

What is the capital of France?

**Type:** simple
**Correct Answer:** 2

**Options:**
1. London
2. Paris
3. Berlin
4. Madrid
5. Rome

---

## Question 2: Complex Multiple Choice

Which of the following are prime numbers? (Select all correct)

**Type:** complex
**Correct Answers:** 1, 3, 5

**Options:**
1. 2
2. 4
3. 7
4. 8
5. 11

---

## Question 3: Another Complex MC with LaTeX

Which equations are correct? (Select all that apply)

**Type:** complex
**Correct Answers:** 2, 4

**Options:**
1. $x^2 + y^2 = z$
2. $E = mc^2$
3. $a = \frac{b}{c}$
4. $\int_0^1 x dx = \frac{1}{2}$
5. $F = ma^2$
```

---

## Implementation

### Step 1: Update Scoring Logic

```typescript
// src/lib/scoring.ts

function evaluateQuestion(question: any, userAnswer?: QuizAnswer): QuestionResult {
  const maxPoints = 1;
  let points = 0;
  let isCorrect = false;

  if (!userAnswer) {
    return {
      questionId: question.id || 0,
      question,
      userAnswer: [],
      correctAnswer: question.correctAnswer,
      isCorrect: false,
      points: 0,
      maxPoints
    };
  }

  switch (question.type) {
    case 'multiple-choice':
      // Simple: 1 correct answer
      isCorrect = userAnswer.answer[0] === parseInt(question.correctAnswer);
      points = isCorrect ? maxPoints : 0;
      break;
      
    case 'multiple-select':
      // All-or-nothing
      const userSelections = userAnswer.answer.sort();
      const correctSelections = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer.sort() 
        : [question.correctAnswer];
      isCorrect = JSON.stringify(userSelections) === JSON.stringify(correctSelections);
      points = isCorrect ? maxPoints : 0;
      break;
      
    case 'complex-multiple-choice':  // NEW TYPE
      points = evaluateComplexMultipleChoice(question, userAnswer);
      // For complex MC, "correct" means points > 0
      isCorrect = points > 0;
      break;
      
    case 'text':
      const userText = (userAnswer.answer[0] || '').toString().toLowerCase().trim();
      const correctText = question.correctAnswer.toString().toLowerCase().trim();
      isCorrect = userText === correctText;
      points = isCorrect ? maxPoints : 0;
      break;
      
    case 'number':
      const userNumber = parseFloat(userAnswer.answer[0]);
      const correctNumber = parseFloat(question.correctAnswer);
      const tolerance = question.tolerance || 0.01;
      isCorrect = Math.abs(userNumber - correctNumber) <= tolerance;
      points = isCorrect ? maxPoints : 0;
      break;
  }

  return {
    questionId: question.id || 0,
    question,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    points,
    maxPoints
  };
}

// NEW FUNCTION: Penalty-based scoring
function evaluateComplexMultipleChoice(question: any, userAnswer: QuizAnswer): number {
  // Ensure correctAnswer is array
  const correctAnswers = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];
  
  const N = correctAnswers.length; // Number of correct answers
  if (N === 0) return 0;
  
  // Convert to sorted number arrays for comparison
  const userSelections = userAnswer.answer.map(a => parseInt(a)).sort();
  const correctSelections = correctAnswers.map(a => parseInt(a)).sort();
  
  // Count correct and incorrect selections
  let correctCount = 0;
  let incorrectCount = 0;
  
  for (const selection of userSelections) {
    if (correctSelections.includes(selection)) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }
  
  // Calculate points using penalty-based formula
  // Score = (correct_selections / N) - (incorrect_selections / N)
  const score = (correctCount / N) - (incorrectCount / N);
  
  // Ensure minimum is 0 (no negative scores)
  return Math.max(0, score);
}
```

### Step 2: Markdown Parser

```typescript
// src/lib/parsers/quiz-markdown.ts

interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'complex-multiple-choice' | 'text' | 'number';
  question: string;
  options: string[];
  correctAnswer: number | number[];  // number for simple, array for complex
  scoringMode?: 'simple' | 'complex';
}

export function parseMarkdownQuiz(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Split by ## Question headers
  const questionBlocks = content.split(/^## /gm);
  
  for (const [index, block] of questionBlocks.entries()) {
    if (!block.trim() || !block.includes('Question')) continue;
    
    // Extract question text (before "Type:")
    const textMatch = block.match(/Question[\d:]*\s*([\s\S]*?)(?=\*\*Type:)/);
    if (!textMatch) continue;
    
    const questionText = textMatch[1].trim();
    
    // Extract type
    const typeMatch = block.match(/\*\*Type:\*\*\s*(simple|complex)/);
    const questionType = typeMatch ? typeMatch[1] : 'simple';
    
    // Extract correct answer(s)
    const correctAnswerMatch = block.match(/\*\*Correct Answer[s]?:\*\*\s*([0-9,\s]+)/);
    if (!correctAnswerMatch) continue;
    
    const correctAnswers = correctAnswerMatch[1]
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    
    // Determine if simple or complex
    const isSimple = questionType === 'simple' || correctAnswers.length === 1;
    const scoringMode = isSimple ? 'simple' : 'complex';
    
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
      type: isSimple ? 'multiple-choice' : 'complex-multiple-choice',
      question: questionText,
      options,
      correctAnswer: isSimple ? correctAnswers[0] : correctAnswers,
      scoringMode
    });
  }
  
  return questions;
}
```

---

## Markdown Format Examples

### Simple Multiple Choice
```markdown
## Question 1

Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

[table content here]

**Type:** simple
**Correct Answer:** 2

**Options:**
1. $$x = (3 \times 10^{-6})x^{-1}$$
2. $$x = (3 \times 10^6)y^{-1}$$
3. $$y = (3 \times 10^6)x^{-1}$$
4. $$y = (3 \times 10^{-6})x^{-1}$$
5. $$y = (3 \times 10^6)x^{-2}$$
```

### Complex Multiple Choice
```markdown
## Question 2

Which of the following statements about light are correct? (Select all that apply)

**Type:** complex
**Correct Answers:** 1, 3, 5

**Options:**
1. Light travels at a constant speed in vacuum
2. Light requires a medium to travel
3. Light exhibits wave-particle duality
4. Light travels faster than sound
5. Light can be polarized
```

### Complex with Tables/LaTeX
```markdown
## Question 3

Based on the data table, which relationships are true? (Select all correct)

| X | Y |
|---|---|
| 1 | 2 |
| 2 | 4 |
| 3 | 6 |

**Type:** complex
**Correct Answers:** 2, 4

**Options:**
1. $y = x + 1$
2. $y = 2x$
3. $y = x^2$
4. $y/x = 2$
5. $y = x - 1$
```

---

## Benefits of This Approach

✅ **Prevents Guessing**: Students can't blindly select all options  
✅ **Rewards Partial Knowledge**: Get points for knowing some answers  
✅ **Fair Scoring**: Negative points penalize wrong choices, but floor at 0  
✅ **Professional**: Used by top institutions worldwide  
✅ **Flexible**: Works for 2-5 correct answers per question  

---

## Next Steps

1. Implement the scoring function in `src/lib/scoring.ts`
2. Add the Markdown parser
3. Update quiz creation UI to support complex MC
4. Add visual indicator for complex questions (e.g., "Select ALL correct")

Ready to implement?

