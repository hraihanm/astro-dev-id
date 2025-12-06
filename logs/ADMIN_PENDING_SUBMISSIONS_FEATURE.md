# Admin Dashboard - Pending Submissions Feature
20251205

## Overview

The **Pending Submissions** feature on the Admin Dashboard provides administrators with a quick overview of tryout quizzes that have submissions waiting for score release. This feature helps admins efficiently manage and review quiz submissions that require manual approval before scores are released to students.

## Feature Description

### What It Does

The feature displays a dedicated section on the Admin Dashboard (`/admin`) that shows:
- All tryout quizzes with pending submissions
- The number of pending submissions for each quiz
- Quick access links to the submission review panel for each quiz

### When It Appears

The "Try Out Menunggu Pelepasan" (Tryout Quizzes Awaiting Release) section appears on the admin dashboard when:
- There are tryout quizzes in the system
- At least one of those tryout quizzes has pending submissions (submissions where `scoreReleasedAt` is `null`)

### Visual Design

- **Location**: Between the stats overview cards and the recent activity section
- **Styling**: Amber/yellow color scheme to indicate pending items requiring attention
- **Layout**: Card-based design with hover effects for better UX
- **Badge**: Shows the count of pending submissions in an amber badge

## User Guide

### For Administrators

1. **Accessing the Feature**
   - Navigate to `/admin` (Admin Dashboard)
   - The pending submissions section appears automatically if there are pending items

2. **Viewing Pending Submissions**
   - Each quiz card shows:
     - Quiz title
     - Number of pending submissions
     - Visual badge with the count
   - Cards are clickable and navigate to the quiz's submission panel

3. **Reviewing Submissions**
   - Click on any quiz card to go to `/admin/quizzes/{quizId}/submissions`
   - Review individual submissions
   - Release scores individually or in bulk

4. **Navigation**
   - "Lihat Semua →" link navigates to `/admin/quizzes` for full quiz management

## Technical Implementation

### Database Schema

The feature relies on the `QuizAttempt` model in Prisma:

```prisma
model QuizAttempt {
  id              Int       @id @default(autoincrement())
  userId          Int
  quizId          Int
  score           Int
  // ... other fields
  scoreReleasedAt DateTime? // null = not released yet, DateTime = when admin released it
  // ... relations
}
```

**Key Field**: `scoreReleasedAt`
- `null`: Submission is pending (score not released)
- `DateTime`: Score has been released (timestamp of release)

### Code Location

**File**: `src/pages/admin/index.astro`

**Key Code Section** (lines 24-46):

```typescript
if (tryoutQuizzes.length > 0) {
  const quizIds = tryoutQuizzes.map(q => q.id);
  const allAttempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: { in: quizIds }
    }
  });
  
  // Filter for pending attempts (scoreReleasedAt is null) and group by quizId
  const pendingAttempts = allAttempts.filter(a => !(a as any).scoreReleasedAt);
  const pendingCountsByQuizId = pendingAttempts.reduce((acc, attempt) => {
    acc[attempt.quizId] = (acc[attempt.quizId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  tryoutQuizzesWithPending = tryoutQuizzes
    .filter(quiz => pendingCountsByQuizId[quiz.id] && pendingCountsByQuizId[quiz.id] > 0)
    .map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      pendingCount: pendingCountsByQuizId[quiz.id] || 0
    }));
}
```

### Implementation Details

#### 1. Quiz Filtering
- Filters all quizzes to get only tryout quizzes (`quizType === 'tryout'`)
- Uses `getAllQuizzes()` helper function

#### 2. Data Fetching Strategy
- **Approach**: Fetches all attempts for tryout quizzes, then filters in JavaScript
- **Reason**: TypeScript type definitions for Prisma don't properly recognize `scoreReleasedAt` in `where` clauses for `groupBy` operations
- **Workaround**: Use `findMany` and filter in JavaScript with type assertion `(a as any).scoreReleasedAt`

#### 3. Aggregation Logic
- Groups pending attempts by `quizId`
- Counts submissions per quiz
- Only includes quizzes with at least one pending submission

#### 4. Type Safety
- Uses type assertion `(a as any).scoreReleasedAt` to access the field
- The field exists in the database schema but TypeScript types may be out of sync
- Runtime behavior is correct; this is purely a type definition issue

### Data Flow

