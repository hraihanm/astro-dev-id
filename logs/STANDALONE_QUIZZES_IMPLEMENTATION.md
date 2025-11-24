# Standalone Quizzes Implementation

## Summary

Implemented support for standalone "try out" quizzes that are **not** tied to any course, plus sample content to get you started.

---

## ✅ What's Been Implemented

### 1. **Database Schema Updates**
**File:** `prisma/schema.prisma`

- Made `courseId` nullable in the `Quiz` model
- Standalone quizzes have `courseId: null`
- Course quizzes still work as before

**Run these commands to apply changes:**
```bash
npx prisma db push
# Or create a migration:
npx prisma migrate dev --name add_standalone_quizzes
```

### 2. **Library Functions**
**File:** `src/lib/quizzes.ts`

Added three new functions:
- `getStandaloneQuizzes()` - Get all standalone quizzes
- `getAllQuizzes()` - Get all quizzes (both types)
- Updated `createQuiz()` - Now accepts nullable `courseId`

### 3. **API Endpoints**

**GET** `/api/quiz/standalone`
- Returns all standalone quizzes
- Requires authentication
- Parses questions and settings automatically

**POST** `/api/admin/quiz/create-standalone`
- Creates a new standalone quiz
- Requires admin authentication
- Accepts: title, description, timeLimit, maxAttempts, questions

**Existing endpoints still work:**
- `/api/quiz/submit` - Handles both standalone and course quizzes
- No changes needed

### 4. **Sample Quiz Content**
**Directory:** `sample-quizzes/`

Created 3 ready-to-use quiz files:

1. **Math Basics Quiz** (`math-basics-quiz.md`)
   - 5 questions on arithmetic, algebra, geometry
   - Mix of multiple-choice and complex questions

2. **Web Development Quiz** (`web-development-quiz.md`)
   - 7 questions on HTML, CSS, JavaScript, React
   - Includes LaTeX in one question

3. **General Knowledge Quiz** (`general-knowledge-quiz.md`)
   - 9 questions on programming concepts
   - Covers data structures, algorithms, system design

### 5. **Seed Script**
**File:** `scripts/seed-standalone-quizzes.js`

Populate your database with sample quizzes:
```bash
node scripts/seed-standalone-quizzes.js
```

---

## 📝 How to Use

### Creating a Standalone Quiz via API

```javascript
const response = await fetch('/api/admin/quiz/create-standalone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Practice Quiz',
    description: 'Test your knowledge',
    timeLimit: 30,  // minutes
    maxAttempts: 3,
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'What is 2 + 2?',
        options: ['1', '2', '3', '4', '5'],
        correctAnswer: 4
      }
    ]
  })
});
```

### Getting All Standalone Quizzes

```javascript
const response = await fetch('/api/quiz/standalone');
const { quizzes } = await response.json();
```

### Quiz Format

Questions use your existing markdown format:

```markdown
## Question 1

What is the capital of France?

**Type:** multiple-choice
**Correct Answer:** 2

**Options:**
1. London
2. Paris
3. Berlin
```

### Supported Question Types

- **multiple-choice** - Single correct answer
- **complex** - Multiple correct answers (use **Correct Answers:** 1, 3, 5)
- **text** - Free text input (exact match)
- **number** - Numeric input (with tolerance)

---

## 🧪 Sample Quiz Structure

Each sample quiz includes:

- Descriptive questions
- Mix of question types
- LaTeX math support (where applicable)
- Proper answer formatting
- Complex multiple-choice with penalty scoring

### Example from Math Basics Quiz:

```markdown
## Question 2

Which of the following are prime numbers?

**Type:** complex
**Correct Answers:** 1, 3, 5

**Options:**
1. 2
2. 4
3. 7
4. 8
5. 11
```

This uses **penalty-based scoring**:
- Correct answer: +1/3 points
- Wrong answer: -1/3 points
- Minimum score: 0

---

## 🎯 Next Steps

### 1. Apply Database Changes
```bash
npx prisma db push
# or
npx prisma migrate dev --name add_standalone_quizzes
```

### 2. Seed Sample Quizzes
```bash
node scripts/seed-standalone-quizzes.js
```

### 3. Create UI for Standalone Quizzes

You'll need to create:

**For Students:**
- `/quizzes/standalone` - List all standalone quizzes
- `/quizzes/standalone/[id]` - Take quiz page

**For Admins:**
- Import interface for standalone quizzes
- Management page for standalone quizzes

### 4. Optional: Update Navigation

Add a "Practice Quizzes" or "Try Out Quizzes" link in your navigation menu.

---

## 📊 Database Structure

```
Quiz
├── id
├── courseId (nullable) ← NEW: Can be null for standalone
├── title
├── questions (JSON)
├── settings (JSON)
└── createdAt

QuizAttempt (no changes)
├── id
├── userId
├── quizId
├── answers
├── score
└── ...
```

---

## 🚀 Features

### What Works Now:
- ✅ Database supports standalone quizzes
- ✅ API endpoints for CRUD operations
- ✅ Sample quiz content (3 complete quizzes)
- ✅ Existing quiz submission works for both types
- ✅ Complex multiple-choice scoring
- ✅ LaTeX support in questions

### What You Need to Build:
- UI for browsing standalone quizzes
- UI for taking standalone quizzes
- Admin interface for managing standalone quizzes
- Navigation/menu integration

---

## 💡 Tips

1. **Testing:** Use the seed script to populate sample data quickly**
2. **Import System:** Modify the existing quiz import to support standalone mode
3. **Student View:** Reuse existing quiz-taking components
4. **Filtering:** Add `?courseId=null` filters to distinguish standalone quizzes

---

## 🔧 Files Modified

```
prisma/schema.prisma              # Made courseId nullable
src/lib/quizzes.ts                # Added standalone functions
src/pages/api/admin/quiz/
  └── create-standalone.ts        # NEW: Create standalone quiz
src/pages/api/quiz/
  └── standalone.ts               # NEW: Get all standalone
sample-quizzes/
  ├── math-basics-quiz.md         # NEW: Sample 1
  ├── web-development-quiz.md     # NEW: Sample 2
  ├── general-knowledge-quiz.md    # NEW: Sample 3
  └── README.md                    # NEW: Documentation
scripts/
  └── seed-standalone-quizzes.js   # NEW: Seed script
```

---

## ✅ All Set!

Your standalone quiz system is ready. The infrastructure is in place:
- Database supports it
- API endpoints work
- Sample content included
- Seed script ready

Just build the UI to connect it all together! 🎉

