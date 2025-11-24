# Quiz UI - Interactive Student Interface

## Overview

New modern quiz interface inspired by professional online exam platforms, designed for optimal student experience during quiz/exam sessions.

## Features Implemented

### 1. **Two-Panel Layout**

**Main Panel (Left):**
- Question display area
- Answer options with visual feedback
- Navigation controls
- Timer display

**Sidebar (Right):**
- Question number grid
- Status indicators
- Statistics counter
- Submit button

### 2. **Question Navigation**

**Grid Navigation:**
- Visual grid showing all question numbers
- Click any number to jump to that question
- Color-coded status:
  - 🟢 **Green** = Answered
  - 🟠 **Orange** = Flagged (Ragu-ragu)
  - ⚪ **Gray** = Unanswered
- Current question has blue ring highlight

**Sequential Navigation:**
- ← Previous button
- → Next button
- Auto-disables at boundaries

### 3. **Timer System**

- Countdown timer if time limit is set
- Format: `HH:MM:SS`
- Auto-submit when time expires
- Hidden if no time limit configured

### 4. **Answer Tracking**

**Simple Multiple Choice:**
- Radio buttons for single answer
- Selected option highlighted in blue

**Complex Multiple Choice:**
- Checkboxes for multiple answers
- Purple indicator badge
- Array-based answer storage

**Visual Feedback:**
- Options highlight on hover (gray)
- Selected options have blue background
- Border changes to blue when selected

### 5. **Flag/Doubt System**

- 🚩 **Ragu-Ragu** button to mark questions for review
- Flagged questions show orange in grid
- Toggle on/off
- Separate counter in sidebar

### 6. **Statistics Panel**

Real-time counters showing:
- ✅ Sudah dijawab (Answered)
- 🚩 Ragu-ragu (Flagged for review)
- ⚪ Belum dijawab (Unanswered)

Auto-updates as student answers questions

### 7. **Solution Display**

- Collapsible "Lihat Pembahasan" section
- Shows solution text with LaTeX
- Displays solution images if available
- Can be accessed during or after quiz (configurable)

### 8. **Submit Controls**

**Submit Button:**
- Red "Hentikan Ujian" button in sidebar
- Confirmation dialog if unanswered questions exist
- Shows count of unanswered questions

**Auto-Submit:**
- Triggered when timer reaches 0
- Or when clicking "Selesai" on last question

### 9. **Responsive Design**

- Fixed sidebar (80px width)
- Flexible main area
- Scrollable question content
- Sticky header and footer
- Mobile-friendly (can be enhanced)

## User Flow

### Starting the Quiz

1. Quiz loads with question 1 displayed
2. Timer starts (if configured)
3. All questions shown as "unanswered" (gray) in grid
4. Student sees question count and time limit

### Answering Questions

1. Read question with rendered LaTeX
2. Select answer option(s)
3. Option highlights blue
4. Grid icon turns green
5. Counter updates

### Marking for Review

1. Click "🚩 Ragu-Ragu" button
2. Question marked orange in grid
3. Can continue to other questions
4. Flagged counter increments

### Navigating

**Methods:**
- Click question number in grid
- Use Previous/Next buttons
- All answers preserved during navigation

### Submitting

1. Click "Hentikan Ujian"
2. Warning if questions unanswered
3. Confirmation dialog
4. Submit to API
5. Redirect to results page

## Technical Implementation

### State Management

```javascript
let currentQuestionIndex = 0;           // Current question being viewed
let answers = new Array(n).fill(null);  // Answer storage
let flaggedQuestions = new Set();       // Flagged question indices
let startTime = Date.now();             // For time tracking
```

### Answer Storage Format

**Simple Multiple Choice:**
```javascript
answers[0] = 2;  // Selected option 2 (B)
```

**Complex Multiple Choice:**
```javascript
answers[1] = [1, 3, 4];  // Selected options 1 (A), 3 (C), 4 (D)
```

### API Submission

```javascript
POST /api/quiz/submit
{
  quizId: 11,
  answers: [
    { questionId: 0, answer: [2] },
    { questionId: 1, answer: [1, 3, 4] }
  ],
  timeSpent: 450  // seconds
}
```

## Styling Classes

### Question Number Badges

```css
.question-number.answered   → Green background
.question-number.flagged    → Orange background
.question-number.unanswered → Gray background
.question-number.current    → Blue ring
```

### Option Labels

```css
.option-label              → Base styling
.option-label:hover        → Gray hover state
.option-label.selected     → Blue selected state
```

## Configuration Options

### Quiz Settings (via database)

```json
{
  "type": "multiple-choice",
  "timeLimit": 3600,        // seconds (1 hour)
  "maxAttempts": 3,
  "showSolutionsAfter": true
}
```

### Question Metadata

```json
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 2,
  "metadata": {
    "solution": "Solution text with $LaTeX$",
    "solutionImages": ["path/to/image.png"]
  }
}
```

## Future Enhancements

### Possible Additions

1. **Batch View Mode**
   - Show 10 questions per page
   - Pagination controls
   - Quick scan mode

2. **Review Mode**
   - After submission, show all answers
   - Highlight correct/incorrect
   - Show explanations

3. **Progress Bar**
   - Visual progress indicator
   - Percentage completed

4. **Keyboard Shortcuts**
   - Arrow keys for navigation
   - Number keys for answers
   - F for flag
   - Enter to submit

5. **Auto-Save**
   - Save answers to localStorage
   - Resume if connection lost
   - Draft mode

6. **Analytics**
   - Time spent per question
   - Answer change tracking
   - Confidence scoring

7. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode
   - Font size controls

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ⚠️ Works but can be optimized

## Performance Notes

- LaTeX rendered client-side (KaTeX)
- Questions loaded once, rendered dynamically
- No page reloads during navigation
- Smooth transitions
- Minimal re-renders

## Related Files

- Quiz display: `src/pages/quizzes/[id].astro`
- Quiz API: `src/pages/api/quiz/submit.ts` (to be created)
- Parser: `src/lib/parsers/mc-problem.ts`
- LaTeX helper: `src/lib/latex.ts`