```
1. Get all quizzes → Filter tryout quizzes
2. Extract quiz IDs
3. Fetch all quiz attempts for those IDs
4. Filter attempts where scoreReleasedAt is null
5. Group by quizId and count
6. Map to display format with quiz title and pending count
7. Render in UI
```

## Related Features

### Quiz Score Release System

This feature is part of a larger score release workflow:

1. **Quiz Configuration**
   - Quizzes can have `scoreReleaseMode` set to:
     - `"immediate"`: Scores released automatically
     - `"admin"`: Scores require admin approval

2. **Submission Review**
   - Admins review submissions at `/admin/quizzes/{quizId}/submissions`
   - Can release scores individually or in bulk

3. **Score Release**
   - Individual: `/api/admin/quiz/attempt/{id}/release`
   - Bulk: `/api/admin/quiz/{id}/release-all`

### Related Files

- `src/pages/admin/quizzes/index.astro` - Quiz management page
- `src/pages/admin/quizzes/[id]/submissions.astro` - Submission review panel
- `src/pages/api/admin/quiz/attempt/[id]/release.ts` - Individual release API
- `src/pages/api/admin/quiz/[id]/release-all.ts` - Bulk release API
- `src/lib/quizzes.ts` - Quiz helper functions

## Troubleshooting

### Issue: Pending submissions not showing

**Possible Causes:**
1. No tryout quizzes exist
2. All submissions have been released
3. Database connection issues

**Solution:**
- Verify tryout quizzes exist: Check `/admin/quizzes`
- Check database: Verify `QuizAttempt` records have `scoreReleasedAt = null`
- Check console for errors

### Issue: TypeScript errors

**Error**: `Property 'scoreReleasedAt' does not exist`

**Cause**: Prisma client types may be out of sync with schema

**Solution:**
1. Regenerate Prisma client: `npx prisma generate`
2. If error persists, the type assertion `(a as any).scoreReleasedAt` is already in place as a workaround
3. The code works correctly at runtime despite the type error

### Issue: Count mismatch

**Possible Causes:**
1. Data was modified between page load and display
2. Race condition in data fetching

**Solution:**
- Refresh the page
- Check database directly for accurate counts
- Verify the filter logic is correct

## Performance Considerations

### Current Implementation
- Fetches all attempts for tryout quizzes
- Filters in memory (JavaScript)
- Groups and counts in memory

### Optimization Opportunities
- If the number of attempts becomes very large, consider:
  - Adding database indexes on `quizId` and `scoreReleasedAt`
  - Using raw SQL queries for aggregation
  - Implementing pagination or limiting to recent attempts

### Database Indexes

Recommended indexes for optimal performance:

```prisma
model QuizAttempt {
  // ... fields
  
  @@index([quizId, scoreReleasedAt])
  @@index([quizId])
}
```

## Future Enhancements

### Potential Improvements

1. **Real-time Updates**
   - WebSocket or polling for live count updates
   - Notification system for new submissions

2. **Filtering Options**
   - Filter by date range
   - Filter by quiz type
   - Sort by pending count or date

3. **Bulk Actions**
   - Release all scores from dashboard
   - Mark for review
   - Export pending submissions list

4. **Statistics**
   - Average time to release
   - Pending submissions trend
   - Admin workload metrics

5. **Notifications**
   - Email alerts for new submissions
   - Dashboard badge count
   - Priority queue for urgent reviews

## Testing

### Manual Testing Checklist

- [ ] Create a tryout quiz
- [ ] Submit quiz as a student
- [ ] Verify pending submission appears on admin dashboard
- [ ] Click quiz card to navigate to submissions panel
- [ ] Release score and verify it disappears from pending list
- [ ] Test with multiple quizzes and submissions
- [ ] Verify count accuracy
- [ ] Test with no pending submissions (section should not appear)

### Edge Cases

- Empty state (no pending submissions)
- Multiple quizzes with varying pending counts
- Very large numbers of pending submissions
- Concurrent score releases

## Changelog

### Initial Implementation
- Feature added to admin dashboard
- Displays tryout quizzes with pending submissions
- Shows count of pending submissions per quiz
- Links to submission review panel

### Bug Fixes
- Fixed TypeScript type errors with `scoreReleasedAt` field
- Changed from `groupBy` to `findMany` + JavaScript filtering
- Added type assertion workaround for Prisma type definitions

## Support

For issues or questions about this feature:
1. Check this documentation
2. Review related code in `src/pages/admin/index.astro`
3. Check Prisma schema in `prisma/schema.prisma`
4. Review related API endpoints for score release functionality
