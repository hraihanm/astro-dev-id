# Getting Started with My Learning Portal

This guide will help you set up and run your learning portal from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of terminal/command line

## Step-by-Step Setup

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including Astro, Prisma, Tailwind CSS, and more.

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# On Windows
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

Or manually create a `.env` file with:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change-this-to-a-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

**Important**: Change `NEXTAUTH_SECRET` to a random string for security.

### 3. Initialize the Database

Run the following command to create your database:

```bash
npm run db:push
```

This creates a SQLite database file (`dev.db`) with all necessary tables.

### 4. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps After Installation

### Create Your First Admin Account

1. Navigate to [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. Create an account with your email and password
3. Open Prisma Studio to make yourself an admin:

```bash
npm run db:studio
```

4. In Prisma Studio:
   - Click on "User" table
   - Find your user
   - Change the `role` field from "student" to "admin"
   - Click "Save 1 change"

### Create Your First Course

1. Sign in at [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)
2. Go to [http://localhost:3000/admin/courses](http://localhost:3000/admin/courses)
3. Click "Create New Course"
4. Fill in:
   - **Title**: "Introduction to Mathematics"
   - **Slug**: "intro-math" (URL-friendly, no spaces)
   - **Description**: Brief description of the course
   - **Chapters**: Add chapter titles (you can edit content later)
5. Click "Create Course"

### Add Content to Chapters

Currently, you need to edit chapter content directly in the database:

1. Open Prisma Studio: `npm run db:studio`
2. Go to "Chapter" table
3. Click on a chapter
4. Add content in the `content` field using Markdown and LaTeX:

Example content:
```markdown
# Introduction to Algebra

Algebra is the study of mathematical symbols and the rules for manipulating these symbols.

## Basic Equations

A simple equation: $ax + b = c$

We can solve for $x$:

$$
x = \frac{c - b}{a}
$$

## Practice Problems

1. Solve for x: $2x + 5 = 13$
2. Solve for y: $3y - 7 = 20$
```

5. Save the changes

### Create Your First Quiz

Quizzes are a powerful way to test student knowledge:

1. Navigate to your course in the admin dashboard
2. Click "Create Quiz" (currently via direct database entry)
3. Open Prisma Studio: `npm run db:studio`
4. Go to "Quiz" table and create a new quiz
5. Add questions in JSON format:

```json
[
  {
    "type": "multiple-choice",
    "text": "What is $2 + 2$?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": 1
  },
  {
    "type": "text",
    "text": "What is the capital of France?",
    "correctAnswer": "Paris"
  }
]
```

### View Your Course as a Student

1. Navigate to [http://localhost:3000/courses](http://localhost:3000/courses)
2. Click on your course
3. Browse through chapters
4. Take quizzes and view results

### Manage Your Profile

1. Navigate to [http://localhost:3000/profile](http://localhost:3000/profile)
2. View your learning statistics
3. Click "Edit Profile" to customize your profile
4. Set learning goals and preferences
5. Track achievements and progress

## Common Tasks

### Managing Users

Visit [http://localhost:3000/admin/users](http://localhost:3000/admin/users) to see all registered users.

### Viewing Admin Dashboard

Visit [http://localhost:3000/admin](http://localhost:3000/admin) for statistics and recent activity.

### Taking Quizzes

1. Browse to a course that has quizzes
2. Click "Take Quiz"
3. Answer questions (supports LaTeX rendering)
4. Submit before timer expires
5. View detailed results with correct/incorrect answers
6. Retake if needed

### Tracking Progress

1. Visit your profile at [http://localhost:3000/profile](http://localhost:3000/profile)
2. View statistics:
   - Total quiz attempts
   - Average score
   - Courses completed
3. Earn achievements by:
   - Completing your first quiz (First Steps)
   - Completing 10 quizzes (Quiz Master)
   - Maintaining 90%+ average (Excellent Student)
   - Completing 3 courses (Course Explorer)
4. Review recent activity timeline

### Backup Your Data

Your database is stored in `dev.db`. To backup:

```bash
# On Windows
copy dev.db dev.backup.db

# On Mac/Linux
cp dev.db dev.backup.db
```

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

Run:
```bash
npm run db:generate
npm run dev
```

### Error: "Database not found"

Run:
```bash
npm run db:push
```

### Port 3000 already in use

Change the port in `astro.config.mjs`:
```js
server: {
  port: 3001  // Change to any available port
}
```

### LaTeX not rendering

Make sure the KaTeX CSS is loaded. Check your browser's network tab to ensure:
`https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css` is loaded.

## Next Steps

- **Customize Design**: Edit Tailwind classes in components
- **Add Quizzes**: Extend the quiz functionality
- **Deploy**: Follow deployment guide in README.md
- **Add Features**: Content editor, file uploads, progress tracking

## Need Help?

- Check the main README.md for detailed documentation
- Review Prisma Studio to understand the database structure
- Look at example pages in `src/pages/` for reference

---

**You're all set!** Start creating amazing educational content! 📚

