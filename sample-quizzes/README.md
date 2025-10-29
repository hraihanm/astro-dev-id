# Standalone Quiz Samples

This directory contains sample standalone quiz files that you can use for "try out" practice quizzes.

## Available Quizzes

### 1. Math Basics Quiz
**File:** `math-basics-quiz.md`  
**Topics:** Basic arithmetic, order of operations, prime numbers, algebra, geometry  
**Questions:** 5

### 2. Web Development Quiz
**File:** `web-development-quiz.md`  
**Topics:** HTML, CSS, JavaScript, React, HTTP, web development  
**Questions:** 7

### 3. General Knowledge Quiz
**File:** `general-knowledge-quiz.md`  
**Topics:** Programming concepts, data structures, algorithms, system design  
**Questions:** 9

## How to Use

### Option 1: Import via Admin UI
1. Go to `/admin/courses/[id]/edit` for a course
2. Use the quiz import feature
3. Select a quiz file from this directory
4. **Note:** Modify the import API to allow `courseId: null` for standalone quizzes

### Option 2: Use the Seed Script
```bash
node scripts/seed-standalone-quizzes.js
```

This will create all three sample quizzes in your database as standalone quizzes.

### Option 3: Programmatic Creation
Use the API endpoint `/api/admin/quiz/create-standalone` to create quizzes programmatically.

## Quiz Format

All quizzes follow the markdown format:

```markdown
## Question 1

Question text here...

**Type:** multiple-choice
**Correct Answer:** 2

**Options:**
1. Option 1
2. Option 2 (correct)
3. Option 3
```

### Question Types

- **multiple-choice:** Single correct answer
- **complex:** Multiple correct answers (use **Correct Answers:** 1, 3, 5)
- **text:** Free text input
- **number:** Numeric input (with **Tolerance:** 0.5)

### LaTeX Support

Use `$inline$` for inline math and `$$block$$` for display math.

## Database Setup

The schema now supports standalone quizzes:

```prisma
model Quiz {
  courseId  Int?  // Nullable for standalone quizzes
  // ...
}
```

After schema changes, run:
```bash
npx prisma migrate dev
npx prisma generate
```

## API Endpoints

- `GET /api/quiz/standalone` - Get all standalone quizzes
- `POST /api/admin/quiz/create-standalone` - Create a standalone quiz
- `POST /api/quiz/submit` - Submit quiz answers (works for both types)

