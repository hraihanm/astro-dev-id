# Quizzes Folder Documentation

## Overview

The `src/pages/quizzes/` directory contains the complete quiz system for the application, handling standalone practice quizzes that users can take without being enrolled in a course. This is a comprehensive assessment platform with features like timed exams, attempt limits, progress tracking, and detailed results.

## File Structure

```
src/pages/quizzes/
├── index.astro              # Main quiz listing page
├── history.astro            # User's quiz attempt history
├── [id].astro              # Quiz details and landing page
└── [id]/
    ├── start.astro         # Active quiz taking interface
    ├── results.astro       # Quiz completion results
    └── review/
        └── [attemptId].astro  # Detailed review of specific attempt
```

## Core Pages

### 1. `index.astro` - Quiz Listing

**Purpose**: Displays all available standalone quizzes that users can take.

**Key Features**:
- Shows quiz cards with metadata (question count, time limit, attempt limits)
- Differentiates between practice quizzes and tryout exams
- Displays user's attempt counts and remaining attempts
- Handles attempt limit enforcement (locks quizzes when limit reached)
- Responsive grid layout with filtering capabilities

**Data Flow**:
1. Fetches standalone quizzes via `getStandaloneQuizzes()`
2. Gets user's attempt counts from database
3. Parses quiz settings and questions
4. Renders quiz cards with appropriate status indicators

**Authentication**: Optional - works for both logged-in and guest users

### 2. `[id].astro` - Quiz Details/Landing

**Purpose**: Shows detailed information about a specific quiz before starting.

**Key Features**:
- Comprehensive quiz information display
- Attempt limit checking and enforcement
- Access scheduling (availableFrom/until dates)
- Progress restoration for incomplete attempts
- Support for both multiple-choice and essay quizzes
- Multilingual interface (Indonesian)

**Security Checks**:
- Validates user access based on classroom membership
- Enforces attempt limits before allowing start
- Checks quiz availability scheduling
- Validates quiz existence and format

**Client Features**:
- LocalStorage-based progress detection
- Automatic "Continue Quiz" button for in-progress attempts

### 3. `history.astro` - Attempt History

**Purpose**: Comprehensive dashboard of all user's quiz attempts.

**Key Features**:
- Statistics overview (total attempts, pending scores, average score)
- Grouping and sorting options (by quiz, month, date, score)
- Interactive attempt cards with review links
- Attempt deletion functionality
- Score release status tracking
- Responsive grid layout

**Data Processing**:
- Groups attempts by quiz for organized display
- Calculates statistics and averages
- Handles both released and pending scores
- Formats time spent and completion dates

**Client Interactions**:
- Dynamic grouping and sorting
- Delete attempt confirmations
- Real-time UI updates

### 4. `[id]/start.astro` - Active Quiz Interface

**Purpose**: The main quiz-taking interface with timer, questions, and submission.

**Key Features**:
- Real-time countdown timer with pause/resume
- Question navigation with progress indicators
- "Ragu-Ragu" (doubt) flagging system
- Auto-save functionality to prevent data loss
- Support for multiple question types (multiple choice, essay)
- Keyboard navigation support
- Responsive design for mobile/desktop

**Technical Implementation**:
- WebSocket-like progress saving to localStorage
- Client-side timer management
- Dynamic question rendering with LaTeX support
- Secure answer handling (no correct answers exposed)

**Security**:
- Sanitized quiz data (no solutions/answers sent to client)
- Server-side validation on submission
- Attempt tracking and limit enforcement

### 5. `[id]/results.astro` - Quiz Results

**Purpose**: Immediate feedback after quiz completion.

**Key Features**:
- Score display with percentage and grade
- Question-by-question breakdown
- Time spent statistics
- Comparison with previous attempts
- Navigation to review or history

**Data Flow**:
- Receives score data from quiz submission
- Fetches complete attempt details
- Calculates statistics and comparisons
- Renders comprehensive results page

### 6. `[id]/review/[attemptId].astro` - Detailed Review

**Purpose**: In-depth review of a specific quiz attempt.

**Key Features**:
- Complete question and answer review
- Correct answer display (if score released)
- Detailed explanations and feedback
- Performance analytics
- Printable format support

**Access Control**:
- Validates user ownership of attempt
- Respects score release timing
- Handles different quiz types appropriately

