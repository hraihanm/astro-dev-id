# Quiz System and User Profile Features

This document describes the newly implemented quiz system and user profile management features.

## 🎯 Quiz System Features

### For Students

1. **Quiz Taking Interface**
   - Clean, intuitive interface with LaTeX support
   - Built-in timer functionality
   - Multiple question types:
     - Multiple choice
     - Multiple select
     - Text answer
     - Numeric answer
   - Real-time answer tracking
   - Auto-submit on time expiration

2. **Quiz Results**
   - Detailed score breakdown
   - Question-by-question review
   - Comparison of user answers vs. correct answers
   - Performance metrics (percentage, time spent)
   - Pass/fail indication
   - Option to retake quizzes

3. **Progress Tracking**
   - View quiz history
   - Track performance over time
   - See average scores
   - Best score tracking

### For Admins/Instructors

1. **Quiz Creation**
   - Intuitive quiz builder
   - Support for LaTeX in questions
   - Multiple question types
   - Configurable settings:
     - Time limits
     - Maximum attempts
     - Passing score
   - Dynamic question management (add/remove)

2. **Quiz Management**
   - View all quizzes
   - Edit existing quizzes
   - Link quizzes to courses
   - Track quiz attempts
   - View analytics

## 👤 User Profile Features

### Personal Information

- Profile editing
- First name and last name
- Bio/description
- Avatar support (placeholder ready)

### Learning Preferences

- Learning goals selection
- Skill level (beginner/intermediate/advanced)
- Timezone preferences
- Language preferences

### Progress Dashboard

1. **Statistics**
   - Total quiz attempts
   - Average score
   - Best score
   - Courses completed

2. **Achievements**
   - First Steps (complete first quiz)
   - Quiz Master (complete 10 quizzes)
   - Excellent Student (90%+ average)
   - Course Explorer (complete 3 courses)

3. **Recent Activity**
   - Timeline of quiz attempts
   - Performance indicators
   - Quick access to courses

## 📊 Database Schema

### New Models

**QuizAttempt**
```prisma
model QuizAttempt {
  id              Int      @id @default(autoincrement())
  userId          Int
  quizId          Int
  answers         String   // JSON
  score           Int
  totalQuestions  Int
  correctAnswers  Int
  percentage      Int
  timeSpent       Int      // in seconds
  detailedResults String   // JSON
  completedAt     DateTime @default(now())
}
```

**Profile**
```prisma
model Profile {
  id            Int      @id @default(autoincrement())
  userId        Int      @unique
  firstName     String?
  lastName      String?
  bio           String?
  avatar        String?
  preferences   String?  // JSON
  learningGoals String?  // JSON array
  timezone      String?
  language      String?
}
```

## 🔌 API Endpoints

### Quiz APIs

- `POST /api/quiz/submit` - Submit quiz answers
  - Calculates score automatically
  - Saves attempt to database
  - Returns detailed results

- `POST /api/admin/quiz/create` - Create new quiz (admin only)
  - Validates questions
  - Stores quiz settings
  - Links to course

### Profile APIs

- `POST /api/profile/update` - Update user profile
  - Updates personal information
  - Saves learning preferences
  - Returns success confirmation

## 📁 File Structure

```
src/
├── lib/
│   ├── quizzes.ts          # Quiz data operations
│   ├── scoring.ts          # Quiz scoring logic
│   └── profile.ts          # Profile management
├── pages/
│   ├── api/
│   │   ├── quiz/
│   │   │   └── submit.ts   # Quiz submission
│   │   ├── admin/quiz/
│   │   │   └── create.ts   # Quiz creation
│   │   └── profile/
│   │       └── update.ts   # Profile update
│   └── profile/
│       ├── index.astro     # Profile view
│       └── edit.astro      # Profile edit
```

## 🎨 UI Components

### Quiz Interface

- Timer display
- Question counter
- Progress indicator
- Answer options (radio/checkbox/input)
- Submit button with confirmation

### Results Page

- Score visualization
- Detailed answer review
- Color-coded feedback (green/red)
- Navigation to retake or return to course

### Profile Dashboard

- Avatar/initial display
- Stats cards
- Achievement badges
- Activity timeline

## 🚀 Usage Examples

### Taking a Quiz

1. Navigate to course page
2. Click "Take Quiz" button
3. Answer questions
4. Submit before time expires
5. View detailed results
6. Optionally retake

### Creating a Quiz (Admin)

1. Go to admin dashboard
2. Select course
3. Click "Create Quiz"
4. Add questions with LaTeX support
5. Set time limit and settings
6. Save quiz

### Managing Profile

1. Go to profile page
2. Click "Edit Profile"
3. Update personal information
4. Select learning goals
5. Set preferences
6. Save changes

## 🔒 Security Notes

- Quiz answers are validated server-side
- Scoring happens on the backend
- User authentication required for all operations
- Admin-only endpoints for quiz creation

## 📈 Future Enhancements

Potential improvements:
- Quiz analytics dashboard
- Leaderboards
- Collaborative quizzes
- Question bank system
- Randomized question order
- Explanation/hints for questions
- Certificate generation
- Social features (share achievements)

## 🐛 Known Limitations

Current limitations:
- No real-time session management (uses cookies)
- Limited achievement types
- No email notifications
- No quiz categories/tags
- No question difficulty levels

## 📝 Notes for Developers

- Quiz questions support full LaTeX syntax
- Scoring is flexible and extensible
- Profile data stored as JSON for flexibility
- All timestamps in UTC
- Database uses SQLite (portable)

---

**Implementation Date**: October 24, 2025
**Features**: Quiz System, User Profiles, Progress Tracking, Achievements
**Status**: ✅ Fully Implemented and Functional