## Data Models and Relationships

### Quiz Model
```typescript
interface Quiz {
  id: number;
  title: string;
  questions: Question[] | EssayProblemSet;
  settings: QuizSettings;
  quizType: 'latihan' | 'tryout' | 'exam';
  attemptLimit?: number;
  availableFrom?: Date;
  availableUntil?: Date;
  courseId?: number; // null for standalone quizzes
}
```

### QuizAttempt Model
```typescript
interface QuizAttempt {
  id: number;
  userId: number;
  quizId: number;
  answers: Record<string, any>;
  percentage?: number;
  correctAnswers?: number;
  timeSpent?: number;
  completedAt: Date;
  scoreReleasedAt?: Date;
}
```

## Key Libraries and Dependencies

### Core Dependencies
- **Astro**: Framework for server-side rendering
- **Prisma**: Database ORM for quiz and attempt data
- **TailwindCSS**: Styling and responsive design

### Specialized Libraries
- **KaTeX/LaTeX**: Mathematical expression rendering
- **Markdown-it**: Content rendering for descriptions
- **LocalStorage API**: Client-side progress persistence

## Authentication and Authorization

### Access Control
- **Guest Users**: Can view quiz listings, but need to sign in to take quizzes
- **Logged-in Users**: Full access based on classroom memberships
- **Admin Users**: Can access all quizzes regardless of classroom

### Security Measures
- Server-side validation of all quiz access
- Attempt limit enforcement before quiz start
- Score release timing control
- Answer encryption in database

## State Management

### Client-side State
- Quiz progress in localStorage
- Timer state management
- Question navigation state
- Flagged questions tracking

### Server-side State
- Attempt tracking in database
- Score calculation and storage
- User session management
- Quiz availability scheduling

## API Integration

### Internal APIs
- `/api/quiz/submit` - Quiz submission endpoint
- `/api/quiz/attempt/{id}/delete` - Attempt deletion
- `getQuiz()` - Quiz data retrieval
- `getQuizResults()` - Results calculation

### Data Flow
1. Client fetches quiz data via Astro props
2. Progress saved to localStorage periodically
3. Final submission via API endpoint
4. Results fetched and displayed

## Performance Considerations

### Optimization Strategies
- Lazy loading of quiz questions
- Efficient database queries with proper indexing
- Minimal client-side data transfer
- Responsive image loading

### Caching
- Quiz metadata cached on server
- Static assets served via CDN
- Client-side caching of quiz data

## Accessibility Features

### WCAG Compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

### Internationalization
- Indonesian language support
- Localized date/time formatting
- RTL language preparation

## Testing Strategy

### Unit Tests
- Quiz data parsing logic
- Score calculation algorithms
- Timer functionality
- Progress saving/loading

### Integration Tests
- Complete quiz flow end-to-end
- API endpoint testing
- Database integration
- Authentication flows

## Deployment Considerations

### Environment Variables
- Database connection strings
- API endpoint configurations
- File upload settings

### Scaling
- Database connection pooling
- Load balancing for quiz submissions
- CDN for static assets

## Future Enhancements

### Planned Features
- Real-time collaboration for group quizzes
- Advanced analytics dashboard
- Mobile app integration
- AI-powered question generation

### Technical Improvements
- WebSocket implementation for real-time updates
- Progressive Web App (PWA) features
- Offline quiz taking capability

## Troubleshooting Guide

### Common Issues
1. **Quiz not loading**: Check database connection and quiz ID validity
2. **Timer not working**: Verify JavaScript execution and browser compatibility
3. **Progress not saving**: Check localStorage availability and quota
4. **Score calculation errors**: Validate quiz data format and answer structure

### Debugging Tools
- Browser developer tools for client-side issues
- Database query logs for server-side problems
- Network tab for API debugging
- Console logging for state tracking

## Best Practices

### Code Organization
- Separation of concerns between UI and logic
- Reusable components for quiz elements
- Consistent naming conventions
- Proper error handling

### Security
- Input sanitization
- SQL injection prevention
- XSS protection
- Secure session management

### Performance
- Efficient database queries
- Minimal client-side processing
- Optimized asset delivery
- Proper caching strategies

This documentation provides a comprehensive understanding of the quiz system architecture, implementation details, and operational considerations for developers working with the quizzes folder.
